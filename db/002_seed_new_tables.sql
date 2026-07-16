-- ============================================
-- SEED DATA — All new tables
-- ============================================

-- Hero Slides
INSERT INTO hero_slides (id, slide_number, quote, author, image, sort_order) VALUES
('slide-1', '01', 'Just remember that we are here to support and lift each other up. Connection is everything.', 'Gillian Anderson', '/src/assets/images/gillian_hero_one_1783349664739.jpg', 1),
('slide-2', '02', 'If we don''t explore the margins of our curiosity, we never truly learn who we are.', 'Gillian Anderson', '/src/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg', 2),
('slide-3', '03', 'There is immense strength in vulnerability. Allowing yourself to be seen is a profound act of courage.', 'Gillian Anderson', '/src/assets/images/gillian_speaking_event_1783349739126.jpg', 3),
('slide-4', '04', 'I''ve always believed that the truth is something we choose to pursue, not something handed to us.', 'Gillian Anderson', '/src/assets/images/gillian_studio_portrait_1783349751129.jpg', 4),
('slide-5', '05', 'We are all complex, beautifully flawed creatures. Embrace your depth and celebrate your journey.', 'Gillian Anderson', '/src/assets/images/gillian_mentoring_warmth_1783349719383.jpg', 5);

-- Journal Entries
INSERT INTO journal_entries (id, title, category, date, image, excerpt, read_time, content) VALUES
('journal-1', 'Reflecting on Scully, Seeking Truth, and Female Strength', 'X-Files Retrospective', 'June 24, 2024', '/src/assets/images/gillian_investigator_look_1783349694204.jpg', 'Looking back at Agent Dana Scully, the ''Scully Effect'', and how seeking the truth shaped generations.', '4 min read', 'It''s hard to believe how many years have passed since I first put on Dana Scully''s trench coat. At the time, I didn''t fully comprehend the impact she would have. She wasn''t just a character; she became a symbol for women in science, technology, engineering, and math—what became known as the ''Scully Effect''.\n\nScully was analytical, strong, and skeptical, but she also had a deep capacity for empathy. She taught me so much about quiet strength and standing your ground in rooms where your voice is questioned.\n\n> "The truth is out there, but so is the courage to look for it. Every step of investigation is a step of self-discovery."\n\nI''m incredibly grateful to the fans who have kept the search for truth alive. Thank you for walking this mysterious, beautiful path with me. Keep asking questions. Keep seeking.'),
('journal-2', 'On theater, the stage, and creative courage', 'Theater Life', 'June 15, 2024', '/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg', 'The raw adrenaline of the stage, character transformation, and my deep love for live performance.', '5 min read', 'There is nothing quite like the feeling of standing in the wings of a theater, hearing the audience''s quiet chatter fade, and stepping into the light. Theater is raw, unforgiving, and completely immediate. There are no retakes, no edits, and no hiding.\n\nPlaying Blanche DuBois in ''A Streetcar Named Desire'' or Margo Channing in ''All About Eve'' was both terrifying and exhilarating. It demands every ounce of your emotional and physical presence.\n\n> "The stage is a sacred space of absolute truth. It forces you to be vulnerable, to crack open your chest, and to share a piece of your soul with strangers."\n\nFor me, acting has always been about curiosity and empathy—trying to inhabit another person''s psyche, to understand their pain, their joy, and their complexities. It''s an honor to share these stories in real time with an audience. If you have a creative passion, never let fear keep you from stepping onto your own stage.'),
('journal-3', 'Embracing complex women: From Stella Gibson to Margaret Thatcher', 'Behind The Scenes', 'June 02, 2024', '/src/assets/images/gillian_mentoring_warmth_1783349719383.jpg', 'Exploring the layers of powerful, controversial, and multifaceted characters on television.', '6 min read', 'In recent years, I''ve had the privilege of playing characters who are incredibly distinct, powerful, and sometimes highly divisive. From the cool, methodical Detective Superintendent Stella Gibson in ''The Fall'', to the liberating Dr. Jean Milburn in ''Sex Education'', to the formidable Margaret Thatcher in ''The Crown''.\n\nEach of these women represents a unique facet of female power. Stella is unapologetically herself, completely in control of her sexuality and intellect. Jean is warm, open, and hilariously boundary-free. Margaret was a force of nature, shaped by rigid determination.\n\n> "I''m interested in the contradictions. Nobody is just one thing. It''s the friction between a person''s public face and private struggles where the real drama lies."\n\nExploring these contradictions is what keeps me in love with acting. I want to thank the brilliant directors, writers, and crews who build these worlds. And thank you, the community, for joining me in exploring these complex souls.');

