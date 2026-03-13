export type SourceType = 'youtube' | 'x' | 'blog' | 'github';

export type ItemStatus = 'PENDING' | 'REVIEWED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';

export type TagCategory = 'PLAYSTYLE' | 'TUTORIAL' | 'CASE' | 'TOOL' | 'UPDATE' | 'PLATFORM';

export interface Item {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  url: string;
  titleRaw: string;
  titleCn?: string;
  descriptionRaw?: string;
  descriptionCn?: string;
  author?: string;
  publishedAt: Date;
  fetchedAt: Date;
  status: ItemStatus;
  heatScore: number;
  views: number;
  likes: number;
  comments: number;
  isDuplicateOf?: string;
  tags?: ItemTag[];
}

export interface ItemTag {
  itemId: string;
  tagId: string;
  tag: Tag;
}

export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
  description?: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
}

export interface XTweet {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  publicMetrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
  };
}

export interface FetchResult {
  success: boolean;
  count: number;
  error?: string;
}
