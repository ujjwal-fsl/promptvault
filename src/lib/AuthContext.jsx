import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
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
  const handledUserRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        handleAuthenticatedUser(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AUTH EVENT:", event);

        if (session?.user) {
          handleAuthenticatedUser(session.user);
        } else if (!session?.user) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(false);

          if (window.location.pathname !== '/auth') {
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



  const handleAuthenticatedUser = (authUser) => {
    if (handledUserRef.current === authUser.id) return;
    handledUserRef.current = authUser.id;

    setIsLoadingAuth(true);

    const profilePromise = authService.ensureProfile(authUser)
      .catch(err => {
        console.error('[PROFILE ERROR]', err);
        return null;
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });

    setUser(prev => {
      if (prev && prev.id === authUser.id) return prev;
      return authUser;
    });
    setIsAuthenticated(true);

    // Navigate immediately — don't wait for profile
    if (window.location.pathname === '/auth' || window.location.pathname === '/verified') {
      navigate('/');
    }

    // Merge profile data in background
    profilePromise.then(profile => {
      if (profile) {
        setUser(prev => ({ ...prev, ...profile }));

        const provider = authUser.app_metadata?.provider;
        if (provider === 'google' && !profile?.username) {
          if (window.location.pathname !== '/complete-profile') {
            navigate('/complete-profile');
          }
        }
      }
    });
  };

  const logout = async (shouldRedirect = true) => {
    await authService.logout();
    handledUserRef.current = null;
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      if (window.location.pathname !== '/') navigate('/');
    }
  };

  const navigateToLogin = () => {
    if (window.location.pathname === '/') {
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
