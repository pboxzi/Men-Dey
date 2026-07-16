-- ============================================
-- CLEAN RESET — Drop conflicting tables, then recreate
-- ============================================

-- Drop existing tables that conflict with our schema
DROP TABLE IF EXISTS journal_comments CASCADE;
DROP TABLE IF EXISTS proposal_chats CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- Now create all tables fresh
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE videos (
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

-- Photos
CREATE TABLE photos (
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

CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_sort_order ON videos(sort_order);
CREATE INDEX idx_photos_category_id ON photos(category_id);
CREATE INDEX idx_photos_sort_order ON photos(sort_order);

CREATE TRIGGER trg_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscribers
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requests
CREATE TABLE requests (
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

CREATE TRIGGER trg_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Memberships
CREATE TABLE memberships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  tier TEXT NOT NULL DEFAULT 'Gold',
  applied_on TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  member TEXT NOT NULL,
  member_avatar TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Payment Requested',
  price TEXT NOT NULL DEFAULT '0.00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Posts
CREATE TABLE posts (
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

CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_text TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- Discussions
CREATE TABLE discussions (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discussions_country ON discussions(country);

-- Discussion Replies
CREATE TABLE discussion_replies (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);

-- Proposal Chats
CREATE TABLE proposal_chats (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('management', 'user', 'system')),
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposal_chats_request_id ON proposal_chats(request_id);

-- Journal Comments
CREATE TABLE journal_comments (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_comments_journal_id ON journal_comments(journal_id);

-- ============================================
-- RLS Policies
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

CREATE POLICY "public_all_categories" ON categories FOR ALL TO public USING (true);
CREATE POLICY "public_all_videos" ON videos FOR ALL TO public USING (true);
CREATE POLICY "public_all_photos" ON photos FOR ALL TO public USING (true);
CREATE POLICY "public_all_subscribers" ON subscribers FOR ALL TO public USING (true);
CREATE POLICY "public_all_requests" ON requests FOR ALL TO public USING (true);
CREATE POLICY "public_all_memberships" ON memberships FOR ALL TO public USING (true);
CREATE POLICY "public_all_orders" ON orders FOR ALL TO public USING (true);
CREATE POLICY "public_all_posts" ON posts FOR ALL TO public USING (true);
CREATE POLICY "public_all_comments" ON comments FOR ALL TO public USING (true);
CREATE POLICY "public_all_discussions" ON discussions FOR ALL TO public USING (true);
CREATE POLICY "public_all_discussion_replies" ON discussion_replies FOR ALL TO public USING (true);
CREATE POLICY "public_all_proposal_chats" ON proposal_chats FOR ALL TO public USING (true);
CREATE POLICY "public_all_journal_comments" ON journal_comments FOR ALL TO public USING (true);
