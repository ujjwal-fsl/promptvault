import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminPromptRow({ prompt, onEdit, onDelete, flashId }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isFlash = flashId === prompt.id;
  const { canMakePromptPublic } = usePlan();
  const queryClient = useQueryClient();

  const handleTogglePublic = async (prompt) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ is_public: !prompt.is_public })
        .eq('id', prompt.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
    } catch (err) {
      console.error("Toggle public error:", err);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    
    // We instantly blast the prompt upstream!
    // Admin.jsx controls the optimistic removal + Undo queue!
    onDelete(prompt);
    
    setShowDeleteModal(false);
    setIsDeleting(false);
  };

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
        {canMakePromptPublic && (
          <button
            onClick={() => handleTogglePublic(prompt)}
            className={`font-mono text-[10px] uppercase tracking-widest border px-3 py-1 transition-colors ${prompt.is_public ? 'bg-green-600 text-white border-green-600' : 'border-border text-muted-foreground hover:bg-foreground hover:text-background'}`}
          >
            {prompt.is_public ? 'PUBLIC' : 'PRIVATE'}
          </button>
        )}

        <button
          onClick={() => onEdit(prompt)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Edit ${prompt.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="text-red-500 hover:bg-red-50 rounded-md p-2 transition"
            title="Delete prompt"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 3h6a1 1 0 011 1v1h4v2H4V5h4V4a1 1 0 011-1zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h2v9H6V9z" />
            </svg>
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white border border-border p-6 w-[320px]">
            <p className="font-mono text-sm mb-6">
              Delete this prompt?
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
                disabled={isDeleting}
                className="text-muted-foreground text-sm disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}