import { useNavigate } from 'react-router-dom';

export default function Verified() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-mono selection:bg-primary selection:text-primary-foreground">
      <div className="w-16 h-16 border border-border flex items-center justify-center mb-8">
        <div className="w-2 h-2 bg-green-500" />
      </div>
      <h1 className="text-xl tracking-widest uppercase mb-4">Account Created</h1>
      <p className="text-sm text-muted-foreground mb-8">Please check your email to confirm verification</p>
      <button
        className="border border-border hover:bg-foreground hover:text-background transition-colors px-6 py-3 tracking-widest uppercase text-xs"
        onClick={() => navigate('/auth')}
      >
        Let's Start
      </button>
    </div>
  );
}
