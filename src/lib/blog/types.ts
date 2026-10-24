export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: BlogStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coverStoragePath: string | null;
  coverUrl: string | null;
  coverAlt: string;
};

export type BlogPostSummary = Omit<BlogPost, "content">;

export type BlogFormState = {
  status: "idle" | "error" | "success";
  message: string;
  postId?: string;
  fieldErrors?: Record<string, string[]>;
};
