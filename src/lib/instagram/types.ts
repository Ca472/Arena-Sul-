export type InstagramMediaKind = "reel" | "story";

export type InstagramMediaType = "IMAGE" | "VIDEO";

export type InstagramMediaItem = {
  id: string;
  kind: InstagramMediaKind;
  mediaType: InstagramMediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string;
};

export type InstagramFeedStatus =
  | "connected"
  | "unconfigured"
  | "unavailable";

export type InstagramFeed = {
  status: InstagramFeedStatus;
  stories: InstagramMediaItem[];
  reels: InstagramMediaItem[];
};
