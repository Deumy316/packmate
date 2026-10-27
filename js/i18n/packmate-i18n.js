/* PACKMATE stage-one translations: static HTML copy only. User-entered values and app data are not translated. */
(() => {
  'use strict';
  const STORAGE_KEY = 'packmate.language.v1';
  const LANGUAGES = ['ko', 'en', 'tl'];
  const messages = {
    'meta.title': { ko: 'PACKMATE — 목적별 이동과 체류 준비', en: 'PACKMATE — Plan Every Trip with Purpose', tl: 'PACKMATE — Ihanda ang Bawat Biyahe nang Maayos' },
    'meta.description': { ko: '이동 목적과 일정에 맞춰 여행·출장·교육·방문 준비를 관리하는 PACKMATE', en: 'PACKMATE helps you prepare for travel, business, education, and visits based on your plans.', tl: 'Tumutulong ang PACKMATE sa paghahanda para sa biyahe, trabaho, edukasyon, at pagbisita ayon sa iyong iskedyul.' },
    'home.local': { ko: '내 기기에 저장', en: 'Saved on this device', tl: 'Naka-save sa device na ito' },
    'status.checking': { ko: '확인 중', en: 'Checking', tl: 'Sinusuri' },
    'status.cloudReadOnly': { ko: '클라우드 읽기 전용', en: 'Cloud read-only', tl: 'Read-only sa cloud' },
    'status.privateHidden': { ko: '개인 일정 비표시', en: 'Personal trips hidden', tl: 'Nakatago ang personal na iskedyul' },
    'status.cloudError': { ko: '클라우드 연결 오류', en: 'Cloud connection error', tl: 'Error sa koneksyon sa cloud' },
    'home.homeButton': { ko: '홈으로 이동', en: 'Go to home', tl: 'Pumunta sa home' },
    'home.eyebrow': { ko: '이동과 체류 준비의 새로운 루틴', en: 'A better routine for every trip', tl: 'Mas maayos na paghahanda sa bawat biyahe' },
    'home.title.first': { ko: '목적에 맞게 준비하고,', en: 'Prepare for your purpose,', tl: 'Maghanda ayon sa pakay,' },
    'home.title.second': { ko: '더 가볍게 출발해요.', en: 'and travel with ease.', tl: 'at bumiyahe nang magaan.' },
    'home.description.first': { ko: '여행부터 출장·교육·방문까지', en: 'From vacations to business, education, and visits,', tl: 'Mula bakasyon hanggang trabaho, edukasyon, at pagbisita,' },
    'home.description.second': { ko: '일정에 꼭 맞는 준비물과 할 일을 관리해요.', en: 'manage the supplies and tasks that fit your plans.', tl: 'ayusin ang mga gamit at gawaing kailangan sa iyong iskedyul.' },
    'home.create': { ko: '새 일정 만들기', en: 'Create a trip', tl: 'Gumawa ng iskedyul' },
    'home.note': { ko: '준비물 수납과 사전 업무를 한곳에서', en: 'Keep packing and pre-trip tasks in one place', tl: 'Ihanda sa iisang lugar ang mga gamit at gawain' },
    'home.mock.title': { ko: '이번 일정도', en: 'This trip,', tl: 'Sa biyaheng ito,' },
    'home.mock.emphasis': { ko: '꼼꼼하게!', en: 'stay organized!', tl: 'maging handa!' },
    'home.mock.task1': { ko: '일정 확인', en: 'Review the plan', tl: 'Suriin ang iskedyul' },
    'home.mock.task2': { ko: '필수품 챙기기', en: 'Pack essentials', tl: 'Ihanda ang mahahalagang gamit' },
    'home.purpose.kicker': { ko: 'START HERE', en: 'START HERE', tl: 'MAGSIMULA DITO' },
    'home.purpose.title': { ko: '무엇을 위해 이동하시나요?', en: 'What are you traveling for?', tl: 'Ano ang pakay ng iyong biyahe?' },
    'home.purpose.subtitle': { ko: '목적을 먼저 선택하면 준비 목록을 맞춰드려요.', en: 'Choose a purpose first and we’ll tailor your checklist.', tl: 'Pumili muna ng pakay para maiangkop namin ang checklist.' },
    'purpose.travel': { ko: '여행·휴가', en: 'Travel & vacation', tl: 'Paglalakbay at bakasyon' },
    'purpose.travel.detail': { ko: '관광, 휴식, 레저', en: 'Sightseeing, relaxation, leisure', tl: 'Pagliliwaliw, pahinga, paglilibang' },
    'purpose.business': { ko: '출장·업무', en: 'Business trip', tl: 'Biyahe sa trabaho' },
    'purpose.business.detail': { ko: '회의, 고객사 방문, 현장 작업', en: 'Meetings, client visits, on-site work', tl: 'Pulong, pagbisita sa kliyente, trabaho sa lugar' },
    'purpose.education': { ko: '교육·행사', en: 'Education & events', tl: 'Edukasyon at mga event' },
    'purpose.education.detail': { ko: '교육, 세미나, 컨퍼런스', en: 'Training, seminars, conferences', tl: 'Pagsasanay, seminar, kumperensya' },
    'purpose.personal': { ko: '방문·개인 일정', en: 'Visits & personal plans', tl: 'Pagbisita at personal na lakad' },
    'purpose.personal.detail': { ko: '가족 방문, 경조사, 면접, 기타', en: 'Family visits, occasions, interviews, and more', tl: 'Pagbisita sa pamilya, okasyon, panayam, at iba pa' },
    'home.saved.kicker': { ko: 'MY PLANS', en: 'MY PLANS', tl: 'AKING MGA PLANO' },
    'home.saved.title': { ko: '저장된 일정', en: 'Saved trips', tl: 'Mga naka-save na iskedyul' },
    'home.saved.add': { ko: '일정 추가', en: 'Add a trip', tl: 'Magdagdag ng iskedyul' },
    'home.empty.title': { ko: '아직 저장된 일정이 없어요', en: 'No saved trips yet', tl: 'Wala pang naka-save na iskedyul' },
    'home.empty.description': { ko: '첫 일정을 만들고 필요한 준비를 확인해 보세요.', en: 'Create your first trip and see what you need to prepare.', tl: 'Gumawa ng unang iskedyul at tingnan ang mga kailangang ihanda.' },
    'home.cloudLoading': { ko: '클라우드 일정을 불러오는 중', en: 'Loading cloud trips', tl: 'Nilo-load ang mga iskedyul sa cloud' },
    'home.storage': { ko: '일정은 현재 브라우저에 저장돼요. 다른 기기와 자동으로 동기화되지 않습니다.', en: 'Trips are saved in this browser and are not automatically synced across devices.', tl: 'Naka-save ang mga iskedyul sa browser na ito at hindi awtomatikong nagsi-sync sa ibang device.' },
    'home.storageChecking': { ko: '인증 및 클라우드 일정 상태를 확인하고 있어요.', en: 'Checking your account and cloud trips.', tl: 'Sinusuri ang account at mga iskedyul sa cloud.' },
    'home.storageReadOnly': { ko: '현재 계정의 클라우드 일정을 읽기 전용으로 표시해요. 자동 동기화는 아직 지원하지 않습니다.', en: 'Cloud trips for this account are shown read-only. Automatic sync is not available yet.', tl: 'Read-only ang mga iskedyul sa cloud ng account na ito. Hindi pa available ang awtomatikong sync.' },
    'home.storageHidden': { ko: '로그인하지 않은 동안 개인 일정은 표시하지 않아요.', en: 'Personal trips are hidden while you are signed out.', tl: 'Nakatago ang mga personal na iskedyul habang naka-log out.' },
    'home.storageError': { ko: '클라우드 일정에 연결하지 못해 개인 기록을 비워 두었어요.', en: 'Could not connect to cloud trips, so personal records remain hidden.', tl: 'Hindi makakonekta sa mga iskedyul sa cloud kaya nananatiling nakatago ang personal na tala.' },
    'form.back': { ko: '저장된 일정', en: 'Saved trips', tl: 'Mga naka-save na iskedyul' },
    'form.kicker': { ko: 'PLAN YOUR MOVE', en: 'PLAN YOUR TRIP', tl: 'PLANUHIN ANG BIYAHE' },
    'form.title': { ko: '어떤 일정을 준비할까요?', en: 'What kind of trip are you planning?', tl: 'Anong uri ng biyahe ang ihahanda mo?' },
    'form.editTitle': { ko: '일정 정보를 수정할까요?', en: 'Would you like to edit this trip?', tl: 'Gusto mo bang baguhin ang iskedyul na ito?' },
    'form.intro': { ko: '이동 목적과 지역을 알려주시면 준비 목록을 만들어드릴게요.', en: 'Tell us your purpose and destination to create a tailored checklist.', tl: 'Ilagay ang pakay at destinasyon para makagawa kami ng angkop na checklist.' },
    'form.purpose': { ko: '이동 목적', en: 'Trip purpose', tl: 'Pakay ng biyahe' },
    'form.required': { ko: '필수', en: 'Required', tl: 'Kailangan' },
    'form.mainPurpose': { ko: '상위 목적', en: 'Main purpose', tl: 'Pangunahing pakay' },
    'form.subPurpose': { ko: '세부 목적', en: 'Specific purpose', tl: 'Tiyak na pakay' },
    'form.location': { ko: '이동 지역', en: 'Destination', tl: 'Destinasyon' },
    'form.domesticInternational': { ko: '국내 또는 해외 선택', en: 'Choose domestic or international', tl: 'Pumili ng lokal o internasyonal' },
    'form.domestic': { ko: '국내', en: 'Domestic', tl: 'Lokal' },
    'form.international': { ko: '해외', en: 'International', tl: 'Internasyonal' },
    'form.tripName': { ko: '일정 이름', en: 'Trip name', tl: 'Pangalan ng iskedyul' },
    'form.example': { ko: '예: 서울 고객사 방문', en: 'e.g. Client visit in Seoul', tl: 'hal. Pagbisita sa kliyente sa Seoul' },
    'form.tripNameHint': { ko: '저장된 일정에서 알아보기 쉬운 이름을 적어주세요.', en: 'Choose a name that is easy to recognize in your saved trips.', tl: 'Pumili ng pangalang madaling makilala sa mga naka-save na iskedyul.' },
    'form.domesticRegion': { ko: '국내 지역', en: 'Domestic destination', tl: 'Lokal na destinasyon' },
    'form.destinationPlaceholder': { ko: '지역을 검색하거나 직접 입력', en: 'Search for or enter a destination', tl: 'Maghanap o maglagay ng destinasyon' },
    'form.destinationHint': { ko: '목록에서 검색하거나 목록에 없는 지역을 직접 입력할 수 있어요.', en: 'Search the list or enter a destination that is not listed.', tl: 'Maghanap sa listahan o ilagay ang destinasyong wala rito.' },
    'form.transport': { ko: '이동수단', en: 'Transportation', tl: 'Paraan ng biyahe' },
    'transport.car': { ko: '자가용', en: 'Car', tl: 'Sariling sasakyan' },
    'transport.train': { ko: '기차', en: 'Train', tl: 'Tren' },
    'transport.bus': { ko: '버스', en: 'Bus', tl: 'Bus' },
    'transport.air': { ko: '항공', en: 'Air travel', tl: 'Eroplano' },
    'transport.other': { ko: '기타', en: 'Other', tl: 'Iba pa' },
    'form.duration': { ko: '일정 기간', en: 'Trip duration', tl: 'Tagal ng biyahe' },
    'duration.day': { ko: '당일', en: 'Same day', tl: 'Araw ding iyon' },
    'duration.one': { ko: '1박 2일', en: '2 days, 1 night', tl: '2 araw, 1 gabi' },
    'duration.two': { ko: '2박 3일', en: '3 days, 2 nights', tl: '3 araw, 2 gabi' },
    'duration.three': { ko: '3박 4일', en: '4 days, 3 nights', tl: '4 araw, 3 gabi' },
    'duration.four': { ko: '4박 5일', en: '5 days, 4 nights', tl: '5 araw, 4 gabi' },
    'duration.five': { ko: '5박 6일', en: '6 days, 5 nights', tl: '6 araw, 5 gabi' },
    'duration.week': { ko: '7박 이상', en: '7 nights or more', tl: '7 gabi o higit pa' },
    'form.lodging': { ko: '숙박 여부', en: 'Overnight stay', tl: 'May overnight stay' },
    'lodging.yes': { ko: '숙박 있음', en: 'Overnight stay', tl: 'May overnight stay' },
    'lodging.no': { ko: '숙박 없음', en: 'No overnight stay', tl: 'Walang overnight stay' },
    'form.startDate': { ko: '시작일', en: 'Start date', tl: 'Petsa ng pagsisimula' },
    'form.optional': { ko: '선택', en: 'Optional', tl: 'Opsyonal' },
    'form.endDate': { ko: '종료일', en: 'End date', tl: 'Petsa ng pagtatapos' },
    'form.autoCalculate': { ko: '자동 계산', en: 'Calculated automatically', tl: 'Awtomatikong kakalkulahin' },
    'form.endDateHint': { ko: '시작일과 일정 기간에 따라 자동으로 계산돼요.', en: 'Calculated automatically from the start date and trip duration.', tl: 'Awtomatikong kakalkulahin batay sa petsa ng simula at tagal ng biyahe.' },
    'form.activities': { ko: '추가 활동', en: 'Additional activities', tl: 'Mga karagdagang aktibidad' },
    'form.activitiesHint': { ko: '해당하는 활동을 여러 개 선택하거나 직접 등록할 수 있어요.', en: 'Select multiple activities or add your own.', tl: 'Pumili ng maraming aktibidad o magdagdag ng sarili mo.' },
    'form.activityLabel': { ko: '직접 추가할 활동명', en: 'Activity to add', tl: 'Aktibidad na idaragdag' },
    'form.activityPlaceholder': { ko: '예: 자전거, 스키', en: 'e.g. cycling, skiing', tl: 'hal. pagbibisikleta, skiing' },
    'form.activityAdd': { ko: '활동 추가', en: 'Add activity', tl: 'Magdagdag ng aktibidad' },
    'form.privacy': { ko: '일정 정보는 이 브라우저에 저장됩니다.', en: 'Trip information is saved in this browser.', tl: 'Naka-save sa browser na ito ang impormasyon ng iskedyul.' },
    'form.previewPrivacy': { ko: '체험 중에는 입력 내용과 추천 결과를 저장하지 않습니다.', en: 'Preview mode does not save your entries or recommendations.', tl: 'Hindi sine-save sa preview mode ang mga inilagay mo o mga rekomendasyon.' },
    'form.submit': { ko: '준비 목록 만들기', en: 'Create checklist', tl: 'Gumawa ng checklist' },
    'form.preview': { ko: '추천 목록 미리보기', en: 'Preview recommendations', tl: 'I-preview ang mga rekomendasyon' },
    'form.save': { ko: '변경 내용 저장', en: 'Save changes', tl: 'I-save ang mga pagbabago' },
    'checklist.title': { ko: '준비 현황', en: 'Preparation overview', tl: 'Kalagayan ng paghahanda' },
    'checklist.delete': { ko: '이 일정 삭제', en: 'Delete this trip', tl: 'Burahin ang iskedyul na ito' },
    'checklist.packingProgress': { ko: '준비물 수납', en: 'Packing progress', tl: 'Paghahanda ng mga gamit' },
    'checklist.taskProgress': { ko: '출발 전 할 일', en: 'Pre-trip tasks', tl: 'Mga gawain bago bumiyahe' },
    'checklist.noticeLead': { ko: '출발 전 한 번 더 확인해요.', en: 'Do one last check before you go.', tl: 'Muling suriin bago umalis.' },
    'checklist.noticeText': { ko: '체크 표시는 직접 확인을 돕는 기록이며, 실제 준비 여부를 대신 확인하지는 않아요.', en: 'Checkmarks help you keep track, but do not verify that an item is actually ready.', tl: 'Tumutulong ang mga tsek para magtala, ngunit hindi nito tinitiyak na handa na talaga ang isang gamit.' },
    'checklist.readOnlyNotice': { ko: '클라우드 저장 기능 준비 중 · 현재 읽기 전용', en: 'Cloud saving is coming · Currently read-only', tl: 'Inihahanda ang cloud saving · Read-only sa ngayon' },
    'checklist.previewNotice': { ko: '체험 미리보기 · 입력 내용과 추천 결과는 저장되지 않습니다.', en: 'Preview mode · Your entries and recommendations are not saved.', tl: 'Preview mode · Hindi sine-save ang mga inilagay mo at mga rekomendasyon.' },
    'checklist.preflightKicker': { ko: 'BEFORE YOU GO', en: 'BEFORE YOU GO', tl: 'BAGO UMALIS' },
    'checklist.preflightTitle': { ko: '출발 직전 점검', en: 'Final check before departure', tl: 'Huling pagsusuri bago umalis' },
    'checklist.preflightDescription': { ko: '아직 확인하지 않은 준비물과 업무를 다시 살펴보세요.', en: 'Review any supplies and tasks you have not checked yet.', tl: 'Suriin muli ang mga gamit at gawaing hindi mo pa natitingnan.' },
    'checklist.packingTitle': { ko: '가방에 넣을 준비물', en: 'Items to pack', tl: 'Mga gamit na ilalagay sa bag' },
    'checklist.packingDescription': { ko: '실제로 챙긴 뒤 체크해 주세요.', en: 'Check each item after packing it.', tl: 'Lagyan ng tsek ang bawat gamit kapag nailagay na sa bag.' },
    'checklist.addLabel': { ko: '준비물 직접 추가', en: 'Add a personal item', tl: 'Magdagdag ng sariling gamit' },
    'checklist.addPlaceholder': { ko: '나만의 준비물 추가하기', en: 'Add your own item', tl: 'Magdagdag ng sarili mong gamit' },
    'checklist.addButton': { ko: '준비물 추가', en: 'Add item', tl: 'Magdagdag ng gamit' },
    'checklist.essential': { ko: '다음 일정에도 재사용', en: 'Reuse for future trips', tl: 'Gamitin muli sa susunod na biyahe' },
    'checklist.personalNote': { ko: '개인 필수품은 다음 일정 목록에도 자동으로 반영돼요.', en: 'Personal essentials are automatically added to future trip lists.', tl: 'Awtomatikong idaragdag ang mga personal na kailangan sa mga susunod na iskedyul.' },
    'checklist.tasksTitle': { ko: '출발 전 확인할 일', en: 'Tasks to check before departure', tl: 'Mga dapat suriin bago umalis' },
    'checklist.tasksDescription': { ko: '미리 처리하거나 확인해야 할 항목이에요.', en: 'Items to take care of or confirm in advance.', tl: 'Mga bagay na kailangang asikasuhin o tiyakin nang maaga.' },
    'checklist.officialNote': { ko: '입국 및 비자 조건은 국적·체류 기간·목적에 따라 달라질 수 있어요. 앱에서 법적 요건을 확정하지 않으며 최신 내용은 해당 국가의 공식 안내에서 직접 확인해 주세요.', en: 'Entry and visa requirements may vary by nationality, length of stay, and purpose. This app does not determine legal requirements; check the latest guidance from the relevant country’s official sources.', tl: 'Maaaring mag-iba ang mga kinakailangan sa pagpasok at visa ayon sa nasyonalidad, tagal ng pananatili, at pakay. Hindi tinutukoy ng app na ito ang mga legal na kinakailangan; tingnan ang pinakabagong opisyal na gabay ng bansang pupuntahan.' },
    'checklist.missedKicker': { ko: 'LEARN FOR NEXT TIME', en: 'LEARN FOR NEXT TIME', tl: 'ARAL PARA SA SUSUNOD' },
    'checklist.missedTitle': { ko: '누락 기록', en: 'Missed items', tl: 'Mga nakalimutang gamit' },
    'checklist.missedDescription': { ko: '빠뜨린 물건을 기록하면 다음 일정의 목록에서 우선 확인하도록 표시해요.', en: 'Record items you forgot so they are highlighted for your next trip.', tl: 'Itala ang mga nakalimutang gamit para bigyang-pansin sa susunod na iskedyul.' },
    'checklist.missedPriorityTitle': { ko: '지난 누락 준비물', en: 'Previously missed items', tl: 'Mga gamit na dating nakalimutan' },
    'checklist.missedPriorityDescription': { ko: '이전에 빠뜨린 기록이 있어 목록 상단에 표시했어요.', en: 'These were missed before, so they are highlighted at the top.', tl: 'Dati nang nakalimutan ang mga ito kaya itinampok sa itaas.' },
    'checklist.dismissMissedAttention': { ko: '누락 해제', en: 'Clear alert', tl: 'Alisin ang babala' },
    'checklist.missedAlertTitle': { ko: '누락 기록을 다시 확인해요', en: 'Review previously missed items', tl: 'Suriin muli ang mga dating nakalimutang gamit' },
    'checklist.missedAlertDescription': { ko: '출발이 임박했어요. 목록 상단의 지난 누락 준비물을 직접 확인해 주세요.', en: 'Departure is close. Check the previously missed items at the top of the list.', tl: 'Malapit na ang pag-alis. Suriin ang mga dating nakalimutang gamit sa itaas ng listahan.' },
    'common.close': { ko: '닫기', en: 'Close', tl: 'Isara' },
    'checklist.bottomNote': { ko: '준비 상태와 개인 기록은 자동으로 이 기기에 저장돼요.', en: 'Your preparation status and personal records are saved on this device.', tl: 'Naka-save sa device na ito ang kalagayan ng paghahanda at mga personal na tala.' },
    'footer.tagline': { ko: '이동과 체류 준비, 조금 더 가볍게.', en: 'Make travel and stay preparations a little easier.', tl: 'Gawing mas magaan ang paghahanda sa biyahe at pananatili.' }
  };

  const textKeys = Object.create(null);
  Object.entries(messages).forEach(([key, entry]) => { if (entry.ko && !textKeys[entry.ko]) textKeys[entry.ko] = key; });
  const attributeKeys = {
    'PACKMATE 홈으로': 'home.homeButton', '홈으로 이동': 'home.homeButton', '홈으로': 'home.homeButton', '이 일정 삭제': 'checklist.delete',
    '예: 서울 고객사 방문': 'form.example', '지역을 검색하거나 직접 입력': 'form.destinationPlaceholder', '예: 자전거, 스키': 'form.activityPlaceholder',
    '나만의 준비물 추가하기': 'checklist.addPlaceholder', '준비물 추가': 'checklist.addButton'
  };
  const languageNames = [['ko', '한국어'], ['en', 'English'], ['tl', 'Tagalog']];
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('[data-i18n]')) continue;
    const source = node.nodeValue.trim();
    const key = textKeys[source];
    if (key) textNodes.push({ node, source: node.nodeValue, key });
  }
  const attributeNodes = [];
  document.querySelectorAll('[aria-label], [title], [placeholder]').forEach((element) => {
    ['aria-label', 'title', 'placeholder'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      const key = value && attributeKeys[value];
      if (key) attributeNodes.push({ element, attribute, source: value, key });
    });
  });

  const missingTranslationKeys = new Set();
  function reportMissingKey(key) {
    const missingKey = String(key);
    if (missingTranslationKeys.has(missingKey)) return;
    missingTranslationKeys.add(missingKey);
    console.warn('[PACKMATE i18n] 한국어 번역 키 누락:', missingKey);
  }
  function t(key, language = window.PACKMATE_I18N.language) {
    const entry = messages[key];
    if (entry) {
      const selected = entry[language];
      if (typeof selected === 'string' && selected.length) return selected;
      if (typeof entry.ko === 'string' && entry.ko.length) return entry.ko;
    }
    reportMissingKey(key);
    return '';
  }

  function replaceElementText(element, value) {
    const nodes = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
    if (!nodes.length) {
      if (!element.children.length) element.textContent = value;
      return;
    }
    nodes.forEach((node, index) => {
      if (index === 0) {
        node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), value);
      } else {
        node.nodeValue = '';
      }
    });
  }

  function applyChecklistBackLabel(language) {
    const button = document.getElementById('checklistBackButton');
    if (!button) return;
    const labels = new Set(Object.values(messages['form.back']));
    const label = [...button.children].reverse().find((child) =>
      child.childElementCount === 0 && labels.has(child.textContent.trim())
    );
    if (label) {
      replaceElementText(label, t('form.back', language));
      return;
    }
    const directText = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
    if (directText) directText.nodeValue = directText.nodeValue.replace(directText.nodeValue.trim(), t('form.back', language));
  }

  function applyDataAttributes(language) {
    document.querySelectorAll('*').forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        if (!attribute.name.startsWith('data-i18n-')) return;
        const suffix = attribute.name.slice('data-i18n-'.length);
        const target = suffix === 'aria' ? 'aria-label' : suffix;
        if (!['placeholder', 'aria-label', 'title', 'alt'].includes(target)) return;
        const translation = t(attribute.value, language);
        if (translation) element.setAttribute(target, translation);
      });
    });
  }

  function applyLanguage(language) {
    const selected = LANGUAGES.includes(language) ? language : 'ko';
    document.documentElement.lang = selected;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (messages[key]) replaceElementText(element, t(key, selected));
    });
    textNodes.forEach(({ node, source, key }) => {
      if (node.isConnected) node.nodeValue = source.replace(source.trim(), t(key, selected));
    });
    attributeNodes.forEach(({ element, attribute, source, key }) => {
      if (element.isConnected) element.setAttribute(attribute, t(key, selected) || source);
    });
    applyChecklistBackLabel(selected);
    applyDataAttributes(selected);
    document.title = t('meta.title', selected);
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t('meta.description', selected);
    const select = document.getElementById('packmateLanguageSelect');
    if (select && select.value !== selected) select.value = selected;
    window.PACKMATE_I18N.language = selected;
  }

  // app.js sets these form strings when it opens the form. Key the action by the route, not by its currently translated copy.
  function refreshFormActionCopy() {
    const title = document.getElementById('formTitle');
    const submit = document.getElementById('formSubmitButton');
    const privacy = document.querySelector('.form-footer [data-i18n="form.privacy"], .form-footer [data-i18n="form.previewPrivacy"]');
    if (!title || !submit || document.getElementById('formView')?.hidden) return;
    const route = history.state?.packmateRoute;
    const editing = route?.view === 'form' && Boolean(route.editTripId);
    const titleKey = editing ? 'form.editTitle' : 'form.title';
    const preview = !editing && Boolean(window.PACKMATE_APP_DATA?.getState?.().readOnly);
    const actionKey = editing ? 'form.save' : preview ? 'form.preview' : 'form.submit';
    title.setAttribute('data-i18n', titleKey);
    title.textContent = t(titleKey);
    if (privacy) {
      const privacyKey = preview ? 'form.previewPrivacy' : 'form.privacy';
      privacy.setAttribute('data-i18n', privacyKey);
      privacy.textContent = t(privacyKey);
    }
    submit.innerHTML = `<span data-i18n="${actionKey}">${t(actionKey)}</span> <span class="button-arrow" aria-hidden="true">↗</span>`;
  }
  function refreshFormStaticCopy() {
    applyLanguage(window.PACKMATE_I18N.language);
    refreshFormActionCopy();
  }
  document.addEventListener('click', (event) => {
    if (event.target.closest('#newTripButton, #savedNewTripButton, [data-start-purpose], #editTripButton, [data-trip-type]')) {
      queueMicrotask(refreshFormStaticCopy);
    }
  }, true);
  window.addEventListener('popstate', () => queueMicrotask(refreshFormStaticCopy));

  function addLanguageSelector() {
    const topbar = document.querySelector('.topbar-right');
    if (!topbar || document.getElementById('packmateLanguageSelect')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'language-picker';
    const label = document.createElement('label');
    label.className = 'visually-hidden';
    label.htmlFor = 'packmateLanguageSelect';
    label.textContent = 'Language / 언어';
    const select = document.createElement('select');
    select.id = 'packmateLanguageSelect';
    select.setAttribute('aria-label', 'Language / 언어');
    languageNames.forEach(([value, name]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = name;
      select.append(option);
    });
    select.addEventListener('change', () => {
      const language = LANGUAGES.includes(select.value) ? select.value : 'ko';
      try { window.localStorage.setItem(STORAGE_KEY, language); } catch (_) { /* Keep this page's selected language if storage is unavailable. */ }
      applyLanguage(language);
    });
    wrapper.append(label, select);
    topbar.insertBefore(wrapper, topbar.firstChild);
  }

  window.PACKMATE_I18N = {
    storageKey: STORAGE_KEY,
    language: 'ko',
    t,
    reportMissingKey,
    missingKeys: () => [...missingTranslationKeys].sort()
  };
  addLanguageSelector();
  let initialLanguage = 'ko';
  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(savedLanguage)) initialLanguage = savedLanguage;
  } catch (_) { /* Use Korean when browser storage is unavailable. */ }
  applyLanguage(initialLanguage);
})();
