//import axios from 'axios';
import config from '../config/env.config';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

interface JWTPayload {
    exp?: number;
    iat?: number;
    // Add other token payload fields as needed
}

class AuthService {
    private static instance: AuthService;
    private token: string | null = null;
    private codeVerifier: string | null = null;
    private codeChallenge: string | null = null;
    private readonly TOKEN_KEY = 'auth_token'; // Changed to match usage
    private readonly CODE_VERIFIER_KEY = 'code_verifier';
    private isHandlingCallback: boolean = false; // Add lock flag
    private readonly CACHE_DURATION = 2000; // 2 seconds in milliseconds
    private lastTokenCheck: number = 0;
    private cachedToken: string | null = null;

    private constructor() {
        this.token = localStorage.getItem(this.TOKEN_KEY);
        console.log('auth.service.ts - constructor - AuthService initialized', { hasToken: !!this.token });
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            console.log('auth.service.ts - getInstance - Creating new AuthService instance');
            AuthService.instance = new AuthService();
        }
        console.log('auth.service.ts - getInstance - Returning AuthService instance');
        return AuthService.instance;
    }

    public async initializePKCE(): Promise<void> {
        try {
            console.log('auth.service.ts - initializePKCE - Initializing PKCE flow');
            
            const verifier = generateCodeVerifier(128);
            this.codeVerifier = verifier;
            this.codeChallenge = await generateCodeChallenge(verifier);
            
            localStorage.setItem(this.CODE_VERIFIER_KEY, this.codeVerifier);

            const state = crypto.randomUUID();
            localStorage.setItem('auth_state', state);

            const authUrl = new URL(config.authUrl);
            authUrl.searchParams.append('client_id', config.clientId);
            authUrl.searchParams.append('redirect_uri', config.redirectUri);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('code_challenge', this.codeChallenge);
            authUrl.searchParams.append('code_challenge_method', 'S256');
            authUrl.searchParams.append('state', state);

            console.log('auth.service.ts - initializePKCE - Redirecting to authorization endpoint');
            window.location.href = authUrl.toString();
        } catch (error) {
            console.error('auth.service.ts - initializePKCE - PKCE initialization failed:', error);
            throw error;
        }
    }

    public async handleCallback(code: string): Promise<void> {
        if (this.isHandlingCallback) {
            console.log('auth.service.ts - handleCallback - Token exchange already in progress, skipping duplicate request');
            return;
        }

        this.isHandlingCallback = true;
        console.log('auth.service.ts - handleCallback - Processing authentication callback');

        try {
            const verifier = localStorage.getItem(this.CODE_VERIFIER_KEY);
            const state = localStorage.getItem('auth_state');
            
            if (!verifier) {
                console.error('auth.service.ts - handleCallback - Code verifier not found in storage');
                throw new Error('Code verifier not found');
            }

            if (!state) {
                console.error('auth.service.ts - handleCallback - State parameter not found in storage');
                throw new Error('State parameter not found');
            }

            // Verify state parameter from URL matches stored state
            const urlParams = new URLSearchParams(window.location.search);
            const returnedState = urlParams.get('state');
            
            if (state !== returnedState) {
                console.error('auth.service.ts - handleCallback - State mismatch', { stored: state, returned: returnedState });
                throw new Error('State verification failed');
            }

            console.log('auth.service.ts - handleCallback - State verification:', { stored: state, returned: returnedState });
            console.log('auth.service.ts - handleCallback - Code verifier from storage:', verifier);

            console.log('auth.service.ts - handleCallback - Starting token exchange process');
            console.log('auth.service.ts - handleCallback - Request parameters:', {
                client_id: config.clientId,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
                code_verifier: verifier
            });

            const response = await fetch(config.authTokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: config.redirectUri,
                    code_verifier: verifier
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`auth.service.ts - handleCallback - Token request failed: ${response.statusText}`, errorText);
                throw new Error(`Token request failed: ${response.statusText}`);
            }

            console.log('auth.service.ts - handleCallback - Token exchange successful');
            const data = await response.json();
            const token = data.access_token;
            
            if (token) {
                this.token = token;
                localStorage.setItem(this.TOKEN_KEY, token);
                sessionStorage.setItem('had_session', 'true');
                window.dispatchEvent(new CustomEvent('auth-token-changed', { detail: token }));
                
                // Clean up URL parameters
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                
                console.log('auth.service.ts - handleCallback - Authentication completed successfully');
            } else {
                throw new Error('No access token in response');
            }
        } catch (error) {
            console.error('auth.service.ts - handleCallback - Token exchange failed:', error);
            throw error;
        } finally {
            // Clean up state
            localStorage.removeItem('auth_state');
            localStorage.removeItem(this.CODE_VERIFIER_KEY);
            sessionStorage.removeItem('auth_in_progress');
            this.isHandlingCallback = false;
        }
    }

    private decodeToken(token: string): JWTPayload | null {
        console.log('auth.service.ts - decodeToken - Attempting to decode token');
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => 
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            console.log('auth.service.ts - decodeToken - Token decoded successfully');
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('auth.service.ts - decodeToken - Token parsing failed:', error);
            return null;
        }
    }

    public isTokenExpired(token?: string | null): boolean {
        console.log('auth.service.ts - isTokenExpired - Checking token expiration');
        const tokenToCheck = token || this.getToken();
        if (!tokenToCheck) return true;

        const payload = this.decodeToken(tokenToCheck);
        if (!payload || !payload.exp) return true;

        const currentTime = Math.floor(Date.now() / 1000);
        const result = payload.exp < currentTime;
        console.log('auth.service.ts - isTokenExpired - Token expiration check result:', result);
        return result;
    }

    public getToken(): string | null {
        const now = Date.now();
        
        // Return cached token if within cache duration
        if (this.cachedToken && (now - this.lastTokenCheck) < this.CACHE_DURATION) {
            console.log('auth.service.ts - getToken - Returning cached token');
            return this.cachedToken;
        }

        if (!this.token) {
            console.log('auth.service.ts - getToken - Token not found in memory, checking localStorage');
            this.token = localStorage.getItem(this.TOKEN_KEY);
        }
        
        this.lastTokenCheck = now;
        this.cachedToken = this.token;
        
        console.log('auth.service.ts - getToken - Retrieved token:', { hasToken: !!this.token });
        return this.token;
    }

    public logout(): void {
        console.log('auth.service.ts - logout - Initiating logout process');
        this.token = null;
        this.cachedToken = null;
        this.lastTokenCheck = 0;
        this.codeVerifier = null;
        this.codeChallenge = null;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.CODE_VERIFIER_KEY);
        window.dispatchEvent(new Event('auth-logout'));
        console.log('auth.service.ts - logout - Logout completed successfully');
    }

    public isAuthenticated(): boolean {
        const token = this.getToken();
        const result = !!token && !this.isTokenExpired(token);
        console.log('auth.service.ts - isAuthenticated - Authentication check result:', result);
        return result;
    }
 
    public clearToken(): void {
        console.log('auth.service.ts - clearToken - Clearing authentication token');
        this.token = null;
        this.cachedToken = null;
        this.lastTokenCheck = 0;
        localStorage.removeItem(this.TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('auth-token-changed', { detail: null }));
        console.log('auth.service.ts - clearToken - Token cleared successfully');
    }
}

const authService = AuthService.getInstance();
export default authService;
