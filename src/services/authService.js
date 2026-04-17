import { supabase } from '@/lib/supabase';

export const authService = {
  signup: async (email, password, username, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verified`
      }
    });
    if (error) throw error;
    if (data.user) {
      await authService.ensureProfile(data.user, username, fullName);
    }
    return data;
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      await authService.ensureProfile(data.user);
    }
    return data;
  },

  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  },

  ensureProfile: async (user, username = null, fullNameOverride = null) => {
    if (!user) return null;
    try {
      const fullName = 
        fullNameOverride || 
        user.user_metadata?.full_name || 
        user.email?.split('@')[0] || 
        'User';

      const avatar = 
        user.user_metadata?.avatar_url || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
         console.error('Error fetching profile:', error);
         return null;
      }
      
      if (!profile) {
         // Not exists -> insert
         const { data: newProfile, error: insertError } = await supabase
           .from('profiles')
           .insert([{
             id: user.id,
             email: user.email,
             username: username,
             full_name: fullName,
             avatar_url: avatar,
             plan: 'FREE',
             created_at: new Date().toISOString()
           }])
           .select()
           .single();
           
         if (insertError) {
             console.error('Error creating profile:', insertError);
             return null;
         }
         return newProfile;
      } else {
         // Exists -> Do NOT overwrite username. Only update missing avatar.
         if (!profile.avatar_url && avatar) {
            await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
            profile.avatar_url = avatar;
         }
         return profile;
      }
    } catch (e) {
      console.error('ensureProfile error:', e);
      return null;
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;
      
      const profile = await authService.ensureProfile(session.user);
      
      // LOGIC PLACEHOLDER: IF user logs in AND username is NULL
      // In a real app we'd redirect or show UI here, for now log it:
      if (profile && !profile.username) {
         console.warn('[AUTH] Username is NULL. User needs to complete profile.');
      }
      
      return profile;
    } catch (e) {
      console.error('getCurrentUser error:', e);
      return null;
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  updateUsername: async (userId, username) => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;
        
      if (existing && existing.id !== userId) {
        throw new Error('Username already taken');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('updateUsername error:', e);
      throw e;
    }
  },

  updateProfile: async (userId, profileData) => {
    try {
      if (profileData.username) {
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', profileData.username)
          .maybeSingle();
        if (checkError) throw checkError;
        if (existing && existing.id !== userId) {
          throw new Error('Username already taken');
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('updateProfile error:', e);
      throw e;
    }
  },

  getProfileByUsername: async (username) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('getProfileByUsername error:', e);
      return null;
    }
  }
};
