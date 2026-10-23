window.PACKMATE_RECOMMENDATION_ENGINE = (() => {
    'use strict';

    function createEngine(context) {
        const { add, key, supplies, id } = context;
const essentials = { forEach: callback => context.getEssentials().forEach(callback) };
const trips = { forEach: callback => context.getTrips().forEach(callback) };

        function appendActivity(packing, activities) { const map = new Map(); activities.forEach(a => supplies(a).forEach(n => { const k = key(n); if (!map.has(k)) map.set(k, { name: n, from: [] }); if (!map.get(k).from.some(x => key(x) === key(a))) map.get(k).from.push(a) })); map.forEach(x => { const old = packing.find(p => key(p.name) === key(x.name)), d = `추천 이유: ${x.from.map(a => `${a} 활동`).join(', ')}`; if (old) old.detail = [old.detail, d].filter(Boolean).join(' · '); else packing.push(add(x.name, d, false, 'activity')) }); return packing } function unique(a) { const seen = new Set(); return a.filter(x => { const k = key(x.name); if (seen.has(k)) return false; seen.add(k); return true }) }
    function build(t) { const packing = [add('충전기 및 케이블'), add('보조배터리'), add('충전 젠더'), add('지갑·결제수단'), add('개인 상비약')], tasks = []; if (t.lodging) packing.push(add('여벌 옷과 속옷'), add('세면도구·개인 위생용품'), add('잠옷')); if (t.type === 'international') { packing.unshift(add('여권', '유효기간과 소지 여부를 직접 확인해요.')); tasks.push({ id: id(), name: '해당 국가의 공식 입국 요건 확인', detail: '국적·체류 기간·방문 목적에 따라 공식 안내를 확인해요.', done: false }) } else { if (t.lodging) tasks.push({ id: id(), name: '숙소 예약·체크인 정보 확인', done: false }); tasks.push({ id: id(), name: '이동수단과 출발 시간 확인', done: false }, { id: id(), name: '일정 및 목적지 정보 확인', done: false }) } if (t.purposeCategory === 'business') { ['업무용 노트북', '노트북 충전기', '업무 자료', '출입증'].forEach(x => packing.push(add(x))); tasks.push({ id: id(), name: '업무 일정 확인', done: false }, { id: id(), name: '방문 담당자 연락처 확인', done: false }) } if (t.purposeCategory === 'education') { ['필기도구', '교육 자료'].forEach(x => packing.push(add(x))); tasks.push({ id: id(), name: '등록 또는 신청 내역 확인', done: false }) } if (t.purposeCategory === 'personal' && t.subPurpose === '면접') { ['이력서', '포트폴리오'].forEach(x => packing.push(add(x))); tasks.push({ id: id(), name: '면접 장소 및 시간 확인', done: false }) } appendActivity(packing, t.activities); essentials.forEach(x => { if (!packing.some(p => key(p.name) === key(x.name))) packing.push(add(x.name, '개인 필수품 · 다음 일정 재사용', true, 'essential')) }); const seen = new Set(); trips.forEach(old => (old.missedItems || []).forEach(m => { if (!m?.name || seen.has(key(m.name))) return; seen.add(key(m.name)); const existing = packing.find(p => key(p.name) === key(m.name)); if (existing) existing.previouslyMissed = true; else packing.push(add(m.name, '지난 일정에서 누락 기록이 있어요. 이번에는 직접 확인해 주세요.', false, 'missed')) })); return { packing: unique(packing), tasks: unique(tasks) } }

        return Object.freeze({ build, appendActivity, unique });
    }

    return Object.freeze({ createEngine });
})();
