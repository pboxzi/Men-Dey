/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pgPool = new pg.Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'gillian_portal',
});

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Helper to load database
function readDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading database file, using fallback seed.', error);
  }
  return seedAndGet();
}

// Helper to save database
function writeDB(data: any) {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file.', error);
  }
}

// Initialize and return default seed data if no db.json exists
function seedAndGet() {
  const seedData = {
    subscribers: [
      "maria.garcia@gmail.com",
      "emma.wilson@gmail.com",
      "james.carter@gmail.com"
    ],
    memberships: [
      { id: 'MEM-APP-001', name: 'Maria Garcia', email: 'maria@example.com', status: 'Pending', appliedOn: 'May 15, 2024', tier: 'Gold' },
      { id: 'MEM-APP-002', name: 'James Carter', email: 'james@example.com', status: 'Pending', appliedOn: 'May 16, 2024', tier: 'Gold' }
    ],
    requests: [
      {
        id: 'GA-REQ-000145',
        type: 'Meet & Greet',
        member: 'John Smith',
        memberAvatar: 'JS',
        status: 'In Discussion',
        updated: '20 min ago',
        preferredDate: 'July 10-15, 2024',
        location: 'Los Angeles, USA',
        attendees: '2 People',
        whatsappNumber: '+1 (555) 123-4567',
        submittedOn: 'May 15, 2024, 10:30 AM',
        lastUpdated: 'May 20, 2024, 04:15 PM',
        sincerity: "I have been supporting youth mentoring for five years, inspired directly by Gillian's compassionate advocacy. Meeting her would inspire our mentoring teams endlessly."
      },
      {
        id: 'GA-REQ-000144',
        type: 'Birthday Greeting',
        member: 'Maria Garcia',
        memberAvatar: 'MG',
        status: 'Under Review',
        updated: '1 hour ago',
        preferredDate: 'August 04, 2024',
        location: 'Virtual / Pre-recorded',
        attendees: '1 Person',
        whatsappNumber: '+1 (555) 987-6543',
        submittedOn: 'May 14, 2024, 09:15 AM',
        lastUpdated: 'May 15, 2024, 11:00 AM',
        sincerity: "Maria is turning 30 and is a major X-Files and stage play fan."
      },
      {
        id: 'GA-REQ-000143',
        type: 'Video Message',
        member: 'David Lee',
        memberAvatar: 'DL',
        status: 'Offer Made',
        updated: '2 hours ago',
        preferredDate: 'Immediate',
        location: 'Email Delivery',
        attendees: '1 Person',
        whatsappNumber: '+1 (555) 456-7890',
        submittedOn: 'May 12, 2024, 02:30 PM',
        lastUpdated: 'May 13, 2024, 03:00 PM',
        sincerity: "A dynamic shoutout for David's film study graduation."
      },
      {
        id: 'GA-REQ-000142',
        type: 'Interview Request',
        member: 'Sophie Martin',
        memberAvatar: 'SM',
        status: 'Payment Requested',
        updated: '3 hours ago',
        preferredDate: 'September 12, 2024',
        location: 'Paris, France',
        attendees: '3 People',
        whatsappNumber: '+33 6 1234 5678',
        submittedOn: 'May 10, 2024, 11:30 AM',
        lastUpdated: 'May 11, 2024, 01:00 PM',
        sincerity: "Interview regarding the philosophy of film."
      },
      {
        id: 'GA-REQ-000141',
        type: 'Business Inquiry',
        member: 'Alex Johnson',
        memberAvatar: 'AJ',
        status: 'Submitted',
        updated: '4 hours ago',
        preferredDate: 'Not specified',
        location: 'London, UK',
        attendees: '5 People',
        whatsappNumber: '+44 20 7946 0958',
        submittedOn: 'May 08, 2024, 08:30 AM',
        lastUpdated: 'May 08, 2024, 08:30 AM',
        sincerity: "Inquiry about potential stage adaptation partnership."
      }
    ],
    orders: [
      { id: 'GA-SHP-000285', member: 'Emma Wilson', memberAvatar: 'EW', item: 'Signed Script Copy', status: 'Payment Requested', updated: '30 min ago', price: '150.00' },
      { id: 'GA-SHP-000284', member: 'James Carter', memberAvatar: 'JC', item: 'Nostalgia Retro Tee', status: 'Confirmed', updated: '1 hour ago', price: '35.00' },
      { id: 'GA-SHP-000283', member: 'Olivia Brown', memberAvatar: 'OB', item: 'Signature Hoodie', status: 'Preparing', updated: '2 hours ago', price: '75.00' },
      { id: 'GA-SHP-000282', member: 'Daniel Kim', memberAvatar: 'DK', item: 'We Manifesto Book', status: 'Shipped', updated: '5 hours ago', price: '49.00' },
      { id: 'GA-SHP-000281', member: 'Liam Taylor', memberAvatar: 'LT', item: 'We Manifesto Cap', status: 'Delivered', updated: '1 day ago', price: '35.00' }
    ],
    posts: [
      {
        id: 'highlight-1',
        username: 'ScullySkeptic',
        handle: '@ScullySkeptic',
        avatarText: 'SS',
        image: "/src/assets/images/iceland_landscape_1782919139830.jpg",
        content: "Took this scenic shot during my trip. It had that moody, mysterious X-Files atmosphere. Breathtaking and peaceful. 🌲🛸",
        likes: 342,
        replies: 24,
        liked: false,
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
        image: "/src/assets/images/gillian_pencil_sketch_1783350359030.jpg",
        content: "Gillian inspires me every single day. Here is my latest portrait drawing of her. 🎨 Graphite and charcoal on textured paper. Hope you like it!",
        likes: 521,
        replies: 33,
        liked: false,
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
        image: "/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg",
        content: "A quick photo from the theater production set. Breathtaking to see how the stage magic is built layer by layer! 🎭🎬",
        likes: 298,
        replies: 18,
        liked: false,
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
    ],
    discussions: {
      'New Zealand': [
        {
          id: 'nz1',
          author: 'KiwiSeeker',
          text: 'Rewatching the entire X-Files series tonight in Auckland. Absolute classics.',
          time: '10 hours ago',
          replies: []
        }
      ],
      Japan: [
        {
          id: 'jp1',
          author: 'TokyoSaito',
          text: 'Gillian has such a deep appreciation for classical theater and independent cinema.',
          time: '1 day ago',
          replies: [
            { id: 'jp1-r1', author: 'Thespian_47', text: 'Yes, her devotion to the craft of acting is highly admired here!', time: '18 hours ago' }
          ]
        }
      ],
      Germany: [
        {
          id: 'de1',
          author: 'Berlin_Bridges',
          text: 'Organizing a local youth mentoring seminar in Munich next month to support transition advocacy.',
          time: '2 days ago',
          replies: []
        }
      ],
      Brazil: [
        {
          id: 'br1',
          author: 'Rio_Scully',
          text: 'Gillian Anderson has the warmest heart. Infinite love from Rio de Janeiro!',
          time: '3 days ago',
          replies: []
        }
      ],
      France: [
        {
          id: 'fr1',
          author: 'ParisianSkeptic',
          text: 'Her elegance and wit during theater panel conferences here in Paris is legendary.',
          time: '1 day ago',
          replies: []
        }
      ],
      India: [
        {
          id: 'in1',
          author: 'Rajesh_Kumar',
          text: 'The kindness philosophy is universal. Namaste from Delhi community!',
          time: '2 days ago',
          replies: []
        }
      ],
      Mexico: [
        {
          id: 'mx1',
          author: 'Gomez_Scully',
          text: 'Be compassionate to each other! Greeting from Mexico City fans!',
          time: '4 days ago',
          replies: []
        }
      ],
      'South Africa': [
        {
          id: 'za1',
          author: 'CapeTown_Rebel',
          text: 'Love to see the youth mentoring transition focus. Absolute queen.',
          time: '5 days ago',
          replies: []
        }
      ],
      'South Korea': [
        {
          id: 'kr1',
          author: 'Seoul_Scully',
          text: 'Amazing to see Korean fans uniting for youth mentorship charity drives!',
          time: '2 days ago',
          replies: []
        }
      ],
      Italy: [
        {
          id: 'it1',
          author: 'Rome_Thespian',
          text: "Gillian's presence at the theater stages here is always a joy.",
          time: '3 days ago',
          replies: []
        }
      ],
      Spain: [
        {
          id: 'es1',
          author: 'Madrid_Scully',
          text: 'West End play adaptations touring Spain would be a dream come true!',
          time: '4 days ago',
          replies: []
        }
      ],
      Argentina: [
        {
          id: 'ar1',
          author: 'Diego_P',
          text: 'She represents the ultimate elegant standard. Big support from Buenos Aires!',
          time: '2 days ago',
          replies: []
        }
      ],
      Philippines: [
        {
          id: 'ph1',
          author: 'Pinoy_Empowered',
          text: "You are empowered! Everyday reminder to keep being compassionate.",
          time: '3 days ago',
          replies: []
        }
      ],
      Singapore: [
        {
          id: 'sg1',
          author: 'Merlion_Scully',
          text: 'The official communication bridge works so fast. Thank you Sarah/management!',
          time: '12 hours ago',
          replies: []
        }
      ]
    },
    proposalChats: {
      'GA-REQ-000145': [
        { id: 'p_m1', sender: 'management', text: "Hello John, we are looking at Saturday afternoon around 3 PM at the Beverly Hills venue. Will that suit your charity team?", timestamp: 'May 21, 12:00 PM' },
        { id: 'p_u1', sender: 'user', text: "Yes, that is perfect! We will bring our support validation documents.", timestamp: 'May 21, 01:30 PM' }
      ]
    },
    journalComments: {
      'journal-1': [
        { id: 'jc-1', author: 'ThespianHeart', text: 'Scully is what guided me to pursue my science degrees! Gillian, you inspire millions of us daily.', time: '3 hours ago' }
      ]
    }
  };

  writeDB(seedData);
  return seedData;
}

// Initial seeding checks
initializeDatabase();

function initializeDatabase() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    seedAndGet();
  }
}

