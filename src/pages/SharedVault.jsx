import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, RefreshCw, Share2, ArrowLeft } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import EmptyState from '@/components/EmptyState';

export default function SharedVault() {
  const { vaultId } = useParams(); // URL param behaves as username
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Fetch underlying profile mapper
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useQuery({
    queryKey: ['shared-profile', vaultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', vaultId)
        .maybeSingle();
      return data || null;
    },
    retry: 1
  });

  const { data: prompts = [], isLoading: isPromptsLoading } = useQuery({
    queryKey: ['shared-vault-prompts', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const isLoading = isProfileLoading || isPromptsLoading;

  const activePrompts = prompts.filter(p => !p.isDeleted);
  
  const filteredPrompts = activePrompts.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.body || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary selection:text-primary-foreground">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
                  Shared Vault
                </h1>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                @{vaultId}
              </p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter vault..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary border-none outline-none pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-primary transition-all duration-200 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full px-6 md:px-8 py-10">
        
        <div className="mb-8 pl-1">
          <div className="flex items-baseline gap-2 mb-2">
            <h1 className="font-mono font-bold text-3xl md:text-4xl tracking-tighter text-black">
              {profile?.full_name || vaultId}'s
            </h1>
            <span className="font-mono font-light text-lg md:text-xl tracking-tighter text-muted-foreground">
              Prompt Dex
            </span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            — {filteredPrompts.length} RECORD{filteredPrompts.length !== 1 ? 'S' : ''} —
          </div>
        </div>

        {/* Grid */}
        <div className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30">
              <RefreshCw className="w-8 h-8 animate-spin mb-6" />
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <EmptyState message={search ? "Adjust current filtering parameters." : "No records established in this vault."} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full border-b border-border">
              {filteredPrompts.map((prompt, i) => (
                <div 
                  key={prompt.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <PromptCard prompt={prompt} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

    </div>
  );
}