-- Upcoming Events
INSERT INTO upcoming_events (id, day, month, title, location, time, description) VALUES
('event-1', '28', 'JUL', 'Live Q&A with Gillian', 'Virtual Event', '4:00 PM GMT', 'An exclusive digital gathering for official community members. Gillian will sit down to answer submitted questions directly in an intimate, live-streamed conversation.'),
('event-2', '15', 'AUG', 'The X-Files 30th Anniversary Retrospective', 'London, UK', '7:00 PM GMT', 'A special commemorative panel and screening event, followed by a live discussion with Gillian Anderson, creators, and surprise guest stars.'),
('event-3', '10', 'SEP', 'SAYes Mentoring Charity Dinner', 'Cape Town, South Africa', '6:30 PM SAST', 'Our annual private fundraising dinner to support youth mentoring and education. 100% of proceeds are transferred directly to mentoring program partners.');

-- Shop Products
INSERT INTO shop_products (id, name, category, price, rating, image_placeholder, description, details, stock) VALUES
('pencil-set', 'Scully Forensic Stylus & Magnifier', 'Collectibles', 24.99, 4.8, '🔬', 'Inspired by a legendary standard of forensic investigation. Includes a metallic tactical pen and optical-grade card magnifier inside a laser-etched case.', ARRAY['Laser-etched protective investigator steel case', 'Optical-grade custom reading lens', 'A tribute to scientific inquiry'], 'In Stock'),
('gillian-book', 'We Manifesto Hardcover (Signed)', 'Literary', 49.00, 4.9, '📚', 'The ultimate guide to collective strength and self-worth, personally signed by Gillian Anderson. Features custom gilded edges and a protective luxury dust jacket.', ARRAY['Hand-signed inside title page by Gillian', 'Gold gilt edges with linen binding', 'All royalties benefit youth mentorship'], 'In Stock'),
('be-kind-hoodie', 'Signature ''Connection'' Hoodie', 'Apparel', 75.00, 4.7, '🧥', 'Crafted from heavy 450GSM organic French terry cotton. Embroidered in custom gold lettering with Gillian''s reminder: ''Connection is a superpower. Every child deserves mentorship.''', ARRAY['100% organic cotton French terry', 'Gold embroidery signature script detailing', 'Oversized vintage fit with ribbed side panels'], 'In Stock'),
('scully-retro-tee', 'The X-Files Nostalgia Retro Tee', 'Apparel', 34.99, 4.6, '👽', 'Celebrate the science fiction legacy with the official retro t-shirt of Gillian Anderson''s iconic role as Agent Scully. Heavyweight vintage-washed fabric for a lived-in feel.', ARRAY['100% combed ringspun cotton', 'Distressed vintage screen-printed graphic', 'Made with sustainable zero-waste ink'], 'In Stock');

