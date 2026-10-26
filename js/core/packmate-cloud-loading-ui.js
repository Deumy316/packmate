(() => {
  'use strict';

  const cloud = window.PACKMATE_ACCOUNT_TRIPS;
  const grid = document.querySelector('#savedTrips');
  const empty = document.querySelector('#emptyTrips');
  const count = document.querySelector('#tripCount');
  if (!cloud?.subscribe || !grid || !empty || !count) return;

  function render(state) {
    const loading = state?.status === 'loading' && Boolean(state.userId);
    if (!loading) {
      if (grid.dataset.cloudLoading === 'true') grid.replaceChildren();
      grid.dataset.cloudLoading = 'false';
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    grid.dataset.cloudLoading = 'true';
    grid.setAttribute('aria-busy', 'true');
    grid.replaceChildren();
    empty.hidden = true;
    count.textContent = '…';

    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.dataset.i18n = 'home.cloudLoading';
    label.textContent = window.PACKMATE_I18N?.t('home.cloudLoading') || '클라우드 일정을 불러오는 중';
    const cards = Array.from({ length: 3 }, () => {
      const card = document.createElement('div');
      card.className = 'saved-trip-card saved-trip-skeleton';
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = '<span class="skeleton-line skeleton-short"></span><span class="skeleton-line skeleton-title"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-footer"></span>';
      return card;
    });
    grid.append(label, ...cards);
  }

  cloud.subscribe(render);
})();
