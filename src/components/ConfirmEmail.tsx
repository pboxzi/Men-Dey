import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile, session } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('This verification link is invalid or has expired.');
      return;
    }

    const confirmEmail = async () => {
      try {
        const res = await supabase.functions.invoke('confirm-email', {
          body: { token },
        });

        if (res.error) {
          setStatus('error');
          setMessage(res.error.message || 'Confirmation failed. Please try again.');
          return;
        }

        const data = res.data;
        if (data?.success) {
          await refreshProfile();
          setStatus('success');
          setMessage(`Your email has been confirmed. You can now sign in to your account.`);
        } else {
          setStatus('error');
          setMessage(data?.error || 'Confirmation failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred. Please try again later.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate, refreshProfile]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center">
            <Mail className="h-7 w-7 text-gold-500" />
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center">
          {status === 'loading' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-12 w-12 text-gold-500" />
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <XCircle className="h-12 w-12 text-red-500" />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-white">
            {status === 'loading' && 'Confirming Your Email...'}
            {status === 'success' && 'Email Confirmed'}
            {status === 'error' && 'Confirmation Failed'}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {status === 'loading' && 'Verifying your account, please wait...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
        </div>

        {/* Actions */}
        {status === 'success' && (
          <button
            onClick={() => navigate(session ? '/portal' : '/portal?mode=login', { replace: true })}
            className="px-6 py-3 bg-gold-500 text-neutral-950 text-xs font-bold tracking-wider uppercase rounded-lg hover:bg-gold-400 transition-colors"
          >
            {session ? 'Enter Your Portal' : 'Sign In Now'}
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/portal?mode=register', { replace: true })}
            className="px-6 py-3 bg-gold-500 text-neutral-950 text-xs font-bold tracking-wider uppercase rounded-lg hover:bg-gold-400 transition-colors"
          >
            Try Again
          </button>
        )}
      </motion.div>
    </div>
  );
}
