import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      });
    };

    const handleOnline = () => {
      console.log('[Network] Connection restored');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Initial check
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
};
