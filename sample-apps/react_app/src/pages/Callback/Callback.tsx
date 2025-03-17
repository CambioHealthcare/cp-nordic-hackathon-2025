import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/auth.service';

const Callback: React.FC = React.memo(() => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            if (!code) {
                setError('No authorization code received');
                navigate('/login');
                return;
            }

            try {
                await authService.handleCallback(code);
                navigate('/');
            } catch (error) {
                console.error('Callback.tsx - handleCallback - Authentication failed:', error);
                setError('Authentication failed');
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div>
            <h2>Authenticating...</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
});

Callback.displayName = 'Callback';
export default Callback;