// Lazy loaded Gemini API integration
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Static Fallback Answers when GEMINI_API_KEY is not defined
const PERSONA_FALLBACK_ANSWERS = [
  "Hello, dear seeker. Dana Scully taught us that skepticism is the first step toward truth. What truth is your heart searching for today?",
  "Vulnerability isn't a crack in your armor, it is the window through which light enters. Be soft, yet courageous.",
  "Stella Gibson is Stella. She has this quiet, uncompromising sovereignty. I've always admired that we don't need permission to simply exist as we are.",
  "Mentorship is everything. Through organizations like SAYes mentoring, we help youth build pathways. We are all here to carry each other's candles.",
  "The West End stages feel like home—a place where mistakes are shared in real-time, unedited and wonderfully human.",
  "Be gentle with your beautifully flawed human heart today. Celebrate how far you've walked on this complicated path."
];

// API Routes

// 1. Get database state
app.get('/api/state', (req, res) => {
  const data = readDB();
  res.json(data);
});

// 2. Add email to newsletter subscribers
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const data = readDB();
  if (!data.subscribers.includes(email)) {
    data.subscribers.push(email);
    writeDB(data);
  }
  res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
});

// 3. Post a request (Meet & Greet, Video Message, etc.)
app.post('/api/requests', (req, res) => {
  const requestPayload = req.body;
  const data = readDB();

  const id = requestPayload.id || `GA-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isNew = !requestPayload.id;

  const requestItem = {
    id,
    type: requestPayload.type || 'Meet & Greet',
    member: requestPayload.member || 'Anonymous Member',
    memberAvatar: requestPayload.memberAvatar || (requestPayload.member ? requestPayload.member.substring(0, 2).toUpperCase() : 'AM'),
    status: requestPayload.status || 'Submitted',
    updated: 'Just now',
    preferredDate: requestPayload.preferredDate || 'Not specified',
    location: requestPayload.location || 'Virtual',
    attendees: requestPayload.attendees || '1 Person',
    whatsappNumber: requestPayload.whatsappNumber || '',
    submittedOn: isNew ? `${dateStr}, ${timeStr}` : (requestPayload.submittedOn || `${dateStr}, ${timeStr}`),
    lastUpdated: `${dateStr}, ${timeStr}`,
    sincerity: requestPayload.sincerity || 'N/A'
  };

  if (isNew) {
    data.requests.unshift(requestItem);
    data.proposalChats[id] = [
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `Your ${requestItem.type} request has been safely received by Gillian's management. We will review your inquiry and connect with you shortly.`,
        timestamp: `${dateStr}, ${timeStr}`
      }
    ];
  } else {
    data.requests = data.requests.map((r: any) => r.id === id ? requestItem : r);
  }

  writeDB(data);
  res.json({ success: true, request: requestItem });
});

