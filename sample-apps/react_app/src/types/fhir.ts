export interface FHIRPatient {
    resourceType: "Patient";
    identifier?: Array<{
        system?: string;
        value?: string;
        type?: {
            coding?: Array<{
                system?: string;
                code?: string;
            }>;
        };
    }>;
}