import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function AdminPromptRow({ prompt, onEdit, onDelete, flashId }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdInterval = useRef(null);
  const isFlash = flashId === prompt.id;

  const startHold = useCallback(() => {
    setHoldProgress(0);
    const start = Date.now();
    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / 2000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearInterval(holdInterval.current);
        holdInterval.current = null;
        onDelete(prompt.id);
        setHoldProgress(0);
      }
    }, 30);
  }, [prompt.id, onDelete]);

  const cancelHold = useCallback(() => {
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
      holdInterval.current = null;
    }
    setHoldProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (holdInterval.current) clearInterval(holdInterval.current);
    };
  }, []);

  return (
    <div
      className={`
        relative border-b border-border px-6 md:px-8 py-4 min-h-[80px]
        flex items-center gap-4 md:gap-8 group transition-colors duration-300
        ${isFlash ? 'bg-success/10' : 'hover:bg-muted/30'}
      `}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-semibold text-foreground truncate">
          {prompt.name}
        </p>
        <p className="font-inter text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {prompt.body}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
        <button
          onClick={() => onEdit(prompt)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Edit ${prompt.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <div className="relative">
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors relative overflow-hidden"
            aria-label={`Hold to delete ${prompt.name}`}
            title="Hold for 2 seconds to delete"
          >
            <Trash2 className="h-3.5 w-3.5 relative z-10" />
            {holdProgress > 0 && (
              <div
                className="absolute inset-0 bg-destructive/20 transition-none"
                style={{
                  clipPath: `inset(${(1 - holdProgress) * 100}% 0 0 0)`,
                }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}