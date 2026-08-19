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
        return <HelpCircle className="h-3.5 w-3.5 text-[#C89B3C]" />;
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
        className="relative p-2 text-[#444] hover:text-neutral-900 transition-all rounded hover:bg-neutral-100 active:scale-95"
        aria-label="View notifications"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-[swing_1.5s_ease-in-out_infinite] text-gold-400' : ''}`} />
        
        {/* Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center bg-[#C89B3C] text-neutral-950 font-bold font-mono text-[10px] rounded-full ring-2 ring-[#050505]">
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
            className="absolute right-0 mt-2.5 w-80 sm:w-96 max-h-[480px] bg-white border border-[rgba(0,0,0,0.06)] rounded-lg shadow-xl shadow-black/80 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xs font-bold tracking-wider text-[#444] uppercase">
                  COMMUNITY NOTIFICATIONS
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#C89B3C]/10 text-gold-400 border border-[#C89B3C]/20">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="p-1 text-[#444] hover:text-gold-400 transition-colors rounded"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 text-[#444] hover:text-red-400 transition-colors rounded"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#444] hover:text-[#444] transition-colors rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 max-h-[320px] scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-[#F8F6F2] flex items-center justify-center mb-3 border border-[rgba(0,0,0,0.06)]">
                    <Bell className="h-5 w-5 text-[#444]" />
                  </div>
                  <h4 className="text-xs font-serif font-bold tracking-widest text-[#444] uppercase">
                    You're All Caught Up
                  </h4>
                  <p className="text-[10px] text-[#444] mt-1 max-w-[200px]">
                    No recent updates or replies. Ask Gillian a question to see her response!
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer text-left flex gap-3 ${
                      notif.read ? 'bg-transparent opacity-65 hover:opacity-100 hover:bg-neutral-100' : 'bg-[#C89B3C]/[0.02] hover:bg-[#C89B3C]/[0.04]'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
                      notif.read ? 'bg-white border-[rgba(0,0,0,0.06)]' : 'bg-white border-[#C89B3C]/10'
                    }`}>
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold tracking-wide ${notif.read ? 'text-[#444]' : 'text-[#444]'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#444]">{notif.timestamp}</span>
                      </div>
                      <p className={`text-[10px] leading-relaxed ${notif.read ? 'text-[#444]' : 'text-[#444]'}`}>
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <span className="inline-block h-1 w-1 rounded-full bg-[#C89B3C] mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-[rgba(0,0,0,0.06)] bg-white">
              <button
                onClick={() => { setIsOpen(false); }}
                className="w-full text-center text-[11px] font-mono text-[#444] hover:text-[#C89B3C] transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
