import { useState, useEffect, useRef } from 'react';

/**
 * Hook to check if the JavaScript is loaded.
 *
 * @returns - True if the JavaScript is loaded, false otherwise.
 */
export function useJsLoaded() {
  const [loaded, setLoaded] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const onReady = () => {
      if (isMounted.current) {
        setLoaded(true);
      }
    };

    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      onReady();
      return;
    }

    document.addEventListener('DOMContentLoaded', onReady);
    window.addEventListener('load', onReady);

    return () => {
      isMounted.current = false;
      document.removeEventListener('DOMContentLoaded', onReady);
      window.removeEventListener('load', onReady);
    };
  }, []);

  return loaded;
}
