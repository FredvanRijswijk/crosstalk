import { WebSocketServer, WebSocket, type RawData } from "ws";
import { createServer } from "http";

const PORT = parseInt(process.env.WS_PORT || "8080");
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_WS_URL = "wss://api.mistral.ai/v1/audio/transcriptions/realtime";
const MODEL = "voxtral-mini-transcribe-realtime-2602";
const TARGET_DELAY_MS = 240; // sub-200ms not always stable, 240 is sweet spot

const httpServer = createServer((_req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  });
  res.end(`{"status":"ok","model":"${MODEL}"}`);
});

// Disable per-message compression — adds CPU latency per frame, not worth it for small audio packets
const wss = new WebSocketServer({
  server: httpServer,
  perMessageDeflate: false,
  maxPayload: 512 * 1024, // 512KB max per message
});

wss.on("connection", (clientWs) => {
  console.log("[client] connected");

  let mistralWs: WebSocket | null = null;
  let sessionReady = false;
  let audioQueue: Buffer[] = []; // buffer audio before session is ready
  let draining = false;

  const url = `${MISTRAL_WS_URL}?model=${MODEL}`;
  mistralWs = new WebSocket(url, {
    headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
    perMessageDeflate: false,
  });

  // Flush queued audio once session is ready
  function drainQueue() {
    if (draining || !mistralWs || mistralWs.readyState !== WebSocket.OPEN) return;
    draining = true;
    for (const buf of audioQueue) {
      sendAudio(buf);
    }
    audioQueue = [];
    draining = false;
  }

  // Send PCM buffer to Mistral as base64 JSON (their required protocol)
  function sendAudio(pcmBuffer: Buffer) {
    if (!mistralWs || mistralWs.readyState !== WebSocket.OPEN) return;
    // Pre-build JSON string with template to avoid JSON.stringify overhead
    const b64 = pcmBuffer.toString("base64");
    mistralWs.send(`{"type":"input_audio.append","audio":"${b64}"}`);
  }

  // Forward Mistral events to client with minimal overhead
  mistralWs.on("message", (raw: RawData) => {
    if (clientWs.readyState !== WebSocket.OPEN) return;

    const text = raw.toString();
    // Fast type extraction without full JSON parse for forwarding
    const typeMatch = text.match(/"type"\s*:\s*"([^"]+)"/);
    if (!typeMatch) return;
    const type = typeMatch[1];

    // Log all event types for debugging
    if (type !== "transcription.text.delta") {
      console.log("[mistral] event:", type, text.slice(0, 200));
    }

    switch (type) {
      case "session.created": {
        sessionReady = true;
        console.log("[mistral] session created");
        clientWs.send('{"type":"session.created"}');

        // Configure audio format + low latency
        mistralWs?.send(JSON.stringify({
          type: "session.update",
          session: {
            audio_format: { encoding: "pcm_s16le", sample_rate: 16000 },
            target_streaming_delay_ms: TARGET_DELAY_MS,
          },
        }));

        // Drain any audio that arrived during handshake
        drainQueue();
        break;
      }
      case "transcription.text.delta": {
        // Extract text field fast
        const textMatch = text.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const t = textMatch ? textMatch[1] : "";
        clientWs.send(`{"type":"text_delta","text":"${t}"}`);
        break;
      }
      case "transcription.language": {
        const langMatch = text.match(/"language"\s*:\s*"([^"]+)"/);
        const lang = langMatch ? langMatch[1] : "unknown";
        console.log("[mistral] language:", lang);
        clientWs.send(`{"type":"language","language":"${lang}"}`);
        break;
      }
      case "transcription.segment": {
        // Forward full segment including language for speaker detection
        try {
          const event = JSON.parse(text);
          console.log("[mistral] segment lang:", event.language, "text:", (event.text || "").slice(0, 50));
          clientWs.send(JSON.stringify({
            type: "segment",
            text: event.text || "",
            language: event.language || "",
            start: event.start,
            end: event.end,
          }));
        } catch {
          clientWs.send(`{"type":"segment","text":""}`);
        }
        break;
      }
      case "transcription.done":
        console.log("[mistral] done");
        clientWs.send('{"type":"done"}');
        break;
      case "error": {
        console.error("[mistral] error:", text);
        clientWs.send(`{"type":"error","error":"Mistral error"}`);
        break;
      }
      case "session.updated":
        console.log("[mistral] session updated, delay:", TARGET_DELAY_MS, "ms");
        break;
    }
  });

  mistralWs.on("error", (err) => {
    console.error("[mistral] ws error:", err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(`{"type":"error","error":"Connection error"}`);
    }
  });

  mistralWs.on("close", (code, reason) => {
    console.log(`[mistral] closed: ${code} ${reason.toString()}`);
    sessionReady = false;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send('{"type":"done"}');
    }
  });

  // Handle audio from browser — binary PCM frames
  clientWs.on("message", (data: RawData, isBinary: boolean) => {
    if (isBinary) {
      const buf = data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer);

      if (sessionReady) {
        sendAudio(buf);
      } else {
        // Queue audio during Mistral handshake (typically <500ms)
        audioQueue.push(buf);
      }
    } else {
      // Text control messages
      const str = data.toString();
      if (str.includes("flush") && mistralWs?.readyState === WebSocket.OPEN) {
        mistralWs.send('{"type":"input_audio.flush"}');
      } else if (str.includes("end") && mistralWs?.readyState === WebSocket.OPEN) {
        mistralWs.send('{"type":"input_audio.end"}');
      }
    }
  });

  clientWs.on("close", () => {
    console.log("[client] disconnected");
    audioQueue = [];
    if (mistralWs && mistralWs.readyState === WebSocket.OPEN) {
      mistralWs.send('{"type":"input_audio.end"}');
      mistralWs.close();
    }
  });

  clientWs.on("error", (err) => {
    console.error("[client] error:", err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`WS server on ws://localhost:${PORT} | model: ${MODEL} | delay: ${TARGET_DELAY_MS}ms`);
});
