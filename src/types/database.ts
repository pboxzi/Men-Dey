export type Role = 'user' | 'management' | 'admin';
export type ProfileStatus = 'pending' | 'active' | 'suspended';

export type RequestType =
  | 'personal_experience'
  | 'video_communication'
  | 'voice_message'
  | 'text_message'
  | 'virtual_meeting'
  | 'meet_greet'
  | 'business_professional'
  | 'special_occasion'
  | 'signed_memorabilia'
  | 'charity_request'
  | 'event_appearance'
  | 'group_experience'
  | 'phone_call'
  | 'other';

export type RequestStatus =
  | 'submitted'
  | 'in_review'
  | 'information_requested'
  | 'proposal'
  | 'payment_required'
  | 'confirmed'
  | 'approved'
  | 'scheduled'
  | 'completed'
  | 'declined'
  | 'cancelled';

export type RequestEventType =
  | 'submitted'
  | 'management_received'
  | 'review_started'
  | 'information_requested'
  | 'proposal_created'
  | 'proposal_accepted'
  | 'confirmed'
  | 'approved'
  | 'scheduled'
  | 'completed'
  | 'declined'
  | 'cancelled';

export type ApplicantStatus = 'new' | 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export type ExperienceInterestKey =
  | 'personal_experience'
  | 'video_communication'
  | 'voice_message'
  | 'text_communication'
  | 'virtual_meeting'
  | 'meet_greet'
  | 'business_request'
  | 'special_occasion'
  | 'signed_memorabilia'
  | 'charity_request'
  | 'event_appearance'
  | 'group_experience'
  | 'phone_call'
  | 'other';

