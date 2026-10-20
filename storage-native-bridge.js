/* Capture native Storage methods and protect PACKMATE records from invalid-data overwrites. */
(() => {
  'use strict';

  const nativeGet = Storage.prototype.getItem;
  const rawSet = Storage.prototype.setItem;
  const protectedKeys = new Map([
    ['packmate.trips.v1', '일정'],
    ['packmate.essentials.v1', '개인 필수품']
  ]);
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

  window.PACKMATE_NATIVE_STORAGE = {
    getItem: nativeGet,
    setItem: safeSet
  };
})();
