import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CornerNav({ to, label, ...props }) {
  return (
    <Link
      to={to}
      className="fixed top-6 right-6 z-50 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 group"
      {...props}
    >
      <span>{label}</span>
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
