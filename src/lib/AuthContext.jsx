import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

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
    checkAppState();
  }, []);

  const checkAppState = async () => {
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      if (location.pathname !== '/auth') navigate('/auth');
      return;
    }

    // Ensure profile exists cleanly via sync before routing
    await authService.ensureProfile(user);

    // Fetch guaranteed profile projection
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setUser({ ...user, ...profile });
    setIsAuthenticated(true);

    const provider = user.app_metadata?.provider;

    // Routing rules engine
    if (provider === 'google' && !profile?.username) {
      if (location.pathname !== '/complete-profile') {
        navigate('/complete-profile');
      }
    } else {
      if (location.pathname === '/auth' || location.pathname === '/verified') {
        navigate('/');
      }
    }

    setIsLoadingAuth(false);
  };

  const logout = async (shouldRedirect = true) => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      if (location.pathname !== '/') navigate('/');
    }
  };

  const navigateToLogin = async () => {
    await checkUserAuth();
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
      navigateToLogin,
      checkAppState
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