-- FAQ Entries
INSERT INTO faq_entries (id, question, answer, category, sort_order) VALUES
('faq-sayes', 'What is SA-YES and how does Gillian support it?', 'SA-YES (South African Youth Education for AIDS) was co-founded by Gillian Anderson in 2005. It is a charity dedicated to mentoring marginalized youth transitioning out of children''s homes in South Africa, providing them with guidance, resources, and pathways to independent adult lives. 100% of the net proceeds from specific official campaign items and store merchandise support SA-YES programs directly.', 'advocacy', 1),
('faq-scully', 'What is ''The Scully Effect'' and how did it impact society?', 'The Scully Effect refers to the real-world phenomenon where the character of Special Agent Dana Scully on ''The X-Files'' inspired a significant increase in women pursuing degrees and careers in science, technology, engineering, and mathematics (STEM). A 2018 study confirmed that women who watched the show regularly were 50% more likely to work in STEM fields, highlighting the immense power of authentic representation on television.', 'career', 2),
('faq-want', 'Tell us more about her book ''Want'' and the letters within it.', 'Gillian''s groundbreaking book ''Want'' is a curated collection of hundreds of anonymous letters submitted by women from all corners of the globe. These letters candidly explore their private desires, relationships, fantasies, and hidden experiences. It creates an intimate, liberating, and judgment-free archive designed to dismantle historic taboos and empower open conversation about feminine sexuality.', 'community', 3),
('faq-gspot', 'What are ''G-Spot'' functional soft drinks and their active ingredients?', 'G-Spot is Gillian''s official range of functional soft drinks, formulated using natural botanicals, adaptogens, and active extracts. The drinks come in four functional blends—Lift (for cognitive focus and mental energy), Soothe (for stress-relief and calm), Purify (for daily body rejuvenation and digestion support), and Arouse (for sensory awakening and elevation). They are crafted without artificial preservatives or refined sugars.', 'g-spot', 4),
('faq-membership', 'How can I participate in official community experiences and events?', 'Co-op members and community tier subscribers can apply directly for digital and offline Experiences, private live-streamed conclaves, and interactive group chats with Gillian. All applications are managed through the official digital Fan Portal, where users can also participate in forums, read exclusive journal entries, and track their community contributions.', 'community', 5),
('faq-nf', 'What is Gillian''s advocacy role with Neurofibromatosis (NF)?', 'For decades, Gillian has been a committed, active patron of the Children''s Tumor Foundation (CTF) and Neurofibromatosis Association. Inspired by her late brother Aaron, who lived with NF, she has testified before the United States Congress to advocate for federal research funding and continues to lead campaigns that provide support and visibility for families affected by the condition.', 'advocacy', 6);

-- Charity Causes
INSERT INTO charity_causes (id, title, category, description, goal, raised, progress) VALUES
('cause-1', 'SAYes Mentoring Transition Grants', 'YOUTH ADVOCACY', 'Funding transition pathways, education, and steady mentorship for youth transitioning out of state care in South Africa.', '$500,000', '$412,890', 82),
('cause-2', 'West End Young Actors Co-op', 'DRAMATIC ARTS', 'Creating vibrant, fully-funded spaces and mentorship for underprivileged aspiring actors on London''s West End stages.', '$250,000', '$198,400', 79),
('cause-3', 'We Manifesto Self-Worth Circles', 'WOMEN SUPPORT', 'Supporting global community workshops and accessible self-worth programs focused on the principles of the "We" Manifesto.', '$150,000', '$112,000', 74);

-- Charity Partners
INSERT INTO charity_partners (id, name, description, focus) VALUES
('sayes-mentoring', 'SAYes Mentoring Support', 'Empowering youth in care through structured mentoring, assisting transitions to independent living and stable careers.', 'Youth Mentorship'),
('young-actors', 'West End Young Actors Co-op', 'Dedicated to promoting diversity and equal access on London''s classical theater stages through youth workshop grants.', 'Dramatic Arts'),
('we-manifesto', 'We Manifesto Circles', 'Providing counseling resources, books, and self-worth workshops designed around female empowerment and collective support.', 'Women Advocacy');

