import React, { ReactElement } from 'react';
import styles from '../styles/JsonRenderer.module.css';

//Removed since no additional styling or behaviour to JSON elements is within scope for the application
/** interface JsonElementProps {
    className?: string;
    children: React.ReactNode;
}

const JsonElement = React.memo(({ className, children }: JsonElementProps): JSX.Element => (
    <span className={className}>{children}</span>
)); **/ 


const formatJsonValue = (obj: any, indent = 0): JSX.Element[] => {
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
                            {formatJsonValue(value, indent + 1)}
                            {i < entries.length - 1 && ','}
                        </div>
                    ];
                }),
                <div key={`close-${indent}`}>{brackets[1]}</div>
            ];
    }
    return [];
};

export const renderJson = (jsonString: string): ReactElement => {
    try {
        const json = JSON.parse(jsonString);
        return (
            <pre className={styles.dataContainer}>
                {formatJsonValue(json)}
            </pre>
        );
    } catch (e) {
        return <pre className={`${styles.dataContainer} ${styles.jsonError}`}>{jsonString}</pre>;
    }
};
