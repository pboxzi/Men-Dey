-- ============================================
-- Gillian Anderson Portal — Full Migration
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================

-- Helper: auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Media (videos, photos, categories)
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  duration TEXT NOT NULL DEFAULT '',
  youtube_id TEXT NOT NULL,
  subtitles TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  width INTEGER DEFAULT 400,
  height INTEGER DEFAULT 300,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON videos(sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_category_id ON photos(category_id);
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos(sort_order);

DO $$ BEGIN
  CREATE TRIGGER trg_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Subscribers
-- ============================================

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Requests
-- ============================================

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  member TEXT NOT NULL,
  member_avatar TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Submitted',
  preferred_date TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  attendees TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  sincerity TEXT NOT NULL DEFAULT '',
  submitted_on TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Memberships
-- ============================================

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  tier TEXT NOT NULL DEFAULT 'Gold',
  applied_on TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Orders
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  member TEXT NOT NULL,
  member_avatar TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Payment Requested',
  price TEXT NOT NULL DEFAULT '0.00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Posts & Comments
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  handle TEXT NOT NULL DEFAULT '',
  avatar_text TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  likes INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  liked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_text TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);

-- ============================================
-- Discussions & Replies
-- ============================================

CREATE TABLE IF NOT EXISTS discussions (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_country ON discussions(country);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);

-- ============================================
-- Proposal Chats
-- ============================================

CREATE TABLE IF NOT EXISTS proposal_chats (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('management', 'user', 'system')),
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_chats_request_id ON proposal_chats(request_id);

-- ============================================
-- Journal Comments
-- ============================================

