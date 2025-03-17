import React, { useEffect, useCallback, useState } from 'react';
import config from '../config/env.config';
import authService from '../services/auth.service';
import { addPdlMetadata as addPdlMetadataToComposition, decodeJwt } from '../utils/pdlMetadata';
import styles from './Organization/Organization.module.css';

const FormPage: React.FC = () => {
    const [addPdlMetadata, setAddPdlMetadata] = useState(false);
    const [rawCompositionData, setRawCompositionData] = useState<any>(null);
    const [displayedCompositionData, setDisplayedCompositionData] = useState<any>(null);
    
    useEffect(() => {
        if (rawCompositionData) {
            try {
                const token = authService.getToken();
                if (addPdlMetadata && token) {
                    const jwtValues = decodeJwt(token);
                    const processedData = addPdlMetadataToComposition(rawCompositionData, jwtValues);
                    setDisplayedCompositionData(processedData);
                } else {
                    setDisplayedCompositionData(rawCompositionData);
                }
            } catch (error) {
                console.error('Error processing PDL metadata:', error);
                setDisplayedCompositionData(rawCompositionData);
            }
        }
    }, [rawCompositionData, addPdlMetadata]);

    const handleSubmission = async (submissionData: any) => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('No authentication token available in localStorage');
            }

            const createCompURL = `${config.XCDRBaseUrl}/v1/ehr/${config.ehrId}/composition`;
            const response = await fetch(createCompURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Form data submitted successfully');
        } catch (error) {
            console.error('Error submitting form data:', error);
        }
    };

    const handleMessage = useCallback(async (event: MessageEvent) => {
        if (event.origin !== new URL(config.formUrl).origin) {
            console.warn('Received message from unauthorized origin:', event.origin);
            return;
        }

        // Handle both form changes and submissions
        if (event.data?.type === 'formUpdate' || event.data?.type === 'output') {
            setRawCompositionData(event.data);

            // Only submit if it's the final output
            if (event.data?.type === 'output') {
                const token = authService.getToken();
                if (!token) {
                    console.error('No authentication token available');
                    return;
                }

                let submissionData = event.data;
                if (addPdlMetadata) {
                    const jwtValues = decodeJwt(token);
                    submissionData = addPdlMetadataToComposition(submissionData, jwtValues);
                }
                
                await handleSubmission(submissionData);
            }
        }
    }, [addPdlMetadata]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

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
        <div>
            <h1>Form Rendering Page</h1>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={addPdlMetadata}
                        onChange={(e) => setAddPdlMetadata(e.target.checked)}
                    />
                    Add PDL Metadata to Composition
                </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', height: '800px' }}>
                <iframe
                    src={config.formUrl}
                    style={{ width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                    title="Form"
                />
                <div className={styles.dataContainer}>
                    {displayedCompositionData 
                        ? renderJson(JSON.stringify(displayedCompositionData, null, 2))
                        : 'No composition data available'}
                </div>
            </div>
        </div>
    );
};

export default React.memo(FormPage);