import { supabase } from '../lib/supabase';

export const createPrompt = async (data) => {
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

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return prompt;
};

export const updatePrompt = async (id, data) => {
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

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return prompt;
};

export const deletePrompt = async (id) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id);

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return { success: true };
};

export const getUserPrompts = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return prompts;
};

export const getPublicPromptsByUserId = async (userId) => {
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('created_by', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return prompts;
};

export const getPromptsByUserId = async (userId) => {
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return prompts;
};

export const searchPrompts = async (query) => {
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
  
  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }
  return prompts;
};

export const incrementUsage = async (promptId) => {
  const { data: current, error: fetchErr } = await supabase
    .from('prompts')
    .select('usage_count')
    .eq('id', promptId)
    .single();
    
  if (fetchErr) {
    console.error('[PROMPT SERVICE ERROR]', fetchErr);
    throw fetchErr;
  }
  
  const { data: updated, error: updateErr } = await supabase
    .from('prompts')
    .update({ usage_count: current.usage_count + 1 })
    .eq('id', promptId)
    .select()
    .single();
    
  if (updateErr) {
    console.error('[PROMPT SERVICE ERROR]', updateErr);
    throw updateErr;
  }
  return updated;
};

export const addPromptToVault = async (prompt) => {
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

  if (error) {
    console.error('[PROMPT SERVICE ERROR]', error);
    throw error;
  }

  return { success: true };
};
