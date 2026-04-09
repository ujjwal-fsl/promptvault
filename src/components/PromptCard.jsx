import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromptCard({ prompt }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = prompt.body;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    }
  };

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.button
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Copy ${prompt.name} to clipboard`}
      className={`
        group relative w-full text-left border border-border min-h-[120px] p-6
        transition-colors duration-100 cursor-pointer
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2
        ${copied
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-card-foreground hover:bg-foreground hover:text-background'
        }
      `}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="copied"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex flex-col justify-center h-full"
          >
            <span className="font-mono text-sm tracking-widest uppercase">
              Copied to clipboard
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex flex-col h-full"
          >
            <span className="font-mono font-semibold text-base tracking-tight leading-snug">
              {prompt.name}
            </span>

            <div
              className={`
                mt-3 font-inter text-xs leading-relaxed opacity-0 transition-opacity duration-200
                ${hovered ? 'opacity-60' : 'opacity-0'}
                line-clamp-4
              `}
            >
              {prompt.body}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`
        absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-widest
        transition-opacity duration-200
        ${copied ? 'opacity-0' : hovered ? 'opacity-40' : 'opacity-20'}
      `}>
        Click to copy
      </div>
    </motion.button>
  );
}