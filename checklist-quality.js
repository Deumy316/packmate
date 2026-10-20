/* PACKMATE presentation-only checklist and navigation improvements. No storage writes. */
(() => {
  'use strict';
  if (window.__packmateChecklistUxStarted) return;
  window.__packmateChecklistUxStarted = true;

  const style = document.createElement('style');
  style.id = 'packmate-checklist-ux-style';
  style.textContent = `
    .checklist-view .title-with-actions,.checklist-view .packmate-detail-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .checklist-view .title-with-actions>div:first-child,.checklist-view .packmate-detail-header>div:first-child{min-width:0;flex:1 1 260px}
    .checklist-header-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
    .checklist-header-actions button{min-height:40px}
    .checklist-view #tripMeta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:100%;overflow-wrap:anywhere}
    .packmate-category-card{min-width:0;padding:14px;border:1px solid #E7E7ED;border-radius:18px;background:#fff;box-shadow:0 5px 18px rgba(45,49,55,.045)}
    .packmate-category-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;padding-bottom:8px;border-bottom:1px solid #F0EFF3}
    .packmate-category-heading h3{margin:0;min-width:0;color:#2D3137;font-size:.92rem;line-height:1.4}
    .packmate-category-items{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;min-width:0}
    .packmate-category-toggle,.packmate-filter-button{font:inherit;cursor:pointer}
    .packmate-category-toggle{min-height:36px;padding:5px 10px;border:1px solid #99C4D5;border-radius:11px;background:#F4FAFC;color:#696BAC;font-size:.78rem}
    .packmate-filter-button{min-height:38px;padding:6px 12px;border:1px solid #E7E7ED;border-radius:999px;background:#fff;color:#2D3137;font-size:.78rem}
    .packmate-filter-button[aria-pressed=true]{border-color:#99C4D5;background:#EAF5F8;font-weight:700}
    .packmate-checklist-tools{display:grid;gap:10px;margin:0 0 14px;padding:12px;border:1px solid #E7E7ED;border-radius:15px;background:#fff}
    .packmate-filter-line,.packmate-category-line,.packmate-filter-group,.packmate-category-toggles{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
    .packmate-filter-line,.packmate-category-line{justify-content:space-between}
    .packmate-tools-label{color:#696BAC;font-size:.76rem;font-weight:700}
    .packmate-checklist-summary{display:flex;align-items:center;gap:8px;color:#2D3137;font-size:.76rem;white-space:nowrap}
    .packmate-mini-track{display:block;width:72px;height:6px;overflow:hidden;border-radius:99px;background:#EDF1F3}
    .packmate-mini-fill{display:block;height:100%;border-radius:inherit;background:#99C4D5;transition:width .2s ease}
    .packmate-category-items[hidden],.packmate-category-card[hidden],.check-row[hidden]{display:none!important}
    #taskItems{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-content:start}
    .missed-history-list button,.missed-history-list .icon-button,.missed-history-list [aria-label*=삭제],.missed-history-list [aria-label*=수정]{min-width:38px;min-height:38px}
    .packmate-scroll-controls{position:fixed;z-index:1000;right:max(18px,env(safe-area-inset-right));bottom:calc(76px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:10px}
    .packmate-back-to-top{position:static;display:grid;place-items:center;width:48px;height:48px;padding:0;border:1px solid rgba(45,49,55,.08);border-radius:50%;background:#99C4D5;color:#2D3137;box-shadow:0 5px 16px rgba(45,49,55,.16);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
    .packmate-back-to-top[hidden]{display:none}
    .packmate-back-to-top:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(45,49,55,.2)}
    .packmate-back-to-top:focus-visible,.packmate-filter-button:focus-visible,.packmate-category-toggle:focus-visible{outline:3px solid #696BAC;outline-offset:3px}
    .packmate-back-to-top svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    @media(max-width:700px){.packmate-category-card{padding:12px}.packmate-filter-line{align-items:flex-start}.packmate-checklist-summary{width:100%}.checklist-view .title-with-actions,.checklist-view .packmate-detail-header{gap:10px}.checklist-header-actions{flex:0 0 100%;width:100%;justify-content:flex-start}.packmate-filter-button{min-height:40px}.packmate-scroll-controls{right:max(14px,env(safe-area-inset-right));bottom:calc(76px + env(safe-area-inset-bottom));gap:9px}.packmate-scroll-controls .packmate-back-to-top{width:44px;height:44px}}
    @media(max-width:380px){.packmate-filter-button{padding-inline:9px}.packmate-checklist-summary{gap:6px;font-size:.7rem}.packmate-mini-track{width:52px}.packmate-scroll-controls{right:max(12px,env(safe-area-inset-right));bottom:calc(76px + env(safe-area-inset-bottom));gap:8px}}
    @media(prefers-reduced-motion:reduce){.packmate-mini-fill,.packmate-back-to-top{transition:none}}
  `;
  if (!document.getElementById(style.id)) document.head.append(style);

  const packing = document.getElementById('packingItems');
  const categoryNames = { basic: '기본 준비물', apparel: '의류·세면', activity: '활동별 준비물', personal: '개인 추가 준비물' };
  const categoryOrder = Object.keys(categoryNames);
  const collapsed = new Set();
  const categoryButtons = new Map();
  let filter = 'all';
  let tools = null;
  let busy = false;
  let refreshQueued = false;
  let packingObserver = null;

  function rowCategory(row) {
    const metadata = `${row.dataset.category || ''} ${row.dataset.type || ''} ${row.dataset.source || ''} ${row.dataset.custom || ''} ${row.className || ''}`.toLowerCase();
    const description = row.querySelector('.check-item-copy')?.textContent || row.textContent || '';
    const signals = `${metadata} ${description}`.toLowerCase();
    if (/activity|활동/.test(signals)) return 'activity';
    if (/personal|custom|essential|missed|direct|개인 필수품|직접 추가|지난 누락|누락 기록이 있어요/.test(signals)) return 'personal';
    if (/속옷|양말|잠옷|세면|칫솔|치약|샴푸|외투|여벌 옷/.test(signals)) return 'apparel';
    return 'basic';
  }
  function toggleCategory(key) {
    if (!categoryNames[key]) return;
    collapsed.has(key) ? collapsed.delete(key) : collapsed.add(key);
    refresh();
  }
  function ensureTools() {
    if (!packing || (tools && tools.isConnected)) return;
    tools = document.createElement('div');
    tools.className = 'packmate-checklist-tools';
    tools.innerHTML = '<div class="packmate-filter-line"><div class="packmate-filter-group" role="group" aria-label="준비물 상태 필터"><span class="packmate-tools-label">보기</span><button type="button" class="packmate-filter-button" data-filter="all" aria-pressed="true">전체</button><button type="button" class="packmate-filter-button" data-filter="pending" aria-pressed="false">미완료</button><button type="button" class="packmate-filter-button" data-filter="done" aria-pressed="false">완료</button></div><div class="packmate-checklist-summary" aria-live="polite"><span class="packmate-count-text"></span><span class="packmate-mini-track"><span class="packmate-mini-fill"></span></span><span class="packmate-percent-text"></span></div></div><div class="packmate-category-line"><span class="packmate-tools-label">카테고리</span><div class="packmate-category-toggles"></div></div>';
    packing.before(tools);
    tools.addEventListener('click', event => {
      const filterButton = event.target.closest('[data-filter]');
      if (filterButton) {
        filter = filterButton.dataset.filter;
        tools.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === filterButton)));
        scheduleRefresh();
      }
      const toggle = event.target.closest('[data-category-toggle]');
      if (toggle) toggleCategory(toggle.dataset.categoryToggle);
    });
  }
  function makeCard(key) {
    const card = document.createElement('section');
    card.className = 'packmate-category-card'; card.dataset.categoryCard = key;
    const heading = document.createElement('div'); heading.className = 'packmate-category-heading';
    const title = document.createElement('h3'); title.textContent = categoryNames[key];
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'packmate-category-toggle'; toggle.dataset.categoryToggle = key;
    heading.append(title, toggle);
    const content = document.createElement('div'); content.className = 'packmate-category-items';
    card.append(heading, content);
    return card;
  }
  function groupDirectRows() {
    const directRows = [...packing.children].filter(node => node.classList?.contains('check-row'));
    if (!directRows.length) return;
    if (packingObserver) packingObserver.disconnect();
    try {
      const map = new Map();
      directRows.forEach(row => {
        const key = rowCategory(row);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
      });
      categoryOrder.forEach(key => {
        const entries = map.get(key);
        if (!entries?.length) return;
        let card = packing.querySelector(`:scope > [data-category-card="${key}"]`);
        if (!card) { card = makeCard(key); packing.append(card); }
        const content = card.querySelector('.packmate-category-items');
        entries.forEach(row => { row.dataset.packmateCategory = key; content.append(row); });
      });
    } finally {
      if (packingObserver) packingObserver.observe(packing, { childList: true, subtree: true });
    }
  }
  function refresh() {
    if (!packing || busy) return;
    busy = true;
    ensureTools();
    groupDirectRows();
    const rows = [...packing.querySelectorAll('.check-row')];
    const matchingCounts = new Map(categoryOrder.map(key => [key, 0]));
    let done = 0;
    rows.forEach(row => {
      const key = row.dataset.packmateCategory || rowCategory(row);
      const checked = !!row.querySelector('input[type="checkbox"]')?.checked;
      const matchesFilter = filter === 'all' || (filter === 'done' ? checked : !checked);
      if (checked) done++;
      if (matchesFilter) matchingCounts.set(key, (matchingCounts.get(key) || 0) + 1);
      row.hidden = !matchesFilter;
      row.dataset.packmateCategory = key;
    });
    packing.querySelectorAll('[data-category-card]').forEach(card => {
      const key = card.dataset.categoryCard;
      card.hidden = !(matchingCounts.get(key) > 0);
      const toggle = card.querySelector('[data-category-toggle]');
      const content = card.querySelector('.packmate-category-items');
      if (content) content.hidden = collapsed.has(key);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!collapsed.has(key)));
        toggle.textContent = collapsed.has(key) ? '펼치기 +' : '접기 −';
        toggle.setAttribute('aria-label', `${categoryNames[key]} ${collapsed.has(key) ? '펼치기' : '접기'}`);
      }
    });
    if (tools) {
      tools.querySelector('.packmate-count-text').textContent = `${done}/${rows.length}개 완료`;
      const percent = rows.length ? Math.round(done * 100 / rows.length) : 0;
      tools.querySelector('.packmate-percent-text').textContent = `${percent}%`;
      tools.querySelector('.packmate-mini-fill').style.width = `${percent}%`;
      const host = tools.querySelector('.packmate-category-toggles');
      categoryOrder.forEach(key => {
        let button = categoryButtons.get(key);
        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'packmate-category-toggle';
          button.dataset.categoryToggle = key;
          host.append(button);
          categoryButtons.set(key, button);
        }
        button.hidden = !(matchingCounts.get(key) > 0);
        button.textContent = `${categoryNames[key]} ${collapsed.has(key) ? '+' : '−'}`;
        button.setAttribute('aria-expanded', String(!collapsed.has(key)));
      });
    }
    busy = false;
  }
  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; refresh(); });
  }
  if (packing) {
    packing.addEventListener('change', scheduleRefresh);
    packing.addEventListener('click', event => {
      const toggle = event.target.closest('.packmate-category-card [data-category-toggle]');
      if (!toggle || !packing.contains(toggle)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleCategory(toggle.dataset.categoryToggle);
    }, true);
    packingObserver = new MutationObserver(scheduleRefresh);
    packingObserver.observe(packing, { childList: true, subtree: true });
    refresh();
  }

  const view = document.getElementById('checklistView');
  if (view) {
    const title = view.querySelector('.title-with-actions') || view.querySelector('h1')?.parentElement;
    if (title) {
      title.classList.add('packmate-detail-header');
      const candidates = [...title.querySelectorAll('button,a')].filter(node => /수정|삭제/.test(node.textContent || node.getAttribute('aria-label') || ''));
      if (candidates.length) {
        let actions = title.querySelector('.checklist-header-actions');
        if (!actions) { actions = document.createElement('div'); actions.className = 'checklist-header-actions'; title.append(actions); }
        candidates.forEach(button => actions.append(button));
      }
    }
  }

  function tripForCurrentDetail() {
    const route = history.state?.packmateRoute;
    if (route?.view !== 'checklist' || !route.tripId) return null;
    try {
      const stored = JSON.parse(localStorage.getItem('packmate.trips.v1') || '[]');
      return Array.isArray(stored) ? stored.find(trip => trip?.id === route.tripId) || null : null;
    } catch (_) { return null; }
  }
  function addMetaChip(host, label, value, tone = '') {
    if (value === undefined || value === null || String(value).trim() === '') return false;
    const chip = document.createElement('span');
    chip.className = `trip-meta-chip${tone ? ` ${tone}` : ''}`;
    const caption = document.createElement('span');
    caption.className = 'trip-meta-label';
    caption.textContent = label;
    const text = document.createElement('span');
    text.className = 'trip-meta-value';
    text.textContent = String(value);
    chip.append(caption, text);
    host.append(chip);
    return true;
  }
  function enhanceTripHeader() {
    const checklist = document.getElementById('checklistView');
    const meta = document.getElementById('tripMeta');
    if (!checklist || checklist.hidden || !meta) return;
    const trip = tripForCurrentDetail();
    if (!trip) return;

    const purposeNames = { travel: '여행·휴가', business: '출장·업무', education: '교육·행사', personal: '방문·개인 일정' };
    const purpose = trip.purposeCategory;
    const type = trip.type === 'international' ? '해외' : trip.type === 'domestic' ? '국내' : trip.type;
    const destination = [trip.destinationCountry || trip.destination, trip.destinationCity]
      .filter(value => typeof value === 'string' && value.trim())
      .join(' · ');
    const fragment = document.createDocumentFragment();
    addMetaChip(fragment, '이동 목적', purposeNames[purpose] || purpose, 'trip-meta-purpose');
    addMetaChip(fragment, '구분', type, trip.type === 'international' ? 'trip-meta-international' : 'trip-meta-domestic');
    addMetaChip(fragment, trip.type === 'international' ? '국가·도시' : '지역', destination, 'trip-meta-location');
    addMetaChip(fragment, '세부 목적', trip.subPurpose || trip.purpose, 'trip-meta-subpurpose');

    if (trip.duration !== undefined && trip.duration !== null && trip.duration !== '') {
      const duration = Number(trip.duration);
      if (Number.isFinite(duration) && duration >= 0) {
        addMetaChip(fragment, '일정 기간', duration === 0 ? '당일' : `${duration}박 ${duration + 1}일`, 'trip-meta-duration');
      }
    }
    const formatDate = value => {
      if (typeof value !== 'string' || !value.trim()) return '';
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
    };
    addMetaChip(fragment, '시작일', formatDate(trip.startDate), 'trip-meta-date');
    addMetaChip(fragment, '종료일', formatDate(trip.endDate), 'trip-meta-date');
    addMetaChip(fragment, '이동수단', trip.transport, 'trip-meta-transport');
    if (Array.isArray(trip.activities)) {
      trip.activities.forEach(activity => {
        if (typeof activity === 'string' && activity.trim()) addMetaChip(fragment, '활동', activity, 'trip-meta-activity');
      });
    }
    meta.replaceChildren(fragment);
    meta.hidden = meta.childElementCount === 0;

    const kicker = document.getElementById('checklistKicker');
    if (kicker) kicker.textContent = 'MY PLAN';
    const editButton = document.getElementById('editTripButton');
    if (editButton && !editButton.querySelector('svg')) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'm14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z');
      icon.append(path);
      editButton.prepend(icon);
    }
  }
  enhanceTripHeader();
  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-trip]')) enhanceTripHeader();
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'tripForm') enhanceTripHeader();
  });
  window.addEventListener('popstate', enhanceTripHeader);

  if (!window.__packmateBackToTopBound) {
    window.__packmateBackToTopBound = true;
    let controls = document.getElementById('packmateScrollControls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'packmateScrollControls';
      controls.className = 'packmate-scroll-controls';
      document.body.append(controls);
    }

    let topButton = document.getElementById('packmateBackToTop');
    if (!topButton) {
      topButton = document.createElement('button');
      topButton.id = 'packmateBackToTop';
      topButton.type = 'button';
      topButton.className = 'packmate-back-to-top';
      topButton.hidden = true;
      topButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 14 6-6 6 6"/></svg>';
    }
    topButton.setAttribute('aria-label', '맨 위로 이동');
    topButton.title = '맨 위로 이동';

    let bottomButton = document.getElementById('packmateBackToBottom');
    if (!bottomButton) {
      bottomButton = document.createElement('button');
      bottomButton.id = 'packmateBackToBottom';
      bottomButton.type = 'button';
      bottomButton.className = 'packmate-back-to-top';
      bottomButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 10 6 6 6-6"/></svg>';
    }
    bottomButton.hidden = true;
    bottomButton.setAttribute('aria-label', '맨 아래로 이동');
    bottomButton.title = '맨 아래로 이동';
    controls.append(topButton, bottomButton);

    const scrollingElement = document.scrollingElement || document.documentElement;
    function maxScrollY() {
      return Math.max(0, scrollingElement.scrollHeight - scrollingElement.clientHeight);
    }
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const maxY = maxScrollY();
        const scrollTop = scrollingElement.scrollTop;
        if (maxY <= 1) {
          topButton.hidden = true;
          bottomButton.hidden = true;
          return;
        }
        topButton.hidden = scrollTop <= 1;
        bottomButton.hidden = scrollTop >= maxY - 1;
      });
    };
    const scrollToPosition = position => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: position, behavior: reducedMotion ? 'auto' : 'smooth' });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('pageshow', onScroll);
    document.addEventListener('click', onScroll);
    document.addEventListener('change', onScroll);
    topButton.addEventListener('click', () => scrollToPosition(0));
    bottomButton.addEventListener('click', () => scrollToPosition(maxScrollY()));
    onScroll();
  }
})();
