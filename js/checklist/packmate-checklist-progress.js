window.PACKMATE_CHECKLIST_PROGRESS = (() => {
    'use strict';

    function createProgress(context) {
        const { displayTrip, percent, $, $$ } = context;
const getActiveId = () => context.getActiveId();

        function progressUI() { const t = displayTrip(getActiveId()); if (!t) return; for (const [kind, list] of [['packing', t.packing], ['task', t.tasks]]) { const p = percent(list), prefix = kind === 'packing' ? 'packing' : 'task'; $(`#${prefix}ProgressText`).textContent = `${p}%`; $(`#${prefix}ProgressBar`).style.width = `${p}%`; $(`#${prefix}ProgressCount`).textContent = `${list.filter(x => x.done).length} / ${list.length}개 완료`; $(`#${prefix}ItemCount`).textContent = `${list.length}개` } const p = t.packing.filter(x => !x.done).length, q = t.tasks.filter(x => !x.done).length; $('#preflightSummary').innerHTML = `<span class="preflight-count">${p}개</span> 미수납 준비물 <span class="preflight-divider">·</span> <span class="preflight-count">${q}개</span> 미완료 업무`; $('#preflightSummary').classList.toggle('has-pending', p + q > 0) }


        function refreshChecklistUi() { const tools = $('.packmate-checklist-tools'), activeFilter = tools?.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter || 'all', rows = $$('#packingItems .check-row'), counts = new Map(); let done = 0; rows.forEach(row => { const checked = !!row.querySelector('input[type="checkbox"]')?.checked, key = row.dataset.packmateCategory || 'basic', matches = activeFilter === 'all' || (activeFilter === 'done' ? checked : !checked); if (checked) done++; if (matches) counts.set(key, (counts.get(key) || 0) + 1); row.hidden = !matches }); $$('#packingItems [data-category-card]').forEach(card => { const key = card.dataset.categoryCard; card.hidden = !(counts.get(key) > 0) }); if (tools) { const n = rows.length, p = n ? Math.round(done * 100 / n) : 0, count = tools.querySelector('.packmate-count-text'), percentText = tools.querySelector('.packmate-percent-text'), fill = tools.querySelector('.packmate-mini-fill'); if (count) count.textContent = `${done}/${n}개 완료`; if (percentText) percentText.textContent = `${p}%`; if (fill) fill.style.width = `${p}%`; tools.querySelectorAll('.packmate-category-toggles [data-category-toggle]').forEach(button => button.hidden = !(counts.get(button.dataset.categoryToggle) > 0)) } }

        return Object.freeze({ progressUI, refreshChecklistUi });
    }

    return Object.freeze({ createProgress });
})();
