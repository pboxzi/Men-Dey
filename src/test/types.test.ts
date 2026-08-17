import { describe, it, expect } from 'vitest';
import type {
  Slide, JournalEntry, MediaItem, PhotoItem, Experience,
  ExperienceBooking, TimelineEntry, FaqEntry, CharityPartner,
  MembershipTier, FilmData, LiteraryWork, KindnessLogEntry,
  QuizQuestion, RequestType, ProposalChatMessage, MembershipData,
  PortalReward, UserBadge, JourneyLogEntry, FanNotification,
  AdminNotification, AdminEvent, ActivityFeedItem, FanCreation,
  ExperienceFormData,
} from '../types';

describe('Type definitions', () => {
  it('Slide has required fields', () => {
    const slide: Slide = { id: '1', number: '01', quote: 'test', author: 'test', image: '/test.jpg' };
    expect(slide.id).toBe('1');
  });

  it('Experience has required fields', () => {
    const exp: Experience = {
      id: '1', title: 'Test', category: 'Meet & Greet', tier: 'Gold',
      duration: '1hr', location: 'NYC', price: '$100', spots: 10,
      spotsTaken: 0, description: 'test', short_description: 'test',
      full_description: 'test', details: [], image: '/test.jpg',
      gallery_images: '', is_virtual: false, max_guests: 10,
      availability: 'Available', booking_requirements: '',
      featured: false, published: true, archived: false, popular: false,
      sort_order: 0, capacity: '', intensity: '',
    };
    expect(exp.title).toBe('Test');
  });

  it('TimelineEntry has required fields', () => {
    const entry: TimelineEntry = { event: 'Booked', date: '2024-01-01', status: 'confirmed' };
    expect(entry.event).toBe('Booked');
  });

  it('ProposalChatMessage has valid sender', () => {
    const msg: ProposalChatMessage = { id: '1', sender: 'user', text: 'hello', timestamp: '2024-01-01' };
    expect(['user', 'management', 'system']).toContain(msg.sender);
  });

  it('MembershipData has required fields', () => {
    const data: MembershipData = {
      id: '1', user_id: 'u1', status: 'active', tier_id: 'gold',
      tier_name: 'Gold', tier_price: '$50', card_name: 'Test',
      card_serial: 'GA-001', member_name: 'John', member_email: 'j@test.com',
      member_phone: '', member_country: 'USA', profile_photo: '',
      comm_method: 'email', membership_number: 'MEM-001',
      activation_date: '2024-01-01', expiration_date: '2025-01-01',
      cancel_reason: '', admin_notes: '', created_at: '2024-01-01',
    };
    expect(data.status).toBe('active');
  });

  it('ExperienceFormData has all fields', () => {
    const form: ExperienceFormData = {
      title: '', category: '', tier: '', duration: '', location: '',
      price: '', spots: 0, spotsTaken: 0, description: '', short_description: '',
      full_description: '', details: [], image: '', gallery_images: '',
      is_virtual: false, max_guests: 0, availability: '',
      booking_requirements: '', featured: false, published: true,
      archived: false, popular: false, sort_order: 0, capacity: '',
      intensity: '',
    };
    expect(form.published).toBe(true);
  });
});
