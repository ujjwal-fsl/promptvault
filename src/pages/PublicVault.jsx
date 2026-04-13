import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';
import { getPublicPromptsByUserId } from '@/services/promptService';
import { Search, RefreshCw, Layers } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import EmptyState from '@/components/EmptyState';

export default function PublicVault() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Fetch user profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      console.log("Fetched profile:", data);
      
      return data || null;
    },
    retry: 1
  });

  // Fetch prompts only if we have a valid public profile
  const { data: prompts = [], isLoading: isPromptsLoading } = useQuery({
    queryKey: ['public-prompts', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('created_by', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const isLoading = isProfileLoading || isPromptsLoading;

  if (!isProfileLoading && !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center font-mono">
        <h1 className="text-4xl text-foreground font-bold tracking-tighter mb-4 uppercase">USER NOT FOUND</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest max-w-sm mb-8">
           This vault is currently unavailable or doesn't exist.
        </p>
        <button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 border border-border text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          RETURN TO HOME
        </button>
      </div>
    );
  }

  const activePrompts = prompts.filter(p => !p.isDeleted);
  
  const filteredPrompts = activePrompts.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.body || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary selection:text-primary-foreground">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-6 md:px-12 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={username} className="w-10 h-10 rounded-full border border-border object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-secondary">
                <Layers className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground">
                  {profile?.full_name || username}'s
                </h1>
                <span className="text-xs md:text-sm font-light tracking-tighter text-muted-foreground">
                  Prompt Dex
                </span>
              </div>
              {/* Creator Social Links */}
              <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-widest">
                {profile?.twitter && <a href={`https://twitter.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="text-primary hover:text-foreground">TWITTER</a>}
                {profile?.instagram && <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-primary hover:text-foreground">INSTAGRAM</a>}
                {profile?.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" className="text-primary hover:text-foreground">YOUTUBE</a>}
                {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary hover:text-foreground">WEBSITE</a>}
              </div>
            </div>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter specific prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary border-none outline-none pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary transition-all duration-200 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full flex-grow">
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
             <RefreshCw className="w-6 h-6 animate-spin mb-4" />
             <span className="font-mono text-xs uppercase tracking-widest">Retrieving vault data</span>
           </div>
        ) : filteredPrompts.length === 0 ? (
          <EmptyState message={search ? "No matches found in this vault." : "No prompts yet"} />
        ) : (
          <div>
            <div className="w-full border-b border-border py-3 px-6 md:px-12 bg-background flex items-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {filteredPrompts.length} PUBLIC RECORDS
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full border-b border-border">
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-border mt-auto">
        <button 
            onClick={() => navigate('/')} 
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          POWERED BY PROMPTVAULT
        </button>
      </footer>
    </div>
  );
}
