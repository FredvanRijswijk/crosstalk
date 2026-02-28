import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const PORT = parseInt(process.env.WS_PORT || "8080");
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_WS_URL = "wss://api.mistral.ai/v1/audio/transcriptions/realtime";
const MODEL = "voxtral-mini-transcribe-realtime-2602";

const httpServer = createServer((_req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify({ status: "ok", model: MODEL }));
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (clientWs) => {
  console.log("[client] connected");

  let mistralWs: WebSocket | null = null;
  let sessionReady = false;

  // Connect to Mistral realtime API
  const url = `${MISTRAL_WS_URL}?model=${MODEL}`;
  mistralWs = new WebSocket(url, {
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
  });

  mistralWs.on("open", () => {
    console.log("[mistral] connected");
  });

  mistralWs.on("message", (data) => {
    const text = data.toString();
    try {
      const event = JSON.parse(text);
      const type = event.type;

      if (type === "session.created") {
        sessionReady = true;
        console.log("[mistral] session created");
        // Forward to client
        clientWs.send(JSON.stringify({ type: "session.created" }));

        // Update session with audio format
        mistralWs?.send(
          JSON.stringify({
            type: "session.update",
            session: {
              audio_format: {
                encoding: "pcm_s16le",
                sample_rate: 16000,
              },
            },
          })
        );
      } else if (type === "transcription.text.delta") {
        // Stream text deltas to client immediately
        clientWs.send(
          JSON.stringify({
            type: "text_delta",
            text: event.text || "",
          })
        );
      } else if (type === "transcription.language") {
        clientWs.send(
          JSON.stringify({
            type: "language",
            language: event.language || "unknown",
          })
        );
      } else if (type === "transcription.segment") {
        clientWs.send(
          JSON.stringify({
            type: "segment",
            text: event.text || "",
            start: event.start,
            end: event.end,
          })
        );
      } else if (type === "transcription.done") {
        console.log("[mistral] transcription done");
        clientWs.send(JSON.stringify({ type: "done" }));
      } else if (type === "error") {
        console.error("[mistral] error:", event);
        clientWs.send(
          JSON.stringify({ type: "error", error: event.error || "Unknown error" })
        );
      } else if (type === "session.updated") {
        console.log("[mistral] session updated");
      } else {
        console.log("[mistral] unknown event:", type);
      }
    } catch (e) {
      console.error("[mistral] parse error:", e);
    }
  });

  mistralWs.on("error", (err) => {
    console.error("[mistral] ws error:", err.message);
    clientWs.send(
      JSON.stringify({ type: "error", error: `Mistral connection error: ${err.message}` })
    );
  });

  mistralWs.on("close", (code, reason) => {
    console.log(`[mistral] closed: ${code} ${reason.toString()}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "done" }));
    }
  });

  // Handle audio from browser client
  clientWs.on("message", (data) => {
    if (!mistralWs || mistralWs.readyState !== WebSocket.OPEN || !sessionReady) {
      return;
    }

    // Client sends binary PCM audio data
    if (data instanceof Buffer || data instanceof ArrayBuffer) {
      const buffer = data instanceof Buffer ? data : Buffer.from(data);
      const base64Audio = buffer.toString("base64");

      mistralWs.send(
        JSON.stringify({
          type: "input_audio.append",
          audio: base64Audio,
        })
      );
    } else {
      // Text message - could be control commands
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "flush") {
          mistralWs.send(JSON.stringify({ type: "input_audio.flush" }));
        } else if (msg.type === "end") {
          mistralWs.send(JSON.stringify({ type: "input_audio.end" }));
        }
      } catch {
        // ignore
      }
    }
  });

  clientWs.on("close", () => {
    console.log("[client] disconnected");
    if (mistralWs && mistralWs.readyState === WebSocket.OPEN) {
      // Signal end of audio and close
      mistralWs.send(JSON.stringify({ type: "input_audio.end" }));
      mistralWs.close();
    }
  });

  clientWs.on("error", (err) => {
    console.error("[client] error:", err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket transcription server running on ws://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Mistral API key: ${MISTRAL_API_KEY ? "configured" : "MISSING"}`);
});
