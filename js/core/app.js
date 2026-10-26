(() => {
    'use strict';
    const TRIPS = 'packmate.trips.v1', ESSENTIALS = 'packmate.essentials.v1', DRAFT = 'packmate.draft.v1', ACTIVITIES = 'packmate.activities.v1'; const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], key = v => String(v ?? '').trim().toLocaleLowerCase(), id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, escape = v => String(v ?? '').replace(/[&<>\\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\\"': '&quot;', "'": '&#39;' }[c]));
    const { rules, purpose, purposeLabels, domestic, cities, international } = window.PACKMATE_APP_CONSTANTS;
    const el = { home: $('#homeView'), formView: $('#formView'), checkView: $('#checklistView'), form: $('#tripForm'), submit: $('#formSubmitButton'), type: $('#tripTypeInput'), dest: $('#destination'), destList: $('#destinationOptions'), destLabel: $('#destinationLabel'), transport: $('#transportField'), saved: $('#savedTrips'), empty: $('#emptyTrips'), toast: $('#toast'), packing: $('#packingItems'), tasks: $('#taskItems'), addForm: $('#addItemForm'), addInput: $('#newItemInput'), essential: $('#saveAsEssential'), personal: $('#personalNote'), missed: $('#missedHistory'), error: $('#formError'), purpose: $('#purposeCategory'), sub: $('#subPurpose'), duration: $('#duration'), lodging: $('#lodging'), start: $('#startDate'), end: $('#endDate') };
    const cityField = document.createElement('div'); cityField.className = 'form-field'; cityField.id = 'internationalCityField'; cityField.hidden = true; cityField.innerHTML = '<label for="destinationCity">도시 <span class="optional-label">선택</span></label><input id="destinationCity" name="destinationCity" type="text" list="destinationCityOptions" maxlength="60" placeholder="도시를 검색하거나 직접 입력" autocomplete="off"><datalist id="destinationCityOptions"></datalist><span class="field-hint">목록에서 검색하거나 다른 도시명을 직접 입력할 수 있어요.</span>'; el.dest.closest('.form-field').after(cityField); el.cityField = cityField; el.city = $('#destinationCity'); el.cityList = $('#destinationCityOptions');
    const destinationPreview = document.createElement('div'); destinationPreview.className = 'destination-selection-preview full-field'; destinationPreview.setAttribute('aria-live', 'polite'); destinationPreview.innerHTML = '<span class="destination-preview-label">입력한 이동 지역</span><strong></strong>'; cityField.after(destinationPreview); const activityField = $('.activity-field'), activityOptions = $('.activity-options'), activitySearchPanel = document.createElement('div'); activitySearchPanel.className = 'activity-search-panel'; activitySearchPanel.innerHTML = '<label for="activitySearchInput">활동 찾기</label><input id="activitySearchInput" type="search" maxlength="40" placeholder="예: 수영, 카메라, 자전거" autocomplete="off"><p class="activity-search-status" id="activitySearchStatus" role="status" aria-live="polite"></p>'; activityOptions.before(activitySearchPanel); const activitySearch = $('#activitySearchInput'), activitySearchStatus = $('#activitySearchStatus');
    const readonlyBanner = document.createElement('div'); readonlyBanner.className = 'readonly-checklist-notice'; readonlyBanner.id = 'readonlyChecklistNotice'; readonlyBanner.hidden = true; readonlyBanner.setAttribute('role', 'status'); readonlyBanner.innerHTML = `<span aria-hidden="true">▣</span><span data-i18n="checklist.readOnlyNotice">${window.PACKMATE_I18N?.t('checklist.readOnlyNotice') || '클라우드 저장 기능 준비 중 · 현재 읽기 전용'}</span>`; el.checkView.querySelector('.checklist-header')?.before(readonlyBanner);
    const PERSONAL_KEYS = new Set([TRIPS, ESSENTIALS, DRAFT, ACTIVITIES]); let trips = Object.freeze([]), previewTrip = null, essentials = [], definitions = [], activeId = null, editingId = null, selectedCustom = [], selectedBuiltIn = [], toastTimer, accountRequest = 0, accountKey = '', accountMessage = '인증 상태를 확인하고 있어요.', pendingTripId = new URL(location.href).searchParams.get('trip') || history.state?.packmateRoute?.tripId || null; const cloudDeleteLocks = new Set(), cloudDeleteUncertain = new Set(), cloudPackingCheckLocks = new Set(), cloudPackingCheckUncertain = new Set(); let dataState = Object.freeze({ mode: 'locked', status: 'loading', userId: null, generation: null });
    const canMutate = () => window.PACKMATE_ACCESS_POLICY.canMutate(dataState), canPlan = () => window.PACKMATE_ACCESS_POLICY.canPlan(dataState), displayTrip = tripId => previewTrip?.id === tripId ? previewTrip : trips.find(t => String(t.id) === String(tripId)) || null; function clone(value) { return JSON.parse(JSON.stringify(value)) } function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.keys(value).forEach(k => freeze(value[k])); Object.freeze(value) } return value } function dataSnapshot() { return Object.freeze({ ...dataState, count: trips.length, readOnly: !canMutate(), preview: Boolean(previewTrip) }) }
    function updatePreviewTrip(change) { if (!previewTrip || previewTrip.id !== activeId || typeof change !== 'function') return false; const next = clone(previewTrip); if (change(next) === false) return false; previewTrip = freeze(next); openTrip(next.id, { noHistory: true, keepScroll: true }); window.PACKMATE_I18N_FORM?.scheduleApply?.(); return true }
    function getCloudTripRecord(tripId, userId, generation) {
        if (typeof tripId !== 'string' || !tripId || typeof userId !== 'string' || !userId ||
            dataState.mode !== 'cloud-readonly' || dataState.userId !== userId || dataState.generation !== generation) return null;
        const cloud = window.PACKMATE_ACCOUNT_TRIPS;
        if (typeof cloud?.getState !== 'function' || typeof cloud.getTrips !== 'function') return null;
        const state = cloud.getState();
        if (state?.status !== 'ready' || state.userId !== userId || state.generation !== generation) return null;
        const rows = cloud.getTrips();
        if (!Array.isArray(rows)) return null;
        const row = rows.find(value => value?.tripId === tripId);
        if (!row || row.payload?.id !== tripId || !Number.isSafeInteger(row.revision) || row.revision <= 0) return null;
        return Object.freeze({ userId, generation, tripId, payload: row.payload, revision: row.revision });
    }
    function canEditCloudTrip(trip) {
        return Boolean(trip && typeof trip.id === 'string' && trips.some(value => value?.id === trip.id) &&
            getCloudTripRecord(trip.id, dataState.userId, dataState.generation));
    }
    window.PACKMATE_APP_DATA = Object.freeze({ getState: dataSnapshot, getTrips: () => trips, getTrip: displayTrip, updatePreview: updatePreviewTrip, updateCloudPacking: updateCloudPackingItem, canMutate, canPlan, canUpdateCloudPacking: () => cloudPackingCheckAllowed(activeId), canUpdateGuestChecklist: kind => (kind === 'task' || kind === 'packing') && dataState.mode === 'guest-preview' && dataState.status === 'unauthenticated' && Boolean(displayTrip(activeId) && getGuestDeleteSession()), canWriteLocal: key => !PERSONAL_KEYS.has(key) || canMutate() });
    function updateStateCopy() { const key = dataState.mode === 'cloud-readonly' ? 'cloudReadOnly' : dataState.status === 'unauthenticated' ? 'privateHidden' : dataState.status === 'error' ? 'cloudError' : 'checking', storageKeys = { checking: 'home.storageChecking', cloudReadOnly: 'home.storageReadOnly', privateHidden: 'home.storageHidden', cloudError: 'home.storageError' }, status = $('#accountStorageStatus'), storage = $('.storage-note [data-i18n]'), t = window.PACKMATE_I18N?.t; if (status) { status.dataset.i18n = `status.${key}`; status.textContent = t?.(`status.${key}`) || status.textContent } if (storage) { storage.dataset.i18n = storageKeys[key]; storage.textContent = t?.(storageKeys[key]) || storage.textContent } }
    function toastText(source) { const messages = window.PACKMATE_I18N_FORM?.messages, language = window.PACKMATE_I18N?.language || 'ko', index = language === 'en' ? 1 : language === 'tl' ? 2 : 0; if (!messages || index === 0) return source; for (const values of Object.values(messages)) if (values?.[0] === source) return values[index] || source; if (/클라우드.*(?:저장|삭제|수정|추가)|revision|INSERT|UPDATE|DELETE/.test(source)) return messages[/실패|못|없어|확인할 수 없|잠갔|중단|오류|거부/.test(source) ? 'feedback.cloudSaveFailed' : 'feedback.cloudSaved']?.[index] || source; if (/저장/.test(source) && /실패|못|없어|오류/.test(source)) return messages['feedback.saveFailed']?.[index] || source; return source } function toast(s, tone = '') { const failed = tone === 'error' || (!tone && /실패|못|없어|확인할 수 없|잠갔|중단|오류|거부/.test(s)), success = tone === 'success' || (!failed && /저장했|저장하고|삭제했|추가했|수정했|반영했/.test(s)); el.toast.textContent = toastText(s); el.toast.classList.toggle('is-error', failed); el.toast.classList.toggle('is-success', success); el.toast.setAttribute('role', failed ? 'alert' : 'status'); el.toast.setAttribute('aria-live', failed ? 'assertive' : 'polite'); el.toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('is-visible'), failed ? 4200 : 2800) } window.PACKMATE_TOAST = Object.freeze({ show: toast }); function readonlyNotice() { toast('클라우드 일정은 현재 읽기 전용이에요.') } const { save, persist, loadLocalTrips, appendGuestTrip, getGuestDeleteSession, deleteGuestTrip, updateGuestItemDone } = window.PACKMATE_TRIP_STORAGE.createStorage({
    canMutate,
    toast,
    PERSONAL_KEYS,
    TRIPS,
    getTrips: () => trips
});
function isCurrentGuestSaveState(requestGeneration) {
    if (!Number.isSafeInteger(requestGeneration) || requestGeneration < 0 ||
        dataState.mode !== 'guest-preview' || dataState.status !== 'unauthenticated' ||
        dataState.userId || dataState.generation !== requestGeneration) return false;
    try {
        const appState = window.PACKMATE_APP_DATA?.getState?.();
        const accountState = window.PACKMATE_ACCOUNT_STATE?.getState?.();
        const isLoggedOut = value => value === null || value === undefined || value === '';
        return appState?.mode === 'guest-preview' && appState.status === 'unauthenticated' &&
            isLoggedOut(appState.userId) && appState.generation === requestGeneration &&
            accountState?.status === 'ready' && isLoggedOut(accountState.userId) &&
            accountState.generation === requestGeneration;
    } catch (_) {
        return false;
    }
}
function onGuestTripsSaved(savedTrips, savedTrip, requestGeneration) {
    if (!isCurrentGuestSaveState(requestGeneration) || !Array.isArray(savedTrips) ||
        !savedTrip || typeof savedTrip !== 'object' || Array.isArray(savedTrip) ||
        typeof savedTrip.id !== 'string' || !savedTrip.id.trim()) return false;

    const ids = new Set();
    let containsSavedTrip = false;
    for (const trip of savedTrips) {
        if (!trip || typeof trip !== 'object' || Array.isArray(trip) ||
            typeof trip.id !== 'string' || !trip.id.trim() || ids.has(trip.id)) return false;
        ids.add(trip.id);
        if (trip.id === savedTrip.id) containsSavedTrip = true;
    }
    if (!containsSavedTrip) return false;

    let copiedTrips;
    try {
        copiedTrips = savedTrips.map(trip => freeze(normalize(clone(trip))));
    } catch (_) {
        return false;
    }
    if (copiedTrips.some((trip, index) => !trip || typeof trip.id !== 'string' ||
        trip.id !== savedTrips[index].id || !trip.id.trim()) ||
        !copiedTrips.some(trip => trip.id === savedTrip.id) ||
        !isCurrentGuestSaveState(requestGeneration)) return false;

    trips = Object.freeze(copiedTrips);
    accountMessage = trips.length ? '' : '이 브라우저에 저장된 로컬 일정이 없어요.';
    updateHome();
    openTrip(savedTrip.id);
    window.PACKMATE_I18N_FORM?.scheduleApply?.();
    return true;
}
function view(name, { noHistory = false, keepScroll = false } = {}) { if (name === 'form' && !canPlan()) name = 'home'; const r = name === 'checklist' ? { view: name, tripId: activeId } : name === 'form' ? { view: name, editTripId: editingId || null, type: el.type.value, category: el.purpose.value } : { view: 'home' }, url = new URL(location.href); if (r.view === 'checklist' && r.tripId) url.searchParams.set('trip', r.tripId); else url.searchParams.delete('trip'); const state = { ...history.state, packmateRoute: r }, sameRoute = history.state?.packmateRoute?.view === r.view && history.state?.packmateRoute?.tripId === r.tripId; if (noHistory) history.replaceState(state, '', url); else if (!sameRoute || url.href !== location.href) history.pushState(state, '', url); el.home.hidden = name !== 'home'; el.formView.hidden = name !== 'form'; el.checkView.hidden = name !== 'checklist'; if (!keepScroll) window.scrollTo({ top: 0, behavior: 'smooth' }) } function home() { if (previewTrip?.id === activeId) activeId = null; previewTrip = null; if (!canMutate()) { definitions = []; selectedCustom = []; selectedBuiltIn = [] } updateHome(); editingId = null; view('home') } function restorePendingTrip() { if (dataState.status !== 'ready' && dataState.status !== 'unauthenticated') return false; const tripId = pendingTripId || new URL(location.href).searchParams.get('trip'); pendingTripId = null; if (tripId && displayTrip(tripId)) { openTrip(tripId, { noHistory: true }); return true } if (tripId) { toast('현재 계정에서 해당 일정을 찾을 수 없어요.'); home() } return false } function builtIn(n) { return Object.keys(rules).some(x => key(x) === key(n)) } function normalize(t) { t.packing = Array.isArray(t.packing) ? t.packing.map(x => typeof x === 'string' ? { id: id(), name: x, done: false } : { ...x, id: x.id || id(), name: String(x.name || '준비 항목'), done: !!x.done }) : []; t.tasks = Array.isArray(t.tasks) ? t.tasks.map(x => typeof x === 'string' ? { id: id(), name: x, done: false } : { ...x, id: x.id || id(), name: String(x.name || '할 일'), done: !!x.done }) : []; t.missedItems = Array.isArray(t.missedItems) ? t.missedItems : []; t.activities = Array.isArray(t.activities) ? t.activities : []; return t }
    function category(t) { return purposeLabels[t.purposeCategory] || '여행·휴가' } function percent(a) { return a.length ? Math.round(a.filter(x => x.done).length / a.length * 100) : 0 } function displayDestination(t) { return [t.destinationCountry || t.destination, t.destinationCity].filter(Boolean).join(' · ') } function applyAccess() { const preview = !!previewTrip, locked = !canMutate() && !preview, planLocked = !canPlan();['newTripButton', 'savedNewTripButton'].forEach(id => { const node = $(`#${id}`); if (node) node.disabled = planLocked }); $$('[data-start-purpose]').forEach(node => node.disabled = planLocked); const editButton = $('#editTripButton'), deleteButton = $('#deleteTripButton'), activeTrip = trips.find(t => t?.id === activeId), guestDeleteAllowed = dataState.mode === 'guest-preview' && dataState.status === 'unauthenticated' && Boolean(activeTrip && getGuestDeleteSession()), cloudEditAllowed = dataState.mode === 'cloud-readonly' && canEditCloudTrip(activeTrip), cloudDeleteRecord = dataState.mode === 'cloud-readonly' && activeTrip ? getCloudTripRecord(activeTrip.id, dataState.userId, dataState.generation) : null, cloudDeleteAllowed = Boolean(cloudDeleteRecord && !cloudDeleteLocks.has(cloudDeleteRecord.tripId) && !cloudDeleteUncertain.has(cloudDeleteRecord.tripId)); if (editButton) { editButton.hidden = false; editButton.disabled = !(canMutate() || cloudEditAllowed) } if (deleteButton) { deleteButton.hidden = false; deleteButton.disabled = !(canMutate() || guestDeleteAllowed || cloudDeleteAllowed) } const noticeKey = preview ? 'checklist.previewNotice' : 'checklist.readOnlyNotice', notice = readonlyBanner.querySelector('[data-i18n]'); readonlyBanner.hidden = !(dataState.mode === 'cloud-readonly' || preview); if (notice) { notice.dataset.i18n = noticeKey; notice.textContent = window.PACKMATE_I18N?.t(noticeKey) || '체험 미리보기 · 입력 내용과 추천 결과는 저장되지 않습니다.' } el.checkView.classList.toggle('is-readonly', !canMutate()); if (el.addForm) el.addForm.hidden = locked; el.packing.querySelectorAll('input,button').forEach(node => node.disabled = locked); el.tasks.querySelectorAll('input,button').forEach(node => node.disabled = locked); el.personal.querySelectorAll('button').forEach(node => node.disabled = locked); el.missed.querySelectorAll('button').forEach(node => node.disabled = locked) } function updateHome() { updateStateCopy(); el.saved.replaceChildren(); $('#tripCount').textContent = String(trips.length); el.empty.hidden = trips.length > 0; if (!trips.length) { const title = el.empty.querySelector('strong'), description = el.empty.querySelector('p'); if (title) { title.removeAttribute('data-i18n'); title.textContent = accountMessage } if (description) { description.removeAttribute('data-i18n'); description.textContent = dataState.status === 'error' ? '로컬 일정으로 대체하지 않았습니다. 로그인과 네트워크 상태를 확인해 주세요.' : dataState.mode === 'guest-preview' ? '기존 로컬 일정이 없거나 읽을 수 없습니다. 저장된 데이터는 변경하지 않았습니다.' : '개인 일정은 인증된 계정에서만 표시됩니다.' } } trips.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).forEach(t => { const card = document.createElement('article'); card.className = 'saved-trip-card'; const guestDeleteAllowed = dataState.mode === 'guest-preview' && dataState.status === 'unauthenticated' && Boolean(getGuestDeleteSession()), cloudDeleteRecord = dataState.mode === 'cloud-readonly' ? getCloudTripRecord(t.id, dataState.userId, dataState.generation) : null, cloudDeleteAllowed = Boolean(cloudDeleteRecord && !cloudDeleteLocks.has(t.id) && !cloudDeleteUncertain.has(t.id)), deleteVisible = canMutate() || guestDeleteAllowed || Boolean(cloudDeleteRecord); card.innerHTML = `<div class="saved-trip-top"><span class="saved-trip-type"><span class="saved-trip-symbol" aria-hidden="true">${t.type === 'international' ? '◎' : '⌂'}</span>${escape(category(t))} · ${t.type === 'international' ? '해외' : '국내'}</span><button class="trip-delete-mini" type="button" data-delete-trip="${escape(t.id)}" aria-label="일정 삭제" ${deleteVisible ? '' : 'hidden'} ${canMutate() || guestDeleteAllowed || cloudDeleteAllowed ? '' : 'disabled'}>×</button></div><button class="saved-trip-open" type="button" data-open-trip="${escape(t.id)}"><strong>${escape(t.name)}</strong><span class="saved-trip-destination">${escape(displayDestination(t))} · ${escape(t.subPurpose || t.purpose || '관광')} · ${Number(t.duration) ? `${t.duration}박 ${Number(t.duration) + 1}일` : '당일'}</span><span class="saved-trip-footer"><span>${t.packing.filter(x => x.done).length}/${t.packing.length} 준비물 · ${t.tasks.filter(x => x.done).length}/${t.tasks.length} 할 일</span><span class="saved-trip-progress"><span class="tiny-progress"><span style="width:${percent([...t.packing, ...t.tasks])}%"></span></span>${percent([...t.packing, ...t.tasks])}%</span></span></button>`; el.saved.append(card) }); applyAccess() }
    const {
    updateDestinationPreview,
    cityOptions,
    updateEnd, setType, setPurpose, updateActivitySearch
} = window.PACKMATE_TRIP_FORM_UI.createFormUI({
    el,
    $,
    destinationPreview,
    cities,
    key,
    $$,
    domestic,
    international,
    purpose,
    activitySearch,
    activityField,
    activitySearchStatus
});
function supplies(activity) { const name = Object.keys(rules).find(x => key(x) === key(activity)), all = (name ? rules[name] : []).concat(definitions.filter(x => key(x.name) === key(activity)).flatMap(x => x.items || [])), seen = new Set(); return all.filter(x => { const k = key(x); if (!k || seen.has(k)) return false; seen.add(k); return true }) } function updatePreview() { let box = $('.activity-preview'); if (!box) { box = document.createElement('div'); box.className = 'activity-preview'; box.setAttribute('aria-live', 'polite'); $('.activity-field').append(box) } const list = []; selectedActivities().forEach(a => supplies(a).forEach(n => { let x = list.find(y => key(y.name) === key(n)); if (!x) list.push(x = { name: n, from: [] }); if (!x.from.some(y => key(y) === key(a))) x.from.push(a) })); box.innerHTML = `<strong class="activity-preview-title">선택 활동별 추천 준비물</strong>${list.length ? `<ul class="activity-preview-list">${list.map(x => `<li><strong>${escape(x.name)}</strong><small>추천 이유: ${x.from.map(a => `${escape(a)} 활동`).join(', ')}</small></li>`).join('')}</ul>` : '<p>활동을 선택하면 추천 준비물과 추천 이유가 여기에 표시돼요.</p>'}` }
    const { selectedActivities, renderActivities } =
    window.PACKMATE_TRIP_ACTIVITIES.createActivities({
        el, $, $$, key, rules, escape,
        canPlan, builtIn, updatePreview, updateActivitySearch,
        getSelectedCustom: () => selectedCustom,
        getSelectedBuiltIn: () => selectedBuiltIn,
        setSelectedBuiltIn: value => { selectedBuiltIn = value; },
        getDefinitions: () => definitions
    });