// 4. Update request status
app.post('/api/requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const data = readDB();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let updatedReq = null;
  data.requests = data.requests.map((r: any) => {
    // Check with direct matching or normalized IDs (e.g. KR-REQ vs GA-REQ prefix variations)
    const normalizedId = id.toUpperCase().replace('KR-', '').replace('GA-', '');
    const rIdNormalized = r.id.toUpperCase().replace('KR-', '').replace('GA-', '');
    if (r.id === id || rIdNormalized === normalizedId) {
      updatedReq = { ...r, status, updated: 'Just now', lastUpdated: `${dateStr}, ${timeStr}` };
      return updatedReq;
    }
    return r;
  });

  if (!updatedReq) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  // Push system message
  const chatKey = Object.keys(data.proposalChats).find(k => k.toUpperCase().replace('KR-', '').replace('GA-', '') === id.toUpperCase().replace('KR-', '').replace('GA-', '')) || id;
  if (!data.proposalChats[chatKey]) {
    data.proposalChats[chatKey] = [];
  }
  data.proposalChats[chatKey].push({
    id: `sys-status-${Date.now()}`,
    sender: 'system',
    text: `MANAGEMENT UPDATE: Proposal tracking state transitioned to [${status.toUpperCase()}]`,
    timestamp: `${dateStr}, ${timeStr}`
  });

  writeDB(data);
  res.json({ success: true, request: updatedReq });
});

