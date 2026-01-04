import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Video, Clock, FileJson, Play } from "lucide-react";
import { GlassPanel } from "@jdstudio/ui";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Video Library Page
 * Lists all uploaded videos and their transcripts for this project.
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

  // Fetch video transcripts for this project
  const transcriptsCollection = await getCollection("videoTranscripts");
  const videos = await transcriptsCollection
    .find({ projectId: project._id.toString() })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

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
            <p className="text-sm text-white/50">{videos.length} video{videos.length !== 1 ? 's' : ''} uploaded</p>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      {videos.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard 
              key={video._id.toString()} 
              video={video} 
              slug={slug}
            />
          ))}
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
