import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { promptService } from '@/services/promptService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminPromptRow from '@/components/admin/AdminPromptRow';
import AdminPromptForm from '@/components/admin/AdminPromptForm';
import EmptyState from '@/components/EmptyState';
import { RefreshCw, Search, Plus, Share, LogOut } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { authService } from '@/services/authService';

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['admin-prompts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await promptService.getPromptsByUser(user.id);
      return data.map(p => ({ ...p, name: p.title, body: p.content }));
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => promptService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts', user?.id] });
    },
    onError: (error) => {
      console.error("Error deleting prompt", error);
    }
  });

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setIsCreating(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSaved = () => {
    setEditingPrompt(null);
    setIsCreating(false);
    queryClient.invalidateQueries({ queryKey: ['admin-prompts', user?.id] });
  };

  const handleCopyLink = async () => {
    if (!user?.vault_id) return;
    const link = createPageUrl(`vault/${user.vault_id}`);
    try {
      await navigator.clipboard.writeText(link);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  // Filter out any internally marked Soft Deleted prompts just in case service layer lets it through
  const activePrompts = prompts.filter(p => !p.isDeleted);
  
  const filteredPrompts = activePrompts.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.body || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-start justify-between">
          <div>
            <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-foreground">
              Manager
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {activePrompts.length} active prompts
            </p>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleCopyLink}
              disabled={shareCopied}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-mono text-xs uppercase tracking-widest hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <Share className="h-4 w-4" />
              <span>{shareCopied ? 'Copied Link' : 'Share Vault'}</span>
            </button>

            <button
              onClick={() => { setIsCreating(true); setEditingPrompt(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              <span>New Prompt</span>
            </button>

            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ml-2"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8">
        {/* Form Container */}
        <div className={`
          overflow-hidden transition-all duration-500 ease-\\[cubic-bezier(0.23,1,0.32,1)\\]
          ${(isCreating || editingPrompt) ? 'max-h-[800px] mb-8 opacity-100' : 'max-h-0 mb-0 opacity-0'}
        `}>
          {(isCreating || editingPrompt) && (
            <AdminPromptForm
              editingPrompt={editingPrompt}
              onSaved={handleSaved}
              onCancel={() => { setIsCreating(false); setEditingPrompt(null); }}
            />
          )}
        </div>

        {/* Search */}
        <div className="px-6 md:px-8 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-b border-border pl-12 pr-4 py-4 font-mono text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* List */}
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest">Loading vault</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <EmptyState 
              message={search ? "No prompts match your search." : "Your vault is empty."}
            />
          ) : (
            <div className="flex flex-col">
              {filteredPrompts.map(prompt => (
                <AdminPromptRow
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  flashId={flashId}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}