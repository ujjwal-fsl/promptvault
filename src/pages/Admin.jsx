import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { promptService, getUserPrompts } from '@/services/promptService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminPromptRow from '@/components/admin/AdminPromptRow';
import AdminPromptForm from '@/components/admin/AdminPromptForm';
import EmptyState from '@/components/EmptyState';
import { RefreshCw, Search } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { authService } from '@/services/authService';

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['admin-prompts'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const data = await getUserPrompts();
        // Return raw data to maintain DB shape, Admin components map properly via fallback OR we can map here if absolutely needed.
        // The instructions said "Replace existing fetch logic - Use getUserPrompts()".
        // The UI currently handles name vs title (in AdminPromptForm: editingPrompt.name || editingPrompt.title).
        return data; 
      } catch (err) {
        console.error("Fetch prompts error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => promptService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
    },
    onError: (error) => {
      console.error("Error deleting prompt", error);
    }
  });

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSaved = (newPrompt) => {
    setEditingPrompt(null);
    if (newPrompt && !editingPrompt) {
      queryClient.setQueryData(['admin-prompts'], (old) => {
        if (!old) return [newPrompt];
        return [newPrompt, ...old];
      });
      // also optionally update landing fallback
      queryClient.setQueryData(['landing-prompts'], (old) => {
        if (!old) return [newPrompt];
        return [newPrompt, ...old];
      });
    }
    // Maintain existing refresh logic
    queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
    queryClient.invalidateQueries({ queryKey: ['landing-prompts'] });
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
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <header className="relative border-b border-border px-6 md:px-8 pt-12 pb-8">
        <Link
          to="/"
          className="absolute top-6 right-6 md:right-8 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          VIEW VAULT →
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl tracking-tighter text-foreground">
              Command Center
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-2 uppercase tracking-widest">
              {activePrompts.length} prompts in vault
            </p>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleCopyLink}
              className={`font-mono text-xs uppercase tracking-widest border px-4 py-2 transition-all duration-200 ${
                shareCopied
                  ? 'bg-green-600 text-white border-green-600'
                  : 'text-primary border-primary hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {shareCopied ? 'Link Copied!' : 'Share Vault'}
            </button>

            <button
              onClick={handleLogout}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Form Container */}
        <div className="px-6 md:px-8">
          <AdminPromptForm
            editingPrompt={editingPrompt}
            onSaved={handleSaved}
            onCancel={() => setEditingPrompt(null)}
          />
        </div>

        {/* Search */}
        <div className="px-6 md:px-8 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-b border-border pl-10 pr-4 py-3 font-mono text-sm text-muted-foreground focus:text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
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
            search ? (
              <EmptyState message="No prompts match your search." />
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 border border-border flex items-center justify-center mb-8">
                  <div className="w-2 h-2 bg-muted-foreground" />
                </div>
                <p className="font-mono text-sm tracking-wide uppercase text-muted-foreground mb-6">
                  No prompts yet.
                </p>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="font-mono text-xs uppercase tracking-widest px-6 py-3 border border-border hover:bg-foreground hover:text-background transition-colors"
                >
                  LET'S START →
                </button>
              </div>
            )
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