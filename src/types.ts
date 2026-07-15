/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Slide {
  id: string;
  number: string;
  quote: string;
  author: string;
  image: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  excerpt: string;
  content: string;
  readTime: string;
}

export interface MediaItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnail?: string;
  videoPlaceholderText: string;
  subtitles: string[];
  youtubeId?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
  likes: number;
  width?: number;
  height?: number;
}

export interface SitePillar {
  id: string;
  title: string;
  iconName: 'Star' | 'Crown' | 'Calendar' | 'HelpCircle' | 'ShoppingBag' | 'Heart';
  description: string;
  actionText: string;
}

export interface UpcomingEvent {
  id: string;
  day: string;
  month: string;
  title: string;
  location: string;
  time: string;
  description: string;
}

export interface Comment {
  id: string;
  username: string;
  avatarText: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export interface CommunityHighlight {
  id: string;
  username: string;
  handle: string;
  avatarText: string;
  image: string;
  content: string;
  likes: number;
  replies: number;
  liked: boolean;
  comments: Comment[];
}

export interface ShopItem {
  id: string;
  name: string;
  price: string;
  category: string;
  imagePlaceholder: string;
  description: string;
  details: string[];
}

export interface CharityItem {
  id: string;
  name: string;
  description: string;
  focus: string;
}
