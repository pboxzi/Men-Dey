import React, { useState, useRef, useEffect } from 'react';
import { useGlobalState, PortalNotification } from '../utils/StateContext';
import { Bell, CheckCheck, Trash2, Sparkles, MessageSquare, HelpCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationBell() {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    addNotification,
  } = useGlobalState();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: PortalNotification['type']) => {
    switch (type) {
      case 'reply':
        return <HelpCircle className="h-3.5 w-3.5 text-gold-500" />;
      case 'update':
        return <Sparkles className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Info className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  // Simulate a new notification for test/preview convenience
  const handleSimulateUpdate = () => {
    const simulationTemplates = [
      {
        title: 'New Journal Post',
        message: 'Gillian Anderson published: "Reflections on sculpting stage characters with silence."',
        type: 'update' as const,
      },
      {
        title: 'Exclusive Live Q&A',
        message: 'A private Live Q&A session with Gillian has been scheduled for next Friday!',
        type: 'alert' as const,
      },
      {
        title: 'Ask Gillian Reply',
        message: 'Gillian personally answered: "Silence is not empty; it is full of answers. We must just listen."',
        type: 'reply' as const,
      },
    ];

    const randomTemplate = simulationTemplates[Math.floor(Math.random() * simulationTemplates.length)];
    addNotification(randomTemplate.title, randomTemplate.message, randomTemplate.type);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-400 hover:text-white transition-all rounded hover:bg-neutral-900/50 active:scale-95"
        aria-label="View notifications"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-[swing_1.5s_ease-in-out_infinite] text-gold-400' : ''}`} />
        
        {/* Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center bg-gold-500 text-neutral-950 font-bold font-mono text-[8px] rounded-full ring-2 ring-[#050505]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 max-h-[480px] bg-neutral-950 border border-neutral-900 rounded-lg shadow-xl shadow-black/80 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-neutral-900 bg-neutral-900/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xs font-bold tracking-wider text-neutral-200 uppercase">
                  COMMUNITY NOTIFICATIONS
                </span>
                {unreadCount > 0 && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="p-1 text-neutral-400 hover:text-gold-400 transition-colors rounded"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 text-neutral-400 hover:text-red-400 transition-colors rounded"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 max-h-[320px] scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-900/50 flex items-center justify-center mb-3 border border-neutral-900">
                    <Bell className="h-5 w-5 text-neutral-600" />
                  </div>
                  <h4 className="text-xs font-serif font-bold tracking-widest text-neutral-400 uppercase">
                    You're All Caught Up
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px]">
                    No recent updates or replies. Ask Gillian a question to see her response!
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer text-left flex gap-3 ${
                      notif.read ? 'bg-transparent opacity-65 hover:opacity-100 hover:bg-neutral-900/20' : 'bg-gold-500/[0.02] hover:bg-gold-500/[0.04]'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
                      notif.read ? 'bg-neutral-950 border-neutral-900' : 'bg-neutral-900 border-gold-500/10'
                    }`}>
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold tracking-wide ${notif.read ? 'text-neutral-400' : 'text-neutral-200'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[8px] font-mono text-neutral-500">{notif.timestamp}</span>
                      </div>
                      <p className={`text-[10px] leading-relaxed ${notif.read ? 'text-neutral-500' : 'text-neutral-300'}`}>
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <span className="inline-block h-1 w-1 rounded-full bg-gold-500 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Simulated actions footer */}
            <div className="p-2 border-t border-neutral-900 bg-neutral-950 flex items-center justify-between gap-2">
              <span className="text-[8px] font-mono text-neutral-500 uppercase pl-1.5">
                Simulated Sandbox State
              </span>
              <button
                onClick={handleSimulateUpdate}
                className="flex items-center gap-1 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 text-gold-400 rounded px-2.5 py-1 text-[8px] font-mono font-bold tracking-wider transition-all active:scale-95"
              >
                <Sparkles className="h-2.5 w-2.5" />
                SIMULATE REPLY/UPDATE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