-- Membership Tiers (unified from modal + section)
INSERT INTO membership_tiers (id, name, price, icon_color, bg_color, border_color, benefits, sort_order) VALUES
('bronze', 'Bronze Supporter', 'Free', 'text-neutral-400', 'from-neutral-900 to-neutral-950', 'border-neutral-800', ARRAY['Access to public official forum community', 'Read official weekly journal logs', 'Submit questions to ''Ask Gillian'''], 1),
('silver', 'Silver Guardian', '$5/mo', 'text-slate-300', 'from-neutral-900 to-neutral-950', 'border-neutral-700', ARRAY['Everything in Bronze Supporter', 'All dues go directly to SAYes Youth Mentoring', 'Official Digital Guardian badge', 'Access to localized Country Clubs'], 2),
('gold', 'Gold Ambassador', '$15/mo', 'text-amber-400', 'from-amber-950/10 to-neutral-950', 'border-amber-500/20', ARRAY['Everything in Silver Guardian', 'Participate in live group Q&A webcasts', 'Early notifications of real-world experiences', 'Digital Membership Card'], 3),
('platinum', 'Platinum Visionary', '$50/mo', 'text-cyan-400', 'from-cyan-950/10 to-neutral-950', 'border-cyan-500/20', ARRAY['Everything in Gold Ambassador', 'Priority consideration in Request Gateway review', 'Invites to official private virtual gatherings', 'Direct chat support connection with Sarah (MGT)'], 4),
('legend', 'Legend Patron', '$100/mo', 'text-gold-500', 'from-gold-500/5 to-neutral-950', 'border-gold-500/30', ARRAY['Everything in Platinum Visionary', 'Elite Direct Channel access token', 'Guaranteed seat at annual official Charity Gala', 'Dedicated management VIP liaison setup'], 5);

-- Experiences
INSERT INTO experiences (id, title, duration, location, intensity, capacity, description, details) VALUES
('exp-1', 'West End Stage: Private Acting Masterclass', '2 Days', 'London, UK', 'High Intensity', '2 Fans per session', 'Train with actual West End directors and Gillian Anderson. Learn character posture, vocal projection, emotional depth, and rehearse an intense scene together on stage.', ARRAY['Vocal projection & cadence training', 'Physical presence & emotional breathing mechanics', 'Intimate character table reading', 'Professional video of your staged dialogue']),
('exp-2', 'The X-Files: Sci-Fi Forensic Hunt', '3 Days', 'Vancouver, BC', 'Medium Intensity', '3 Fans per session', 'Join a mock forensic investigative team in the Pacific Northwest woods. Analyze scientific anomalies and practice skeptic forensic investigations guided by Agent Scully''s analytical principles.', ARRAY['Mock crime scene investigation & evidence gathering', 'Skeptical scientific methodology seminar', 'Rain-soaked night tracking exercises', 'Commemorative FBI-styled badge and field file']),
('exp-3', 'SAYes Mentoring: Cape Town Retreat', '5 Days', 'Cape Town, SA', 'Low Intensity', '2 Fans per session', 'Join Gillian Anderson and the executive team of SAYes in South Africa. Participate in mentoring workshops, meet care transitioning youth, and attend their private annual fundraiser gala.', ARRAY['Mentorship certification & training workshop', 'Co-designing youth transition pathways', 'Round-table dinner with Gillian and SAYes directors', 'VIP access to the Cape Town Gala']),
('exp-4', 'We Manifesto: Cozy Literary Dialogue', '1 Day', 'London, UK', 'Low Intensity', '4 Fans per session', 'Sit down with Gillian Anderson and co-author Jennifer Nadel in a cozy private London library. Read excerpts, discuss the nine principles of self-worth, and explore women''s advocacy.', ARRAY['Private book circle reading & discussion', 'Guided self-compassion exercises', 'Afternoon tea and personal Q&A', 'Signed deluxe edition of the "We" Manifesto']);

