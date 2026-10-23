/* In-memory mutations for the unsaved checklist preview only. */
(() => {
  'use strict';

  const data = window.PACKMATE_APP_DATA;
  if (!data?.updatePreview) return;

  const same = (a, b) => String(a) === String(b);
  const id = () => `preview-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const update = change => data.updatePreview(change) === true;
  const item = (trip, kind, itemId) => (kind === 'task' ? trip.tasks : trip.packing)
    .find(value => same(value.id, itemId));

  function changeItem(kind, itemId, done) {
    return update(trip => {
      const target = item(trip, kind, itemId);
      if (!target) return false;
      target.done = !!done;
    });
  }

  function changeQuantity(itemId, value) {
    return update(trip => {
      const target = item(trip, 'packing', itemId);
      if (!target) return false;
      target.quantity = Math.max(1, Math.floor(Number(value) || 1));
      target.quantityEdited = true;
    });
  }

  function addItem(name) {
    return update(trip => {
      trip.packing.push({ id: id(), name, detail: '이번 일정에서 직접 추가한 준비물', done: false, custom: true, source: 'direct', quantity: 1, unit: '개', quantityEdited: false });
    });
  }

  function renameItem(itemId, name) {
    return update(trip => {
      const target = item(trip, 'packing', itemId);
      if (!target) return false;
      target.name = name;
    });
  }

  function removeItem(itemId) {
    return update(trip => {
      const before = trip.packing.length;
      trip.packing = trip.packing.filter(value => !same(value.id, itemId));
      return trip.packing.length !== before;
    });
  }

  function markMissed(itemId) {
    return update(trip => {
      const target = item(trip, 'packing', itemId);
      if (!target) return false;
      trip.missedItems ||= [];
      if (!trip.missedItems.some(value => String(value.name || '').trim().toLocaleLowerCase() === String(target.name || '').trim().toLocaleLowerCase())) {
        trip.missedItems.push({ id: id(), name: target.name, createdAt: Date.now() });
      }
      target.done = false;
    });
  }

  function removeMissed(itemId) {
    return update(trip => {
      const before = trip.missedItems?.length || 0;
      trip.missedItems = (trip.missedItems || []).filter(value => !same(value.id, itemId));
      return trip.missedItems.length !== before;
    });
  }

  window.PACKMATE_PREVIEW_SESSION = Object.freeze({
    isActive: () => data.getState?.().preview === true,
    changeItem,
    changeQuantity,
    addItem,
    renameItem,
    removeItem,
    markMissed,
    removeMissed
  });
})();
