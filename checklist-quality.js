/* Presentation-only checklist grouping and safe Enter-key handling; app.js owns data and persistence. */
(() => {
  'use strict';
  // Protect against accidental duplicate script inclusion and duplicate observers.
  if (window.__packmateChecklistGroupingStarted) return;
  window.__packmateChecklistGroupingStarted = true;

  const TRIPS_KEY = 'packmate.trips.v1';
  const destination = document.querySelector('#destination');
  const box = document.querySelector('#packingItems');
  // Enter in a destination search/free-text field must not submit tripForm.
  destination?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) event.preventDefault();
  });
  if (!box) return;
  let grouping = false;

  function activeTrip() {
    const tripId = history.state?.packmateRoute?.tripId;
    if (!tripId) return null;
    try {
      const trips = JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
      return Array.isArray(trips) ? trips.find(trip => trip?.id === tripId) || null : null;
    } catch (error) {
      console.warn('준비물 분류 표시를 위한 일정 조회에 실패했습니다.', error);
      return null;
    }
  }

  function category(item) {
    const name = String(item?.name || '').trim().toLocaleLowerCase();
    if (item?.category === 'common' || item?.source === 'common' || ['휴대전화','휴대전화 충전기','보조 배터리','지갑·결제수단','개인 상비약'].includes(name)) return '공통 준비물';
    if (item?.category === 'lodging' || item?.source === 'lodging' || ['속옷','양말','잠옷','여벌 상의','여벌 하의','칫솔','치약','샴푸','클렌징 제품'].includes(name)) return '숙박 준비물';
    if (item?.category === 'activity' || item?.source === 'activity') return '활동별 준비물';
    if (item?.category === 'personal' || ['direct','essential','missed'].includes(item?.source) || item?.custom) return '개인·누락·직접 추가';
    return '일정 맞춤 준비물';
  }

  function groupChecklist() {
    if (grouping) return;
    const trip = activeTrip();
    if (!trip) return;
    const rows = [...box.querySelectorAll(':scope > .check-row')];
    if (!rows.length) return;
    const items = new Map((Array.isArray(trip.packing) ? trip.packing : []).map(item => [item.id, item]));
    const groups = new Map();

    rows.forEach(row => {
      const input = row.querySelector('[data-item-id]');
      const item = input ? items.get(input.dataset.itemId) : null;
      const title = category(item);
      if (!groups.has(title)) groups.set(title, []);
      if (item && (item.source === 'direct' || (item.custom && item.source !== 'essential'))) {
        const copy = row.querySelector('.check-item-copy');
        if (copy && !copy.querySelector('.direct-item-label')) {
          const tag = document.createElement('small');
          tag.className = 'direct-item-label';
          tag.textContent = '직접 추가';
          copy.append(tag);
        }
      }
      groups.get(title).push(row);
    });

    const fragment = document.createDocumentFragment();
    groups.forEach((members, title) => {
      const section = document.createElement('section');
      section.className = 'checklist-category';
      const heading = document.createElement('h3');
      heading.className = 'checklist-category-title';
      heading.textContent = title;
      section.append(heading, ...members);
      fragment.append(section);
    });
    grouping = true;
    try {
      box.replaceChildren(fragment);
    } finally {
      grouping = false;
    }
  }

  const observer = new MutationObserver(() => {
    if (!grouping) groupChecklist();
  });
  observer.observe(box, { childList: true });
  groupChecklist();
})();
