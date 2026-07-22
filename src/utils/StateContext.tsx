/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

// Interfaces for our state
export interface RequestDetail {
  id: string;
  type: string;
  member: string;
  memberAvatar: string;
  status: 'Submitted' | 'Under Review' | 'In Discussion' | 'Offer Made' | 'Payment Requested' | 'Confirmed' | 'Completed';
  updated: string;
  preferredDate: string;
  location: string;
  attendees: string;
  whatsappNumber: string;
  submittedOn: string;
  lastUpdated: string;
  sincerity: string;
}

export interface ShopOrder {
  id: string;
  member: string;
  memberAvatar: string;
  item: string;
  status: string;
  updated: string;
  price: string;
}

export interface CommentReply {
  id: string;
  username: string;
  avatarText: string;
  content: string;
  timestamp: string;
}

export interface PostComment {
  id: string;
  username: string;
  avatarText: string;
  content: string;
  timestamp: string;
  replies: CommentReply[];
}

export interface CommunityHighlight {
  id: string;
  username: string;
  handle: string;
  avatarText: string;
  image: string;
  content: string;
  likes: number;
  replies: number;
  liked: boolean;
  category: string;
  comments: PostComment[];
}

export interface DiscussionReply {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface DiscussionPost {
  id: string;
  author: string;
  text: string;
  time: string;
  replies: DiscussionReply[];
}

export interface JournalComment {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'reply' | 'update' | 'alert';
}

export interface ContentState {
  heroSlides: any[];
  journalEntries: any[];
  journalArticles: any[];
  upcomingEvents: any[];
  shopProducts: any[];
  faqEntries: any[];
  charityCauses: any[];
  charityPartners: any[];
  membershipTiers: any[];
  experiences: any[];
  filmsData: any[];
  literaryWorks: any[];
  kindnessLog: any[];
  quizQuestions: any[];
  sitePillars: any[];
  requestTypes: any[];
}

interface StateContextType {
  loading: boolean;
  content: ContentState;
  requests: RequestDetail[];
  orders: ShopOrder[];
  posts: CommunityHighlight[];
  discussions: { [country: string]: DiscussionPost[] };
  journalComments: { [journalId: string]: JournalComment[] };
  subscribers: string[];
  proposalChats: { [requestId: string]: any[] };
  notifications: PortalNotification[];
  
  // Mutations
  addRequest: (type: string, date: string, location: string, attendees: string, whatsapp: string, sincerity: string, userDisplayName: string) => Promise<RequestDetail>;
  updateRequestStatus: (requestId: string, status: RequestDetail['status']) => Promise<RequestDetail>;
  addRequestChatMessage: (requestId: string, sender: 'user' | 'management' | 'system', text: string) => Promise<any>;
  addOrder: (item: string, price: string, userDisplayName: string) => Promise<ShopOrder>;
  addPost: (content: string, image: string | null, username: string, handle: string, category: string) => Promise<CommunityHighlight>;
  likePost: (id: string) => Promise<void>;
  commentPost: (postId: string, content: string, username: string) => Promise<PostComment>;
  replyComment: (postId: string, commentId: string, content: string, username: string) => Promise<CommentReply>;
  addDiscussionPost: (country: string, text: string, author: string) => Promise<DiscussionPost>;
  addDiscussionReply: (country: string, postId: string, text: string, author: string) => Promise<DiscussionReply>;
  addJournalComment: (journalId: string, text: string, author: string) => Promise<JournalComment>;
  subscribeNewsletter: (email: string) => Promise<{ success: boolean; message: string }>;
  askGillian: (message: string, history: { sender: 'user' | 'gillian'; text: string }[]) => Promise<{ text: string; warning?: string }>;
  polishSincerity: (text: string) => Promise<{ text: string }>;
  suggestOffer: (proposal: RequestDetail) => Promise<{ analysis: string; suggestion: string }>;
  addNotification: (title: string, message: string, type: 'reply' | 'update' | 'alert') => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentState>({
    heroSlides: [], journalEntries: [], journalArticles: [], upcomingEvents: [], shopProducts: [],
    faqEntries: [], charityCauses: [], charityPartners: [], membershipTiers: [],
    experiences: [], filmsData: [], literaryWorks: [], kindnessLog: [],
    quizQuestions: [], sitePillars: [], requestTypes: [],
  });
  const [requests, setRequests] = useState<RequestDetail[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [posts, setPosts] = useState<CommunityHighlight[]>([]);
  const [discussions, setDiscussions] = useState<{ [country: string]: DiscussionPost[] }>({});
  const [journalComments, setJournalComments] = useState<{ [journalId: string]: JournalComment[] }>({});
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [proposalChats, setProposalChats] = useState<{ [requestId: string]: any[] }>({});
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);