function openForm(type = 'domestic', purposeType = 'travel', trip = null) { if (trip ? (!canMutate() && !canEditCloudTrip(trip)) : !canPlan()) { readonlyNotice(); return } if (!trip) previewTrip = null; editingId = trip?.id || null; el.form.reset(); el.error.hidden = true; setPurpose(trip?.purposeCategory || purposeType, trip?.subPurpose || trip?.purpose); setType(trip?.type || type); if (trip) { $('#tripName').value = trip.name; el.dest.value = trip.destinationCountry || trip.destination || ''; el.city.value = trip.destinationCity || ''; cityOptions(); $('#transport').value = trip.transport || '기타'; el.duration.value = String(trip.duration || 0); el.lodging.value = trip.lodging === false || !Number(trip.duration) ? 'no' : 'yes'; el.start.value = trip.startDate || ''; selectedBuiltIn = (trip.activities || []).filter(builtIn); selectedCustom = (trip.activities || []).filter(x => !builtIn(x)); $('#formTitle').textContent = '일정 정보를 수정할까요?'; el.submit.innerHTML = '변경 내용 저장 <span class="button-arrow" aria-hidden="true">↗</span>' } else { el.dest.value = ''; el.city.value = ''; el.duration.value = el.duration.querySelector('option[selected]')?.value || '1'; el.lodging.value = 'yes'; el.start.value = ''; selectedBuiltIn = []; selectedCustom = []; $('#formTitle').textContent = '어떤 일정을 준비할까요?'; el.submit.innerHTML = `${canMutate() ? '준비 목록 만들기' : '추천 목록 미리보기'} <span class="button-arrow" aria-hidden="true">↗</span>` } updateDestinationPreview(); activitySearch.value = ''; renderActivities(); updateEnd(); view('form'); saveDraft() } function saveDraft() { if (!canMutate() || el.formView.hidden) return; try { localStorage.setItem(DRAFT, JSON.stringify({ editingId, fields: Object.fromEntries(new FormData(el.form)), activities: selectedActivities() })) } catch (_) { } } function add(name, detail = '', custom = false, source = '') { return { id: id(), name, detail, done: false, custom, source } } const recommendationEngine = window.PACKMATE_RECOMMENDATION_ENGINE.createEngine({
    add,
    key,
    id,
    supplies,
    getEssentials: () => essentials,
    getTrips: () => trips
});
const { build, appendActivity, unique } = recommendationEngine;
function preserve(fresh, old, keepCustom = false) { const remaining = [...old], out = fresh.map(n => { const i = remaining.findIndex(x => key(x.name) === key(n.name)); if (i < 0) return n; const [x] = remaining.splice(i, 1); return { ...n, id: x.id || n.id, done: !!x.done, ...(x.custom ? { custom: true } : {}), ...(x.quantity !== undefined ? { quantity: x.quantity, unit: x.unit, quantityEdited: x.quantityEdited } : {}), ...(x.recommendationReasons ? { recommendationReasons: x.recommendationReasons } : {}) } }); if (keepCustom) remaining.filter(x => x.custom || key(x.name) === key('휴대전화')).forEach(x => out.push(x)); return unique(out) }
    const { formTrip } = window.PACKMATE_TRIP_FORM_DATA.createFormData({
    el,
    id,
    selectedActivities
});
const { previewPlan, submitTrip } = window.PACKMATE_TRIP_SUBMIT.createSubmit({
    formTrip, build, clone, freeze, openTrip: (...args) => openTrip(...args),
    canMutate, canPlan, readonlyNotice, saveDraft,
    preserve, persist, toast, el, TRIPS, DRAFT,
    getEditingId: () => editingId,
    setEditingId: value => { editingId = value; },
    getTrips: () => trips,
    setTrips: value => { trips = value; },
    setPreviewTrip: value => { previewTrip = value; },
    getCloudTripRecord,
    appendGuestTrip,
    onGuestTripsSaved
});
const { renderItems, renderPersonal, renderMissed } = window.PACKMATE_CHECKLIST_RENDER.createRenderer({
    escape,
    canMutate,
    el,
    displayTrip,
    getPreviewTrip: () => previewTrip,
    getActiveId: () => activeId,
    getEssentials: () => essentials
});
const { openTrip } = window.PACKMATE_CHECKLIST_CONTROLLER.createController({
    displayTrip,
    displayDestination,
    category,
    $,
    renderItems,
    renderPersonal,
    renderMissed,
    progressUI: (...args) => progressUI(...args),
    view,
    applyAccess: () => {
        applyAccess();
        if (dataState.mode === 'guest-preview' && dataState.status === 'unauthenticated' && getGuestDeleteSession()) {
            el.tasks.querySelectorAll('[data-item-kind="task"]').forEach(node => node.disabled = false);
            el.packing.querySelectorAll('[data-item-kind="packing"]').forEach(node => node.disabled = false);
        }
        scheduleCloudPackingCheckAccess();
    },
    el,
    setActiveId: value => { activeId = value; }
});
const { progressUI, refreshChecklistUi } = window.PACKMATE_CHECKLIST_PROGRESS.createProgress({
    displayTrip,
    percent,
    $,
    $$,
    getActiveId: () => activeId
});
function saveCurrent() { if (!canMutate()) return false; const t = trips.find(x => x.id === activeId); if (!t) return false; t.updatedAt = Date.now(); return persist() } function addItem(e) {
        e.preventDefault();
        const name = el.addInput.value.trim();
        if (!name) { toast('추가할 준비물 이름을 입력해 주세요.'); return }
        if (!canMutate()) {
            const session = window.PACKMATE_PREVIEW_SESSION, trip = displayTrip(activeId);
            if (!trip) { readonlyNotice(); return }
            if (trip.packing.some(x => key(x.name) === key(name))) { toast('같은 이름의 준비물이 이미 있어요.'); el.addInput.focus(); return }
            if (session?.isActive()) {
                if (session.addItem(name)) { el.addInput.value = ''; el.essential.checked = false; toast('체험 미리보기예요. 입력 내용과 추천 결과는 저장되지 않습니다.') }
                return;
            }
            if (cloudPackingCheckAllowed(activeId)) {
                void updateCloudChecklist({ type: 'packing-add', name }).then(saved => {
                    if (saved) { el.addInput.value = ''; el.essential.checked = false; }
                });
                return;
            }
            readonlyNotice();
            return;
        }
        const t = trips.find(x => x.id === activeId); if (!t) return toast('현재 일정을 찾을 수 없어요. 목록에서 다시 열어 주세요.'); if (t.packing.some(x => key(x.name) === key(name))) { toast('같은 이름의 준비물이 이미 있어요.'); el.addInput.focus(); return } const before = trips, updated = { ...t, packing: [...t.packing, add(name, '이번 일정에서 직접 추가한 준비물', true, 'direct')], updatedAt: Date.now() }; trips = trips.map(x => x.id === activeId ? updated : x); if (!persist()) { trips = before; return } let essentialOK = true; if (el.essential.checked && !essentials.some(x => key(x.name) === key(name))) { const old = essentials; essentials = [...essentials, { id: id(), name }]; if (!save(ESSENTIALS, essentials)) { essentials = old; essentialOK = false } } el.addInput.value = ''; el.essential.checked = false; renderItems(el.packing, updated.packing, 'packing'); renderPersonal(); progressUI(); updateHome(); toast(essentialOK ? '준비물을 목록에 추가하고 저장했어요.' : '준비물은 추가했지만 개인 필수품 저장은 실패했어요.');
    }
    function removeTrip(tripId) { if (!canMutate()) { readonlyNotice(); return } const t = trips.find(x => x.id === tripId); if (!t || !confirm(`“${t.name}” 일정을 삭제할까요? 삭제한 일정은 복구할 수 없습니다.`)) return; const old = trips; trips = trips.filter(x => x.id !== tripId); if (!persist()) { trips = old; return } updateHome(); if (activeId === tripId) home(); toast('일정을 삭제했어요.') }
    function sameGuestDeleteState(expected) {
        const current = getGuestDeleteSession();
        return dataState.mode === 'guest-preview' && dataState.status === 'unauthenticated' &&
            !!expected && !!current && expected.accountGeneration === current.accountGeneration &&
            expected.authGeneration === current.authGeneration;
    }
    function removeGuestTrip(tripId) {
        const session = getGuestDeleteSession();
        const trip = trips.find(value => value?.id === tripId);
        const deletingOpenTrip = activeId === tripId && !el.checkView.hidden;
        if (!session || !trip) { readonlyNotice(); return }
        if (!confirm(`“${trip.name}” 일정을 삭제할까요? 삭제한 일정은 복구할 수 없습니다.`)) return;
        if (!sameGuestDeleteState(session)) return;
        const result = deleteGuestTrip(tripId, session);
        if (!result?.ok) {
            if (result?.reason !== 'accountChanged') toast('로컬 일정을 삭제하지 못했어요. 저장 상태를 확인해 주세요.');
            return;
        }
        const expectedIds = new Set(trips.filter(value => value.id !== tripId).map(value => value.id));
        if (!sameGuestDeleteState(session) || !Array.isArray(result.trips) ||
            result.trips.length !== expectedIds.size ||
            result.trips.some(value => !value || !expectedIds.has(value.id))) return;
        let loaded;
        try { loaded = result.trips.map(value => freeze(normalize(clone(value)))); }
        catch (_) { return }
        if (!sameGuestDeleteState(session) || loaded.some(value => !expectedIds.has(value.id))) return;
        trips = Object.freeze(loaded);
        accountMessage = trips.length ? '' : '이 브라우저에 저장된 로컬 일정이 없어요.';
        if (deletingOpenTrip) { activeId = null; home() }
        else updateHome();
        toast('로컬 일정을 삭제했어요.');
    }
    function changeGuestItem(itemKind, itemId, done) {
        const listKey = itemKind === 'task' ? 'tasks' : itemKind === 'packing' ? 'packing' : null;
        const session = getGuestDeleteSession(), trip = trips.find(value => value?.id === activeId), item = listKey ? trip?.[listKey]?.find(value => value?.id === itemId) : null;
        if (!session || !trip || !item || typeof done !== 'boolean' || Boolean(item.done) === done || !sameGuestDeleteState(session)) return false;
        const result = updateGuestItemDone(trip.id, itemKind, item.id, done, Boolean(item.done), session);
        if (!result?.ok || !sameGuestDeleteState(session) || !Array.isArray(result.trips) || result.trips.length !== trips.length) return false;
        const expectedIds = new Set(trips.map(value => value.id));
        if (result.trips.some(value => !value || !expectedIds.has(value.id))) return false;
        let loaded;
        try { loaded = result.trips.map(value => freeze(normalize(clone(value)))); }
        catch (_) { return false }
        const savedItem = loaded.find(value => value.id === trip.id)?.[listKey]?.find(value => value.id === item.id);
        if (!sameGuestDeleteState(session) || Boolean(savedItem?.done) !== done) return false;
        trips = Object.freeze(loaded);
        openTrip(trip.id, { noHistory: true, keepScroll: true });
        toast('변경 내용을 이 브라우저에 저장했어요.', 'success');
        return true;
    }
    function sameCloudDeleteAccount(userId, accountGeneration, authGeneration) {
        const account = window.PACKMATE_ACCOUNT_STATE?.getState?.();
        const auth = window.PACKMATE_AUTH?.getState?.();
        return dataState.mode === 'cloud-readonly' && dataState.status === 'ready' &&
            dataState.userId === userId && dataState.generation === accountGeneration &&
            account?.status === 'ready' && account.userId === userId && account.generation === accountGeneration &&
            auth?.status === 'ready' && auth.user?.id === userId && auth.generation === authGeneration;
    }
    function cloudPackingCheckKey(userId, accountGeneration, tripId) {
        return `${userId}\u0000${accountGeneration}\u0000${tripId}`;
    }
    function cloudPackingCheckContext(tripId = activeId) {
        if (dataState.mode !== 'cloud-readonly' || dataState.status !== 'ready' ||
            typeof tripId !== 'string' || !tripId || typeof dataState.userId !== 'string' ||
            !dataState.userId || !Number.isSafeInteger(dataState.generation)) return null;
        const auth = window.PACKMATE_AUTH?.getState?.();
        if (auth?.status !== 'ready' || auth.user?.id !== dataState.userId ||
            !Number.isSafeInteger(auth.generation)) return null;
        const record = getCloudTripRecord(tripId, dataState.userId, dataState.generation);
        if (!record || !sameCloudDeleteAccount(dataState.userId, dataState.generation, auth.generation)) return null;
        const lockKey = cloudPackingCheckKey(dataState.userId, dataState.generation, tripId);
        return { userId: dataState.userId, accountGeneration: dataState.generation, authGeneration: auth.generation, tripId, record, lockKey };
    }
    function cloudPackingCheckAllowed(tripId = activeId) {
        const context = cloudPackingCheckContext(tripId);
        return Boolean(context && !cloudPackingCheckLocks.has(context.lockKey) &&
            !cloudPackingCheckUncertain.has(context.lockKey) &&
            typeof window.PACKMATE_CLOUD_WRITE?.updateTrip === 'function' &&
            typeof window.PACKMATE_ACCOUNT_TRIPS?.refresh === 'function');
    }
    function syncCloudPackingCheckAccess() {
        if (dataState.mode !== 'cloud-readonly') {
            if (window.PACKMATE_APP_DATA.canUpdateGuestChecklist('packing')) {
                el.packing.querySelectorAll('[data-item-kind="packing"][data-item-id]').forEach(control => { control.disabled = false; });
            }
            return;
        }
        const enabled = cloudPackingCheckAllowed(activeId);
        el.packing.querySelectorAll('[data-item-kind="packing"][data-item-id], [data-quantity-step], [data-mark-missed], [data-edit-item], [data-delete-item]').forEach(control => {
            control.disabled = !enabled;
        });
        el.tasks.querySelectorAll('[data-item-kind="task"][data-item-id]').forEach(control => { control.disabled = !enabled; });
        el.missed.querySelectorAll('[data-remove-missed]').forEach(control => { control.disabled = !enabled; });
        if (el.addForm) {
            el.addForm.hidden = !enabled;
            el.addForm.querySelectorAll('input,button').forEach(control => { control.disabled = !enabled || control === el.essential; });
        }
    }
    function scheduleCloudPackingCheckAccess() {
        syncCloudPackingCheckAccess();
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(syncCloudPackingCheckAccess);
    }
    function applyCloudTripRefresh(refreshed, context, expectedRevision = null) {
        if (!sameCloudDeleteAccount(context.userId, context.accountGeneration, context.authGeneration) ||
            !refreshed?.ok || refreshed.userId !== context.userId ||
            refreshed.generation !== context.accountGeneration || !Array.isArray(refreshed.trips)) return false;
        const row = refreshed.trips.find(value => value?.tripId === context.tripId && value.payload?.id === context.tripId);
        if (!row || !Number.isSafeInteger(row.revision) || row.revision < 1 ||
            (expectedRevision !== null && row.revision !== expectedRevision)) return false;
        let loaded;
        try { loaded = refreshed.trips.map(value => freeze(normalize(clone(value.payload)))); }
        catch (_) { return false; }
        if (loaded.some((trip, index) => !trip || typeof trip.id !== 'string' || !trip.id ||
            refreshed.trips[index]?.tripId !== trip.id) ||
            !sameCloudDeleteAccount(context.userId, context.accountGeneration, context.authGeneration)) return false;
        trips = Object.freeze(loaded);
        accountMessage = trips.length ? '' : '이 계정에 저장된 일정이 없어요.';
        updateHome();
        openTrip(context.tripId, { noHistory: true, keepScroll: true });
        return true;
    }
    function applyCloudChecklistOperation(next, operation) {
        if (!operation || typeof operation !== 'object' || Array.isArray(operation)) return null;
        const exact = (list, itemId) => Array.isArray(list)
            ? list.filter(item => item && String(item.id) === itemId)
            : [];
        if (operation.type === 'packing-field') {
            const matches = exact(next.packing, operation.itemId);
            if (matches.length !== 1) return null;
            if (operation.field === 'done' && typeof operation.value === 'boolean') {
                if (!!matches[0].done === operation.value) return { action: '준비물 체크 상태', changed: false };
                matches[0].done = operation.value;
                return { action: '준비물 체크 상태', changed: true };
            }
            if (operation.field === 'quantity' && Number.isSafeInteger(operation.value) && operation.value >= 1) {
                if (matches[0].quantity === operation.value && matches[0].quantityEdited === true) return { action: '준비물 수량', changed: false };
                matches[0].quantity = operation.value;
                matches[0].quantityEdited = true;
                return { action: '준비물 수량', changed: true };
            }
            return null;
        }
        if (operation.type === 'packing-add') {
            const name = typeof operation.name === 'string' ? operation.name.trim() : '';
            if (!name || !Array.isArray(next.packing)) return null;
            if (next.packing.some(item => key(item?.name) === key(name))) return { error: 'duplicate' };
            const item = add(name, '이번 일정에서 직접 추가한 준비물', true, 'direct');
            if (next.packing.some(value => String(value?.id) === String(item.id))) return null;
            next.packing.push(item);
            return { action: '준비물 추가', changed: true };
        }
        if (operation.type === 'packing-rename') {
            const name = typeof operation.name === 'string' ? operation.name.trim() : '';
            const matches = exact(next.packing, operation.itemId);
            if (!name || matches.length !== 1) return null;
            if (matches[0].name === name) return { action: '준비물 이름 수정', changed: false };
            matches[0].name = name;
            return { action: '준비물 이름 수정', changed: true };
        }
        if (operation.type === 'packing-remove') {
            const matches = exact(next.packing, operation.itemId);
            if (matches.length !== 1) return null;
            next.packing = next.packing.filter(item => String(item?.id) !== operation.itemId);
            return { action: '준비물 삭제', changed: true };
        }
        if (operation.type === 'missed-add') {
            const matches = exact(next.packing, operation.itemId);
            if (matches.length !== 1 || (next.missedItems != null && !Array.isArray(next.missedItems))) return null;
            next.missedItems ||= [];
            let changed = !!matches[0].done;
            if (!next.missedItems.some(item => key(item?.name) === key(matches[0].name))) {
                const missed = { id: id(), name: matches[0].name, createdAt: Date.now() };
                if (next.missedItems.some(item => String(item?.id) === String(missed.id))) return null;
                next.missedItems.push(missed);
                changed = true;
            }
            matches[0].done = false;
            return { action: '누락 기록', changed };
        }
        if (operation.type === 'missed-remove') {
            const matches = exact(next.missedItems, operation.itemId);
            if (matches.length !== 1) return null;
            next.missedItems = next.missedItems.filter(item => String(item?.id) !== operation.itemId);
            return { action: '누락 기록 삭제', changed: true };
        }
        if (operation.type === 'task-done') {
            const matches = exact(next.tasks, operation.itemId);
            if (matches.length !== 1 || typeof operation.done !== 'boolean') return null;
            if (!!matches[0].done === operation.done) return { action: '출발 전 할 일 체크 상태', changed: false };
            matches[0].done = operation.done;
            return { action: '출발 전 할 일 체크 상태', changed: true };
        }
        return null;
    }
    async function updateCloudChecklist(operation) {
        const context = cloudPackingCheckContext(activeId);
        if (!context || !operation || typeof operation !== 'object' ||
            cloudPackingCheckLocks.has(context.lockKey) || cloudPackingCheckUncertain.has(context.lockKey)) {
            if (activeId) openTrip(activeId, { noHistory: true, keepScroll: true });
            readonlyNotice();
            return false;
        }
        let next;
        try { next = clone(context.record.payload); }
        catch (_) {
            openTrip(context.tripId, { noHistory: true, keepScroll: true });
            toast('클라우드 일정의 안전한 복사본을 만들지 못해 변경하지 않았어요.');
            return false;
        }
        if (next.id !== context.tripId || next.createdAt !== context.record.payload.createdAt) {
            openTrip(context.tripId, { noHistory: true, keepScroll: true });
            toast('일정 ID 또는 생성일을 보존할 수 없어 변경하지 않았어요.');
            return false;
        }
        const mutation = applyCloudChecklistOperation(next, operation);
        if (!mutation) {
            openTrip(context.tripId, { noHistory: true, keepScroll: true });
            toast('변경할 항목의 ID를 정확히 확인할 수 없어 저장하지 않았어요.');
            return false;
        }
        if (mutation.error === 'duplicate') {
            openTrip(context.tripId, { noHistory: true, keepScroll: true });
            toast('같은 이름의 준비물이 이미 있어요.');
            return false;
        }
        const action = mutation.action;
        if (!mutation.changed) {
            openTrip(context.tripId, { noHistory: true, keepScroll: true });
            return true;
        }
        if (next.id !== context.record.payload.id || next.createdAt !== context.record.payload.createdAt) {
            openTrip(context.tripId, { noHistory: true, keepScroll: true });
            toast('일정 ID 또는 생성일을 보존할 수 없어 변경하지 않았어요.');
            return false;
        }
        cloudPackingCheckLocks.add(context.lockKey);
        applyAccess();
        scheduleCloudPackingCheckAccess();
        let keepUncertainLock = false;
        try {
            const writer = window.PACKMATE_CLOUD_WRITE, cloud = window.PACKMATE_ACCOUNT_TRIPS;
            if (typeof writer?.updateTrip !== 'function' || typeof cloud?.refresh !== 'function') {
                openTrip(context.tripId, { noHistory: true, keepScroll: true });
                toast(`클라우드 ${action} 저장 기능을 사용할 수 없어 변경하지 않았어요.`);
                return false;
            }
            if (!sameCloudDeleteAccount(context.userId, context.accountGeneration, context.authGeneration)) return false;
            let result;
            try {
                result = await writer.updateTrip(context.userId, context.accountGeneration,
                    context.authGeneration, context.tripId, context.record.revision, next);
            } catch (_) {
                result = { ok: false, reason: 'updateOutcomeUnknown' };
            }
            if (!sameCloudDeleteAccount(context.userId, context.accountGeneration, context.authGeneration)) return false;
            if (!result?.ok) {
                if (result?.reason === 'revisionConflict') {
                    let refreshed;
                    try { refreshed = await cloud.refresh(); } catch (_) { refreshed = null; }
                    if (applyCloudTripRefresh(refreshed, context)) {
                        toast(`다른 곳에서 일정이 변경되어 ${action}를 저장하지 않았어요. 최신 상태를 표시합니다.`);
                    } else {
                        keepUncertainLock = true;
                        cloudPackingCheckUncertain.add(context.lockKey);
                        openTrip(context.tripId, { noHistory: true, keepScroll: true });
                        toast(`revision 충돌 후 최신 상태를 확인하지 못해 ${action} 저장을 잠갔어요. 새로고침해 주세요.`);
                    }
                    return false;
                }
                if (result?.reason === 'updateOutcomeUnknown' || result?.reason === 'updateResultInvalid' ||
                    result?.updateCompleted === true) {
                    keepUncertainLock = true;
                    cloudPackingCheckUncertain.add(context.lockKey);
                    openTrip(context.tripId, { noHistory: true, keepScroll: true });
                    toast(`${action} 저장 결과를 확인할 수 없어 중복 저장을 잠갔어요. 새로고침해 주세요.`);
                    return false;
                }
                openTrip(context.tripId, { noHistory: true, keepScroll: true });
                if (result?.reason !== 'accountChanged') toast('클라우드에 저장하지 못했어요. 기존 상태를 유지합니다.', 'error');
                return false;
            }
            if (result.userId !== context.userId || result.tripId !== context.tripId ||
                result.revision !== context.record.revision + 1) {
                keepUncertainLock = true;
                cloudPackingCheckUncertain.add(context.lockKey);
                openTrip(context.tripId, { noHistory: true, keepScroll: true });
                toast(`${action} 저장 응답을 확인할 수 없어 중복 저장을 잠갔어요. 새로고침해 주세요.`);
                return false;
            }
            let refreshed;
            try { refreshed = await cloud.refresh(); } catch (_) { refreshed = null; }
            if (!applyCloudTripRefresh(refreshed, context, result.revision)) {
                keepUncertainLock = true;
                cloudPackingCheckUncertain.add(context.lockKey);
                if (sameCloudDeleteAccount(context.userId, context.accountGeneration, context.authGeneration)) {
                    openTrip(context.tripId, { noHistory: true, keepScroll: true });
                    toast(`${action} 저장은 확인됐지만 최신 revision을 재조회하지 못해 추가 저장을 잠갔어요. 새로고침해 주세요.`);
                }
                return false;
            }
            toast('변경 내용을 클라우드에 저장했어요.', 'success');
            return true;
        } finally {
            cloudPackingCheckLocks.delete(context.lockKey);
            if (!keepUncertainLock && sameCloudDeleteAccount(context.userId, context.accountGeneration, context.authGeneration)) {
                applyAccess();
                scheduleCloudPackingCheckAccess();
            }
        }
    }
    function updateCloudPackingItem(itemId, change) {
        const fields = change && typeof change === 'object' && !Array.isArray(change) ? Object.keys(change) : [];
        const field = fields.length === 1 ? fields[0] : '';
        const value = change?.[field];
        const valid = typeof itemId === 'string' && itemId &&
            (field === 'done' ? typeof value === 'boolean' :
                field === 'quantity' && Number.isSafeInteger(value) && value >= 1);
        return valid
            ? updateCloudChecklist({ type: 'packing-field', itemId, field, value })
            : Promise.resolve(false);
    }
    async function removeCloudTrip(tripId) {
        if (dataState.mode !== 'cloud-readonly' || cloudDeleteLocks.has(tripId) || cloudDeleteUncertain.has(tripId)) return;
        const userId = dataState.userId, accountGeneration = dataState.generation;
        const auth = window.PACKMATE_AUTH?.getState?.();
        if (!userId || !Number.isSafeInteger(accountGeneration) || auth?.status !== 'ready' ||
            auth.user?.id !== userId || !Number.isSafeInteger(auth.generation)) {
            toast('계정 인증 상태를 확인할 수 없어 삭제하지 않았어요.'); return;
        }
        const authGeneration = auth.generation;
        const record = getCloudTripRecord(tripId, userId, accountGeneration);
        if (!record || !sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) {
            toast('현재 계정의 일정 정보를 확인할 수 없어 삭제하지 않았어요. 목록을 새로고침해 주세요.'); return;
        }
        cloudDeleteLocks.add(tripId);
        applyAccess();
        updateHome();
        let keepUncertainLock = false;
        try {
            const name = typeof record.payload?.name === 'string' && record.payload.name.trim()
                ? record.payload.name.trim() : '이 일정';
            if (!confirm(`“${name}” 일정을 클라우드에서 삭제할까요? 삭제한 일정은 복구할 수 없습니다.`)) return;
            if (!sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) return;
            const confirmedRecord = getCloudTripRecord(tripId, userId, accountGeneration);
            if (!confirmedRecord || confirmedRecord.revision !== record.revision ||
                confirmedRecord.payload?.id !== tripId || !sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) {
                toast('일정 또는 revision이 변경되어 삭제하지 않았어요. 최신 목록을 다시 확인해 주세요.'); return;
            }
            const writer = window.PACKMATE_CLOUD_WRITE;
            if (typeof writer?.deleteTrip !== 'function') {
                toast('클라우드 삭제 기능을 사용할 수 없어 삭제하지 않았어요.'); return;
            }
            let result;
            try {
                result = await writer.deleteTrip(userId, accountGeneration, authGeneration, tripId, confirmedRecord.revision);
            } catch (_) {
                result = { ok: false, reason: 'deleteOutcomeUnknown' };
            }
            if (!sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) return;
            if (!result?.ok) {
                const reason = result?.reason;
                if (reason === 'revisionConflict') {
                    toast('일정이 다른 곳에서 변경되어 삭제하지 않았어요. 최신 목록을 다시 불러와 확인해 주세요.');
                } else if (reason === 'deleteOutcomeUnknown' || result?.deleteCompleted) {
                    keepUncertainLock = true;
                    cloudDeleteUncertain.add(tripId);
                    toast('삭제 결과를 확인할 수 없어요. 중복 삭제를 막기 위해 재시도를 잠갔습니다. 목록을 새로고침해 삭제 여부를 확인해 주세요.');
                } else if (reason === 'tripNotFoundOrForbidden') {
                    toast('일정을 찾을 수 없거나 삭제 권한을 확인할 수 없어요. 최신 목록을 새로고침해 주세요.');
                } else if (reason === 'permissionDenied' || reason === 'deleteNotAppliedOrForbidden') {
                    toast('삭제 권한이 없거나 삭제가 거부되었어요. 일정은 변경하지 않았습니다.');
                } else if (reason === 'accountChanged') {
                    return;
                } else {
                    toast('클라우드 일정 삭제에 실패했어요. 목록을 새로고침한 뒤 다시 확인해 주세요.');
                }
                return;
            }
            if (result.userId !== userId || result.tripId !== tripId || result.revision !== confirmedRecord.revision) {
                keepUncertainLock = true;
                cloudDeleteUncertain.add(tripId);
                toast('삭제 응답을 확인할 수 없어 재시도를 잠갔습니다. 목록을 새로고침해 삭제 여부를 확인해 주세요.');
                return;
            }
            if (!sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) return;
            const cloud = window.PACKMATE_ACCOUNT_TRIPS;
            if (typeof cloud?.refresh !== 'function') {
                toast('DELETE는 성공했지만 목록 재조회 기능을 사용할 수 없어요. 새로고침 후 확인해 주세요.'); return;
            }
            let refreshed;
            try { refreshed = await cloud.refresh(); } catch (_) { refreshed = null; }
            if (!sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) return;
            if (!refreshed?.ok || refreshed.userId !== userId || refreshed.generation !== accountGeneration || !Array.isArray(refreshed.trips)) {
                toast('DELETE는 성공했지만 클라우드 목록 재조회에 실패했어요. 새로고침 후 삭제 여부를 확인해 주세요.'); return;
            }
            if (refreshed.trips.some(row => row?.tripId === tripId)) {
                toast('DELETE 응답은 성공했지만 최신 목록에 일정이 남아 있어 화면을 갱신하지 않았어요. 최신 상태를 다시 확인해 주세요.'); return;
            }
            const loaded = refreshed.trips.map(row => freeze(normalize(clone(row.payload))));
            if (loaded.some((trip, index) => typeof trip.id !== 'string' || !trip.id || refreshed.trips[index]?.tripId !== trip.id) ||
                !sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) {
                toast('DELETE는 성공했지만 재조회 결과를 안전하게 확인하지 못했어요. 새로고침 후 확인해 주세요.'); return;
            }
            trips = Object.freeze(loaded);
            accountMessage = trips.length ? '' : '이 계정에 저장된 일정이 없어요.';
            if (activeId === tripId) {
                activeId = null;
                previewTrip = null;
                updateHome();
                view('home');
            } else {
                updateHome();
            }
            toast('클라우드 일정을 삭제하고 최신 목록을 확인했어요.');
        } finally {
            if (!keepUncertainLock) cloudDeleteLocks.delete(tripId);
            if (sameCloudDeleteAccount(userId, accountGeneration, authGeneration)) {
                applyAccess();
                if (!el.home.hidden) updateHome();
            }
        }
    }
    function requestTripDelete(tripId) {
        if (dataState.mode === 'cloud-readonly') { void removeCloudTrip(tripId); return }
        if (dataState.mode === 'guest-preview') { removeGuestTrip(tripId); return }
        removeTrip(tripId);
    }
    function activitySetup(activity) {
        if (!canPlan()) { readonlyNotice(); return }
        const host = $('.activity-manager') || $('#customActivityList');
        if (!host) return;
        const name = typeof activity === 'string' ? activity : activity.name;
        host.querySelector('.activity-editor')?.remove();
        const editor = document.createElement('section'); editor.className = 'activity-editor'; editor.innerHTML = `<div class="activity-editor-heading"><strong>${escape(name)} 준비물 설정</strong><button type="button" data-close-editor aria-label="준비물 설정 닫기">×</button></div><ul class="activity-supply-list"></ul>`;
        const form = document.createElement('form'); form.className = 'activity-supply-add'; form.innerHTML = '<label class="visually-hidden">준비물 이름</label><input maxlength="60" placeholder="예: 액션캠, 개인 공구"><button class="button button-secondary" type="submit">준비물 추가</button>';
        editor.append(form); host.append(editor);
        const list = $('ul', editor);
        function matches() { return definitions.filter(x => key(x.name) === key(name)) }
        function draw() { const entries = []; matches().forEach(owner => (owner.items || []).forEach((item, index) => entries.push({ owner, item, index }))); list.replaceChildren(...entries.map(({ owner, item, index }) => { const li = document.createElement('li'); li.innerHTML = `<span>${escape(item)}</span><button type="button" data-supply-owner="${escape(owner.id)}" data-supply-index="${index}" data-supply-edit>수정</button><button type="button" data-supply-owner="${escape(owner.id)}" data-supply-index="${index}" data-supply-remove>삭제</button>`; return li })) }
        draw();
        form.addEventListener('submit', e => { e.preventDefault(); const input = $('input', form), value = input.value.trim(); if (!value) return toast('추가할 준비물 이름을 입력해 주세요.'); if (supplies(name).some(x => key(x) === key(value))) return toast('기본 추천이나 이미 연결된 준비물과 같은 이름이에요.'); let def = matches()[0], created = false; if (!def) { def = { id: id(), name, items: [] }; definitions.push(def); created = true } def.items.push(value); if (canMutate() && !save(ACTIVITIES, { version: 1, activities: definitions })) { def.items.pop(); if (created) definitions = definitions.filter(x => x !== def); return } input.value = ''; draw(); updatePreview(); toast(`${name}에 준비물을 연결했어요.`) });
        editor.addEventListener('click', e => { if (e.target.closest('[data-close-editor]')) return editor.remove(); const edit = e.target.closest('[data-supply-edit]'), del = e.target.closest('[data-supply-remove]'); if (!edit && !del) return; const b = edit || del, owner = definitions.find(x => x.id === b.dataset.supplyOwner), index = Number(b.dataset.supplyIndex); if (!owner || !Number.isInteger(index) || !owner.items[index]) return; if (edit) { const value = prompt('준비물 이름을 수정해 주세요.', owner.items[index]); if (value === null || !value.trim()) return; const name2 = value.trim(); if (supplies(name).some(x => key(x) === key(name2) && key(x) !== key(owner.items[index]))) return toast('기본 추천이나 이미 연결된 준비물과 같은 이름은 사용할 수 없어요.'); const prev = owner.items[index]; owner.items[index] = name2; if (canMutate() && !save(ACTIVITIES, { version: 1, activities: definitions })) owner.items[index] = prev } else { const removed = owner.items.splice(index, 1)[0]; if (canMutate() && !save(ACTIVITIES, { version: 1, activities: definitions })) owner.items.splice(index, 0, removed) } draw(); updatePreview() });
    }
    activityField.addEventListener('click', updateActivitySearch); activityField.addEventListener('change', updateActivitySearch); activitySearch.addEventListener('input', updateActivitySearch);
    $('#newTripButton').addEventListener('click', () => openForm()); $('#savedNewTripButton').addEventListener('click', () => openForm()); $$('[data-start-purpose]').forEach(b => b.addEventListener('click', () => openForm('domestic', b.dataset.startPurpose))); $$('[data-trip-type]').forEach(b => b.addEventListener('click', () => { const v = el.dest.value; setType(b.dataset.tripType); if (el.type.value === b.dataset.tripType) el.dest.value = v; cityOptions(); updateDestinationPreview(); saveDraft() })); el.purpose.addEventListener('change', () => setPurpose(el.purpose.value)); el.lodging.addEventListener('change', () => { if (el.lodging.value === 'no') el.duration.value = '0'; else if (el.duration.value === '0') el.duration.value = '1'; updateEnd() }); el.duration.addEventListener('change', () => { el.lodging.value = Number(el.duration.value) ? 'yes' : 'no'; updateEnd() }); el.start.addEventListener('input', updateEnd); el.dest.addEventListener('input', () => { cityOptions(); updateDestinationPreview() }); el.dest.addEventListener('change', updateDestinationPreview); el.city.addEventListener('input', updateDestinationPreview); el.city.addEventListener('change', updateDestinationPreview); el.form.addEventListener('input', saveDraft); el.form.addEventListener('change', e => { if (e.target.matches('[name="activities"]')) { if (builtIn(e.target.value)) selectedBuiltIn = $$('input[name="activities"]:checked', el.form).filter(x => builtIn(x.value)).map(x => x.value); else { if (e.target.checked && !selectedCustom.some(x => key(x) === key(e.target.value))) selectedCustom.push(e.target.value); if (!e.target.checked) selectedCustom = selectedCustom.filter(x => key(x) !== key(e.target.value)) } updatePreview() } saveDraft() }); el.form.addEventListener('submit', submitTrip);[el.dest, el.city].forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); saveDraft() } })); $('#formBackButton').addEventListener('click', home); $('#checklistBackButton').addEventListener('click', home); $('#topHomeButton').addEventListener('click', home); $('#homeLink').addEventListener('click', e => { e.preventDefault(); home() }); $('#editTripButton').addEventListener('click', () => { const t = trips.find(x => x.id === activeId); if (t) openForm(t.type, t.purposeCategory, t) }); $('#deleteTripButton').addEventListener('click', () => activeId && requestTripDelete(activeId)); el.saved.addEventListener('click', e => { const del = e.target.closest('[data-delete-trip]'), open = e.target.closest('[data-open-trip]'); if (del) { e.stopPropagation(); requestTripDelete(del.dataset.deleteTrip) } else if (open) openTrip(open.dataset.openTrip) }); el.addForm.addEventListener('submit', addItem); el.addInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); el.addForm.requestSubmit() } });
    function changeItem(e) {
        const input = e.target.closest('[data-item-kind][data-item-id]');
        if (!input) return;
        if (!canMutate()) {
            e.preventDefault(); e.stopImmediatePropagation();
            const session = window.PACKMATE_PREVIEW_SESSION;
            if (session?.isActive() && session.changeItem(input.dataset.itemKind, input.dataset.itemId, input.checked)) return;
            if (changeGuestItem(input.dataset.itemKind, input.dataset.itemId, input.checked)) return;
            if (cloudPackingCheckAllowed(activeId)) {
                if (input.dataset.itemKind === 'packing') void updateCloudPackingItem(input.dataset.itemId, { done: input.checked });
                else void updateCloudChecklist({ type: 'task-done', itemId: input.dataset.itemId, done: input.checked });
                return;
            }
            input.checked = !input.checked;
            if (dataState.mode === 'guest-preview') toast('체크 변경을 저장하지 못했어요. 다시 시도해 주세요.', 'error');
            else readonlyNotice();
            return;
        }
        const t = trips.find(x => x.id === activeId); if (!t) return; const list = input.dataset.itemKind === 'task' ? t.tasks : t.packing, item = list.find(x => x.id === input.dataset.itemId); if (!item) return; if (input.dataset.itemKind === 'packing') e.stopImmediatePropagation(); item.done = input.checked; if (saveCurrent()) { const row = input.closest('.check-row'), label = input.closest('.check-item'); row?.classList.toggle('is-done', !!item.done); row?.classList.toggle('is-pending', !item.done); label?.classList.toggle('is-done', !!item.done); label?.classList.toggle('is-pending', !item.done); input.setAttribute('aria-label', `${item.name} ${item.done ? '완료됨' : '미완료'}`); progressUI(); updateHome(); if (input.dataset.itemKind === 'packing') refreshChecklistUi(); toast('변경 내용을 이 브라우저에 저장했어요.', 'success') }
    }
    el.packing.addEventListener('change', changeItem); el.tasks.addEventListener('change', changeItem);
    el.packing.addEventListener('click', e => {
        const miss = e.target.closest('[data-mark-missed]'), edit = e.target.closest('[data-edit-item]'), del = e.target.closest('[data-delete-item]');
        if (!miss && !edit && !del) return;
        if (!canMutate()) {
            e.preventDefault(); e.stopImmediatePropagation();
            const session = window.PACKMATE_PREVIEW_SESSION, trip = displayTrip(activeId), itemId = (miss || edit || del).dataset[miss ? 'markMissed' : edit ? 'editItem' : 'deleteItem'], item = trip?.packing.find(value => String(value.id) === String(itemId));
            if (!item) { readonlyNotice(); return }
            if (session?.isActive()) {
                if (miss) { session.markMissed(itemId); toast('체험 미리보기예요. 입력 내용과 추천 결과는 저장되지 않습니다.'); return }
                if (edit) { const name = prompt('준비물 이름을 수정해 주세요.', item.name); if (name !== null && name.trim()) session.renameItem(itemId, name.trim()); return }
                if (confirm(`“${item.name}” 준비물을 목록에서 삭제할까요?`)) session.removeItem(itemId);
                return;
            }
            if (!cloudPackingCheckAllowed(activeId)) { readonlyNotice(); return }
            if (miss) { void updateCloudChecklist({ type: 'missed-add', itemId }); return }
            if (edit) { const name = prompt('준비물 이름을 수정해 주세요.', item.name); if (name !== null && name.trim()) void updateCloudChecklist({ type: 'packing-rename', itemId, name: name.trim() }); return }
            if (confirm(`“${item.name}” 준비물을 목록에서 삭제할까요?`)) void updateCloudChecklist({ type: 'packing-remove', itemId });
            return;
        }
        const t = trips.find(x => x.id === activeId), item = t?.packing.find(x => x.id === (miss || edit || del).dataset[miss ? 'markMissed' : edit ? 'editItem' : 'deleteItem']); if (!t || !item) return; if (miss) { t.missedItems ||= []; if (!t.missedItems.some(x => key(x.name) === key(item.name))) t.missedItems.push({ id: id(), name: item.name, createdAt: Date.now() }); item.done = false; saveCurrent(); renderItems(el.packing, t.packing, 'packing'); renderMissed(); progressUI(); return toast('누락 기록을 저장했어요.') } if (edit) { const n = prompt('준비물 이름을 수정해 주세요.', item.name); if (n === null || !n.trim()) return; item.name = n.trim() } else { if (!confirm(`“${item.name}” 준비물을 목록에서 삭제할까요?`)) return; t.packing = t.packing.filter(x => x.id !== item.id) } if (saveCurrent()) { renderItems(el.packing, t.packing, 'packing'); progressUI(); updateHome() }
    });
    el.personal.addEventListener('click', e => { const b = e.target.closest('[data-remove-essential]'); if (!b) return; if (!canMutate()) { readonlyNotice(); return } const x = essentials.find(y => y.id === b.dataset.removeEssential); if (!x || !confirm(`개인 필수품 “${x.name}”을 삭제할까요?`)) return; const old = essentials; essentials = essentials.filter(y => y.id !== x.id); if (save(ESSENTIALS, essentials)) renderPersonal(); else essentials = old });
    el.missed.addEventListener('click', e => { const b = e.target.closest('[data-remove-missed]'); if (!b) return; if (!canMutate()) { const session = window.PACKMATE_PREVIEW_SESSION; if (session?.isActive()) session.removeMissed(b.dataset.removeMissed); else if (cloudPackingCheckAllowed(activeId)) void updateCloudChecklist({ type: 'missed-remove', itemId: b.dataset.removeMissed }); else readonlyNotice(); return } const t = trips.find(x => x.id === activeId); if (!t) return; t.missedItems = t.missedItems.filter(x => x.id !== b.dataset.removeMissed); saveCurrent(); renderMissed() });
    const newActivity = $('#newActivityInput'), addActivity = $('#addActivityButton');
    addActivity.addEventListener('click', () => { if (!canPlan()) { readonlyNotice(); return } const name = newActivity.value.trim(); if (!name) return toast('추가할 활동명을 입력해 주세요.'); const built = Object.keys(rules).find(x => key(x) === key(name)); if (built) { const checkbox = $$('input[name="activities"]', $('.activity-options')).find(x => key(x.value) === key(built)); if (checkbox && !checkbox.checked) { checkbox.checked = true; selectedBuiltIn = $$('input[name="activities"]:checked', el.form).filter(x => builtIn(x.value)).map(x => x.value); updatePreview(); saveDraft() } const settings = $$('[data-basic-activity-settings]', $('.activity-options')).find(x => key(x.dataset.basicActivitySettings) === key(built)); toast(`${built}는 기본 활동에 있어요. 해당 활동을 선택하고 준비물을 설정해 주세요.`); settings?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return } const existing = definitions.find(x => key(x.name) === key(name)); if (existing) { if (!selectedCustom.some(x => key(x) === key(existing.name))) selectedCustom.push(existing.name); renderActivities(); saveDraft(); const c = $$('input[name="activities"]', $('#customActivityList')).find(x => key(x.value) === key(existing.name)); c?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); c?.focus({ preventScroll: true }); toast(`${existing.name}은(는) 이미 사용자 활동으로 등록되어 있어요. 기존 활동을 선택했어요.`); return } const d = { id: id(), name, items: [] }; definitions.push(d); if (canMutate() && !save(ACTIVITIES, { version: 1, activities: definitions })) { definitions.pop(); return } newActivity.value = ''; selectedCustom.push(name); renderActivities(); saveDraft(); toast(canMutate() ? '활동을 추가했어요.' : '체험 활동을 추가했어요. 새로고침하면 사라집니다.') });
    newActivity.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addActivity.click() } });
    $('.activity-options').addEventListener('click', e => { const b = e.target.closest('[data-basic-activity-settings]'); if (b) activitySetup(b.dataset.basicActivitySettings) });
    $('#customActivityList').addEventListener('click', e => { const settings = e.target.closest('[data-activity-settings]'), edit = e.target.closest('[data-activity-edit]'), del = e.target.closest('[data-activity-remove]'); if (!settings && !edit && !del) return; if (!canPlan()) { readonlyNotice(); return } if (settings) { const d = definitions.find(x => x.id === settings.dataset.activitySettings); if (d) activitySetup(d.name); return } if (edit) { const d = definitions.find(x => x.id === edit.dataset.activityEdit); if (!d) return; const n = prompt('활동명을 수정해 주세요.', d.name); if (n === null || !n.trim()) return; const name = n.trim(); if ((builtIn(name) && key(name) !== key(d.name)) || definitions.some(x => x !== d && key(x.name) === key(name))) return toast('기본 활동이나 이미 등록된 활동과 같은 이름은 사용할 수 없어요. 해당 활동의 준비물 설정을 이용해 주세요.'); const before = d.name; d.name = name; if (canMutate() && !save(ACTIVITIES, { version: 1, activities: definitions })) { d.name = before; return } selectedCustom = selectedCustom.map(x => key(x) === key(before) ? name : x); renderActivities(); saveDraft() } if (del) { const d = definitions.find(x => x.id === del.dataset.activityRemove); if (!d || !confirm(`활동 “${d.name}” 설정을 삭제할까요?`)) return; const old = definitions, selected = selectedCustom; definitions = definitions.filter(x => x !== d); selectedCustom = selectedCustom.filter(x => key(x) !== key(d.name)); if (canMutate() && !save(ACTIVITIES, { version: 1, activities: definitions })) { definitions = old; selectedCustom = selected; return } renderActivities(); saveDraft() } });
    function clearPrivateUi(status, message, snapshot = null) {
        trips = Object.freeze([]); previewTrip = null; essentials = []; definitions = []; activeId = null; editingId = null; selectedCustom = []; selectedBuiltIn = [];
        dataState = Object.freeze({ mode: status === 'unauthenticated' ? 'guest-preview' : 'locked', status, userId: snapshot?.userId || null, generation: snapshot?.generation ?? null });
        accountMessage = message;
        el.saved.replaceChildren(); el.packing.replaceChildren(); el.tasks.replaceChildren(); el.missed.replaceChildren(); el.personal.replaceChildren();
        document.querySelector('.packmate-checklist-tools')?.remove(); document.querySelector('#weatherSeasonSummary')?.remove(); $('#tripMeta')?.replaceChildren();
        if ($('#checklistTitle')) $('#checklistTitle').textContent = '준비 현황';
        el.form.reset(); el.error.hidden = true; el.home.hidden = false; el.formView.hidden = true; el.checkView.hidden = true;
        if (!pendingTripId) { const url = new URL(location.href); url.searchParams.delete('trip'); history.replaceState({ ...history.state, packmateRoute: { view: 'home' } }, '', url) }
        updateHome();
    }
    function isCurrentGuestSnapshot(snapshot, requestNumber, accounts) {
        if (requestNumber !== accountRequest || snapshot?.status !== 'ready' || snapshot.userId) return false;
        try {
            const current = accounts?.getState?.();
            return current?.status === 'ready' && !current.userId && current.generation === snapshot.generation;
        } catch (_) {
            return false;
        }
    }
    function restoreGuestTrips(snapshot, requestNumber, accounts) {
        if (!isCurrentGuestSnapshot(snapshot, requestNumber, accounts)) return;
        clearPrivateUi('unauthenticated', '로그인하면 계정의 클라우드 일정을 볼 수 있어요.', snapshot);
        if (!isCurrentGuestSnapshot(snapshot, requestNumber, accounts)) return;

        const result = loadLocalTrips();
        if (!isCurrentGuestSnapshot(snapshot, requestNumber, accounts)) return;
        if (!result?.ok || !Array.isArray(result.trips)) {
            accountMessage = result?.reason === 'empty'
                ? '이 브라우저에 저장된 로컬 일정이 없어요.'
                : '로컬 일정을 읽지 못했어요. 기존 저장 데이터는 변경하지 않았습니다.';
            updateHome();
            restorePendingTrip();
            return;
        }

        let loaded;
        try {
            loaded = result.trips.map(trip => freeze(normalize(clone(trip))));
        } catch (_) {
            accountMessage = '로컬 일정 데이터를 안전하게 표시할 수 없어요. 기존 저장 데이터는 변경하지 않았습니다.';
            updateHome();
            restorePendingTrip();
            return;
        }
        if (loaded.some(trip => !trip || typeof trip.id !== 'string' || !trip.id.trim()) ||
            !isCurrentGuestSnapshot(snapshot, requestNumber, accounts)) {
            if (isCurrentGuestSnapshot(snapshot, requestNumber, accounts)) {
                accountMessage = '로컬 일정 데이터를 안전하게 표시할 수 없어요. 기존 저장 데이터는 변경하지 않았습니다.';
                updateHome();
                restorePendingTrip();
            }
            return;
        }
        trips = Object.freeze(loaded);
        accountMessage = trips.length ? '' : '이 브라우저에 저장된 로컬 일정이 없어요.';
        updateHome();
        restorePendingTrip();
        window.PACKMATE_I18N_FORM?.scheduleApply?.();
    }
    async function applyAccount(snapshot) {
        const keyNow = `${snapshot?.status || ''}:${snapshot?.userId || ''}:${snapshot?.generation ?? ''}`;
        if (keyNow === accountKey) return;
        accountKey = keyNow;
        const requestNumber = ++accountRequest;
        if (snapshot?.status !== 'ready') {
            clearPrivateUi(snapshot?.status === 'unavailable' ? 'error' : 'loading', snapshot?.status === 'unavailable' ? '계정 서비스를 사용할 수 없어요.' : '인증 상태를 확인하고 있어요.', snapshot);
            if (snapshot?.status === 'unavailable') restorePendingTrip();
            return;
        }
        if (!snapshot.userId) { restoreGuestTrips(snapshot, requestNumber, window.PACKMATE_ACCOUNT_STATE); return }
        clearPrivateUi('loading', '클라우드 일정을 불러오고 있어요.', snapshot);
        const accounts = window.PACKMATE_ACCOUNT_STATE, cloud = window.PACKMATE_ACCOUNT_TRIPS;
        if (!accounts || !cloud) { clearPrivateUi('error', '클라우드 일정 기능을 불러오지 못했어요.', snapshot); restorePendingTrip(); return }
        const request = accounts.captureRequest();
        try {
            const result = await cloud.load();
            if (requestNumber !== accountRequest || !accounts.isCurrentRequest(request) || !result?.ok || result.userId !== request.userId || result.generation !== request.generation) {
                if (requestNumber === accountRequest && accounts.isCurrentRequest(request)) { clearPrivateUi('error', '클라우드 일정을 불러오지 못했어요.', snapshot); restorePendingTrip() }
                return;
            }
            const loaded = result.trips.map(row => freeze(normalize(clone(row.payload))));
            if (loaded.some(trip => typeof trip.id !== 'string' || !trip.id)) { clearPrivateUi('error', '클라우드 일정 데이터 형식을 확인할 수 없어요.', snapshot); restorePendingTrip(); return }
            trips = Object.freeze(loaded);
            dataState = Object.freeze({ mode: 'cloud-readonly', status: 'ready', userId: request.userId, generation: request.generation });
            accountMessage = trips.length ? '' : '이 계정에 저장된 일정이 없어요.';
            updateHome();
            restorePendingTrip();
            window.PACKMATE_I18N_FORM?.scheduleApply?.();
        } catch (_) {
            if (requestNumber === accountRequest && accounts.isCurrentRequest(request)) { clearPrivateUi('error', '클라우드 일정을 불러오지 못했어요.', snapshot); restorePendingTrip() }
        }
    }
    window.addEventListener('popstate', e => {
        const r = e.state?.packmateRoute, urlTripId = new URL(location.href).searchParams.get('trip'), tripId = r?.view === 'checklist' ? r.tripId : urlTripId;
        if (dataState.status !== 'ready' && dataState.status !== 'unauthenticated') { pendingTripId = tripId || null; return }
        if (tripId && displayTrip(tripId)) openTrip(tripId, { noHistory: true });
        else {
            previewTrip = null; activeId = null;
            if (!canMutate()) { definitions = []; selectedCustom = []; selectedBuiltIn = [] }
            el.home.hidden = false; el.formView.hidden = true; el.checkView.hidden = true;
            const url = new URL(location.href); url.searchParams.delete('trip');
            history.replaceState({ ...history.state, packmateRoute: { view: 'home' } }, '', url);
            updateHome();
        }
    });
    function initialize() { clearPrivateUi('loading', '인증 상태를 확인하고 있어요.'); const accounts = window.PACKMATE_ACCOUNT_STATE; if (accounts && typeof accounts.subscribe === 'function') accounts.subscribe(applyAccount); else clearPrivateUi('error', '계정 상태를 확인할 수 없어요.') } initialize();
})();
