/* Capture native Storage methods and protect PACKMATE records from invalid-data overwrites. */
(() => {
  'use strict';

  const nativeGet = Storage.prototype.getItem;
  const rawSet = Storage.prototype.setItem;
  const protectedKeys = new Map([
    ['packmate.trips.v1', '일정'],
    ['packmate.essentials.v1', '개인 필수품']
  ]);
  const personalKeys = new Set([...protectedKeys.keys(), 'packmate.activities.v1', 'packmate.draft.v1']);
  let localStore = null;
  try { localStore = window.localStorage; } catch (_) { /* Storage may be unavailable in restricted contexts. */ }

  function validRecord(key, value) {
    let parsed;
    try { parsed = JSON.parse(value); } catch (_) { return false; }
    if (!Array.isArray(parsed)) return false;
    if (key === 'packmate.trips.v1') {
      return parsed.every(trip => trip && typeof trip === 'object' && !Array.isArray(trip)
        && typeof trip.id === 'string' && trip.id.length > 0
        && (trip.packing === undefined || (Array.isArray(trip.packing) && trip.packing.every(item => typeof item === 'string' || (item && typeof item === 'object' && !Array.isArray(item)))))
        && (trip.tasks === undefined || (Array.isArray(trip.tasks) && trip.tasks.every(item => typeof item === 'string' || (item && typeof item === 'object' && !Array.isArray(item))))));
    }
    return parsed.every(item => item && typeof item === 'object' && !Array.isArray(item)
      && typeof item.id === 'string' && item.id.length > 0
      && typeof item.name === 'string' && item.name.trim().length > 0);
  }

  const notice = document.createElement('div');
  notice.className = 'storage-integrity-notice';
  notice.setAttribute('role', 'alert');
  notice.hidden = true;
  Object.assign(notice.style, {
    margin: '12px auto', padding: '12px 16px', maxWidth: '900px',
    border: '1px solid #E9B8A8', borderRadius: '12px',
    background: '#FFF4EF', color: '#8A4835', fontSize: '13px', lineHeight: '1.6'
  });
  const main = document.querySelector('#mainContent');
  if (main) main.before(notice);

  function warn(labels) {
    notice.textContent = `${labels.join(' 및 ')} 저장 데이터 형식을 확인할 수 없어 기존 기록을 보호하고 있어요. 데이터가 덮어써지지 않도록 해당 저장을 중단합니다. 브라우저 저장 데이터를 복구하거나 백업한 뒤 다시 시도해 주세요.`;
    notice.hidden = false;
  }

  function storageError(message) {
    if (typeof DOMException === 'function') return new DOMException(message, 'InvalidStateError');
    const error = new Error(message);
    error.name = 'InvalidStateError';
    return error;
  }

  const invalidAtStart = [];
  if (localStore) {
    for (const [key, label] of protectedKeys) {
      try {
        const current = nativeGet.call(localStore, key);
        if (current !== null && !validRecord(key, current)) invalidAtStart.push(label);
      } catch (_) {
        invalidAtStart.push(label);
      }
    }
  }
  if (invalidAtStart.length) warn(invalidAtStart);

  function safeSet(key, value) {
    if (this === localStore && personalKeys.has(key) && window.PACKMATE_APP_DATA?.canWriteLocal?.(key) !== true) {
      throw storageError('읽기 전용 계정 화면에서는 개인 데이터를 이 브라우저에 저장하지 않습니다.');
    }
    if (this === localStore && protectedKeys.has(key)) {
      const label = protectedKeys.get(key);
      let current;
      try { current = nativeGet.call(this, key); }
      catch (_) {
        warn([label]);
        throw storageError(`${label} 저장 데이터를 읽지 못해 덮어쓰기를 중단했습니다.`);
      }
      if (current !== null && !validRecord(key, current)) {
        warn([label]);
        throw storageError(`${label} 저장 데이터가 올바른 형식이 아니어서 덮어쓰기를 중단했습니다.`);
      }
      if (!validRecord(key, String(value))) {
        warn([label]);
        throw storageError(`${label} 새 데이터가 올바른 형식이 아니어서 저장을 중단했습니다.`);
      }
    }
    return rawSet.call(this, key, value);
  }

  function guestWriteSession(requestGeneration) {
    if (!Number.isSafeInteger(requestGeneration) || requestGeneration < 0) {
      return { ok: false, reason: 'invalidGeneration' };
    }
    try {
      const appState = window.PACKMATE_APP_DATA?.getState?.();
      const account = window.PACKMATE_ACCOUNT_STATE?.getState?.();
      const loggedOut = value => value === null || value === undefined || value === '';
      if (!appState || !account) return { ok: false, reason: 'accountUnavailable' };
      if (appState.mode !== 'guest-preview' || !loggedOut(appState.userId) ||
          account.status !== 'ready' || !loggedOut(account.userId)) {
        return { ok: false, reason: 'guestModeRequired' };
      }
      if (!Number.isSafeInteger(appState.generation) || appState.generation < 0 ||
          !Number.isSafeInteger(account.generation) || account.generation < 0 ||
          appState.generation !== requestGeneration || account.generation !== requestGeneration) {
        return { ok: false, reason: 'accountChanged' };
      }
      return { ok: true };
    } catch (_) {
      return { ok: false, reason: 'accountUnavailable' };
    }
  }

  function appendGuestTrip(trip, requestGeneration) {
    if (!localStore) return { ok: false, reason: 'storageUnavailable' };

    const initialSession = guestWriteSession(requestGeneration);
    if (!initialSession.ok) return initialSession;
    if (!trip || typeof trip !== 'object' || Array.isArray(trip) ||
        typeof trip.id !== 'string' || !trip.id.trim()) {
      return { ok: false, reason: 'invalidTrip' };
    }

    let newTrip;
    try {
      const serializedTrip = JSON.stringify(trip);
      if (typeof serializedTrip !== 'string') return { ok: false, reason: 'invalidTrip' };
      newTrip = JSON.parse(serializedTrip);
    } catch (_) {
      return { ok: false, reason: 'invalidTrip' };
    }
    if (!newTrip || typeof newTrip !== 'object' || Array.isArray(newTrip) ||
        typeof newTrip.id !== 'string' || !newTrip.id.trim() || newTrip.id !== trip.id ||
        !validRecord('packmate.trips.v1', JSON.stringify([newTrip]))) {
      return { ok: false, reason: 'invalidTrip' };
    }

    let raw;
    try {
      raw = nativeGet.call(localStore, 'packmate.trips.v1');
    } catch (_) {
      return { ok: false, reason: 'storageUnavailable' };
    }

    let existingTrips = [];
    if (raw !== null) {
      try {
        existingTrips = JSON.parse(raw);
      } catch (_) {
        return { ok: false, reason: 'invalidJson' };
      }
      if (!Array.isArray(existingTrips) || !validRecord('packmate.trips.v1', raw)) {
        return { ok: false, reason: 'invalidFormat' };
      }
    }

    const existingIds = new Set();
    for (const existingTrip of existingTrips) {
      if (!existingTrip || typeof existingTrip !== 'object' || Array.isArray(existingTrip) ||
          typeof existingTrip.id !== 'string' || !existingTrip.id.trim()) {
        return { ok: false, reason: 'invalidTrip' };
      }
      if (existingIds.has(existingTrip.id)) return { ok: false, reason: 'duplicateTripId' };
      existingIds.add(existingTrip.id);
    }
    if (existingIds.has(newTrip.id)) return { ok: false, reason: 'duplicateTripId' };

    let serializedTrips;
    let returnedTrips;
    try {
      serializedTrips = JSON.stringify([...existingTrips, newTrip]);
      returnedTrips = JSON.parse(serializedTrips);
    } catch (_) {
      return { ok: false, reason: 'copyFailed' };
    }
    if (!Array.isArray(returnedTrips) || !validRecord('packmate.trips.v1', serializedTrips)) {
      return { ok: false, reason: 'copyFailed' };
    }

    const currentSession = guestWriteSession(requestGeneration);
    if (!currentSession.ok) return { ok: false, reason: 'accountChanged' };

    let latestRaw;
    try {
      latestRaw = nativeGet.call(localStore, 'packmate.trips.v1');
    } catch (_) {
      return { ok: false, reason: 'storageUnavailable' };
    }
    if (latestRaw !== raw) return { ok: false, reason: 'storageChanged' };

    try {
      rawSet.call(localStore, 'packmate.trips.v1', serializedTrips);
    } catch (error) {
      const isQuotaError = error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error?.code === 22 || error?.code === 1014;
      return { ok: false, reason: isQuotaError ? 'storageFull' : 'storageWriteFailed' };
    }

    return { ok: true, trips: returnedTrips };
  }

  function guestDeleteSession(expected) {
    if (!expected || typeof expected !== 'object' ||
        !Number.isSafeInteger(expected.accountGeneration) || expected.accountGeneration < 0 ||
        !Number.isSafeInteger(expected.authGeneration) || expected.authGeneration < 0) {
      return { ok: false, reason: 'invalidGeneration' };
    }
    try {
      const appState = window.PACKMATE_APP_DATA?.getState?.();
      const account = window.PACKMATE_ACCOUNT_STATE?.getState?.();
      const auth = window.PACKMATE_AUTH?.getState?.();
      const loggedOut = value => value === null || value === undefined || value === '';
      if (appState?.mode !== 'guest-preview' || appState.status !== 'unauthenticated' ||
          !loggedOut(appState.userId) || appState.generation !== expected.accountGeneration ||
          account?.status !== 'ready' || !loggedOut(account.userId) ||
          account.generation !== expected.accountGeneration ||
          auth?.status !== 'ready' || !loggedOut(auth.user?.id) ||
          auth.generation !== expected.authGeneration) {
        return { ok: false, reason: 'accountChanged' };
      }
      return { ok: true };
    } catch (_) {
      return { ok: false, reason: 'accountUnavailable' };
    }
  }

  function deleteGuestTrip(tripId, expectedSession) {
    if (!localStore) return { ok: false, reason: 'storageUnavailable' };
    const initialSession = guestDeleteSession(expectedSession);
    if (!initialSession.ok) return initialSession;
    if (typeof tripId !== 'string' || !tripId.trim()) return { ok: false, reason: 'invalidTripId' };

    let raw;
    try { raw = nativeGet.call(localStore, 'packmate.trips.v1'); }
    catch (_) { return { ok: false, reason: 'storageUnavailable' }; }
    if (raw === null) return { ok: false, reason: 'tripNotFound' };

    let existingTrips;
    try { existingTrips = JSON.parse(raw); }
    catch (_) { return { ok: false, reason: 'invalidJson' }; }
    if (!Array.isArray(existingTrips) || !validRecord('packmate.trips.v1', raw)) {
      return { ok: false, reason: 'invalidFormat' };
    }
    const ids = new Set();
    for (const trip of existingTrips) {
      if (ids.has(trip.id)) return { ok: false, reason: 'duplicateTripId' };
      ids.add(trip.id);
    }
    if (!ids.has(tripId)) return { ok: false, reason: 'tripNotFound' };

    const remainingTrips = existingTrips.filter(trip => trip.id !== tripId);
    if (remainingTrips.length !== existingTrips.length - 1) return { ok: false, reason: 'duplicateTripId' };
    let serializedTrips;
    let returnedTrips;
    try {
      serializedTrips = JSON.stringify(remainingTrips);
      returnedTrips = JSON.parse(serializedTrips);
    } catch (_) {
      return { ok: false, reason: 'copyFailed' };
    }
    if (!validRecord('packmate.trips.v1', serializedTrips)) return { ok: false, reason: 'copyFailed' };

    const currentSession = guestDeleteSession(expectedSession);
    if (!currentSession.ok) return currentSession;
    let latestRaw;
    try { latestRaw = nativeGet.call(localStore, 'packmate.trips.v1'); }
    catch (_) { return { ok: false, reason: 'storageUnavailable' }; }
    if (latestRaw !== raw) return { ok: false, reason: 'storageChanged' };

    try { rawSet.call(localStore, 'packmate.trips.v1', serializedTrips); }
    catch (error) {
      const isQuotaError = error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error?.code === 22 || error?.code === 1014;
      return { ok: false, reason: isQuotaError ? 'storageFull' : 'storageWriteFailed' };
    }
    return { ok: true, trips: returnedTrips, removedId: tripId, beforeCount: existingTrips.length };
  }

  function updateGuestItemDone(tripId, itemKind, itemId, done, expectedDone, expectedSession) {
    if (!localStore) return { ok: false, reason: 'storageUnavailable' };
    const initialSession = guestDeleteSession(expectedSession);
    if (!initialSession.ok) return initialSession;
    const listKey = itemKind === 'task' ? 'tasks' : itemKind === 'packing' ? 'packing' : null;
    if (!listKey || typeof tripId !== 'string' || !tripId.trim() || typeof itemId !== 'string' || !itemId.trim() ||
        typeof done !== 'boolean' || typeof expectedDone !== 'boolean') return { ok: false, reason: 'invalidInput' };

    let raw, existingTrips;
    try { raw = nativeGet.call(localStore, 'packmate.trips.v1'); existingTrips = JSON.parse(raw); }
    catch (_) { return { ok: false, reason: 'storageUnavailable' }; }
    if (raw === null || !Array.isArray(existingTrips) || !validRecord('packmate.trips.v1', raw)) {
      return { ok: false, reason: 'invalidFormat' };
    }
    const matchingTrips = existingTrips.filter(trip => trip?.id === tripId);
    if (matchingTrips.length !== 1 || !Array.isArray(matchingTrips[0][listKey])) return { ok: false, reason: 'tripNotFound' };
    const matchingItems = matchingTrips[0][listKey].filter(item => item?.id === itemId);
    if (matchingItems.length !== 1 || Boolean(matchingItems[0].done) !== expectedDone) {
      return { ok: false, reason: 'storageChanged' };
    }
    matchingItems[0].done = done;

    let serializedTrips, returnedTrips;
    try { serializedTrips = JSON.stringify(existingTrips); returnedTrips = JSON.parse(serializedTrips); }
    catch (_) { return { ok: false, reason: 'copyFailed' }; }
    if (!validRecord('packmate.trips.v1', serializedTrips) || !guestDeleteSession(expectedSession).ok) {
      return { ok: false, reason: 'accountChanged' };
    }
    let latestRaw;
    try { latestRaw = nativeGet.call(localStore, 'packmate.trips.v1'); }
    catch (_) { return { ok: false, reason: 'storageUnavailable' }; }
    if (latestRaw !== raw) return { ok: false, reason: 'storageChanged' };
    try { rawSet.call(localStore, 'packmate.trips.v1', serializedTrips); }
    catch (_) { return { ok: false, reason: 'storageWriteFailed' }; }
    return { ok: true, trips: returnedTrips, tripId, itemKind, itemId, done };
  }

  window.PACKMATE_NATIVE_STORAGE = {
    getItem: nativeGet,
    setItem: safeSet,
    appendGuestTrip,
    deleteGuestTrip,
    updateGuestItemDone
  };
})();
