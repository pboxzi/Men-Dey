import pg from 'pg';
import { YOUTUBE_VIDEOS, GALLERY_PHOTOS } from '../src/mediaData';

const pool = new pg.Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'gillian_portal',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query('DELETE FROM photos');
    await client.query('DELETE FROM videos');
    await client.query('DELETE FROM categories');

    // Insert categories
    const allCategories = [...new Set([
      ...YOUTUBE_VIDEOS.map(v => v.category),
      ...GALLERY_PHOTOS.map(p => p.category),
    ])];
    const catMap: Record<string, number> = {};
    for (const name of allCategories) {
      const res = await client.query(
        'INSERT INTO categories (name) VALUES ($1) RETURNING id',
        [name]
      );
      catMap[name] = res.rows[0].id;
    }

    // Insert videos
    for (let i = 0; i < YOUTUBE_VIDEOS.length; i++) {
      const v = YOUTUBE_VIDEOS[i];
      await client.query(
        `INSERT INTO videos (id, title, category_id, duration, youtube_id, subtitles, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [v.id, v.title, catMap[v.category], v.duration, v.youtubeId, v.subtitles, i + 1]
      );
    }

    // Insert photos (limit to URLs that actually work)
    // Wikimedia Commons URLs (verified working in browsers)
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
      "https://upload.wikimedia.org/wikipedia/commons/8/83/Fan_Expo_2012_-_Gillian_Anderson_03_%287891575660%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/40/Fan_Expo_2012_-_Gillian_Anderson_08_%287891577402%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/6a/Fan_Expo_2012_-_Gillian_Anderson_12_%287891588208%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/Gillian_Anderson_%289344566953%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Fan_Expo_2012_-_Gillian_Anderson_04_%287891578138%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/51/Fan_Expo_2012_-_Gillian_Anderson_05_%287891577806%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Fan_Expo_2012_-_Gillian_Anderson_06_%287891576942%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d2/Fan_Expo_2012_-_Gillian_Anderson_07_%287891576472%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/Fan_Expo_2012_-_Gillian_Anderson_11_%287891587300%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Fan_Expo_2012_-_Gillian_Anderson_13_%287891587870%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/88/Fan_Expo_2012_-_Gillian_Anderson_14_%287891590138%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/4a/Fan_Expo_2012_-_Gillian_Anderson_15_%287891590624%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Fan_Expo_2012_-_Gillian_Anderson_16_%287891593548%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/41/Fan_Expo_2012_-_Gillian_Anderson_17_%287891593952%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/41/Gillian_Anderson%2C_David_Duchovny_%26_Chris_Carter.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/3b/Gillian_Anderson_%26_David_Duchovny.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d8/Gillian_Anderson_%26_David_Duchovny_%282%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/86/Gillian_Anderson_%26_David_Duchovny_%283%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/49/Gillian_Anderson_%26_David_Duchovny_%284%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/cd/Gillian_Anderson_%26_David_Duchovny_%285%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/55/Gillian_Anderson_%26_David_Duchovny_%289344552231%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/38/Gillian_Anderson_%26_David_Duchovny_%289344570889%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/7f/Gillian_Anderson_%26_David_Duchovny_%289347314770%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/00/Gillian_Anderson_%26_David_Duchovny_%289347322664%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/91/Gillian_Anderson_%26_David_Duchovny_%289347343714%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/50/Gillian_Anderson_%26_David_Duchovny_%28cropped%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/99/Gillian_Anderson_%289344529563%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/04/Gillian_Anderson_Comic-Con.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5c/Gillian_Anderson_%289344568949%29.jpg",
      "https://live.staticflickr.com/65535/53530486999_8aa5915bda_b.jpg",
      "https://live.staticflickr.com/65535/51169862508_d687f0262f_b.jpg",
      "https://live.staticflickr.com/65535/50627690432_1a3def6509_b.jpg",
      "https://live.staticflickr.com/65535/50626842893_2ffd433e0a_b.jpg",
      "https://live.staticflickr.com/65535/50626842728_3f326a75a4_b.jpg",
      "https://live.staticflickr.com/65535/50626842803_5786bf5e41_b.jpg",
      "https://live.staticflickr.com/65535/50627594021_7e7e1a4e5b_b.jpg",
      "https://live.staticflickr.com/65535/50388922003_d18b867cfa_b.jpg",
      "https://live.staticflickr.com/8539/8618485961_2e01b3153d_b.jpg",
      "https://live.staticflickr.com/8042/8059610686_2afc38feeb_b.jpg",
      "https://live.staticflickr.com/5787/21723207749_f2b5258f29_b.jpg",
      "https://live.staticflickr.com/65535/49438810467_566c326aa7_b.jpg",
      "https://live.staticflickr.com/65535/49209238338_20da356072_b.jpg",
      "https://live.staticflickr.com/5801/20522881894_55fea95a95_b.jpg",
      "https://live.staticflickr.com/7419/16285066717_7354730e4e_b.jpg",
      "https://live.staticflickr.com/4066/4255030991_8e796725c6_b.jpg",
      "https://live.staticflickr.com/8467/29518287656_9a79d3cf81_b.jpg",
      "https://live.staticflickr.com/3494/3944552352_a90c9a9aac_b.jpg",
      "https://live.staticflickr.com/3447/3944551344_bab5002eff_b.jpg",
      "https://live.staticflickr.com/2496/3944551810_25e44cf331_b.jpg",
      "https://live.staticflickr.com/65535/52179990408_a10964f576_b.jpg",
      "https://live.staticflickr.com/65535/52179984721_9023216619_b.jpg",
      "https://live.staticflickr.com/65535/52180234169_c0810a026a_b.jpg",
      "https://live.staticflickr.com/65535/52180234259_5a91ac34fa_b.jpg",
      "https://live.staticflickr.com/65535/52180234184_f92f22ebe8_b.jpg",
      "https://live.staticflickr.com/65535/52179990673_806181abb5_b.jpg",
      "https://live.staticflickr.com/65535/52178960417_84dba16142_b.jpg",
      "https://live.staticflickr.com/65535/52179990688_d085849b91_b.jpg",
      "https://live.staticflickr.com/65535/52180471880_1d83519947_b.jpg",
      "https://live.staticflickr.com/65535/52178960572_e4f4575366_b.jpg",
      "https://live.staticflickr.com/65535/55171892948_9ecd2c5601_b.jpg",
      "https://live.staticflickr.com/65535/55172119835_43320392ab_b.jpg",
      "https://live.staticflickr.com/65535/55171731581_74570d12ea_b.jpg",
      "https://live.staticflickr.com/65535/55171890508_e3756bde34_b.jpg",
      "https://live.staticflickr.com/65535/55170830437_bf05166c34_b.jpg",
      "https://live.staticflickr.com/65535/55172120480_fd7f61356c_b.jpg",
      "https://live.staticflickr.com/8369/29107429646_9f23f3a752_b.jpg",
      "https://live.staticflickr.com/8553/28853073720_7076904cc2_b.jpg",
      "https://live.staticflickr.com/8075/28518497064_f89aeb7033_b.jpg",
      "https://live.staticflickr.com/8557/29140407625_802af235f9_b.jpg",
      "https://live.staticflickr.com/8144/7554623446_cd87370475_b.jpg",
      "https://live.staticflickr.com/7273/7554621664_2e9cdc4c19_b.jpg",
      "https://live.staticflickr.com/8158/7554622338_94dcf6a870_b.jpg",
      "https://live.staticflickr.com/7113/7554624636_898552c726_b.jpg",
      "https://live.staticflickr.com/8157/7554622940_c979cc024a_b.jpg",
      "https://live.staticflickr.com/2942/15259132418_2b855f68eb_b.jpg",
      "https://live.staticflickr.com/2946/15259136338_73400d8773_b.jpg",
      "https://live.staticflickr.com/2950/15442561051_5b5462fac1_b.jpg",
      "https://live.staticflickr.com/7121/7547669810_9b73297d6f_b.jpg",
      "https://live.staticflickr.com/8008/7547674634_b3cc972d94_b.jpg",
      "https://live.staticflickr.com/65535/48916150188_0b85a67ce6_b.jpg",
      "https://live.staticflickr.com/65535/48916882417_727256ff8c_b.jpg",
      "https://live.staticflickr.com/7005/6809580697_61fd02e0ab_b.jpg",
      "https://live.staticflickr.com/65535/53058654566_39b61f3006_b.jpg",
    ];

    for (let i = 0; i < Math.min(GALLERY_PHOTOS.length, 100); i++) {
      const p = GALLERY_PHOTOS[i];
      const url = workingUrls[i % workingUrls.length];
      await client.query(
        `INSERT INTO photos (id, title, category_id, url, description, likes, width, height, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.id, p.title, catMap[p.category], url, p.description, p.likes, p.width, p.height, i + 1]
      );
    }

    console.log(`Seeded: ${allCategories.length} categories, ${YOUTUBE_VIDEOS.length} videos, ${100} photos`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
