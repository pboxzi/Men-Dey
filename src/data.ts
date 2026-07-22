/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Slide, JournalEntry, MediaItem, UpcomingEvent, CommunityHighlight } from './types';
import { YOUTUBE_VIDEOS } from './mediaData';

export const HERO_SLIDES: Slide[] = [
  {
    id: 'slide-1',
    number: '01',
    quote: "Just remember that we are here to support and lift each other up. Connection is everything.",
    author: "Gillian Anderson",
    image: "/assets/images/gillian_hero_one_1783349664739.jpg"
  },
  {
    id: 'slide-2',
    number: '02',
    quote: "If we don't explore the margins of our curiosity, we never truly learn who we are.",
    author: "Gillian Anderson",
    image: "/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg"
  },
  {
    id: 'slide-3',
    number: '03',
    quote: "There is immense strength in vulnerability. Allowing yourself to be seen is a profound act of courage.",
    author: "Gillian Anderson",
    image: "/assets/images/gillian_speaking_event_1783349739126.jpg"
  },
  {
    id: 'slide-4',
    number: '04',
    quote: "I've always believed that the truth is something we choose to pursue, not something handed to us.",
    author: "Gillian Anderson",
    image: "/assets/images/gillian_studio_portrait_1783349751129.jpg"
  },
  {
    id: 'slide-5',
    number: '05',
    quote: "We are all complex, beautifully flawed creatures. Embrace your depth and celebrate your journey.",
    author: "Gillian Anderson",
    image: "/assets/images/gillian_mentoring_warmth_1783349719383.jpg"
  }
];

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal-1',
    title: "Reflecting on Scully, Seeking Truth, and Female Strength",
    category: "X-Files Retrospective",
    date: "June 24, 2024",
    image: "/assets/images/gillian_investigator_look_1783349694204.jpg",
    excerpt: "Looking back at Agent Dana Scully, the 'Scully Effect', and how seeking the truth shaped generations.",
    readTime: "4 min read",
    content: "It's hard to believe how many years have passed since I first put on Dana Scully's trench coat. At the time, I didn't fully comprehend the impact she would have. She wasn't just a character; she became a symbol for women in science, technology, engineering, and math—what became known as the 'Scully Effect'.\n\nScully was analytical, strong, and skeptical, but she also had a deep capacity for empathy. She taught me so much about quiet strength and standing your ground in rooms where your voice is questioned.\n\n> \"The truth is out there, but so is the courage to look for it. Every step of investigation is a step of self-discovery.\"\n\nI'm incredibly grateful to the fans who have kept the search for truth alive. Thank you for walking this mysterious, beautiful path with me. Keep asking questions. Keep seeking."
  },
  {
    id: 'journal-2',
    title: "On theater, the stage, and creative courage",
    category: "Theater Life",
    date: "June 15, 2024",
    image: "/assets/images/gillian_theatre_rehearsal_1783349680324.jpg",
    excerpt: "The raw adrenaline of the stage, character transformation, and my deep love for live performance.",
    readTime: "5 min read",
    content: "There is nothing quite like the feeling of standing in the wings of a theater, hearing the audience's quiet chatter fade, and stepping into the light. Theater is raw, unforgiving, and completely immediate. There are no retakes, no edits, and no hiding.\n\nPlaying Blanche DuBois in 'A Streetcar Named Desire' or Margo Channing in 'All About Eve' was both terrifying and exhilarating. It demands every ounce of your emotional and physical presence.\n\n> \"The stage is a sacred space of absolute truth. It forces you to be vulnerable, to crack open your chest, and to share a piece of your soul with strangers.\"\n\nFor me, acting has always been about curiosity and empathy—trying to inhabit another person's psyche, to understand their pain, their joy, and their complexities. It's an honor to share these stories in real time with an audience. If you have a creative passion, never let fear keep you from stepping onto your own stage."
  },
  {
    id: 'journal-3',
    title: "Embracing complex women: From Stella Gibson to Margaret Thatcher",
    category: "Behind The Scenes",
    date: "June 02, 2024",
    image: "/assets/images/gillian_mentoring_warmth_1783349719383.jpg",
    excerpt: "Exploring the layers of powerful, controversial, and multifaceted characters on television.",
    readTime: "6 min read",
    content: "In recent years, I've had the privilege of playing characters who are incredibly distinct, powerful, and sometimes highly divisive. From the cool, methodical Detective Superintendent Stella Gibson in 'The Fall', to the liberating Dr. Jean Milburn in 'Sex Education', to the formidable Margaret Thatcher in 'The Crown'.\n\nEach of these women represents a unique facet of female power. Stella is unapologetically herself, completely in control of her sexuality and intellect. Jean is warm, open, and hilariously boundary-free. Margaret was a force of nature, shaped by rigid determination.\n\n> \"I'm interested in the contradictions. Nobody is just one thing. It's the friction between a person's public face and private struggles where the real drama lies.\"\n\nExploring these contradictions is what keeps me in love with acting. I want to thank the brilliant directors, writers, and crews who build these worlds. And thank you, the community, for joining me in exploring these complex souls."
  }
];

