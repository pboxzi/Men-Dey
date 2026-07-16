-- Migration 003: Add category column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'FAN ART';

-- Update existing posts with categories based on content keywords
UPDATE posts SET category = 'LETTERS' WHERE category = 'FAN ART' AND (content ILIKE '%letter%' OR content ILIKE '%dear gillian%');
UPDATE posts SET category = 'ENCOUNTERS' WHERE category = 'FAN ART' AND (content ILIKE '%met gillian%' OR content ILIKE '%encounter%' OR content ILIKE '%saw her%');
