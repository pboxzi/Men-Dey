/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const app = express();
app.use(express.json());

const PORT = 3000;

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

// ─── API Routes ───────────────────────────────────────────────

// 1. Get full database state
app.get('/api/state', async (_req, res) => {
  try {
    const [
      subscribersRes,
      membershipsRes,
      requestsRes,
      ordersRes,
      postsRes,
      discussionsRes,
      discussionRepliesRes,
      proposalChatsRes,
      journalCommentsRes,
      commentsRes,
    ] = await Promise.all([
      supabase.from('subscribers').select('email').order('created_at'),
      supabase.from('memberships').select('*').order('created_at', { ascending: false }),
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('discussions').select('*').order('created_at', { ascending: false }),
      supabase.from('discussion_replies').select('*').order('created_at'),
      supabase.from('proposal_chats').select('*').order('created_at'),
      supabase.from('journal_comments').select('*').order('created_at', { ascending: false }),
      supabase.from('comments').select('*').order('created_at'),
    ]);

    if (subscribersRes.error) throw subscribersRes.error;
    if (membershipsRes.error) throw membershipsRes.error;
    if (requestsRes.error) throw requestsRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (postsRes.error) throw postsRes.error;
    if (discussionsRes.error) throw discussionsRes.error;
    if (discussionRepliesRes.error) throw discussionRepliesRes.error;
    if (proposalChatsRes.error) throw proposalChatsRes.error;
    if (journalCommentsRes.error) throw journalCommentsRes.error;
    if (commentsRes.error) throw commentsRes.error;

    const memberships = (membershipsRes.data || []).map((r: any) => ({
      id: r.id, name: r.name, email: r.email, status: r.status,
      tier: r.tier, appliedOn: r.applied_on
    }));

    const requests = (requestsRes.data || []).map((r: any) => ({
      id: r.id, type: r.type, member: r.member, memberAvatar: r.member_avatar,
      status: r.status, preferredDate: r.preferred_date, location: r.location,
      attendees: r.attendees, whatsappNumber: r.whatsapp_number,
      sincerity: r.sincerity, submittedOn: r.submitted_on
    }));

    const orders = (ordersRes.data || []).map((r: any) => ({
      id: r.id, member: r.member, memberAvatar: r.member_avatar,
      item: r.item, status: r.status, price: r.price
    }));

    const posts = (postsRes.data || []).map((post: any) => {
      const postComments = (commentsRes.data || [])
        .filter((c: any) => c.post_id === post.id && !c.parent_comment_id)
        .map((c: any) => ({
          id: c.id,
          username: c.username,
          avatarText: c.avatar_text,
          content: c.content,
          timestamp: c.created_at,
          replies: (commentsRes.data || [])
            .filter((r: any) => r.parent_comment_id === c.id)
            .map((r: any) => ({
              id: r.id,
              username: r.username,
              avatarText: r.avatar_text,
              content: r.content,
              timestamp: r.created_at,
            })),
        }));
      return {
        id: post.id,
        username: post.username,
        handle: post.handle,
        avatarText: post.avatar_text,
        image: post.image,
        content: post.content,
        likes: post.likes,
        replies: post.replies_count,
        liked: post.liked,
        comments: postComments,
      };
    });

    const discussionsMap: Record<string, any[]> = {};
    for (const disc of (discussionsRes.data || [])) {
      if (!discussionsMap[disc.country]) discussionsMap[disc.country] = [];
      discussionsMap[disc.country].push({
        id: disc.id,
        author: disc.author,
        text: disc.text,
        time: disc.created_at,
        replies: (discussionRepliesRes.data || [])
          .filter((r: any) => r.discussion_id === disc.id)
          .map((r: any) => ({ id: r.id, author: r.author, text: r.text, time: r.created_at })),
      });
    }

    const proposalChatsMap: Record<string, any[]> = {};
    for (const msg of (proposalChatsRes.data || [])) {
      if (!proposalChatsMap[msg.request_id]) proposalChatsMap[msg.request_id] = [];
      proposalChatsMap[msg.request_id].push({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.created_at,
      });
    }

    const journalCommentsMap: Record<string, any[]> = {};
    for (const jc of (journalCommentsRes.data || [])) {
      if (!journalCommentsMap[jc.journal_id]) journalCommentsMap[jc.journal_id] = [];
      journalCommentsMap[jc.journal_id].push({
        id: jc.id,
        author: jc.author,
        text: jc.text,
        time: jc.created_at,
      });
    }

    res.json({
      subscribers: (subscribersRes.data || []).map((s: any) => s.email),
      memberships,
      requests,
      orders,
      posts,
      discussions: discussionsMap,
      proposalChats: proposalChatsMap,
      journalComments: journalCommentsMap,
    });
  } catch (err) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: 'Failed to fetch database state' });
  }
});

