/* Exposes a read-only auth-state bridge for future app.js account isolation. */
(() => {
  'use strict';

  const EVENT_NAME = 'packmate:auth-state-change';
  const subscribers = new Set();
  let generation = 0;
  let snapshot = Object.freeze({ status: 'loading', userId: null, email: null, generation });

  function publish(authState) {
    const status = ['loading', 'ready', 'unavailable'].includes(authState?.status)
      ? authState.status
      : 'unavailable';
    const userId = typeof authState?.user?.id === 'string' && authState.user.id
      ? authState.user.id
      : null;
    const email = userId && typeof authState?.user?.email === 'string'
      ? authState.user.email
      : null;

    if (snapshot.status !== status || snapshot.userId !== userId) generation += 1;
    snapshot = Object.freeze({ status, userId, email, generation });

    subscribers.forEach(callback => {
      try { callback(snapshot); } catch (_) { /* A consumer must not disrupt auth tracking. */ }
    });
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: snapshot }));
    } catch (_) { /* Event delivery is optional; the read-only API remains available. */ }
  }

  const api = Object.freeze({
    getState() { return snapshot; },
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      subscribers.add(callback);
      try { callback(snapshot); } catch (_) { /* Isolate consumer errors. */ }
      return () => subscribers.delete(callback);
    },
    captureRequest() {
      return Object.freeze({
        status: snapshot.status,
        userId: snapshot.userId,
        generation: snapshot.generation
      });
    },
    isCurrentRequest(request) {
      return Boolean(request &&
        request.generation === snapshot.generation &&
        request.status === snapshot.status &&
        request.userId === snapshot.userId);
    }
  });

  // Publish the bridge even if Auth failed to load; consumers can handle `unavailable`.
  window.PACKMATE_ACCOUNT_STATE = api;

  const auth = window.PACKMATE_AUTH;
  if (!auth || typeof auth.subscribe !== 'function') {
    publish({ status: 'unavailable', user: null });
    return;
  }

  try {
    auth.subscribe(publish);
  } catch (_) {
    publish({ status: 'unavailable', user: null });
  }
})();
