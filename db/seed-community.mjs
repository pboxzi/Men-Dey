import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:\\man\\.env' });

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Posts without category column (column doesn't exist yet on remote DB)
// Category will be added via Supabase dashboard SQL Editor:
// ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'FAN ART';
const posts = [
  {
    id: 'seed-post-1',
    username: 'Sarah X-Files',
    handle: '@XFilesSarah',
    avatar_text: 'SX',
    content: 'I spent three weeks painting this portrait of Gillian as Scully — every freckle, every strand of auburn hair. The way she held that flashlight, equal parts fear and defiance. It\'s hanging above my desk now and every time I look at it I remember why I fell in love with this show in 1993.',
    likes: 24,
    replies_count: 3,
    liked: false,
  },
  {
    id: 'seed-post-2',
    username: 'Marcus Rivera',
    handle: '@MarcusOnStage',
    avatar_text: 'MR',
    content: 'I met Gillian at the Stage Door after A Streetcar Named Desire in London. I was trembling. She saw my copy of the playbill, noticed I\'d annotated the margins, and asked me what I thought of Blanche\'s final line. We talked for twelve minutes about Tennessee Williams and vulnerability. She signed my program with "Stay curious, stay brave." Best night of my life.',
    likes: 41,
    replies_count: 4,
    liked: false,
  },
  {
    id: 'seed-post-3',
    username: 'Priya Patel',
    handle: '@PriyaWrites',
    avatar_text: 'PP',
    content: 'Dear Gillian — I wanted to tell you that watching you play Jean Milburn in Sex Education helped me talk to my daughter about things I was too scared to discuss. You made it feel safe. You made it feel normal. Thank you for giving me the words I couldn\'t find. Your openness is a gift to mothers everywhere.',
    likes: 37,
    replies_count: 2,
    liked: false,
  },
  {
    id: 'seed-post-4',
    username: 'Nadia K',
    handle: '@NadiaKArt',
    avatar_text: 'NK',
    content: 'Digital illustration of Gillian as Stella Gibson — the power suit, the icy stare, the quiet dominance. I used only charcoal greys and one accent of deep burgundy for the lips. Twelve hours of work but every minute was worth it. Stella Gibson is the most fascinating character on television. Full stop.',
    likes: 19,
    replies_count: 2,
    liked: false,
  },
  {
    id: 'seed-post-5',
    username: 'Tom Brennan',
    handle: '@TomBrennanDub',
    avatar_text: 'TB',
    content: 'Gillian was doing a book signing in Dublin for "Want." I waited in line for two hours. When I got to the front I completely forgot my prepared speech. She just laughed and said "Honestly, the unscripted moments are always the best ones." We chatted about Irish theatre and she recommended three plays I\'d never heard of. She was more interested in what I had to say than in moving the line along.',
    likes: 33,
    replies_count: 3,
    liked: false,
  },
  {
    id: 'seed-post-6',
    username: 'Lucia Moreau',
    handle: '@LuciaFanParis',
    avatar_text: 'LM',
    content: 'Dear Gillian — I am writing from Lyon, France. Your work on The Fall changed the way I think about female authority and vulnerability. Stella Gibson taught me that strength does not mean hardness. That intelligence does not require cruelty. I have watched the series four times and each time I discover something new. Merci infiniment for creating something so profound.',
    likes: 28,
    replies_count: 1,
    liked: false,
  },
  {
    id: 'seed-post-7',
    username: 'Chloe Bennett',
    handle: '@ChloeCreates',
    avatar_text: 'CB',
    content: 'I embroidered a 40cm x 60cm portrait of Gillian holding a moth — referencing both the X-Files mythology and her love of natural history. The threadwork took 140 hours. I used silk threads for the skin tones and cotton for the moth wings. I\'ve never been prouder of a piece. It will be displayed at the fan art exhibition in Melbourne next month.',
    likes: 52,
    replies_count: 4,
    liked: false,
  },
  {
    id: 'seed-post-8',
    username: 'Daniel Osei',
    handle: '@DanielOsei',
    avatar_text: 'DO',
    content: 'Dear Gillian — I am a 19-year-old from Ghana who just aged out of the foster care system. Your work with SAYes mentoring inspired me to apply to the youth programme here. I start university in September studying social work. You showed me that someone cares about kids like me. I will never forget that. Thank you for everything you do behind the scenes.',
    likes: 61,
    replies_count: 5,
    liked: false,
  },
];

const comments = [
  { id: 'seed-c1', post_id: 'seed-post-1', username: 'Emily Rose', avatar_text: 'ER', content: 'The detail on the freckles is stunning. This is genuinely gallery-worthy.', parent_comment_id: null },
  { id: 'seed-c1r1', post_id: 'seed-post-1', username: 'Sarah X-Files', avatar_text: 'SX', content: 'Thank you Emily! I used a 0.1mm brush for the freckle work. Gillian has the most beautiful skin to paint.', parent_comment_id: 'seed-c1' },
  { id: 'seed-c2', post_id: 'seed-post-1', username: 'Art Director Kai', avatar_text: 'AK', content: 'As a professional illustrator, I can confirm this is exceptional work. The way you captured the light from the flashlight is masterful.', parent_comment_id: null },
  { id: 'seed-c3', post_id: 'seed-post-1', username: 'MulderFan99', avatar_text: 'MF', content: 'Do you sell prints? I would absolutely hang this in my studio.', parent_comment_id: null },

  { id: 'seed-c4', post_id: 'seed-post-2', username: 'StageDoor Queen', avatar_text: 'SQ', content: 'You actually spoke with her about Tennessee Williams? I would have fainted. She clearly loved that you were engaged with the material.', parent_comment_id: null },
  { id: 'seed-c4r1', post_id: 'seed-post-2', username: 'Marcus Rivera', avatar_text: 'MR', content: 'I nearly did faint. But she has this way of making you feel like you are the only person in the world. The warmth is real.', parent_comment_id: 'seed-c4' },
  { id: 'seed-c5', post_id: 'seed-post-2', username: 'TheatreNerd_London', avatar_text: 'TN', content: 'This confirms everything I have heard about her — she genuinely cares about art and the people who appreciate it. What a treasure.', parent_comment_id: null },
  { id: 'seed-c6', post_id: 'seed-post-2', username: 'Blanche DuBois Fan', avatar_text: 'BF', content: 'Stay curious, stay brave — that is exactly what Blanche needed to hear. Gillian understood the assignment.', parent_comment_id: null },
  { id: 'seed-c6r1', post_id: 'seed-post-2', username: 'Marcus Rivera', avatar_text: 'MR', content: 'Right? It felt like she was speaking to both me and Blanche simultaneously. The layers are real.', parent_comment_id: 'seed-c6' },

  { id: 'seed-c7', post_id: 'seed-post-3', username: 'MotherOfTwo', avatar_text: 'MO', content: 'This hit me so hard. Jean Milburn is the mother I aspire to be. Open, honest, and endlessly compassionate.', parent_comment_id: null },
  { id: 'seed-c8', post_id: 'seed-post-3', username: 'SexEdFan', avatar_text: 'SE', content: 'Jean Milburn is one of the most important characters in modern television. She redefined what on-screen motherhood looks like.', parent_comment_id: null },

  { id: 'seed-c9', post_id: 'seed-post-7', username: 'EmbroideryGuild', avatar_text: 'EG', content: '140 hours? The dedication. The silk threadwork on the skin tones must be exquisite. Please share close-up photos.', parent_comment_id: null },
  { id: 'seed-c9r1', post_id: 'seed-post-7', username: 'Chloe Bennett', avatar_text: 'CB', content: 'I will post close-ups this weekend! The silk catches light in a way cotton cannot. It was worth every hour.', parent_comment_id: 'seed-c9' },
  { id: 'seed-c10', post_id: 'seed-post-7', username: 'MelbourneArts', avatar_text: 'MA', content: 'I will be at the Melbourne exhibition! Cannot wait to see this in person. The moth symbolism is beautiful.', parent_comment_id: null },
  { id: 'seed-c11', post_id: 'seed-post-7', username: 'GillianOfficial', avatar_text: 'GA', content: 'This is breathtaking. The moth and the natural history connection — you understood the assignment completely. Thank you for this.', parent_comment_id: null },
  { id: 'seed-c11r1', post_id: 'seed-post-7', username: 'Chloe Bennett', avatar_text: 'CB', content: 'GILLIAN SAW THIS?! I am actually crying right now. Thank you so much for everything you do. This means the world.', parent_comment_id: 'seed-c11' },

  { id: 'seed-c12', post_id: 'seed-post-8', username: 'SAYesMentor', avatar_text: 'SM', content: 'This is exactly why SAYes exists. Daniel, you are proof that one person\'s advocacy can change the entire trajectory of a life. Congratulations on university.', parent_comment_id: null },
  { id: 'seed-c12r1', post_id: 'seed-post-8', username: 'Daniel Osei', avatar_text: 'DO', content: 'Thank you so much. I never thought I would get here. Gillian\'s work made me believe it was possible.', parent_comment_id: 'seed-c12' },
  { id: 'seed-c13', post_id: 'seed-post-8', username: 'CareLeaverUK', avatar_text: 'CL', content: 'From one care leaver to another — you are incredible. Gillian, thank you for amplifying our stories when nobody else would.', parent_comment_id: null },
  { id: 'seed-c14', post_id: 'seed-post-8', username: 'FutureSocialWorker', avatar_text: 'FS', content: 'Daniel, you are going to be an extraordinary social worker. The world needs people who have lived it, not just studied it.', parent_comment_id: null },
  { id: 'seed-c14r1', post_id: 'seed-post-8', username: 'Daniel Osei', avatar_text: 'DO', content: 'That means more than you know. Thank you for believing in me.', parent_comment_id: 'seed-c14' },
  { id: 'seed-c15', post_id: 'seed-post-8', username: 'GillianOfficial', avatar_text: 'GA', content: 'Daniel — you are the reason SAYes exists. Your courage, your resilience, your determination to make a difference — these are the things that change the world. We are so proud of you. Never stop.', parent_comment_id: null },
];

async function seed() {
  console.log('Seeding community posts...');
  for (const post of posts) {
    const { error } = await supabase.from('posts').upsert(post, { onConflict: 'id' });
    if (error) console.error(`  X ${post.id}:`, error.message);
    else console.log(`  + ${post.id}`);
  }

  console.log('\nSeeding community comments...');
  for (const comment of comments) {
    const { error } = await supabase.from('comments').upsert(comment, { onConflict: 'id' });
    if (error) console.error(`  X ${comment.id}:`, error.message);
    else console.log(`  + ${comment.id}`);
  }

  console.log(`\nDone! Seeded ${posts.length} posts and ${comments.length} comments.`);
  console.log('\nNOTE: Run this SQL in Supabase SQL Editor to add the category column:');
  console.log("ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'FAN ART';");
}

seed();
