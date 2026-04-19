import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await handleAuthenticatedUser(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AUTH EVENT:", event);

        if (session?.user) {
          handleAuthenticatedUser(session.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(false);

          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleAuthenticatedUser = async (user) => {
    try {
      setIsLoadingAuth(true);

      const profilePromise = authService.ensureProfile(user);

      setUser(user);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      const profile = await profilePromise;

      if (profile) {
        setUser({ ...user, ...profile });
      }

      const provider = user.app_metadata?.provider;

      if (provider === 'google' && !profile?.username) {
        if (location.pathname !== '/complete-profile') {
          navigate('/complete-profile');
        }
      } else {
        if (location.pathname === '/auth' || location.pathname === '/verified') {
          navigate('/');
        }
      }

    } catch (err) {
      console.error("AUTH HANDLER ERROR:", err);
    } finally {
      setTimeout(() => {
        setIsLoadingAuth(false);
      }, 2000);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      if (location.pathname !== '/') navigate('/');
    }
  };

  const navigateToLogin = () => {
    if (location.pathname === '/') {
      navigate('/auth');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
