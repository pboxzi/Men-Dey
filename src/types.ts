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
  category: string;
  comments: Comment[];
  created_at?: string;
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
  replies?: JournalComment[];
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

export interface Experience {
  id: string;
  title: string;
  category: string;
  tier: string;
  duration: string;
  location: string;
  price: string;
  spots: number;
  spotsTaken: number;
  description: string;
  short_description: string;
  full_description: string;
  details: string[];
  image: string;
  gallery_images: string;
  is_virtual: boolean;
  max_guests: number;
  availability: string;
  booking_requirements: string;
  featured: boolean;
  published: boolean;
  archived: boolean;
  popular: boolean;
  sort_order: number;
  capacity: string;
  intensity: string;
}

export interface ExperienceBooking {
  id: string;
  experienceId: string;
  experienceTitle: string;
  bookingReference: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  preferredDate: string;
  preferredTime: string;
  participants: number;
  specialRequests: string;
  communicationMethod: 'whatsapp' | 'email';
  status: 'pending' | 'under_review' | 'discussion' | 'active' | 'completed' | 'cancelled';
  confirmedDate: string;
  confirmedTime: string;
  confirmedLocation: string;
  meetingVenue: string;
  virtualLink: string;
  dressCode: string;
  arrivalInstructions: string;
  adminNotes: string;
  cancelledReason: string;
  submittedDate: string;
  createdAt: string;
  userId: string;
  memberName?: string;
  memberAvatar?: string;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  event: string;
  date: string;
  status: string;
  note?: string;
}

// ─── New interfaces for StateContext & Components ──────────

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface CharityPartner {
  id: string;
  name: string;
  description: string;
  url?: string;
}

export interface MembershipTier {
  id: string;
  name: string;
  price: string;
  description: string;
  sort_order: number;
  bg_color: string;
  border_color: string;
  icon_color: string;
  benefits: string[];
}

export interface FilmData {
  id: string;
  title: string;
  year: string;
  role: string;
  description: string;
  image: string;
  sort_order: number;
}

export interface LiteraryWork {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  sort_order: number;
}

export interface KindnessLogEntry {
  id: string;
  title: string;
  description: string;
  color: string;
  created_at: string;
  sort_order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface RequestType {
  id: string;
  type: string;
  description: string;
  sort_order: number;
}

export interface ProposalChatMessage {
  id: string;
  sender: 'user' | 'management' | 'system';
  text: string;
  timestamp: string;
}

export interface MembershipData {
  id: string;
  user_id: string;
  status: string;
  tier_id: string;
  tier_name: string;
  tier_price: string;
  card_name: string;
  card_serial: string;
  member_name: string;
  member_email: string;
  member_phone: string;
  member_country: string;
  profile_photo: string;
  comm_method: string;
  membership_number: string;
  activation_date: string;
  expiration_date: string;
  cancel_reason: string;
  admin_notes: string;
  created_at: string;
}

export interface PortalReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
}

export interface UserBadge {
  id: string;
  title: string;
  desc: string;
  date: string;
  icon: string;
}

export interface JourneyLogEntry {
  id: string;
  title: string;
  description?: string;
  date?: string;
  color?: string;
  created_at?: string;
}

export interface FanNotification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  is_read?: boolean;
  title?: string;
  message?: string;
  type?: string;
  created_at?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  day: string;
  month: string;
  location: string;
  time: string;
  event_type: string;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

export interface FanCreation {
  id: string;
  title: string;
  category: string;
  author: string;
  description: string;
  likes: number;
  created_at: string;
}

export interface ExperienceFormData {
  id?: string;
  title: string;
  category: string;
  tier: string;
  duration: string;
  location: string;
  price: string;
  spots: number;
  spotsTaken: number;
  description: string;
  short_description: string;
  full_description: string;
  details: string[];
  image: string;
  gallery_images: string;
  is_virtual: boolean;
  max_guests: number;
  availability: string;
  booking_requirements: string;
  featured: boolean;
  published: boolean;
  archived: boolean;
  popular: boolean;
  sort_order: number;
  capacity: string;
  intensity: string;
}
