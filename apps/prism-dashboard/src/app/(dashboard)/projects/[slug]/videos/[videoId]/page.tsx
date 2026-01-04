import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection, ObjectId } from "@jeffdev/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Video, FileJson, Clock, ExternalLink } from "lucide-react";
import { GlassPanel, Badge } from "@jdstudio/ui";

interface Props {
  params: Promise<{ slug: string; videoId: string }>;
}

/**
 * Video Detail Page
 * Shows video player, transcript, and extracted rules.
 */
export default async function VideoDetailPage({ params }: Props) {
  const { slug, videoId } = await params;
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

  // Fetch video transcript
  const transcriptsCollection = await getCollection("videoTranscripts");
  const video = await transcriptsCollection.findOne({ 
    _id: new ObjectId(videoId),
    projectId: project._id.toString()
  });
  
  if (!video) {
    notFound();
  }

  // Fetch extracted rules
  const rulesCollection = await getCollection("rules");
  const rules = await rulesCollection
    .find({ videoTranscriptId: videoId })
    .sort({ priority: 1 })
    .toArray();

  const playbackId = video.muxPlaybackId as string;

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href={`/projects/${slug}/videos`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Video Library
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
            <Video className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {video.videoTitle as string || "Untitled Video"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-white/50">
                <Clock className="h-3 w-3" />
                {formatDuration(video.duration as number)}
              </span>
              <Badge variant={video.confidence === 'high' ? 'success' : 'default'}>
                {video.confidence as string || 'unknown'} confidence
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Video & Transcript */}
        <div className="space-y-4">
          {/* Video Player */}
          {playbackId && (
            <GlassPanel className="p-0 overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://stream.mux.com/${playbackId}.m3u8`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            </GlassPanel>
          )}

          {/* Mux Player Link */}
          {playbackId && (
            <a
              href={`https://stream.mux.com/${playbackId}.m3u8`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              Open in Mux Player
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Transcript */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Transcript</h2>
            <div className="max-h-96 overflow-y-auto">
              <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed font-mono">
                {video.transcriptText as string || "No transcript available."}
              </p>
            </div>
          </GlassPanel>
        </div>

        {/* Extracted Rules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <FileJson className="h-5 w-5 text-cyan-400" />
              Extracted Rules
            </h2>
            <span className="text-sm text-white/50">{rules.length} rules</span>
          </div>

          {rules.length === 0 ? (
            <GlassPanel className="p-8 text-center">
              <FileJson className="h-10 w-10 mx-auto text-white/20 mb-4" />
              <p className="text-white/50">No rules extracted yet.</p>
              <p className="text-sm text-white/30 mt-1">
                Rules will appear here once transcript processing completes.
              </p>
            </GlassPanel>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleCard 
                  key={rule._id.toString()} 
                  rule={rule} 
                  slug={slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule, slug }: { rule: Record<string, unknown>; slug: string }) {
  const ruleId = (rule._id as { toString: () => string }).toString();
  
  return (
    <Link href={`/projects/${slug}/rules/${ruleId}/edit`}>
      <GlassPanel className="p-4 hover:border-white/20 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">
              {rule.name as string}
            </h3>
            <p className="text-sm text-white/50 mt-1 line-clamp-2">
              {rule.description as string || (rule.content as string)?.slice(0, 100)}
            </p>
          </div>
          <Badge variant={
            rule.category === 'architecture' ? 'architecture' :
            rule.category === 'security' ? 'security' :
            'default'
          }>
            {rule.category as string}
          </Badge>
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
