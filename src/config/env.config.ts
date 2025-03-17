interface EnvironmentConfig {
    authUrl: string;
    authTokenUrl: string;
    clientId: string;
    redirectUri: string;
    XCDRBaseUrl: string;
    CDRBaseUrl: string;
    formUrl: string;
    grafanaUrl: string;
    username: string;
    password: string;
    ehrQuery: string;
    XCDRqueryURL: string;
    CDRqueryURL: string;
    ehrId: string;
    compositionId: string;
    fhirOrgUrl: string;
    fhirPatUrl: string

    authUrl_t: string;
    authTokenUrl_t: string;
    XCDRBaseUrl_t: string;
    username_t: string;
    password_t: string;
    XCDRqueryURL_t: string;
    clientId_t: string;
    fhirOrgUrl_t: string;
    fhirPatUrl_t: string;
    ehrId_t: string;
    cpBase_t: string;
}

function requireEnvVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing environment variable: ${name}`);
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// Add validation specifically for query-related variables
if (!process.env.REACT_APP_XCDR_QUERY_URL || !process.env.REACT_APP_EHR_QUERY) {
    console.error('Environment variables check:', {
        REACT_APP_XCDR_QUERY_URL: process.env.REACT_APP_XCDR_QUERY_URL,
        REACT_APP_EHR_QUERY: process.env.REACT_APP_EHR_QUERY
    });
}

const config: EnvironmentConfig = {
    authUrl: requireEnvVariable('REACT_APP_AUTH_URL'),
    authTokenUrl: requireEnvVariable('REACT_APP_AUTH_TOKEN_URL'),
    clientId: requireEnvVariable('REACT_APP_CLIENT_ID'),
    redirectUri: requireEnvVariable('REACT_APP_REDIRECT_URI'),
    XCDRBaseUrl: requireEnvVariable('REACT_APP_XCDR_BASE_URL'),
    CDRBaseUrl: requireEnvVariable('REACT_APP_CDR_BASE_URL'),
    formUrl: requireEnvVariable('REACT_APP_FORM_URL'),
    grafanaUrl: requireEnvVariable('REACT_APP_GRAFANA_URL'),
    username: requireEnvVariable('REACT_APP_USERNAME'),
    password: requireEnvVariable('REACT_APP_PASSWORD'),
    ehrQuery: requireEnvVariable('REACT_APP_EHR_QUERY'),
    XCDRqueryURL: requireEnvVariable('REACT_APP_XCDR_QUERY_URL'),
    CDRqueryURL: requireEnvVariable('REACT_APP_CDR_QUERY_URL'),
    ehrId: requireEnvVariable('REACT_APP_TEST_EHR_ID'),
    compositionId: requireEnvVariable('REACT_APP_TEST_COMPOSITION_ID'),
    fhirOrgUrl: requireEnvVariable('REACT_APP_FHIR_ORG_URL'),
    fhirPatUrl: requireEnvVariable('REACT_APP_FHIR_PAT_URL'),
    
    authUrl_t: requireEnvVariable('REACT_APP_AUTH_URL_T'),
    authTokenUrl_t: requireEnvVariable('REACT_APP_AUTH_TOKEN_URL_T'),
    username_t: requireEnvVariable('REACT_APP_USERNAME_T'),
    password_t: requireEnvVariable('REACT_APP_PASSWORD_T'),
    XCDRBaseUrl_t: requireEnvVariable('REACT_APP_XCDR_BASE_URL_T'),
    XCDRqueryURL_t: requireEnvVariable('REACT_APP_XCDR_QUERY_URL_T'),
    clientId_t: requireEnvVariable('REACT_APP_CLIENT_ID_T'),
    fhirOrgUrl_t: requireEnvVariable('REACT_APP_FHIR_ORG_URL_T'),
    fhirPatUrl_t: requireEnvVariable('REACT_APP_FHIR_PAT_URL_T'),
    ehrId_t: requireEnvVariable('REACT_APP_TEST_EHR_ID_T'),
    cpBase_t: requireEnvVariable('REACT_APP_CP_BASE_T')
};

export type { EnvironmentConfig };
export default config;
