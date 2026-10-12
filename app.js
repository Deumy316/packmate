(() => {
  'use strict';

  const STORAGE_KEY = 'packmate.trips.v1';
  const ESSENTIALS_KEY = 'packmate.essentials.v1';
  const DRAFT_KEY = 'packmate.draft.v1';
  const domesticPlaces = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '제주도', '강릉', '속초', '춘천', '원주', '동해', '삼척', '평창', '정선', '양양', '청주', '충주', '제천', '천안', '공주', '보령', '아산', '서산', '당진', '전주', '군산', '익산', '남원', '목포', '여수', '순천', '광양', '나주', '경주', '포항', '안동', '구미', '경산', '김천', '문경', '창원', '김해', '진주', '거제', '통영', '양산', '남해', '수원', '성남', '고양', '용인', '화성', '평택', '안산', '안양', '파주', '의정부', '이천', '가평', '양평', '인제', '태안', '기타'];
  const internationalPlaces = ['일본', '필리핀', '미국'];
  const knownActivities = ['수영', '등산', '캠핑', '야외활동'];
  const purposeOptions = { travel: ['관광', '휴식', '레저'], business: ['회의', '고객사 방문', '현장 작업', '일반 출장'], education: ['교육', '세미나', '컨퍼런스'], personal: ['가족 방문', '경조사', '면접', '기타'] };
  const purposeLabels = { travel: '여행·휴가', business: '출장·업무', education: '교육·행사', personal: '방문·개인 일정' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const el = {
    homeView: $('#homeView'), formView: $('#formView'), checklistView: $('#checklistView'), form: $('#tripForm'),
    typeInput: $('#tripTypeInput'), destination: $('#destination'), destinationOptions: $('#destinationOptions'), destinationLabel: $('#destinationLabel'), transportField: $('#transportField'),
    formError: $('#formError'), savedTrips: $('#savedTrips'), emptyTrips: $('#emptyTrips'), tripCount: $('#tripCount'), title: $('#checklistTitle'), meta: $('#tripMeta'), packingItems: $('#packingItems'), taskItems: $('#taskItems'),
    packingProgressText: $('#packingProgressText'), packingProgressBar: $('#packingProgressBar'), packingProgressCount: $('#packingProgressCount'), taskProgressText: $('#taskProgressText'), taskProgressBar: $('#taskProgressBar'), taskProgressCount: $('#taskProgressCount'),
    packingItemCount: $('#packingItemCount'), taskItemCount: $('#taskItemCount'), officialNote: $('#officialNote'), addItemForm: $('#addItemForm'), newItemInput: $('#newItemInput'), saveAsEssential: $('#saveAsEssential'),
    preflightSummary: $('#preflightSummary'), missedHistory: $('#missedHistory'), subPurpose: $('#subPurpose'), toast: $('#toast'), customActivityList: $('#customActivityList'),
    startDate: $('#startDate'), endDate: $('#endDate'), duration: $('#duration'), lodging: $('#lodging'),
    formTitle: $('#formTitle'), formSubmitButton: $('#formSubmitButton')
  };
  let trips = loadTrips();
  let essentials = loadEssentials();
  let activeTripId = null;
  let editingTripId = null;
  let customActivityNames = [];
  let toastTimer;
  let draftStorageWarningShown = false;

  function loadTrips() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(stored)) return [];
      return stored.filter(trip => trip && typeof trip.id === 'string' && typeof trip.name === 'string').map(trip => {
        const migrated = purposeFromLegacy(String(trip.purpose || '관광'));
        return {
          ...trip,
          type: trip.type === 'international' ? 'international' : 'domestic',
          purposeCategory: trip.purposeCategory || migrated.category,
          purpose: trip.purpose || migrated.sub,
          subPurpose: trip.subPurpose || trip.purpose || migrated.sub,
          lodging: typeof trip.lodging === 'boolean' ? trip.lodging : Number(trip.duration) > 0,
          activities: Array.isArray(trip.activities) ? trip.activities : [],
          packing: Array.isArray(trip.packing) ? trip.packing.map(normalizeItem) : [],
          tasks: Array.isArray(trip.tasks) ? trip.tasks.map(normalizeItem) : [],
          missedItems: Array.isArray(trip.missedItems) ? trip.missedItems.map(normalizeMissed).filter(Boolean) : []
        };
      });
    } catch (error) { console.warn('PACKMATE 저장 데이터를 읽지 못했습니다.', error); return []; }
  }
  function purposeFromLegacy(value) {
    if (['출장', '회의', '고객사 방문', '현장 작업', '일반 출장'].includes(value)) return { category: 'business', sub: value === '출장' ? '일반 출장' : value };
    if (['교육', '세미나', '컨퍼런스'].includes(value)) return { category: 'education', sub: value };
    if (['가족 방문', '경조사', '면접'].includes(value)) return { category: 'personal', sub: value };
    if (value === '휴식' || value === '레저') return { category: 'travel', sub: value };
    return { category: 'travel', sub: '관광' };
  }
  function normalizeItem(item) {
    if (!item || typeof item !== 'object') return { id: makeId(), name: String(item || '준비 항목'), detail: '', done: false };
    return { ...item, id: item.id || makeId(), name: String(item.name || '준비 항목'), detail: item.detail || '', done: Boolean(item.done) };
  }
  function normalizeMissed(item) {
    if (typeof item === 'string' && item.trim()) return { id: makeId(), name: item, createdAt: 0 };
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) return null;
    return { ...item, id: item.id || makeId(), name: item.name };
  }
  function loadEssentials() {
    try { const value = JSON.parse(localStorage.getItem(ESSENTIALS_KEY) || '[]'); return Array.isArray(value) ? value.filter(item => item && typeof item.name === 'string') : []; }
    catch (error) { console.warn('개인 필수품을 읽지 못했습니다.', error); return []; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trips)); return true; }
    catch (error) { console.warn('PACKMATE 저장 데이터를 기록하지 못했습니다.', error); showToast('일정을 저장하지 못했어요. 브라우저 저장 공간과 권한을 확인한 뒤 다시 시도해 주세요.'); return false; }
  }
  function persistEssentials() {
    try { localStorage.setItem(ESSENTIALS_KEY, JSON.stringify(essentials)); return true; }
    catch (error) { console.warn('개인 필수품을 저장하지 못했습니다.', error); showToast('개인 필수품을 저장하지 못했어요.'); return false; }
  }
  function makeId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
  function showToast(message) { el.toast.textContent = message; el.toast.classList.add('is-visible'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => el.toast.classList.remove('is-visible'), 2800); }

  function routeForView(viewName) {
    if (viewName === 'form') return { view: 'form', editTripId: editingTripId || null, type: el.typeInput.value === 'international' ? 'international' : 'domestic', category: purposeOptions[$('#purposeCategory').value] ? $('#purposeCategory').value : 'travel' };
    if (viewName === 'checklist') return { view: 'checklist', tripId: activeTripId };
    return { view: 'home' };
  }
  function routeEquals(left, right) { return Boolean(left && right && left.view === right.view && (left.view !== 'form' || (left.editTripId || null) === (right.editTripId || null)) && (left.view !== 'checklist' || left.tripId === right.tripId)); }
  function writeRoute(route, replace = false) {
    try {
      const prior = history.state && typeof history.state === 'object' && !Array.isArray(history.state) ? history.state : {};
      const state = { ...prior, packmateRoute: route };
      if (replace) history.replaceState(state, '', location.href); else history.pushState(state, '', location.href);
      return true;
    } catch (error) { console.warn('브라우저 화면 기록을 갱신하지 못했습니다.', error); return false; }
  }
  function showView(viewName, options = {}) {
    const route = routeForView(viewName);
    const current = history.state && history.state.packmateRoute;
    if (!options.noPush && !routeEquals(current, route)) writeRoute(route);
    el.homeView.hidden = viewName !== 'home'; el.formView.hidden = viewName !== 'form'; el.checklistView.hidden = viewName !== 'checklist';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderRoute(route, replaceInvalid = true) {
    if (!route || !['home', 'form', 'checklist'].includes(route.view)) route = { view: 'home' };
    updateHome();
    if (route.view === 'form') {
      const trip = route.editTripId ? trips.find(item => item.id === route.editTripId) : null;
      if (route.editTripId && !trip) { showView('home', { noPush: true }); if (replaceInvalid) writeRoute({ view: 'home' }, true); return; }
      openForm(route.type === 'international' ? 'international' : 'domestic', purposeOptions[route.category] ? route.category : 'travel', trip, { noPush: true });
      return;
    }
    if (route.view === 'checklist') {
      if (route.tripId && trips.some(item => item.id === route.tripId)) { openTrip(route.tripId, { noPush: true }); return; }
      showView('home', { noPush: true }); if (replaceInvalid) writeRoute({ view: 'home' }, true); return;
    }
    editingTripId = null; showView('home', { noPush: true });
  }
  function initializeNavigation() {
    window.addEventListener('popstate', event => {
      const route = event.state && event.state.packmateRoute;
      if (!route) { renderRoute({ view: 'home' }); writeRoute({ view: 'home' }, true); return; }
      renderRoute(route);
    });
    const route = history.state && history.state.packmateRoute;
    if (route && ['home', 'form', 'checklist'].includes(route.view)) renderRoute(route);
    else { updateHome(); editingTripId = null; showView('home', { noPush: true }); writeRoute({ view: 'home' }, true); }
  }

  function setTripType(type) {
    const isInternational = type === 'international';
    el.typeInput.value = isInternational ? 'international' : 'domestic';
    $$('[data-trip-type]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tripType === el.typeInput.value)));
    el.destinationLabel.innerHTML = `${isInternational ? '해외 국가' : '국내 지역'} <span class="required-label">필수</span>`;
    el.destination.placeholder = isInternational ? '국가를 검색하거나 직접 입력' : '지역을 검색하거나 직접 입력';
    el.destinationOptions.replaceChildren();
    (isInternational ? internationalPlaces : domesticPlaces).forEach(place => {
      const option = document.createElement('option'); option.value = place; el.destinationOptions.append(option);
    });
    el.transportField.hidden = isInternational;
    if (!isInternational && !$('#transport').value) $('#transport').value = '기타';
  }
  function setPurposeCategory(category, preferredSub) {
    const options = purposeOptions[category] || purposeOptions.travel; const prior = preferredSub || el.subPurpose.value;
    el.subPurpose.replaceChildren(...options.map(option => new Option(option, option)));
    if (options.includes(prior)) el.subPurpose.value = prior;
  }
  function setActivitySelection(values = []) {
    const normalized = [...new Set(values.map(value => String(value).trim()).filter(Boolean))];
    $$('input[name="activities"]').forEach(input => { input.checked = normalized.some(value => value.toLocaleLowerCase() === input.value.toLocaleLowerCase()); });
    customActivityNames = normalized.filter(value => !knownActivities.some(known => known.toLocaleLowerCase() === value.toLocaleLowerCase()));
    renderCustomActivities();
  }
  function readDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      return draft && draft.version === 1 && draft.fields && typeof draft.fields === 'object' ? draft : null;
    } catch (error) { console.warn('작성 중인 일정을 읽지 못했습니다.', error); return null; }
  }
  function saveDraft() {
    if (el.formView.hidden) return false;
    const formData = new FormData(el.form);
    const draft = {
      version: 1,
      editingTripId: editingTripId || null,
      savedAt: Date.now(),
      fields: {
        name: String(formData.get('tripName') || ''),
        category: String(formData.get('purposeCategory') || 'travel'),
        subPurpose: String(formData.get('subPurpose') || ''),
        type: String(formData.get('tripType') || 'domestic'),
        destination: String(formData.get('destination') || ''),
        transport: String(formData.get('transport') || '기타'),
        duration: String(formData.get('duration') || '0'),
        lodging: String(formData.get('lodging') || 'no'),
        startDate: String(formData.get('startDate') || ''),
        activities: [...new Set(formData.getAll('activities').map(value => String(value).trim()).filter(Boolean))]
      }
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); draftStorageWarningShown = false; return true; }
    catch (error) {
      console.warn('작성 중인 일정을 임시 저장하지 못했습니다.', error);
      if (!draftStorageWarningShown) { showToast('작성 내용을 임시 저장하지 못했어요. 브라우저 저장 공간과 권한을 확인해 주세요.'); draftStorageWarningShown = true; }
      return false;
    }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); return true; }
    catch (error) { console.warn('임시 일정을 정리하지 못했습니다.', error); showToast('일정은 저장했지만 임시 초안을 정리하지 못했어요.'); return false; }
  }
  function applyDraft(draft) {
    const fields = draft.fields;
    const category = purposeOptions[fields.category] ? fields.category : 'travel';
    setPurposeCategory(category, fields.subPurpose);
    setTripType(fields.type === 'international' ? 'international' : 'domestic');
    $('#tripName').value = String(fields.name || '');
    el.destination.value = String(fields.destination || '');
    $('#transport').value = String(fields.transport || '기타');
    el.duration.value = String(fields.duration || '0');
    el.lodging.value = fields.lodging === 'yes' && Number(el.duration.value) > 0 ? 'yes' : 'no';
    if (el.lodging.value === 'no') el.duration.value = '0';
    el.startDate.value = String(fields.startDate || '');
    setActivitySelection(Array.isArray(fields.activities) ? fields.activities : []);
  }
  function openForm(type = 'domestic', category = 'travel', trip = null, options = {}) {
    el.form.reset(); el.formError.hidden = true; el.formError.textContent = '';
    editingTripId = trip ? trip.id : null;
    const selectedCategory = trip ? (trip.purposeCategory || purposeFromLegacy(trip.purpose || '관광').category) : (purposeOptions[category] ? category : 'travel');
    $('#purposeCategory').value = selectedCategory;
    setPurposeCategory(selectedCategory, trip ? (trip.subPurpose || trip.purpose) : undefined);
    setTripType(trip ? trip.type : type);
    if (trip) {
      $('#tripName').value = trip.name; el.destination.value = trip.destination || ''; $('#transport').value = trip.transport || '기타';
      el.duration.value = String(trip.lodging === false ? 0 : (trip.duration ?? 0)); el.lodging.value = trip.lodging === false || Number(el.duration.value) === 0 ? 'no' : 'yes';
      el.startDate.value = trip.startDate || ''; setActivitySelection(Array.isArray(trip.activities) ? trip.activities : []);
      $('#formTitle').textContent = '일정 정보를 수정할까요?'; el.formSubmitButton.innerHTML = '변경 내용 저장 <span class="button-arrow" aria-hidden="true">↗</span>';
    } else {
      el.duration.value = '2'; el.lodging.value = 'yes'; el.startDate.value = ''; setActivitySelection([]);
      $('#formTitle').textContent = '어떤 일정을 준비할까요?'; el.formSubmitButton.innerHTML = '준비 목록 만들기 <span class="button-arrow" aria-hidden="true">↗</span>';
    }
    const draft = readDraft();
    if (draft && (draft.editingTripId || null) === (editingTripId || null)) applyDraft(draft);
    updateEndDate(); showView('form', options); saveDraft(); $('#tripName').focus({ preventScroll: true });
  }
  function calculateEndDate(startDate, duration, lodging) {
    if (!startDate) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate); if (!match) return '';
    const [, year, month, day] = match.map(Number); const nights = lodging ? Math.max(0, Number(duration) || 0) : 0;
    const utcDate = new Date(Date.UTC(year, month - 1, day + nights));
    return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')}`;
  }
  function updateEndDate() { el.endDate.value = calculateEndDate(el.startDate.value, el.duration.value, el.lodging.value === 'yes'); }
  function progress(items) { const total = items.length; const done = items.filter(item => item.done).length; return { total, done, percent: total ? Math.round(done / total * 100) : 0 }; }
  function durationLabel(trip) { if (Number(trip.duration) === 0 || trip.lodging === false) return '당일'; return `${trip.duration}박 ${Number(trip.duration) + 1}일`; }
  function categoryLabel(trip) { const legacy = purposeFromLegacy(trip.purpose || '관광'); return purposeLabels[trip.purposeCategory] || purposeLabels[legacy.category] || '여행·휴가'; }
  function updateHome() {
    el.savedTrips.replaceChildren(); el.tripCount.textContent = String(trips.length); el.emptyTrips.hidden = trips.length > 0;
    trips.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).forEach(trip => {
      const packing = progress(trip.packing), tasks = progress(trip.tasks), total = packing.total + tasks.total;
      const percent = total ? Math.round((packing.done + tasks.done) / total * 100) : 0;
      const article = document.createElement('article'); article.className = 'saved-trip-card'; const destination = trip.destination || trip.name;
      article.innerHTML = `<div class="saved-trip-top"><span class="saved-trip-type ${trip.type === 'international' ? 'is-international' : ''}"><span class="saved-trip-symbol" aria-hidden="true">${trip.type === 'international' ? '◎' : '⌂'}</span>${escapeHTML(categoryLabel(trip))} · ${trip.type === 'international' ? '해외' : '국내'}</span><button class="trip-delete-mini" type="button" data-delete-trip="${escapeHTML(trip.id)}" aria-label="${escapeHTML(trip.name)} 삭제" title="일정 삭제"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg></button></div><button class="saved-trip-open" type="button" data-open-trip="${escapeHTML(trip.id)}" aria-label="${escapeHTML(trip.name)} 준비 현황 열기"><strong>${escapeHTML(trip.name)}</strong><span class="saved-trip-destination">${escapeHTML(destination)} · ${escapeHTML(trip.subPurpose || trip.purpose || '관광')} · ${escapeHTML(durationLabel(trip))}</span><span class="saved-trip-footer"><span>${packing.done}/${packing.total} 준비물 · ${tasks.done}/${tasks.total} 할 일</span><span class="saved-trip-progress"><span class="tiny-progress"><span style="width:${percent}%"></span></span>${percent}%</span></span></button>`;
      el.savedTrips.append(article);
    });
  }
  function addPackingItem(name, detail = '', custom = false, source = '') { return { id: makeId(), name, detail, done: false, custom, source }; }
  function addTask(name, detail = '') { return { id: makeId(), name, detail, done: false }; }
  function isInternationalDocument(name) { return /여권|비자|입국|출입국|전자여행허가|\bvisa\b|\bpassport\b|\besta\b/i.test(String(name)); }

  function buildChecklist(data) {
    const packing = [addPackingItem('휴대전화', '충전 상태와 필요한 앱을 확인해요.'), addPackingItem('충전기 및 케이블'), addPackingItem('지갑·결제수단'), addPackingItem('개인 상비약')];
    const tasks = []; const overnight = data.lodging;
    if (overnight) packing.push(addPackingItem('여벌 옷과 속옷'), addPackingItem('세면도구·개인 위생용품'), addPackingItem('잠옷', '숙박 일정에 맞게 준비해요.'));
    if (Number(data.duration) >= 3) packing.push(addPackingItem('여행용 세탁·정리 파우치'));
    if (data.type === 'international') {
      packing.unshift(addPackingItem('여권', '유효기간과 소지 여부를 직접 확인해요.'));
      tasks.push(addTask('해당 국가의 공식 입국 요건 확인', '국적·체류 기간·방문 목적에 따라 달라질 수 있어 공식 안내를 확인해요.'));
      tasks.push(addTask('항공권·숙소 예약 정보 확인'));
      if (data.purposeCategory === 'travel') tasks.push(addTask('여행자 보험 및 비상 연락처 확인'));
      if (data.destination === '일본') tasks.push(addTask('Visit Japan Web 등 최신 입국 안내 확인', '등록 필요 여부와 최신 절차를 공식 사이트에서 확인해요. 법적 의무라고 단정하지 않습니다.'));
      if (data.destination === '미국') tasks.push(addTask('미국 입국 관련 공식 안내 및 필요한 허가 확인'));
      if (data.destination === '필리핀') tasks.push(addTask('필리핀 입국 관련 공식 안내 확인'));
    } else {
      if (overnight) tasks.push(addTask('숙소 예약·체크인 정보 확인'));
      if (data.transport === '자가용') tasks.push(addTask('차량 상태·주유·주차 계획 확인'));
      else if (['기차', '버스', '항공'].includes(data.transport)) tasks.push(addTask(`${data.transport} 승차권·탑승 시간 확인`));
      else tasks.push(addTask('이동수단과 출발 시간 확인'));
      tasks.push(addTask('일정 및 목적지 정보 확인'));
      if (data.destination === '제주도') tasks.push(addTask('항공 또는 선박 예약·수하물 안내 확인'));
    }
    const business = data.purposeCategory === 'business'; const sub = data.subPurpose;
    if (business) {
      packing.push(addPackingItem('업무용 노트북'), addPackingItem('노트북 충전기'), addPackingItem('업무 자료'), addPackingItem('출입증', '필요한 방문지인지 확인해요.'));
      tasks.push(addTask('업무 일정 확인'), addTask('방문 담당자 연락처 확인'));
      if (sub === '회의') tasks.push(addTask('회의 안건·자료와 참석자 확인'));
      if (sub === '고객사 방문') tasks.push(addTask('고객사 방문 장소·담당자·도착 절차 확인'));
      if (sub === '현장 작업') { packing.push(addPackingItem('승인된 작업 장비', '현장 승인 및 반입 기준을 확인한 장비만 준비해요.'), addPackingItem('필요한 보호구', '현장 안전수칙과 승인 기준을 먼저 확인해요.')); tasks.push(addTask('작업 점검표 확인'), addTask('승인된 작업 장비와 보호구·안전수칙 확인', '현장별 승인·안전 지침을 확인해요.')); }
    }
    if (data.purposeCategory === 'education') {
      packing.push(addPackingItem('필기도구'), addPackingItem('교육 자료')); tasks.push(addTask('등록 또는 신청 내역 확인'));
      if (sub === '세미나' || sub === '컨퍼런스') tasks.push(addTask(`${sub} 장소·시간 및 프로그램 확인`));
    }
    if (data.purposeCategory === 'personal') {
      if (sub === '면접') { packing.push(addPackingItem('이력서'), addPackingItem('포트폴리오')); tasks.push(addTask('면접 장소 및 시간 확인')); }
      else if (sub === '가족 방문' || sub === '경조사') { tasks.push(addTask('방문·행사 일정 확인')); packing.push(addPackingItem('목적에 맞는 개인 준비물', sub === '경조사' ? '복장·전달할 물품 등 필요한 내용을 직접 확인해요.' : '방문 목적에 맞는 물품을 직접 추가해요.')); }
      else tasks.push(addTask('개인 일정의 장소·시간 확인'));
    }
    if (data.purposeCategory === 'travel') {
      if (sub === '휴식') packing.push(addPackingItem('편안한 실내복'));
      if (data.activities.includes('수영')) packing.push(addPackingItem('수영복·수영용품'));
      if (data.activities.includes('등산')) packing.push(addPackingItem('등산화·기능성 복장'));
      if (data.activities.includes('캠핑')) { packing.push(addPackingItem('캠핑 장비')); tasks.push(addTask('캠핑장 예약과 이용 안내 확인')); }
      if (data.activities.includes('야외활동')) packing.push(addPackingItem('모자·자외선 차단용품'));
    }
    if (data.startDate) tasks.push(addTask('시작일 일정 확인', data.startDate)); if (data.endDate) tasks.push(addTask('종료일·귀가 일정 확인', data.endDate));
    const previousMisses = new Map();
    trips.forEach(trip => (trip.missedItems || []).filter(Boolean).forEach(item => { if (data.type === 'domestic' && isInternationalDocument(item.name)) return; previousMisses.set(item.name.toLocaleLowerCase(), item.name); }));
    previousMisses.forEach(name => { if (!packing.some(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) packing.push(addPackingItem(name, '지난 일정에서 누락 기록이 있어요. 이번에는 직접 확인해 주세요.', false, 'missed')); });
    essentials.forEach(item => { if (data.type === 'domestic' && isInternationalDocument(item.name)) return; if (!packing.some(entry => entry.name.toLocaleLowerCase() === item.name.toLocaleLowerCase())) packing.push(addPackingItem(item.name, '개인 필수품 · 다음 일정 재사용', true, 'essential')); });
    return { packing: uniqueByName(packing), tasks: uniqueByName(tasks) };
  }
  function uniqueByName(items) {
    const seen = new Set(); return items.filter(item => { const key = item.name.trim().toLocaleLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  function preserveChecklistState(generated, previous, preserveCustom = false) {
    const unused = previous.slice();
    const merged = generated.map(item => {
      const index = unused.findIndex(old => old.name.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase());
      if (index < 0) return item;
      const [old] = unused.splice(index, 1);
      return { ...item, id: old.id || item.id, done: Boolean(old.done), ...(old.custom ? { custom: true } : {}), ...(old.source ? { source: old.source } : {}) };
    });
    if (preserveCustom) unused.filter(item => item.custom).forEach(item => merged.push(item));
    return uniqueByName(merged);
  }
  function handleCreateTrip(event) {
    event.preventDefault(); el.formError.hidden = true; const formData = new FormData(el.form);
    const type = String(formData.get('tripType') || 'domestic'); const destination = String(formData.get('destination') || '').trim(); const name = String(formData.get('tripName') || '').trim();
    if (!name) return showFormError('일정 이름을 입력해 주세요.'); if (!destination) return showFormError('이동 지역 또는 국가를 입력해 주세요.');
    const duration = String(formData.get('duration') || '0'); const lodging = formData.get('lodging') === 'yes' && Number(duration) > 0;
    const activities = [...new Set(formData.getAll('activities').map(value => String(value).trim()).filter(Boolean))]; const now = Date.now();
    const existing = editingTripId ? trips.find(item => item.id === editingTripId) : null;
    const data = {
      ...(existing || {}), id: existing ? existing.id : makeId(), type, name, destination,
      purposeCategory: String(formData.get('purposeCategory') || 'travel'), purpose: String(formData.get('subPurpose') || '관광'), subPurpose: String(formData.get('subPurpose') || '관광'),
      transport: type === 'domestic' ? String(formData.get('transport') || '기타') : '', duration: lodging ? duration : '0', lodging,
      startDate: String(formData.get('startDate') || ''), endDate: calculateEndDate(String(formData.get('startDate') || ''), duration, lodging), activities,
      createdAt: existing ? existing.createdAt : now, updatedAt: now, missedItems: existing ? (existing.missedItems || []) : []
    };
    const generated = buildChecklist(data);
    const trip = existing ? { ...data, packing: preserveChecklistState(generated.packing, existing.packing || [], true), tasks: preserveChecklistState(generated.tasks, existing.tasks || []) } : { ...data, ...generated };
    const previousTrips = trips;
    trips = existing ? trips.map(item => item.id === existing.id ? trip : item) : [...trips, trip];
    if (!persist()) { trips = previousTrips; return; }
    clearDraft(); editingTripId = null; updateHome(); openTrip(trip.id); showToast(existing ? '일정과 체크 상태를 보존해 수정했어요.' : '새 일정을 저장했어요.');
  }
  function showFormError(message) { el.formError.textContent = message; el.formError.hidden = false; el.formError.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function renderCustomActivities() {
    el.customActivityList.replaceChildren();
    customActivityNames.forEach((name, index) => {
      const chip = document.createElement('span'); chip.className = 'custom-activity-chip';
      const hidden = document.createElement('input'); hidden.type = 'checkbox'; hidden.name = 'activities'; hidden.value = name; hidden.checked = true; hidden.hidden = true; chip.append(hidden);
      const text = document.createElement('span'); text.textContent = name; chip.append(text);
      const edit = document.createElement('button'); edit.type = 'button'; edit.dataset.editActivity = String(index); edit.setAttribute('aria-label', `${name} 활동 수정`); edit.title = '활동 수정'; edit.textContent = '✎'; chip.append(edit);
      const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.removeActivity = String(index); remove.setAttribute('aria-label', `${name} 활동 삭제`); remove.title = '활동 삭제'; remove.textContent = '×'; chip.append(remove);
      el.customActivityList.append(chip);
    });
  }
  function addCustomActivity() {
    const input = $('#newActivityInput'); const name = input.value.trim();
    if (!name) { showToast('추가할 활동명을 입력해 주세요.'); input.focus(); return; }
    if (name.length > 40) { showToast('활동명은 40자 이내로 입력해 주세요.'); return; }
    const all = [...knownActivities, ...customActivityNames];
    if (all.some(value => value.toLocaleLowerCase() === name.toLocaleLowerCase())) { showToast('이미 선택되거나 등록된 활동이에요.'); return; }
    customActivityNames.push(name); input.value = ''; renderCustomActivities(); saveDraft(); showToast('추가 활동을 등록했어요.');
  }
  function handleCustomActivityAction(event) {
    const edit = event.target.closest('[data-edit-activity]'); const remove = event.target.closest('[data-remove-activity]'); if (!edit && !remove) return;
    const index = Number((edit || remove).dataset[edit ? 'editActivity' : 'removeActivity']); if (!Number.isInteger(index) || index < 0 || index >= customActivityNames.length) return;
    if (edit) {
      const oldName = customActivityNames[index]; const answer = window.prompt('활동명을 수정해 주세요.', oldName); if (answer === null) return; const next = answer.trim();
      if (!next || next.length > 40) { showToast('활동명은 1~40자로 입력해 주세요.'); return; }
      if ([...knownActivities, ...customActivityNames.filter((_, i) => i !== index)].some(value => value.toLocaleLowerCase() === next.toLocaleLowerCase())) { showToast('같은 이름의 활동이 이미 있어요.'); return; }
      customActivityNames[index] = next; showToast('활동명을 수정했어요.');
    } else { customActivityNames.splice(index, 1); showToast('직접 등록한 활동을 삭제했어요.'); }
    renderCustomActivities(); saveDraft();
  }
  function renderItems(container, items, kind) {
    container.replaceChildren();
    if (!items.length) { const empty = document.createElement('div'); empty.className = 'empty-items'; empty.textContent = kind === 'packing' ? '아직 준비물이 없어요.' : '등록된 출발 전 할 일이 없어요.'; container.append(empty); return; }
    items.forEach(item => {
      const row = document.createElement('div'); row.className = `check-row ${item.done ? 'is-done' : 'is-pending'}`;
      const label = document.createElement('label'); label.className = `check-item ${kind === 'task' ? 'task-item' : 'packing-item'} ${item.done ? 'is-done' : 'is-pending'}`;
      label.innerHTML = `<input class="item-checkbox" type="checkbox" data-item-kind="${kind}" data-item-id="${escapeHTML(item.id)}" ${item.done ? 'checked' : ''} aria-label="${escapeHTML(item.name)} ${item.done ? '완료됨' : '미완료'}"><span class="check-item-copy"><strong>${escapeHTML(item.name)}</strong>${item.detail ? `<small>${escapeHTML(item.detail)}</small>` : ''}${item.source === 'missed' ? '<small class="missed-hint">⚑ 지난 누락 · 이번에도 반드시 직접 확인</small>' : ''}</span>`;
      row.append(label);
      if (kind === 'packing') {
        const controls = document.createElement('div'); controls.className = 'packing-controls';
        const missed = document.createElement('button'); missed.type = 'button'; missed.className = 'missed-button'; missed.dataset.markMissed = item.id; missed.textContent = '누락 기록'; missed.title = '이번 일정에서 빠뜨린 경우 기록'; controls.append(missed);
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'item-action-button'; edit.dataset.editItem = item.id; edit.textContent = '✎'; edit.title = '준비물 수정'; edit.setAttribute('aria-label', `${item.name} 수정`); controls.append(edit);
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'item-action-button item-remove-button'; remove.dataset.deleteItem = item.id; remove.textContent = '×'; remove.title = '준비물 삭제'; remove.setAttribute('aria-label', `${item.name} 삭제`); controls.append(remove); row.append(controls);
      }
      container.append(row);
    });
  }
  function openTrip(id, options = {}) {
    const trip = trips.find(item => item.id === id); if (!trip) return; activeTripId = id;
    const metaParts = [trip.destination, categoryLabel(trip), trip.subPurpose || trip.purpose || '관광', durationLabel(trip)];
    if (trip.startDate) metaParts.push(trip.startDate); if (trip.endDate) metaParts.push(trip.endDate);
    if (trip.type !== 'international' && trip.transport) metaParts.push(trip.transport); if (Array.isArray(trip.activities) && trip.activities.length) metaParts.push(trip.activities.join(' · '));
    $('#checklistKicker').textContent = `${categoryLabel(trip)} · ${trip.type === 'international' ? '해외' : '국내'}`;
    el.title.textContent = trip.name; el.meta.textContent = metaParts.join(' · '); el.officialNote.hidden = trip.type !== 'international';
    renderItems(el.packingItems, trip.packing, 'packing'); renderItems(el.taskItems, trip.tasks, 'task'); renderPersonalNotes(); renderMissedHistory(); updateProgress(); showView('checklist', options);
  }
  function updateProgress() {
    const trip = trips.find(item => item.id === activeTripId); if (!trip) return;
    const packing = progress(trip.packing), tasks = progress(trip.tasks);
    el.packingProgressText.textContent = `${packing.percent}%`; el.packingProgressBar.style.width = `${packing.percent}%`; el.packingProgressBar.parentElement.setAttribute('aria-label', `준비물 ${packing.percent}% 완료`);
    el.packingProgressCount.textContent = `${packing.done} / ${packing.total}개 완료`; el.taskProgressText.textContent = `${tasks.percent}%`; el.taskProgressBar.style.width = `${tasks.percent}%`;
    el.taskProgressBar.parentElement.setAttribute('aria-label', `출발 전 할 일 ${tasks.percent}% 완료`); el.taskProgressCount.textContent = `${tasks.done} / ${tasks.total}개 완료`;
    el.packingItemCount.textContent = `${packing.total}개`; el.taskItemCount.textContent = `${tasks.total}개`;
    const pendingPacking = trip.packing.filter(item => !item.done).length, pendingTasks = trip.tasks.filter(item => !item.done).length;
    el.preflightSummary.innerHTML = `<span class="preflight-count">${pendingPacking}개</span> 미수납 준비물 <span class="preflight-divider">·</span> <span class="preflight-count">${pendingTasks}개</span> 미완료 업무`;
    el.preflightSummary.classList.toggle('has-pending', pendingPacking + pendingTasks > 0);
  }
  function handleItemChange(event) {
    const input = event.target.closest('[data-item-kind][data-item-id]'); if (!input || !activeTripId) return;
    const trip = trips.find(item => item.id === activeTripId); if (!trip) return;
    const list = input.dataset.itemKind === 'task' ? trip.tasks : trip.packing; const item = list.find(entry => entry.id === input.dataset.itemId); if (!item) return;
    item.done = input.checked; trip.updatedAt = Date.now(); persist(); renderItems(input.dataset.itemKind === 'task' ? el.taskItems : el.packingItems, list, input.dataset.itemKind); updateProgress(); updateHome();
  }
  function handlePackingAction(event) {
    const editButton = event.target.closest('[data-edit-item]'); const deleteButton = event.target.closest('[data-delete-item]'); if ((!editButton && !deleteButton) || !activeTripId) return;
    const trip = trips.find(item => item.id === activeTripId); if (!trip) return;
    const id = (editButton || deleteButton).dataset[editButton ? 'editItem' : 'deleteItem']; const item = trip.packing.find(entry => entry.id === id); if (!item) return;
    if (editButton) {
      const answer = window.prompt('준비물 이름을 수정해 주세요.', item.name); if (answer === null) return; const name = answer.trim();
      if (!name) { showToast('준비물 이름을 비워 둘 수 없어요.'); return; } if (name.length > 60) { showToast('준비물 이름은 60자 이내로 입력해 주세요.'); return; } item.name = name;
    } else {
      if (!window.confirm(`“${item.name}” 준비물을 목록에서 삭제할까요?`)) return; trip.packing = trip.packing.filter(entry => entry.id !== item.id);
    }
    trip.updatedAt = Date.now(); persist(); renderItems(el.packingItems, trip.packing, 'packing'); updateProgress(); updateHome(); showToast(editButton ? '준비물 이름을 수정했어요.' : '준비물을 삭제했어요.');
  }
  function handleAddItem(event) {
    event.preventDefault(); const name = el.newItemInput.value.trim(); if (!name || !activeTripId) { if (!name) showToast('추가할 준비물 이름을 입력해 주세요.'); return; }
    const trip = trips.find(item => item.id === activeTripId); if (!trip) return; trip.packing.push(addPackingItem(name, '이번 일정에서 직접 추가한 준비물', true));
    if (el.saveAsEssential.checked && !essentials.some(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { essentials.push({ id: makeId(), name }); persistEssentials(); }
    trip.updatedAt = Date.now(); persist(); renderItems(el.packingItems, trip.packing, 'packing'); renderPersonalNotes(); updateProgress(); updateHome(); el.newItemInput.value = ''; el.saveAsEssential.checked = false; showToast('준비물을 목록에 추가했어요.');
  }
  function renderPersonalNotes() {
    const note = $('#personalNote'); note.innerHTML = essentials.length ? `저장된 개인 필수품 ${essentials.length}개가 새 일정에 포함됩니다. <span class="essential-manage">${essentials.map(item => `<button type="button" data-remove-essential="${escapeHTML(item.id)}" title="개인 필수품 삭제: ${escapeHTML(item.name)}">${escapeHTML(item.name)} ×</button>`).join('')}</span>` : '개인 필수품은 ‘다음 일정에도 재사용’을 선택해 저장할 수 있어요.';
  }
  function renderMissedHistory() {
    const trip = trips.find(item => item.id === activeTripId); if (!trip) return; const items = (trip.missedItems || []).filter(Boolean);
    el.missedHistory.innerHTML = items.length ? items.map(item => `<span class="missed-history-chip">⚑ ${escapeHTML(item.name)} <button type="button" data-remove-missed="${escapeHTML(item.id)}" aria-label="${escapeHTML(item.name)} 누락 기록 삭제">×</button></span>`).join('') : '<span class="missed-empty">아직 누락 기록이 없어요. 준비물의 ‘누락 기록’을 눌러 저장할 수 있어요.</span>';
  }
  function markMissed(itemId) {
    const trip = trips.find(item => item.id === activeTripId); if (!trip) return; const item = trip.packing.find(entry => entry.id === itemId); if (!item) return;
    trip.missedItems ||= []; if (!trip.missedItems.some(entry => entry.name.toLocaleLowerCase() === item.name.toLocaleLowerCase())) trip.missedItems.push({ id: makeId(), name: item.name, createdAt: Date.now() });
    item.done = false; trip.updatedAt = Date.now(); persist(); renderItems(el.packingItems, trip.packing, 'packing'); renderMissedHistory(); updateProgress(); updateHome(); showToast('누락 기록을 저장했어요. 다음 일정에서 우선 확인할게요.');
  }
  function deleteTrip(id) {
    const trip = trips.find(item => item.id === id); if (!trip) return;
    if (!window.confirm(`“${trip.name}” 일정을 삭제할까요? 삭제한 일정은 복구할 수 없습니다.`)) return;
    trips = trips.filter(item => item.id !== id); persist(); updateHome(); if (activeTripId === id) { activeTripId = null; showView('home'); } showToast('일정을 삭제했어요.');
  }

  $('#newTripButton').addEventListener('click', () => openForm()); $('#savedNewTripButton').addEventListener('click', () => openForm());
  $$('[data-start-purpose]').forEach(button => button.addEventListener('click', () => openForm('domestic', button.dataset.startPurpose)));
  $$('[data-trip-type]').forEach(button => button.addEventListener('click', () => { const oldDestination = el.destination.value; setTripType(button.dataset.tripType); if (button.dataset.tripType === el.typeInput.value) el.destination.value = oldDestination; saveDraft(); }));
  $('#purposeCategory').addEventListener('change', event => setPurposeCategory(event.target.value));
  el.lodging.addEventListener('change', event => { if (event.target.value === 'no') el.duration.value = '0'; else if (el.duration.value === '0') el.duration.value = '1'; updateEndDate(); });
  el.duration.addEventListener('change', event => { if (event.target.value === '0') el.lodging.value = 'no'; else el.lodging.value = 'yes'; updateEndDate(); });
  el.startDate.addEventListener('change', updateEndDate); el.startDate.addEventListener('input', updateEndDate);
  el.form.addEventListener('input', saveDraft); el.form.addEventListener('change', saveDraft);
  el.form.addEventListener('submit', handleCreateTrip);
  $('#formBackButton').addEventListener('click', () => { clearDraft(); editingTripId = null; updateHome(); showView('home'); });
  $('#checklistBackButton').addEventListener('click', () => { updateHome(); showView('home'); }); $('#topHomeButton').addEventListener('click', () => { updateHome(); showView('home'); });
  $('#homeLink').addEventListener('click', event => { event.preventDefault(); updateHome(); showView('home'); }); $('#deleteTripButton').addEventListener('click', () => { if (activeTripId) deleteTrip(activeTripId); });
  $('#editTripButton').addEventListener('click', () => { const trip = trips.find(item => item.id === activeTripId); if (trip) openForm(trip.type, trip.purposeCategory, trip); });
  $('#addActivityButton').addEventListener('click', addCustomActivity); $('#newActivityInput').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addCustomActivity(); } });
  el.customActivityList.addEventListener('click', handleCustomActivityAction);
  el.savedTrips.addEventListener('click', event => { const deleteButton = event.target.closest('[data-delete-trip]'); if (deleteButton) { event.stopPropagation(); deleteTrip(deleteButton.dataset.deleteTrip); return; } const openButton = event.target.closest('[data-open-trip]'); if (openButton) openTrip(openButton.dataset.openTrip); });
  el.packingItems.addEventListener('change', handleItemChange); el.taskItems.addEventListener('change', handleItemChange);
  el.packingItems.addEventListener('click', event => { const missedButton = event.target.closest('[data-mark-missed]'); if (missedButton) { markMissed(missedButton.dataset.markMissed); return; } handlePackingAction(event); });
  el.missedHistory.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-missed]'); if (!button) return; const trip = trips.find(item => item.id === activeTripId); if (!trip) return;
    trip.missedItems = trip.missedItems.filter(item => item.id !== button.dataset.removeMissed); trip.updatedAt = Date.now(); persist(); renderMissedHistory(); showToast('누락 기록을 삭제했어요.');
  });
  $('#personalNote').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-essential]'); if (!button) return; const item = essentials.find(entry => entry.id === button.dataset.removeEssential);
    if (!item || !window.confirm(`개인 필수품 “${item.name}”을 삭제할까요?`)) return;
    essentials = essentials.filter(entry => entry.id !== item.id); persistEssentials(); renderPersonalNotes(); showToast('개인 필수품을 삭제했어요. 새 일정부터 반영됩니다.');
  });
  el.addItemForm.addEventListener('submit', handleAddItem);
  initializeNavigation();
})();
