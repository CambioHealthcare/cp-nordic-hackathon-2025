interface JwtValues {
    cu_unit: string;
    cp_unit: string;
    org_nr: string;
}

/*interface DvText {
    _type: "DV_TEXT";
    value: string;
}

interface DvIdentifier {
    _type: "DV_IDENTIFIER";
    id: string;
    type: string;
}

interface DvCodedText {
    _type: "DV_CODED_TEXT";
    value: string;
    defining_code: {
        terminology_id: {
            value: string;
        };
        code_string: string;
    };
} */

const OTHER_CONTEXT_TEMPLATE = {
    _type: "ITEM_TREE",
    name: {
        _type: "DV_TEXT",
        value: "Tree"
    },
    archetype_node_id: "at0001",
    items: [
        {
            _type: "CLUSTER",
            name: {
                _type: "DV_TEXT",
                value: "Care Unit organization"
            },
            archetype_node_id: "openEHR-EHR-CLUSTER.organisation.v1",
            archetype_details: {
                archetype_id: {
                    value: "openEHR-EHR-CLUSTER.organisation.v1"
                },
                rm_version: "1.0.4"
            },
            items: [
                {
                    _type: "ELEMENT",
                    name: {
                        _type: "DV_TEXT",
                        value: "Name"
                    },
                    archetype_node_id: "at0001",
                    value: {
                        _type: "DV_TEXT",
                        value: "Care Unit name"
                    }
                },
                {
                    _type: "ELEMENT",
                    name: {
                        _type: "DV_TEXT",
                        value: "Care Unit identifier"
                    },
                    archetype_node_id: "at0003",
                    value: {
                        _type: "DV_IDENTIFIER",
                        id: "CU_UNIT",
                        type: "urn:oid:1.2.752.29.4.19"
                    }
                },
                {
                    _type: "ELEMENT",
                    name: {
                        _type: "DV_TEXT",
                        value: "Care Unit role"
                    },
                    archetype_node_id: "at0004",
                    value: {
                        _type: "DV_CODED_TEXT",
                        value: "Vårdenhet",
                        defining_code: {
                            terminology_id: {
                                value: "http://snomed.info/sct/900000000000207008"
                            },
                            code_string: "43741000"
                        }
                    }
                },
                {
                    _type: "CLUSTER",
                    name: {
                        _type: "DV_TEXT",
                        value: "Care Provider organization"
                    },
                    archetype_node_id: "openEHR-EHR-CLUSTER.organisation.v1",
                    archetype_details: {
                        archetype_id: {
                            value: "openEHR-EHR-CLUSTER.organisation.v1"
                        },
                        rm_version: "1.0.4"
                    },
                    items: [
                        {
                            _type: "ELEMENT",
                            name: {
                                _type: "DV_TEXT",
                                value: "Name"
                            },
                            archetype_node_id: "at0001",
                            value: {
                                _type: "DV_TEXT",
                                value: "Care Provider name"
                            }
                        },
                        {
                            _type: "ELEMENT",
                            name: {
                                _type: "DV_TEXT",
                                value: "Care Provider identifier"
                            },
                            archetype_node_id: "at0003",
                            value: {
                                _type: "DV_IDENTIFIER",
                                id: "CP_UNIT",
                                type: "urn:oid:1.2.752.29.4.19"
                            }
                        },
                        {
                            _type: "ELEMENT",
                            name: {
                                _type: "DV_TEXT",
                                value: "Care Provider identifier"
                            },
                            archetype_node_id: "at0003",
                            value: {
                                _type: "DV_IDENTIFIER",
                                id: "ORG_NR",
                                type: "urn:oid:2.5.4.97"
                            }
                        },
                        {
                            _type: "ELEMENT",
                            name: {
                                _type: "DV_TEXT",
                                value: "Care Provider role"
                            },
                            archetype_node_id: "at0004",
                            value: {
                                _type: "DV_CODED_TEXT",
                                value: "Vårdgivare",
                                defining_code: {
                                    terminology_id: {
                                        value: "http://snomed.info/sct/45991000052106"
                                    },
                                    code_string: "143591000052106"
                                }
                            }
                        }
                    ]
                }
            ]
        }
    ]
} as const;

export const decodeJwt = (token: string): JwtValues => {
    try {
        // Base64 decode the payload part of the JWT (second part)
        const base64Payload = token.split('.')[1];
        if (!base64Payload) {
            throw new Error('Invalid JWT format');
        }

        const payload = JSON.parse(atob(base64Payload));
        
        const values: JwtValues = {
            cu_unit: payload.healthCareUnitHsaId,
            cp_unit: payload.healthCareProviderHsaId,
            org_nr: payload.organizationIdentifier
        };

        // Validate all required values are present
        const missing = Object.entries(values)
            .filter(([_, v]) => !v)
            .map(([k]) => k);
            
        if (missing.length > 0) {
            throw new Error(`Missing required values in JWT: ${missing.join(', ')}`);
        }

        return values;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to decode JWT: ${error.message}`);
        }
        throw new Error('Failed to decode JWT: Unknown error');
    }
};

export const addPdlMetadata = (composition: Record<string, any>, values: JwtValues): Record<string, any> => {
    try {
        // Create deep copy of template
        const context = JSON.parse(JSON.stringify(OTHER_CONTEXT_TEMPLATE));
        
        // Clean the composition structure if it comes from Forms runtime
        let cleanComposition = composition;
        if (composition.type === 'output' && composition.data?.[0]?.data) {
            cleanComposition = composition.data[0].data;
        }

        // Ensure the composition has the correct openEHR structure
        if (!cleanComposition._type) {
            cleanComposition = {
                _type: "COMPOSITION",
                archetype_details: {
                    _type: "ARCHETYPED",
                    archetype_id: {
                        value: cleanComposition.model || cleanComposition.archetype_node_id
                    },
                    rm_version: "1.0.4"
                },
                ...cleanComposition
            };
        }

        const replaceIdentifiers = (items: any[]): void => {
            for (const item of items) {
                if (item._type === 'CLUSTER' && Array.isArray(item.items)) {
                    replaceIdentifiers(item.items);
                } else if (item._type === 'ELEMENT' && 
                         item.value?._type === 'DV_IDENTIFIER') {
                    switch (item.value.id) {
                        case 'CU_UNIT':
                            item.value.id = values.cu_unit;
                            break;
                        case 'CP_UNIT':
                            item.value.id = values.cp_unit;
                            break;
                        case 'ORG_NR':
                            item.value.id = values.org_nr;
                            break;
                    }
                }
            }
        };

        replaceIdentifiers(context.items);

        const { uid, ...compositionWithoutUid } = cleanComposition;  // Remove uid using destructuring
        const newComposition = { ...compositionWithoutUid };
        
        // Ensure context exists and has the correct structure
        if (!newComposition.context) {
            newComposition.context = {
                _type: 'EVENT_CONTEXT',
                setting: {
                    _type: 'DV_CODED_TEXT',
                    defining_code: {
                        _type: 'CODE_PHRASE',
                        code_string: '232',
                        terminology_id: {
                            _type: 'TERMINOLOGY_ID',
                            value: 'openehr'
                        }
                    },
                    value: 'secondary medical care'
                },
                start_time: {
                    _type: 'DV_DATE_TIME',
                    value: new Date().toISOString()
                }
            };
        }

        // Add other_context within the context object
        newComposition.context.other_context = context;

        return newComposition;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`addPdlMetadata - Failed to add PDL metadata: ${error.message}`);
        }
        throw new Error('addPdlMetadata - Failed to add PDL metadata: Unknown error');
    }
};
