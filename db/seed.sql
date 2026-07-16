-- ============================================
-- Seed Data — Migrated from data/db.json
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
  ('highlight-1', 'ScullySkeptic', '@ScullySkeptic', 'SS', '/src/assets/images/iceland_landscape_1782919139830.jpg', 'Took this scenic shot during my trip. It had that moody, mysterious X-Files atmosphere. Breathtaking and peaceful. 🌲🛸', 342, 24, false),
  ('highlight-2', 'ArtByMonica', '@ArtByMonica', 'AM', '/src/assets/images/gillian_pencil_sketch_1783350359030.jpg', 'Gillian inspires me every single day. Here is my latest portrait drawing of her. 🎨 Graphite and charcoal on textured paper. Hope you like it!', 521, 33, false),
  ('highlight-3', 'StageDoorDreamer', '@StageDoorDreamer', 'SD', '/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg', 'A quick photo from the theater production set. Breathtaking to see how the stage magic is built layer by layer! 🎭🎬', 298, 18, false);

-- Comments
INSERT INTO comments (id, post_id, username, avatar_text, content, parent_comment_id) VALUES
  -- Post 1 comments
  ('c1', 'highlight-1', 'DanaFan', 'DF', 'Absolutely beautiful. Reminds me of the Oregon woods in the pilot!', NULL),
  ('c1-r1', 'highlight-1', 'XFilesTraveler', 'XT', 'You must check out Vancouver! The filming locations are unreal.', 'c1'),
  ('c1-r2', 'highlight-1', 'DanaFan', 'DF', 'Adding it to my travel plans immediately!', 'c1'),
  ('c2', 'highlight-1', 'GillianInspired', 'GI', 'The lighting and fog are beautiful. Great composition!', NULL),
  -- Post 2 comments
  ('c3', 'highlight-2', 'SketchMaster', 'SM', 'The shading is incredible. You captured her elegant and intelligent look perfectly.', NULL),
  ('c3-r1', 'highlight-2', 'ArtByMonica', 'AM', 'Thank you! The hair took almost 4 hours alone.', 'c3'),
  ('c4', 'highlight-2', 'ScullyIsCool', 'SC', 'This is breathtaking! Outstanding drawing of Gillian.', NULL),
  -- Post 3 comments
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
