/* Guard the existing quantity renderer against redundant category-wrapped checklist renders. */
(() => {
  'use strict';
  const NativeObserver = window.MutationObserver;
  if (!NativeObserver || NativeObserver.__packmateQuantityGuard) return;

  function quantityViewIsReady(list) {
    if (list?.id !== 'packingItems') return false;
    const routeId = history.state?.packmateRoute?.tripId;
    if (!routeId) return false;
    try {
      const trip = window.PACKMATE_APP_DATA?.getTrip?.(routeId) || null;
      if (!trip || !Array.isArray(trip.packing)) return false;

      // Category grouping nests rows; checking only direct children falsely marked
      // every rendered view stale and repeatedly invoked the quantity renderer.
      const rows = [...list.querySelectorAll('.check-row')];
      if (rows.length !== trip.packing.length) return false;
      if (!rows.length) return !!list.querySelector(':scope > .empty-items');
      const rendered = new Map(rows.map(row => {
        const checkbox = row.querySelector('[data-item-kind="packing"][data-item-id]');
        return [checkbox?.dataset.itemId, row];
      }));
      if (rendered.size !== trip.packing.length) return false;
      return trip.packing.every(item => {
        const row = rendered.get(String(item.id));
        if (!row || !row.querySelector('.quantity-editor')) return false;
        const checkbox = row.querySelector('[data-item-kind="packing"][data-item-id]');
        const name = row.querySelector('.check-item-copy strong');
        const quantity = row.querySelector('[data-quantity-input]');
        return !!checkbox && !!name && !!quantity
          && checkbox.checked === !!item.done
          && name.textContent === String(item.name || '')
          && Number(quantity.value) === Math.max(1, Math.floor(Number(item.quantity) || 1));
      });
    } catch (_) {
      return false;
    }
  }

  class GuardedMutationObserver extends NativeObserver {
    constructor(callback) {
      let observedList = null;
      super((records, observer) => {
        if (observedList && quantityViewIsReady(observedList)) return;
        callback(records, observer);
      });
      this.__packmateObservedList = value => { observedList = value; };
    }

    observe(target, options) {
      if (target?.id === 'packingItems' && options?.childList && !options?.subtree) {
        this.__packmateObservedList(target);
      }
      return super.observe(target, options);
    }
  }

  Object.defineProperty(GuardedMutationObserver, '__packmateQuantityGuard', { value: true });
  window.MutationObserver = GuardedMutationObserver;
})();