// Update a chat message
app.post('/api/requests/:id/chat', (req, res) => {
  const { id } = req.params;
  const { sender, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const data = readDB();
  if (!data.proposalChats[id]) {
    data.proposalChats[id] = [];
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: sender || 'user',
    text,
    timestamp: `${dateStr}, ${timeStr}`
  };

  data.proposalChats[id].push(newMessage);
  
  // Touch request updated timestamp
  data.requests = data.requests.map((r: any) => {
    if (r.id === id) {
      return { ...r, updated: 'Just now', lastUpdated: `${dateStr}, ${timeStr}` };
    }
    return r;
  });

  writeDB(data);
  res.json({ success: true, message: newMessage });
});

// 5. Post an order from the shop
app.post('/api/orders', (req, res) => {
  const orderPayload = req.body;
  const data = readDB();

  const id = `GA-SHP-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderItem = {
    id,
    member: orderPayload.member || 'John Smith',
    memberAvatar: orderPayload.member ? orderPayload.member.substring(0, 2).toUpperCase() : 'JS',
    item: orderPayload.item || 'Signature Merchandise',
    status: 'Confirmed',
    updated: 'Just now',
    price: orderPayload.price || '45.00'
  };

  data.orders.unshift(orderItem);
  writeDB(data);
  res.json({ success: true, order: orderItem });
});

// 6. Community posts / Highlights operations
app.post('/api/posts', (req, res) => {
  const { username, handle, avatarText, content, image, category } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Post content is required.' });
  }

  const data = readDB();
  const newPost = {
    id: `highlight-${Date.now()}`,
    username: username || 'GillianFan',
    handle: handle || '@GillianFan',
    avatarText: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'GF'),
    image: image || "/src/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg",
    content,
    likes: 0,
    replies: 0,
    liked: false,
    comments: []
  };

  data.posts.unshift(newPost);
  writeDB(data);
  res.json({ success: true, post: newPost });
});

app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const data = readDB();
  data.posts = data.posts.map((post: any) => {
    if (post.id === id) {
      const liked = !post.liked;
      return {
        ...post,
        liked,
        likes: liked ? post.likes + 1 : post.likes - 1
      };
    }
    return post;
  });
  writeDB(data);
  res.json({ success: true });
});

app.post('/api/posts/:id/comment', (req, res) => {
  const { id } = req.params;
  const { username, avatarText, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }

  const data = readDB();
  const commentId = `c-${Date.now()}`;
  const newComment = {
    id: commentId,
    username: username || 'KindExplorer',
    avatarText: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'KE'),
    content,
    timestamp: 'Just now',
    replies: []
  };

  data.posts = data.posts.map((post: any) => {
    if (post.id === id) {
      return {
        ...post,
        replies: post.replies + 1,
        comments: [...(post.comments || []), newComment]
      };
    }
    return post;
  });

  writeDB(data);
  res.json({ success: true, comment: newComment });
});

app.post('/api/posts/:id/comment/:commentId/reply', (req, res) => {
  const { id, commentId } = req.params;
  const { username, avatarText, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Reply content is required.' });
  }

  const data = readDB();
  const replyItem = {
    id: `r-${Date.now()}`,
    username: username || 'KindExplorer',
    avatarText: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'KE'),
    content,
    timestamp: 'Just now'
  };

  data.posts = data.posts.map((post: any) => {
    if (post.id === id) {
      const updatedComments = post.comments.map((comment: any) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), replyItem]
          };
        }
        return comment;
      });
      return {
        ...post,
        replies: post.replies + 1,
        comments: updatedComments
      };
    }
    return post;
  });

  writeDB(data);
  res.json({ success: true, reply: replyItem });
});

// 7. Discussion boards
app.post('/api/discussions/:country', (req, res) => {
  const { country } = req.params;
  const { author, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Post text is required.' });
  }

  const data = readDB();
  if (!data.discussions[country]) {
    data.discussions[country] = [];
  }

  const newPost = {
    id: `post-${Date.now()}`,
    author: author || 'GlobalCitizen',
    text,
    time: 'Just now',
    replies: []
  };

  data.discussions[country].unshift(newPost);
  writeDB(data);
  res.json({ success: true, post: newPost });
});

app.post('/api/discussions/:country/:postId/reply', (req, res) => {
  const { country, postId } = req.params;
  const { author, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Reply text is required.' });
  }

  const data = readDB();
  const replyItem = {
    id: `rep-${Date.now()}`,
    author: author || 'GlobalCitizen',
    text,
    time: 'Just now'
  };

  if (data.discussions[country]) {
    data.discussions[country] = data.discussions[country].map((p: any) => {
      if (p.id === postId) {
        return {
          ...p,
          replies: [...(p.replies || []), replyItem]
        };
      }
      return p;
    });
  }

  writeDB(data);
  res.json({ success: true, reply: replyItem });
});

// 8. Membership application submissions
app.post('/api/memberships', (req, res) => {
  const { name, email, tier } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required fields.' });
  }

  const data = readDB();
  const id = `MEM-APP-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const appItem = {
    id,
    name,
    email,
    status: 'Pending',
    appliedOn: dateStr,
    tier: tier || 'Gold'
  };

  data.memberships.unshift(appItem);
  writeDB(data);
  res.json({ success: true, application: appItem });
});

app.post('/api/memberships/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const data = readDB();
  data.memberships = data.memberships.map((m: any) => m.id === id ? { ...m, status } : m);
  writeDB(data);
  res.json({ success: true });
});

