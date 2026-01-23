import { ContentItem } from '@/lib/db/schema';

export interface BasePlayerProps {
  className?: string;
  onTimestampCapture?: (timestamp: number) => void;
}

export interface VideoPlayerProps extends BasePlayerProps {
  youtubeId: string;
  startTime?: number;
  endTime?: number;
  title: string;
}

export interface AudioPlayerProps extends BasePlayerProps {
  audioUrl: string;
  title: string;
}

export interface TextReaderProps {
  content: string;
  title: string;
  className?: string;
  onWordClick?: (word: string, context: string) => void;
}

export interface ContentPlayerProps {
  content: ContentItem;
  className?: string;
  onTimestampCapture?: (timestamp: number) => void;
  onWordClick?: (word: string, context: string) => void;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
