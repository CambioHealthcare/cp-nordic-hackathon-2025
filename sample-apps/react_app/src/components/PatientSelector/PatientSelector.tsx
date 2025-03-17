import React, { useState } from 'react';
import authService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import config from '../../config/env.config';
import './PatientSelector.css';
import { FHIRPatient } from '../../types/fhir';

// Removed local declaration of FHIRPatient as it conflicts with the imported one

const PatientSelector: React.FC = () => {
    const [patients, setPatients] = useState<FHIRPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>('');
    const navigate = useNavigate();

    const checkAuthentication = (): boolean => {
        const token = authService.getToken();
        if (!token) {
            console.log('No authentication token found, redirecting to login...');
            navigate('/login');
            return false;
        }
        return true;
    };

    const fetchPatients = async () => {
        console.log('Initiating patient fetch operation...');
        
        if (!checkAuthentication()) {
            return;
        }

        try {
            const token = authService.getToken();
            const response = await fetch(config.fhirPatUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                console.log('Token expired or invalid, redirecting to login...');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const patientList: FHIRPatient[] = Array.isArray(data.entry) 
                ? data.entry.map((e: any) => e.resource)
                : [];
            
            setPatients(patientList);

        } catch (error) {
            console.error('Error during patient fetch operation:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
            }
        }
    };

    const handlePatientChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = event.target.value;
        setSelectedPatient(selectedId);
        localStorage.setItem('selectedEhrId', selectedId); // Changed key name to be more specific
        console.log('PatientSelector - Stored EHR ID in localStorage:', selectedId);
    };

    // Add initialization from localStorage
    React.useEffect(() => {
        const storedEhrId = localStorage.getItem('selectedEhrId');
        if (storedEhrId) {
            setSelectedPatient(storedEhrId);
            console.log('PatientSelector - Restored EHR ID from localStorage:', storedEhrId);
        }
    }, []);

    const getOpenEhrId = (patient: FHIRPatient): string | undefined => {
        if (!patient.identifier) return undefined;
        
        const ehrIdentifier = patient.identifier.find(id => 
            id.system === "http://cambio.se/openehr/ehrid" && 
            id.type?.coding?.some(coding => 
                coding.system === "urn:openehr:class:EHR:system_id" &&
                coding.code === config.cpBase_t
            )
        );
        
        return ehrIdentifier?.value;
    };

    const getDistinctEhrIds = (): string[] => {
        const ehrIds = patients
            .map(getOpenEhrId)
            .filter((id): id is string => id !== undefined);
        return [...new Set(ehrIds)];
    };

    return (
        <div className="patient-selector">
            <select 
                value={selectedPatient}
                onChange={handlePatientChange}
                className="patient-dropdown"
            >
                <option value="">--No patient selected--</option>
                {getDistinctEhrIds().map(ehrId => (
                    <option key={ehrId} value={ehrId}>
                        {ehrId}
                    </option>
                ))}
            </select>
            <button onClick={fetchPatients} className="fetch-patients-btn">
                Fetch Patients
            </button>
        </div>
    );
};

export default React.memo(PatientSelector);