-- Films Data
INSERT INTO films_data (title, role, year, tagline, revenue, trivia, icon, stunt_detail, sort_order) VALUES
('The X-Files Franchise', 'Special Agent Dana Scully', '1993 - 2018', 'The truth is out there.', '2 Emmy awards + 200+ episodes', 'Gillian''s character Agent Dana Scully single-handedly inspired a massive, documented real-world increase of women pursuing degrees and careers in STEM fields—a phenomenon celebrated as ''The Scully Effect''. Gillian had to fight for equal pay multiple times on the show.', '👽', 'Mastered medical jargon, skeptical analysis, trench coat running, and flashlight investigation in dark woods.', 1),
('The Fall', 'Stella Gibson', '2013 - 2016', 'That''s why a woman is more suited to it.', 'Highly Acclaimed BBC Series', 'Gillian praised the role of Stella because she was unapologetically female, highly logical, comfortable with her power, and challenged double standards in policing and relationships. Gibson is considered one of TV''s finest feminist icons.', '🕵️‍♀️', 'Mastered quiet authority, intensive psychological interrogation, and cold, methodical analytical investigation.', 2),
('Sex Education', 'Dr. Jean Milburn', '2019 - 2023', 'It''s about open, honest, judgment-free discussion.', 'Netflix International Phenomenon', 'Jean''s character was beloved for her warm, open, and hilariously direct conversations on sexual health. Gillian co-designed the colorful and eccentric aesthetic of Jean''s beautiful forest home.', '🍒', 'Pioneered warm, open, comedic dialogue and authentic representation of complex motherhood.', 3),
('The Crown', 'Margaret Thatcher', '2020', 'I have no intention of changing.', 'Emmy & Golden Globe Winner', 'To capture Margaret Thatcher''s distinct, raspy speaking style and posture, Gillian spent months working with vocal coaches and researching historical footage. She transformed her appearance entirely to portray ''The Iron Lady''.', '👑', 'Mastered Thatcher''s distinct cadence, rigid posture, and formidable political presence.', 4),
('A Streetcar Named Desire', 'Blanche DuBois', '2014 - 2016', 'I don''t want realism. I want magic!', 'Olivier Award Nominated Stage Run', 'Gillian''s intense, heartbreaking portrayal of Blanche DuBois on a rotating stage in London''s Young Vic and Brooklyn''s St. Ann''s Warehouse was hailed as one of the defining theatrical performances of the decade.', '🎭', 'Delivered exhausting, high-intensity 3-hour live performances with raw emotional vulnerability.', 5);

-- Literary Works
INSERT INTO literary_works (title, duration, vibe, sort_order) VALUES
('We: A Manifesto for Women', '3:45', 'An inspiring guide to life, self-worth, and compassion', 1),
('A Vision of Fire', '4:12', 'Thrilling science-fiction co-authored with Jeff Rovin', 2),
('Want (Curated Letters)', '5:10', 'A brave, liberating exploration of female desire', 3),
('The House of Mirth Excerpt', '2:55', 'Edith Wharton''s classic audio narration', 4);

-- Kindness Log
INSERT INTO kindness_log (title, category, description, quote, sort_order) VALUES
('Fought and Won Equal Pay Equity', 'stunts', 'Gillian found out she was offered half David Duchovny''s salary for the X-Files reboot in 2016. She refused, fought for pay equity, and won equal compensation, using her platform to highlight the gender wage gap.', 'It was a shock, given all the work I''d done in the past. But I stood my ground because it was the right thing to do.', 1),
('SAYes Youth Mentoring Co-Founder', 'charity', 'Gillian co-founded SAYes Mentoring in South Africa to match vulnerable, underrepresented youth transitioning out of care homes with positive adult mentors, preparing them for independent lives.', 'Mentoring provides a vital bridge for youth who have grown up in care, giving them the support and skills they need to thrive.', 2),
('Advocating for Neurofibromatosis Research', 'charity', 'Gillian is an active, long-term patron of the Children''s Tumor Foundation, testifying in front of the US Congress to advocate for federal funding for Neurofibromatosis research, a cause close to her heart.', 'My brother Aaron''s courage inspired me to use my voice. We must find a cure for NF and support these brave families.', 3),
('Empowering Women with ''We'' Manifesto', 'fans', 'Gillian co-wrote the book ''We'' to offer women a practical, empathetic roadmap for navigating mental health, self-compassion, and building meaningful supportive communities globally.', 'We wanted to create a non-judgmental guide that says: you are not alone, and your vulnerability is actually your greatest power.', 4),
('Breaking Desire Taboos with ''Want''', 'fans', 'Gillian curated ''Want'', a collection of anonymous letters from women around the world describing their private desires, creating a safe, liberating space to dismantle age-old taboos.', 'By sharing our most intimate, hidden thoughts, we free ourselves and each other from shame and expectation.', 5),
('Warm and Generous Fan Engagement', 'fans', 'At comic cons and stage doors, Gillian is famous for dedicating extra hours to listen to fan stories, especially young women who chose scientific careers because of Dana Scully.', 'Hearing women tell me they became scientists or doctors because of Scully is the most rewarding part of my career.', 6);

