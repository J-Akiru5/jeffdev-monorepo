"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@jdstudio/ui";

/**
 * @component VideoContextUploader
 * @description Upload context videos to Mux for automatic transcription.
 * The transcript is processed by Azure OpenAI to generate architectural rules.
 * 
 * @example
 * <VideoContextUploader projectId="prj_abc123" />
 */
export function VideoContextUploader({ 
  projectId,
  onUploadComplete 
}: { 
    projectId?: string;
  onUploadComplete?: (assetId: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch a signed upload URL from our API
  const initializeUpload = async () => {
    try {
      setStatus("uploading");
      const res = await fetch("/api/upload/mux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to initialize upload");
      }
      
      const data = await res.json();
      setUploadUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload initialization failed");
      setStatus("error");
    }
  };

  const handleSuccess = () => {
    setStatus("processing");
    console.log("✅ Upload complete, processing transcript...");
    
    // After Mux processes the video, the webhook will handle the rest
    setTimeout(() => {
      setStatus("success");
      onUploadComplete?.("uploaded");
    }, 2000);
  };

  const handleError = () => {
    console.error("❌ Upload failed");
    setError("Video upload failed. Please try again.");
    setStatus("error");
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10">
            <span className="text-lg">📹</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Upload Context Video</h3>
            <p className="text-xs text-white/50 font-mono">
              AI will extract architectural rules from your recording
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {status === "idle" && (
          <button
            onClick={initializeUpload}
            className="group relative w-full overflow-hidden rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] p-8 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-white/5 p-4 transition-transform group-hover:scale-110">
                <svg className="h-8 w-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="font-mono text-sm text-white/60">
                Click to upload screen recording
              </span>
              <span className="font-mono text-xs text-white/30">
                MP4, MOV, WEBM up to 500MB
              </span>
            </div>
          </button>
        )}

        {status === "uploading" && uploadUrl && (
          <div className="space-y-4">
            <MuxUploader
              endpoint={uploadUrl}
              onSuccess={handleSuccess}
              onError={handleError}
              className="w-full"
              style={{
                "--uploader-font-family": "JetBrains Mono, monospace",
                "--button-background-color": "transparent",
                "--button-border": "1px solid rgba(255,255,255,0.1)",
                "--button-hover-background": "rgba(6, 182, 212, 0.1)",
              } as React.CSSProperties}
            />
            <div className="flex items-center justify-center gap-2 text-cyan-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              <span className="font-mono text-xs">Uploading to Mux...</span>
            </div>
          </div>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-cyan-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-mono text-sm text-white">Processing Transcript...</p>
              <p className="font-mono text-xs text-white/40 mt-1">
                Mux AI is extracting text from your video
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-mono text-sm text-emerald-400">Video Context Captured!</p>
              <p className="font-mono text-xs text-white/40 mt-1">
                Rules will be generated when transcript is ready
              </p>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Upload another video →
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-mono text-sm text-red-400">Upload Failed</p>
              <p className="font-mono text-xs text-white/40 mt-1">{error}</p>
            </div>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
              }}
              className="mt-2 font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Try again →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
