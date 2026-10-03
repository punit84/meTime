import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

// Client-only check without triggering effect-based state cascading renders
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  return isClient ? client : server;
}

