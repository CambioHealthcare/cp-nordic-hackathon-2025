import { useState, useCallback, useEffect } from 'react';
import config from '../config/env.config';
import authService from '../services/auth.service';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: authService.getToken(),
    refreshToken: null,
    expiresAt: null,
  });

  useEffect(() => {
    const handleTokenChange = (event: CustomEvent<string | null>) => {
      setAuthState(prev => ({
        ...prev,
        accessToken: event.detail
      }));
    };

    window.addEventListener('auth-token-changed', handleTokenChange as EventListener);
    return () => {
      window.removeEventListener('auth-token-changed', handleTokenChange as EventListener);
    };
  }, []);

  const generateCodeVerifier = () => {
    const array = new Uint32Array(56);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const initiateLogin = useCallback(async () => {
    // Clear any existing session state
    sessionStorage.clear();
    localStorage.removeItem('auth_token');
    
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Set fresh session state
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('login_attempt', 'true');
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        redirect_uri: config.redirectUri,
        prompt: 'login' // Force fresh login
    });

    window.location.href = `${config.authUrl}?${params.toString()}`;
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!authState.accessToken) {
      return null;
    }

    if (authState.expiresAt && Date.now() >= authState.expiresAt) {
      // Token expired, try to refresh
      if (authState.refreshToken) {
        try {
          const response = await fetch(config.authTokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: authState.refreshToken,
              client_id: config.clientId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setAuthState({
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresAt: Date.now() + data.expires_in * 1000,
            });
            return data.access_token;
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
      
      // If refresh failed, initiate new login
      await initiateLogin();
      return null;
    }

    return authState.accessToken;
  }, [authState, initiateLogin]);

  const handleAuthCallback = useCallback(async (code: string) => {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    const response = await fetch(config.authTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const data = await response.json();
    setAuthState({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    sessionStorage.removeItem('code_verifier');
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleAuthCallback(code)
        .then(() => {
          // Clean up URL after successful authentication
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(console.error);
    }
  }, [handleAuthCallback]);

  return {
    isAuthenticated: !!authState.accessToken,
    getAccessToken,  // Use the async version instead of the simple callback
    initiateLogin,
  };
};
