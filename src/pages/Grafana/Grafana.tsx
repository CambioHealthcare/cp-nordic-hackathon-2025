import React, { useState, useEffect, memo } from 'react';
import config from '../../config/env.config';

interface GrafanaProps {
  className?: string;
}

const Grafana: React.FC<GrafanaProps> = memo(({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.grafanaUrl) {
      setError('Grafana URL is not configured');
      setIsLoading(false);
    }
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Unable to load Grafana dashboard. This might be due to X-Frame-Options restrictions.');
    setIsLoading(false);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={className}>
      {isLoading && <div>Loading Grafana dashboard...</div>}
      {error && <div className="error-message">{error}</div>}
      <iframe
        src={config.grafanaUrl}
        style={{ 
          width: '450', 
          height: '200', 
          border: 'none',
          display: isLoading ? 'none' : 'block' 
        }}
        title="Grafana Dashboard"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allowFullScreen
      />
    </div>
  );
});

Grafana.displayName = 'Grafana';

export default Grafana;