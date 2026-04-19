import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promptService, getUserPrompts } from '@/services/promptService';
import { authService } from '@/services/authService';
import { useAuth } from '@/lib/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import PromptCard from '@/components/PromptCard';
import CornerNav from '@/components/CornerNav';
import EmptyState from '@/components/EmptyState';
import { Search, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [search, setSearch] = useState('');
  const [publicView, setPublicView] = useState(() => {
    return localStorage.getItem('publicView') === 'true';
  });
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-background" />;
  }

  const { canUsePublicView } = usePlan();
  
  const handleTogglePublicView = () => {
    const newVal = !publicView;
    setPublicView(newVal);
    localStorage.setItem('publicView', String(newVal));
  };
  
  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['landing-prompts'],
    enabled: !isLoadingAuth && isAuthenticated,
    queryFn: async () => {
      try {
        const data = await getUserPrompts();
        return data;
      } catch (err) {
        console.error("Fetch landing prompts error:", err);
        return [];
      }
    }
  });

  const activePrompts = prompts.filter(p => !p.isDeleted);
  
  const filteredPrompts = activePrompts.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (p.body || '').toLowerCase().includes(search.toLowerCase());
    const matchesScope = publicView ? p.is_public === true : true;
    return matchesSearch && matchesScope;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <CornerNav to="/admin" label="Admin" />

      {/* Hero Structure */}
      <header className="relative w-full">
        {/* Background image layer */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.07] bg-cover bg-center" style={{ backgroundImage: "url('/noise.png')" }}></div>
        
        {/* Content wrapper (padding) -> heading + paragraph */}
        <div className="relative z-10 px-6 md:px-12 pt-16 pb-12 md:pt-24 md:pb-16 flex flex-col items-start w-full">
          <h1 className="font-mono font-bold text-[12vw] md:text-[8vw] lg:text-[6vw] leading-[0.85] tracking-tighter text-foreground -ml-1">
            Prompt<br />Vault
          </h1>
          <p className="font-inter text-muted-foreground text-sm md:text-base max-w-xl text-left mt-6">
            A curated library of reusable prompts.<br />
            Click any block to copy it instantly.
          </p>
        </div>
      </header>

      {/* Search Section */}
      <div className="w-full border-y border-border bg-background relative group flex items-center">
        <Search className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
        <input
          type="text"
          placeholder="Filter prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none outline-none pl-[3.5rem] md:pl-[4.5rem] pr-6 py-5 font-mono text-sm placeholder:text-muted-foreground/70 transition-all duration-200 text-foreground"
        />
      </div>

      {/* Count Section */}
      <div className="w-full border-b border-border py-4 px-6 md:px-12 bg-background flex flex-wrap gap-4 items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {filteredPrompts.length} PROMPTS
        </span>
        {canUsePublicView && (
          <button
            onClick={handleTogglePublicView}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {publicView ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
            PUBLIC VIEW
          </button>
        )}
      </div>

      {/* Prompts Grid */}
      <main className="w-full flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mb-4" />
            <span className="font-mono text-xs uppercase tracking-widest">Accessing records</span>
          </div>
        ) : filteredPrompts.length === 0 ? (
          search ? (
            <EmptyState message="No matches found." />
          ) : (
            <div className="flex flex-col items-center justify-center py-32 px-8 text-center max-w-md mx-auto">
              <div className="w-16 h-16 border border-border flex items-center justify-center mb-8">
                <div className="w-2 h-2 bg-muted-foreground" />
              </div>
              <p className="font-mono text-sm tracking-wide uppercase text-muted-foreground mb-6">
                No prompts yet.
              </p>
              <button 
                onClick={() => navigate('/admin')}
                className="font-mono text-xs uppercase tracking-widest px-6 py-3 border border-border hover:bg-foreground hover:text-background transition-colors"
              >
                LET'S START →
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full border-b border-border">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border mt-auto px-6 md:px-12">
        <div className="flex justify-start items-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            PROMPTVAULT V1.0 - 2026
          </span>
        </div>
      </footer>
    </div>
  );
}