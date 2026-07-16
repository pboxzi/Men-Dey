CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    duration TEXT NOT NULL DEFAULT '',
    youtube_id TEXT NOT NULL,
    subtitles TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    url TEXT NOT NULL,
    description TEXT DEFAULT '',
    likes INTEGER DEFAULT 0,
    width INTEGER DEFAULT 400,
    height INTEGER DEFAULT 300,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
