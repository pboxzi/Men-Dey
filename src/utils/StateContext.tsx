/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  addPost: (content: string, image: string | null, username: string, handle: string) => Promise<CommunityHighlight>;
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
    heroSlides: [], journalEntries: [], upcomingEvents: [], shopProducts: [],
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
  const [notifications, setNotifications] = useState<PortalNotification[]>([
    {
      id: '1',
      title: 'Reply from Gillian Anderson',
      message: 'Gillian responded to your question: "Our backstage habits define how we connect with the silence..."',
      timestamp: '5m ago',
      read: false,
      type: 'reply'
    },
    {
      id: '2',
      title: 'New Journal Release',
      message: 'Gillian published a new exclusive journal post: "Behind the scenes of my West End play rehearsals."',
      timestamp: '2h ago',
      read: false,
      type: 'update'
    },
    {
      id: '3',
      title: 'Experience Update',
      message: 'Your application for "Private Live-Streamed Conclave" has been updated to "Under Review".',
      timestamp: '1d ago',
      read: true,
      type: 'alert'
    },
    {
      id: '4',
      title: 'Shop Restock Alert',
      message: 'Limited edition signed scripts of "The X-Files" pilot are now restocked in the Sanctuary Shop.',
      timestamp: '3d ago',
      read: true,
      type: 'alert'
    }
  ]);

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

  // Initial Fetch from backend state
  const fetchState = async () => {
    try {
      const [stateRes, contentRes] = await Promise.all([
        fetch('/api/state'),
        fetch('/api/content'),
      ]);
      if (stateRes.ok) {
        const data = await stateRes.json();
        setRequests(data.requests || []);
        setOrders(data.orders || []);
        setPosts(data.posts || []);
        setDiscussions(data.discussions || {});
        setJournalComments(data.journalComments || {});
        setSubscribers(data.subscribers || []);
        setProposalChats(data.proposalChats || {});
      }
      if (contentRes.ok) {
        const data = await contentRes.json();
        setContent({
          heroSlides: data.heroSlides || [],
          journalEntries: data.journalEntries || [],
          upcomingEvents: data.upcomingEvents || [],
          shopProducts: data.shopProducts || [],
          faqEntries: data.faqEntries || [],
          charityCauses: data.charityCauses || [],
          charityPartners: data.charityPartners || [],
          membershipTiers: data.membershipTiers || [],
          experiences: data.experiences || [],
          filmsData: data.filmsData || [],
          literaryWorks: data.literaryWorks || [],
          kindnessLog: data.kindnessLog || [],
          quizQuestions: data.quizQuestions || [],
          sitePillars: data.sitePillars || [],
          requestTypes: data.requestTypes || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch full backend state.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const addRequest = async (type: string, date: string, location: string, attendees: string, whatsapp: string, sincerity: string, userDisplayName: string) => {
    const payload = {
      type,
      preferredDate: date,
      location,
      attendees,
      whatsappNumber: whatsapp,
      sincerity,
      member: userDisplayName,
      memberAvatar: userDisplayName.substring(0, 2).toUpperCase()
    };
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to submit booking request');
    const result = await response.json();
    await fetchState(); // Re-sync local state
    return result.request;
  };

  const updateRequestStatus = async (requestId: string, status: RequestDetail['status']) => {
    const response = await fetch(`/api/requests/${requestId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update request status');
    const result = await response.json();
    await fetchState();
    return result.request;
  };

  const addRequestChatMessage = async (requestId: string, sender: 'user' | 'management' | 'system', text: string) => {
    const response = await fetch(`/api/requests/${requestId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, text })
    });
    if (!response.ok) throw new Error('Failed to send message');
    const result = await response.json();
    await fetchState(); // Re-sync local state
    return result.message;
  };

  const addOrder = async (item: string, price: string, userDisplayName: string) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item,
        price,
        member: userDisplayName
      })
    });
    if (!response.ok) throw new Error('Failed to process merchandise order');
    const result = await response.json();
    await fetchState();
    return result.order;
  };

  const addPost = async (content: string, image: string | null, username: string, handle: string) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        image,
        username,
        handle
      })
    });
    if (!response.ok) throw new Error('Failed to share community post');
    const result = await response.json();
    await fetchState();
    return result.post;
  };

  const likePost = async (id: string) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const liked = !p.liked;
        return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
      }
      return p;
    }));

    const response = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
    if (!response.ok) {
      await fetchState(); // Revert on fail
    }
  };

  const commentPost = async (postId: string, content: string, username: string) => {
    const response = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        username,
        avatarText: username.substring(0, 2).toUpperCase()
      })
    });
    if (!response.ok) throw new Error('Failed to comment on post');
    const result = await response.json();
    await fetchState();
    return result.comment;
  };

  const replyComment = async (postId: string, commentId: string, content: string, username: string) => {
    const response = await fetch(`/api/posts/${postId}/comment/${commentId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        username,
        avatarText: username.substring(0, 2).toUpperCase()
      })
    });
    if (!response.ok) throw new Error('Failed to post reply');
    const result = await response.json();
    await fetchState();
    return result.reply;
  };

  const addDiscussionPost = async (country: string, text: string, author: string) => {
    const response = await fetch(`/api/discussions/${country}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });
    if (!response.ok) throw new Error('Failed to submit post to country board');
    const result = await response.json();
    await fetchState();
    return result.post;
  };

  const addDiscussionReply = async (country: string, postId: string, text: string, author: string) => {
    const response = await fetch(`/api/discussions/${country}/${postId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });
    if (!response.ok) throw new Error('Failed to reply to discussion post');
    const result = await response.json();
    await fetchState();
    return result.reply;
  };

  const addJournalComment = async (journalId: string, text: string, author: string) => {
    const response = await fetch('/api/journal/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journalId, author, text })
    });
    if (!response.ok) throw new Error('Failed to post comment on journal');
    const result = await response.json();
    await fetchState();
    return result.comment;
  };

  const subscribeNewsletter = async (email: string) => {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, message: result.error || 'Failed to subscribe' };
    }
    await fetchState();
    return { success: true, message: result.message };
  };

  const askGillian = async (message: string, history: { sender: 'user' | 'gillian'; text: string }[]) => {
    const response = await fetch('/api/ask-gillian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    if (!response.ok) throw new Error('Server returned an error');
    const result = await response.json();
    addNotification(
      'Gillian Anderson Replied',
      `Reply received: "${result.text.substring(0, 75)}..."`,
      'reply'
    );
    return { text: result.text, warning: result.warning };
  };

  const polishSincerity = async (text: string) => {
    const response = await fetch('/api/ai-polish-sincerity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Server returned an error polishing sincerity');
    const result = await response.json();
    return { text: result.text };
  };

  const suggestOffer = async (proposal: RequestDetail) => {
    const response = await fetch('/api/ai-suggest-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal })
    });
    if (!response.ok) throw new Error('Server returned an error generating suggestion');
    const result = await response.json();
    return { analysis: result.analysis, suggestion: result.suggestion };
  };

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
