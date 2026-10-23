window.PACKMATE_TRIP_FORM_UI = (() => {
    "use strict";

    function createFormUI(context) {
        const { el, $, $$, destinationPreview, cities, key, domestic, international, purpose, activitySearch, activityField, activitySearchStatus } = context;

        function updateDestinationPreview() {
            const country = el.dest.value.trim();
            const city = el.city.value.trim();
            const intl = el.type.value === "international";
            const value = $("strong", destinationPreview);

            if (!country) {
                destinationPreview.hidden = true;
                value.textContent = "";
                return;
            }

            destinationPreview.hidden = false;
            value.textContent = intl
                ? `국가: ${country}${city ? ` · 도시: ${city}` : ""}`
                : `국내 지역: ${country}`;
        }

        function cityOptions() {
            const c = key(el.dest.value);
            const list = cities[Object.keys(cities).find(x => key(x) === c)] || [];

            el.cityList.replaceChildren(...list.map(v => {
                const o = document.createElement("option");
                o.value = v;
                return o;
            }));
        }

        function updateEnd() {
            if (!el.start.value) {
                el.end.value = "";
                return;
            }

            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el.start.value);

            if (!m) {
                el.end.value = "";
                return;
            }

            const d = new Date(Date.UTC(
                +m[1],
                +m[2] - 1,
                +m[3] + (el.lodging.value === "yes" ? Number(el.duration.value) || 0 : 0)
            ));

            el.end.value =
                `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        }

        function setType(t) {
            el.type.value = t === 'international' ? 'international' : 'domestic';
            $$('[data-trip-type]').forEach(b =>
                b.setAttribute('aria-pressed', String(b.dataset.tripType === el.type.value))
            );

            const intl = el.type.value === 'international';
            el.destLabel.innerHTML =
                `${intl ? '해외 국가' : '국내 지역'} <span class="required-label">필수</span>`;
            el.dest.placeholder = intl
                ? '국가를 검색하거나 직접 입력'
                : '지역을 검색하거나 직접 입력';

            el.destList.replaceChildren(...(intl ? international : domestic).map(v => {
                const o = document.createElement('option');
                o.value = v;
                return o;
            }));

            el.cityField.hidden = !intl;
            el.transport.hidden = intl;
            cityOptions();
            updateDestinationPreview();
        }

        function setPurpose(v, sub) {
            el.purpose.value = purpose[v] ? v : 'travel';
            el.sub.replaceChildren(...purpose[el.purpose.value].map(x => new Option(x, x)));
            if (purpose[el.purpose.value].includes(sub)) el.sub.value = sub;
        }

        function updateActivitySearch() {
            const query = key(activitySearch.value);
            const entries = $$('.activity-option-entry, .custom-activity-entry', activityField);
            let visible = 0;

            entries.forEach(row => {
                const name = row.querySelector('input[name="activities"]')?.value || '';
                const match = !query || key(name).includes(query);
                row.hidden = !match;
                if (match) visible++;
            });

            const selected = $$('input[name="activities"]:checked', activityField)
                .map(x => x.value);
            const selectedText = selected.length
                ? `선택됨 ${selected.length}개: ${selected.join(' · ')}`
                : '선택된 활동 없음';
            const results = query ? `검색 결과 ${visible}개` : `활동 ${visible}개`;

            activitySearchStatus.textContent = `${results} · ${selectedText}`;
        }
        return Object.freeze({
            updateDestinationPreview,
            cityOptions,
            updateEnd, setType, setPurpose, updateActivitySearch
        });
    }

    return Object.freeze({ createFormUI });
})();