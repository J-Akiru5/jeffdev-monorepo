import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Video, Clock, FileJson, Play, AlertCircle, RefreshCw } from "lucide-react";
import { GlassPanel } from "@jdstudio/ui";
import Mux from "@mux/mux-node";

interface Props {
  params: Promise<{ slug: string }>;
}

interface MuxAsset {
  id: string;
  playback_ids?: { id: string; policy: string }[];
  status: string;
  duration?: number;
  created_at: string;
  passthrough?: string;
  tracks?: { type: string; text_type?: string }[];
}

/**
 * Video Library Page
 * Lists all uploaded videos from Mux AND processed transcripts.
 */
export default async function VideosPage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({ userId, slug });
  
  if (!project) {
    notFound();
  }

  const projectId = project._id.toString();

  // Fetch processed video transcripts from database
  const transcriptsCollection = await getCollection("videoTranscripts");
  const processedVideos = await transcriptsCollection
    .find({ projectId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  // Fetch ALL assets from Mux to show pending ones too
  let muxAssets: MuxAsset[] = [];
  let orphanedAssets: MuxAsset[] = []; // Videos without project association
  let muxError: string | null = null;
  
  try {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    
    if (tokenId && tokenSecret) {
      const mux = new Mux({ tokenId, tokenSecret });
      const { data } = await mux.video.assets.list({ limit: 50 });
      
      // Separate: assets for this project vs orphaned assets
      for (const asset of data as MuxAsset[]) {
        if (asset.passthrough) {
          try {
            const meta = JSON.parse(asset.passthrough);
            if (meta.projectId === projectId) {
              muxAssets.push(asset);
            }
            // Skip assets assigned to other projects
          } catch {
            // Invalid JSON passthrough - treat as orphaned
            orphanedAssets.push(asset);
          }
        } else {
          // No passthrough = uploaded directly to Mux
          orphanedAssets.push(asset);
        }
      }
    }
  } catch (error) {
    console.error("[Video Library] Failed to fetch Mux assets:", error);
    muxError = "Could not load videos from Mux";
  }

  // Merge: Show processed videos first, then pending Mux assets
  const processedAssetIds = new Set(processedVideos.map(v => v.muxAssetId));
  const pendingAssets = muxAssets.filter(a => !processedAssetIds.has(a.id));
  
  const totalVideos = processedVideos.length + pendingAssets.length;

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
            <Video className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Video Library</h1>
            <p className="text-sm text-white/50">{totalVideos} video{totalVideos !== 1 ? 's' : ''} uploaded</p>
          </div>
        </div>
      </div>

      {/* Mux Error Notice */}
      {muxError && (
        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400">{muxError}</p>
        </div>
      )}

      {/* Video Grid */}
      {totalVideos === 0 ? (
        <GlassPanel className="p-12 text-center">
          <Video className="h-12 w-12 mx-auto text-white/20 mb-4" />
          <p className="text-white/50">No videos uploaded yet.</p>
          <p className="text-sm text-white/30 mt-1">
            Upload a video on the project page to extract rules automatically.
          </p>
          <Link
            href={`/projects/${slug}`}
            className="inline-flex items-center gap-2 mt-4 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Go to Project →
          </Link>
        </GlassPanel>
      ) : (
        <div className="space-y-6">
          {/* Processed Videos */}
          {processedVideos.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {processedVideos.map((video) => (
                <VideoCard 
                  key={video._id.toString()} 
                  video={video} 
                  slug={slug}
                />
              ))}
            </div>
          )}

          {/* Pending Videos (uploaded but not processed yet) */}
          {pendingAssets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-white/50 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing ({pendingAssets.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingAssets.map((asset) => (
                  <PendingVideoCard key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orphaned Videos (uploaded directly to Mux, not associated with any project) */}
      {orphanedAssets.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-amber-400/80 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unassigned Videos ({orphanedAssets.length})
            </h2>
            <span className="text-xs text-white/40">
              Uploaded directly to Mux
            </span>
          </div>
          <p className="text-xs text-white/40">
            These videos were uploaded directly to Mux and aren&apos;t linked to any project. 
            Re-upload them through the project page to enable AI rule extraction.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orphanedAssets.map((asset) => (
              <OrphanedVideoCard key={asset.id} asset={asset} projectSlug={slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, slug }: { video: Record<string, unknown>; slug: string }) {
  const rulesCount = (video.extractedRules as string[])?.length || 0;
  const duration = video.duration as number || 0;
  const videoId = (video._id as { toString: () => string }).toString();
  const playbackId = video.muxPlaybackId as string;
  
  return (
    <Link href={`/projects/${slug}/videos/${videoId}`}>
      <GlassPanel className="p-0 overflow-hidden hover:border-white/20 transition-all group cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-[#0a0a0a]">
          {playbackId ? (
            <img
              src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=5`}
              alt={video.videoTitle as string}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-10 w-10 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 border border-white/20">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-white truncate">
            {video.videoTitle as string || "Untitled Video"}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(duration)}
            </span>
            <span className="flex items-center gap-1">
              <FileJson className="h-3 w-3" />
              {rulesCount} rule{rulesCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function PendingVideoCard({ asset }: { asset: MuxAsset }) {
  const playbackId = asset.playback_ids?.[0]?.id;
  const duration = asset.duration || 0;
  const createdAt = new Date(asset.created_at);
  const hasTranscript = asset.tracks?.some(t => t.type === "text" && t.text_type === "subtitles");
  
  // Parse title from passthrough
  let title = `Video ${asset.id.slice(0, 8)}`;
  if (asset.passthrough) {
    try {
      const meta = JSON.parse(asset.passthrough);
      if (meta.videoTitle) title = meta.videoTitle;
    } catch { /* ignore */ }
  }

  return (
    <GlassPanel className="p-0 overflow-hidden border-amber-500/20">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#0a0a0a]">
        {playbackId ? (
          <img
            src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=5`}
            alt={title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-10 w-10 text-white/20" />
          </div>
        )}
        {/* Processing overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-2" />
            <span className="text-xs font-mono text-amber-400">
              {asset.status === "ready" && !hasTranscript 
                ? "Generating captions..." 
                : asset.status === "preparing" 
                  ? "Processing video..." 
                  : "Extracting rules..."}
            </span>
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white/70 truncate">{title}</h3>
        <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </span>
          <span className="text-amber-400/60">
            {createdAt.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}

function OrphanedVideoCard({ asset, projectSlug }: { asset: MuxAsset; projectSlug: string }) {
  const playbackId = asset.playback_ids?.[0]?.id;
  const duration = asset.duration || 0;
  const createdAt = new Date(asset.created_at);

  return (
    <GlassPanel className="p-0 overflow-hidden border-white/10">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#0a0a0a]">
        {playbackId ? (
          <img
            src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=5`}
            alt={`Video ${asset.id.slice(0, 8)}`}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-10 w-10 text-white/20" />
          </div>
        )}
        {/* Play overlay on hover */}
        {playbackId && (
          <a
            href={`https://stream.mux.com/${playbackId}.m3u8`}
            target="_blank"
            rel="noopener noreferrer"
            title="Play video in new tab"
            aria-label="Play video"
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 border border-white/20">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
          </a>
        )}
      </div>
      
      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs text-white/50 truncate">
            {asset.id.slice(0, 16)}...
          </h3>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            asset.status === "ready" 
              ? "text-emerald-400 bg-emerald-500/15" 
              : "text-amber-400 bg-amber-500/15"
          }`}>
            {asset.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </span>
          <span>
            {createdAt.toLocaleDateString()}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
