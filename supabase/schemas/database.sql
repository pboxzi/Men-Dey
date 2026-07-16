-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    duration VARCHAR(20),
    youtube_id VARCHAR(50),
    subtitles VARCHAR(100),
    sort_order INTEGER DEFAULT 0
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    url VARCHAR(500),
    description TEXT,
    likes INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    sort_order INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_photos_category_id ON photos(category_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now, typically you'd want more restrictive policies)
CREATE POLICY "categories_all" ON categories FOR ALL TO public USING (true);
CREATE POLICY "videos_all" ON videos FOR ALL TO public USING (true);
CREATE POLICY "photos_all" ON photos FOR ALL TO public USING (true);