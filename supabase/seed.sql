-- Seed data for categories table
INSERT INTO categories (id, name, description) VALUES
(1, 'Learning Resources', 'Educational content for skill development'),
(2, 'Media Collection', 'Video and photo collections'),
(3, 'Community Guidelines', 'Platform policies and standards');

-- Seed data for videos table
INSERT INTO videos (id, title, category_id, duration, youtube_id, subtitles, sort_order) VALUES
(1, 'Introduction to React Components', 1, '15:30', 'dQw4w9WgXcQ', 'en, es', 1),
(2, 'State Management Best Practices', 1, '22:15', 'dQw4w9WgXcQ', 'en', 2),
(3, 'Vue.js Fundamentals', 1, '18:45', 'dQw4w9WgXcQ', 'en, es', 3),
(4, 'Video Production Basics', 2, '25:20', 'dQw4w9WgXcQ', 'en', 1),
(5, 'Photography Essentials', 2, '20:10', 'dQw4w9WgXcQ', 'en, es', 2),
(6, 'Visual Storytelling', 2, '19:30', 'dQw4w9WgXcQ', 'en', 3);

-- Seed data for photos table
INSERT INTO photos (id, title, category_id, url, description, likes, width, height, sort_order) VALUES
(1, 'Professional Portrait 1', 2, 'https://example.com/photos/portrait1.jpg', 'Studio lighting setup', 42, 1920, 1080, 1),
(2, 'Urban Landscape', 2, 'https://example.com/photos/urban.jpg', 'Cityscape at sunset', 78, 1920, 1080, 2),
(3, 'Abstract Art', 2, 'https://example.com/photos/abstract.jpg', 'Modern abstract composition', 23, 1920, 1080, 3),
(4, 'Workshop Setup', 3, 'https://example.com/photos/workshop.jpg', 'Collaborative learning environment', 56, 1920, 1080, 1),
(5, 'Team Photo', 3, 'https://example.com/photos/team.jpg', 'Group collaboration session', 89, 1920, 1080, 2);