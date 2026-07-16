import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:\\man\\.env' });

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const experiences = [
  // ─── MEET & GREET (8) ──────────────────────────────────
  {
    id: 'exp-01', title: 'Morning Coffee with Gillian', category: 'Meet & Greet', tier: 'Gold',
    duration: '2 Hours', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: true,
    description: 'An intimate morning coffee in a quiet London cafe. Talk about life, art, and everything in between with Gillian over freshly brewed espresso.',
    details: ['Private corner table in a cozy London cafe', 'Genuine unscripted conversation', 'Signed copy of "We" Manifesto', 'Professional photo together'],
  },
  {
    id: 'exp-02', title: 'Backstage Pass: Opening Night', category: 'Meet & Greet', tier: 'Platinum',
    duration: '4 Hours', location: 'London West End', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: true,
    description: 'Go backstage after Gillian\'s opening night performance. Witness the post-show rituals, meet the cast, and celebrate the magic of live theatre together.',
    details: ['Exclusive backstage access after the show', 'Meet the full cast and crew', 'Champagne toast with Gillian', 'Souvenir playbill signed by the entire cast'],
  },
  {
    id: 'exp-03', title: 'VIP Gala Reception', category: 'Meet & Greet', tier: 'Diamond',
    duration: '5 Hours', location: 'New York, NY', price: 'Complimentary', spots: 6, spots_taken: 0,
    image: '', popular: false,
    description: 'Attend a formal gala as Gillian\'s personal guest. Enjoy fine dining, live entertainment, and meaningful conversations with fellow advocates and artists.',
    details: ['Black-tie gala dinner with Gillian', 'Reserved seating at Gillian\'s table', 'Professional event photography', 'Exclusive gala gift bag'],
  },
  {
    id: 'exp-04', title: 'Birthday Celebration', category: 'Meet & Greet', tier: 'Diamond',
    duration: '3 Hours', location: 'Flexible', price: 'Complimentary', spots: 1, spots_taken: 0,
    image: '', popular: false,
    description: 'Celebrate your birthday with a personal video call or in-person gathering with Gillian. A once-in-a-lifetime way to mark your special day.',
    details: ['Personalized birthday video message', 'Live video call or in-person celebration', 'Signed birthday card from Gillian', 'Custom birthday gift from the team'],
  },
  {
    id: 'exp-05', title: 'Holiday Gathering', category: 'Meet & Greet', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 8, spots_taken: 0,
    image: '', popular: false,
    description: 'Join Gillian for a cozy holiday gathering with fellow fans. Hot cocoa, carols, and heartwarming conversations about the year gone by.',
    details: ['Intimate holiday party setting', 'Festive afternoon tea', 'Holiday gift exchange', 'Group photo with Gillian'],
  },
  {
    id: 'exp-06', title: 'Private Audience', category: 'Meet & Greet', tier: 'Diamond',
    duration: '1 Hour', location: 'London, UK', price: 'Complimentary', spots: 1, spots_taken: 0,
    image: '', popular: true,
    description: 'A one-on-one private audience with Gillian. No agenda, no time pressure — just a genuine human connection in a beautiful setting.',
    details: ['One-on-one private meeting', 'Beautiful private venue in London', 'Tea and refreshments', 'Signed keepsake from Gillian'],
  },
  {
    id: 'exp-07', title: 'Fan Convention VIP Meet', category: 'Meet & Greet', tier: 'Gold',
    duration: '2 Hours', location: 'Various Cities', price: 'Complimentary', spots: 10, spots_taken: 0,
    image: '', popular: false,
    description: 'Skip the line at fan conventions with a private VIP meet-and-greet session. More time, more depth, more connection.',
    details: ['Private VIP meet-and-greet session', 'Professional photo and autograph', 'Exclusive convention merchandise', 'Priority seating at all panels'],
  },
  {
    id: 'exp-08', title: 'Garden Party Afternoon', category: 'Meet & Greet', tier: 'Gold',
    duration: '3 Hours', location: 'Cotswolds, UK', price: 'Complimentary', spots: 6, spots_taken: 0,
    image: '', popular: false,
    description: 'An elegant garden party in the English countryside. Pimm\'s, scones, and stimulating conversation surrounded by blooming flowers.',
    details: ['Beautiful countryside garden venue', 'Afternoon tea with homemade scones', 'Leisurely garden stroll with Gillian', 'Wildflower bouquet to take home'],
  },

  // ─── CREATIVE (8) ──────────────────────────────────────
  {
    id: 'exp-09', title: 'West End Acting Masterclass', category: 'Creative', tier: 'Platinum',
    duration: '2 Days', location: 'London, UK', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: true,
    description: 'Train with Gillian and West End directors. Learn vocal projection, emotional depth, physical presence, and rehearse a scene on a real London stage.',
    details: ['Vocal projection and cadence training', 'Physical presence and breathing mechanics', 'Character table reading and analysis', 'Professional video of your staged dialogue'],
  },
  {
    id: 'exp-10', title: 'Script Reading with Gillian', category: 'Creative', tier: 'Gold',
    duration: '4 Hours', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Sit across from Gillian and read through a screenplay together. Discuss character motivations, subtext, and the art of bringing words to life.',
    details: ['Full script reading session', 'Character analysis discussion', 'Direction and feedback from Gillian', 'Signed script copy to keep'],
  },
  {
    id: 'exp-11', title: 'Voice Acting Session', category: 'Creative', tier: 'Platinum',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: false,
    description: 'Enter a professional recording studio with Gillian. Learn the craft of voice acting, record a scene together, and take home your performance.',
    details: ['Professional recording studio session', 'Voice warm-up and character work', 'Record a scene together', 'Digital copy of your recorded performance'],
  },
  {
    id: 'exp-12', title: 'Improv Workshop', category: 'Creative', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 6, spots_taken: 0,
    image: '', popular: false,
    description: 'Join Gillian for a playful improv workshop. Break down walls, embrace spontaneity, and discover the joy of creating something from nothing.',
    details: ['Warm-up exercises and trust games', 'Scenes and character work', 'Improv techniques from Gillian\'s career', 'Group photo and signed program'],
  },
  {
    id: 'exp-13', title: 'Photography Walk with Gillian', category: 'Creative', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 3, spots_taken: 0,
    image: '', popular: false,
    description: 'Wander the streets of London with Gillian and a camera. Capture candid moments, discuss visual storytelling, and see the city through an artist\'s eyes.',
    details: ['Guided photography walk through London', 'Tips on composition and light', 'Candid portrait session', 'Digital photo collection from the walk'],
  },
  {
    id: 'exp-14', title: 'Painting Afternoon', category: 'Creative', tier: 'Gold',
    duration: '4 Hours', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Spend an afternoon painting alongside Gillian. No experience needed — just bring your curiosity and let the colors flow.',
    details: ['All art supplies provided', 'Guided painting session', 'Relaxed creative environment', 'Keep your finished artwork'],
  },
  {
    id: 'exp-15', title: 'Writing Workshop', category: 'Creative', tier: 'Gold',
    duration: '4 Hours', location: 'London, UK', price: 'Complimentary', spots: 5, spots_taken: 0,
    image: '', popular: false,
    description: 'Explore the art of writing with Gillian. From journaling to creative fiction, discover how putting pen to paper can transform your inner world.',
    details: ['Creative writing exercises', 'Journaling techniques from Gillian', 'Sharing and feedback circle', 'Signed journal to take home'],
  },
  {
    id: 'exp-16', title: 'Directing Mentorship Day', category: 'Creative', tier: 'Diamond',
    duration: '1 Day', location: 'London, UK', price: 'Complimentary', spots: 1, spots_taken: 0,
    image: '', popular: false,
    description: 'Shadow Gillian through a day of directing decisions. Learn how she approaches scenes, works with actors, and brings a director\'s vision to life.',
    details: ['Full day shadowing Gillian', 'Observe rehearsals and direction', 'Q&A about directing approach', 'Personalized mentoring letter'],
  },

  // ─── PHILANTHROPY (7) ──────────────────────────────────
  {
    id: 'exp-17', title: 'SAYes Mentoring Retreat', category: 'Philanthropy', tier: 'Platinum',
    duration: '5 Days', location: 'Cape Town, SA', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: true,
    description: 'Join Gillian and the SAYes team in South Africa. Participate in mentoring workshops, meet care-leaving youth, and attend the private annual gala.',
    details: ['Mentorship certification workshop', 'Co-design youth transition pathways', 'Round-table dinner with Gillian', 'VIP access to the Cape Town Gala'],
  },
  {
    id: 'exp-18', title: 'Charity Gala Co-Chair', category: 'Philanthropy', tier: 'Diamond',
    duration: '1 Day', location: 'London, UK', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: false,
    description: 'Co-chair a charity gala alongside Gillian. Help select auction items, deliver a joint speech, and champion causes that matter to both of you.',
    details: ['Co-chair the evening with Gillian', 'Joint speech on stage', 'Select and present auction items', 'Private post-gala dinner'],
  },
  {
    id: 'exp-19', title: 'Volunteer Day with SAYes', category: 'Philanthropy', tier: 'Gold',
    duration: '1 Day', location: 'London, UK', price: 'Complimentary', spots: 8, spots_taken: 0,
    image: '', popular: false,
    description: 'Roll up your sleeves and volunteer alongside Gillian for a SAYes community project. Make a real difference while sharing meaningful time together.',
    details: ['Hands-on community project', 'Team building with Gillian', 'Lunch and reflection session', 'Certificate of participation'],
  },
  {
    id: 'exp-20', title: 'Fundraiser Host Experience', category: 'Philanthropy', tier: 'Diamond',
    duration: '2 Days', location: 'Flexible', price: 'Complimentary', spots: 1, spots_taken: 0,
    image: '', popular: false,
    description: 'Co-host a fundraising event with Gillian in your community. Receive guidance on planning, messaging, and making a genuine impact.',
    details: ['Event planning consultation with Gillian', 'Co-host the fundraising event', 'Media and press guidance', 'Post-event reflection and thank-you dinner'],
  },
  {
    id: 'exp-21', title: 'Advocacy Roundtable', category: 'Philanthropy', tier: 'Platinum',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 5, spots_taken: 0,
    image: '', popular: false,
    description: 'Join Gillian and fellow advocates for a roundtable discussion on women\'s rights, youth welfare, and the power of using your platform for good.',
    details: ['Roundtable with Gillian and advocates', 'Discussion on key social issues', 'Action planning workshop', 'Signed advocacy handbook'],
  },
  {
    id: 'exp-22', title: 'Youth Workshop Leader', category: 'Philanthropy', tier: 'Gold',
    duration: '1 Day', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Co-facilitate a youth workshop with Gillian. Help young people build confidence, explore their voices, and discover their potential.',
    details: ['Co-facilitate with Gillian', 'Workshop design and preparation', 'Youth engagement and mentoring', 'Closing ceremony and certificates'],
  },
  {
    id: 'exp-23', title: 'Charity Auction Preview', category: 'Philanthropy', tier: 'Gold',
    duration: '2 Hours', location: 'London, UK', price: 'Complimentary', spots: 6, spots_taken: 0,
    image: '', popular: false,
    description: 'Get an exclusive preview of charity auction items alongside Gillian. Learn about the causes, hear the stories behind each piece, and bid with purpose.',
    details: ['Private auction preview with Gillian', 'Stories behind each auction item', 'Priority bidding access', 'Signed auction catalog'],
  },

  // ─── ADVENTURE (6) ──────────────────────────────────────
  {
    id: 'exp-24', title: 'X-Files Film Location Tour', category: 'Adventure', tier: 'Gold',
    duration: '2 Days', location: 'Vancouver, BC', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: true,
    description: 'Walk in Scully\'s footsteps through the misty forests and eerie locations where The X-Files was filmed. Gillian shares behind-the-scenes stories at every stop.',
    details: ['Guided tour of iconic filming locations', 'Behind-the-scenes stories from Gillian', 'Commemorative FBI badge and field file', 'Professional photo at each location'],
  },
  {
    id: 'exp-25', title: 'Hiking with Gillian', category: 'Adventure', tier: 'Gold',
    duration: '1 Day', location: 'Cotswolds, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Explore the English countryside on a scenic hike with Gillian. Fresh air, rolling hills, and conversations that flow as naturally as the landscape.',
    details: ['Scenic countryside hike', 'Packed lunch and refreshments', 'Nature photography opportunities', 'Commemorative trail map signed by Gillian'],
  },
  {
    id: 'exp-26', title: 'Travel Companion Experience', category: 'Adventure', tier: 'Diamond',
    duration: '3 Days', location: 'Iceland', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: true,
    description: 'Travel to Iceland with Gillian. Explore glaciers, hot springs, and volcanic landscapes while sharing meaningful conversations in one of the world\'s most stunning settings.',
    details: ['Guided tour of Iceland\'s natural wonders', 'Northern Lights viewing', 'Hot spring soak and relaxation', 'Professional travel photography'],
  },
  {
    id: 'exp-27', title: 'Cooking Class with Gillian', category: 'Adventure', tier: 'Gold',
    duration: '4 Hours', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Cook a meal alongside Gillian in a professional kitchen. Learn her favorite recipes, share stories over chopping boards, and enjoy the feast you created together.',
    details: ['Professional kitchen setting', 'Cook a full meal together', 'Recipe cards to take home', 'Enjoy the meal you prepared'],
  },
  {
    id: 'exp-28', title: 'Sunrise Yoga Morning', category: 'Adventure', tier: 'Gold',
    duration: '2 Hours', location: 'London, UK', price: 'Complimentary', spots: 6, spots_taken: 0,
    image: '', popular: false,
    description: 'Greet the day with a sunrise yoga session led by a professional instructor, with Gillian by your side. Breathe, stretch, and set intentions for the day.',
    details: ['Professional yoga instruction', 'Sunrise session in a beautiful setting', 'Meditation and breathwork', 'Healthy breakfast afterwards'],
  },
  {
    id: 'exp-29', title: 'City Exploration Day', category: 'Adventure', tier: 'Gold',
    duration: '6 Hours', location: 'Various Cities', price: 'Complimentary', spots: 3, spots_taken: 0,
    image: '', popular: false,
    description: 'Explore a city like a local with Gillian. Hidden cafes, independent bookshops, art galleries — discover the places guidebooks never mention.',
    details: ['Curated city exploration route', 'Hidden gem recommendations', 'Lunch at a local favorite', 'Personalized city guide from Gillian'],
  },

  // ─── LITERARY (6) ──────────────────────────────────────
  {
    id: 'exp-30', title: 'Private Book Club', category: 'Literary', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 5, spots_taken: 0,
    image: '', popular: true,
    description: 'Join Gillian\'s private book club. Read, discuss, and debate a carefully selected book over wine and cheese in an intimate London setting.',
    details: ['Book selected by Gillian', 'Guided discussion and debate', 'Wine and artisan cheese', 'Signed copy of the book'],
  },
  {
    id: 'exp-31', title: 'Book Signing & Chat', category: 'Literary', tier: 'Gold',
    duration: '2 Hours', location: 'Various Cities', price: 'Complimentary', spots: 8, spots_taken: 0,
    image: '', popular: false,
    description: 'Meet Gillian at an intimate book signing. Have your copy signed, take a photo, and enjoy a brief personal conversation about the book that brought you together.',
    details: ['Personalized book signing', 'Professional photo opportunity', 'Brief personal conversation', 'Exclusive signed bookplate'],
  },
  {
    id: 'exp-32', title: 'Writing Retreat', category: 'Literary', tier: 'Diamond',
    duration: '3 Days', location: 'Cornwall, UK', price: 'Complimentary', spots: 3, spots_taken: 0,
    image: '', popular: true,
    description: 'Escape to the Cornwall coast for a writing retreat with Gillian. Write, reflect, and find your voice in one of England\'s most inspiring landscapes.',
    details: ['Seaside cottage retreat', 'Daily writing sessions with Gillian', 'One-on-one manuscript feedback', 'Published anthology of retreat writings'],
  },
  {
    id: 'exp-33', title: 'Poetry Evening', category: 'Literary', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 6, spots_taken: 0,
    image: '', popular: false,
    description: 'An evening of poetry, prose, and reflection. Share your words, hear Gillian read her favorites, and discover the power of poetry to heal and connect.',
    details: ['Intimate poetry reading', 'Share your own work', 'Curated poetry selections by Gillian', 'Signed poetry anthology'],
  },
  {
    id: 'exp-34', title: 'Library Visit & Tour', category: 'Literary', tier: 'Gold',
    duration: '2 Hours', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Tour a historic London library with Gillian. Explore rare editions, discover hidden literary treasures, and discuss the books that shaped her.',
    details: ['Private library tour', 'Rare book viewing', 'Literary discussion with Gillian', 'Library membership gift'],
  },
  {
    id: 'exp-35', title: 'Book Launch Co-Host', category: 'Literary', tier: 'Diamond',
    duration: '1 Day', location: 'London, UK', price: 'Complimentary', spots: 1, spots_taken: 0,
    image: '', popular: false,
    description: 'Co-host a book launch event with Gillian. Help introduce the author, moderate the Q&A, and celebrate the power of words with fellow book lovers.',
    details: ['Co-host the launch event', 'Introduction and moderation duties', 'Signed first edition', 'Private post-launch dinner'],
  },

  // ─── BEHIND-THE-SCENES (5) ──────────────────────────────
  {
    id: 'exp-36', title: 'On-Set Visit', category: 'Behind-the-Scenes', tier: 'Platinum',
    duration: '1 Day', location: 'Various Studios', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: true,
    description: 'Visit a real film or TV set while Gillian is shooting. Watch the magic unfold, meet the crew, and experience the controlled chaos of production.',
    details: ['Full day on-set observation', 'Meet the production crew', 'Watch scenes being filmed', 'Commemorative crew pass'],
  },
  {
    id: 'exp-37', title: 'Costume Design Session', category: 'Behind-the-Scenes', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 3, spots_taken: 0,
    image: '', popular: false,
    description: 'Explore how costumes bring characters to life. Work with a costume designer and Gillian to understand the art of dressing a character.',
    details: ['Meet a professional costume designer', 'Hands-on costume exploration', 'Character analysis through wardrobe', 'Sketch of your character design'],
  },
  {
    id: 'exp-38', title: 'Makeup & Transformation Tutorial', category: 'Behind-the-Scenes', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 3, spots_taken: 0,
    image: '', popular: false,
    description: 'Learn how makeup transforms actors into characters. A professional makeup artist and Gillian walk you through the magic of prosthetics, aging, and character makeup.',
    details: ['Professional makeup demonstration', 'Hands-on application practice', 'Before-and-after photo session', 'Take-home makeup kit'],
  },
  {
    id: 'exp-39', title: 'Prop Workshop', category: 'Behind-the-Scenes', tier: 'Gold',
    duration: '3 Hours', location: 'London, UK', price: 'Complimentary', spots: 4, spots_taken: 0,
    image: '', popular: false,
    description: 'Get hands-on with iconic props from Gillian\'s career. Learn how props are selected, maintained, and used to tell stories on screen.',
    details: ['View iconic props up close', 'Learn prop selection process', 'Handle and photograph props', 'Prop-themed souvenir'],
  },
  {
    id: 'exp-40', title: 'Editing Suite Visit', category: 'Behind-the-Scenes', tier: 'Platinum',
    duration: '4 Hours', location: 'London, UK', price: 'Complimentary', spots: 2, spots_taken: 0,
    image: '', popular: false,
    description: 'Step into a professional editing suite and learn how raw footage becomes a finished scene. Watch an editor at work and understand the post-production process.',
    details: ['Private editing suite tour', 'Watch footage being assembled', 'Learn about editing decisions', 'Digital copy of uncut behind-the-scenes footage'],
  },
];

async function seed() {
  console.log('Clearing old experiences...');
  const { error: delErr } = await supabase.from('experiences').delete().neq('id', '__none__');
  if (delErr) console.error('Delete warning:', delErr.message);

  console.log(`Seeding ${experiences.length} experiences...`);
  for (const exp of experiences) {
    const { error } = await supabase.from('experiences').upsert(exp, { onConflict: 'id' });
    if (error) console.error(`  X ${exp.id}: ${error.message}`);
    else console.log(`  + ${exp.id} (${exp.category}) ${exp.title}`);
  }

  console.log(`\nDone! Seeded ${experiences.length} experiences.`);
  console.log('\nRun this SQL in Supabase SQL Editor if not done already:');
  console.log('  db/004_expand_experiences.sql');
}

seed();
