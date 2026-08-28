export type InstagramMediaKind = "reel" | "story";

export type InstagramMediaType = "IMAGE" | "VIDEO";

export type InstagramMediaItem = {
  id: string;
  kind: InstagramMediaKind;
  mediaType: InstagramMediaType;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string;
};

export type InstagramFeedStatus = "connected" | "unconfigured" | "unavailable";

export type InstagramFeed = {
  status: InstagramFeedStatus;
  storiesStatus: InstagramFeedStatus;
  reelsStatus: InstagramFeedStatus;
  stories: InstagramMediaItem[];
  reels: InstagramMediaItem[];
  fetchedAt: string | null;
};

export type InstagramStoriesSnapshot = {
  status: InstagramFeedStatus;
  stories: InstagramMediaItem[];
  fetchedAt: string | null;
};
