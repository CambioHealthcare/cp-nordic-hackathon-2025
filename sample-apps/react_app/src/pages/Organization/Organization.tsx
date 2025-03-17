import React, { useState } from 'react';
import authService from '../../services/auth.service';
import config from '../../config/env.config';
import styles from '../../styles/JsonRenderer.module.css';

const Organization: React.FC = React.memo(() => {
    const [organizationData, setOrganizationData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchOrganizationData = async () => {
        console.log('Starting fetchOrganizationData...');
        setIsLoading(true);
        setError(null);

        try {
            const token = authService.getToken();
            console.log('Token retrieved:', !!token);

            if (!token) {
                throw new Error('No authentication token available');
            }

            console.log('Preparing FHIR request to:', config.fhirOrgUrl);

            const response = await fetch(config.fhirOrgUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response received:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Data received:', data);

            setOrganizationData(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Error in fetchOrganizationData:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const renderJson = (jsonString: string) => {
        try {
            const json = JSON.parse(jsonString);
            return syntaxHighlight(json);
        } catch (e) {
            return jsonString;
        }
    };

    const syntaxHighlight = (obj: any): JSX.Element => {
        const format = (obj: any, indent = 0): JSX.Element[] => {
            if (obj === null) return [<span key={Math.random()} className={styles.jsonNull}>null</span>];
            
            switch (typeof obj) {
                case 'string':
                    return [<span key={Math.random()} className={styles.jsonString}>"{obj}"</span>];
                case 'number':
                    return [<span key={Math.random()} className={styles.jsonNumber}>{obj}</span>];
                case 'boolean':
                    return [<span key={Math.random()} className={styles.jsonBoolean}>{String(obj)}</span>];
                case 'object':
                    const isArray = Array.isArray(obj);
                    const entries = isArray ? obj : Object.entries(obj);
                    const brackets = isArray ? ['[', ']'] : ['{', '}'];
                    
                    return [
                        <span key={`open-${indent}`}>{brackets[0]}</span>,
                        ...entries.flatMap((item, i) => {
                            const [key, value] = isArray ? [null, item] : item;
                            return [
                                <div key={`line-${indent}-${i}`} style={{ marginLeft: 20 }}>
                                    {!isArray && (
                                        <>
                                            <span className={styles.jsonKey}>"{key}"</span>
                                            <span>: </span>
                                        </>
                                    )}
                                    {format(value, indent + 1)}
                                    {i < entries.length - 1 && ','}
                                </div>
                            ];
                        }),
                        <div key={`close-${indent}`}>{brackets[1]}</div>
                    ];
            }
            return [];
        };
        
        return <>{format(obj)}</>;
    };

    return (
        <div className={styles.container}>
            <h1>Organization Information</h1>
            <button 
                onClick={fetchOrganizationData}
                disabled={isLoading}
                className={styles.fetchButton}
            >
                {isLoading ? 'Loading...' : 'Fetch Organization Data'}
            </button>

            {error && (
                <div className={styles.error}>
                    Error: {error}
                </div>
            )}

            {organizationData && (
                <div className={styles.dataContainer}>
                    {renderJson(organizationData)}
                </div>
            )}
        </div>
    );
});

Organization.displayName = 'Organization';
export default Organization;
