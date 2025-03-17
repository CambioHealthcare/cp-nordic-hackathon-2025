import React, { useState } from 'react';
import authService from '../../services/auth.service';
import config from '../../config/env.config';
import styles from '../../styles/JsonRenderer.module.css';
import { renderJson } from '../../utils/jsonRenderer';

const Patient: React.FC = React.memo(() => {
    const [patientData, setPatientData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPatientData = async () => {
        console.log('Starting fetchPatientData...');
        setIsLoading(true);
        setError(null);

        try {
            const token = authService.getToken();
            console.log('Token retrieved:', !!token);

            if (!token) {
                throw new Error('No authentication token available');
            }

            console.log('Preparing FHIR request to:', config.fhirPatUrl);

            const response = await fetch(config.fhirPatUrl, {
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

            setPatientData(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Error in fetchPatientData:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Patient Information</h1>
            <button 
                onClick={fetchPatientData}
                disabled={isLoading}
                className={styles.fetchButton}
            >
                {isLoading ? 'Loading...' : 'Fetch Patient Data'}
            </button>

            {error && (
                <div className={styles.error}>
                    Error: {error}
                </div>
            )}

            {patientData && (
                <div className={styles.dataContainer}>
                    {renderJson(patientData)}
                </div>
            )}
        </div>
    );
});

Patient.displayName = 'Patient';
export default Patient;
