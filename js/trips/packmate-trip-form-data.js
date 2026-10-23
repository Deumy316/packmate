window.PACKMATE_TRIP_FORM_DATA = (() => {
    'use strict';

    function createFormData(context) {
        const { el, id, selectedActivities } = context;

        function formTrip(old = null) { const data = new FormData(el.form), name = String(data.get('tripName') || '').trim(), destination = String(data.get('destination') || '').trim(), type = data.get('tripType') || 'domestic', destinationCity = type === 'international' ? String(data.get('destinationCity') || '').trim() : '', activities = selectedActivities(data), weatherConditions = [...el.form.querySelectorAll('input[name="weatherConditions"]:checked')].map(x => x.value); if (!name || !destination) { el.error.textContent = !name ? '일정 이름을 입력해 주세요.' : '이동 지역 또는 국가를 입력해 주세요.'; el.error.hidden = false; return null } const duration = Number(data.get('duration')) || 0; return { ...(old || {}), id: old?.id || id(), name, destination, destinationCountry: type === 'international' ? destination : '', destinationCity, type, purposeCategory: data.get('purposeCategory') || 'travel', purpose: data.get('subPurpose') || '관광', subPurpose: data.get('subPurpose') || '관광', transport: data.get('transport') || '', duration: el.lodging.value === 'yes' ? duration : 0, lodging: el.lodging.value === 'yes' && duration > 0, startDate: el.start.value, endDate: el.end.value, activities, weatherConditions: weatherConditions.length ? weatherConditions : ['normal'], recommendationVersion: 1, createdAt: old?.createdAt || Date.now(), updatedAt: Date.now(), missedItems: old?.missedItems || [] } }


        return Object.freeze({ formTrip });
    }

    return Object.freeze({ createFormData });
})();
