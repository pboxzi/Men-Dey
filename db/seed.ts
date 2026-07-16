import { createClient } from '@supabase/supabase-js';
import { YOUTUBE_VIDEOS, GALLERY_PHOTOS } from '../src/mediaData';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const workingUrls = [
  "https://upload.wikimedia.org/wikipedia/commons/9/99/Gillian_Anderson_2011.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/79/Gillian_Anderson_2013_%28cropped%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/5/55/Gillian_Anderson_Berlinale_2017.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gillian_Anderson_at_Fan_Expo_Denver_2026_02.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9e/Gillian_Anderson_at_the_2015_Fan_Expo_Dallas.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/6/67/Gillian_Anderson_at_the_2017_Berlinale.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e8/Gillian_Anderson_by_Gage_Skidmore.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9b/Gillian_Anderson_giving_autographs_the_2015_Fan_Expo_Dallas.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/4/46/Gillian_Anderson_in_2013_%289347352920%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/8/81/Gillian_anderson_lk.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/78/Gillian_Anderson_%2820673354673%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/Gillian_Anderson_%289344572755%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/e/ea/Gillian_Anderson_%289347587466%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/d0/Gillian_Anderson_2013.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/c/cf/Gillian_Anderson_Cannes_Film_Festival_2026_01.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a5/Gillian_Anderson_at_Fan_Expo_Denver_2026_01.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/0/04/Gillian_anderson_lk-cropped.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/4/4a/Gillian-Anderson-Buskaid-London-2004.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f4/Gillian_Anderson_Cannes_Film_Festival_2026_02.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/c/c6/Fan_Expo_2012_-_Gillian_Anderson_02_%287891578608%29.jpg",
];

async function seed() {
  // Clear existing media data
  await supabase.from('photos').delete().neq('id', '__none__');
  await supabase.from('videos').delete().neq('id', '__none__');
  await supabase.from('categories').delete().neq('id', -1);

  // Insert categories
  const allCategories = [...new Set([
    ...YOUTUBE_VIDEOS.map(v => v.category),
    ...GALLERY_PHOTOS.map(p => p.category),
  ])];

  const catMap: Record<string, number> = {};
  for (const name of allCategories) {
    const { data } = await supabase
      .from('categories')
      .insert({ name })
      .select('id')
      .single();
    if (data) catMap[name] = data.id;
  }

  // Insert videos
  for (let i = 0; i < YOUTUBE_VIDEOS.length; i++) {
    const v = YOUTUBE_VIDEOS[i];
    await supabase.from('videos').insert({
      id: v.id,
      title: v.title,
      category_id: catMap[v.category],
      duration: v.duration,
      youtube_id: v.youtubeId,
      subtitles: v.subtitles,
      sort_order: i + 1,
    });
  }

  // Insert photos
  for (let i = 0; i < Math.min(GALLERY_PHOTOS.length, 100); i++) {
    const p = GALLERY_PHOTOS[i];
    const url = workingUrls[i % workingUrls.length];
    await supabase.from('photos').insert({
      id: p.id,
      title: p.title,
      category_id: catMap[p.category],
      url,
      description: p.description,
      likes: p.likes,
      width: p.width,
      height: p.height,
      sort_order: i + 1,
    });
  }

  console.log(`Seeded: ${allCategories.length} categories, ${YOUTUBE_VIDEOS.length} videos, ${Math.min(GALLERY_PHOTOS.length, 100)} photos`);
}

seed().catch(e => { console.error(e); process.exit(1); });