-- Quiz Questions
INSERT INTO quiz_questions (question, options, correct, explanation) VALUES
('Which iconic character played by Gillian Anderson inspired a massive, real-world increase of women pursuing STEM careers?', ARRAY['Stella Gibson (The Fall)', 'Dr. Jean Milburn (Sex Education)', 'Special Agent Dana Scully (The X-Files)', 'Margaret Thatcher (The Crown)'], 2, 'Dana Scully''s analytical, scientific character inspired what is widely documented as the ''Scully Effect'', motivating a generation of women to study and work in STEM.'),
('Which charity did Gillian Anderson co-found to support vulnerable youth transitioning out of care?', ARRAY['SAYes Mentoring', 'The Scully STEM Foundation', 'PETA UK', 'The Children''s Tumor Fund'], 0, 'Gillian co-founded SAYes Mentoring in South Africa, matching youth transitioning from care homes with supportive adult mentors.'),
('For her portrayal of Margaret Thatcher in ''The Crown'', which prestigious awards did Gillian Anderson win?', ARRAY['An Emmy and a Golden Globe', 'A Tony and an Olivier', 'An Oscar and a BAFTA', 'All of the above'], 0, 'Gillian''s brilliant and deeply researched portrayal of Margaret Thatcher won her both the Primetime Emmy Award and the Golden Globe Award.');

-- Donations
INSERT INTO donations (name, amount, message, created_at) VALUES
('Anonymous Seeker', 250, 'In honor of our youth, let''s make a more supportive world.', NOW() - INTERVAL '3 hours'),
('XFilesGlitch_01', 50, 'Support youth mentorship! Gillian is a legend.', NOW() - INTERVAL '5 hours'),
('CapeTownDreamer', 100, 'Together we stand for youth transitions and mentorship.', NOW() - INTERVAL '1 day');

-- Portal Events
INSERT INTO portal_events (id, title, type, event_date, location, registered, ticket_ref) VALUES
('ev1', 'SAYes Mentoring Cape Town Summit', 'Youth Mentoring', 'July 12, 2024 - 08:00 AM', 'Cape Town, South Africa', FALSE, NULL),
('ev2', 'West End Theatre Backstage Masterclass', 'Studio Experience', 'August 19, 2024 - 02:00 PM', 'London, UK', FALSE, NULL),
('ev3', 'SAYes Annual Charity Gala Dinner', 'Charity Dinner', 'September 15, 2024', 'London, UK', FALSE, NULL),
('ev4', 'Global Virtual Q&A & Compassion Circle', 'Virtual Panel', 'Weekly on Thursdays - 18:00 UTC', 'Direct Portal Video', TRUE, 'GA-TKT-582914');

-- Fan Creations
INSERT INTO fan_creations (id, title, category, author, description, likes, has_liked) VALUES
('c1', 'Agent Scully Vector Portrait', 'Fan Art', 'LA_Artist', 'A custom vector portrait inspired by the X-Files and sci-fi themes.', 24, FALSE),
('c2', 'My Journey Supporting Youth Mentoring', 'Fan Story', 'John Smith', 'How Gillian''s charity inspired me to start a mentoring team in my city.', 118, TRUE);

-- Fan Creation Comments
INSERT INTO fan_creation_comments (id, creation_id, author, text, avatar) VALUES
('fc1', 'c1', 'Scully_Seeker', 'This vector art is jaw-dropping! Truly represents the Agent Scully vibe.', '🔬'),
('fc2', 'c2', 'BeCompassionate', 'Thank you for sharing your story. Gillian''s benevolence has a huge ripple effect.', '📚');

