export default function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center py-32 px-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 border border-border mx-auto mb-8 flex items-center justify-center">
          <div className="w-2 h-2 bg-muted-foreground" />
        </div>
        <p className="font-mono text-sm text-muted-foreground tracking-wide uppercase">
          {message || "No prompts yet"}
        </p>
      </div>
    </div>
  );
}