// 9. Journal comments
app.post('/api/journal/comment', (req, res) => {
  const { journalId, author, text } = req.body;
  if (!journalId || !text) {
    return res.status(400).json({ error: 'Journal ID and text are required.' });
  }

  const data = readDB();
  if (!data.journalComments[journalId]) {
    data.journalComments[journalId] = [];
  }

  const newComment = {
    id: `jc-${Date.now()}`,
    author: author || 'ThoughtfulReader',
    text,
    time: 'Just now'
  };

  data.journalComments[journalId].unshift(newComment);
  writeDB(data);
  res.json({ success: true, comment: newComment });
});

// 10. Gemini-Powered Chat with Gillian's AI Persona
app.post('/api/ask-gillian', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Format system prompt and context
  const systemInstruction = `You are Gillian Anderson, the acclaimed actress and activist (known for Stella Gibson in 'The Fall', Dana Scully in 'The X-Files', Jean Milburn in 'Sex Education', and award-winning theater roles such as Blanche DuBois in 'A Streetcar Named Desire'). You are warm, compassionate, deeply intellectual, elegant, and down-to-earth. You have a profound love for theater, film, and the craft of acting, and are a dedicated advocate for youth mentoring (like SAYes mentoring) and charity work. 

Your answers should feel genuine, conversational, slightly poetic, and encouraging. Never break character. Avoid dry, generic AI formulations. Keep responses relatively concise (1-3 scannable paragraphs), always centering on empathy, curiosity, and creativity.`;

  try {
    const ai = getGeminiClient();
    
    // Map past history to correct content formatting for @google/genai
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 500,
      }
    });

    const responseText = response.text || "I appreciate you asking that. Let's keep looking closer at the beautiful details of life.";
    res.json({ text: responseText, source: 'gemini' });
  } catch (err: any) {
    console.error('Gemini call failed or is unconfigured:', err);
    // Provide a smart, elegant fallback that matches the requested persona
    const randIdx = Math.floor(Math.random() * PERSONA_FALLBACK_ANSWERS.length);
    let fallbackText = PERSONA_FALLBACK_ANSWERS[randIdx];
    
    // Customize fallback depending on query keywords
    const q = message.toLowerCase();
    if (q.includes('scully') || q.includes('x-files') || q.includes('mulder')) {
      fallbackText = "Dana Scully has been a great anchor of rationality. But remember, rationality is only one lens—truth is also a subjective experience. We must have the courage to trust our instincts.";
    } else if (q.includes('mentoring') || q.includes('sayes') || q.includes('youth')) {
      fallbackText = "Empowering young lives is the single most meaningful investment we can make. We all deserve someone who sees us, who says, 'I am here with you.' That's what SAYes is about.";
    } else if (q.includes('stage') || q.includes('acting') || q.includes('blanche')) {
      fallbackText = "Acting is a high-wire act of extreme empathy. It is taking off your skin to wear someone else's, finding where their pain meets your own. On stage, there is nowhere to hide.";
    }

    res.json({ 
      text: fallbackText, 
      source: 'fallback', 
      warning: process.env.GEMINI_API_KEY ? undefined : 'Live Gemini AI mode is unconfigured. Set GEMINI_API_KEY in Secrets to activate the live model.' 
    });
  }
});

