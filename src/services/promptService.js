import { storageService } from './storageService';
import { authService } from './authService';
import { supabase } from '../lib/supabase';

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id); // 🔴 IMPORTANT

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[deletePrompt error]', error);
      throw error;
    }
  }
};

// --- NEW SUPABASE BACKEND (Not yet connected to UI, prevents breaking the app) ---

export const createPrompt = async (data) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert({
        name: data.name,
        body: data.body,
        tags: data.tags || [],
        usage_count: 0,
        created_by: user.id,
        is_public: data.is_public || false
      })
      .select()
      .single();

    if (error) throw error;
    return prompt;
  } catch (error) {
    console.error('[Supabase createPrompt error]', error);
    throw error;
  }
};

export const getUserPrompts = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return prompts;
  } catch (error) {
    console.error('[Supabase getUserPrompts error]', error);
    throw error;
  }
};

export const incrementUsage = async (promptId) => {
  try {
    // Safely increment by fetching current count then updating. 
    // For high concurrency, it is recommended to use a Supabase RPC later.
    const { data: current, error: fetchErr } = await supabase
      .from('prompts')
      .select('usage_count')
      .eq('id', promptId)
      .single();
      
    if (fetchErr) throw fetchErr;
    
    const { data: updated, error: updateErr } = await supabase
      .from('prompts')
      .update({ usage_count: current.usage_count + 1 })
      .eq('id', promptId)
      .select()
      .single();
      
    if (updateErr) throw updateErr;
    return updated;
  } catch (error) {
    console.error('[Supabase incrementUsage error]', error);
    throw error;
  }
};

export const searchPrompts = async (query) => {
  try {
    let supabaseQuery = supabase
      .from('prompts')
      .select('*')
      .eq('is_public', true);

    if (query?.name) {
      supabaseQuery = supabaseQuery.ilike('name', `%${query.name}%`);
    }
    
    // query.tags should be an array
    if (query?.tags && Array.isArray(query.tags) && query.tags.length > 0) {
      supabaseQuery = supabaseQuery.contains('tags', query.tags);
    }
    
    const { data: prompts, error } = await supabaseQuery.order('created_at', { ascending: false });
    
    if (error) throw error;
    return prompts;
  } catch (error) {
    console.error('[Supabase searchPrompts error]', error);
    throw error;
  }
};

export const getPublicPromptsByUserId = async (userId) => {
  try {
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('created_by', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return prompts;
  } catch (error) {
    console.error('[Supabase getPublicPromptsByUserId error]', error);
    throw error;
  }
};

export const addPromptToVault = async (prompt) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  if (!prompt?.name || !prompt?.body) {
    throw new Error("Invalid prompt data");
  }

  // Prevent duplicates (check via source_prompt_id first, then fallback to name+body)
  let existing = null;
  if (prompt.id) {
    const { data } = await supabase
      .from('prompts')
      .select('id')
      .eq('created_by', user.id)
      .eq('source_prompt_id', prompt.id)
      .limit(1);
    existing = data;
  } else {
    const { data } = await supabase
      .from('prompts')
      .select('id')
      .eq('created_by', user.id)
      .eq('name', prompt.name)
      .eq('body', prompt.body)
      .limit(1);
    existing = data;
  }

  if (existing && existing.length > 0) {
    return { alreadyExists: true };
  }

  const { data, error } = await supabase.from('prompts').insert({
    name: prompt.name,
    body: prompt.body,
    tags: prompt.tags || [],
    created_by: user.id,
    is_public: false,

    // Future-ready fields
    source_prompt_id: prompt.id || null,
    attribution_username: prompt.attribution_username || null,
    usage_count: 0,
  });

  if (error) throw error;

  return { success: true };
};

export const deletePrompt = async (id) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id); // 🔴 IMPORTANT

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[deletePrompt error]', error);
    throw error;
  }
};
