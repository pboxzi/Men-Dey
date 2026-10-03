-- ============================================================================
-- PURGE: legacy template content
-- ============================================================================
-- The project database was seeded from a Keanu Reeves template project.
-- This removes fabricated / wrong-person / fake-analytics content so the
-- rebuild reads only real data.
--
-- KEPT (verified real Gillian Anderson content):
--   films_data        - real credits (X-Files, The Fall, Sex Education, ...)
--   literary_works    - real published works
--   events            - real upcoming appearances
--   videos            - real interviews / trailers
--   categories        - media taxonomy
--   profiles, notifications, contact_submissions, email_logs, media_* - platform data
--
-- All statements are idempotent (safe to re-run).
-- ============================================================================

BEGIN;

-- ── 1. Wrong person: Keanu Reeves ───────────────────────────────────────────
DELETE FROM public.news;                 -- "Keanu Reeves to Receive Walk of Fame"
DELETE FROM public.films;                -- Matrix / Speed / Constantine filmography
DELETE FROM public.content_blocks;       -- "Welcome to the Official Website of Keanu Reeves"

-- ── 2. Fabricated first-person Gillian content ──────────────────────────────
DELETE FROM public.journal_articles;
DELETE FROM public.journal_comments;
DELETE FROM public.journal_entries;
DELETE FROM public.journal_categories;
DELETE FROM public.hero_slides;          -- invented quotes attributed to Gillian

-- ── 3. Fake Gillian claims & fabricated fundraising analytics ───────────────
DELETE FROM public.charity_causes;       -- goal / raised / progress are invented
DELETE FROM public.charity_partners;
DELETE FROM public.kindness_log;         -- unverifiable biographical claims
DELETE FROM public.membership_tiers;     -- invented $1,999 / $2,999 / $4,999 tiers
DELETE FROM public.memberships;
DELETE FROM public.membership_applications;

-- ── 4. Fake commercial experiences (explicitly forbidden by product spec) ───
DELETE FROM public.experiences;
DELETE FROM public.experience_requests;
DELETE FROM public.shop_products;
DELETE FROM public.orders;
DELETE FROM public.donations;

-- ── 5. Fake community / social feed ─────────────────────────────────────────
DELETE FROM public.posts;
DELETE FROM public.comments;
DELETE FROM public.discussions;
DELETE FROM public.discussion_replies;
DELETE FROM public.fan_creations;
DELETE FROM public.fan_creation_comments;
DELETE FROM public.fan_creation_reactions;
DELETE FROM public.channel_messages;

-- ── 6. Fake media archive (generic stock, not Gillian) ──────────────────────
DELETE FROM public.photos;

-- ── 7. Duplicate / stale event system (events table is the live one) ────────
DELETE FROM public.event_registrations;
DELETE FROM public.admin_events;
DELETE FROM public.portal_events;
DELETE FROM public.upcoming_events;

-- ── 8. Legacy + fabricated request pipeline ─────────────────────────────────
DELETE FROM public.proposal_chats;
DELETE FROM public.requests;
DELETE FROM public.fan_requests;
DELETE FROM public.request_status_history;

-- ── 9. "Ask Gillian" implies direct access to Gillian (forbidden) ───────────
DELETE FROM public.ask_gillian_messages;
DELETE FROM public.ask_gillian_conversations;
DELETE FROM public.ask_gillian_status;

-- ── 10. Fake gamification / engagement data ─────────────────────────────────
DELETE FROM public.quiz_questions;
DELETE FROM public.journey_log;
DELETE FROM public.site_pillars;
DELETE FROM public.loyalty_points;
DELETE FROM public.user_badges;
DELETE FROM public.portal_rewards;
DELETE FROM public.fan_notifications;

-- ── 11. Legacy CMS shells superseded by the rebuild ─────────────────────────
DELETE FROM public.navigation_items;
DELETE FROM public.carousel_slides;
DELETE FROM public.subscribers;

-- ── 12. Site identity: template branding → Gillian Anderson Management ──────
UPDATE public.site_settings
   SET value = 'Gillian Anderson Management',
       updated_at = now()
 WHERE key = 'site_name';

UPDATE public.site_settings
   SET value = 'Official management presence for Gillian Anderson — professional representation, media, appearances and fan relations.',
       updated_at = now()
 WHERE key = 'site_tagline';

UPDATE public.site_settings
   SET value = 'The official digital presence and private access platform for Gillian Anderson, managed by Gillian''s management office.',
       updated_at = now()
 WHERE key = 'site_description';

UPDATE public.site_settings
   SET value = 'false',
       updated_at = now()
 WHERE key = 'ask_gillian_enabled';

COMMIT;
