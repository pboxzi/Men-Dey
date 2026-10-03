import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  Inbox,
  Star,
  Scale,
  FileSpreadsheet,
  Award,
  Calendar,
  Tv,
  Film,
  Folder,
  CheckSquare,
  DollarSign,
  Receipt,
  CreditCard,
  RotateCcw,
  Edit3,
  Image as ImageIcon,
  FolderClosed,
  Settings,
  Shield,
  Activity,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  UserPlus,
  MessageCircle,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Upload,
  Check,
  X,
  Clock,
  Send,
  Plus,
  Heart,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';

export default function GillianManagementDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Active navigation section
  const [activeSection, setActiveSection] = useState('dashboard');

  // Work Tab filter: 'tasks' | 'meetings' | 'followups' | 'deadlines'
  const [workTab, setWorkTab] = useState<'tasks' | 'meetings' | 'followups' | 'deadlines'>('tasks');

  // Interactive Task List State (matches mockup exactly)
  const [tasks, setTasks] = useState([
    {
      id: 1,
      time: '09:00',
      title: 'Review new inquiry #INQ-1042',
      category: 'Inquiries',
      priority: 'High',
      completed: false
    },
    {
      id: 2,
      time: '10:30',
      title: 'Fan request follow-up',
      category: 'Fan Relations',
      priority: 'Normal',
      completed: false
    },
    {
      id: 3,
      time: '12:00',
      title: 'Team meeting',
      category: 'Management',
      priority: 'Normal',
      completed: false
    },
    {
      id: 4,
      time: '14:00',
      title: 'Review proposal #PROP-0087',
      category: 'Proposals',
      priority: 'High',
      completed: false
    },
    {
      id: 5,
      time: '16:30',
      title: 'Update appearance details',
      category: 'Scheduling',
      priority: 'Normal',
      completed: false
    }
  ]);

  // Quick Action Modals
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Form input states for modals
  const [formData, setFormData] = useState({
    title: '',
    recipient: '',
    category: '',
    details: '',
    amount: ''
  });

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setModalSuccess(false);
      setModalType(null);
      setFormData({ title: '', recipient: '', category: '', details: '', amount: '' });
    }, 1600);
  };

  const alexAvatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80';

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-stone-900 flex font-sans antialiased selection:bg-[#9E7A4A]/20 selection:text-stone-900">
      {/* =========================================================================
          1. LEFT OBSIDIAN SIDEBAR (#131619) - EXACT MOCKUP ORDER & BADGES
      ========================================================================= */}
      <aside className="w-60 sm:w-64 bg-[#131619] text-stone-300 flex-shrink-0 flex flex-col min-h-screen select-none overflow-y-auto">
        {/* Brand Monogram & Title Lockup */}
        <div className="pt-6 pb-5 px-5 flex items-center gap-3">
          <div className="font-serif text-2xl font-light tracking-wide text-white flex-shrink-0">
            GA
          </div>
          <div>
            <h1 className="text-[11px] font-semibold tracking-[0.2em] text-white uppercase leading-tight">
              Gillian Anderson
            </h1>
            <span className="text-[9px] font-medium tracking-[0.28em] text-[#9E7A4A] uppercase block mt-0.5">
              Management
            </span>
          </div>
        </div>

        {/* Dashboard Active Nav Item */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeSection === 'dashboard'
                ? 'bg-[#8F6E45] text-white shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 opacity-90" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="px-3 pb-6 space-y-4 flex-1">
          {/* OPERATIONS */}
          <div>
            <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-stone-500 uppercase">
              Operations
            </div>
            <div className="space-y-0.5">
              {/* Fans */}
              <button
                onClick={() => setActiveSection('fans')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'fans' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Fans</span>
                </div>
              </button>

              {/* Messages (badge: 3) */}
              <button
                onClick={() => setActiveSection('messages')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'messages' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Messages</span>
                </div>
                <span className="bg-[#8F6E45] text-white text-[10px] font-semibold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  3
                </span>
              </button>

              {/* Requests (badge: 2) */}
              <button
                onClick={() => setActiveSection('requests')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'requests' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Requests</span>
                </div>
                <span className="bg-[#8F6E45] text-white text-[10px] font-semibold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  2
                </span>
              </button>

              {/* Inquiries */}
              <button
                onClick={() => setActiveSection('inquiries')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'inquiries' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Inquiries</span>
              </button>

              {/* Opportunities */}
              <button
                onClick={() => setActiveSection('opportunities')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'opportunities' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Opportunities</span>
              </button>

              {/* Negotiations */}
              <button
                onClick={() => setActiveSection('negotiations')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'negotiations' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Negotiations</span>
              </button>

              {/* Proposals */}
              <button
                onClick={() => setActiveSection('proposals')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'proposals' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Proposals</span>
              </button>

              {/* Agreements */}
              <button
                onClick={() => setActiveSection('agreements')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'agreements' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Agreements</span>
              </button>

              {/* Bookings */}
              <button
                onClick={() => setActiveSection('bookings')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'bookings' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Bookings</span>
              </button>

              {/* Appearances */}
              <button
                onClick={() => setActiveSection('appearances')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'appearances' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Appearances</span>
              </button>

              {/* Media */}
              <button
                onClick={() => setActiveSection('media')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'media' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Media</span>
              </button>

              {/* Projects */}
              <button
                onClick={() => setActiveSection('projects')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'projects' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Projects</span>
              </button>

              {/* Tasks (badge: 5) */}
              <button
                onClick={() => setActiveSection('tasks')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                  activeSection === 'tasks' ? 'bg-[#8F6E45] text-white' : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tasks</span>
                </div>
                <span className="bg-[#8F6E45] text-white text-[10px] font-semibold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  5
                </span>
              </button>
            </div>
          </div>

          {/* FINANCE */}
          <div>
            <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-stone-500 uppercase">
              Finance
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveSection('finance')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Finance</span>
              </button>
              <button
                onClick={() => setActiveSection('invoices')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoices</span>
              </button>
              <button
                onClick={() => setActiveSection('payments')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payments</span>
              </button>
              <button
                onClick={() => setActiveSection('refunds')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refunds</span>
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div>
            <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-stone-500 uppercase">
              Content
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveSection('content')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Content</span>
              </button>
              <button
                onClick={() => setActiveSection('media-library')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Media Library</span>
              </button>
            </div>
          </div>

          {/* SYSTEM */}
          <div>
            <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-stone-500 uppercase">
              System
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveSection('documents')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <FolderClosed className="w-3.5 h-3.5" />
                <span>Documents</span>
              </button>
              <button
                onClick={() => setActiveSection('staff')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff</span>
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Security</span>
              </button>
              <button
                onClick={() => setActiveSection('audit')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-normal text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Audit Log</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Link: Log out */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => {
              if (signOut) signOut();
              navigate('/');
            }}
            className="flex items-center gap-2 text-stone-400 hover:text-white text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-stone-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Global Search Bar */}
          <div className="relative w-72 sm:w-96">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all records..."
              className="w-full bg-stone-50/70 border border-stone-200/90 rounded-md pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#9E7A4A] focus:bg-white transition-all"
            />
          </div>

          {/* Right Header Area: Notifications & Alex Carter profile */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => alert('4 pending notifications requiring management attention.')}
              className="relative p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5">
                4
              </span>
            </button>

            <div className="flex items-center gap-3">
              <img
                src={alexAvatar}
                alt="Alex Carter"
                className="w-8 h-8 rounded-full object-cover border border-stone-200"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-stone-800 leading-tight">
                  Alex Carter
                </div>
                <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                  Super Management
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Scrollable Body */}
        <main className="p-6 sm:p-8 max-w-[1440px] mx-auto w-full">
          {/* =========================================================================
              HEADER SECTION: Welcome greeting & Gillian Quote
          ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 mb-6">
            <div>
              <div className="text-[10px] font-bold tracking-[0.25em] text-stone-500 uppercase mb-1.5">
                Management Office
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium tracking-tight mb-1">
                Good morning, Alex
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Here's what needs your attention today.
              </p>
            </div>

            <div className="mt-4 md:mt-0 text-left md:text-right">
              <div className="text-xs font-semibold text-stone-700">
                April 28, 2025
              </div>
              <div className="text-[11px] text-stone-400 mb-2">
                Monday
              </div>
              <p className="font-serif italic text-xs text-stone-500 max-w-sm">
                "The right people, the right opportunities, the right experiences."
              </p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">
                — Gillian Anderson
              </p>
            </div>
          </div>

          {/* =========================================================================
              ROW 1: 6 TOP KPI CARDS (Exact numbers, labels, icons & links)
          ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
            {/* 1. New Fan Requests */}
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-700">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium text-stone-600 leading-tight">New Fan Requests</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-stone-900 leading-none">5</div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span>2 urgent</span>
                  <span className="text-stone-400 font-mono">→</span>
                </div>
              </div>
            </div>

            {/* 2. Unread Messages */}
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-700">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium text-stone-600 leading-tight">Unread Messages</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-stone-900 leading-none">12</div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span>3 from fans</span>
                  <span className="text-stone-400 font-mono">→</span>
                </div>
              </div>
            </div>

            {/* 3. Inquiries */}
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-700">
                  <Inbox className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium text-stone-600 leading-tight">Inquiries</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-stone-900 leading-none">8</div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span>3 in review</span>
                  <span className="text-stone-400 font-mono">→</span>
                </div>
              </div>
            </div>

            {/* 4. Opportunities */}
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-700">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium text-stone-600 leading-tight">Opportunities</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-stone-900 leading-none">4</div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span>2 active</span>
                  <span className="text-stone-400 font-mono">→</span>
                </div>
              </div>
            </div>

            {/* 5. Proposals */}
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-700">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium text-stone-600 leading-tight">Proposals</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-stone-900 leading-none">3</div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span>1 awaiting response</span>
                  <span className="text-stone-400 font-mono">→</span>
                </div>
              </div>
            </div>

            {/* 6. Tasks */}
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-700">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium text-stone-600 leading-tight">Tasks</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-stone-900 leading-none">7</div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                  <span className="text-rose-500 font-medium">3 overdue</span>
                  <span className="text-stone-400 font-mono">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ROW 2: Priority Attention (26%) | Today's Work (44%) | Recent Activity (30%)
          ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* -----------------------------------------------------------------------
                COLUMN 1: Priority Attention (3 cols)
            ----------------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <h3 className="font-serif text-sm font-semibold text-stone-900">
                    Priority Attention
                  </h3>
                  <button className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                    View all →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="text-stone-700">New fan requests</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded font-medium text-[10px]">5</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-stone-700">Unanswered messages</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded font-medium text-[10px]">12</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      <span className="text-stone-700">Inquiries in review</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded font-medium text-[10px]">3</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      <span className="text-stone-700">Opportunities awaiting review</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded font-medium text-[10px]">2</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-stone-700">Proposals awaiting response</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded font-medium text-[10px]">1</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      <span className="text-stone-700">Agreements requiring attention</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded font-medium text-[10px]">2</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 7 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="text-stone-700">Payments requiring attention</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded font-medium text-[10px]">1</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 8 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      <span className="text-stone-700">Upcoming appearances</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded font-medium text-[10px]">3</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 9 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-stone-700">Scheduling conflicts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded font-medium text-[10px]">1</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>

                  {/* Item 10 */}
                  <div className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-stone-50 rounded px-1 -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      <span className="text-stone-700">Outstanding tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded font-medium text-[10px]">7</span>
                      <ChevronRight className="w-3 h-3 text-stone-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* -----------------------------------------------------------------------
                COLUMN 2: Today's Work (5 cols)
            ----------------------------------------------------------------------- */}
            <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-2">
                  <h3 className="font-serif text-sm font-semibold text-stone-900">
                    Today's Work
                  </h3>
                  <button className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                    View all →
                  </button>
                </div>

                {/* Sub-Tabs: Tasks | Meetings | Follow-ups | Deadlines */}
                <div className="flex items-center gap-6 border-b border-stone-100 text-xs pb-2 mb-3">
                  <button
                    onClick={() => setWorkTab('tasks')}
                    className={`font-medium transition-colors ${
                      workTab === 'tasks' ? 'text-stone-900 border-b-2 border-stone-900 pb-2 -mb-2.5' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setWorkTab('meetings')}
                    className={`font-medium transition-colors ${
                      workTab === 'meetings' ? 'text-stone-900 border-b-2 border-stone-900 pb-2 -mb-2.5' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Meetings
                  </button>
                  <button
                    onClick={() => setWorkTab('followups')}
                    className={`font-medium transition-colors ${
                      workTab === 'followups' ? 'text-stone-900 border-b-2 border-stone-900 pb-2 -mb-2.5' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Follow-ups
                  </button>
                  <button
                    onClick={() => setWorkTab('deadlines')}
                    className={`font-medium transition-colors ${
                      workTab === 'deadlines' ? 'text-stone-900 border-b-2 border-stone-900 pb-2 -mb-2.5' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Deadlines
                  </button>
                </div>

                {/* Task Checklist Items */}
                <div className="space-y-3 pt-1">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors text-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 hover:border-stone-500'
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span className="font-mono text-stone-400 text-[11px] w-10">{task.time}</span>
                        <div>
                          <div className={`font-medium text-stone-800 ${task.completed ? 'line-through text-stone-400' : ''}`}>
                            {task.title}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">{task.category}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-sky-50 text-sky-600'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 mt-2">
                <button
                  onClick={() => setActiveSection('tasks')}
                  className="text-[11px] text-stone-500 hover:text-stone-800 font-medium transition-colors"
                >
                  View all tasks →
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------------------
                COLUMN 3: Recent Activity (4 cols) with Connecting Timeline
            ----------------------------------------------------------------------- */}
            <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <h3 className="font-serif text-sm font-semibold text-stone-900">
                    Recent Activity
                  </h3>
                  <button className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                    View all →
                  </button>
                </div>

                {/* Timeline container */}
                <div className="space-y-3.5 pt-1 relative">
                  {/* Item 1 */}
                  <div className="flex items-start justify-between text-xs group cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-400 mt-0.5 w-8">10:24</span>
                      <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <UserPlus className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 leading-tight">New fan request received</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">Request #FR-1032 • Personal Message</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 mt-1" />
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start justify-between text-xs group cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-400 mt-0.5 w-8">09:58</span>
                      <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Heart className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 leading-tight">Proposal sent</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">Proposal #PROP-0087 • Media Opportunity</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 mt-1" />
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start justify-between text-xs group cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-400 mt-0.5 w-8">09:32</span>
                      <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 leading-tight">Agreement uploaded</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">Agreement #AGR-0043 • Booking</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 mt-1" />
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start justify-between text-xs group cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-400 mt-0.5 w-8">08:47</span>
                      <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <DollarSign className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 leading-tight">Payment received</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">Payment #PAY-0021 • $2,500.00</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 mt-1" />
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-start justify-between text-xs group cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-400 mt-0.5 w-8">08:12</span>
                      <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 leading-tight">Appearance scheduled</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">Appearance #APP-0063 • Virtual Call</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 mt-1" />
                  </div>

                  {/* Item 6 */}
                  <div className="flex items-start justify-between text-xs group cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-stone-400 mt-0.5 w-8">07:56</span>
                      <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 leading-tight">News article published</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">Article #NEWS-0012 • Website</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ROW 3: 4 BOTTOM CARDS (Fan Relations | Professional Pipeline | Upcoming | Quick Actions)
          ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Fan Relations */}
            <div className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <h4 className="font-serif text-sm font-semibold text-stone-900">
                  Fan Relations
                </h4>
                <button className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                  View all →
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <UserPlus className="w-3.5 h-3.5 text-stone-400" />
                    <span>New fan requests</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">5</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>Unread fan messages</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">12</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <MessageCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>Active conversations</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">28</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Award className="w-3.5 h-3.5 text-stone-400" />
                    <span>Membership activity</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">3</span>
                </div>
              </div>
            </div>

            {/* Card 2: Professional Pipeline */}
            <div className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <h4 className="font-serif text-sm font-semibold text-stone-900">
                  Professional Pipeline
                </h4>
                <button className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                  View all →
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>New inquiries</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">8</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Star className="w-3.5 h-3.5 text-stone-400" />
                    <span>Inquiries in review</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">3</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                    <span>Active opportunities</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">4</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Scale className="w-3.5 h-3.5 text-stone-400" />
                    <span>Negotiations</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">2</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-stone-400" />
                    <span>Proposals</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">3</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                    <span>Agreements</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">1</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <CalendarCheck className="w-3.5 h-3.5 text-stone-400" />
                    <span>Confirmed bookings</span>
                  </div>
                  <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">2</span>
                </div>
              </div>
            </div>

            {/* Card 3: Upcoming */}
            <div className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <h4 className="font-serif text-sm font-semibold text-stone-900">
                  Upcoming
                </h4>
                <button className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors">
                  View all →
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* May 2 */}
                <div className="flex items-center justify-between py-0.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-stone-800">
                      <span className="text-stone-600 font-medium">May 2</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>Interview - Media Outlet</span>
                    </div>
                    <div className="text-[10px] text-stone-400 pl-14 mt-0.5">10:00 AM • London</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500" />
                </div>

                {/* May 5 */}
                <div className="flex items-center justify-between py-0.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-stone-800">
                      <span className="text-stone-600 font-medium">May 5</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>Event Appearance</span>
                    </div>
                    <div className="text-[10px] text-stone-400 pl-14 mt-0.5">3:00 PM • New York</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500" />
                </div>

                {/* May 8 */}
                <div className="flex items-center justify-between py-0.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-stone-800">
                      <span className="text-stone-600 font-medium">May 8</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>Team Meeting</span>
                    </div>
                    <div className="text-[10px] text-stone-400 pl-14 mt-0.5">11:00 AM • Virtual</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500" />
                </div>

                {/* May 12 */}
                <div className="flex items-center justify-between py-0.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-stone-800">
                      <span className="text-stone-600 font-medium">May 12</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>Photoshoot</span>
                    </div>
                    <div className="text-[10px] text-stone-400 pl-16 mt-0.5">9:00 AM • Los Angeles</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500" />
                </div>

                {/* May 15 */}
                <div className="flex items-center justify-between py-0.5 group cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-stone-800">
                      <span className="text-stone-600 font-medium">May 15</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>Call with Production</span>
                    </div>
                    <div className="text-[10px] text-stone-400 pl-16 mt-0.5">2:00 PM • Virtual</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500" />
                </div>
              </div>
            </div>

            {/* Card 4: Quick Actions */}
            <div className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-stone-100 mb-3">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">
                    Quick Actions
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => setModalType('fan-request')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 text-stone-700 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserPlus className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900" />
                      <span>New Fan Request</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600" />
                  </button>

                  <button
                    onClick={() => setModalType('inquiry')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 text-stone-700 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900" />
                      <span>Create Inquiry</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600" />
                  </button>

                  <button
                    onClick={() => setModalType('task')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 text-stone-700 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900" />
                      <span>Add Task</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600" />
                  </button>

                  <button
                    onClick={() => setModalType('document')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 text-stone-700 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Upload className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900" />
                      <span>Upload Document</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600" />
                  </button>

                  <button
                    onClick={() => setModalType('message')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 text-stone-700 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900" />
                      <span>Send Message</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          DYNAMIC QUICK ACTION MODALS
      ========================================================================= */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-medium text-stone-900 mb-1 capitalize">
              {modalType.replace('-', ' ')}
            </h3>
            <p className="text-xs text-stone-500 mb-4">Management Office Internal Coordination Record</p>

            {modalSuccess ? (
              <div className="py-8 text-center">
                <Check className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-serif text-base font-semibold text-stone-900">Record Successfully Logged</h4>
                <p className="text-xs text-stone-500 mt-1">Management records updated in real time.</p>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Title / Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter brief title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-stone-200 rounded-md p-2 focus:outline-none focus:border-[#9E7A4A]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Details & Internal Notes</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter operational notes..."
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="w-full border border-stone-200 rounded-md p-2 focus:outline-none focus:border-[#9E7A4A]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border border-stone-200 text-stone-600 rounded-md font-medium hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8F6E45] hover:bg-[#7D5F3A] text-white rounded-md font-medium"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
