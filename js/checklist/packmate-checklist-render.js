window.PACKMATE_CHECKLIST_RENDER = (() => {
    'use strict';

    function createRenderer(context) {
        const { escape, canMutate } = context;

        function renderItems(container, items, kind) { container.replaceChildren(); if (!items.length) { const e = document.createElement('div'); e.className = 'empty-items'; e.textContent = kind === 'packing' ? '아직 준비물이 없어요.' : '등록된 출발 전 할 일이 없어요.'; container.append(e); return } items.forEach(x => { const row = document.createElement('div'); row.className = `check-row ${x.done ? 'is-done' : 'is-pending'}`; const label = document.createElement('label'); label.className = `check-item ${kind === 'task' ? 'task-item' : 'packing-item'} ${x.done ? 'is-done' : 'is-pending'}`; const missed = (x.source === 'missed' || x.previouslyMissed === true) && window.PACKMATE_MISSED_ATTENTION?.isActive(x.name, context.getTrips?.() || []) !== false; label.innerHTML = `<input class="item-checkbox" type="checkbox" data-item-kind="${kind}" data-item-id="${escape(x.id)}" ${x.done ? 'checked' : ''} aria-label="${escape(x.name)} ${x.done ? '완료됨' : '미완료'}"><span class="check-item-copy"><strong>${escape(x.name)}</strong>${x.detail ? `<small>${escape(x.detail)}</small>` : ''}${missed ? '<small class="missed-hint">지난 누락 · 이번에도 반드시 직접 확인</small>' : ''}</span>`; row.append(label); if (kind === 'packing') { const c = document.createElement('div'); c.className = 'packing-controls'; c.innerHTML = `<button type="button" class="missed-button" data-mark-missed="${escape(x.id)}">누락 기록</button><button type="button" class="item-action-button" data-edit-item="${escape(x.id)}" aria-label="준비물 수정">✎</button><button type="button" class="item-action-button item-remove-button" data-delete-item="${escape(x.id)}" aria-label="준비물 삭제">×</button>`; row.append(c) } if (!canMutate()) row.querySelectorAll('input,button').forEach(node => node.disabled = true); container.append(row) }) }

        function renderPersonal() {
            const { el, canMutate, getPreviewTrip, getActiveId, getEssentials, escape } = context;

            if (!canMutate()) {
                el.personal.textContent =
                    getPreviewTrip()?.id === getActiveId()
                        ? '체험 미리보기에는 개인 필수품을 저장하지 않습니다.'
                        : '클라우드 일정은 읽기 전용으로 표시됩니다.';
                return;
            }

            const essentials = getEssentials();

            el.personal.innerHTML = essentials.length
                ? `저장된 개인 필수품 ${essentials.length}개가 새 일정에 포함됩니다. <span class="essential-manage">${essentials.map(x => `<button type="button" data-remove-essential="${escape(x.id)}">${escape(x.name)} ×</button>`).join('')}</span>`
                : '개인 필수품은 ‘다음 일정에도 재사용’을 선택해 저장할 수 있어요.';
        }

        function renderMissed() {
            const { el, displayTrip, getActiveId, canMutate, escape } = context;
            const t = displayTrip(getActiveId());
            if (!t) return;

            el.missed.innerHTML = t.missedItems.length
                ? t.missedItems.map(x => `<span class="missed-history-chip">⚑ ${escape(x.name)} <button type="button" data-remove-missed="${escape(x.id)}" ${canMutate() ? '' : 'disabled'}>×</button></span>`).join('')
                : '<span class="missed-empty">아직 누락 기록이 없어요.</span>';
        }
        return Object.freeze({ renderItems, renderPersonal, renderMissed });
    }

    return Object.freeze({ createRenderer });
})();
