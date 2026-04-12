import { supabase } from '@/lib/supabase';

export const authService = {
  signup: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      await authService.ensureProfile(data.user, username);
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

  ensureProfile: async (user, username = null) => {
    if (!user) return null;
    try {
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
         const { data: newProfile, error: insertError } = await supabase
           .from('profiles')
           .insert([{
             id: user.id,
             email: user.email,
             username: username,
             plan: 'FREE',
             created_at: new Date().toISOString()
           }])
           .select()
           .single();
           
         if (insertError) {
             console.error('Error creating profile:', insertError);
             return null;
         }
         return { ...user, ...newProfile };
      }
      return { ...user, ...profile };
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
  }
};
