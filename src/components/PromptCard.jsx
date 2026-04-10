import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

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

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.button
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Copy ${prompt.name} to clipboard`}
      className={`
        group relative w-full text-left border border-border min-h-[140px] p-6
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
            ${hovered && !copied ? 'opacity-60' : 'opacity-0'}
            line-clamp-4
          `}
        >
          {prompt.body}
        </div>
      </div>

      {/* Click-to-copy hint */}
      <div
        className={`
          absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-widest
          transition-opacity duration-200
          ${copied ? 'opacity-0' : hovered ? 'opacity-40' : 'opacity-20'}
        `}
      >
        Click to copy
      </div>

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