-- Fan Creation Reactions
INSERT INTO fan_creation_reactions (creation_id, emoji, count) VALUES
('c1', '🔬', 12), ('c1', '🕯️', 4), ('c1', '📚', 2), ('c1', '👽', 6),
('c2', '❤️', 35), ('c2', '🔬', 10), ('c2', '👽', 3);

-- User Badges
INSERT INTO user_badges (id, title, description, earned_date, icon) VALUES
('b1', 'Verified Fan Badge', 'Securely registered email on platform', 'May 10, 2024', '🛡️'),
('b2', 'Kindness Advocate', 'Shared direct cancer support story', 'May 11, 2024', '❤️'),
('b3', 'Gold Tier Status', 'Active Ambassador access verified', 'May 15, 2024', '👑'),
('b4', 'Early Supporter', 'Participated in launch week bridge', 'May 10, 2024', '🌟');

-- Journey Log
INSERT INTO journey_log (id, title, log_date, description, color) VALUES
('j4', 'Submitted First Proposal: Meet & Greet', 'May 15, 2024', 'Your request for a private meeting with Gillian Anderson was submitted.', 'bg-green-500'),
('j3', 'Upgraded to Gold Ambassador', 'May 15, 2024', 'Dues verified, direct youth transition mentoring funding confirmed.', 'bg-green-500'),
('j2', 'Verified Security Access Key', 'May 10, 2024', 'Encrypted sanctuary clearance token successfully generated and assigned.', 'bg-green-500'),
('j1', 'Joined Official Platform', 'May 10, 2024', 'Connection successfully authorized and profile verified.', 'bg-green-500');

-- Communication Logs
INSERT INTO communication_logs (id, request_id, member, method, last_contact, by, notes, next_action) VALUES
('COM-000568', 'GA-REQ-000145', 'John Smith', 'WhatsApp', '20 min ago', 'Admin', 'Discussed details and availability.', 'Awaiting fan response'),
('COM-000567', 'GA-REQ-000142', 'Sophie Martin', 'Email', '1 hour ago', 'Admin', 'Sent interview guidelines.', 'Awaiting confirmation'),
('COM-000566', 'GA-REQ-000139', 'Michael Chen', 'Telegram', '3 hours ago', 'Admin', 'Shared payment instructions.', 'Awaiting payment receipt');

-- Admin Events
INSERT INTO admin_events (id, day, month, title, event_type, registered, location, event_time) VALUES
('ae1', '24', 'MAY', 'Live Q&A with Gillian', 'Virtual Event', '2,450', 'Virtual', '10:00 AM PST'),
('ae2', '28', 'MAY', 'The X-Files Nostalgia Panel', 'Los Angeles, USA', '890', 'Los Angeles, USA', '06:00 PM PST'),
('ae3', '02', 'JUN', 'Charity Gala Dinner', 'London, UK', '320', 'London, UK', '07:30 PM GMT'),
('ae4', '10', 'JUN', 'Fan Meet & Greet', 'New York, USA', '150', 'New York, USA', '02:00 PM EST');

-- Admin Notifications
INSERT INTO admin_notifications (id, text, status, notif_time) VALUES
('an1', 'New Meet & Greet Request GA-REQ-000145 from John Smith', 'unread', '20 min ago'),
('an2', 'Membership Application from Maria Garcia pending review', 'unread', '1 hour ago'),
('an3', 'Payment verification needed for Order GA-SHP-000285', 'unread', '2 hours ago'),
('an4', 'Security guidelines update uploaded for Los Angeles Event', 'unread', '1 day ago');

