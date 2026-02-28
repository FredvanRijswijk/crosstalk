"use client"

import { useState } from "react"
import { useTranscription } from "@/hooks/use-transcription"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, AlertTriangle } from "lucide-react"

export function TranscriptionTest() {
  const {
    isRecording,
    transcription,
    language,
    error,
    startTranscription,
    stopTranscription,
    toggleTranscription
  } = useTranscription()

  return (
    <div className="max-w-md mx-auto p-6 border border-border rounded-lg bg-card">
      <h2 className="text-xl font-bold mb-4">Transcription Test</h2>
      
      <div className="mb-4">
        <Button
          onClick={toggleTranscription}
          disabled={!!error}
          className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Status:</h3>
        <div className="flex items-center gap-2">
          {isRecording ? (
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Recording...</span>
          ) : (
            <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">Idle</span>
          )}
          {language && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Language: {language}</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Transcription:</h3>
        <div className="min-h-[100px] border border-border rounded p-3 bg-background">
          {transcription ? (
            <p className="text-sm whitespace-pre-wrap">{transcription}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isRecording ? 'Speak now...' : 'Click "Start Recording" to begin'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}