CREATE TABLE IF NOT EXISTS journal_comments (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_comments_journal_id ON journal_comments(journal_id);

-- ============================================
-- RLS Policies (permissive public access)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public_all_categories" ON categories FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_videos" ON videos FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_photos" ON photos FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_subscribers" ON subscribers FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_requests" ON requests FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_memberships" ON memberships FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_orders" ON orders FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_posts" ON posts FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_comments" ON comments FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_discussions" ON discussions FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_discussion_replies" ON discussion_replies FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_proposal_chats" ON proposal_chats FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public_all_journal_comments" ON journal_comments FOR ALL TO public USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- SEED DATA
-- ============================================

-- Subscribers
INSERT INTO subscribers (email) VALUES
  ('maria.garcia@gmail.com'),
  ('emma.wilson@gmail.com'),
  ('james.carter@gmail.com');

-- Memberships
INSERT INTO memberships (id, name, email, status, tier, applied_on) VALUES
  ('MEM-APP-001', 'Maria Garcia', 'maria@example.com', 'Pending', 'Gold', 'May 15, 2024'),
  ('MEM-APP-002', 'James Carter', 'james@example.com', 'Pending', 'Gold', 'May 16, 2024');

-- Requests
INSERT INTO requests (id, type, member, member_avatar, status, preferred_date, location, attendees, whatsapp_number, sincerity, submitted_on) VALUES
  ('GA-REQ-000145', 'Meet & Greet', 'John Smith', 'JS', 'In Discussion', 'July 10-15, 2024', 'Los Angeles, USA', '2 People', '+1 (555) 123-4567', 'I have been supporting youth mentoring for five years, inspired directly by Gillian''s compassionate advocacy. Meeting her would inspire our mentoring teams endlessly.', 'May 15, 2024, 10:30 AM'),
  ('GA-REQ-000144', 'Birthday Greeting', 'Maria Garcia', 'MG', 'Under Review', 'August 04, 2024', 'Virtual / Pre-recorded', '1 Person', '+1 (555) 987-6543', 'Maria is turning 30 and is a major X-Files and stage play fan.', 'May 14, 2024, 09:15 AM'),
  ('GA-REQ-000143', 'Video Message', 'David Lee', 'DL', 'Offer Made', 'Immediate', 'Email Delivery', '1 Person', '+1 (555) 456-7890', 'A dynamic shoutout for David''s film study graduation.', 'May 12, 2024, 02:30 PM'),
  ('GA-REQ-000142', 'Interview Request', 'Sophie Martin', 'SM', 'Payment Requested', 'September 12, 2024', 'Paris, France', '3 People', '+33 6 1234 5678', 'Interview regarding the philosophy of film.', 'May 10, 2024, 11:30 AM'),
  ('GA-REQ-000141', 'Business Inquiry', 'Alex Johnson', 'AJ', 'Submitted', 'Not specified', 'London, UK', '5 People', '+44 20 7946 0958', 'Inquiry about potential stage adaptation partnership.', 'May 08, 2024, 08:30 AM');

-- Orders
INSERT INTO orders (id, member, member_avatar, item, status, price) VALUES
  ('GA-SHP-000285', 'Emma Wilson', 'EW', 'Signed Script Copy', 'Payment Requested', '150.00'),
  ('GA-SHP-000284', 'James Carter', 'JC', 'Nostalgia Retro Tee', 'Confirmed', '35.00'),
  ('GA-SHP-000283', 'Olivia Brown', 'OB', 'Signature Hoodie', 'Preparing', '75.00'),
  ('GA-SHP-000282', 'Daniel Kim', 'DK', 'We Manifesto Book', 'Shipped', '49.00'),
  ('GA-SHP-000281', 'Liam Taylor', 'LT', 'We Manifesto Cap', 'Delivered', '35.00');

-- Posts
INSERT INTO posts (id, username, handle, avatar_text, image, content, likes, replies_count, liked) VALUES
  ('highlight-1', 'ScullySkeptic', '@ScullySkeptic', 'SS', '/src/assets/images/iceland_landscape_1782919139830.jpg', 'Took this scenic shot during my trip. It had that moody, mysterious X-Files atmosphere. Breathtaking and peaceful.', 342, 24, false),
  ('highlight-2', 'ArtByMonica', '@ArtByMonica', 'AM', '/src/assets/images/gillian_pencil_sketch_1783350359030.jpg', 'Gillian inspires me every single day. Here is my latest portrait drawing of her. Graphite and charcoal on textured paper.', 521, 33, false),
  ('highlight-3', 'StageDoorDreamer', '@StageDoorDreamer', 'SD', '/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg', 'A quick photo from the theater production set. Breathtaking to see how the stage magic is built layer by layer!', 298, 18, false);

-- Comments
INSERT INTO comments (id, post_id, username, avatar_text, content, parent_comment_id) VALUES
  ('c1', 'highlight-1', 'DanaFan', 'DF', 'Absolutely beautiful. Reminds me of the Oregon woods in the pilot!', NULL),
  ('c1-r1', 'highlight-1', 'XFilesTraveler', 'XT', 'You must check out Vancouver! The filming locations are unreal.', 'c1'),
  ('c1-r2', 'highlight-1', 'DanaFan', 'DF', 'Adding it to my travel plans immediately!', 'c1'),
  ('c2', 'highlight-1', 'GillianInspired', 'GI', 'The lighting and fog are beautiful. Great composition!', NULL),
  ('c3', 'highlight-2', 'SketchMaster', 'SM', 'The shading is incredible. You captured her elegant and intelligent look perfectly.', NULL),
  ('c3-r1', 'highlight-2', 'ArtByMonica', 'AM', 'Thank you! The hair took almost 4 hours alone.', 'c3'),
  ('c4', 'highlight-2', 'ScullyIsCool', 'SC', 'This is breathtaking! Outstanding drawing of Gillian.', NULL),
  ('c5', 'highlight-3', 'TheaterGeek', 'TG', 'You got to see the stage design?! That is absolutely excellent.', NULL),
  ('c5-r1', 'highlight-3', 'StageDoorDreamer', 'SD', 'Yes, it was a dream come true. The theater crew is extremely skilled.', 'c5'),
  ('c6', 'highlight-3', 'GraceAlways', 'GA', 'So happy for you! Thanks for sharing this backstage view.', NULL);

-- Discussions
INSERT INTO discussions (id, country, author, text) VALUES
  ('nz1', 'New Zealand', 'KiwiSeeker', 'Rewatching the entire X-Files series tonight in Auckland. Absolute classics.'),
  ('jp1', 'Japan', 'TokyoSaito', 'Gillian has such a deep appreciation for classical theater and independent cinema.'),
  ('de1', 'Germany', 'Berlin_Bridges', 'Organizing a local youth mentoring seminar in Munich next month to support transition advocacy.'),
  ('br1', 'Brazil', 'Rio_Scully', 'Gillian Anderson has the warmest heart. Infinite love from Rio de Janeiro!'),
  ('fr1', 'France', 'ParisianSkeptic', 'Her elegance and wit during theater panel conferences here in Paris is legendary.'),
  ('in1', 'India', 'Rajesh_Kumar', 'The kindness philosophy is universal. Namaste from Delhi community!'),
  ('mx1', 'Mexico', 'Gomez_Scully', 'Be compassionate to each other! Greeting from Mexico City fans!'),
  ('za1', 'South Africa', 'CapeTown_Rebel', 'Love to see the youth mentoring transition focus. Absolute queen.'),
  ('kr1', 'South Korea', 'Seoul_Scully', 'Amazing to see Korean fans uniting for youth mentorship charity drives!'),
  ('it1', 'Italy', 'Rome_Thespian', 'Gillian''s presence at the theater stages here is always a joy.'),
  ('es1', 'Spain', 'Madrid_Scully', 'West End play adaptations touring Spain would be a dream come true!'),
  ('ar1', 'Argentina', 'Diego_P', 'She represents the ultimate elegant standard. Big support from Buenos Aires!'),
  ('ph1', 'Philippines', 'Pinoy_Empowered', 'You are empowered! Everyday reminder to keep being compassionate.'),
  ('sg1', 'Singapore', 'Merlion_Scully', 'The official communication bridge works so fast. Thank you Sarah/management!');

-- Discussion Replies
INSERT INTO discussion_replies (id, discussion_id, author, text) VALUES
  ('jp1-r1', 'jp1', 'Thespian_47', 'Yes, her devotion to the craft of acting is highly admired here!');

-- Proposal Chats
INSERT INTO proposal_chats (id, request_id, sender, text) VALUES
  ('p_m1', 'GA-REQ-000145', 'management', 'Hello John, we are looking at Saturday afternoon around 3 PM at the Beverly Hills venue. Will that suit your charity team?'),
  ('p_u1', 'GA-REQ-000145', 'user', 'Yes, that is perfect! We will bring our support validation documents.');

-- Journal Comments
INSERT INTO journal_comments (id, journal_id, author, text) VALUES
  ('jc-1', 'journal-1', 'ThespianHeart', 'Scully is what guided me to pursue my science degrees! Gillian, you inspire millions of us daily.');
