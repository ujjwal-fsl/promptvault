import { storageService } from './storageService';
import { authService } from './authService';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const promptService = {
  getPromptsByUser: async (userId) => {
    await delay(300);
    try {
      if (!userId) return [];
      const db = storageService.getDb();
      const prompts = db.prompts.filter(p => p.user_id === userId && !p.isDeleted);
      return prompts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (e) {
      console.error('[promptService Error getPromptsByUser]', e);
      return [];
    }
  },

  getPromptsByVault: async (vaultId) => {
    await delay(300);
    try {
      if (!vaultId) return [];
      const db = storageService.getDb();
      const user = db.users.find(u => u.vault_id === vaultId);
      if (!user) return [];
      
      const prompts = db.prompts.filter(p => p.user_id === user.id && !p.isDeleted);
      return prompts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (e) {
      console.error('[promptService Error getPromptsByVault]', e);
      return [];
    }
  },

  createPrompt: async (data) => {
    await delay(300);
    try {
      if (!data.title?.trim() || !data.content?.trim()) {
        throw new Error("Title and content are required.");
      }

      const user = authService.getCurrentUser();
      if (!user) throw new Error("Authentication required.");

      const db = storageService.getDb();
      const newPrompt = {
        id: storageService.generateId('prompt'),
        title: data.title.trim(),
        content: data.content.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        isPublic: true,
        isDeleted: false
      };

      db.prompts.push(newPrompt);
      storageService.setDb(db);
      return newPrompt;
    } catch (e) {
      console.error('[promptService Error createPrompt]', e);
      throw e;
    }
  },

  updatePrompt: async (id, data) => {
    await delay(300);
    try {
      if (!data.title?.trim() || !data.content?.trim()) {
        throw new Error("Title and content are required.");
      }

      const user = authService.getCurrentUser();
      if (!user) throw new Error("Authentication required.");

      const db = storageService.getDb();
      const index = db.prompts.findIndex(p => p.id === id);
      
      if (index === -1) throw new Error("Prompt not found.");
      if (db.prompts[index].user_id !== user.id) throw new Error("Permission denied.");

      db.prompts[index] = {
        ...db.prompts[index],
        title: data.title.trim(),
        content: data.content.trim()
      };

      storageService.setDb(db);
      return db.prompts[index];
    } catch (e) {
      console.error('[promptService Error updatePrompt]', e);
      throw e;
    }
  },

  deletePrompt: async (id) => {
    await delay(300);
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Authentication required.");

      const db = storageService.getDb();
      const index = db.prompts.findIndex(p => p.id === id);
      
      if (index === -1) throw new Error("Prompt not found.");
      if (db.prompts[index].user_id !== user.id) throw new Error("Permission denied.");

      db.prompts[index].isDeleted = true;
      storageService.setDb(db);
      
      return true;
    } catch (e) {
      console.error('[promptService Error deletePrompt]', e);
      throw e;
    }
  }
};
