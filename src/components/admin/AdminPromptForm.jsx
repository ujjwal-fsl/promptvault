import { useState, useEffect } from 'react';
import { promptService } from '@/services/promptService';

export default function AdminPromptForm({ editingPrompt, onSaved, onCancel }) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPrompt) {
      setName(editingPrompt.name || editingPrompt.title);
      setBody(editingPrompt.body || editingPrompt.content);
    } else {
      setName('');
      setBody('');
    }
  }, [editingPrompt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    setSaving(true);
    try {
      if (editingPrompt) {
        await promptService.updatePrompt(editingPrompt.id, {
          title: name.trim(),
          content: body.trim(),
        });
      } else {
        await promptService.createPrompt({
          title: name.trim(),
          content: body.trim(),
        });
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
    setName('');
    setBody('');
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-border bg-secondary/30">
      <div className="px-6 md:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {editingPrompt ? 'Edit Prompt' : 'New Prompt'}
          </span>
          {editingPrompt && (
            <button
              type="button"
              onClick={onCancel}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            placeholder="Prompt name"
            required
            maxLength={80}
            className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            {name.length}/80
          </div>
        </div>

        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 4000))}
            placeholder="Prompt body — the full text that will be copied"
            required
            maxLength={4000}
            rows={5}
            className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none leading-relaxed"
          />
          <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
            {body.length}/4000
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim() || !body.trim()}
          className="mt-1 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : editingPrompt ? 'Update Prompt' : 'Save Prompt'}
        </button>
      </div>
    </form>
  );
}