-- ============================================
-- NEW TABLES — All hardcoded data moved to Supabase
-- ============================================

-- 1. Hero Slides
CREATE TABLE hero_slides (
  id TEXT PRIMARY KEY,
  slide_number TEXT NOT NULL,
  quote TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Gillian Anderson',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Journal Entries
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  read_time TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Upcoming Events
CREATE TABLE upcoming_events (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  month TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Shop Products
CREATE TABLE shop_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  image_placeholder TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  details TEXT[] DEFAULT '{}',
  stock TEXT NOT NULL DEFAULT 'In Stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FAQ Entries
CREATE TABLE faq_entries (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Charity Causes
CREATE TABLE charity_causes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '$0',
  raised TEXT NOT NULL DEFAULT '$0',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Charity Partners
CREATE TABLE charity_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  focus TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Membership Tiers (unified)
CREATE TABLE membership_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL DEFAULT 'Free',
  icon_color TEXT NOT NULL DEFAULT '',
  bg_color TEXT NOT NULL DEFAULT '',
  border_color TEXT NOT NULL DEFAULT '',
  benefits TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Experiences
CREATE TABLE experiences (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  intensity TEXT NOT NULL DEFAULT '',
  capacity TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  details TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Films Data
CREATE TABLE films_data (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  revenue TEXT NOT NULL DEFAULT '',
  trivia TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  stunt_detail TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Literary Works
CREATE TABLE literary_works (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '',
  vibe TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Kindness Log
CREATE TABLE kindness_log (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Quiz Questions
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options TEXT[] DEFAULT '{}',
  correct INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Donations
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Portal Events
CREATE TABLE portal_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  registered BOOLEAN DEFAULT FALSE,
  ticket_ref TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Fan Creations
CREATE TABLE fan_creations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Fan Art',
  author TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  likes INTEGER DEFAULT 0,
  has_liked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Fan Creation Comments
CREATE TABLE fan_creation_comments (
  id TEXT PRIMARY KEY,
  creation_id TEXT NOT NULL REFERENCES fan_creations(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Fan Creation Reactions
CREATE TABLE fan_creation_reactions (
  id SERIAL PRIMARY KEY,
  creation_id TEXT NOT NULL REFERENCES fan_creations(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(creation_id, emoji)
);

-- 19. User Badges
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  earned_date TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Journey Log
CREATE TABLE journey_log (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  log_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'bg-green-500',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Communication Logs (Admin)
CREATE TABLE communication_logs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  member TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT '',
  last_contact TEXT NOT NULL DEFAULT '',
  by TEXT NOT NULL DEFAULT 'Admin',
  notes TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Admin Events
CREATE TABLE admin_events (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  month TEXT NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT '',
  registered TEXT NOT NULL DEFAULT '0',
  location TEXT NOT NULL DEFAULT '',
  event_time TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Admin Notifications
CREATE TABLE admin_notifications (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  notif_time TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Channel Messages
CREATE TABLE channel_messages (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'management',
  sender TEXT NOT NULL CHECK (sender IN ('management', 'user')),
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Fan Notifications
CREATE TABLE fan_notifications (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  notif_time TEXT NOT NULL DEFAULT '',
  unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Site Pillars
CREATE TABLE site_pillars (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  action_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Request Types
CREATE TABLE request_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Experience Requests
CREATE TABLE experience_requests (
  id TEXT PRIMARY KEY,
  experience_title TEXT NOT NULL,
  story TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted',
  status_text TEXT NOT NULL DEFAULT 'Submitted',
  submitted_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS Policies for all new tables
-- ============================================

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE films_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE literary_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_creation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_creation_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON hero_slides FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON journal_entries FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON upcoming_events FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON shop_products FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON faq_entries FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON charity_causes FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON charity_partners FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON membership_tiers FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON experiences FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON films_data FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON literary_works FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON kindness_log FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON quiz_questions FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON donations FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON portal_events FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON fan_creations FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON fan_creation_comments FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON fan_creation_reactions FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON user_badges FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON journey_log FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON communication_logs FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON admin_events FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON admin_notifications FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON channel_messages FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON fan_notifications FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON site_pillars FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON request_types FOR ALL TO public USING (true);
CREATE POLICY "public_all" ON experience_requests FOR ALL TO public USING (true);

-- Indexes
CREATE INDEX idx_journal_entries_category ON journal_entries(category);
CREATE INDEX idx_faq_entries_category ON faq_entries(category);
CREATE INDEX idx_fan_creation_comments_creation ON fan_creation_comments(creation_id);
CREATE INDEX idx_fan_creation_reactions_creation ON fan_creation_reactions(creation_id);
CREATE INDEX idx_channel_messages_channel ON channel_messages(channel);
CREATE INDEX idx_portal_events_date ON portal_events(event_date);

-- Triggers for updated_at
CREATE TRIGGER trg_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
