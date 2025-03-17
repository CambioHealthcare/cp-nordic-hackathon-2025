import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import config from '../../config/env.config';
import { renderJson } from '../../utils/jsonRenderer';
import styles from '../../styles/JsonRenderer.module.css';

const ShowComposition: React.FC = React.memo(() => {
  const { getAccessToken, initiateLogin } = useAuth();
  const [compositionData, setCompositionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComposition = async () => {
    console.log('ShowComposition.tsx - fetchComposition - Starting composition fetch operation');
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      console.log('ShowComposition.tsx - fetchComposition - Access token retrieval:', { hasToken: !!token });

      if (!token) {
        console.log('ShowComposition.tsx - fetchComposition - No token available, initiating login flow');
        initiateLogin();
        return;
      }
      const selectedEhrId = localStorage.getItem('selectedEhrId');
      if (!selectedEhrId) {
        console.error('ShowComposition - No EHR ID found in localStorage');
        setError('No patient selected. Please select a patient first.');
        setIsLoading(false);
        return;
      }

      const url = `${config.XCDRBaseUrl}/v1/ehr/${config.ehrId}/composition/${config.compositionId}`;
      console.log('ShowComposition - Using EHR ID from localStorage:', selectedEhrId);
      
      console.log('ShowComposition.tsx - fetchComposition - Fetching composition from:', url);
      console.log('ShowComposition.tsx - fetchComposition - Request configuration:', {
        ehrId: config.ehrId,
        compositionId: config.compositionId,
        baseUrl: config.XCDRBaseUrl
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('ShowComposition.tsx - fetchComposition - Received response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 401) {
        // Check if token is actually expired before initiating login
        const token = await getAccessToken();
        if (!token) {
          console.error('ShowComposition.tsx - fetchComposition - No token present');
          initiateLogin();
          return;
        }
        
        try {
          // Attempt to parse the token
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            
            if (Date.now() >= expirationTime) {
              console.error('ShowComposition.tsx - fetchComposition - Token expired, initiating login flow');
              initiateLogin();
              return;
            }
          }
        } catch (tokenError) {
          console.error('ShowComposition.tsx - fetchComposition - Error parsing token:', tokenError);
        }
        
        // If we get here, the token exists and isn't expired, but we still got a 401
        throw new Error('Server rejected the authentication token');
      }

      if (!response.ok) {
        console.error('ShowComposition.tsx - fetchComposition - Request failed:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('ShowComposition.tsx - fetchComposition - Successfully retrieved composition data:', {
        dataSize: JSON.stringify(data).length,
        compositionType: data?.type,
        timestamp: new Date().toISOString()
      });

      setCompositionData(data);
      console.log('ShowComposition.tsx - fetchComposition - Composition data successfully updated in state');

    } catch (err) {
      console.error('ShowComposition.tsx - fetchComposition - Error in fetchComposition:', err);
      console.error('ShowComposition.tsx - fetchComposition - Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'An error occurred',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      console.log('ShowComposition.tsx - fetchComposition - Fetch composition operation completed');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Composition Data</h2>
      <button 
        onClick={fetchComposition}
        disabled={isLoading}
        className={styles.fetchButton}
      >
        {isLoading ? 'Loading...' : 'Fetch Composition'}
      </button>

      {error && (
        <div className={styles.error}>
          Error: {error}
        </div>
      )}
      
      {compositionData && (
        <div className={styles.dataContainer}>
          {renderJson(JSON.stringify(compositionData, null, 2))}
        </div>
      )}
    </div>
  );
});

ShowComposition.displayName = 'ShowComposition';
export default ShowComposition;
