// Live Sync Utility for PC <-> iPhone real-time preview during editing
// Deprecation notice: Part of editing mode, can be deprecated/removed after editing is finalized.

const CLIENT_ID = 'client_' + Math.random().toString(36).substring(2, 9);
let lastPushedAt = 0;
let lastReceivedAt = 0;

export function getClientId() {
  return CLIENT_ID;
}

export async function pushLiveSync(payload) {
  const now = Date.now();
  lastPushedAt = now;
  const fullPayload = {
    ...payload,
    clientId: CLIENT_ID,
    updatedAt: now
  };

  // 1. Send via Vite HMR WebSocket if connected
  try {
    if (import.meta.hot) {
      import.meta.hot.send('winitis:sync-push', fullPayload);
    }
  } catch (e) {
    // Ignore WebSocket send errors
  }

  // 2. Send via HTTP API for persistence & fallback
  try {
    await fetch('/api/live-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    });
  } catch (e) {
    // Ignore fetch errors
  }
}

export function subscribeLiveSync(onSyncUpdate) {
  let isSubscribed = true;

  const handleIncoming = (data) => {
    if (!data || !isSubscribed) return;
    // Don't echo updates we sent ourselves recently
    if (data.clientId === CLIENT_ID && Date.now() - lastPushedAt < 1500) {
      return;
    }
    if (data.updatedAt && data.updatedAt <= lastReceivedAt) {
      return;
    }
    lastReceivedAt = data.updatedAt || Date.now();
    onSyncUpdate(data);
  };

  // 1. Listen on Vite HMR WebSocket
  if (import.meta.hot) {
    import.meta.hot.on('winitis:sync-pull', handleIncoming);
  }

  // 2. Initial fetch on mount
  fetch('/api/live-sync')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && (data.layout || data.wineNote)) {
        handleIncoming(data);
      }
    })
    .catch(() => {});

  // 3. Fallback polling every 800ms (essential for mobile Safari)
  const pollInterval = setInterval(() => {
    if (!isSubscribed) return;
    fetch('/api/live-sync', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.updatedAt && data.updatedAt > lastReceivedAt) {
          handleIncoming(data);
        }
      })
      .catch(() => {});
  }, 800);

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
  };
}
