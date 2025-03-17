import { useState, useEffect } from 'react';
import config from '../config/env.config';
import { FHIRPatient } from '../types/fhir';

// Removed local declaration of FHIRPatient as it conflicts with the imported one

interface EhrQueryResponse {
    rows: Array<[string]>;  // Array of arrays containing ehr_id
}

export const usePatients = () => {
  const [patients, setPatients] = useState<FHIRPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      console.log('Starting fetchPatients operation');
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('Authentication token not found in localStorage');
          throw new Error('No authentication token available');
        }
        console.log('Authentication token retrieved successfully');

        // Debug logging
        console.log('Config values:', {
          queryURL: config.XCDRqueryURL,
          ehrQuery: config.ehrQuery
        });

        if (!config.XCDRqueryURL || !config.ehrQuery) {
          console.error('Configuration validation failed:', { 
            hasQueryURL: !!config.XCDRqueryURL, 
            hasEhrQuery: !!config.ehrQuery 
          });
          throw new Error('Missing required configuration: queryURL or ehrQuery');
        }
        console.log('Configuration validation passed');

        const queryUrl = `${config.XCDRqueryURL}?q=${encodeURIComponent(config.ehrQuery)}`;
        console.log('Constructed query URL:', queryUrl);

        console.log('Initiating fetch request with headers:', {
          Authorization: 'Bearer [REDACTED]',
          Accept: 'application/json',
          'Content-Type': 'application/json'
        });

        const response = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          credentials: 'include'
        });

        console.log('Received response:', {
          status: response.status,
          statusText: response.statusText,
          type: response.type,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (response.type === 'opaque') {
          console.error('CORS error detected - response type is opaque');
          throw new Error('CORS error: Server response is opaque. Please check CORS configuration on the server.');
        }

        if (response.status === 401) {
          console.error('Authentication failed - 401 Unauthorized');
          throw new Error('Authentication failed - please log in again');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`Failed to fetch patients: ${response.status} - ${errorText}`);
        }
        
        const data: EhrQueryResponse = await response.json();
        console.log('Successfully parsed response data:', {
          rowCount: data.rows.length
        });

        const formattedPatients: FHIRPatient[] = data.rows
          .map(([ehrId]) => ({
            resourceType: "Patient",
            identifier: [
              {
                system: "http://cambio.se/openehr/ehrid",
                value: ehrId,
                type: {
                  coding: [{
                    system: "urn:openehr:class:EHR:system_id",
                    code: config.cpBase_t
                  }]
                }
              }
            ]
          }));
        
        console.log('Successfully formatted patients data:', {
          count: formattedPatients.length,
          samplePatient: formattedPatients.length > 0 ? 
            { ...formattedPatients[0], identifier: '[REDACTED]' } : 
            'No patients found'
        });
        
        setPatients(formattedPatients);
        console.log('Patient state updated successfully');

      } catch (err) {
        console.error('Error in usePatients:', err);
        console.error('Error details:', {
          name: err instanceof Error ? err.name : 'Unknown',
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });

        const errorMessage = err instanceof Error 
          ? (err.message.includes('CORS') 
            ? 'Unable to connect to the server due to CORS policy. Please contact your system administrator.' 
            : err.message)
          : 'Unknown error';
        setError(errorMessage);
      } finally {
        console.log('Fetch operation completed');
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return { patients, loading, error };
};