export const MEDIA_ITEMS: MediaItem[] = YOUTUBE_VIDEOS;

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: 'event-1',
    day: '28',
    month: 'JUL',
    title: "Live Q&A with Gillian",
    location: "Virtual Event",
    time: "4:00 PM GMT",
    description: "An exclusive digital gathering for official community members. Gillian will sit down to answer submitted questions directly in an intimate, live-streamed conversation."
  },
  {
    id: 'event-2',
    day: '15',
    month: 'AUG',
    title: "The X-Files 30th Anniversary Retrospective",
    location: "London, UK",
    time: "7:00 PM GMT",
    description: "A special commemorative panel and screening event, followed by a live discussion with Gillian Anderson, creators, and surprise guest stars."
  },
  {
    id: 'event-3',
    day: '10',
    month: 'SEP',
    title: "SAYes Mentoring Charity Dinner",
    location: "Cape Town, South Africa",
    time: "6:30 PM SAST",
    description: "Our annual private fundraising dinner to support youth mentoring and education. 100% of proceeds are transferred directly to mentoring program partners."
  }
];

export const INITIAL_COMMUNITY_HIGHLIGHTS: CommunityHighlight[] = [
  {
    id: 'highlight-1',
    username: 'ScullySkeptic',
    handle: '@ScullySkeptic',
    avatarText: 'SS',
    image: "/assets/images/iceland_landscape_1782919139830.jpg",
    content: "Took this scenic shot during my trip. It had that moody, mysterious X-Files atmosphere. Breathtaking and peaceful. 🌲🛸",
    likes: 342,
    replies: 24,
    liked: false,
    category: 'FAN ART',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: 'c1',
        username: 'DanaFan',
        avatarText: 'DF',
        content: 'Absolutely beautiful. Reminds me of the Oregon woods in the pilot!',
        timestamp: '2 hours ago',
        replies: [
          { id: 'c1-r1', username: 'XFilesTraveler', avatarText: 'XT', content: 'You must check out Vancouver! The filming locations are unreal.', timestamp: '1 hour ago' },
          { id: 'c1-r2', username: 'DanaFan', avatarText: 'DF', content: 'Adding it to my travel plans immediately!', timestamp: '45 mins ago' }
        ]
      },
      {
        id: 'c2',
        username: 'GillianInspired',
        avatarText: 'GI',
        content: 'The lighting and fog are beautiful. Great composition!',
        timestamp: '1 hour ago',
        replies: []
      }
    ]
  },
  {
    id: 'highlight-2',
    username: 'ArtByMonica',
    handle: '@ArtByMonica',
    avatarText: 'AM',
    image: "/assets/images/gillian_pencil_sketch_1783350359030.jpg",
    content: "Gillian inspires me every single day. Here is my latest portrait drawing of her. 🎨 Graphite and charcoal on textured paper. Hope you like it!",
    likes: 521,
    replies: 33,
    liked: false,
    category: 'FAN ART',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: 'c3',
        username: 'SketchMaster',
        avatarText: 'SM',
        content: 'The shading is incredible. You captured her elegant and intelligent look perfectly.',
        timestamp: '5 hours ago',
        replies: [
          { id: 'c3-r1', username: 'ArtByMonica', avatarText: 'AM', content: 'Thank you! The hair took almost 4 hours alone.', timestamp: '3 hours ago' }
        ]
      },
      {
        id: 'c4',
        username: 'ScullyIsCool',
        avatarText: 'SC',
        content: 'This is breathtaking! Outstanding drawing of Gillian.',
        timestamp: '4 hours ago',
        replies: []
      }
    ]
  },
  {
    id: 'highlight-3',
    username: 'StageDoorDreamer',
    handle: '@StageDoorDreamer',
    avatarText: 'SD',
    image: "/assets/images/gillian_theatre_rehearsal_1783349680324.jpg",
    content: "A quick photo from the theater production set. Breathtaking to see how the stage magic is built layer by layer! 🎭🎬",
    likes: 298,
    replies: 18,
    liked: false,
    category: 'ENCOUNTERS',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: 'c5',
        username: 'TheaterGeek',
        avatarText: 'TG',
        content: 'You got to see the stage design?! That is absolutely excellent.',
        timestamp: '1 day ago',
        replies: [
          { id: 'c5-r1', username: 'StageDoorDreamer', avatarText: 'SD', content: 'Yes, it was a dream come true. The theater crew is extremely skilled.', timestamp: '12 hours ago' }
        ]
      },
      {
        id: 'c6',
        username: 'GraceAlways',
        avatarText: 'GA',
        content: 'So happy for you! Thanks for sharing this backstage view.',
        timestamp: '18 hours ago',
        replies: []
      }
    ]
  }
];
