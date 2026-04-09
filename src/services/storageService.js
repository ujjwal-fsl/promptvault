const DB_KEY = 'promptvault_db';
const CURRENT_VERSION = 1;

const DEFAULT_DB = {
  version: CURRENT_VERSION,
  users: [
    {
      id: 'user_default',
      email: 'local@promptvault.app',
      role: 'admin',
      vault_id: 'vault_default',
    }
  ],
  prompts: [
    {
      id: 'prompt_sample1',
      title: 'Fix React useEffect bug',
      content: 'Can you help me fix an infinite loop in my React useEffect? Here is the code...',
      created_at: new Date().toISOString(),
      user_id: 'user_default',
      isPublic: true,
      isDeleted: false
    },
    {
      id: 'prompt_sample2',
      title: 'SEO Blog Post structure',
      content: 'Please write a 1000-word SEO optimized blog post about the benefits of local storage in web applications. Include an introduction, 3 main points, and a conclusion.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      user_id: 'user_default',
      isPublic: true,
      isDeleted: false
    }
  ],
  session: {
    user_id: 'user_default'
  }
};

export const storageService = {
  getDb: () => {
    try {
      const data = localStorage.getItem(DB_KEY);
      if (!data) return storageService.initDb();
      
      const parsed = JSON.parse(data);
      
      if (parsed.version !== CURRENT_VERSION || !parsed.users || !parsed.prompts || !parsed.session) {
        console.warn('Storage format mismatch or corruption detected, resetting to defaults.');
        return storageService.initDb();
      }
      return parsed;
    } catch (e) {
      console.error('Storage parsing error:', e);
      return storageService.initDb();
    }
  },

  setDb: (db) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  },

  initDb: () => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    } catch (e) {
      console.error('Storage init error:', e);
      return DEFAULT_DB;
    }
  },

  generateId: (prefix = 'id') => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
  }
};
