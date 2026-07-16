CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  duration VARCHAR(20),
  youtube_id VARCHAR(50),
  subtitles TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT videos_title_category_unique UNIQUE(title, category_id)
);

CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  url VARCHAR(500) NOT NULL,
  description TEXT,
  likes INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT photos_title_category_unique UNIQUE(title, category_id)
);

-- Create indexes for better performance
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_sort_order ON videos(sort_order);
CREATE INDEX idx_photos_category_id ON photos(category_id);
CREATE INDEX idx_photos_sort_order ON photos(sort_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();