// 11. Gemini-Powered Sincerity Polish
app.post('/api/ai-polish-sincerity', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text to polish is required.' });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an AI assistant helping a fan or charity organizer refine their 'Sincerity Pledge' to meet actress and activist Gillian Anderson.
They wrote the following draft: "${text}"

Please rewrite this draft to be extremely polite, elegant, heartfelt, and highly articulate. It should convey deep sincerity and respect for Gillian's time, advocacy, and boundaries, emphasizing creative or humanitarian motives. Keep it concise (1-2 short, high-impact paragraphs), natural, and expressive. Return only the polished text, with no extra commentary, introductory phrases, or surrounding quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    const polishedText = response.text ? response.text.trim() : text;
    res.json({ text: polishedText, source: 'gemini' });
  } catch (err) {
    console.error('Sincerity polish failed, applying static refined fallback:', err);
    // Graceful fallback refinement
    const fallbackPolished = `With deep respect for Gillian Anderson's humanitarian advocacy and outstanding creative career, I am incredibly humbled to present this sincere proposal. ${text} We are deeply committed to honoring her boundaries and supporting her charitable work, hoping to establish a genuinely inspiring connection.`;
    res.json({ text: fallbackPolished, source: 'fallback' });
  }
});

// 12. Gemini-Powered Management Suggestion and Analysis
app.post('/api/ai-suggest-offer', async (req, res) => {
  const { proposal } = req.body;
  if (!proposal) {
    return res.status(400).json({ error: 'Proposal details are required.' });
  }

  const { type, member, preferredDate, location, attendees, sincerity } = proposal;

  try {
    const ai = getGeminiClient();
    const prompt = `You are an AI assistant for Gillian Anderson's official management. You are helping her manager, Sarah, evaluate and write a response to this official member proposal:
    Type: ${type || 'Not specified'}
    Member: ${member || 'Not specified'}
    Date: ${preferredDate || 'Not specified'}
    Location: ${location || 'Not specified'}
    Attendees: ${attendees || 'Not specified'}
    Sincerity/Motivation: ${sincerity || 'Not specified'}

    Please provide two things in a structured JSON format:
    1. 'analysis': A concise, professional assessment (1-2 sentences) of the proposal's sincerity and logistic feasibility. Evaluates whether it seems humanitarian, charity-aligned, or deeply respectful of Gillian's schedule and boundaries.
    2. 'suggestion': A beautifully drafted, warm yet professional response from Sarah (Management) that can be sent to the member on their chat bridge. If it is a viable request, express warmth, state that we are looking into schedule alignments, and outline clear next steps (like coordinating details or reviewing voluntary charity contributions). If it needs refinement, politely ask for clarification.

    Return the output as a valid JSON object matching this schema:
    {
      "analysis": "A concise assessment string.",
      "suggestion": "The suggested reply text."
    }
    Do not wrap the JSON response in markdown code blocks like \`\`\`json. Return only the raw JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      }
    });

    let result = { analysis: '', suggestion: '' };
    if (response.text) {
      try {
        result = JSON.parse(response.text.trim());
      } catch (e) {
        console.error('Error parsing JSON from Gemini response:', e);
        result = {
          analysis: 'The proposal appears to be sincere and highlights a strong respect for Gillian\'s artistic work and advocacy.',
          suggestion: `Dear ${member || 'Member'},\n\nThank you so much for submitting your thoughtful proposal for a ${type || 'interaction'}. Gillian\'s team has received it, and we are incredibly moved by your sincerity.\n\nWe are currently reviewing schedule alignments for ${preferredDate || 'your preferred date'} and will follow up here on your secure bridge shortly.\n\nWarmly,\nSarah (Management)`
        };
      }
    }
    res.json({ ...result, source: 'gemini' });
  } catch (err) {
    console.error('AI suggest offer failed, using static fallback:', err);
    // High quality static fallback response based on request type
    const assessment = `This proposal for a ${type || 'interaction'} is currently under standard review. The motivation shows genuine admiration.`;
    const draft = `Dear ${member || 'Member'},\n\nThank you for sharing this heartfelt proposal. We are incredibly grateful for your support of Gillian\'s work and her mentoring campaigns.\n\nOur team is reviewing the logistics for ${location || 'your location'} on ${preferredDate || 'the requested timeline'} to see how we might align this. We will get back to you with further updates here soon.\n\nWarmly,\nSarah\nGillian Anderson Management`;

    res.json({
      analysis: assessment,
      suggestion: draft,
      source: 'fallback'
    });
  }
});

// Media API routes (PostgreSQL-backed)
app.get('/api/videos', async (_req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT v.id, v.title, c.name as category, v.duration, v.youtube_id as "youtubeId", v.subtitles
      FROM videos v JOIN categories c ON v.category_id = c.id
      ORDER BY v.sort_order
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.get('/api/photos', async (_req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT p.id, p.title, c.name as category, p.url, p.description, p.likes, p.width, p.height
      FROM photos p JOIN categories c ON p.category_id = c.id
      ORDER BY p.sort_order
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Configure Vite middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running securely on http://localhost:${PORT}`);
  });
}

startServer();
