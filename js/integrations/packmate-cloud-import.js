/* Read-only local backup and cloud migration preview. This file never writes trip data to localStorage or Supabase. */
(() => {
  'use strict';

  const STORAGE_KEYS = Object.freeze({
    trips: 'packmate.trips.v1',
    essentials: 'packmate.essentials.v1',
    activities: 'packmate.activities.v1'
  });
  const languages = {
    ko: {
      button: '클라우드 비교', title: '기기 일정과 클라우드 비교', intro: '현재 로그인한 계정과 이 기기의 일정을 비교합니다. 아래 미리보기는 읽기 전용이며 데이터를 업로드하거나 변경하지 않습니다.',
      account: '로그인 계정', local: '이 기기에 저장된 일정', cloud: '클라우드 일정', matching: '동일 ID 일정', settings: '클라우드 개인 설정',
      settingsYes: '저장된 설정이 있습니다', settingsNo: '저장된 설정이 없습니다', preserve: '백업은 이전 전에 데이터를 확인하기 위한 안전 조치입니다. 기존 로컬 일정은 삭제되거나 변경되지 않습니다.',
      loading: '계정의 클라우드 정보를 읽는 중…', error: '클라우드 정보를 불러오지 못했습니다. 연결과 계정 권한을 확인한 뒤 다시 시도해 주세요. 이 기기의 로컬 기능과 데이터는 그대로 유지됩니다.',
      localError: '이 기기의 일정 목록을 읽지 못했습니다. 브라우저 저장소 상태를 확인해 주세요.',
      refresh: '다시 확인', close: '닫기', openError: '비교 화면을 열 수 없습니다.',
      backupTitle: '로컬 데이터 백업', backupDescription: '일정·개인 필수품·사용자 활동의 원본 저장 문자열과 검증 정보를 JSON 파일로 내려받습니다. 인증 정보는 포함하지 않습니다.',
      backupButton: '백업 다운로드', backupWorking: '백업 확인 및 파일 준비 중…', backupDone: '백업 파일 다운로드를 시작했습니다.', backupFailed: '백업을 만들지 못했습니다. 브라우저의 다운로드 권한을 확인해 주세요.',
      backupReport: '백업 무결성 확인', keyTrips: '일정', keyEssentials: '개인 필수품', keyActivities: '사용자 활동', present: '존재', absent: '없음', valid: 'JSON 유효', invalid: 'JSON 오류', count: '개수', duplicates: '중복 ID', validationErrors: '검증 오류', checksum: 'SHA-256', checksumUnavailable: 'SHA-256 계산 불가', notAvailable: '해당 없음',
      previewTitle: '이전 미리보기', previewDescription: '로컬 원본과 로그인 계정의 클라우드 payload를 ID 및 JSON 내용으로 비교합니다. 이름·체크·수량·날씨·누락 이력은 변환하지 않습니다.',
      previewButton: '읽기 전용 미리보기', previewLoading: '일정 payload를 읽고 비교하는 중…', previewUnavailable: '현재 클라우드 응답에서 일정 payload를 확인할 수 없습니다. 기존 데이터는 변경하지 않았습니다.',
      newCount: '신규', sameCount: '동일 내용', conflictCount: '내용 충돌', errorCount: '데이터 오류', noRows: '비교할 로컬 일정이 없습니다.',
      rowNew: '신규', rowSame: '동일 내용', rowConflict: '내용 충돌', rowError: '데이터 오류', localDataIssues: '로컬 데이터 검증 오류', cloudDataIssues: '클라우드 데이터 검증 오류',
      invalidTripsRoot: '일정 저장값이 JSON 배열이 아닙니다.', missingId: '일정 ID가 없거나 유효하지 않습니다.', duplicateId: '일정 ID가 중복됩니다.', payloadInvalid: '저장 payload가 유효한 배열 또는 객체가 아닙니다.', cloudPayloadInvalid: '클라우드 payload가 유효하지 않거나 ID와 일치하지 않습니다.', cloudDuplicateId: '클라우드에서 같은 ID가 여러 번 조회되었습니다.',
      notComparable: '일정 데이터가 유효하지 않아 비교할 수 없습니다.', restoreNotice: '백업은 로컬 저장 원문을 보존하는 복구 자료입니다. 안전한 위치에 보관해 주세요.'
    },
    en: {
      button: 'Compare cloud', title: 'Compare device and cloud trips', intro: 'Compare this device with your signed-in account. The preview is read-only and does not upload or change data.',
      account: 'Signed-in account', local: 'Trips on this device', cloud: 'Cloud trips', matching: 'Trips with matching IDs', settings: 'Cloud personal settings',
      settingsYes: 'Settings are saved', settingsNo: 'No settings saved', preserve: 'A backup helps verify data before migration. Existing local trips will not be deleted or changed.',
      loading: 'Reading cloud information for this account…', error: 'Could not load cloud information. Check your connection and account access, then try again. Local features and data on this device remain unchanged.',
      localError: 'Could not read this device’s trip list. Check the browser storage state.',
      refresh: 'Check again', close: 'Close', openError: 'Could not open the comparison screen.',
      backupTitle: 'Local data backup', backupDescription: 'Download the original stored strings for trips, personal essentials, and custom activities with validation details as a JSON file. Authentication information is excluded.',
      backupButton: 'Download backup', backupWorking: 'Verifying backup and preparing file…', backupDone: 'The backup download has started.', backupFailed: 'Could not create the backup. Check your browser download permissions.',
      backupReport: 'Backup integrity check', keyTrips: 'Trips', keyEssentials: 'Personal essentials', keyActivities: 'Custom activities', present: 'Present', absent: 'Absent', valid: 'Valid JSON', invalid: 'JSON error', count: 'Count', duplicates: 'Duplicate IDs', validationErrors: 'Validation errors', checksum: 'SHA-256', checksumUnavailable: 'SHA-256 could not be calculated', notAvailable: 'Not available',
      previewTitle: 'Migration preview', previewDescription: 'Compare local originals with payloads belonging to the signed-in account by ID and JSON content. Names, check states, quantities, weather, and missed-item history are not transformed.',
      previewButton: 'Read-only preview', previewLoading: 'Reading and comparing trip payloads…', previewUnavailable: 'Trip payloads are unavailable in the current cloud response. No existing data was changed.',
      newCount: 'New', sameCount: 'Same content', conflictCount: 'Content conflict', errorCount: 'Data errors', noRows: 'There are no local trips to compare.',
      rowNew: 'New', rowSame: 'Same content', rowConflict: 'Content conflict', rowError: 'Data error', localDataIssues: 'Local data validation errors', cloudDataIssues: 'Cloud data validation errors',
      invalidTripsRoot: 'The stored trips value is not a JSON array.', missingId: 'A trip ID is missing or invalid.', duplicateId: 'A trip ID is duplicated.', payloadInvalid: 'The stored payload is not a valid array or object.', cloudPayloadInvalid: 'The cloud payload is invalid or does not match its ID.', cloudDuplicateId: 'The same ID was returned more than once by the cloud.',
      notComparable: 'Invalid trip data cannot be compared.', restoreNotice: 'Keep the backup in a safe place so it can be used to restore the original local data.'
    },
    tl: {
      button: 'Ihambing sa cloud', title: 'Ihambing ang iskedyul sa device at cloud', intro: 'Ihambing ang device na ito sa naka-log in na account. Read-only ang preview at hindi ito mag-a-upload o magbabago ng data.',
      account: 'Naka-log in na account', local: 'Mga iskedyul sa device na ito', cloud: 'Mga iskedyul sa cloud', matching: 'Mga iskedyul na magkapareho ang ID', settings: 'Mga personal na setting sa cloud',
      settingsYes: 'May naka-save na setting', settingsNo: 'Walang naka-save na setting', preserve: 'Nakakatulong ang backup upang masuri ang data bago ilipat. Hindi buburahin o babaguhin ang mga lokal na iskedyul.',
      loading: 'Binabasa ang impormasyon sa cloud para sa account na ito…', error: 'Hindi mabasa ang impormasyon sa cloud. Suriin ang koneksyon at access ng account, pagkatapos ay subukan muli. Hindi mababago ang mga lokal na feature at data sa device na ito.',
      localError: 'Hindi mabasa ang listahan ng iskedyul sa device na ito. Suriin ang browser storage.',
      refresh: 'Suriin muli', close: 'Isara', openError: 'Hindi mabuksan ang screen ng paghahambing.',
      backupTitle: 'Backup ng lokal na data', backupDescription: 'I-download bilang JSON file ang orihinal na nakaimbak na string ng mga iskedyul, personal na gamit, at custom na aktibidad kasama ang resulta ng pagsusuri. Hindi kasama ang impormasyon sa pagpapatunay.',
      backupButton: 'I-download ang backup', backupWorking: 'Sinusuri ang backup at inihahanda ang file…', backupDone: 'Nagsimula na ang pag-download ng backup.', backupFailed: 'Hindi nagawa ang backup. Suriin ang pahintulot sa pag-download ng browser.',
      backupReport: 'Pagsusuri ng integridad ng backup', keyTrips: 'Mga iskedyul', keyEssentials: 'Personal na gamit', keyActivities: 'Custom na aktibidad', present: 'Nariyan', absent: 'Wala', valid: 'Wastong JSON', invalid: 'Error sa JSON', count: 'Bilang', duplicates: 'Mga dobleng ID', validationErrors: 'Mga error sa pagsusuri', checksum: 'SHA-256', checksumUnavailable: 'Hindi makalkula ang SHA-256', notAvailable: 'Hindi available',
      previewTitle: 'Preview bago ilipat', previewDescription: 'Ihambing ang lokal na orihinal at mga payload ng naka-log in na account gamit ang ID at nilalaman ng JSON. Hindi babaguhin ang mga pangalan, tsek, dami, panahon, o tala ng mga nakalimutang gamit.',
      previewButton: 'Read-only na preview', previewLoading: 'Binabasa at inihahambing ang mga payload…', previewUnavailable: 'Hindi makuha ang mga payload sa kasalukuyang tugon ng cloud. Walang binagong dating data.',
      newCount: 'Bago', sameCount: 'Magkapareho ang nilalaman', conflictCount: 'Salungatan sa nilalaman', errorCount: 'Mga error sa data', noRows: 'Walang lokal na iskedyul na ihahambing.',
      rowNew: 'Bago', rowSame: 'Magkapareho ang nilalaman', rowConflict: 'Salungatan sa nilalaman', rowError: 'Error sa data', localDataIssues: 'Mga error sa pagsusuri ng lokal na data', cloudDataIssues: 'Mga error sa pagsusuri ng cloud data',
      invalidTripsRoot: 'Hindi JSON array ang nakaimbak na halaga ng iskedyul.', missingId: 'Wala o hindi wasto ang ID ng iskedyul.', duplicateId: 'Doble ang ID ng iskedyul.', payloadInvalid: 'Hindi wastong array o object ang nakaimbak na payload.', cloudPayloadInvalid: 'Hindi wasto ang cloud payload o hindi tugma ang ID.', cloudDuplicateId: 'Mahigit isang beses ibinalik ng cloud ang parehong ID.',
      notComparable: 'Hindi maihahambing ang hindi wastong data ng iskedyul.', restoreNotice: 'Itago ang backup sa ligtas na lugar upang maibalik ang orihinal na lokal na data kung kinakailangan.'
    }
  };

  const auth = window.PACKMATE_AUTH;
  if (!auth || typeof auth.subscribe !== 'function' || typeof auth.readCloudImportOverview !== 'function') return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pm-auth-button pm-cloud-compare-button';
  button.hidden = true;
  button.setAttribute('aria-haspopup', 'dialog');
  const dialog = document.createElement('dialog');
  dialog.className = 'pm-cloud-dialog';
  dialog.setAttribute('aria-labelledby', 'pmCloudTitle');
  dialog.innerHTML = `
    <div class="pm-cloud-dialog-header">
      <div><p class="pm-cloud-kicker">PACKMATE</p><h2 id="pmCloudTitle"></h2></div>
    </div>
    <p class="pm-cloud-intro" data-cloud-copy="intro"></p>
    <dl class="pm-cloud-metrics">
      <div><dt data-cloud-copy="account"></dt><dd data-cloud-value="account"></dd></div>
      <div><dt data-cloud-copy="local"></dt><dd data-cloud-value="local">—</dd></div>
      <div><dt data-cloud-copy="cloud"></dt><dd data-cloud-value="cloud">—</dd></div>
      <div><dt data-cloud-copy="matching"></dt><dd data-cloud-value="matching">—</dd></div>
      <div><dt data-cloud-copy="settings"></dt><dd data-cloud-value="settings">—</dd></div>
    </dl>
    <p class="pm-cloud-status" role="status" aria-live="polite"></p>
    <p class="pm-cloud-preserve" data-cloud-copy="preserve"></p>
    <section class="pm-cloud-section" aria-labelledby="pmCloudBackupTitle">
      <h3 id="pmCloudBackupTitle" data-cloud-copy="backupTitle"></h3>
      <p class="pm-cloud-section-copy" data-cloud-copy="backupDescription"></p>
      <button class="pm-cloud-backup" type="button" data-cloud-backup></button>
      <p class="pm-cloud-backup-status" role="status" aria-live="polite"></p>
      <div class="pm-cloud-backup-report" data-cloud-backup-report hidden></div>
      <p class="pm-cloud-restore-note" data-cloud-copy="restoreNotice"></p>
    </section>
    <section class="pm-cloud-section" aria-labelledby="pmCloudPreviewTitle">
      <h3 id="pmCloudPreviewTitle" data-cloud-copy="previewTitle"></h3>
      <p class="pm-cloud-section-copy" data-cloud-copy="previewDescription"></p>
      <button class="pm-cloud-preview" type="button" data-cloud-preview></button>
      <div class="pm-cloud-preview-result" data-cloud-preview-result hidden>
        <div class="pm-cloud-preview-counts" data-preview-counts></div>
        <p class="pm-cloud-preview-errors" data-preview-errors></p>
        <ul class="pm-cloud-preview-list" data-preview-list></ul>
      </div>
    </section>
    <div class="pm-cloud-actions">
      <button class="pm-cloud-refresh" type="button" data-cloud-refresh></button>
      <button class="pm-cloud-dismiss" type="button" data-cloud-close></button>
    </div>`;
  const authHost = document.getElementById('packmateAuth');
  if (!authHost) return;
  authHost.insertAdjacentElement('afterend', button);
  document.body.append(dialog);

  const valueNodes = Object.fromEntries([...dialog.querySelectorAll('[data-cloud-value]')].map(node => [node.dataset.cloudValue, node]));
  const statusNode = dialog.querySelector('.pm-cloud-status');
  const refreshButton = dialog.querySelector('[data-cloud-refresh]');
  const backupButton = dialog.querySelector('[data-cloud-backup]');
  const backupStatus = dialog.querySelector('.pm-cloud-backup-status');
  const backupReport = dialog.querySelector('[data-cloud-backup-report]');
  const previewButton = dialog.querySelector('[data-cloud-preview]');
  const previewResult = dialog.querySelector('[data-cloud-preview-result]');
  const previewCounts = dialog.querySelector('[data-preview-counts]');
  const previewErrors = dialog.querySelector('[data-preview-errors]');
  const previewList = dialog.querySelector('[data-preview-list]');
  let activeUser = auth.getCurrentUser();
  let activeIdentity = identityOf(activeUser);
  let generation = 0;
  let cachedResult = null;
  let previewSnapshot = null;
  let backupEntries = null;
  let busy = false;
  let previewBusy = false;
  let backupBusy = false;
  let statusKey = '';
  let backupStatusKey = '';
  let previewStatusKey = '';

  function language() {
    const selected = document.getElementById('packmateLanguageSelect')?.value || window.PACKMATE_I18N?.language || document.documentElement.lang || 'ko';
    return Object.hasOwn(languages, selected) ? selected : 'ko';
  }
  function text(key) { return languages[language()][key] || languages.ko[key] || ''; }
  function identityOf(user) { return user?.id ? `${user.id}\\u0000${user.email || ''}` : ''; }
  function setStatus(key) {
    statusKey = key;
    statusNode.textContent = key ? text(key) : '';
    statusNode.dataset.state = key === 'error' || key === 'localError' ? 'error' : key === 'loading' ? 'loading' : '';
  }
  function setBackupStatus(key) {
    backupStatusKey = key;
    backupStatus.textContent = key ? text(key) : '';
    backupStatus.dataset.state = key === 'backupFailed' ? 'error' : key === 'backupWorking' ? 'loading' : key === 'backupDone' ? 'success' : '';
  }
  function setPreviewStatus(key) {
    previewStatusKey = key;
    previewErrors.textContent = key ? text(key) : '';
  }
  function setValue(name, value) { valueNodes[name].textContent = value; }
  function updateCopy() {
    button.textContent = text('button');
    dialog.querySelector('#pmCloudTitle').textContent = text('title');
    dialog.querySelectorAll('[data-cloud-copy]').forEach(node => { node.textContent = text(node.dataset.cloudCopy); });
    dialog.querySelectorAll('[data-cloud-close]').forEach(node => {
      node.textContent = text('close');
      node.setAttribute('aria-label', text('close'));
    });
    refreshButton.textContent = text('refresh');
    backupButton.textContent = text('backupButton');
    previewButton.textContent = text('previewButton');
    if (statusKey) setStatus(statusKey);
    if (backupStatusKey) setBackupStatus(backupStatusKey);
    if (backupEntries) renderBackupReport(backupEntries);
    if (cachedResult && activeUser) {
      setValue('account', activeUser.email || activeUser.id);
      setValue('local', cachedResult.localCount === null ? '—' : String(cachedResult.localCount));
      setValue('cloud', String(cachedResult.cloudCount));
      setValue('matching', String(cachedResult.matchingCount));
      setValue('settings', text(cachedResult.settingsExists ? 'settingsYes' : 'settingsNo'));
    }
    if (previewSnapshot) renderPreview(previewSnapshot);
    else if (previewStatusKey) setPreviewStatus(previewStatusKey);
  }
  function resetDisplay() {
    cachedResult = null;
    previewSnapshot = null;
    backupEntries = null;
    busy = false;
    previewBusy = false;
    backupBusy = false;
    setValue('account', activeUser?.email || '—');
    setValue('local', '—');
    setValue('cloud', '—');
    setValue('matching', '—');
    setValue('settings', '—');
    setStatus('');
    setBackupStatus('');
    setPreviewStatus('');
    backupReport.hidden = true;
    backupReport.replaceChildren();
    previewResult.hidden = true;
    previewCounts.replaceChildren();
    previewList.replaceChildren();
    refreshButton.disabled = false;
    backupButton.disabled = false;
    previewButton.disabled = false;
  }
  function inspectRecords(parsed, kind) {
    let records;
    if (kind === 'trips' || kind === 'essentials') records = Array.isArray(parsed) ? parsed : null;
    else if (Array.isArray(parsed)) records = parsed;
    else records = Array.isArray(parsed?.activities) ? parsed.activities : null;
    if (!records) return { valid: false, count: null, duplicateIds: [], recordIds: [], recordIssues: [], error: kind === 'trips' ? 'invalidTripsRoot' : 'payloadInvalid' };
    const idIndexes = new Map();
    const recordIds = [];
    const missingIndexes = [];
    records.forEach((record, index) => {
      const id = typeof record?.id === 'string' && record.id.trim() ? record.id : '';
      recordIds.push(id);
      if (!id) { missingIndexes.push(index); return; }
      const indexes = idIndexes.get(id) || [];
      indexes.push(index);
      idIndexes.set(id, indexes);
    });
    const duplicateIds = [...idIndexes].filter(([, indexes]) => indexes.length > 1).map(([id]) => id);
    const recordIssues = missingIndexes.map(index => ({ index, reason: 'missingId' }));
    idIndexes.forEach((indexes, id) => {
      if (indexes.length > 1) indexes.forEach(index => recordIssues.push({ index, reason: 'duplicateId', id }));
    });
    return { valid: recordIssues.length === 0, count: records.length, duplicateIds, recordIds, recordIssues, error: recordIssues[0]?.reason || '' };
  }
  function parseRaw(raw, present, kind) {
    if (!present) return { present: false, jsonValid: null, valid: false, parsed: null, count: null, duplicateIds: [], recordIds: [], recordIssues: [], error: '' };
    try {
      const parsed = JSON.parse(raw);
      const inspection = inspectRecords(parsed, kind);
      return { present: true, jsonValid: true, parsed, ...inspection };
    } catch (_) {
      return { present: true, jsonValid: false, valid: false, parsed: null, count: null, duplicateIds: [], recordIds: [], recordIssues: [], error: 'payloadInvalid' };
    }
  }
  function readLocalSnapshot() {
    const rawValues = Object.create(null);
    const datasets = Object.create(null);
    const errors = [];
    for (const [kind, key] of Object.entries(STORAGE_KEYS)) {
      let raw;
      try { raw = window.localStorage.getItem(key); }
      catch (_) { return { ok: false, storageError: true }; }
      const present = raw !== null;
      rawValues[kind] = raw;
      datasets[kind] = parseRaw(raw, present, kind);
      if (present && !datasets[kind].valid) errors.push({ key, reason: datasets[kind].error, ids: datasets[kind].duplicateIds, recordIssues: datasets[kind].recordIssues });
    }
    const tripsData = datasets.trips;
    const trips = tripsData.present && Array.isArray(tripsData.parsed) ? tripsData.parsed : [];
    const tripIssues = [];
    trips.forEach((trip, index) => {
      const issue = !trip || typeof trip !== 'object' || Array.isArray(trip) || typeof trip.id !== 'string' || !trip.id.trim()
        ? 'missingId'
        : tripsData.duplicateIds.includes(trip.id) ? 'duplicateId' : '';
      if (issue) tripIssues.push({ index, reason: issue, trip });
    });
    return { ok: true, rawValues, datasets, trips, tripIssues, errors };
  }
  function isCurrentRequest(requestGeneration, expectedIdentity) {
    return generation === requestGeneration && activeIdentity === expectedIdentity && identityOf(auth.getCurrentUser()) === expectedIdentity;
  }
  async function sha256(value) {
    if (!window.crypto?.subtle || typeof TextEncoder !== 'function') throw new Error('SHA-256 unavailable');
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function validationFor(kind, snapshot) {
    const data = snapshot.datasets[kind];
    const errors = snapshot.errors.filter(error => error.key === STORAGE_KEYS[kind]);
    const validationErrorCount = !data.present ? null : data.jsonValid === false ? 1 : data.valid ? 0 : Math.max(data.recordIssues?.length || 0, 1);
    return { key: STORAGE_KEYS[kind], present: data.present, jsonValid: data.jsonValid, valid: data.valid, count: data.count, duplicateIds: data.duplicateIds, validationErrorCount, errors };
  }
  function renderBackupReport(entries) {
    backupEntries = entries;
    backupReport.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = text('backupReport');
    backupReport.append(heading);
    const list = document.createElement('ul');
    entries.forEach(entry => {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = text(entry.label);
      const details = document.createElement('span');
      const jsonStatus = entry.present ? text(entry.jsonValid ? 'valid' : 'invalid') : text('notAvailable');
      const count = `${text('count')}: ${entry.count === null ? text('notAvailable') : entry.count}`;
      const duplicateCount = `${text('duplicates')}: ${entry.present ? entry.duplicateIds.length : text('notAvailable')}`;
      const validationCount = `${text('validationErrors')}: ${entry.validationErrorCount === null ? text('notAvailable') : entry.validationErrorCount}`;
      const checksum = entry.sha256 || text('checksumUnavailable');
      details.textContent = `${entry.present ? text('present') : text('absent')} · ${jsonStatus} · ${count} · ${duplicateCount} · ${validationCount} · ${text('checksum')}: ${checksum}`;
      item.append(name, details);
      list.append(item);
    });
    backupReport.append(list);
    backupReport.hidden = false;
  }
  async function downloadBackup() {
    if (backupBusy) return;
    backupBusy = true;
    backupButton.disabled = true;
    setBackupStatus('backupWorking');
    try {
      const snapshot = readLocalSnapshot();
      if (!snapshot.ok) throw new Error('local storage unavailable');
      const labels = { trips: 'keyTrips', essentials: 'keyEssentials', activities: 'keyActivities' };
      const entries = await Promise.all(Object.keys(STORAGE_KEYS).map(async kind => {
        const raw = snapshot.rawValues[kind];
        const validation = validationFor(kind, snapshot);
        let digest = null;
        if (raw !== null) {
          try { digest = await sha256(raw); } catch (_) { digest = null; }
        }
        return { kind, label: labels[kind], raw, ...validation, sha256: digest };
      }));
      const datasets = Object.fromEntries(entries.map(entry => [entry.key, {
        present: entry.present,
        raw: entry.raw,
        sha256: entry.sha256,
        validation: {
          jsonValid: entry.jsonValid,
          recordCount: entry.count,
          duplicateIds: entry.duplicateIds,
          validationErrorCount: entry.validationErrorCount,
          errors: entry.errors.map(error => ({ reason: error.reason, ids: error.ids || [], recordIssues: error.recordIssues || [] }))
        }
      }]));
      const backup = {
        format: 'PACKMATE-LOCAL-BACKUP',
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        checksumAlgorithm: 'SHA-256 of the exact UTF-8 localStorage string',
        authenticationDataIncluded: false,
        datasets
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `packmate-local-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      anchor.hidden = true;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      renderBackupReport(entries);
      setBackupStatus('backupDone');
    } catch (_) {
      setBackupStatus('backupFailed');
    } finally {
      backupBusy = false;
      backupButton.disabled = false;
    }
  }
  function canonicalJson(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(item => canonicalJson(item) ?? 'null').join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  function isPlainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function comparePayloads(snapshot, cloudRows) {
    const rowsById = new Map();
    const cloudIssues = [];
    if (!Array.isArray(cloudRows)) return { unavailable: true, records: [], counts: { fresh: 0, same: 0, conflict: 0, error: 0 }, cloudIssues: [] };
    cloudRows.forEach((row, index) => {
      if (!row || typeof row.tripId !== 'string' || !row.tripId.trim()) {
        cloudIssues.push({ reason: 'cloudPayloadInvalid', index });
        return;
      }
      const entries = rowsById.get(row.tripId) || [];
      entries.push(row);
      rowsById.set(row.tripId, entries);
      if (!isPlainObject(row.payload) || row.payload.id !== row.tripId) cloudIssues.push({ reason: 'cloudPayloadInvalid', tripId: row.tripId, index });
    });
    rowsById.forEach((rows, tripId) => { if (rows.length > 1) cloudIssues.push({ reason: 'cloudDuplicateId', tripId }); });
    const localIssueByIndex = new Map(snapshot.tripIssues.map(issue => [issue.index, issue]));
    if (!snapshot.datasets.trips.valid) {
      const error = snapshot.datasets.trips.error || 'payloadInvalid';
      return { unavailable: false, records: [], counts: { fresh: 0, same: 0, conflict: 0, error: Math.max(1, snapshot.trips.length) }, cloudIssues, localRootError: error };
    }
    const counts = { fresh: 0, same: 0, conflict: 0, error: 0 };
    const records = [];
    const localIds = new Set(snapshot.trips.filter(trip => isPlainObject(trip) && typeof trip.id === 'string' && trip.id.trim()).map(trip => trip.id));
    snapshot.trips.forEach((trip, index) => {
      const localIssue = localIssueByIndex.get(index);
      if (localIssue) {
        counts.error += 1;
        records.push({ category: 'error', index, id: trip?.id || '', name: typeof trip?.name === 'string' ? trip.name : '', reason: localIssue.reason });
        return;
      }
      const cloudEntries = rowsById.get(trip.id) || [];
      if (!cloudEntries.length) {
        counts.fresh += 1;
        records.push({ category: 'fresh', index, id: trip.id, name: typeof trip.name === 'string' ? trip.name : '' });
        return;
      }
      if (cloudEntries.length !== 1) {
        counts.error += 1;
        records.push({ category: 'error', index, id: trip.id, name: typeof trip.name === 'string' ? trip.name : '', reason: 'cloudDuplicateId' });
        return;
      }
      const cloudRow = cloudEntries[0];
      const cloudPayload = cloudRow.payload;
      if (!isPlainObject(trip) || !isPlainObject(cloudPayload) || trip.id !== cloudRow.tripId || cloudPayload.id !== cloudRow.tripId) {
        counts.error += 1;
        records.push({ category: 'error', index, id: trip.id, name: typeof trip.name === 'string' ? trip.name : '', reason: 'cloudPayloadInvalid' });
        return;
      }
      if (canonicalJson(trip) === canonicalJson(cloudPayload)) {
        counts.same += 1;
        records.push({ category: 'same', index, id: trip.id, name: typeof trip.name === 'string' ? trip.name : '' });
      } else {
        counts.conflict += 1;
        records.push({ category: 'conflict', index, id: trip.id, name: typeof trip.name === 'string' ? trip.name : '' });
      }
    });
    counts.error += cloudIssues.filter(issue => !issue.tripId || !localIds.has(issue.tripId)).length;
    return { unavailable: false, records, counts, cloudIssues };
  }
  function renderPreview(snapshot) {
    if (!snapshot) return;
    previewResult.hidden = false;
    previewCounts.replaceChildren();
    previewList.replaceChildren();
    const counts = snapshot.comparison.counts;
    [['fresh', 'newCount'], ['same', 'sameCount'], ['conflict', 'conflictCount'], ['error', 'errorCount']].forEach(([key, labelKey]) => {
      const card = document.createElement('div');
      const label = document.createElement('span');
      const value = document.createElement('strong');
      label.textContent = text(labelKey);
      value.textContent = String(counts[key]);
      card.append(label, value);
      previewCounts.append(card);
    });
    const localErrorCount = snapshot.localErrors.length + (snapshot.comparison.localRootError ? 1 : 0);
    const cloudErrorCount = snapshot.comparison.cloudIssues.length;
    const errorParts = [];
    if (localErrorCount) errorParts.push(`${text('localDataIssues')}: ${localErrorCount}`);
    if (cloudErrorCount) errorParts.push(`${text('cloudDataIssues')}: ${cloudErrorCount}`);
    setPreviewStatus(snapshot.comparison.unavailable ? 'previewUnavailable' : '');
    if (!snapshot.comparison.unavailable && errorParts.length) previewErrors.textContent = errorParts.join(' · ');
    if (!snapshot.comparison.unavailable && !snapshot.comparison.records.length && !errorParts.length) previewErrors.textContent = text('noRows');
    snapshot.comparison.records.forEach(record => {
      const item = document.createElement('li');
      item.dataset.category = record.category;
      const label = document.createElement('strong');
      label.textContent = text(record.category === 'fresh' ? 'rowNew' : record.category === 'same' ? 'rowSame' : record.category === 'conflict' ? 'rowConflict' : 'rowError');
      const info = document.createElement('span');
      const title = record.name || (record.id ? `#${record.id}` : `#${record.index + 1}`);
      const reason = record.reason ? ` · ${text(record.reason)}` : '';
      info.textContent = `${title}${record.id ? ` (${record.id})` : ''}${reason}`;
      item.append(label, info);
      previewList.append(item);
    });
  }
  async function loadOverview(force = false) {
    if (!activeUser?.id || busy) return;
    if (!force && cachedResult) return;
    const expectedIdentity = activeIdentity;
    const requestGeneration = ++generation;
    const local = readLocalSnapshot();
    if (!local.ok) {
      setStatus('localError');
      return;
    }
    busy = true;
    refreshButton.disabled = true;
    previewButton.disabled = true;
    setStatus('loading');
    setValue('account', activeUser.email || activeUser.id);
    setValue('local', local.datasets.trips.count === null ? '—' : String(local.datasets.trips.count));
    setValue('cloud', '—');
    setValue('matching', '—');
    setValue('settings', '—');
    previewSnapshot = null;
    previewResult.hidden = true;
    try {
      const result = await auth.readCloudImportOverview(activeUser.id);
      if (!isCurrentRequest(requestGeneration, expectedIdentity)) return;
      if (!result?.ok || result.userId !== activeUser.id) {
        setStatus('error');
        return;
      }
      const cloudIds = new Set(result.tripIds);
      const matchingCount = new Set(local.trips.filter(trip => trip && typeof trip.id === 'string' && cloudIds.has(trip.id)).map(trip => trip.id)).size;
      cachedResult = { localCount: local.datasets.trips.count, cloudCount: result.tripIds.length, matchingCount, settingsExists: Boolean(result.settingsExists) };
      previewSnapshot = { local, result, comparison: comparePayloads(local, result.tripRows), localErrors: local.errors };
      setValue('cloud', String(cachedResult.cloudCount));
      setValue('matching', String(cachedResult.matchingCount));
      setValue('settings', text(cachedResult.settingsExists ? 'settingsYes' : 'settingsNo'));
      setStatus('');
      renderPreview(previewSnapshot);
    } catch (_) {
      if (isCurrentRequest(requestGeneration, expectedIdentity)) setStatus('error');
    } finally {
      if (isCurrentRequest(requestGeneration, expectedIdentity)) {
        busy = false;
        refreshButton.disabled = false;
        previewButton.disabled = false;
      }
    }
  }
  function runPreview() {
    if (!activeUser?.id || previewBusy) return;
    if (previewSnapshot) { renderPreview(previewSnapshot); return; }
    previewBusy = true;
    previewButton.disabled = true;
    setPreviewStatus('previewLoading');
    loadOverview(true).finally(() => {
      previewBusy = false;
      previewButton.disabled = false;
      if (previewSnapshot) renderPreview(previewSnapshot);
      else if (!busy && statusKey === 'error') setPreviewStatus('error');
    });
  }

  button.addEventListener('click', () => {
    if (!activeUser?.id) return;
    updateCopy();
    if (!dialog.open) {
      try { dialog.showModal(); }
      catch (_) { setStatus('openError'); return; }
    }
    loadOverview(true);
  });
  dialog.querySelectorAll('[data-cloud-close]').forEach(node => node.addEventListener('click', () => dialog.close()));
  refreshButton.addEventListener('click', () => loadOverview(true));
  backupButton.addEventListener('click', downloadBackup);
  previewButton.addEventListener('click', runPreview);
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    generation += 1;
    busy = false;
    previewBusy = false;
    refreshButton.disabled = false;
    previewButton.disabled = false;
  });
  const languageSelect = document.getElementById('packmateLanguageSelect');
  if (languageSelect) languageSelect.addEventListener('change', updateCopy);

  auth.subscribe(nextState => {
    const nextUser = nextState.user;
    const nextIdentity = identityOf(nextUser);
    if (nextIdentity !== activeIdentity) {
      generation += 1;
      busy = false;
      previewBusy = false;
      cachedResult = null;
      previewSnapshot = null;
      activeIdentity = nextIdentity;
      activeUser = nextUser;
      resetDisplay();
      if (dialog.open) dialog.close();
    } else {
      activeUser = nextUser;
    }
    button.hidden = nextState.status !== 'ready' || !activeUser?.id;
    if (dialog.open && activeUser) setValue('account', activeUser.email || activeUser.id);
    updateCopy();
  });
  updateCopy();
})();
