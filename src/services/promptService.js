import { supabase } from '../lib/supabase';

export const createPrompt = async (data) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert({
        name: data.name,
        body: data.body,
        tags: data.tags || [],
        usage_count: 0,
        is_public: data.is_public || false,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return prompt;
  } catch (err) {
    console.error('[SERVICE ERROR] createPrompt:', err);
    throw err;
  }
};

export const updatePrompt = async (id, data) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    if (
      !data.name &&
      !data.body &&
      !data.tags &&
      data.is_public === undefined
    ) {
      throw new Error("No valid fields to update");
    }

    const { data: prompt, error } = await supabase
      .from('prompts')
      .update({
        ...(data.name && { name: data.name }),
        ...(data.body && { body: data.body }),
        ...(data.tags && { tags: data.tags }),
        ...(data.is_public !== undefined && { is_public: data.is_public })
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) throw error;
    return prompt;
  } catch (err) {
    console.error('[SERVICE ERROR] updatePrompt:', err);
    throw err;
  }
};

export const deletePrompt = async (id) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[SERVICE ERROR] deletePrompt:', err);
    throw err;
  }
};

export const getUserPrompts = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return prompts;
  } catch (err) {
    console.error('[SERVICE ERROR] getUserPrompts:', err);
    throw err;
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
  } catch (err) {
    console.error('[SERVICE ERROR] getPublicPromptsByUserId:', err);
    throw err;
  }
};

export const getPromptsByUserId = async (userId) => {
  try {
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return prompts;
  } catch (err) {
    console.error('[SERVICE ERROR] getPromptsByUserId:', err);
    throw err;
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
    
    if (query?.tags && Array.isArray(query.tags) && query.tags.length > 0) {
      supabaseQuery = supabaseQuery.contains('tags', query.tags);
    }
    
    const { data: prompts, error } = await supabaseQuery.order('created_at', { ascending: false });
    
    if (error) throw error;
    return prompts;
  } catch (err) {
    console.error('[SERVICE ERROR] searchPrompts:', err);
    throw err;
  }
};

export const incrementUsage = async (promptId) => {
  try {
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
  } catch (err) {
    console.error('[SERVICE ERROR] incrementUsage:', err);
    throw err;
  }
};

export const addPromptToVault = async (prompt) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("User not authenticated");

    if (!prompt?.name || !prompt?.body) {
      throw new Error("Invalid prompt data");
    }

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
      is_public: false,
      source_prompt_id: prompt.id || null,
      attribution_username: prompt.attribution_username || null,
      usage_count: 0,
      created_by: user.id
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[SERVICE ERROR] addPromptToVault:', err);
    throw err;
  }
};
