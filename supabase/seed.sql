-- Seed data for the community pages
-- 160 total entries across all community tables
-- Warm, authentic data for a Gillian Anderson fan community
-- Safe to re-run (uses ON CONFLICT DO NOTHING for all inserts)

-- ──────────────────────────────────────────────────────────
-- POSTS — Batch 1 (12) — Community highlights
-- ──────────────────────────────────────────────────────────
INSERT INTO posts (id, username, handle, avatar_text, image, content, likes, replies_count, liked, category, created_at) VALUES
('seed-post-01', 'LunaStarling', '@luna_scribes', 'LU', '', 'Digital watercolor tribute to Dana Scully — I wanted to capture her quiet strength and the way she looked at the unknown not with fear, but with determined curiosity. Every brushstroke felt like a conversation with a character who shaped so many of us.', 47, 3, false, 'FAN ART', '2026-07-01 14:23:00+00'),
('seed-post-02', 'StellaFan', '@stella_admirer', 'ST', '', 'A charcoal study of Stella Gibson. There is something about the way she holds a room — still, watchful, completely in command. I tried to put that into the shading and the set of her jaw. Would love feedback from fellow fans.', 32, 2, false, 'FAN ART', '2026-07-03 09:15:00+00'),
('seed-post-03', 'BlueOrchid', '@blue_orchid', 'BL', '', 'A collage of Gillian''s characters through the years — Scully, Stella, Jean, Margaret, and Media. Each one taught me something different about what it means to be a woman with conviction. Which version of her speaks most to you?', 61, 3, false, 'FAN ART', '2026-07-05 18:42:00+00'),
('seed-post-04', 'ScullysHeart', '@scully_believer', 'SH', '', 'Reimagined the X-Files poster with Scully front and center — because she was never just the skeptic. She was the heart of that show, the one who kept Mulder grounded while daring to explore the unknown herself.', 53, 1, false, 'FAN ART', '2026-07-08 11:30:00+00'),
('seed-post-05', 'KindredSpirit', '@kindred_wanderer', 'KI', '', 'An open letter of gratitude for your mentorship work with SAYes. Dear Gillian, thank you for showing us that fame can be a platform for lifting others. Your commitment to young people transitioning out of care is a beacon of what humanity should look like. You make the world smaller and kinder.', 89, 4, false, 'LETTERS', '2026-06-28 20:00:00+00'),
('seed-post-06', 'TheFallFan', '@stella_gibson_fan', 'TH', '', 'How The Fall helped me find my own voice. Before watching The Fall, I struggled to speak up in meetings, to hold my ground. Stella Gibson walked into those rooms with such quiet authority that it shifted something in me. I started asking for what I deserved. Representation matters — even fictional characters can change your life.', 104, 3, false, 'LETTERS', '2026-06-25 16:10:00+00'),
('seed-post-07', 'ScullysHeart', '@scully_believer', 'SH', '', 'To the woman who taught me skepticism and wonder. Growing up, I was told science and faith couldn''t coexist. Then I met Dana Scully — a medical doctor who believed in evidence but also in the possibility of something more. Gillian, you brought that contradiction to life with such grace. Thank you for teaching an entire generation to question everything, including our own doubts.', 77, 2, false, 'LETTERS', '2026-07-10 22:45:00+00'),
('seed-post-08', 'WestEndDreamer', '@stage_lights', 'WE', '', 'Thank you for being unapologetically yourself. In an industry that asks women to shrink, you stand tall. Whether it is speaking about menopause openly, advocating for mentoring, or simply existing as a complex human being on screen — you give us permission to do the same. That is a gift beyond measure.', 95, 1, false, 'LETTERS', '2026-07-12 08:30:00+00'),
('seed-post-09', 'WestEndDreamer', '@stage_lights', 'WE', '', 'The night I met Gillian at the stage door after A Streetcar Named Desire. Her Blanche was devastating — raw, fragile, magnificent. When she came out, she was still visibly moved, yet she stopped for every single person waiting. She held my hand and said thank you for being here. I cried the whole way home. Some moments mark you forever.', 132, 4, false, 'ENCOUNTERS', '2026-06-20 21:30:00+00'),
('seed-post-10', 'MentorHeart', '@sayes_supporter', 'ME', '', 'At a SAYes Mentoring gala in 2023, Gillian spoke about a young woman who, through mentoring, found the courage to apply for university. She remembered her name. She remembered her story. That is not performance — that is a person who genuinely cares. I left that event and signed up as a mentor myself. One conversation can change everything.', 78, 2, false, 'ENCOUNTERS', '2026-07-02 14:00:00+00'),
('seed-post-11', 'LunaStarling', '@luna_scribes', 'LU', '', 'I queued for five hours at her book signing for ''We''. It was freezing, my feet hurt, and I would do it again in a heartbeat. She looked every single person in the eye, asked their name, wrote a personal message. When it was my turn, I forgot every word I had planned. I just said thank you. She smiled and said thank you right back. Perfection.', 55, 2, false, 'ENCOUNTERS', '2026-07-06 15:45:00+00'),
('seed-post-12', 'CrownWatcher', '@thatcher_study', 'CR', '', 'A rainy Tuesday afternoon in a small London coffee shop in Notting Hill. I was reading a script for a community theatre production when I heard a familiar voice ordering a flat white. I looked up and there she was — no entourage, no fuss, just waiting for her coffee like any other Londoner. I did not approach because some moments are better left undisturbed. But I smiled to myself for the rest of the day.', 66, 2, false, 'ENCOUNTERS', '2026-07-09 12:15:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- POSTS — Batch 2 (10) — More stories, wider date spread
-- ──────────────────────────────────────────────────────────
INSERT INTO posts (id, username, handle, avatar_text, image, content, likes, replies_count, liked, category, created_at) VALUES
('seed-post-13', 'BlueOrchid', '@blue_orchid', 'BL', '', 'Oil painting study of Gillian as Margaret Thatcher. The prosthetics, the posture, the voice — she disappeared into the role so completely that I forgot I was watching someone I have admired for decades. That is the mark of a truly transformative actor.', 39, 2, false, 'FAN ART', '2026-05-18 16:30:00+00'),
('seed-post-14', 'MentorHeart', '@sayes_supporter', 'ME', '', 'A digital sketch of Jean Milburn in her element — coffee in hand, a knowing smile, ready to dismantle someone''s shame with a single compassionate sentence. Gillian made Jean look effortless, but that kind of warmth takes immense skill.', 44, 1, false, 'FAN ART', '2026-05-25 11:00:00+00'),
('seed-post-15', 'TheFallFan', '@stella_gibson_fan', 'TH', '', 'Pen and ink illustration of the iconic interrogation scene from The Fall. The way Stella sits in complete stillness while chaos swirls around her — I wanted to capture that stillness. Every line is a meditation on control.', 51, 3, false, 'FAN ART', '2026-06-02 19:45:00+00'),
('seed-post-16', 'LunaStarling', '@luna_scribes', 'LU', '', 'To Gillian — a letter about bravery. I came out at 32 thanks in part to watching you live so openly and unapologetically. You never made a big statement about it, you just existed as yourself, and that quiet authenticity gave me the courage to do the same. Representation is not always loud. Sometimes it is just a woman being fully herself.', 118, 6, false, 'LETTERS', '2026-05-30 21:00:00+00'),
('seed-post-17', 'CrownWatcher', '@thatcher_study', 'CR', '', 'I wrote to Gillian after watching The Crown and told her that her portrayal of Margaret Thatcher helped me understand my own mother for the first time. I never expected a reply. But her team sent back a handwritten note on her behalf. I keep it in my copy of ''We''. Some kindnesses you never forget.', 87, 4, false, 'LETTERS', '2026-06-05 10:30:00+00'),
('seed-post-18', 'StellaFan', '@stella_admirer', 'ST', '', 'Dear Gillian, thank you for teaching me that ambition is not a dirty word. For so long I thought wanting more — a better career, a louder voice, a seat at the table — made me difficult. Then I watched you build a career on your own terms and realised that difficult women change the world.', 73, 3, false, 'LETTERS', '2026-06-12 14:15:00+00'),
('seed-post-19', 'KindredSpirit', '@kindred_wanderer', 'KI', '', 'I served canapés at a BAFTA after-party in 2019 and nearly dropped an entire tray when I saw Gillian Anderson walk past. She caught my eye, smiled, and said ''steady hands'' with such warmth that I forgot to be nervous. I have been a fan since I was 14. That single moment was worth every year of waiting.', 145, 5, false, 'ENCOUNTERS', '2026-05-15 20:00:00+00'),
('seed-post-20', 'ScullysHeart', '@scully_believer', 'SH', '', 'Gillian once replied to my fan letter with a Polaroid of herself holding my drawing. It is framed above my desk. Every time I look at it I am reminded that the people we admire from afar are real human beings who choose kindness when no one is watching. That Polaroid is my most treasured possession.', 99, 3, false, 'ENCOUNTERS', '2026-06-18 17:00:00+00'),
('seed-post-21', 'BlueOrchid', '@blue_orchid', 'BL', '', 'Spotted Gillian at the V&A museum in London browsing the photography exhibit. She was wearing a simple grey coat and glasses, completely incognito. I walked past her three times before I realised. She caught me staring and gave a tiny, knowing smile. I smiled back and kept walking. Some encounters are better as a quiet exchange between strangers.', 71, 2, false, 'ENCOUNTERS', '2026-07-19 14:30:00+00'),
('seed-post-22', 'TheFallFan', '@stella_gibson_fan', 'TH', '', 'Attended a panel discussion at the BFI where Gillian spoke about the future of female-led crime dramas. She was articulate, passionate, and funny. At one point she imitated Stella Gibson''s walk and the whole room erupted. Afterward, she stayed for forty minutes answering questions. I asked about the responsibility of playing a feminist icon and she looked me in the eye and said ''it is not a responsibility I take lightly''. Chills.', 83, 2, false, 'ENCOUNTERS', '2026-07-20 19:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- COMMENTS — Batch 1 (18) — including replies
-- ──────────────────────────────────────────────────────────
INSERT INTO comments (id, post_id, parent_comment_id, username, avatar_text, content, created_at) VALUES
('seed-cmt-01', 'seed-post-01', NULL, 'StellaFan', 'ST', 'This is absolutely stunning. The way you captured the light in her eyes — it is like you painted her curiosity itself. Do you sell prints?', '2026-07-01 15:00:00+00'),
('seed-cmt-02', 'seed-post-01', 'seed-cmt-01', 'LunaStarling', 'LU', 'Thank you so much! It took about eight hours spread over three evenings. I am working on setting up an Etsy shop actually — I will post here when it is ready!', '2026-07-01 16:20:00+00'),
('seed-cmt-03', 'seed-post-01', NULL, 'BlueOrchid', 'BL', 'Watercolor was the perfect choice for her. There is something ethereal about Scully and this medium captures that so beautifully.', '2026-07-02 09:10:00+00'),
('seed-cmt-04', 'seed-post-02', NULL, 'TheFallFan', 'TH', 'Charcoal was the perfect medium for Stella. The grayscale mirrors the moral complexity of the show. The jawline shading is extraordinary.', '2026-07-03 11:00:00+00'),
('seed-cmt-05', 'seed-post-02', NULL, 'ScullysHeart', 'SH', 'You have captured her stillness perfectly. Stella was a character who moved less but communicated more than anyone else on screen.', '2026-07-04 08:30:00+00'),
('seed-cmt-06', 'seed-post-03', NULL, 'KindredSpirit', 'KI', 'Seeing them all together like this is powerful. Each character represents a different facet of Gillian''s range. My heart belongs to Scully, but Jean from Sex Education is a close second.', '2026-07-05 20:00:00+00'),
('seed-cmt-07', 'seed-post-03', 'seed-cmt-06', 'BlueOrchid', 'BL', 'It was emotional to make, honestly. Each cut felt like revisiting an old friend. And yes — Jean Milburn is a whole mood!', '2026-07-05 21:15:00+00'),
('seed-cmt-08', 'seed-post-03', NULL, 'CrownWatcher', 'CR', 'Missing her Margaret Thatcher here! Her portrayal in The Crown was transformative. But this collage is gorgeous work.', '2026-07-06 10:00:00+00'),
('seed-cmt-09', 'seed-post-05', NULL, 'LunaStarling', 'LU', 'This brought tears to my eyes. Beautifully written and so true. The SAYes work deserves all the recognition it gets.', '2026-06-28 21:00:00+00'),
('seed-cmt-10', 'seed-post-05', 'seed-cmt-09', 'KindredSpirit', 'KI', 'Thank you, I meant every single word. Knowing that others feel the same way is encouraging.', '2026-06-29 08:00:00+00'),
('seed-cmt-11', 'seed-post-05', NULL, 'MentorHeart', 'ME', 'The SAYes program is incredible. I became a mentor after hearing Gillian speak about it. It changes lives — including the mentor''s.', '2026-06-29 12:30:00+00'),
('seed-cmt-12', 'seed-post-06', NULL, 'StellaFan', 'ST', 'I had the exact same experience. Stella Gibson gave me permission to stop apologising for taking up space. So glad this show found you when it did.', '2026-06-25 18:00:00+00'),
('seed-cmt-13', 'seed-post-07', NULL, 'BlueOrchid', 'BL', 'You put into words what so many of us feel. Scully taught an entire generation that you can be both a scientist and a believer in the unexplained. That is a rare gift.', '2026-07-11 10:15:00+00'),
('seed-cmt-14', 'seed-post-09', NULL, 'CrownWatcher', 'CR', 'I was there that night too! Row G, centre. Her Blanche was absolutely devastating. When she came out I could see she was still in character — it takes such courage to be that vulnerable on stage night after night.', '2026-06-21 09:00:00+00'),
('seed-cmt-15', 'seed-post-09', 'seed-cmt-14', 'WestEndDreamer', 'WE', 'No way! What a small world. Row G is such a good view too. We were further back but honestly I did not even blink for the entire performance. She held the whole theatre in her hands.', '2026-06-21 10:30:00+00'),
('seed-cmt-16', 'seed-post-09', NULL, 'MentorHeart', 'ME', 'She really does stop for everyone at the stage door. I have seen her three times and each time she gives each person her full attention. That is not PR training — that is character.', '2026-06-22 14:00:00+00'),
('seed-cmt-17', 'seed-post-11', NULL, 'StellaFan', 'ST', 'I was in that queue too! Somewhere around the middle. It was freezing but the atmosphere was so warm — everyone was sharing stories of how her work had touched them. One of the best days of my life.', '2026-07-07 11:00:00+00'),
('seed-cmt-18', 'seed-post-12', NULL, 'TheFallFan', 'TH', 'This is the most London story I have ever read. Just let her have her flat white in peace, right? I love that you respected the moment. Some encounters are better as quiet memories.', '2026-07-09 14:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- COMMENTS — Batch 2 (14 more) spanning varied dates
-- ──────────────────────────────────────────────────────────
INSERT INTO comments (id, post_id, parent_comment_id, username, avatar_text, content, created_at) VALUES
('seed-cmt-19', 'seed-post-13', NULL, 'CrownWatcher', 'CR', 'The transformation in The Crown was astonishing. I forgot I was watching Gillian Anderson. The prosthetics helped, but it was the way she moved, the way she held her mouth — pure craft.', '2026-05-19 10:00:00+00'),
('seed-cmt-20', 'seed-post-13', 'seed-cmt-19', 'BlueOrchid', 'BL', 'Thank you! I agree — she studied Thatcher''s mannerisms for months. The attention to detail is what sets her apart.', '2026-05-19 11:30:00+00'),
('seed-cmt-21', 'seed-post-15', NULL, 'LunaStarling', 'LU', 'Pen and ink was such a smart choice for this scene. The high contrast mirrors the moral binary that The Fall constantly questions. Gorgeous work.', '2026-06-03 09:00:00+00'),
('seed-cmt-22', 'seed-post-16', NULL, 'WestEndDreamer', 'WE', 'This is one of the most beautiful letters I have ever read. Coming out is terrifying, and to have a public figure model that authenticity — it matters more than words can say. Proud of you.', '2026-05-31 10:00:00+00'),
('seed-cmt-23', 'seed-post-16', NULL, 'KindredSpirit', 'KI', 'Thank you for sharing this. Gillian''s quiet activism has paved the way for so many of us to live more honestly. You are brave and you are seen.', '2026-05-31 12:00:00+00'),
('seed-cmt-24', 'seed-post-17', NULL, 'MentorHeart', 'ME', 'The fact that her team sent a handwritten note speaks volumes about the culture she fosters. She surrounds herself with people who extend her kindness outward.', '2026-06-06 14:00:00+00'),
('seed-cmt-25', 'seed-post-18', NULL, 'TheFallFan', 'TH', '"Difficult women change the world" — I need that on a t-shirt. This is beautifully said. Ambition is only a dirty word when women have it.', '2026-06-13 11:00:00+00'),
('seed-cmt-26', 'seed-post-18', 'seed-cmt-25', 'StellaFan', 'ST', 'Ha! I would buy that t-shirt. And thank you — it took me years to unlearn the idea that wanting more made me ungrateful.', '2026-06-13 12:15:00+00'),
('seed-cmt-27', 'seed-post-19', NULL, 'ScullysHeart', 'SH', '"Steady hands" — I would have melted into a puddle on the spot. What a magical encounter. You must have replayed that moment a thousand times.', '2026-05-16 08:00:00+00'),
('seed-cmt-28', 'seed-post-19', 'seed-cmt-27', 'KindredSpirit', 'KI', 'I think about it every single day. It was three words but they felt like a benediction. She saw a nervous person and chose to be kind. That is who she is.', '2026-05-16 09:30:00+00'),
('seed-cmt-29', 'seed-post-20', NULL, 'LunaStarling', 'LU', 'A Polaroid of her holding your drawing — that is museum-level treasure. What a beautiful exchange of art and gratitude.', '2026-06-19 12:00:00+00'),
('seed-cmt-30', 'seed-post-21', NULL, 'WestEndDreamer', 'WE', 'The V&A is exactly the kind of place I would expect to find her. That tiny knowing smile is so perfectly Gillian — acknowledging the connection without breaking the moment.', '2026-07-19 16:00:00+00'),
('seed-cmt-31', 'seed-post-22', NULL, 'StellaFan', 'ST', 'I am so jealous you were at that BFI panel! Her imitation of Stella''s walk sounds incredible. She has such a playful side that the public rarely sees.', '2026-07-21 10:00:00+00'),
('seed-cmt-32', 'seed-post-22', NULL, 'CrownWatcher', 'CR', 'The way she said ''it is not a responsibility I take lightly'' — that is the mark of an actor who understands the cultural weight of her work. She knows that Stella Gibson matters to women everywhere.', '2026-07-21 11:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSIONS (8)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussions (id, country, author, text, created_at) VALUES
('seed-disc-01', 'Global', 'LunaStarling', 'What is your favourite Gillian performance and why? I will start: her Blanche DuBois in A Streetcar Named Desire. She did not play Blanche as fragile — she played her as a survivor whose illusions were the only armour she had left. It broke me and rebuilt me in the same breath.', '2026-07-04 10:00:00+00'),
('seed-disc-02', 'Global', 'KindredSpirit', 'How did you discover Gillian Anderson? For me it was The X-Files reruns late at night when I was fifteen. I had never seen a woman on television who was taken seriously as a scientist, as an authority figure, while still being allowed to be vulnerable. It changed the way I saw myself.', '2026-07-06 15:30:00+00'),
('seed-disc-03', 'USA', 'ScullysHeart', 'Any fans in the Pacific Northwest? I am in Portland and would love to connect with other local fans for a monthly meetup — could watch episodes, discuss her work, maybe even do a group outing to see a theatre production if she ever tours nearby.', '2026-07-07 20:00:00+00'),
('seed-disc-04', 'USA', 'StellaFan', 'East Coast meetup — who is interested? Thinking of organising something in New York City, perhaps in the fall. Could do a gallery walk of fan art, then a discussion group. Comment below if you would come!', '2026-07-08 18:00:00+00'),
('seed-disc-05', 'UK', 'WestEndDreamer', 'Best theatre venues to see live performances in the UK. Since Gillian has graced so many London stages, I thought we could share notes on which venues have the best acoustics, sightlines, and atmosphere. I will start: The Richmond Theatre is surprisingly intimate and the sound quality is superb.', '2026-07-09 14:00:00+00'),
('seed-disc-06', 'Canada', 'BlueOrchid', 'Canadian fans — how did you first discover The X-Files? I remember watching it on CTV on Sunday nights with my dad. It was our ritual. He passed away a few years ago and now watching Scully on screen feels like visiting an old friend who knew him too.', '2026-07-10 19:00:00+00'),
('seed-disc-07', 'Australia', 'TheFallFan', 'Down Under fans — any watch parties happening? Would love to organise a virtual or in-person watch party for The Fall or Sex Education. Melbourne based but happy to help coordinate across states.', '2026-07-11 11:00:00+00'),
('seed-disc-08', 'Japan', 'CrownWatcher', 'Gillian visited Japan for a fan event in 2019 — did anyone here go? I was living in Tokyo at the time and managed to get tickets. She was so gracious, spoke a few phrases in Japanese, and seemed genuinely moved by the warmth of the reception. Would love to hear others'' experiences.', '2026-07-12 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSIONS — Batch 2 (4 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussions (id, country, author, text, created_at) VALUES
('seed-disc-09', 'Global', 'MentorHeart', 'What is your favourite Gillian Anderson interview? I have watched her Wired autocomplete interview about thirty times. The way she deadpans ''I am Dana Scully'' when asked to describe herself — iconic. But her episode of Desert Island Discs is genuinely moving. She chose ''Both Sides Now'' by Joni Mitchell and I sobbed.', '2026-07-14 12:00:00+00'),
('seed-disc-10', 'USA', 'WestEndDreamer', 'West Coast fans — any interest in a virtual book club reading Gillian''s books? We could start with ''We'' and then move to ''Want''. Would be a lovely way to connect across the long distances out here.', '2026-07-16 18:30:00+00'),
('seed-disc-11', 'UK', 'CrownWatcher', 'London theatre fans — anyone planning to see the next production Gillian might be in? I heard whispers about a possible return to the stage in 2027. Would be amazing to organise a group outing.', '2026-07-18 20:00:00+00'),
('seed-disc-12', 'Global', 'LunaStarling', 'Favourite Scully quote and why. Mine is: ''I want to believe that the truth is out there. But I need evidence.'' It encapsulates everything I love about her — she is open-minded without sacrificing her intellect. She taught me that doubt and wonder can coexist.', '2026-07-21 15:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSION REPLIES — Batch 1 (8)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussion_replies (id, discussion_id, author, text, created_at) VALUES
('seed-drep-01', 'seed-disc-01', 'StellaFan', 'Definitely her performance in The Fall. Stella Gibson is a character who exists on her own terms — she does not perform femininity for anyone''s comfort. Gillian played her with such controlled power that you could feel the weight of every silence. Watch her interrogation scenes — she does more with a pause than most actors do with a monologue.', '2026-07-04 12:00:00+00'),
('seed-drep-02', 'seed-disc-02', 'TheFallFan', 'I discovered her through The X-Files when I was twelve, but I fell in love with her range when I watched The Fall in my twenties. It was like discovering the same actor was capable of two completely different kinds of genius.', '2026-07-06 17:00:00+00'),
('seed-drep-03', 'seed-disc-03', 'BlueOrchid', 'Seattle here! I would absolutely be interested in a Portland meetup. There are dozens of us!', '2026-07-07 21:30:00+00'),
('seed-drep-04', 'seed-disc-04', 'CrownWatcher', 'New York City based and very interested! A fan art gallery walk sounds amazing. I know a few small galleries in Brooklyn that might host something like that.', '2026-07-08 19:30:00+00'),
('seed-drep-05', 'seed-disc-05', 'LunaStarling', 'The Harold Pinter Theatre has incredible acoustics. I saw The Pillowman there years ago and every whisper carried to the back of the circle. Would love to see Gillian perform there someday.', '2026-07-09 15:00:00+00'),
('seed-drep-06', 'seed-disc-06', 'KindredSpirit', 'I used to stay up late watching reruns on CTV too! My grandmother introduced me to the show. She loved Scully because she reminded her of herself — a woman in science who had to fight to be taken seriously.', '2026-07-10 20:00:00+00'),
('seed-drep-07', 'seed-disc-07', 'WestEndDreamer', 'Melbourne here! Count me in for any meetups. I have a decent projector setup and a backyard — we could do a screening night.', '2026-07-11 13:00:00+00'),
('seed-drep-08', 'seed-disc-08', 'MentorHeart', 'I watched the livestream from the UK. She seemed so at ease on stage in Japan — there is a warmth to her when she is interacting with international fans that feels different from the usual press circuit. Genuinely magical to watch.', '2026-07-12 10:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSION REPLIES — Batch 2 (4 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussion_replies (id, discussion_id, author, text, created_at) VALUES
('seed-drep-09', 'seed-disc-09', 'BlueOrchid', 'The Desert Island Discs episode is essential listening. When she chose ''Both Sides Now'' and talked about how the meaning of the song changed as she got older — it was like watching someone process their own life in real time. So moving.', '2026-07-14 14:00:00+00'),
('seed-drep-10', 'seed-disc-10', 'ScullysHeart', 'Los Angeles based and absolutely in for a virtual book club. I have been meaning to read ''Want'' and this would be the perfect motivation. Count me in!', '2026-07-16 20:00:00+00'),
('seed-drep-11', 'seed-disc-11', 'WestEndDreamer', 'I would absolutely be in for a group outing. The National Theatre, the Harold Pinter, the Richmond — anywhere she performs, I will be there. Let us make this happen!', '2026-07-18 21:00:00+00'),
('seed-drep-12', 'seed-disc-12', 'TheFallFan', 'My favourite Scully quote is from ''Beyond the Sea'': ''I think I am afraid to believe.'' It captures her so perfectly — the fear of hope, the fear of being wrong, the fear of the unknown. She taught me that bravery is not the absence of fear, but acting in spite of it.', '2026-07-21 16:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATIONS (4)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creations (id, title, category, description, author, likes, created_at) VALUES
('seed-fc-01', 'Scully Among the Stars', 'Fan Art', 'A digital painting imagining Dana Scully floating in space, not as an astronaut but as a cosmic explorer — because she always reached beyond what was known. Mixed media with watercolour textures and nebula gradients.', 'LunaStarling', 42, '2026-07-05 16:00:00+00'),
('seed-fc-02', 'Letters to Gillian: A Compilation', 'Fan Story', 'A collection of short letters written from the perspective of fans around the world, each one addressed to Gillian and reflecting on how a specific performance touched their lives. Includes interviews with five real fans from three continents.', 'KindredSpirit', 37, '2026-07-07 12:00:00+00'),
('seed-fc-03', 'Stella''s Gaze', 'Photography', 'A photographic series inspired by the visual language of The Fall — stark, minimal, monochromatic portraits that explore themes of authority, vulnerability, and the act of looking. Shot on 35mm film.', 'TheFallFan', 28, '2026-07-09 18:00:00+00'),
('seed-fc-04', 'Through the Years: A Tribute', 'Fan Video', 'A three-minute video tribute tracing Gillian''s career from The X-Files to present day, set to Max Richter''s ''On the Nature of Daylight''. Edited entirely from publicly available interviews and performances, woven together to tell a story of evolution and grace.', 'BlueOrchid', 55, '2026-07-11 20:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATIONS — Batch 2 (2 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creations (id, title, category, description, author, likes, created_at) VALUES
('seed-fc-05', 'Blanche''s Mirror', 'Fan Art', 'A mixed-media piece inspired by A Streetcar Named Desire. The mirror reflects not Blanche''s face but the woman she used to be — before the losses, before the illusions, before the streetcar named Desire ran her over. Acrylic, gold leaf, and torn paper on canvas.', 'WestEndDreamer', 33, '2026-07-16 14:00:00+00'),
('seed-fc-06', 'The Kindred Podcast: Episode One', 'Fan Video', 'The first episode of a fan-run podcast discussing Gillian Anderson''s career. This episode focuses on The X-Files season one — the cultural impact, the behind-the-scenes stories, and why Scully worked as a character. Features guest commentary from three longtime fans.', 'StellaFan', 21, '2026-07-20 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATION COMMENTS — Batch 1 (4)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creation_comments (id, creation_id, author, text, created_at) VALUES
('seed-fcc-01', 'seed-fc-01', 'StellaFan', 'The colours in this are out of this world — literally! I love the cosmic theme. Scully always reached for the stars, and you have captured that so beautifully here.', '2026-07-06 10:00:00+00'),
('seed-fcc-02', 'seed-fc-02', 'ScullysHeart', 'Every letter in this collection is so genuine and heartfelt. The one from the fan in South Africa about how Sex Education helped them talk to their mother about difficult topics brought me to tears.', '2026-07-08 14:00:00+00'),
('seed-fcc-03', 'seed-fc-03', 'CrownWatcher', 'This captures her intensity perfectly. The use of shadow and negative space mirrors the show''s visual language so well. Frame number four — the one with the half-lit face — is my favourite.', '2026-07-10 11:00:00+00'),
('seed-fcc-04', 'seed-fc-04', 'WestEndDreamer', 'The editing is so smooth and the music choice is perfect. Max Richter and Gillian Anderson — a combination I did not know I needed. The transition from Scully to Stella gave me chills.', '2026-07-12 09:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATION COMMENTS — Batch 2 (2 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creation_comments (id, creation_id, author, text, created_at) VALUES
('seed-fcc-05', 'seed-fc-05', 'KindredSpirit', 'Gold leaf was the perfect choice for Blanche. Her tragedy is that she once had so much and lost it all — the gold represents the gilded memory she clings to. This is deeply moving.', '2026-07-17 10:00:00+00'),
('seed-fcc-06', 'seed-fc-06', 'BlueOrchid', 'A fan podcast! Love this idea. The X-Files season one analysis was spot-on. Would love to hear an episode on The Fall next. Your audio quality is impressive for a first episode.', '2026-07-21 12:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- POSTS — Batch 3 (10) — spanning late June to today
-- ──────────────────────────────────────────────────────────
INSERT INTO posts (id, username, handle, avatar_text, image, content, likes, replies_count, liked, category, created_at) VALUES
('seed-post-23', 'StellaFan', '@stella_admirer', 'ST', '', 'A digital painting inspired by the closing scene of The Fall — Stella Gibson standing alone in her hotel room, the city lights behind her, her shield finally lowered for just a moment. I wanted to capture the loneliness of being the strongest person in the room.', 67, 3, false, 'FAN ART', '2026-06-22 20:00:00+00'),
('seed-post-24', 'KindredSpirit', '@kindred_wanderer', 'KI', '', 'Acrylic portrait of Gillian as herself — no character, no costume, just her at a book signing, looking up mid-conversation with that warm, curious expression. I painted it from a photo I took in 2019. She was laughing at something a fan said. That laugh is permanently etched in my memory.', 48, 2, false, 'FAN ART', '2026-06-29 15:30:00+00'),
('seed-post-25', 'CrownWatcher', '@thatcher_study', 'CR', '', 'I am a professional illustrator and I spent three months on a graphic novel-style tribute to Gillian''s career. Each chapter covers a different role — Scully, Stella, Jean, Margaret, Blanche, Media. It is my love letter to her range. If there is interest I might try to get it published.', 112, 7, false, 'FAN ART', '2026-07-14 11:00:00+00'),
('seed-post-26', 'MentorHeart', '@sayes_supporter', 'ME', '', 'An open letter to the young person who is reading this and feeling unseen. Gillian once said in an interview that she spent her teenage years feeling like she did not belong anywhere. Look at her now. Look at the community she has built. You belong here. You always have.', 156, 8, false, 'LETTERS', '2026-07-15 19:45:00+00'),
('seed-post-27', 'TheFallFan', '@stella_gibson_fan', 'TH', '', 'I wrote a poem about Dana Scully and how she taught me to trust my own intellect. It is called ''The Evidence of Things Unseen'' and it will be published in a literary journal next month. I never would have had the confidence to submit my work anywhere without Scully''s voice in my head saying ''question everything, including your own doubt.''', 91, 4, false, 'LETTERS', '2026-07-17 14:00:00+00'),
('seed-post-28', 'LunaStarling', '@luna_scribes', 'LU', '', 'Gillian, thank you for making it okay to be a late bloomer. I changed careers at 38, went back to school at 40, and started painting at 42. Watching you take on new challenges — writing books, producing, directing — reminds me that reinvention is not limited to the young. We keep growing until we stop breathing.', 134, 5, false, 'LETTERS', '2026-07-19 10:30:00+00'),
('seed-post-29', 'WestEndDreamer', '@stage_lights', 'WE', '', 'I was a dresser for a West End production in 2022 and one night I was assigned to help Gillian with a quick change. She had under two minutes to go from one costume to another. In the chaos, she looked at me and said ''breathe with me — in for four, hold for four, out for four.'' We did it together. Then she walked on stage and gave a flawless performance. Grace under pressure is a choice, and she chooses it every single time.', 121, 6, false, 'ENCOUNTERS', '2026-06-24 21:00:00+00'),
('seed-post-30', 'ScullysHeart', '@scully_believer', 'SH', '', 'I ran into Gillian at a bookstore in Charing Cross Road. She was browsing the philosophy section. I was holding a copy of one of her books for a friend. She noticed, smiled, and asked if I wanted her to sign it. I stammered something unintelligible. She signed it anyway. The inscription says ''to a fellow seeker — keep asking questions.'' I think about that day every time I feel lost.', 88, 3, false, 'ENCOUNTERS', '2026-07-04 16:00:00+00'),
('seed-post-31', 'BlueOrchid', '@blue_orchid', 'BL', '', 'Attended a charity gala where Gillian was the guest of honour. She gave a speech about the importance of arts education and how it shaped her. Afterward, there was a silent auction and she personally went around to thank every single bidder. When she got to me, she noticed my X-Files tattoo (a small UFO on my wrist) and said ''one of us'' with such genuine delight. I am pretty sure I floated home.', 76, 2, false, 'ENCOUNTERS', '2026-07-13 20:30:00+00'),
('seed-post-32', 'LunaStarling', '@luna_scribes', 'LU', '', 'Just got back from the London screening of a documentary Gillian narrated. She did a Q&A afterward and someone asked her what she would tell her 20-year-old self. She paused for a long time and then said ''I would tell her that the things she thinks are weaknesses will become her greatest strengths.'' The whole room was silent. I am pretty sure everyone in that theatre felt seen.', 143, 4, false, 'ENCOUNTERS', '2026-07-22 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- COMMENTS — Batch 3 (14 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO comments (id, post_id, parent_comment_id, username, avatar_text, content, created_at) VALUES
('seed-cmt-33', 'seed-post-23', NULL, 'KindredSpirit', 'KI', 'That closing scene is one of the most powerful in television history. You captured the isolation beautifully — she protects everyone but herself.', '2026-06-23 10:00:00+00'),
('seed-cmt-34', 'seed-post-23', 'seed-cmt-33', 'StellaFan', 'ST', 'Thank you! That is exactly what I wanted to convey. Stella is a protector who has no one to protect her.', '2026-06-23 11:15:00+00'),
('seed-cmt-35', 'seed-post-25', NULL, 'LunaStarling', 'LU', 'A graphic novel tribute is such a brilliant idea! Each role deserves its own chapter. I would absolutely buy this.', '2026-07-14 14:00:00+00'),
('seed-cmt-36', 'seed-post-25', NULL, 'WestEndDreamer', 'WE', 'Please pursue publication! The world needs more art that celebrates transformative female performers. Have you considered approaching a publisher like Avery Hill or SelfMadeHero?', '2026-07-14 15:30:00+00'),
('seed-cmt-37', 'seed-post-25', 'seed-cmt-36', 'CrownWatcher', 'CR', 'Thank you for the encouragement! I have a meeting with a small publisher next month actually. Fingers crossed.', '2026-07-14 16:00:00+00'),
('seed-cmt-38', 'seed-post-26', NULL, 'ScullysHeart', 'SH', 'I needed to read this today. Thank you. Being unseen is its own kind of loneliness, but communities like this one remind us that connection is possible.', '2026-07-15 21:00:00+00'),
('seed-cmt-39', 'seed-post-26', NULL, 'TheFallFan', 'TH', '"You belong here. You always have." I am crying. This is the kindest thing I have read on this platform.', '2026-07-16 08:00:00+00'),
('seed-cmt-40', 'seed-post-27', NULL, 'BlueOrchid', 'BL', 'Congratulations on the publication! That is enormous. And what a beautiful title — ''The Evidence of Things Unseen''. It perfectly captures Scully''s paradox.', '2026-07-18 10:00:00+00'),
('seed-cmt-41', 'seed-post-28', NULL, 'StellaFan', 'ST', 'This resonates so deeply. I started learning piano at 44. Gillian''s career trajectory gives me permission to keep evolving.', '2026-07-19 14:00:00+00'),
('seed-cmt-42', 'seed-post-29', NULL, 'CrownWatcher', 'CR', 'The breathing exercise — that is such a intimate glimpse into who she is. She could have been stressed and short, but instead she chose to bring you into her calm. That is leadership.', '2026-06-25 10:00:00+00'),
('seed-cmt-43', 'seed-post-29', 'seed-cmt-42', 'WestEndDreamer', 'WE', 'It taught me more about composure than any management course ever could. She did not have to include me in her centering ritual. But she did.', '2026-06-25 11:30:00+00'),
('seed-cmt-44', 'seed-post-30', NULL, 'MentorHeart', 'ME', '"To a fellow seeker — keep asking questions." That is the most Scully inscription imaginable. What a treasure.', '2026-07-05 12:00:00+00'),
('seed-cmt-45', 'seed-post-31', NULL, 'TheFallFan', 'TH', 'The fact that she noticed your tattoo and said ''one of us'' — I am emotional just reading this. She genuinely sees people.', '2026-07-14 10:00:00+00'),
('seed-cmt-46', 'seed-post-32', NULL, 'KindredSpirit', 'KI', 'I wish I had been at that screening. Her answer to that question is something I will carry with me. The things we think are weaknesses — what if they are actually our superpowers waiting to be recognised?', '2026-07-22 15:30:00+00'),
('seed-cmt-47', 'seed-post-32', 'seed-cmt-46', 'LunaStarling', 'LU', 'Exactly. I have been thinking about her words all day. Imagine telling your younger self that the very thing you are most ashamed of will become the source of your greatest strength. That is liberating.', '2026-07-22 16:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSIONS — Batch 3 (4 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussions (id, country, author, text, created_at) VALUES
('seed-disc-13', 'USA', 'StellaFan', 'Has anyone else rewatched The Fall during quarantine and found it hit differently? The first time I watched it I was focused on the plot. The second time I was watching Stella''s micro-expressions, the way she reads rooms, the way she protects her inner world. It is a completely different show on rewatch.', '2026-07-17 20:00:00+00'),
('seed-disc-14', 'Global', 'BlueOrchid', 'If you could ask Gillian one question over tea, what would it be? I will go first: I would ask her what she thinks happens after we die. Not because I expect her to have an answer, but because I want to hear how she sits with the question. I feel like her response would tell me everything about how she moves through the world.', '2026-07-19 17:00:00+00'),
('seed-disc-15', 'UK', 'WestEndDreamer', 'Best Gillian Anderson red carpet look of all time? I am nominating the 2019 BAFTA navy blue velvet suit with the gold necklace. She looked like she owned the room before she even walked in. Honourable mention to the 2020 Golden Globes white pantsuit — effortless power.', '2026-07-20 19:00:00+00'),
('seed-disc-16', 'Global', 'MentorHeart', 'How has Gillian''s work influenced your career choices? I became a social worker because of Dana Scully. Not directly — but Scully''s commitment to truth, her compassion, her refusal to give up on people — that is what social work is. I tell my clients that believing in them is my job and my privilege.', '2026-07-22 12:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSION REPLIES — Batch 3 (4 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussion_replies (id, discussion_id, author, text, created_at) VALUES
('seed-drep-13', 'seed-disc-13', 'TheFallFan', 'Completely agree. The first viewing is about the tension and the resolution. The second viewing is about Stella. Every look, every pause, every time she chooses not to react — it is a masterclass in restraint. Paul Spector is terrifying, but Stella is the character I cannot stop thinking about.', '2026-07-18 10:00:00+00'),
('seed-drep-14', 'seed-disc-14', 'KindredSpirit', 'I would ask her about failure. She has achieved so much that we rarely talk about the projects that did not land, the auditions she did not get, the moments of doubt. I want to know how she rebuilds after disappointment. That is where the real wisdom lives.', '2026-07-19 19:00:00+00'),
('seed-drep-15', 'seed-disc-15', 'CrownWatcher', 'The 2019 BAFTA look is untouchable. But I also love her 2021 Emmy look — the black Valentino with the dramatic cape sleeve. She understands that fashion is a performance, and she performs it brilliantly.', '2026-07-20 21:00:00+00'),
('seed-drep-16', 'seed-disc-16', 'LunaStarling', 'This brought tears to my eyes. The fact that Scully inspired someone to become a social worker is exactly why representation matters. You are doing the work that she would be proud of.', '2026-07-22 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATIONS — Batch 3 (2 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creations (id, title, category, description, author, likes, created_at) VALUES
('seed-fc-07', 'Scully''s Lab — Diorama', 'Fan Art', 'A hand-built miniature diorama of Scully''s autopsy lab from the X-Files basement. Every detail is recreated from reference photos — the microscope, the fluorescent lights, the file cabinets, even a tiny Mulder lurking in the doorway. Built entirely from recycled materials over six weeks.', 'ScullysHeart', 47, '2026-07-18 16:00:00+00'),
('seed-fc-08', 'The Gillian Tapes', 'Fan Video', 'A supercut of every time Gillian has broken character during an interview and laughed uncontrollably. Seven minutes of pure joy. From the Wired autocomplete interview to Graham Norton, from BBC Breakfast to late-night US talkshows — her laugh is infectious and this compilation is a guaranteed mood lifter.', 'CrownWatcher', 64, '2026-07-22 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATION COMMENTS — Batch 3 (2 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creation_comments (id, creation_id, author, text, created_at) VALUES
('seed-fcc-07', 'seed-fc-07', 'StellaFan', 'A diorama of Scully''s lab! The attention to detail is incredible — the tiny microscope slides, the stack of case files. You can tell this was a labour of love. The little Mulder in the doorway is perfect.', '2026-07-19 14:00:00+00'),
('seed-fcc-08', 'seed-fc-08', 'WestEndDreamer', 'I did not know I needed seven minutes of Gillian laughing until I watched this. Her laugh is so genuine — it starts in her whole body. This is going straight into my comfort rotation. Thank you for making this.', '2026-07-22 16:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- POSTS — Batch 4 (9) — Souls Connected theme
-- Stories of fans finding each other through shared admiration
-- ──────────────────────────────────────────────────────────
INSERT INTO posts (id, username, handle, avatar_text, image, content, likes, replies_count, liked, category, created_at) VALUES
('seed-post-33', 'KindredSpirit', '@kindred_wanderer', 'KI', '', 'I met my best friend in a Gillian Anderson fan forum twelve years ago. We lived on different continents — she was in Brazil, I was in Scotland. We emailed every week, then video-called, then finally met in person at a fan event in London in 2019. She is now my daughter''s godmother. All because two strangers loved the same actor and took a chance on connection. This community is magic.', 98, 5, false, 'ENCOUNTERS', '2026-06-26 20:00:00+00'),
('seed-post-34', 'LunaStarling', '@luna_scribes', 'LU', '', 'To the woman I saw crying at the back of the screening of ''Scully: A Fan Documentary'' — I saw you wiping your eyes during the credits and I wanted to tell you that I was crying too. I did not have the courage to approach you then, but if you are reading this: your people are here. We are all crying together. That is what this is.', 85, 3, false, 'LETTERS', '2026-07-01 19:30:00+00'),
('seed-post-35', 'StellaFan', '@stella_admirer', 'ST', '', 'My partner proposed to me at a Gillian Anderson book signing. I was in the middle of telling Gillian how much her work meant to me when my partner dropped to one knee. Gillian gasped, clapped her hands, and said ''say yes, obviously!'' I said yes. She signed our copy of ''We'' with ''to the future Mrs and Mrs — love is the only truth that matters.'' We have been married for three years now.', 187, 9, false, 'ENCOUNTERS', '2026-07-03 13:00:00+00'),
('seed-post-36', 'ScullysHeart', '@scully_believer', 'SH', '', 'I started a small online group for Gillian fans in my city during the first lockdown. Seven people showed up to the first virtual meetup. Two years later, we have fifty members, a book club, a group chat that keeps me sane, and friendships I will have for life. If you are lonely, start something. Put a call out. The people you need are looking for you too.', 110, 4, false, 'STORY', '2026-07-05 17:00:00+00'),
('seed-post-37', 'BlueOrchid', '@blue_orchid', 'BL', '', 'The Kindred podcast interviewed me about my fan art journey and I spent the whole time talking about how this community saved me during a really dark period. When the episode aired, I got messages from fifteen people saying they felt the same way. We have since started a private support group. Art brought us together. Gillian brought us together. But we stayed for each other.', 79, 3, false, 'STORY', '2026-07-08 10:30:00+00'),
('seed-post-38', 'MentorHeart', '@sayes_supporter', 'ME', '', 'My 14-year-old daughter came out to me last year and the first thing she said was ''please do not tell anyone except maybe the Gillian fans because they will understand.'' She was right. This community welcomed her with open arms, sent her art, shared their own coming out stories. You raised her spirits when I did not know how. I will never forget that.', 168, 7, false, 'LETTERS', '2026-07-11 20:00:00+00'),
('seed-post-39', 'TheFallFan', '@stella_gibson_fan', 'TH', '', 'I was in hospital for three weeks last year and a fellow fan I had never met in person sent me a care package. It had a handmade card with Scully quotes, a small embroidered UFO patch, and a playlist called ''Songs for the Strong Ones.'' I cried into my hospital pillow. She wrote on the card: ''Stella Gibson would tell you to rest. So I am telling you too.'' I think about that kindness every day.', 124, 5, false, 'STORY', '2026-07-14 15:00:00+00'),
('seed-post-40', 'CrownWatcher', '@thatcher_study', 'CR', '', 'I was a journalist covering a film festival and I interviewed Gillian for a profile piece. Toward the end I admitted that I was a fan long before I was a journalist. She laughed and said ''the best interviews come from people who care.'' Then she asked me which of her performances was my favourite. We talked for twenty minutes over schedule. She treats everyone — fans, journalists, crew — with the same genuine curiosity. That is not a performance.', 96, 4, false, 'ENCOUNTERS', '2026-07-17 12:00:00+00'),
('seed-post-41', 'WestEndDreamer', '@stage_lights', 'WE', '', 'Nine years ago I was at the lowest point of my life. I wrote a letter to Gillian — not expecting a reply, just needing to put my gratitude into words somewhere. I wrote about how watching her work gave me a reason to keep going. Six weeks later, a small envelope arrived with a handwritten note. It said: ''I am so glad you are here. Keep going. There is so much more to come.'' I have kept that note in my wallet every single day. Nine years later, I am happy. I am whole. And I still carry her words with me.', 211, 8, false, 'LETTERS', '2026-07-22 18:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- COMMENTS — Batch 4 (12 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO comments (id, post_id, parent_comment_id, username, avatar_text, content, created_at) VALUES
('seed-cmt-48', 'seed-post-33', NULL, 'BlueOrchid', 'BL', 'This is the most beautiful thing I have ever read on this platform. Twelve years of friendship across continents — all because of a shared love for an actor who connects people without even trying. Your story is what this community is about.', '2026-06-27 10:00:00+00'),
('seed-cmt-49', 'seed-post-34', NULL, 'TheFallFan', 'TH', 'I was at that screening and I was one of the people crying. It was my first fan event and I almost did not go because I was terrified. I sat alone in the back row. If you are the person who wrote this — thank you. I felt seen by your words even then, and I feel seen now.', '2026-07-02 09:00:00+00'),
('seed-cmt-50', 'seed-post-35', NULL, 'LunaStarling', 'LU', 'This is the greatest love story I have ever encountered. Gillian officiating a proposal! ''To the future Mrs and Mrs — love is the only truth that matters.'' I am weeping. This is everything.', '2026-07-03 15:00:00+00'),
('seed-cmt-51', 'seed-post-35', 'seed-cmt-50', 'StellaFan', 'ST', 'Thank you! It still feels like a dream. She was so genuinely thrilled for us. The inscription is framed above our bed.', '2026-07-03 16:30:00+00'),
('seed-cmt-52', 'seed-post-36', NULL, 'MentorHeart', 'ME', 'This is exactly right. I started a small virtual meetup during lockdown too. Six of us at first. Now we have a WhatsApp group that has gotten me through some of my hardest days. Community is not given — it is built, one brave message at a time.', '2026-07-06 12:00:00+00'),
('seed-cmt-53', 'seed-post-37', NULL, 'WestEndDreamer', 'WE', 'Your art has moved me so many times. Hearing that the community gave back to you the way you have given to us through your work — that is full circle. So glad you found your people.', '2026-07-09 14:00:00+00'),
('seed-cmt-54', 'seed-post-38', NULL, 'LunaStarling', 'LU', 'As someone who came out later in life, I wish I had a community like this when I was 14. The fact that your daughter instinctively knew this was a safe space — that is because we have worked to make it one. Sending her so much love.', '2026-07-12 10:00:00+00'),
('seed-cmt-55', 'seed-post-38', 'seed-cmt-54', 'MentorHeart', 'ME', 'Thank you. She read this comment and smiled so wide. Knowing that she has a whole community of people rooting for her is everything a parent could want.', '2026-07-12 11:30:00+00'),
('seed-cmt-56', 'seed-post-39', NULL, 'CrownWatcher', 'CR', 'The playlist called ''Songs for the Strong Ones'' — I am not crying, you are crying. What a beautiful gesture. This community is full of people who show up for each other in ways that social media rarely captures.', '2026-07-15 10:00:00+00'),
('seed-cmt-57', 'seed-post-40', NULL, 'ScullysHeart', 'SH', 'The fact that she asked YOU which performance was your favourite and then talked for twenty minutes over schedule — that is so on-brand for her. She is genuinely curious about people. That is not something you can fake.', '2026-07-18 10:00:00+00'),
('seed-cmt-58', 'seed-post-41', NULL, 'StellaFan', 'ST', 'Nine years. You have carried her words for nine years. That note is not just a kindness — it is a lifeline that you have held onto, and now you are sharing it with all of us. ''I am so glad you are here. Keep going.'' I am writing that on my mirror.', '2026-07-22 19:00:00+00'),
('seed-cmt-59', 'seed-post-41', 'seed-cmt-58', 'WestEndDreamer', 'WE', 'I wrote it on a sticky note and put it on my monitor at work. Some words are too important to keep to yourself. Thank you for sharing this with us.', '2026-07-22 19:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSIONS — Batch 4 (4 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussions (id, country, author, text, created_at) VALUES
('seed-disc-17', 'Global', 'TheFallFan', 'What is a small moment from Gillian''s work that stayed with you? Not the big speeches — the tiny moments. For me it is in The Fall season two, when Stella is in the car after a difficult interview and she adjusts her rearview mirror. That is it. Just adjusting the mirror. But in that gesture you see her recentreing herself, putting her armour back on. No dialogue, just a hand movement. That is acting at its finest.', '2026-07-15 18:00:00+00'),
('seed-disc-18', 'USA', 'MentorHeart', 'Has anyone here met Gillian more than once? I have been fortunate enough to meet her three times — a book signing, a stage door, and a charity event. Each time she remembered something specific from our previous interaction. The first time I mentioned my grandmother loved The X-Files. The second time she asked how my grandmother was doing. I nearly fainted.', '2026-07-18 20:00:00+00'),
('seed-disc-19', 'Global', 'ScullysHeart', 'If you could have dinner with any character Gillian has played, who would you choose and why? I would choose Jean Milburn. Imagine the conversation over dinner — she would ask the most insightful questions, make you feel completely at ease, and probably convince you to call your mother. Plus she would know exactly which wine to order.', '2026-07-20 19:00:00+00'),
('seed-disc-20', 'UK', 'CrownWatcher', 'What is your go-to comfort episode of any Gillian show? Mine is Sex Education season two episode four — the one where Jean gives Otis the talk about performance anxiety. It is hilarious, tender, and Jean is at her absolute best. I have watched it about twenty times and it never fails to lift my mood.', '2026-07-22 17:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- DISCUSSION REPLIES — Batch 4 (4 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO discussion_replies (id, discussion_id, author, text, created_at) VALUES
('seed-drep-17', 'seed-disc-17', 'LunaStarling', 'Yes! For me it is in the X-Files episode ''Beyond the Sea'' when Scully is in the car with Boggs and she looks at him and says ''I want to believe.'' It is barely a whisper. But in that moment you see all of her — the scientist, the daughter, the woman who desperately wants there to be more than this. That line, delivered that way, is why I fell in love with the show.', '2026-07-16 10:00:00+00'),
('seed-drep-18', 'seed-disc-18', 'BlueOrchid', 'She remembered your grandmother! That is incredible and also completely believable. She has a memory for people that is almost supernatural. I have only met her once but she remembered a detail from my letter when I met her at a signing. She said ''you are the one who paints, yes?'' I nearly dropped my book.', '2026-07-19 14:00:00+00'),
('seed-drep-19', 'seed-disc-19', 'KindredSpirit', 'I would choose Stella Gibson. Not because she would be the easiest dinner companion — she would probably be quite intimidating. But I want to know what she thinks about when she is alone. Over dinner, with good wine, I think she would open up in ways that would surprise even her. Also she would absolutely pay for the bill without letting anyone argue.', '2026-07-21 12:00:00+00'),
('seed-drep-20', 'seed-disc-20', 'StellaFan', 'Same episode! Jean walking into Otis''s room and sitting on the edge of his bed with that calm, open expression — she does not shame him, she does not make it awkward, she just meets him where he is. That scene is parenting goals. Also the line ''performance anxiety is extremely common and nothing to be embarrassed about'' delivered with perfect comedic timing.', '2026-07-22 18:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATIONS — Batch 4 (2 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creations (id, title, category, description, author, likes, created_at) VALUES
('seed-fc-09', 'The Evidence of Things Unseen', 'Fan Art', 'A mixed-media piece responding to the poem in post 27. Layers of translucent paper with handwritten Scully quotes, pressed flowers, and gold ink. The text emerges and fades depending on the angle you view it from — because some truths only reveal themselves when you look from the right perspective.', 'TheFallFan', 38, '2026-07-20 15:00:00+00'),
('seed-fc-10', 'Souls Connected: A Community Portrait', 'Photography', 'A collaborative photo project featuring portraits of 24 fans from 12 countries, each holding an object that represents their connection to Gillian''s work. A well-loved book, a handmade Scully costume, a theatre ticket stub, a painted stone. The images are arranged in a grid to show that distance does not diminish connection. Available as a free downloadable zine.', 'KindredSpirit', 72, '2026-07-22 20:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- FAN CREATION COMMENTS — Batch 4 (2 more)
-- ──────────────────────────────────────────────────────────
INSERT INTO fan_creation_comments (id, creation_id, author, text, created_at) VALUES
('seed-fcc-09', 'seed-fc-09', 'LunaStarling', 'The way the text appears and fades depending on the viewing angle — that is such a clever metaphor for faith, for doubt, for the way Scully navigates the unknown. This is art that makes you think.', '2026-07-21 14:00:00+00'),
('seed-fcc-10', 'seed-fc-10', 'WestEndDreamer', 'A portrait of 24 fans from 12 countries — this is what the Kindred community looks like. The fact that you made it available as a free zine is so generous. I would love to be part of a volume two if you ever do one.', '2026-07-22 21:00:00+00')
ON CONFLICT (id) DO NOTHING;