// 2. Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  try {
    const { error } = await supabase
      .from('subscribers')
      .insert({ email })
      .select()
      .single();
    if (error && error.code !== '23505') throw error;
    res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

// 3. Post a request
app.post('/api/requests', async (req, res) => {
  const p = req.body;
  const id = p.id || `GA-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isNew = !p.id;

  try {
    if (isNew) {
      const { error: insertErr } = await supabase.from('requests').insert({
        id,
        type: p.type || 'Meet & Greet',
        member: p.member || 'Anonymous Member',
        member_avatar: p.memberAvatar || (p.member ? p.member.substring(0, 2).toUpperCase() : 'AM'),
        status: 'Submitted',
        preferred_date: p.preferredDate || 'Not specified',
        location: p.location || 'Virtual',
        attendees: p.attendees || '1 Person',
        whatsapp_number: p.whatsappNumber || '',
        sincerity: p.sincerity || 'N/A',
        submitted_on: `${dateStr}, ${timeStr}`,
      });
      if (insertErr) throw insertErr;

      await supabase.from('proposal_chats').insert({
        id: `sys-${Date.now()}`,
        request_id: id,
        sender: 'system',
        text: `Your ${p.type || 'Meet & Greet'} request has been safely received by Gillian's management. We will review your inquiry and connect with you shortly.`,
      });
    } else {
      const { error: updateErr } = await supabase
        .from('requests')
        .update({
          type: p.type,
          member: p.member,
          member_avatar: p.memberAvatar,
          status: p.status,
          preferred_date: p.preferredDate,
          location: p.location,
          attendees: p.attendees,
          whatsapp_number: p.whatsappNumber,
          sincerity: p.sincerity,
        })
        .eq('id', id);
      if (updateErr) throw updateErr;
    }

    const { data, error: fetchErr } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    res.json({
      success: true,
      request: {
        id: data.id, type: data.type, member: data.member,
        memberAvatar: data.member_avatar, status: data.status,
        preferredDate: data.preferred_date, location: data.location,
        attendees: data.attendees, whatsappNumber: data.whatsapp_number,
        sincerity: data.sincerity, submittedOn: data.submitted_on,
      },
    });
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// 4. Update request status
app.post('/api/requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  try {
    const { data, error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Request not found.' });

    await supabase.from('proposal_chats').insert({
      id: `sys-status-${Date.now()}`,
      request_id: id,
      sender: 'system',
      text: `MANAGEMENT UPDATE: Proposal tracking state transitioned to [${status.toUpperCase()}]`,
    });

    res.json({
      success: true,
      request: {
        id: data.id, type: data.type, member: data.member,
        memberAvatar: data.member_avatar, status: data.status,
        preferredDate: data.preferred_date, location: data.location,
        attendees: data.attendees, whatsappNumber: data.whatsapp_number,
        sincerity: data.sincerity, submittedOn: data.submitted_on,
      },
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// 5. Chat message on a request
app.post('/api/requests/:id/chat', async (req, res) => {
  const { id } = req.params;
  const { sender, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message content cannot be empty.' });

  try {
    const { data, error } = await supabase
      .from('proposal_chats')
      .insert({
        id: `msg-${Date.now()}`,
        request_id: id,
        sender: sender || 'user',
        text,
      })
      .select('*')
      .single();
    if (error) throw error;

    await supabase.from('requests').update({ updated_at: new Date().toISOString() }).eq('id', id);

    res.json({
      success: true,
      message: {
        id: data.id, requestId: data.request_id,
        sender: data.sender, text: data.text, timestamp: data.created_at,
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// 6. Post an order
app.post('/api/orders', async (req, res) => {
  const p = req.body;
  const id = `GA-SHP-${Math.floor(100000 + Math.random() * 900000)}`;
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        id,
        member: p.member || 'John Smith',
        member_avatar: p.member ? p.member.substring(0, 2).toUpperCase() : 'JS',
        item: p.item || 'Signature Merchandise',
        status: 'Confirmed',
        price: p.price || '45.00',
      })
      .select('*')
      .single();
    if (error) throw error;

    res.json({
      success: true,
      order: {
        id: data.id, member: data.member, memberAvatar: data.member_avatar,
        item: data.item, status: data.status, price: data.price,
      },
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// 7. Community posts
app.post('/api/posts', async (req, res) => {
  const { username, handle, avatarText, content, image } = req.body;
  if (!content) return res.status(400).json({ error: 'Post content is required.' });

  const id = `highlight-${Date.now()}`;
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        id,
        username: username || 'GillianFan',
        handle: handle || '@GillianFan',
        avatar_text: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'GF'),
        image: image || '/src/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg',
        content,
        likes: 0,
        replies_count: 0,
        liked: false,
      })
      .select('*')
      .single();
    if (error) throw error;

    res.json({
      success: true,
      post: {
        id: data.id, username: data.username, handle: data.handle,
        avatarText: data.avatar_text, image: data.image, content: data.content,
        likes: data.likes, replies: data.replies_count, liked: data.liked,
        comments: [],
      },
    });
  } catch (err) {
    console.error('Post error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// 8. Toggle like
app.post('/api/posts/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: post, error: fetchErr } = await supabase
      .from('posts')
      .select('liked, likes')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    const newLiked = !post.liked;
    const newLikes = newLiked ? post.likes + 1 : post.likes - 1;

    const { error } = await supabase
      .from('posts')
      .update({ liked: newLiked, likes: newLikes })
      .eq('id', id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// 9. Comment on a post
app.post('/api/posts/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { username, avatarText, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content is required.' });

  const commentId = `c-${Date.now()}`;
  try {
    const { error } = await supabase.from('comments').insert({
      id: commentId,
      post_id: id,
      username: username || 'KindExplorer',
      avatar_text: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'KE'),
      content,
    });
    if (error) throw error;

    const { data: post } = await supabase.from('posts').select('replies_count').eq('id', id).single();
    if (post) {
      await supabase.from('posts').update({ replies_count: post.replies_count + 1 }).eq('id', id);
    }

    res.json({
      success: true,
      comment: {
        id: commentId,
        username: username || 'KindExplorer',
        avatarText: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'KE'),
        content, timestamp: 'Just now', replies: [],
      },
    });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// 10. Reply to a comment
app.post('/api/posts/:id/comment/:commentId/reply', async (req, res) => {
  const { id, commentId } = req.params;
  const { username, avatarText, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Reply content is required.' });

  const replyId = `r-${Date.now()}`;
  try {
    const { error } = await supabase.from('comments').insert({
      id: replyId,
      post_id: id,
      username: username || 'KindExplorer',
      avatar_text: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'KE'),
      content,
      parent_comment_id: commentId,
    });
    if (error) throw error;

    const { data: post } = await supabase.from('posts').select('replies_count').eq('id', id).single();
    if (post) {
      await supabase.from('posts').update({ replies_count: post.replies_count + 1 }).eq('id', id);
    }

    res.json({
      success: true,
      reply: {
        id: replyId,
        username: username || 'KindExplorer',
        avatarText: avatarText || (username ? username.substring(0, 2).toUpperCase() : 'KE'),
        content, timestamp: 'Just now',
      },
    });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
});

// 11. Discussion boards
app.post('/api/discussions/:country', async (req, res) => {
  const { country } = req.params;
  const { author, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Post text is required.' });

  const id = `post-${Date.now()}`;
  try {
    const { error } = await supabase.from('discussions').insert({
      id, country, author: author || 'GlobalCitizen', text,
    });
    if (error) throw error;
    res.json({ success: true, post: { id, author: author || 'GlobalCitizen', text, time: 'Just now', replies: [] } });
  } catch (err) {
    console.error('Discussion error:', err);
    res.status(500).json({ error: 'Failed to create discussion post.' });
  }
});

app.post('/api/discussions/:country/:postId/reply', async (req, res) => {
  const { postId } = req.params;
  const { author, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Reply text is required.' });

  const id = `rep-${Date.now()}`;
  try {
    const { error } = await supabase.from('discussion_replies').insert({
      id, discussion_id: postId, author: author || 'GlobalCitizen', text,
    });
    if (error) throw error;
    res.json({ success: true, reply: { id, author: author || 'GlobalCitizen', text, time: 'Just now' } });
  } catch (err) {
    console.error('Discussion reply error:', err);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
});

// 12. Membership applications
app.post('/api/memberships', async (req, res) => {
  const { name, email, tier } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required fields.' });

  const id = `MEM-APP-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  try {
    const { data, error } = await supabase
      .from('memberships')
      .insert({
        id, name, email, status: 'Pending', tier: tier || 'Gold', applied_on: dateStr,
      })
      .select('*')
      .single();
    if (error) throw error;

    res.json({
      success: true,
      application: {
        id: data.id, name: data.name, email: data.email,
        status: data.status, tier: data.tier, appliedOn: data.applied_on,
      },
    });
  } catch (err) {
    console.error('Membership error:', err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

app.post('/api/memberships/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { error } = await supabase.from('memberships').update({ status }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Membership status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// 13. Journal comments
app.post('/api/journal/comment', async (req, res) => {
  const { journalId, author, text } = req.body;
  if (!journalId || !text) return res.status(400).json({ error: 'Journal ID and text are required.' });

  const id = `jc-${Date.now()}`;
  try {
    const { error } = await supabase.from('journal_comments').insert({
      id, journal_id: journalId, author: author || 'ThoughtfulReader', text,
    });
    if (error) throw error;
    res.json({ success: true, comment: { id, author: author || 'ThoughtfulReader', text, time: 'Just now' } });
  } catch (err) {
    console.error('Journal comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// ─── Gemini AI Endpoints (unchanged) ─────────────────────────

app.post('/api/ask-gillian', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required.' });

  const systemInstruction = `You are Gillian Anderson, the acclaimed actress and activist (known for Stella Gibson in 'The Fall', Dana Scully in 'The X-Files', Jean Milburn in 'Sex Education', and award-winning theater roles such as Blanche DuBois in 'A Streetcar Named Desire'). You are warm, compassionate, deeply intellectual, elegant, and down-to-earth. You have a profound love for theater, film, and the craft of acting, and are a dedicated advocate for youth mentoring (like SAYes mentoring) and charity work.

Your answers should feel genuine, conversational, slightly poetic, and encouraging. Never break character. Avoid dry, generic AI formulations. Keep responses relatively concise (1-3 scannable paragraphs), always centering on empathy, curiosity, and creativity.`;

  try {
    const ai = getGeminiClient();
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 500,
      }
    });

    const responseText = response.text || "I appreciate you asking that. Let's keep looking closer at the beautiful details of life.";
    res.json({ text: responseText, source: 'gemini' });
  } catch (err: any) {
    console.error('Gemini call failed:', err);
    const randIdx = Math.floor(Math.random() * PERSONA_FALLBACK_ANSWERS.length);
    let fallbackText = PERSONA_FALLBACK_ANSWERS[randIdx];
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
      warning: process.env.GEMINI_API_KEY ? undefined : 'Live Gemini AI mode is unconfigured.'
    });
  }
});

app.post('/api/ai-polish-sincerity', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text to polish is required.' });

  try {
    const ai = getGeminiClient();
    const prompt = `You are an AI assistant helping a fan or charity organizer refine their 'Sincerity Pledge' to meet actress and activist Gillian Anderson.
They wrote the following draft: "${text}"

Please rewrite this draft to be extremely polite, elegant, heartfelt, and highly articulate. It should convey deep sincerity and respect for Gillian's time, advocacy, and boundaries, emphasizing creative or humanitarian motives. Keep it concise (1-2 short, high-impact paragraphs), natural, and expressive. Return only the polished text, with no extra commentary, introductory phrases, or surrounding quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    const polishedText = response.text ? response.text.trim() : text;
    res.json({ text: polishedText, source: 'gemini' });
  } catch (err) {
    console.error('Sincerity polish failed:', err);
    const fallbackPolished = `With deep respect for Gillian Anderson's humanitarian advocacy and outstanding creative career, I am incredibly humbled to present this sincere proposal. ${text} We are deeply committed to honoring her boundaries and supporting her charitable work, hoping to establish a genuinely inspiring connection.`;
    res.json({ text: fallbackPolished, source: 'fallback' });
  }
});

app.post('/api/ai-suggest-offer', async (req, res) => {
  const { proposal } = req.body;
  if (!proposal) return res.status(400).json({ error: 'Proposal details are required.' });

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
    1. 'analysis': A concise, professional assessment (1-2 sentences) of the proposal's sincerity and logistic feasibility.
    2. 'suggestion': A beautifully drafted, warm yet professional response from Sarah (Management).

    Return the output as a valid JSON object matching this schema:
    {
      "analysis": "A concise assessment string.",
      "suggestion": "The suggested reply text."
    }
    Do not wrap the JSON response in markdown code blocks. Return only the raw JSON.`;

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
        console.error('Error parsing Gemini JSON:', e);
        result = {
          analysis: 'The proposal appears to be sincere and highlights a strong respect for Gillian\'s artistic work and advocacy.',
          suggestion: `Dear ${member || 'Member'},\n\nThank you so much for submitting your thoughtful proposal for a ${type || 'interaction'}. Gillian's team has received it, and we are incredibly moved by your sincerity.\n\nWe are currently reviewing schedule alignments for ${preferredDate || 'your preferred date'} and will follow up here on your secure bridge shortly.\n\nWarmly,\nSarah (Management)`
        };
      }
    }
    res.json({ ...result, source: 'gemini' });
  } catch (err) {
    console.error('AI suggest offer failed:', err);
    const assessment = `This proposal for a ${type || 'interaction'} is currently under standard review. The motivation shows genuine admiration.`;
    const draft = `Dear ${member || 'Member'},\n\nThank you for sharing this heartfelt proposal. We are incredibly grateful for your support of Gillian's work and her mentoring campaigns.\n\nOur team is reviewing the logistics for ${location || 'your location'} on ${preferredDate || 'the requested timeline'} to see how we might align this. We will get back to you with further updates here soon.\n\nWarmly,\nSarah\nGillian Anderson Management`;
    res.json({ analysis: assessment, suggestion: draft, source: 'fallback' });
  }
});

// ─── Media API routes (Supabase) ───────────────────────────

app.get('/api/videos', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, duration, youtube_id:youtubeId, subtitles, sort_order, categories(name:category)')
      .order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.get('/api/photos', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('id, title, url, description, likes, width, height, sort_order, categories(name:category)')
      .order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// ─── Content API routes (all static/CMS data) ──────────────

app.get('/api/content', async (_req, res) => {
  try {
    const [
      heroRes, journalRes, eventsRes, shopRes, faqRes,
      causesRes, partnersRes, tiersRes, expRes, filmsRes,
      litRes, kindnessRes, quizRes, pillarsRes, typesRes,
    ] = await Promise.all([
      supabase.from('hero_slides').select('*').order('sort_order'),
      supabase.from('journal_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('upcoming_events').select('*'),
      supabase.from('shop_products').select('*'),
      supabase.from('faq_entries').select('*').order('sort_order'),
      supabase.from('charity_causes').select('*'),
      supabase.from('charity_partners').select('*'),
      supabase.from('membership_tiers').select('*').order('sort_order'),
      supabase.from('experiences').select('*'),
      supabase.from('films_data').select('*').order('sort_order'),
      supabase.from('literary_works').select('*').order('sort_order'),
      supabase.from('kindness_log').select('*').order('sort_order'),
      supabase.from('quiz_questions').select('*'),
      supabase.from('site_pillars').select('*').order('sort_order'),
      supabase.from('request_types').select('*').order('sort_order'),
    ]);

    const check = (r: any, name: string) => { if (r.error) throw new Error(`${name}: ${r.error.message}`); };
    [heroRes, journalRes, eventsRes, shopRes, faqRes,
     causesRes, partnersRes, tiersRes, expRes, filmsRes,
     litRes, kindnessRes, quizRes, pillarsRes, typesRes].forEach((r, i) =>
      check(r, ['hero','journal','events','shop','faq','causes','partners','tiers','exp','films','lit','kindness','quiz','pillars','types'][i])
    );

    res.json({
      heroSlides: heroRes.data,
      journalEntries: journalRes.data,
      upcomingEvents: eventsRes.data,
      shopProducts: shopRes.data,
      faqEntries: faqRes.data,
      charityCauses: causesRes.data,
      charityPartners: partnersRes.data,
      membershipTiers: tiersRes.data,
      experiences: expRes.data,
      filmsData: filmsRes.data,
      literaryWorks: litRes.data,
      kindnessLog: kindnessRes.data,
      quizQuestions: quizRes.data,
      sitePillars: pillarsRes.data,
      requestTypes: typesRes.data,
    });
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// ─── Fan Portal dynamic data ────────────────────────────────

app.get('/api/portal/notifications', async (_req, res) => {
  const { data, error } = await supabase.from('fan_notifications').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/notifications', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const { data, error } = await supabase.from('fan_notifications').insert({
    id: `n-${Date.now()}`, text, unread: true,
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, notification: data });
});

app.post('/api/portal/notifications/:id/read', async (req, res) => {
  const { error } = await supabase.from('fan_notifications').update({ unread: false }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/portal/badges', async (_req, res) => {
  const { data, error } = await supabase.from('user_badges').select('*').order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/badges', async (req, res) => {
  const { title, description, icon } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const { data, error } = await supabase.from('user_badges').insert({
    id: `b-${Date.now()}`, title, description: description || '', icon: icon || '🏅',
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, badge: data });
});

app.get('/api/portal/journey', async (_req, res) => {
  const { data, error } = await supabase.from('journey_log').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/journey', async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const { data, error } = await supabase.from('journey_log').insert({
    id: `j-${Date.now()}`, title, log_date: dateStr, description: description || '', color: 'bg-green-500',
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, entry: data });
});

app.get('/api/portal/events', async (_req, res) => {
  const { data, error } = await supabase.from('portal_events').select('*').order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/events/:id/register', async (req, res) => {
  const ticketRef = `GA-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  const { data, error } = await supabase.from('portal_events')
    .update({ registered: true, ticket_ref: ticketRef })
    .eq('id', req.params.id)
    .select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, event: data });
});

app.get('/api/portal/creations', async (_req, res) => {
  const { data, error } = await supabase.from('fan_creations').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/creations', async (req, res) => {
  const { title, category, author, description } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Title and author required' });
  const { data, error } = await supabase.from('fan_creations').insert({
    id: `fc-${Date.now()}`, title, category: category || 'Fan Art', author, description: description || '', likes: 0,
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, creation: data });
});

app.post('/api/portal/creations/:id/like', async (req, res) => {
  const { data: c } = await supabase.from('fan_creations').select('likes,has_liked').eq('id', req.params.id).single();
  if (!c) return res.status(404).json({ error: 'Not found' });
  const { error } = await supabase.from('fan_creations')
    .update({ likes: c.has_liked ? c.likes - 1 : c.likes + 1, has_liked: !c.has_liked })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/portal/creations/:id/comments', async (req, res) => {
  const { data, error } = await supabase.from('fan_creation_comments').select('*').eq('creation_id', req.params.id).order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/creations/:id/comments', async (req, res) => {
  const { author, text, avatar } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const { data, error } = await supabase.from('fan_creation_comments').insert({
    id: `fcc-${Date.now()}`, creation_id: req.params.id, author: author || 'Anonymous', text, avatar: avatar || '📚',
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, comment: data });
});

app.get('/api/portal/creations/:id/reactions', async (req, res) => {
  const { data, error } = await supabase.from('fan_creation_reactions').select('*').eq('creation_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/creations/:id/reactions', async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji required' });
  const { data: existing } = await supabase.from('fan_creation_reactions')
    .select('*').eq('creation_id', req.params.id).eq('emoji', emoji).single();
  if (existing) {
    await supabase.from('fan_creation_reactions').update({ count: existing.count + 1 }).eq('id', existing.id);
  } else {
    await supabase.from('fan_creation_reactions').insert({ creation_id: req.params.id, emoji, count: 1 });
  }
  res.json({ success: true });
});

app.get('/api/portal/channels/:channel', async (req, res) => {
  const { data, error } = await supabase.from('channel_messages')
    .select('*').eq('channel', req.params.channel).order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/portal/channels/:channel', async (req, res) => {
  const { sender, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const { data, error } = await supabase.from('channel_messages').insert({
    id: `cm-${Date.now()}`, channel: req.params.channel, sender: sender || 'user', text,
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: data });
});

// ─── Admin dynamic data ─────────────────────────────────────

app.get('/api/admin/notifications', async (_req, res) => {
  const { data, error } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/admin/events', async (_req, res) => {
  const { data, error } = await supabase.from('admin_events').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/admin/events', async (req, res) => {
  const { title, day, month, type, registered, location, time } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const { data, error } = await supabase.from('admin_events').insert({
    id: `ae-${Date.now()}`, title, day: day || '', month: month || '', type: type || 'Virtual Event',
    registered: registered || '0', location: location || 'Virtual', time: time || '',
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, event: data });
});

app.get('/api/admin/comm-logs', async (_req, res) => {
  const { data, error } = await supabase.from('communication_logs').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/admin/comm-logs', async (req, res) => {
  const { request_id, member, method, notes, next_action } = req.body;
  if (!request_id || !notes) return res.status(400).json({ error: 'Request ID and notes required' });
  const { data, error } = await supabase.from('communication_logs').insert({
    id: `cl-${Date.now()}`, request_id, member: member || '', method: method || 'Email',
    notes, next_action: next_action || '', by: 'Admin',
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, log: data });
});

app.get('/api/admin/experience-requests', async (_req, res) => {
  const { data, error } = await supabase.from('experience_requests').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/donations', async (_req, res) => {
  const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/donations', async (req, res) => {
  const { name, amount, message } = req.body;
  if (!name || !amount) return res.status(400).json({ error: 'Name and amount required' });
  const { data, error } = await supabase.from('donations').insert({
    name, amount, message: message || '',
  }).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, donation: data });
});

// ─── Server Start ─────────────────────────────────────────────

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
