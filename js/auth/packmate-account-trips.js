/* Explicit, read-only in-memory access to the signed-in user's cloud trips. */
(() => {
  'use strict';

  const listeners = new Set();
  let authSnapshot = null;
  let phase = 'unavailable';
  let cached = null;
  let activeRequest = null;

  function accountApi() {
    return window.PACKMATE_ACCOUNT_STATE || null;
  }

  function authApi() {
    return window.PACKMATE_AUTH || null;
  }

  function notify() {
    const snapshot = getState();
    listeners.forEach(callback => {
      try { callback(snapshot); } catch (_) { /* Consumer errors must not affect reads. */ }
    });
  }

  function currentAuthMatches(request) {
    const accounts = accountApi();
    const auth = authApi();
    if (!accounts || !auth || typeof accounts.isCurrentRequest !== 'function' ||
        typeof auth.getState !== 'function' || typeof auth.getCurrentUser !== 'function') return false;

    const current = accounts.getState();
    const authState = auth.getState();
    const user = auth.getCurrentUser();
    return Boolean(
      accounts.isCurrentRequest(request) &&
      current?.status === 'ready' &&
      current.userId === request.userId &&
      current.generation === request.generation &&
      authState?.status === 'ready' &&
      authState.user?.id === request.userId &&
      user?.id === request.userId
    );
  }

  function requestFromCurrentAccount() {
    const accounts = accountApi();
    const auth = authApi();
    if (!accounts || !auth || typeof accounts.captureRequest !== 'function' ||
        typeof accounts.isCurrentRequest !== 'function' ||
        typeof auth.getState !== 'function' || typeof auth.getCurrentUser !== 'function') {
      return { ok: false, reason: 'unavailable' };
    }

    const request = accounts.captureRequest();
    const account = accounts.getState();
    const authState = auth.getState();
    const user = auth.getCurrentUser();
    if (request?.status !== 'ready' || !request.userId ||
        account?.status !== 'ready' || account.userId !== request.userId ||
        account.generation !== request.generation ||
        authState?.status !== 'ready' || authState.user?.id !== request.userId ||
        user?.id !== request.userId) {
      return {
        ok: false,
        reason: account?.status === 'unavailable' || authState?.status === 'unavailable'
          ? 'unavailable'
          : 'unauthenticated'
      };
    }
    return { ok: true, request };
  }

  function freezeDeep(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(key => freezeDeep(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  function copyPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    let serialized;
    try { serialized = JSON.stringify(payload); } catch (_) { return null; }
    if (typeof serialized !== 'string') return null;
    try {
      const copy = JSON.parse(serialized);
      if (!copy || typeof copy !== 'object' || Array.isArray(copy)) return null;
      return freezeDeep(copy);
    } catch (_) {
      return null;
    }
  }

  function makeTrips(rows) {
    if (!Array.isArray(rows)) return null;
    const trips = [];
    const ids = new Set();
    for (const row of rows) {
      if (!row || typeof row.tripId !== 'string' || !row.tripId.trim() ||
          !Number.isSafeInteger(row.revision) || row.revision < 1) return null;
      const payload = copyPayload(row.payload);
      if (!payload || payload.id !== row.tripId || ids.has(row.tripId)) return null;
      ids.add(row.tripId);
      trips.push(Object.freeze({ tripId: row.tripId, payload, revision: row.revision }));
    }
    return Object.freeze(trips);
  }

  function publicSnapshot() {
    const request = activeRequest?.request || cached;
    const userId = request && currentAuthMatches(request) ? request.userId : null;
    const generation = request && currentAuthMatches(request) ? request.generation : null;
    return Object.freeze({ status: phase, userId, generation, count: cached && userId === cached.userId && generation === cached.generation ? cached.trips.length : null });
  }

  function getState() {
    return publicSnapshot();
  }

  function getTrips() {
    if (!cached || !currentAuthMatches(cached)) return null;
    return cached.trips;
  }

  function failure(reason) {
    return Object.freeze({ ok: false, reason });
  }

  function invalidate(nextSnapshot) {
    authSnapshot = nextSnapshot || null;
    if (activeRequest) {
      const oldRequest = activeRequest;
      activeRequest = null;
      try { oldRequest.controller?.abort(); } catch (_) { /* Stale responses are rejected independently. */ }
    }
    cached = null;
    if (!authSnapshot || authSnapshot.status === 'unavailable') phase = 'unavailable';
    else if (authSnapshot.status !== 'ready') phase = 'idle';
    else if (!authSnapshot.userId) phase = 'unauthenticated';
    else phase = 'idle';
    notify();
  }

  async function readTrips(forceRefresh) {
    const auth = authApi();
    if (!auth || typeof auth.readCloudImportOverview !== 'function') {
      phase = 'unavailable';
      cached = null;
      notify();
      return failure('unavailable');
    }

    const captured = requestFromCurrentAccount();
    if (!captured.ok) {
      cached = null;
      phase = captured.reason;
      notify();
      return failure(captured.reason);
    }
    const request = captured.request;

    if (!forceRefresh && cached && cached.userId === request.userId &&
        cached.generation === request.generation && currentAuthMatches(request)) {
      return Object.freeze({ ok: true, userId: request.userId, generation: request.generation, trips: cached.trips, cached: true });
    }
    if (!forceRefresh && activeRequest && activeRequest.request.userId === request.userId &&
        activeRequest.request.generation === request.generation) return activeRequest.promise;

    if (activeRequest) {
      const previous = activeRequest;
      activeRequest = null;
      try { previous.controller?.abort(); } catch (_) { /* Continue with the newer explicit read. */ }
    }

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const record = { request, controller, promise: null };
    activeRequest = record;
    cached = null;
    phase = 'loading';
    notify();

    record.promise = (async () => {
      try {
        if (!currentAuthMatches(request)) return failure('stale');
        const overview = await auth.readCloudImportOverview(request.userId, controller?.signal);
        if (!currentAuthMatches(request) || activeRequest !== record) return failure('stale');
        if (!overview?.ok || overview.userId !== request.userId || !Array.isArray(overview.tripRows)) {
          phase = 'error';
          activeRequest = null;
          notify();
          return failure('read_failed');
        }

        const trips = makeTrips(overview.tripRows);
        if (!trips) {
          phase = 'error';
          activeRequest = null;
          notify();
          return failure('invalid_data');
        }
        if (!currentAuthMatches(request) || activeRequest !== record) return failure('stale');

        cached = Object.freeze({ status: request.status, userId: request.userId, generation: request.generation, trips });
        activeRequest = null;
        phase = 'ready';
        notify();
        return Object.freeze({ ok: true, userId: request.userId, generation: request.generation, trips, cached: false });
      } catch (_) {
        if (!currentAuthMatches(request) || activeRequest !== record) return failure('stale');
        activeRequest = null;
        cached = null;
        phase = 'error';
        notify();
        return failure('read_failed');
      }
    })();
    return record.promise;
  }

  const api = Object.freeze({
    getState,
    getTrips,
    load() { return readTrips(false); },
    refresh() { return readTrips(true); },
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      listeners.add(callback);
      try { callback(getState()); } catch (_) { /* Isolate consumer errors. */ }
      return () => listeners.delete(callback);
    }
  });

  window.PACKMATE_ACCOUNT_TRIPS = api;

  const accounts = accountApi();
  if (accounts && typeof accounts.subscribe === 'function') {
    try {
      accounts.subscribe(snapshot => {
        const previous = authSnapshot;
        const changed = !previous || previous.status !== snapshot?.status ||
          previous.userId !== snapshot?.userId || previous.generation !== snapshot?.generation;
        if (changed) invalidate(snapshot);
      });
    } catch (_) {
      invalidate({ status: 'unavailable', userId: null, generation: null });
    }
  } else {
    invalidate({ status: 'unavailable', userId: null, generation: null });
  }
})();