-- Channel Messages
INSERT INTO channel_messages (id, channel, sender, text, created_at) VALUES
('cm-m1', 'management', 'management', 'Hello, this is Sarah from Gillian''s official representation team. We have received your Meet & Greet proposal. Gillian is very touched by your youth mentoring support story.', NOW() - INTERVAL '2 days'),
('cm-m2', 'management', 'user', 'Hi Sarah! Thank you so much for reaching out. It is an absolute dream of mine. I have been supporting youth mentorship for five years, inspired directly by Gillian''s quiet benevolence.', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
('cm-m3', 'management', 'management', 'That is wonderful to hear. We are currently mapping out some private slots around her charity summit schedule in July. Could you confirm if you will be in London during the entire second week of July?', NOW() - INTERVAL '1 day'),
('cm-m4', 'management', 'user', 'Yes, absolutely! I can arrange my travel to match any day or time that works best for Gillian. I will also be attending the charity screening.', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
('cm-e1', 'events', 'management', 'Welcome to the Event Coordination Desk. Registered members can request access codes and schedule digital/physical entry passes here.', NOW() - INTERVAL '3 days'),
('cm-v1', 'vault', 'management', 'Vault Logistics Desk active. We verify physical product certificates, shipping couriers, and state synchronization.', NOW() - INTERVAL '4 days');

-- Fan Notifications
INSERT INTO fan_notifications (id, text, notif_time, unread) VALUES
('fn1', 'Sarah (Management) updated your request status to In Discussion.', 'May 20, 2024', TRUE),
('fn2', 'You received 500 bonus loyalty points for upgrading to Gold Member.', 'May 15, 2024', FALSE),
('fn3', 'Your monthly video message from Gillian is available to stream.', 'May 10, 2024', FALSE);

-- Site Pillars
INSERT INTO site_pillars (id, title, icon_name, description, action_text, sort_order) VALUES
('pillar-1', 'Media Vault', 'Film', 'Watch exclusive videos and explore the photo gallery.', 'Explore Media', 1),
('pillar-2', 'Community', 'Users', 'Join fan discussions and share your creative work.', 'Join Co-op', 2),
('pillar-3', 'Experiences', 'Star', 'Apply for private sessions and real-world events.', 'Browse Experiences', 3),
('pillar-4', 'Journal', 'BookOpen', 'Read personal essays and behind-the-scenes perspectives.', 'Read Journal', 4),
('pillar-5', 'Shop', 'ShoppingBag', 'Browse exclusive collectibles and signature apparel.', 'Visit Shop', 5),
('pillar-6', 'Charity', 'Heart', 'Support mentoring and advocacy causes.', 'Support Causes', 6);

-- Request Types
INSERT INTO request_types (id, label, description, sort_order) VALUES
('rt-1', 'Meet & Greet', 'Private meeting or greeting with Gillian', 1),
('rt-2', 'Birthday Greeting', 'Personalized video birthday greeting', 2),
('rt-3', 'Video Message', 'Custom video message for an event or cause', 3),
('rt-4', 'Interview Request', 'Media or academic interview request', 4),
('rt-5', 'Business Inquiry', 'Partnership or collaboration proposal', 5),
('rt-6', 'Charity Appearance', 'Request for charity event attendance', 6),
('rt-7', 'Stage Door', 'Backstage or stage door meet安排', 7),
('rt-8', 'Virtual Q&A', 'Private virtual question and answer session', 8),
('rt-9', 'Autograph Request', 'Signed photo or memorabilia request', 9),
('rt-10', 'Fan Art Showcase', 'Submit fan art for official recognition', 10),
('rt-11', 'Podcast Interview', 'Audio or video podcast feature request', 11),
('rt-12', 'Book Club', 'Private book reading or discussion', 12),
('rt-13', 'Convention Panel', 'Request for convention appearance', 13),
('rt-14', 'Documentary', 'Film or documentary participation request', 14),
('rt-15', 'Other', 'Any other type of request', 15);

-- Experience Requests
INSERT INTO experience_requests (id, experience_title, story, status, status_text, submitted_date) VALUES
('req-initial-1', 'West End Stage: Private Acting Masterclass', 'I have been studying dramatic theater for over ten years and have always dreamed of learning character posture and physical presence from Gillian Anderson.', 'reviewing', 'Under Artistic Review', 'May 10, 2024'),
('req-initial-2', 'SAYes Mentoring: Cape Town Retreat', 'Looking to launch a youth transition shelter in my city. Cooperating and getting advice from Gillian and the SAYes team in South Africa would complete this vision.', 'approved', 'Scheduling Consultation', 'April 22, 2024');
