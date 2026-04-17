import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { authService } from '@/services/authService';
import { incrementUsage, addPromptToVault } from '@/services/promptService';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FEATURES } from '@/config/featureFlags';

export default function PromptCard({ 
  prompt, 
  selectionMode = false,
  selectedPrompts = [],
  setSelectedPrompts
}) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const timeoutRef = useRef(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExternalVault =
    FEATURES.ADD_TO_VAULT &&
    location &&
    (location.pathname.startsWith('/public/') ||
     location.pathname.startsWith('/vault/'));

  const isPublicVault = location && location.pathname.startsWith('/public/');

  const handleAddToVault = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterAuth', location.pathname + location.search);
      navigate('/auth');
      return;
    }

    if (added || loadingAdd) return;

    setLoadingAdd(true);

    try {
      const result = await addPromptToVault(prompt);

      if (result?.alreadyExists) {
        setAdded(true); // later can show "Already added"
      } else if (result?.success) {
        setAdded(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleCopy = async () => {
    if (selectionMode) {
      const exists = selectedPrompts.includes(prompt.id);
      if (exists) {
        setSelectedPrompts(prev => prev.filter(id => id !== prompt.id));
      } else {
        setSelectedPrompts(prev => [...prev, prompt.id]);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Clipboard error:", err);
    }

    // Usage tracking
    try {
      const user = await authService.getCurrentUser();
      const isOwnVault = location.pathname === '/';
      if (user && prompt.created_by === user.id && isOwnVault) {
        
        // Optimistic UI update instantly WITHOUT refetch
        const updateCache = (old) => {
          if (!old) return old;
          return old.map(p => p.id === prompt.id ? { ...p, usage_count: (p.usage_count || 0) + 1 } : p);
        };
        
        queryClient.setQueryData(['landing-prompts'], updateCache);
        queryClient.setQueryData(['admin-prompts'], updateCache);

        await incrementUsage(prompt.id);
      }
    } catch (err) {
      console.error("Increment usage err:", err);
    }
  };

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showFull = selectionMode || hovered;

  return (
    <motion.button
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Copy ${prompt.name} to clipboard`}
      className={`
        group relative w-full text-left border border-border min-h-[180px] flex flex-col justify-between p-6
        transition-colors duration-100 cursor-pointer overflow-hidden
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2
        ${hovered && !copied ? 'bg-foreground text-background' : 'bg-card text-card-foreground'}
      `}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {/* Original content — always rendered, never unmounted */}
      <div className="flex flex-col justify-between h-full">
        <span className="font-mono font-semibold text-base tracking-tight leading-snug">
          {prompt.name}
        </span>

        <div
          className={`
            mt-3 font-inter text-xs leading-relaxed transition-opacity duration-200
            ${isExternalVault ? 'opacity-60' : (showFull && !copied ? 'opacity-60' : 'opacity-0')}
            line-clamp-4
          `}
        >
          {prompt.body}
        </div>
        
        {isPublicVault && prompt.attribution_username && (
          <div className="mt-3 text-xs font-inter z-10 transition-opacity duration-200">
            <span className="text-black">Prompt by: </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/public/${prompt.attribution_username}`);
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              @{prompt.attribution_username}
            </span>
          </div>
        )}
      </div>

      {selectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            const exists = selectedPrompts.includes(prompt.id);
            if (exists) {
              setSelectedPrompts(prev => prev.filter(id => id !== prompt.id));
            } else {
              setSelectedPrompts(prev => [...prev, prompt.id]);
            }
          }}
          className="absolute top-3 right-4 w-4 h-4 border border-border flex items-center justify-center bg-background cursor-pointer z-10 hover:border-foreground transition-colors"
        >
          {selectedPrompts.includes(prompt.id) && (
            <div className="w-2.5 h-2.5 bg-foreground" />
          )}
        </div>
      )}

      {/* Click-to-copy hint */}
      {!selectionMode && (
        <div
          className={`
            absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-widest
            transition-opacity duration-200
            ${copied ? 'opacity-0' : hovered ? 'opacity-40' : 'opacity-20'}
          `}
        >
          Click to copy
        </div>
      )}


      {/* Copied overlay — absolute inset, height never changes */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          bg-primary text-primary-foreground
          font-mono text-sm tracking-widest uppercase
          transition-opacity duration-200
          ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        Copied to clipboard
      </div>
    </motion.button>
  );
}