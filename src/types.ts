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

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface Request {
  id: string;
  type: string;
  member: string;
  member_avatar: string;
  status: 'In Discussion' | 'Submitted' | 'Under Review' | 'Offer Made' | 'Payment Requested' | 'Confirmed' | 'Completed';
  preferred_date: string;
  location: string;
  attendees: string;
  whatsapp_number: string;
  sincerity: string;
  submitted_on: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  tier: 'Gold' | 'Platinum';
  applied_on: string;
  updated_at: string;
}

export interface Order {
  id: string;
  member: string;
  member_avatar: string;
  item: string;
  status: 'Payment Requested' | 'Confirmed' | 'Preparing' | 'Shipped' | 'Delivered';
  price: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionPost {
  id: string;
  country: string;
  author: string;
  text: string;
  created_at: string;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface ProposalMessage {
  id: string;
  request_id: string;
  sender: 'management' | 'user' | 'system';
  text: string;
  created_at: string;
}

export interface JournalComment {
  id: string;
  journal_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  username: string;
  avatar_text: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
}
