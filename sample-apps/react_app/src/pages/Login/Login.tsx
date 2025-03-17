import React, { useState } from 'react';
import authService from '../../services/auth.service';

const Login: React.FC = React.memo(() => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        if (isLoggingIn) return;

        try {
            setIsLoggingIn(true);
            await authService.initializePKCE();
        } catch (error) {
            console.error('Login.tsx - handleLogin - Login failed:', error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const checkToken = () => {
        const token = authService.getToken();
        if (token) {
            console.log('Login.tsx - checkToken - Token found:', token);
            const isExpired = authService.isTokenExpired(token);
            console.log('Login.tsx - checkToken - Token expired:', isExpired);
        } else {
            console.log('Login.tsx - checkToken - No token found');
        }
    };

    const handleRemoveToken = () => {
        const hadToken = authService.getToken() !== null;
        authService.clearToken();
        console.log('Login.tsx - handleRemoveToken - ' + 
            (hadToken ? 'Token removed successfully' : 'No token was present to remove'));
    };

    return (
        <div>
            <h1>Login</h1>
            <button onClick={handleLogin}>
                Login with OpenID Connect
            </button>
            <button onClick={checkToken}>
                Check Token
            </button>
            <button onClick={handleRemoveToken}>
                Remove Token
            </button>
        </div>
    );
});

Login.displayName = 'Login';
export default Login;
