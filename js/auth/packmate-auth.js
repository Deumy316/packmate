/* PACKMATE email authentication with a narrowly-scoped, consent-gated trip migration API. */
(() => {
  'use strict';

  const config = window.PACKMATE_SUPABASE_CONFIG || {};
  const translations = {
    ko: {
      login: '로그인', logout: '로그아웃', signedIn: '로그인됨', accountMenu: '계정 메뉴', kicker: 'PACKMATE ACCOUNT', titleLogin: '이메일로 로그인', titleSignup: '계정 만들기',
      description: '로그인하면 계정의 클라우드 일정을 읽기 전용으로 볼 수 있어요. 자동 동기화와 클라우드 저장은 아직 지원하지 않습니다.',
      email: '이메일', emailPlaceholder: 'name@example.com', password: '비밀번호', passwordPlaceholder: '비밀번호 입력', passwordHint: '비밀번호는 Supabase Auth로만 전송되며 앱에서 저장하거나 기록하지 않습니다.', signupPasswordHint: '비밀번호는 최소 6자 이상 입력해 줘. Supabase Auth로만 전송되며 앱에서 저장하거나 기록하지 않습니다.',
      submitLogin: '로그인', submitSignup: '회원가입', switchToSignup: '계정이 없으신가요? 회원가입', switchToLogin: '이미 계정이 있으신가요? 로그인', close: '닫기',
      setupMissing: 'Supabase 설정이 필요합니다. supabase-config.js에 프로젝트 URL과 브라우저용 publishable/anon 키를 입력해 주세요. 비밀 키는 입력하지 마세요.',
      sdkLoading: '인증 서비스를 불러오는 중입니다…', sdkFailed: '인증 SDK를 불러오지 못했습니다. 네트워크 연결과 CDN 접근을 확인해 주세요. 기존 로컬 기능은 계속 사용할 수 있습니다.',
      configInvalid: 'Supabase 프로젝트 URL 또는 공개 키 설정을 확인해 주세요.',
      emailConfirm: '회원가입 요청을 받았습니다. 이메일로 전송된 확인 링크를 눌러 계정을 활성화한 뒤 로그인해 주세요.',
      confirmationLinkExpired: '이 이메일 인증 링크는 만료되었거나 이미 사용되었습니다. 가장 최근에 받은 인증 이메일의 링크를 사용하거나, 새 인증 메일을 받도록 다시 가입해 주세요.',
      confirmationLinkFailed: '이메일 인증 링크를 확인할 수 없습니다. 링크가 잘렸거나 유효하지 않을 수 있습니다. 새 인증 메일을 요청한 뒤 다시 시도해 주세요.',
      confirmationSuccess: '이메일 인증이 완료되어 로그인되었습니다.', confirmationComplete: '이메일 인증이 완료되었습니다. 로그인해 주세요.',
      signupSuccess: '회원가입이 완료되어 로그인되었습니다.', loginSuccess: '로그인되었습니다.', logoutSuccess: '로그아웃되었습니다. 기기의 기존 일정 데이터는 그대로 유지됩니다.',
      invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.', emailNotConfirmed: '이메일 확인이 필요합니다. 받은 편지함에서 확인 링크를 눌러 주세요.',
      emailExists: '이미 등록된 이메일입니다. 로그인하거나 비밀번호를 확인해 주세요.', invalidEmail: '올바른 이메일 주소를 입력해 주세요.', weakPassword: '비밀번호가 너무 짧거나 안전하지 않습니다. 6자 이상으로 입력해 주세요.',
      rateLimited: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', networkError: '인증 서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
      genericError: '요청을 처리하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.', logoutFailed: '로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      inactivityTitle: '곧 자동 로그아웃됩니다', inactivityDescription: '1분 후 자동으로 로그아웃됩니다. 계속 이용하려면 로그인 유지를 선택해 주세요.', keepSignedIn: '로그인 유지'
    },
    en: {
      login: 'Log in', logout: 'Log out', signedIn: 'Signed in', accountMenu: 'Account menu', kicker: 'PACKMATE ACCOUNT', titleLogin: 'Log in with email', titleSignup: 'Create an account',
      description: 'Log in to view your account’s cloud trips read-only. Automatic sync and cloud saving are not available yet.',
      email: 'Email', emailPlaceholder: 'name@example.com', password: 'Password', passwordPlaceholder: 'Enter your password', passwordHint: 'Your password is sent only to Supabase Auth. PACKMATE does not store or log it.', signupPasswordHint: 'Enter a password with at least 6 characters. It is sent only to Supabase Auth and is not stored or logged by PACKMATE.',
      submitLogin: 'Log in', submitSignup: 'Sign up', switchToSignup: 'New to PACKMATE? Create an account', switchToLogin: 'Already have an account? Log in', close: 'Close',
      setupMissing: 'Supabase setup is required. Add your project URL and browser publishable/anon key in supabase-config.js. Do not add a secret key.',
      sdkLoading: 'Connecting to the authentication service…', sdkFailed: 'The authentication SDK could not be loaded. Check your network and CDN access. Existing local features remain available.',
      configInvalid: 'Check the Supabase project URL and public key configuration.',
      emailConfirm: 'Your sign-up request was received. Follow the confirmation link sent to your email, then log in.',
      confirmationLinkExpired: 'This email confirmation link has expired or was already used. Use the newest link in your email, or sign up again to request a new confirmation email.',
      confirmationLinkFailed: 'The email confirmation link could not be verified. It may be incomplete or invalid. Request a new confirmation email and try again.',
      confirmationSuccess: 'Your email is confirmed and you are now signed in.', confirmationComplete: 'Your email is confirmed. Please log in.',
      signupSuccess: 'Your account was created and you are now signed in.', loginSuccess: 'You are now signed in.', logoutSuccess: 'You are signed out. Existing trip data on this device is unchanged.',
      invalidCredentials: 'The email or password is incorrect.', emailNotConfirmed: 'Please confirm your email using the link in your inbox before logging in.',
      emailExists: 'This email is already registered. Log in or check your password.', invalidEmail: 'Enter a valid email address.', weakPassword: 'Choose a stronger password with at least 6 characters.',
      rateLimited: 'Too many requests. Please wait a moment and try again.', networkError: 'Could not connect to the authentication server. Check your internet connection and try again.',
      genericError: 'The request could not be completed. Check your details and try again.', logoutFailed: 'Could not log out. Please try again shortly.',
      inactivityTitle: 'You will be signed out soon', inactivityDescription: 'You will be signed out automatically in 1 minute. Choose Stay signed in to continue.', keepSignedIn: 'Stay signed in'
    },
    tl: {
      login: 'Mag-log in', logout: 'Mag-log out', signedIn: 'Naka-log in', accountMenu: 'Menu ng account', kicker: 'PACKMATE ACCOUNT', titleLogin: 'Mag-log in gamit ang email', titleSignup: 'Gumawa ng account',
      description: 'Mag-log in upang makita nang read-only ang mga iskedyul sa cloud ng account. Hindi pa available ang awtomatikong sync at cloud saving.',
      email: 'Email', emailPlaceholder: 'name@example.com', password: 'Password', passwordPlaceholder: 'Ilagay ang password', passwordHint: 'Ipinapadala lang ang password sa Supabase Auth. Hindi ito iniimbak o itinatala ng PACKMATE.', signupPasswordHint: 'Maglagay ng password na may hindi bababa sa 6 na character. Ipinapadala lang ito sa Supabase Auth at hindi iniimbak o itinatala ng PACKMATE.',
      submitLogin: 'Mag-log in', submitSignup: 'Mag-sign up', switchToSignup: 'Wala pang account? Gumawa ng account', switchToLogin: 'May account na? Mag-log in', close: 'Isara',
      setupMissing: 'Kailangan ang Supabase setup. Ilagay ang project URL at browser publishable/anon key sa supabase-config.js. Huwag maglagay ng secret key.',
      sdkLoading: 'Kumokonekta sa serbisyo ng pagpapatunay…', sdkFailed: 'Hindi na-load ang authentication SDK. Suriin ang internet at access sa CDN. Patuloy na gagana ang mga lokal na feature.',
      configInvalid: 'Suriin ang Supabase project URL at public key configuration.',
      emailConfirm: 'Natanggap ang iyong sign-up request. Buksan ang confirmation link na ipinadala sa email bago mag-log in.',
      confirmationLinkExpired: 'Nag-expire na o nagamit na ang link ng kumpirmasyon. Gamitin ang pinakabagong link sa email o mag-sign up muli upang humiling ng bagong email.',
      confirmationLinkFailed: 'Hindi ma-verify ang link ng kumpirmasyon. Maaaring putol o hindi wasto ito. Humiling ng bagong confirmation email at subukan muli.',
      confirmationSuccess: 'Nakumpirma ang iyong email at naka-log in ka na.', confirmationComplete: 'Nakumpirma ang iyong email. Mag-log in ngayon.',
      signupSuccess: 'Nagawa ang account at naka-log in ka na.', loginSuccess: 'Naka-log in ka na.', logoutSuccess: 'Naka-log out ka na. Hindi binago ang dating iskedyul sa device na ito.',
      invalidCredentials: 'Hindi tama ang email o password.', emailNotConfirmed: 'Kumpirmahin muna ang email gamit ang link sa iyong inbox.',
      emailExists: 'Naka-rehistro na ang email na ito. Mag-log in o tingnan ang password.', invalidEmail: 'Maglagay ng wastong email address.', weakPassword: 'Gumamit ng mas ligtas na password na may hindi bababa sa 6 na character.',
      rateLimited: 'Masyadong maraming request. Maghintay sandali at subukan muli.', networkError: 'Hindi makakakonekta sa authentication server. Suriin ang internet at subukan muli.',
      genericError: 'Hindi nakumpleto ang request. Suriin ang inilagay at subukan muli.', logoutFailed: 'Hindi nakapag-log out. Subukan muli pagkalipas ng ilang sandali.',
      inactivityTitle: 'Malapit ka nang ma-log out', inactivityDescription: 'Awtomatiko kang mala-log out pagkalipas ng 1 minuto. Piliin ang Manatiling naka-log in upang magpatuloy.', keepSignedIn: 'Manatiling naka-log in'
    }
  };

  const INACTIVITY_WARNING_MS = 29 * 60 * 1000;
  const INACTIVITY_LOGOUT_MS = 30 * 60 * 1000;
  const INACTIVITY_KEY_PREFIX = 'packmate.auth.activity.v1:';
  const INACTIVITY_SESSION_KEY = 'packmate.auth.activity.current.v1';
  const AUTH_SESSION_KEY = 'packmate.auth.session.v1';
  const state = {
    client: null, session: null, sdk: 'loading', authInitialized: false, mode: 'login', busy: false, feedback: '', tone: '', lastFocus: null,
    authStateRevision: 0, authInitializationError: false, pendingEmailConfirmation: false, initialAuthLinkError: '', authTransition: '', authGeneration: 0
  };
  const authSubscribers = new Set();
  function identityOf(user) { return user?.id ? `${user.id}\\u0000${user.email || ''}` : ''; }
  function currentUser() { return state.authTransition ? null : state.session?.user || null; }
  function publicAuthState() {
    const user = currentUser();
    return Object.freeze({
      status: state.sdk === 'ready'
        ? (state.authInitializationError ? 'unavailable' : (state.authInitialized && !state.authTransition ? 'ready' : 'loading'))
        : 'unavailable',
      user: user?.id ? Object.freeze({ id: user.id, email: user.email || '' }) : null,
      generation: state.authGeneration
    });
  }
  function notifyAuthSubscribers() {
    const snapshot = publicAuthState();
    authSubscribers.forEach(callback => { try { callback(snapshot); } catch (_) { /* Keep auth UI and other subscribers independent. */ } });
  }
  const lang = () => {
    const selected = window.PACKMATE_I18N?.language || document.documentElement.lang;
    return Object.hasOwn(translations, selected) ? selected : 'ko';
  };
  const tr = key => translations[lang()][key] || translations.ko[key] || '';
  const host = document.getElementById('packmateAuth');
  if (!host) return;
  const accountToggle = document.getElementById('packmateAccountMenuButton');
  const accountMenu = document.getElementById('packmateAccountMenu');
  const mobileHeader = window.matchMedia('(max-width: 600px)');

  function closeAccountMenu({ restoreFocus = false } = {}) {
    if (!accountToggle || !accountMenu || !mobileHeader.matches) return;
    accountMenu.hidden = true;
    accountToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) accountToggle.focus();
  }
  function syncAccountMenu() {
    if (!accountToggle || !accountMenu) return;
    if (mobileHeader.matches) closeAccountMenu();
    else {
      accountMenu.hidden = false;
      accountToggle.setAttribute('aria-expanded', 'false');
    }
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'pm-auth-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <section class="pm-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="pmAuthTitle" aria-describedby="pmAuthDescription">
      <div class="pm-auth-dialog-header">
        <div><p class="pm-auth-kicker" data-auth-copy="kicker"></p><h2 id="pmAuthTitle"></h2></div>
        <button class="pm-auth-close" type="button" data-auth-close aria-label=""></button>
      </div>
      <p class="pm-auth-description" id="pmAuthDescription"></p>
      <p class="pm-auth-setup-note" id="pmAuthSetupNote" role="status" hidden></p>
      <p class="pm-auth-feedback" id="pmAuthFeedback" role="status" aria-live="polite"></p>
      <form class="pm-auth-form" id="pmAuthForm" novalidate>
        <label class="pm-auth-field" for="pmAuthEmail"><span data-auth-copy="email"></span><input id="pmAuthEmail" name="email" type="email" inputmode="email" autocomplete="email" required></label>
        <label class="pm-auth-field" for="pmAuthPassword"><span data-auth-copy="password"></span><input id="pmAuthPassword" name="password" type="password" autocomplete="current-password" minlength="6" required></label>
        <p class="pm-auth-password-hint" id="pmAuthPasswordHint"></p>
        <button class="pm-auth-submit" id="pmAuthSubmit" type="submit"></button>
      </form>
      <p class="pm-auth-mode-switch"><span id="pmAuthModePrompt"></span><button id="pmAuthModeSwitch" type="button"></button></p>
    </section>`;
  document.body.append(backdrop);

  const el = {
    title: backdrop.querySelector('#pmAuthTitle'), description: backdrop.querySelector('#pmAuthDescription'),
    setup: backdrop.querySelector('#pmAuthSetupNote'), feedback: backdrop.querySelector('#pmAuthFeedback'),
    form: backdrop.querySelector('#pmAuthForm'), email: backdrop.querySelector('#pmAuthEmail'), password: backdrop.querySelector('#pmAuthPassword'),
    passwordHint: backdrop.querySelector('#pmAuthPasswordHint'), submit: backdrop.querySelector('#pmAuthSubmit'),
    prompt: backdrop.querySelector('#pmAuthModePrompt'), modeSwitch: backdrop.querySelector('#pmAuthModeSwitch'), close: backdrop.querySelector('[data-auth-close]')
  };

  const inactivityBackdrop = document.createElement('div');
  inactivityBackdrop.className = 'pm-auth-backdrop pm-inactivity-backdrop';
  inactivityBackdrop.hidden = true;
  inactivityBackdrop.innerHTML = `
    <section class="pm-auth-dialog pm-inactivity-dialog" role="dialog" aria-modal="true" aria-labelledby="pmInactivityTitle" aria-describedby="pmInactivityDescription">
      <p class="pm-auth-kicker">PACKMATE ACCOUNT</p>
      <h2 id="pmInactivityTitle"></h2>
      <p class="pm-auth-description" id="pmInactivityDescription"></p>
      <div class="pm-inactivity-actions">
        <button class="pm-auth-submit" type="button" data-inactivity-keep></button>
        <button class="pm-auth-button pm-auth-logout" type="button" data-inactivity-logout></button>
      </div>
    </section>`;
  document.body.append(inactivityBackdrop);
  const inactivityEl = {
    title: inactivityBackdrop.querySelector('#pmInactivityTitle'),
    description: inactivityBackdrop.querySelector('#pmInactivityDescription'),
    keep: inactivityBackdrop.querySelector('[data-inactivity-keep]'),
    logout: inactivityBackdrop.querySelector('[data-inactivity-logout]')
  };
  let inactivityTimer = 0;
  let inactivityUserId = '';
  let lastActivityAt = 0;
  let inactivityEnding = false;
  let inactivityLastFocus = null;

  function activityStorageKey(userId) { return `${INACTIVITY_KEY_PREFIX}${encodeURIComponent(userId)}`; }
  function validActivityRecord(value) {
    const latestReasonableTime = Date.now() + 60 * 1000;
    return value && typeof value === 'object' && Number.isFinite(value.lastActivityAt) && value.lastActivityAt > 0 &&
      value.lastActivityAt <= latestReasonableTime && Number.isFinite(value.signedOutAt) && value.signedOutAt >= 0 &&
      value.signedOutAt <= latestReasonableTime;
  }
  function readActivityRecord(userId) {
    let record = null;
    try { record = JSON.parse(window.localStorage.getItem(activityStorageKey(userId)) || 'null'); } catch (_) { /* Fall back to this tab. */ }
    if (validActivityRecord(record)) return record;
    try {
      const sessionRecord = JSON.parse(window.sessionStorage.getItem(INACTIVITY_SESSION_KEY) || 'null');
      if (sessionRecord?.userId === userId && validActivityRecord(sessionRecord)) return sessionRecord;
    } catch (_) { /* In-memory timing still applies. */ }
    return null;
  }
  function writeActivityRecord(userId, record) {
    const serialized = JSON.stringify(record);
    try { window.localStorage.setItem(activityStorageKey(userId), serialized); } catch (_) { /* Cross-tab sync may be unavailable. */ }
    try { window.sessionStorage.setItem(INACTIVITY_SESSION_KEY, JSON.stringify({ userId, ...record })); } catch (_) { /* In-memory timing still applies. */ }
  }
  function renderInactivityWarning() {
    inactivityEl.title.textContent = tr('inactivityTitle');
    inactivityEl.description.textContent = tr('inactivityDescription');
    inactivityEl.keep.textContent = tr('keepSignedIn');
    inactivityEl.logout.textContent = tr('logout');
  }
  function hideInactivityWarning({ restoreFocus = false } = {}) {
    if (inactivityBackdrop.hidden) return;
    inactivityBackdrop.hidden = true;
    document.body.classList.remove('pm-inactivity-open');
    if (restoreFocus && inactivityLastFocus?.isConnected) inactivityLastFocus.focus();
    inactivityLastFocus = null;
  }
  function showInactivityWarning() {
    renderInactivityWarning();
    if (!inactivityBackdrop.hidden) return;
    inactivityLastFocus = document.activeElement;
    inactivityBackdrop.hidden = false;
    document.body.classList.add('pm-inactivity-open');
    window.setTimeout(() => inactivityEl.keep.focus(), 0);
  }
  function stopInactivity() {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = 0;
    inactivityUserId = '';
    lastActivityAt = 0;
    hideInactivityWarning();
  }
  function scheduleInactivityCheck() {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = 0;
    const userId = state.session?.user?.id;
    if (!userId || userId !== inactivityUserId || inactivityEnding || !lastActivityAt) return;
    const elapsed = Math.max(0, Date.now() - lastActivityAt);
    if (elapsed >= INACTIVITY_LOGOUT_MS) { void expireForInactivity(true); return; }
    if (elapsed >= INACTIVITY_WARNING_MS) showInactivityWarning();
    else hideInactivityWarning();
    const threshold = elapsed < INACTIVITY_WARNING_MS ? INACTIVITY_WARNING_MS : INACTIVITY_LOGOUT_MS;
    inactivityTimer = window.setTimeout(scheduleInactivityCheck, Math.max(50, threshold - elapsed + 20));
  }
  function recordActivity() {
    const userId = state.session?.user?.id;
    if (!userId || state.authTransition || inactivityEnding) return;
    inactivityUserId = userId;
    lastActivityAt = Date.now();
    writeActivityRecord(userId, { lastActivityAt, signedOutAt: 0 });
    hideInactivityWarning({ restoreFocus: true });
    scheduleInactivityCheck();
  }
  function startInactivity(userId, { reset = false } = {}) {
    if (!userId) { stopInactivity(); return; }
    window.clearTimeout(inactivityTimer);
    hideInactivityWarning();
    inactivityUserId = userId;
    const record = reset ? null : readActivityRecord(userId);
    if (record?.signedOutAt >= record?.lastActivityAt) { void expireForInactivity(false); return; }
    lastActivityAt = record?.lastActivityAt || Date.now();
    if (!record) writeActivityRecord(userId, { lastActivityAt, signedOutAt: 0 });
    scheduleInactivityCheck();
  }
  function publishSignedOut(userId) {
    if (!userId) return;
    writeActivityRecord(userId, { lastActivityAt: lastActivityAt || Date.now(), signedOutAt: Date.now() });
  }
  async function expireForInactivity(broadcast) {
    const userId = state.session?.user?.id;
    if (!userId || inactivityEnding) return;
    inactivityEnding = true;
    if (broadcast) publishSignedOut(userId);
    stopInactivity();
    state.authTransition = 'signing-out';
    state.session = null;
    state.authGeneration += 1;
    notifyAuthSubscribers();
    renderTopbar();
    try { await state.client?.auth.signOut({ scope: 'local' }); } catch (_) { /* Local state remains signed out at the deadline. */ }
    try { window.sessionStorage.removeItem(AUTH_SESSION_KEY); } catch (_) { /* In-memory auth state remains signed out. */ }
    state.authTransition = '';
    state.session = null;
    state.authInitialized = true;
    inactivityEnding = false;
    notifyAuthSubscribers();
    renderTopbar();
  }
  function handleMeaningfulActivity(event) {
    if (!state.session?.user?.id || inactivityEnding) return;
    if (!inactivityBackdrop.hidden && event.target?.closest?.('.pm-inactivity-backdrop')) return;
    if (event.type === 'keydown' && (event.repeat || ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key))) return;
    recordActivity();
  }
  function handleActivityStorage(event) {
    const userId = state.session?.user?.id;
    if (!userId || event.key !== activityStorageKey(userId) || !event.newValue) return;
    let record;
    try { record = JSON.parse(event.newValue); } catch (_) { return; }
    if (!validActivityRecord(record)) return;
    if (record.signedOutAt >= record.lastActivityAt) { void expireForInactivity(false); return; }
    if (record.lastActivityAt <= lastActivityAt) return;
    inactivityUserId = userId;
    lastActivityAt = record.lastActivityAt;
    try { window.sessionStorage.setItem(INACTIVITY_SESSION_KEY, JSON.stringify({ userId, ...record })); } catch (_) { /* Cross-tab record remains authoritative. */ }
    hideInactivityWarning({ restoreFocus: true });
    scheduleInactivityCheck();
  }

  function setFeedback(key, tone = '') {
    state.feedback = key;
    state.tone = tone;
    renderModal();
  }
  function configurationState() {
    const url = String(config.url || '').trim();
    const key = String(config.anonKey || '').trim();
    if (!url || !key) return 'missing';
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol) || (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname))) return 'invalid';
    } catch (_) { return 'invalid'; }
    return 'ready';
  }
  function setupMessage() {
    const configState = configurationState();
    if (configState === 'missing') return tr('setupMissing');
    if (configState === 'invalid') return tr('configInvalid');
    if (state.sdk === 'loading') return tr('sdkLoading');
    if (state.sdk === 'failed') return tr('sdkFailed');
    return '';
  }
  function renderTopbar() {
    host.replaceChildren();
    if (accountToggle) {
      accountToggle.setAttribute('aria-label', tr('accountMenu'));
      accountToggle.title = tr('accountMenu');
    }
    if (state.session?.user?.email) {
      const identity = document.createElement('span');
      identity.className = 'pm-auth-user';
      identity.title = `${tr('signedIn')}: ${state.session.user.email}`;
      const label = document.createElement('span');
      label.className = 'pm-auth-user-label';
      label.textContent = tr('signedIn');
      const email = document.createElement('span');
      email.className = 'pm-auth-email';
      email.textContent = state.session.user.email;
      identity.append(label, email);
      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'pm-auth-button pm-auth-logout';
      logout.textContent = tr('logout');
      logout.addEventListener('click', handleLogout);
      host.append(identity, logout);
    } else {
      const login = document.createElement('button');
      login.type = 'button';
      login.className = 'pm-auth-button';
      login.textContent = tr('login');
      login.addEventListener('click', openModal);
      host.append(login);
    }
  }
  function renderModal() {
    const signup = state.mode === 'signup';
    backdrop.querySelector('[data-auth-copy="kicker"]').textContent = tr('kicker');
    el.title.textContent = tr(signup ? 'titleSignup' : 'titleLogin');
    el.description.textContent = tr('description');
    el.close.textContent = '×';
    el.close.setAttribute('aria-label', tr('close'));
    backdrop.querySelector('[data-auth-copy="email"]').textContent = tr('email');
    backdrop.querySelector('[data-auth-copy="password"]').textContent = tr('password');
    el.email.placeholder = tr('emailPlaceholder');
    el.password.placeholder = tr('passwordPlaceholder');
    el.password.autocomplete = signup ? 'new-password' : 'current-password';
    el.passwordHint.textContent = tr(signup ? 'signupPasswordHint' : 'passwordHint');
    el.submit.textContent = tr(signup ? 'submitSignup' : 'submitLogin');
    el.prompt.textContent = signup ? tr('switchToLogin').split('?')[0] + '?' : tr('switchToSignup').split('?')[0] + '?';
    el.modeSwitch.textContent = signup ? tr('switchToLogin').slice(tr('switchToLogin').indexOf('?') + 1).trim() : tr('switchToSignup').slice(tr('switchToSignup').indexOf('?') + 1).trim();
    const setup = setupMessage();
    el.setup.textContent = setup;
    el.setup.hidden = !setup;
    el.feedback.textContent = state.feedback ? tr(state.feedback) : '';
    if (state.tone) el.feedback.dataset.tone = state.tone;
    else delete el.feedback.dataset.tone;
    const configured = configurationState() === 'ready' && state.sdk === 'ready' && Boolean(state.client);
    el.submit.disabled = state.busy || !configured;
    el.submit.setAttribute('aria-busy', String(state.busy));
    renderTopbar();
  }
  function openModal() {
    state.lastFocus = mobileHeader.matches ? accountToggle : document.activeElement;
    state.mode = 'login';
    state.feedback = '';
    state.tone = '';
    renderModal();
    backdrop.hidden = false;
    document.body.classList.add('pm-auth-open');
    window.setTimeout(() => el.email.focus(), 0);
  }
  function showAuthFeedback(key, tone) {
    state.mode = 'login';
    state.feedback = key;
    state.tone = tone;
    renderModal();
    backdrop.hidden = false;
    document.body.classList.add('pm-auth-open');
  }
  function closeModal() {
    backdrop.hidden = true;
    document.body.classList.remove('pm-auth-open');
    if (state.lastFocus?.isConnected) state.lastFocus.focus();
  }
  function classifyError(error, fallback = 'genericError') {
    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();
    if (code.includes('otp_expired') || /email link is invalid|link has expired|token has expired|already been used/.test(message)) return 'confirmationLinkExpired';
    if (code.includes('invalid_credentials') || message.includes('invalid login credentials') || message.includes('invalid credentials')) return 'invalidCredentials';
    if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) return 'emailNotConfirmed';
    if (code.includes('user_already_exists') || message.includes('already registered') || message.includes('user already registered')) return 'emailExists';
    if (code.includes('weak_password') || message.includes('password should be') || message.includes('password is too')) return 'weakPassword';
    if (code.includes('invalid_email') || message.includes('invalid email')) return 'invalidEmail';
    if (code.includes('rate_limit') || message.includes('too many requests') || message.includes('rate limit')) return 'rateLimited';
    if (error?.name === 'AuthRetryableFetchError' || message.includes('failed to fetch') || message.includes('network')) return 'networkError';
    return fallback;
  }
  function getConfirmationRedirectUrl() {
    const redirect = new URL(window.location.pathname, window.location.origin);
    if (['localhost', '127.0.0.1'].includes(redirect.hostname)) redirect.hostname = '127.0.0.1';
    redirect.search = '';
    redirect.hash = '';
    return redirect.href;
  }
  function inspectAuthCallbackUrl() {
    let url;
    try { url = new URL(window.location.href); } catch (_) { return { errorKey: '', emailConfirmation: false }; }
    const query = new URLSearchParams(url.search);
    const fragment = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
    const params = [query, fragment];
    const read = name => params.map(part => part.get(name)).find(value => value !== null) || '';
    const hasError = params.some(part => ['error', 'error_code', 'error_description'].some(key => part.has(key)));
    const callbackType = read('type').toLowerCase();
    const emailConfirmation = callbackType === 'signup' || callbackType === 'email';
    if (!hasError) return { errorKey: '', emailConfirmation };

    const errorText = [read('error'), read('error_code'), read('error_description')].join(' ').toLowerCase();
    const errorKey = /otp_expired|expired|already.?used|invalid.*link|link.*invalid|token.*invalid/.test(errorText)
      ? 'confirmationLinkExpired'
      : 'confirmationLinkFailed';
    ['error', 'error_code', 'error_description', 'error_uri'].forEach(key => {
      query.delete(key);
      fragment.delete(key);
    });
    url.search = query.toString() ? `?${query.toString()}` : '';
    url.hash = fragment.toString() ? `#${fragment.toString()}` : '';
    try { window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`); } catch (_) { /* Never log callback URL contents. */ }
    return { errorKey, emailConfirmation: false };
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (!state.client || state.busy || configurationState() !== 'ready') return;
    const email = el.email.value.trim();
    const password = el.password.value;
    if (!email || !el.email.validity.valid) { setFeedback('invalidEmail', 'error'); el.email.focus(); return; }
    if (!password || password.length < 6) { setFeedback('weakPassword', 'error'); el.password.focus(); return; }
    state.busy = true;
    state.feedback = '';
    state.tone = '';
    renderModal();
    try {
      if (state.mode === 'signup') {
        const { data, error } = await state.client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getConfirmationRedirectUrl() }
        });
        if (error) throw error;
        if (data?.session) {
          state.session = data.session;
          state.busy = false;
          startInactivity(data.session.user?.id, { reset: true });
          notifyAuthSubscribers();
          closeModal();
          renderTopbar();
          return;
        }
        state.busy = false;
        state.feedback = 'emailConfirm';
        state.tone = 'success';
        renderModal();
      } else {
        const { data, error } = await state.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const session = data?.session || state.session;
        if (!session) {
          state.busy = false;
          state.feedback = 'emailNotConfirmed';
          state.tone = 'error';
          renderModal();
          return;
        }
        state.session = session;
        state.busy = false;
        startInactivity(session.user?.id, { reset: true });
        notifyAuthSubscribers();
        closeModal();
        renderTopbar();
      }
    } catch (error) {
      state.busy = false;
      state.feedback = classifyError(error);
      state.tone = 'error';
      renderModal();
    }
  }
  async function handleLogout() {
    if (!state.client) return;
    const previousSession = state.session;
    const previousUserId = previousSession?.user?.id || '';
    stopInactivity();
    state.authTransition = 'signing-out';
    state.session = null;
    state.authGeneration += 1;
    notifyAuthSubscribers();
    renderTopbar();
    try {
      const { error } = await state.client.auth.signOut();
      if (error) throw error;
      state.authTransition = '';
      state.session = null;
      state.feedback = '';
      publishSignedOut(previousUserId);
      notifyAuthSubscribers();
      renderTopbar();
    } catch (_) {
      state.authTransition = '';
      state.session = previousSession;
      state.authGeneration += 1;
      startInactivity(previousUserId);
      notifyAuthSubscribers();
      state.mode = 'login';
      state.feedback = 'logoutFailed';
      state.tone = 'error';
      renderModal();
      backdrop.hidden = false;
      document.body.classList.add('pm-auth-open');
    }
  }
  function toggleMode() {
    state.mode = state.mode === 'login' ? 'signup' : 'login';
    state.feedback = '';
    state.tone = '';
    renderModal();
    el.email.focus();
  }

  el.form.addEventListener('submit', handleSubmit);
  el.modeSwitch.addEventListener('click', toggleMode);
  el.close.addEventListener('click', closeModal);
  inactivityEl.keep.addEventListener('click', recordActivity);
  inactivityEl.logout.addEventListener('click', handleLogout);
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(); });
  accountToggle?.addEventListener('click', () => {
    if (!mobileHeader.matches || !accountMenu) return;
    const open = accountMenu.hidden;
    accountMenu.hidden = !open;
    accountToggle.setAttribute('aria-expanded', String(open));
  });
  accountMenu?.addEventListener('click', event => {
    if (event.target.closest('button')) closeAccountMenu();
  });
  document.addEventListener('click', event => {
    if (mobileHeader.matches && accountMenu && !accountMenu.hidden && !event.target.closest('.pm-account-menu')) closeAccountMenu();
  });
  mobileHeader.addEventListener('change', syncAccountMenu);
  syncAccountMenu();
  document.addEventListener('keydown', event => {
    if (!inactivityBackdrop.hidden) {
      if (event.key === 'Tab') {
        const first = inactivityEl.keep, last = inactivityEl.logout;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.key === 'Escape' && backdrop.hidden && accountMenu && !accountMenu.hidden && mobileHeader.matches) { closeAccountMenu({ restoreFocus: true }); return; }
    if (backdrop.hidden) return;
    if (event.key === 'Escape') { closeModal(); return; }
    if (event.key === 'Tab') {
      const focusable = [...backdrop.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  document.addEventListener('change', event => {
    if (event.target?.id === 'packmateLanguageSelect') { renderModal(); renderInactivityWarning(); }
  });
  document.addEventListener('pointerdown', handleMeaningfulActivity, { capture: true, passive: true });
  document.addEventListener('keydown', handleMeaningfulActivity, { capture: true });
  document.addEventListener('wheel', handleMeaningfulActivity, { capture: true, passive: true });
  window.addEventListener('storage', handleActivityStorage);
  window.addEventListener('pageshow', scheduleInactivityCheck);
  window.addEventListener('focus', scheduleInactivityCheck);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleInactivityCheck(); });

  async function loadSdk() {
    const configState = configurationState();
    if (configState !== 'ready') {
      state.sdk = configState === 'invalid' ? 'failed' : 'unconfigured';
      renderModal();
      notifyAuthSubscribers();
      return;
    }
    if (window.supabase?.createClient) { initializeClient(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => {
      if (state.sdk === 'loading') { state.sdk = 'failed'; renderModal(); notifyAuthSubscribers(); }
    }, 15000);
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.supabase?.createClient) initializeClient();
      else { state.sdk = 'failed'; renderModal(); notifyAuthSubscribers(); }
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      state.sdk = 'failed';
      renderModal();
      notifyAuthSubscribers();
    };
    document.head.append(script);
  }
  function initializeClient() {
    try {
      state.client = window.supabase.createClient(String(config.url).trim(), String(config.anonKey).trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.sessionStorage,
          storageKey: AUTH_SESSION_KEY
        }
      });
      state.sdk = 'ready';
      state.client.auth.onAuthStateChange((event, session) => {
        const wasInitialized = state.authInitialized;
        const beforeUserId = state.session?.user?.id || '';
        const before = identityOf(state.session?.user);
        const after = identityOf(session?.user);
        const afterUserId = session?.user?.id || '';
        if (beforeUserId && afterUserId && beforeUserId !== afterUserId) publishSignedOut(beforeUserId);
        if (before !== after) state.authGeneration += 1;
        state.authStateRevision += 1;
        state.authInitializationError = false;
        state.authTransition = '';
        state.session = session || null;
        state.authInitialized = true;
        if (state.session?.user?.id) {
          startInactivity(state.session.user.id, { reset: event === 'SIGNED_IN' && wasInitialized && before !== after });
        } else {
          if (event === 'SIGNED_OUT' && beforeUserId) publishSignedOut(beforeUserId);
          stopInactivity();
        }
        renderTopbar();
        notifyAuthSubscribers();
        if (state.pendingEmailConfirmation && event === 'SIGNED_IN' && state.session) {
          state.pendingEmailConfirmation = false;
          showAuthFeedback('confirmationSuccess', 'success');
        }
      });
      const authRevisionAtRead = state.authStateRevision;
      state.client.auth.getSession().then(({ data, error }) => {
        if (state.authStateRevision === authRevisionAtRead) {
          if (error) {
            state.authInitializationError = true;
            state.authInitialized = false;
          } else {
            const before = identityOf(state.session?.user);
            state.session = data?.session || null;
            if (before !== identityOf(state.session?.user)) state.authGeneration += 1;
            state.authInitializationError = false;
            state.authInitialized = true;
            if (state.session?.user?.id) startInactivity(state.session.user.id);
            else stopInactivity();
          }
        }
        notifyAuthSubscribers();
        if (state.initialAuthLinkError) {
          const key = state.initialAuthLinkError;
          state.initialAuthLinkError = '';
          showAuthFeedback(key, 'error');
        } else if (state.pendingEmailConfirmation) {
          state.pendingEmailConfirmation = false;
          showAuthFeedback(state.session ? 'confirmationSuccess' : 'confirmationComplete', 'success');
        }
        renderModal();
      }).catch(() => {
        if (state.authStateRevision === authRevisionAtRead) {
          state.authInitializationError = true;
          state.authInitialized = false;
        }
        notifyAuthSubscribers();
        if (state.initialAuthLinkError) {
          const key = state.initialAuthLinkError;
          state.initialAuthLinkError = '';
          showAuthFeedback(key, 'error');
        }
        renderModal();
      });
      renderModal();
      notifyAuthSubscribers();
    } catch (_) {
      state.client = null;
      state.sdk = 'failed';
      renderModal();
      notifyAuthSubscribers();
    }
  }

  async function readCloudImportOverview(requestedUserId, signal) {
    const client = state.client;
    const userId = state.session?.user?.id;
    if (!client || !state.authInitialized || !userId || requestedUserId !== userId || signal?.aborted) return { ok: false, userId: null };
    const stillSameAccount = () => state.client === client && state.session?.user?.id === userId && !signal?.aborted;
    try {
      const tripIds = [];
      const tripRows = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        if (!stillSameAccount()) return { ok: false, userId: null };
        let query = client.from('user_trips').select('trip_id,payload,revision').eq('user_id', userId).range(offset, offset + pageSize - 1);
        if (signal && typeof query.abortSignal === 'function') query = query.abortSignal(signal);
        const { data, error } = await query;
        if (error || !Array.isArray(data) || !stillSameAccount()) return { ok: false, userId: null };
        data.forEach(row => {
          if (typeof row?.trip_id === 'string') {
            tripIds.push(row.trip_id);
            tripRows.push({ tripId: row.trip_id, payload: row.payload, revision: row.revision });
          }
        });
        if (data.length < pageSize) break;
      }
      if (!stillSameAccount()) return { ok: false, userId: null };
      let settingsQuery = client.from('user_settings').select('user_id').eq('user_id', userId).maybeSingle();
      if (signal && typeof settingsQuery.abortSignal === 'function') settingsQuery = settingsQuery.abortSignal(signal);
      const { data: settingsRow, error: settingsError } = await settingsQuery;
      if (settingsError || !stillSameAccount()) return { ok: false, userId: null };
      return { ok: true, userId, tripIds, tripRows, settingsExists: Boolean(settingsRow) };
    } catch (_) {
      return { ok: false, userId: null };
    }
  }
  async function insertCloudImportTrip(expectedUserId, trip, explicitConsent, signal) {
    const client = state.client;
    const userId = state.session?.user?.id;
    if (explicitConsent !== true) return { ok: false, userId: null, reason: 'consentRequired' };
    if (!client || !state.authInitialized || !userId || expectedUserId !== userId || signal?.aborted) return { ok: false, userId: null, reason: 'accountChanged' };
    if (!trip || typeof trip !== 'object' || Array.isArray(trip) || typeof trip.id !== 'string' || !trip.id.trim()) {
      return { ok: false, userId, reason: 'invalidTrip' };
    }
    const stillSameAccount = () => state.client === client && state.session?.user?.id === userId && !signal?.aborted;
    if (!stillSameAccount()) return { ok: false, userId: null, reason: 'accountChanged' };
    try {
      let query = client.from('user_trips').insert({ user_id: userId, trip_id: trip.id, payload: trip });
      if (signal && typeof query.abortSignal === 'function') query = query.abortSignal(signal);
      const { error } = await query;
      if (!stillSameAccount()) return { ok: false, userId: null, reason: 'accountChanged' };
      if (error) return { ok: false, userId, reason: 'insertFailed' };
      return { ok: true, userId };
    } catch (_) {
      if (!stillSameAccount()) return { ok: false, userId: null, reason: 'accountChanged' };
      return { ok: false, userId, reason: 'insertFailed' };
    }
  }
  async function createCloudTrip(expectedUserId, expectedGeneration, trip) {
    const client = state.client;
    const userId = state.session?.user?.id;
    const generation = state.authGeneration;

    if (!client || !state.authInitialized || !userId || userId !== expectedUserId ||
        generation !== expectedGeneration) {
      return { ok: false, reason: 'accountChanged' };
    }
    if (!trip || typeof trip !== 'object' || Array.isArray(trip) ||
        typeof trip.id !== 'string' || !trip.id.trim()) {
      return { ok: false, reason: 'invalidTrip' };
    }

    const sameAccount = () => state.client === client && state.authInitialized &&
      state.session?.user?.id === userId && state.authGeneration === generation;
    if (!sameAccount()) return { ok: false, reason: 'accountChanged' };

    try {
      const { error } = await client.from('user_trips').insert({
        user_id: userId,
        trip_id: trip.id,
        payload: trip
      });
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      if (error) return { ok: false, reason: 'insertFailed' };
      return { ok: true, userId, tripId: trip.id };
    } catch (_) {
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      return { ok: false, reason: 'insertFailed' };
    }
  }

  async function updateCloudTrip(expectedUserId, expectedGeneration, tripId, expectedRevision, trip) {
    const client = state.client;
    const userId = state.session?.user?.id;
    const generation = state.authGeneration;
    if (!client || !state.authInitialized || !userId || userId !== expectedUserId ||
        generation !== expectedGeneration) {
      return { ok: false, reason: 'accountChanged' };
    }
    if (typeof tripId !== 'string' || !tripId.trim() ||
        !Number.isSafeInteger(expectedRevision) || expectedRevision < 1 ||
        expectedRevision >= Number.MAX_SAFE_INTEGER) {
      return { ok: false, reason: 'invalidRevisionOrTripId' };
    }
    if (!trip || typeof trip !== 'object' || Array.isArray(trip) || trip.id !== tripId) {
      return { ok: false, reason: 'invalidTrip' };
    }

    const sameAccount = () => state.client === client && state.authInitialized &&
      state.session?.user?.id === userId && state.authGeneration === generation;
    if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
    const permissionError = error => error?.code === '42501' ||
      /permission denied|row-level security|row level security/i.test(String(error?.message || ''));

    try {
      const { data, error } = await client.from('user_trips')
        .update({ payload: trip, revision: expectedRevision + 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('trip_id', tripId)
        .eq('revision', expectedRevision)
        .select('trip_id,revision')
        .maybeSingle();
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      if (error) return { ok: false, reason: permissionError(error) ? 'permissionDenied' : 'updateFailed' };
      if (data) {
        if (data.trip_id !== tripId || !Number.isSafeInteger(data.revision) ||
            data.revision !== expectedRevision + 1) {
          return { ok: false, reason: 'updateResultInvalid' };
        }
        return { ok: true, userId, tripId, revision: data.revision };
      }

      const { data: current, error: lookupError } = await client.from('user_trips')
        .select('trip_id,revision')
        .eq('user_id', userId)
        .eq('trip_id', tripId)
        .maybeSingle();
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      if (lookupError) {
        return { ok: false, reason: permissionError(lookupError) ? 'permissionDenied' : 'updateOutcomeUnknown' };
      }
      if (!current) return { ok: false, reason: 'tripNotFoundOrForbidden' };
      if (!Number.isSafeInteger(current.revision) || current.revision < 1) {
        return { ok: false, reason: 'invalidStoredRevision' };
      }
      if (current.revision !== expectedRevision) {
        return { ok: false, reason: 'revisionConflict', currentRevision: current.revision };
      }
      return { ok: false, reason: 'updateNotAppliedOrForbidden', currentRevision: current.revision };
    } catch (_) {
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      return { ok: false, reason: 'updateOutcomeUnknown' };
    }
  }

  async function deleteCloudTrip(expectedUserId, expectedGeneration, tripId, expectedRevision) {
    const client = state.client;
    const userId = state.session?.user?.id;
    const generation = state.authGeneration;
    if (!client || !state.authInitialized || !userId || userId !== expectedUserId ||
        generation !== expectedGeneration) {
      return { ok: false, reason: 'accountChanged' };
    }
    if (typeof tripId !== 'string' || !tripId.trim() ||
        !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
      return { ok: false, reason: 'invalidRevisionOrTripId' };
    }

    const sameAccount = () => state.client === client && state.authInitialized &&
      state.session?.user?.id === userId && state.authGeneration === generation;
    const permissionError = error => error?.code === '42501' ||
      /permission denied|row-level security|row level security/i.test(String(error?.message || ''));
    if (!sameAccount()) return { ok: false, reason: 'accountChanged' };

    try {
      const { data, error } = await client.from('user_trips')
        .delete()
        .eq('user_id', userId)
        .eq('trip_id', tripId)
        .eq('revision', expectedRevision)
        .select('trip_id,revision')
        .maybeSingle();
      if (!sameAccount()) {
        return { ok: false, reason: 'accountChanged', ...(data ? { deleteCompleted: true } : {}) };
      }
      if (error) {
        return { ok: false, reason: permissionError(error) ? 'permissionDenied' : 'deleteFailed' };
      }
      if (data) {
        if (data.trip_id !== tripId || data.revision !== expectedRevision) {
          return { ok: false, reason: 'deleteResultInvalid' };
        }
        return { ok: true, userId, tripId, revision: expectedRevision };
      }

      const { data: current, error: lookupError } = await client.from('user_trips')
        .select('trip_id,revision')
        .eq('user_id', userId)
        .eq('trip_id', tripId)
        .maybeSingle();
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      if (lookupError) {
        return { ok: false, reason: permissionError(lookupError) ? 'permissionDenied' : 'deleteOutcomeUnknown' };
      }
      if (!current) return { ok: false, reason: 'tripNotFoundOrForbidden' };
      if (!Number.isSafeInteger(current.revision) || current.revision < 1) {
        return { ok: false, reason: 'invalidStoredRevision' };
      }
      if (current.revision !== expectedRevision) {
        return { ok: false, reason: 'revisionConflict', currentRevision: current.revision };
      }
      return { ok: false, reason: 'deleteNotAppliedOrForbidden', currentRevision: current.revision };
    } catch (_) {
      if (!sameAccount()) return { ok: false, reason: 'accountChanged' };
      return { ok: false, reason: 'deleteOutcomeUnknown' };
    }
  }

  window.PACKMATE_AUTH = Object.freeze({
    getState: publicAuthState,
    getCurrentUser: () => publicAuthState().user,
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      authSubscribers.add(callback);
      try { callback(publicAuthState()); } catch (_) { /* Subscriber errors do not affect authentication. */ }
      return () => authSubscribers.delete(callback);
    },
    readCloudImportOverview,
    insertCloudImportTrip,
    createCloudTrip,
    updateCloudTrip,
    deleteCloudTrip,
    getAuthGeneration: () => state.authGeneration
  });

  const migrationStyle = document.createElement('link');
  migrationStyle.rel = 'stylesheet';
  migrationStyle.href = 'css/packmate-cloud-migration.css';
  document.head.append(migrationStyle);
  const migrationScript = document.createElement('script');
  migrationScript.src = 'js/integrations/packmate-cloud-migration.js';
  migrationScript.async = true;
  migrationScript.crossOrigin = 'anonymous';
  document.head.append(migrationScript);

  const callback = inspectAuthCallbackUrl();
  state.initialAuthLinkError = callback.errorKey;
  state.pendingEmailConfirmation = callback.emailConfirmation;
  renderTopbar();
  loadSdk();
})();
