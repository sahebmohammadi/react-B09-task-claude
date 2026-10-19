import * as React from 'react';

// Below the `lg` breakpoint the sidebar becomes an off-canvas Sheet (PRD §9.1.1).
const MOBILE_BREAKPOINT = 1024;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches);
}