export type ConversationStatus = 'open' | 'waiting' | 'closed';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  company: string | null;
  website: string | null;
  preferred_contact_method: 'email' | 'phone' | 'sms' | 'none' | null;
  profile_photo: string | null;
  role: Role;
  status: ProfileStatus;
  email_verified_at: string | null;
  notify_requests: boolean;
  notify_membership: boolean;
  notify_experiences: boolean;
  notify_messages: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  staff_role_id: string | null;
  title: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcknowledgementVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Acknowledgement {
  id: string;
  user_id: string;
  acknowledgement_version: number;
  accepted_at: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AccountAgreement {
  id: string;
  user_id: string;
  agreement_type: 'terms' | 'privacy' | 'membership';
  version: string;
  accepted_at: string;
  user_agent: string | null;
  created_at: string;
}

export interface ApplicantProfile {
  id: string;
  user_id: string;
  status: ApplicantStatus;
  headline: string | null;
  background: string | null;
  interests: string | null;
  reason_for_joining: string | null;
  platform_motivation: string | null;
  connection_interest: string | null;
  experience_interests: ExperienceInterestKey[];
  contact_email_ok: boolean;
  contact_phone_ok: boolean;
  contact_whatsapp_ok: boolean;
  whatsapp_number: string | null;
  application_completed_at: string | null;
  referred_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagementConversation {
  id: string;
  user_id: string;
  subject: string;
  status: ConversationStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  name: string;
  path: string;
  size?: number;
  mime?: string;
}

export interface ManagementMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  is_internal: boolean;
  read_at: string | null;
  attachments: MessageAttachment[];
  created_at: string;
}

export interface ManagementNote {
  id: string;
  conversation_id: string | null;
  user_id: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  experience_id: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  location: string | null;
  participants: string | null;
  contact_method: string | null;
  additional_requirements: string | null;
  submitted_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestEvent {
  id: string;
  request_id: string;
  actor_id: string | null;
  event_type: RequestEventType;
  note: string | null;
  created_at: string;
}

export interface RequestMessage {
  id: string;
  request_id: string;
  sender_id: string | null;
  body: string;
  is_internal: boolean;
  read_at: string | null;
  created_at: string;
}

export interface MembershipTier {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: 'monthly' | 'annual' | 'one_time';
  benefits: string[];
  status: 'active' | 'draft' | 'archived';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipApplication {
  id: string;
  user_id: string;
  tier_id: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'withdrawn';
  statement: string | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MembershipOfferStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface MembershipOffer {
  id: string;
  application_id: string | null;
  user_id: string;
  tier_id: string;
  status: MembershipOfferStatus;
  price_cents: number | null;
  currency: string;
  message: string | null;
  benefits: string[];
  terms: string | null;
  payment_provider: string | null;
  payment_instructions: string | null;
  offered_at: string;
  expires_at: string | null;
  responded_at: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MembershipStatus = 'pending' | 'verification' | 'active' | 'paused' | 'cancelled' | 'expired';

export interface Membership {
  id: string;
  user_id: string;
  tier_id: string;
  application_id: string | null;
  offer_id: string | null;
  status: MembershipStatus;
  membership_number: string | null;
  activation_date: string | null;
  expiration_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export interface MembershipPayment {
  id: string;
  membership_id: string;
  user_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  provider: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipCard {
  id: string;
  membership_id: string;
  card_serial: string;
  issued_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  slug: string;
  type: RequestType;
  title: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  price_cents: number | null;
  currency: string;
  status: 'draft' | 'published' | 'full' | 'cancelled' | 'completed';
  required_tier_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RequirementCategory =
  | 'membership_tier'
  | 'availability'
  | 'location'
  | 'age'
  | 'documents'
  | 'dress'
  | 'arrival_instructions'
  | 'participants'
  | 'payment'
  | 'special_conditions'
  | 'other';

export interface ExperienceRequirement {
  id: string;
  request_id: string;
  label: string;
  category: RequirementCategory;
  description: string | null;
  is_required: boolean;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExperienceProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface ExperienceProposal {
  id: string;
  request_id: string;
  version: number;
  summary: string;
  terms: string | null;
  amount_cents: number | null;
  currency: string;
  status: ExperienceProposalStatus;
  proposed_date: string | null;
  proposed_time: string | null;
  location: string | null;
  duration_minutes: number | null;
  participants: string | null;
  notes: string | null;
  payment_provider: string | null;
  payment_instructions: string | null;
  sent_at: string | null;
  responded_at: string | null;
  viewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienceSchedule {
  id: string;
  experience_id: string | null;
  request_id: string | null;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  virtual_link: string | null;
  meeting_instructions: string | null;
  internal_notes: string | null;
  status: 'scheduled' | 'changed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ExperiencePayment {
  id: string;
  request_id: string;
  user_id: string | null;
  proposal_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  provider: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string | null;
  request_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  virtual_link: string | null;
  meeting_instructions: string | null;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlock {
  id: string;
  title: string;
  kind: 'blocked' | 'available';
  starts_at: string;
  ends_at: string;
  timezone: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  title: string;
  category: 'general' | 'contract' | 'agreement' | 'financial' | 'brief' | 'press' | 'other';
  visibility: 'private' | 'shared' | 'management';
  owner_user_id: string | null;
  bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | 'new_message'
  | 'request_update'
  | 'information_required'
  | 'membership_offer'
  | 'membership_accepted'
  | 'payment_requested'
  | 'payment_received'
  | 'membership_activated'
  | 'experience_proposal'
  | 'experience_confirmed'
  | 'experience_scheduled'
  | 'experience_cancelled'
  | 'document_uploaded'
  | 'management_announcement'
  | 'system'
  | 'info'
  | 'request'
  | 'membership'
  | 'experience'
  | 'account';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee_id: string | null;
  due_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsSection {
  id: string;
  page_id: string;
  key: string;
  title: string | null;
  content: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  kind: 'image' | 'video' | 'document' | 'audio';
  bucket: string | null;
  storage_path: string | null;
  url: string | null;
  alt_text: string | null;
  visibility: 'private' | 'shared' | 'public';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}
