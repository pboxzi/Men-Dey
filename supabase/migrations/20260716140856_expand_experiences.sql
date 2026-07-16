-- Migration 004: Expand experiences + posts tables

-- Posts: category column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'FAN ART';

-- Experiences: new columns
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Meet & Greet';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Gold';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS price TEXT DEFAULT 'Complimentary';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS spots INTEGER DEFAULT 10;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS spots_taken INTEGER DEFAULT 0;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Experience requests: add member columns
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS member_name TEXT DEFAULT 'Anonymous';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS member_avatar TEXT DEFAULT 'AN';
