import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  // Auto-logout after 30 min of inactivity; also expires on reload if session went stale.
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  useEffect(() => {
    (async () => {
      const lastActivity = localStorage.getItem('ll_last_activity');
      if (lastActivity && (await base44.auth.isAuthenticated())) {
        if (Date.now() - parseInt(lastActivity) > SESSION_TIMEOUT) {
          base44.auth.logout();
          return;
        }
      }
      checkAppState();
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onActivity = () => localStorage.setItem('ll_last_activity', Date.now().toString());
    onActivity();
    let throttled = false;
    const handler = () => {
      if (throttled) return;
      throttled = true;
      onActivity();
      setTimeout(() => { throttled = false; }, 30000);
    };
    window.addEventListener('click', handler);
    window.addEventListener('keypress', handler);
    window.addEventListener('scroll', handler, { passive: true });
    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem('ll_last_activity') || '0');
      if (last && Date.now() - last > SESSION_TIMEOUT) logout();
    }, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handler);
      window.removeEventListener('keypress', handler);
      window.removeEventListener('scroll', handler);
    };
  }, [isAuthenticated]);

  // Clear auth tokens when the page is unloaded (tab close, browser close,
  // or navigating to a different site). This forces re-authentication on return.
  useEffect(() => {
    const onPageHide = () => {
      try {
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('ll_last_activity');
      } catch (e) { /* best-effort */ }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      try {
        const publicSettings = await base44.app.getPublicSettings();
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (await base44.auth.isAuthenticated()) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (redirectUrl) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ll_last_activity');
    if (redirectUrl !== false) {
      base44.auth.logout(redirectUrl || '/');
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
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