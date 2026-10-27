window.PACKMATE_MISSED_ATTENTION = (() => {
  'use strict';

  const normalize = value => String(value ?? '').trim().toLocaleLowerCase();
  const makeKey = parts => JSON.stringify(parts);
  const canonicalKey = value => {
    if (typeof value !== 'string' || !value) return null;
    const legacy = value.split('\u0000');
    if (legacy.length === 3 && legacy[1] === 'id') return makeKey([legacy[0], 'id', legacy[2]]);
    if (legacy.length === 4 && legacy[1] === 'at') return makeKey([legacy[0], 'at', Number(legacy[2]), legacy[3]]);
    return value;
  };
  const eventKey = (trip, item) => {
    if (!trip?.id || !item) return null;
    if (typeof item.id === 'string' && item.id) return makeKey([String(trip.id), 'id', item.id]);
    return Number.isFinite(Number(item.createdAt))
      ? makeKey([String(trip.id), 'at', Number(item.createdAt), normalize(item.name)])
      : null;
  };
  function dismissedKeys(name, trips) {
    const wanted = normalize(name), keys = new Set();
    (Array.isArray(trips) ? trips : []).forEach(trip => (Array.isArray(trip?.missedAttentionDismissals) ? trip.missedAttentionDismissals : []).forEach(record => {
      if (normalize(record?.name) !== wanted || !Array.isArray(record.eventKeys)) return;
      record.eventKeys.forEach(value => { const key = canonicalKey(value); if (key) keys.add(key) });
    }));
    return keys;
  }
  function activeEventKeys(name, trips) {
    const wanted = normalize(name), dismissed = dismissedKeys(name, trips), keys = [];
    (Array.isArray(trips) ? trips : []).forEach(trip => (Array.isArray(trip?.missedItems) ? trip.missedItems : []).forEach(item => {
      if (normalize(item?.name) !== wanted) return;
      const key = eventKey(trip, item);
      if (key && !dismissed.has(key) && !keys.includes(key)) keys.push(key);
    }));
    return keys;
  }
  function createDismissal(name, trips, id) {
    const eventKeys = activeEventKeys(name, trips);
    if (!eventKeys.length || typeof id !== 'string' || !id) return null;
    return { id, name: String(name ?? '').trim(), eventKeys, createdAt: Date.now() };
  }
  function carryForward(trips) {
    const records = new Map();
    (Array.isArray(trips) ? trips : []).forEach(trip => (Array.isArray(trip?.missedAttentionDismissals) ? trip.missedAttentionDismissals : []).forEach(record => {
      if (typeof record?.id === 'string' && record.id && typeof record.name === 'string' && Array.isArray(record.eventKeys)) records.set(record.id, { ...record, eventKeys: record.eventKeys.map(canonicalKey).filter(Boolean) });
    }));
    return [...records.values()];
  }
  return Object.freeze({ isActive: (name, trips) => activeEventKeys(name, trips).length > 0, activeEventKeys, createDismissal, carryForward });
})();