  const addNotification = (title: string, message: string, type: 'reply' | 'update' | 'alert') => {
    const newNotif: PortalNotification = {
      id: Date.now().toString(),
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ─── Server response field mapping helpers ──────────────────
  const mapRequest = (r: any): RequestDetail => ({
    id: r.id, type: r.type, member: r.member, memberAvatar: r.member_avatar,
    status: r.status, updated: r.updated_at || r.submitted_on || '',
    preferredDate: r.preferred_date, location: r.location,
    attendees: r.attendees, whatsappNumber: r.whatsapp_number,
    sincerity: r.sincerity, submittedOn: r.submitted_on, lastUpdated: r.updated_at,
  });

  const mapOrder = (r: any): ShopOrder => ({
    id: r.id, member: r.member, memberAvatar: r.member_avatar,
    item: r.item, status: r.status, price: r.price, updated: r.updated_at,
  });

  const mapPost = (post: any, comments: any[]): CommunityHighlight => {
    const postComments = comments
      .filter((c: any) => c.post_id === post.id && !c.parent_comment_id)
      .map((c: any) => ({
        id: c.id, username: c.username, avatarText: c.avatar_text,
        content: c.content, timestamp: c.created_at,
        replies: comments
          .filter((r: any) => r.parent_comment_id === c.id)
          .map((r: any) => ({
            id: r.id, username: r.username, avatarText: r.avatar_text,
            content: r.content, timestamp: r.created_at,
          })),
      }));
    return {
      id: post.id, username: post.username, handle: post.handle,
      avatarText: post.avatar_text, image: post.image, content: post.content,
      likes: post.likes, replies: post.replies_count, liked: post.liked,
      category: post.category || 'FAN ART', comments: postComments,
    };
  };

  // Initial Fetch from Supabase
  const fetchState = async () => {
    try {
      const [
        { data: subsData, error: subsErr },
        { data: membershipsData, error: memErr },
        { data: requestsData, error: reqErr },
        { data: ordersData, error: ordErr },
        { data: postsData, error: postErr },
        { data: discussionsData, error: discErr },
        { data: discRepliesData, error: discRepErr },
        { data: proposalChatsData, error: chatErr },
        { data: journalCommentsData, error: jcErr },
        { data: commentsData, error: commErr },
      ] = await Promise.all([
        supabase.from('subscribers').select('email').order('created_at'),
        supabase.from('memberships').select('*').order('updated_at', { ascending: false }),
        supabase.from('requests').select('*').order('updated_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('discussions').select('*').order('created_at'),
        supabase.from('discussion_replies').select('*').order('created_at'),
        supabase.from('proposal_chats').select('*').order('created_at'),
        supabase.from('journal_comments').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at'),
      ]);

      if (!subsErr) setSubscribers((subsData || []).map((s: any) => s.email));
      if (!reqErr) setRequests((requestsData || []).map(mapRequest));
      if (!ordErr) setOrders((ordersData || []).map(mapOrder));
      if (!postErr && !commErr) {
        setPosts((postsData || []).map((p: any) => mapPost(p, commentsData || [])));
      }
      if (!discErr && !discRepErr) {
        const discussionsMap: Record<string, any[]> = {};
        for (const disc of (discussionsData || [])) {
          if (!discussionsMap[disc.country]) discussionsMap[disc.country] = [];
          discussionsMap[disc.country].push({
            id: disc.id, author: disc.author, text: disc.text, time: disc.created_at,
            replies: (discRepliesData || [])
              .filter((r: any) => r.discussion_id === disc.id)
              .map((r: any) => ({ id: r.id, author: r.author, text: r.text, time: r.created_at })),
          });
        }
        setDiscussions(discussionsMap);
      }
      if (!chatErr) {
        const chatsMap: Record<string, any[]> = {};
        for (const msg of (proposalChatsData || [])) {
          if (!chatsMap[msg.request_id]) chatsMap[msg.request_id] = [];
          chatsMap[msg.request_id].push({
            id: msg.id, sender: msg.sender, text: msg.text, timestamp: msg.created_at,
          });
        }
        setProposalChats(chatsMap);
      }
      if (!jcErr) {
        const jcMap: Record<string, any[]> = {};
        for (const jc of (journalCommentsData || [])) {
          if (!jcMap[jc.journal_id]) jcMap[jc.journal_id] = [];
          jcMap[jc.journal_id].push({
            id: jc.id, author: jc.author, text: jc.text, time: jc.created_at,
          });
        }
        setJournalComments(jcMap);
      }

      // ─── Content data ───────────────────────────────────
      const [
        { data: heroRes }, { data: journalRes }, { data: journalArticlesRes }, { data: eventsRes },
        { data: shopRes }, { data: faqRes }, { data: causesRes },
        { data: partnersRes }, { data: tiersRes }, { data: expRes },
        { data: filmsRes }, { data: litRes }, { data: kindnessRes },
        { data: quizRes }, { data: pillarsRes }, { data: typesRes },
      ] = await Promise.all([
        supabase.from('hero_slides').select('*').order('sort_order'),
        supabase.from('journal_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('journal_articles').select('*').order('created_at', { ascending: false }),
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

      setContent({
        heroSlides: heroRes || [],
        journalEntries: journalRes || [],
        journalArticles: journalArticlesRes || [],
        upcomingEvents: eventsRes || [],
        shopProducts: shopRes || [],
        faqEntries: faqRes || [],
        charityCauses: causesRes || [],
        charityPartners: partnersRes || [],
        membershipTiers: tiersRes || [],
        experiences: (expRes || []).map(mapExperience),
        filmsData: filmsRes || [],
        literaryWorks: litRes || [],
        kindnessLog: kindnessRes || [],
        quizQuestions: quizRes || [],
        sitePillars: pillarsRes || [],
        requestTypes: typesRes || [],
      });
    } catch (error) {
      console.error('Failed to fetch full backend state.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // ─── Mutation functions (direct Supabase) ─────────────────

  const addRequest = async (type: string, date: string, location: string, attendees: string, whatsapp: string, sincerity: string, userDisplayName: string) => {
    const id = `GA-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const { error: insertErr } = await supabase.from('requests').insert({
      id, type: type || 'Meet & Greet', member: userDisplayName || 'Anonymous Member',
      member_avatar: userDisplayName.substring(0, 2).toUpperCase(),
      status: 'Submitted', preferred_date: date || 'Not specified', location: location || 'Virtual',
      attendees: attendees || '1 Person', whatsapp_number: whatsapp || '', sincerity: sincerity || 'N/A',
      submitted_on: `${dateStr}, ${timeStr}`,
    });
    if (insertErr) throw new Error('Failed to submit booking request');

    await supabase.from('proposal_chats').insert({
      id: `sys-${Date.now()}`, request_id: id, sender: 'system',
      text: `Your ${type || 'Meet & Greet'} request has been safely received by Gillian's management. We will review your inquiry and connect with you shortly.`,
    });

    await fetchState();
    return mapRequest({ id, type, member: userDisplayName, member_avatar: userDisplayName.substring(0, 2).toUpperCase(), status: 'Submitted', preferred_date: date, location, attendees, whatsapp_number: whatsapp, sincerity, submitted_on: `${dateStr}, ${timeStr}` });
  };

  const updateRequestStatus = async (requestId: string, status: RequestDetail['status']) => {
    const { data, error } = await supabase.from('requests').update({ status }).eq('id', requestId).select('*').single();
    if (error || !data) throw new Error('Failed to update request status');

    await supabase.from('proposal_chats').insert({
      id: `sys-status-${Date.now()}`, request_id: requestId, sender: 'system',
      text: `MANAGEMENT UPDATE: Proposal tracking state transitioned to [${status.toUpperCase()}]`,
    });

    await fetchState();
    return mapRequest(data);
  };

  const addRequestChatMessage = async (requestId: string, sender: 'user' | 'management' | 'system', text: string) => {
    const { data, error } = await supabase.from('proposal_chats').insert({
      id: `msg-${Date.now()}`, request_id: requestId, sender, text,
    }).select('*').single();
    if (error) throw new Error('Failed to send message');

    await supabase.from('requests').update({ updated_at: new Date().toISOString() }).eq('id', requestId);

    await fetchState();
    return { id: data.id, requestId: data.request_id, sender: data.sender, text: data.text, timestamp: data.created_at };
  };

  const addOrder = async (item: string, price: string, userDisplayName: string) => {
    const id = `GA-SHP-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase.from('orders').insert({
      id, member: userDisplayName || 'John Smith',
      member_avatar: userDisplayName ? userDisplayName.substring(0, 2).toUpperCase() : 'JS',
      item: item || 'Signature Merchandise', status: 'Confirmed', price: price || '45.00',
    }).select('*').single();
    if (error) throw new Error('Failed to process merchandise order');
    await fetchState();
    return mapOrder(data);
  };

  const addPost = async (content: string, image: string | null, username: string, handle: string, category: string = 'FAN ART') => {
    const id = `highlight-${Date.now()}`;
    const { data, error } = await supabase.from('posts').insert({
      id, username: username || 'GillianFan', handle: handle || '@GillianFan',
      avatar_text: username ? username.substring(0, 2).toUpperCase() : 'GF',
      image: image || '/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg',
      content, likes: 0, replies_count: 0, liked: false, category,
    }).select('*').single();
    if (error) throw new Error('Failed to share community post');
    await fetchState();
    return {
      id: data.id, username: data.username, handle: data.handle, avatarText: data.avatar_text,
      image: data.image, content: data.content, likes: data.likes, replies: data.replies_count,
      liked: data.liked, category: data.category || 'FAN ART', comments: [],
    };
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw new Error('Failed to remove story');
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const likePost = async (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const liked = !p.liked;
        return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
      }
      return p;
    }));

    const { data: post } = await supabase.from('posts').select('liked, likes').eq('id', id).single();
    if (post) {
      const newLiked = !post.liked;
      const newLikes = newLiked ? post.likes + 1 : post.likes - 1;
      const { error } = await supabase.from('posts').update({ liked: newLiked, likes: newLikes }).eq('id', id);
      if (error) await fetchState();
    }
  };

  const commentPost = async (postId: string, content: string, username: string) => {
    const commentId = `c-${Date.now()}`;
    const { error } = await supabase.from('comments').insert({
      id: commentId, post_id: postId, username: username || 'KindExplorer',
      avatar_text: username ? username.substring(0, 2).toUpperCase() : 'KE', content,
    });
    if (error) throw new Error('Failed to comment on post');

    const { data: post } = await supabase.from('posts').select('replies_count').eq('id', postId).single();
    if (post) {
      await supabase.from('posts').update({ replies_count: post.replies_count + 1 }).eq('id', postId);
    }
    await fetchState();
    return { id: commentId, username: username || 'KindExplorer', avatarText: username ? username.substring(0, 2).toUpperCase() : 'KE', content, timestamp: 'Just now', replies: [] };
  };

  const replyComment = async (postId: string, commentId: string, content: string, username: string) => {
    const replyId = `r-${Date.now()}`;
    const { error } = await supabase.from('comments').insert({
      id: replyId, post_id: postId, username: username || 'KindExplorer',
      avatar_text: username ? username.substring(0, 2).toUpperCase() : 'KE', content, parent_comment_id: commentId,
    });
    if (error) throw new Error('Failed to post reply');

    const { data: post } = await supabase.from('posts').select('replies_count').eq('id', postId).single();
    if (post) {
      await supabase.from('posts').update({ replies_count: post.replies_count + 1 }).eq('id', postId);
    }
    await fetchState();
    return { id: replyId, username: username || 'KindExplorer', avatarText: username ? username.substring(0, 2).toUpperCase() : 'KE', content, timestamp: 'Just now' };
  };

  const addDiscussionPost = async (country: string, text: string, author: string) => {
    const id = `post-${Date.now()}`;
    const { error } = await supabase.from('discussions').insert({
      id, country, author: author || 'GlobalCitizen', text,
    });
    if (error) throw new Error('Failed to submit post to country board');
    await fetchState();
    return { id, author: author || 'GlobalCitizen', text, time: 'Just now', replies: [] };
  };

  const addDiscussionReply = async (country: string, postId: string, text: string, author: string) => {
    const id = `rep-${Date.now()}`;
    const { error } = await supabase.from('discussion_replies').insert({
      id, discussion_id: postId, author: author || 'GlobalCitizen', text,
    });
    if (error) throw new Error('Failed to reply to discussion post');
    await fetchState();
    return { id, author: author || 'GlobalCitizen', text, time: 'Just now' };
  };

  const addJournalComment = async (journalId: string, text: string, author: string) => {
    const id = `jc-${Date.now()}`;
    const { error } = await supabase.from('journal_comments').insert({
      id, journal_id: journalId, author: author || 'ThoughtfulReader', text,
    });
    if (error) throw new Error('Failed to post comment on journal');
    await fetchState();
    return { id, author: author || 'ThoughtfulReader', text, time: 'Just now' };
  };

  const subscribeNewsletter = async (email: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    const { error } = await supabase.from('subscribers').insert({ email }).select().single();
    if (error && error.code !== '23505') {
      return { success: false, message: 'Failed to subscribe.' };
    }
    await fetchState();
    return { success: true, message: 'Successfully subscribed to the newsletter!' };
  };

  // ─── Gemini AI fallback (client-side) ──────────────────────

  const PERSONA_FALLBACK_ANSWERS = [
    "Hello, dear seeker. Dana Scully taught us that skepticism is the first step toward truth. What truth is your heart searching for today?",
    "Vulnerability isn't a crack in your armor, it is the window through which light enters. Be soft, yet courageous.",
    "Stella Gibson is Stella. She has this quiet, uncompromising sovereignty. I've always admired that we don't need permission to simply exist as we are.",
    "Mentorship is everything. Through organizations like SAYes mentoring, we help youth build pathways. We are all here to carry each other's candles.",
    "The West End stages feel like home—a place where mistakes are shared in real-time, unedited and wonderfully human.",
    "Be gentle with your beautifully flawed human heart today. Celebrate how far you've walked on this complicated path.",
    "Art has a way of finding us when we need it most. Whether it's a film, a book, or a conversation—it arrives exactly on time.",
    "I believe every act of kindness, no matter how small, ripples outward. You never know whose day you've just changed.",
    "The thing about Scully that resonated so deeply was that she never stopped questioning. Never stop asking questions, dear.",
    "Take a breath. You're doing better than you think. That's something I remind myself of daily."
  ];

  const PERSONA_CONTEXTUAL_ANSWERS: Record<string, string> = {
    scully: "Dana Scully has been a great anchor of rationality. But remember, rationality is only one lens—truth is also a subjective experience. We must have the courage to trust our instincts.",
    'x-files': "The X-Files taught me that the unknown isn't something to fear—it's something to explore. Mulder and Scully showed us that belief and skepticism can walk hand in hand.",
    mulder: "David was such a wonderful scene partner. The dynamic between Mulder and Scully was about two people who challenged each other to be better, to dig deeper.",
    mentoring: "Empowering young lives is the single most meaningful investment we can make. We all deserve someone who sees us, who says, 'I am here with you.' That's what SAYes is about.",
    sayes: "SAYes Mentoring is close to my heart. Connecting young people transitioning out of care with mentors—it changes lives, including the mentors' own.",
    youth: "Every young person deserves a champion—someone who believes in their potential before they can see it themselves.",
    stage: "Acting is a high-wire act of extreme empathy. It is taking off your skin to wear someone else's, finding where their pain meets your own. On stage, there is nowhere to hide.",
    acting: "The craft of acting is really the art of listening. You're not performing at someone—you're responding to them, moment by moment.",
    blanche: "Blanche DuBois broke my heart open. She taught me about the fragile courage it takes to face reality when fantasy is so much kinder.",
    fall: "Stella Gibson was one of the most complex, empowering characters I've ever played. She refuses to perform femininity for anyone else's comfort.",
    stella: "Stella taught me that quiet authority doesn't need to raise its voice. Sometimes the most powerful thing is to simply not move.",
    sex: "Jean Milburn was a joy. She represents the mother I think many of us wish we had—open, honest, and completely without shame.",
    jean: "Jean Milburn showed me that talking openly about the things we're supposed to hide is actually the most radical form of love.",
    charity: "Charity isn't about grand gestures. It's about showing up, consistently, for the things that matter. It's about saying 'this cause is worth my time.'",
    crown: "Playing Margaret Thatcher was the most transformative experience of my career. I had to find the human being beneath the icon.",
    thatcher: "Understanding Thatcher meant understanding conviction—whether you agree with her politics or not, she never wavered. That kind of certainty is both admirable and terrifying.",
    thank: "You're so welcome. The fact that you're here, engaging with these ideas, says something beautiful about who you are.",
    hello: "Hello, lovely to connect with you. What's on your mind today? I'm genuinely curious.",
    hi: "Hi there! It's always wonderful to hear from someone in the community. What shall we talk about?",
    love: "Love is the most courageous thing we can practice. Not the Hollywood version—the real, messy, showing-up-every-day kind.",
    life: "Life has taught me that the moments that matter most aren't the ones we plan for. They're the unexpected connections, the sudden recognitions of beauty.",
    book: "Writing 'We' and curating 'Want' were deeply personal experiences. Books have a way of finding the words we can't find for ourselves.",
    film: "Film has this extraordinary power to build bridges between people who've never met. A good story makes the stranger's experience feel like your own.",
  };

  const askGillian = async (message: string, history: { sender: 'user' | 'gillian'; text: string }[]) => {
    const q = message.toLowerCase();
    let fallbackText = '';
    for (const [keyword, answer] of Object.entries(PERSONA_CONTEXTUAL_ANSWERS)) {
      if (q.includes(keyword)) { fallbackText = answer; break; }
    }
    if (!fallbackText) {
      fallbackText = PERSONA_FALLBACK_ANSWERS[Math.floor(Math.random() * PERSONA_FALLBACK_ANSWERS.length)];
    }

    addNotification(
      'Gillian Anderson Replied',
      `Reply received: "${fallbackText.substring(0, 75)}..."`,
      'reply'
    );
    return { text: fallbackText, warning: 'AI features use local fallback (Gemini Edge Function required for AI-powered responses).' };
  };

  const polishSincerity = async (text: string) => {
    const fallbackPolished = `With deep respect for Gillian Anderson's humanitarian advocacy and outstanding creative career, I am incredibly humbled to present this sincere proposal. ${text} We are deeply committed to honoring her boundaries and supporting her charitable work, hoping to establish a genuinely inspiring connection.`;
    return { text: fallbackPolished };
  };

  const suggestOffer = async (proposal: RequestDetail) => {
    const assessment = `This proposal for a ${proposal.type || 'interaction'} is currently under standard review. The motivation shows genuine admiration.`;
    const draft = `Dear ${proposal.member || 'Member'},\n\nThank you for sharing this heartfelt proposal. We are incredibly grateful for your support of Gillian's work and her mentoring campaigns.\n\nOur team is reviewing the logistics for ${proposal.location || 'your location'} on ${proposal.preferredDate || 'the requested timeline'} to see how we might align this. We will get back to you with further updates here soon.\n\nWarmly,\nSarah\nGillian Anderson Management`;
    return { analysis: assessment, suggestion: draft };
  };

  // ─── Experience helper (used by fetchState) ───────────────
  const mapExperience = (e: any) => ({
    id: e.id, title: e.title, category: e.category || 'Meet & Greet', tier: e.tier || 'Gold',
    duration: e.duration, location: e.location, price: e.price || 'Complimentary',
    spots: e.spots || 10, spotsTaken: e.spots_taken || 0, description: e.description,
    short_description: e.short_description || e.description?.substring(0, 120) || '',
    full_description: e.full_description || e.description || '', details: e.details || [],
    image: e.image || '', gallery_images: e.gallery_images || e.image || '',
    is_virtual: e.is_virtual === true || e.capacity?.toLowerCase() === 'virtual',
    max_guests: e.max_guests || e.spots || 10, availability: e.availability || 'Available',
    booking_requirements: e.booking_requirements || e.intensity || '',
    featured: e.featured === true || e.popular === true, published: e.published !== false,
    archived: e.archived === true, popular: e.popular || false,
    sort_order: e.sort_order || 0, capacity: e.capacity || '', intensity: e.intensity || '',
  });

  return (
    <StateContext.Provider
      value={{
        loading,
        content,
        requests,
        orders,
        posts,
        discussions,
        journalComments,
        subscribers,
        proposalChats,
        notifications,
        addRequest,
        updateRequestStatus,
        addRequestChatMessage,
        addOrder,
        addPost,
        deletePost,
        likePost,
        commentPost,
        replyComment,
        addDiscussionPost,
        addDiscussionReply,
        addJournalComment,
        subscribeNewsletter,
        askGillian,
        polishSincerity,
        suggestOffer,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a StateProvider');
  }
  return context;
}
