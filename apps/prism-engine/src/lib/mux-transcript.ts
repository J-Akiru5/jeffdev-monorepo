/**
 * Mux Transcript Utilities
 * 
 * Fetch and parse video transcripts from Mux API
 */

import Mux from '@mux/mux-node';

let _muxClient: Mux | null = null;

function getMuxClient(): Mux {
  if (_muxClient) return _muxClient;

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('Mux credentials not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET.');
  }

  _muxClient = new Mux({
    tokenId,
    tokenSecret,
  });

  return _muxClient;
}

export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

export interface ParsedTranscript {
  fullText: string;
  segments: TranscriptSegment[];
  duration: number; // total duration in seconds
  language?: string;
}

/**
 * Fetch transcript track from Mux asset
 */
export async function fetchMuxTranscript(assetId: string, trackId: string): Promise<ParsedTranscript> {
  const mux = getMuxClient();

  try {
    // Get the asset to find the transcript track
    const asset = await mux.video.assets.retrieve(assetId);
    
    if (!asset || !asset.tracks) {
      throw new Error(`Asset ${assetId} not found or has no tracks`);
    }

    // Find the transcript track
    const transcriptTrack = asset.tracks.find(
      (track) => track.id === trackId && track.type === 'text'
    );

    if (!transcriptTrack) {
      throw new Error(`Transcript track ${trackId} not found in asset ${assetId}`);
    }

    // Mux doesn't provide direct API to download transcript content
    // We need to construct the URL from the track data
    // Transcripts are available via the playback URL
    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      throw new Error(`Asset ${assetId} has no playback IDs`);
    }

    // Fetch VTT content from Mux CDN
    // Format: https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt
    const vttUrl = `https://stream.mux.com/${playbackId}/text/${trackId}.vtt`;
    
    const response = await fetch(vttUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.statusText}`);
    }

    const vttContent = await response.text();
    
    // Parse VTT content
    const parsed = parseVTT(vttContent);
    
    return {
      ...parsed,
      duration: asset.duration || 0,
      language: transcriptTrack.text_type || 'en',
    };
  } catch (error) {
    console.error('[Mux Transcript] Fetch failed:', error);
    throw new Error(
      `Failed to fetch transcript from Mux: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse WebVTT format transcript
 */
function parseVTT(vttContent: string): { fullText: string; segments: TranscriptSegment[] } {
  const lines = vttContent.split('\n');
  const segments: TranscriptSegment[] = [];
  let fullText = '';

  let i = 0;
  // Skip header (WEBVTT)
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line (format: 00:00:00.000 --> 00:00:05.000)
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map((s) => s.trim());
      const start = parseVTTTimestamp(startStr);
      const end = parseVTTTimestamp(endStr);

      // Next line(s) contain the text
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        // Remove VTT formatting tags like <v Speaker>
        const cleanLine = lines[i].replace(/<[^>]*>/g, '').trim();
        if (cleanLine) {
          text += (text ? ' ' : '') + cleanLine;
        }
        i++;
      }

      if (text) {
        segments.push({ start, end, text });
        fullText += (fullText ? ' ' : '') + text;
      }
    }

    i++;
  }

  return { fullText, segments };
}

/**
 * Convert VTT timestamp to seconds
 * Format: HH:MM:SS.mmm or MM:SS.mmm
 */
function parseVTTTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    minutes = parseInt(parts[0], 10);
    seconds = parseFloat(parts[1]);
  } else {
    // SS.mmm
    seconds = parseFloat(parts[0]);
  }

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get transcript status for an asset
 */
export async function getTranscriptStatus(assetId: string): Promise<{
  ready: boolean;
  trackId?: string;
  status?: string;
}> {
  const mux = getMuxClient();

  try {
    const asset = await mux.video.assets.retrieve(assetId);

    if (!asset || !asset.tracks) {
      return { ready: false, status: 'no_tracks' };
    }

    const transcriptTrack = asset.tracks.find((track) => track.type === 'text');

    if (!transcriptTrack) {
      return { ready: false, status: 'no_transcript' };
    }

    return {
      ready: transcriptTrack.status === 'ready',
      trackId: transcriptTrack.id,
      status: transcriptTrack.status,
    };
  } catch (error) {
    console.error('[Mux Transcript] Status check failed:', error);
    return { ready: false, status: 'error' };
  }
}
