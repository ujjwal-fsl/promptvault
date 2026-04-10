import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { promptService } from '@/services/promptService';
import { Search, RefreshCw, Share2, ArrowLeft } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import EmptyState from '@/components/EmptyState';

export default function SharedVault() {
  const { vaultId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['shared-vault', vaultId],
    queryFn: async () => {
      if (!vaultId) return [];
      const data = await promptService.getPromptsByVault(vaultId);
      return data.map(p => ({ ...p, name: p.title, body: p.content }));
    },
    enabled: !!vaultId,
  });

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
                ID: {vaultId}
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
        
        <div className="mb-8 border-l-2 border-primary pl-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Status</h2>
          <p className="text-sm text-foreground">
            {isLoading ? 'Accessing encrypted records...' : 
             filteredPrompts.length === 0 && search ? 'No records match filter constraints.' :
             activePrompts.length === 0 ? 'Vault is completely empty.' :
             `${filteredPrompts.length} verified records retrieved.`}
          </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1px bg-border border border-border">
              {filteredPrompts.map((prompt, i) => (
                <div 
                  key={prompt.id} 
                  className="bg-background animate-fade-in" 
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