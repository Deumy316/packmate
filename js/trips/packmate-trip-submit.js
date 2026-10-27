window.PACKMATE_TRIP_SUBMIT = (() => {
    "use strict";

    function createSubmit(context) {
        const {
            formTrip, build, clone, freeze, openTrip,
            canMutate, canPlan, readonlyNotice, saveDraft,
            preserve, persist, toast, el, DRAFT
        } = context;

        const getEditingId = () => context.getEditingId();
        const setEditingId = value => context.setEditingId(value);
        const getTrips = () => context.getTrips();
        const setTrips = value => context.setTrips(value);
        const setPreviewTrip = value => context.setPreviewTrip(value);
        const finalizeNewTrip = trip => { const recommended = window.PACKMATE_RECOMMENDATION_PREVIEW?.(trip) || trip, dismissals = window.PACKMATE_MISSED_ATTENTION?.carryForward(getTrips()) || []; if (dismissals.length) recommended.missedAttentionDismissals = dismissals; return recommended };
        let saving = false;
        const insertLocks = new Map();
        const updateLocks = new Map();

        function accountCaptureMatches(appState) {
            const accounts = window.PACKMATE_ACCOUNT_STATE;
            const auth = window.PACKMATE_AUTH;
            if (!accounts || !auth || typeof accounts.captureRequest !== 'function' ||
                typeof accounts.isCurrentRequest !== 'function' || typeof accounts.getState !== 'function' ||
                typeof auth.getState !== 'function' || typeof auth.getCurrentUser !== 'function') return null;

            const request = accounts.captureRequest();
            const account = accounts.getState();
            const authState = auth.getState();
            const user = auth.getCurrentUser();
            if (request?.status !== 'ready' || !request.userId ||
                request.userId !== appState?.userId || request.generation !== appState?.generation ||
                account?.status !== 'ready' || account.userId !== request.userId ||
                account.generation !== request.generation ||
                authState?.status !== 'ready' || authState.user?.id !== request.userId ||
                user?.id !== request.userId || !accounts.isCurrentRequest(request)) return null;
            return { accounts, auth, request, authGeneration: authState.generation };
        }

        function isSameAccount(captured) {
            if (!captured) return false;
            const { accounts, auth, request, authGeneration } = captured;
            const account = accounts.getState();
            const authState = auth.getState();
            const user = auth.getCurrentUser();
            return Boolean(accounts.isCurrentRequest(request) &&
                account?.status === 'ready' && account.userId === request.userId &&
                account.generation === request.generation &&
                authState?.status === 'ready' && authState.user?.id === request.userId &&
                authState.generation === authGeneration && user?.id === request.userId);
        }

        function getCloudAccountView(captured) {
            if (!captured) return null;
            const appState = window.PACKMATE_APP_DATA?.getState?.();
            const accounts = captured.accounts;
            const auth = captured.auth;
            const account = accounts.getState();
            const authState = auth.getState();
            const user = auth.getCurrentUser();
            if (appState?.mode !== 'cloud-readonly' ||
                appState.userId !== captured.request.userId || appState.generation !== captured.request.generation ||
                !accounts.isCurrentRequest(captured.request) ||
                account?.status !== 'ready' || account.userId !== captured.request.userId ||
                account.generation !== captured.request.generation ||
                authState?.status !== 'ready' || authState.user?.id !== captured.request.userId ||
                authState.generation !== captured.authGeneration || user?.id !== captured.request.userId) return null;
            return { appState, account, authState };
        }

        function tripSubmissionKey(trip) {
            const comparable = { ...trip };
            delete comparable.id;
            delete comparable.createdAt;
            delete comparable.updatedAt;
            return JSON.stringify(comparable);
        }

        function cloudUpdateKey(captured, tripId) {
            return `${captured.request.userId}\\u0000${captured.request.generation}\\u0000${tripId}`;
        }

        function previewPlan() {
            const t = formTrip();
            if (!t) return;
            const generated = build(t);
            t.id = `preview-${t.id}`;
            t.packing = generated.packing;
            t.tasks = generated.tasks;
            const recommended = finalizeNewTrip(t);
            const preview = freeze(clone(recommended));
            setPreviewTrip(preview);
            setEditingId(null);
            openTrip(preview.id);
            toast('체험 미리보기예요. 입력 내용과 추천 결과는 저장되지 않습니다.');
        }

        function captureGuestState() {
            const appState = window.PACKMATE_APP_DATA?.getState?.();
            const accounts = window.PACKMATE_ACCOUNT_STATE;
            const auth = window.PACKMATE_AUTH;
            if (appState?.mode !== 'guest-preview' || typeof accounts?.getState !== 'function' ||
                typeof auth?.getState !== 'function' || typeof auth?.getCurrentUser !== 'function') return null;

            const accountState = accounts.getState();
            const authState = auth.getState();
            const currentUser = auth.getCurrentUser();
            const userIds = [appState.userId, accountState?.userId, authState?.user?.id, currentUser?.id];
            const loggedOut = userIds.every(id => id === null || id === undefined || id === '');
            const generation = appState.generation;
            const pendingStatuses = new Set(['loading', 'initializing', 'authenticating', 'signing-out']);
            if (!loggedOut || !Number.isSafeInteger(generation) || generation < 0 ||
                accountState?.generation !== generation ||
                pendingStatuses.has(accountState?.status) || pendingStatuses.has(authState?.status)) return null;
            return {
                userId: null,
                generation,
                authGeneration: authState.generation
            };
        }

        function isSameGuestState(captured) {
            if (!captured) return false;
            const current = captureGuestState();
            return Boolean(current && current.userId === captured.userId &&
                current.generation === captured.generation &&
                current.authGeneration === captured.authGeneration);
        }

        function guestTripsReflected(savedTrips, savedTrip) {
            try {
                const currentTrips = getTrips();
                if (!Array.isArray(currentTrips) || currentTrips.length !== savedTrips.length) return false;
                if (!currentTrips.every((item, index) =>
                    item && savedTrips[index] && item.id === savedTrips[index].id)) return false;
                return currentTrips.some(item => item.id === savedTrip.id);
            } catch (_) {
                return false;
            }
        }

        function saveGuestTrip() {
            if (saving) return;
            const appState = window.PACKMATE_APP_DATA?.getState?.();
            const editingId = getEditingId();
            if (appState?.mode !== 'guest-preview' ||
                (editingId !== null && editingId !== undefined && editingId !== '')) {
                readonlyNotice();
                return;
            }
            if (typeof context.appendGuestTrip !== 'function' ||
                typeof context.onGuestTripsSaved !== 'function') {
                toast('비로그인 신규 저장을 시작하지 않았어요. appendGuestTrip 및 onGuestTripsSaved 연결이 필요합니다.');
                return;
            }

            const requestGuest = captureGuestState();
            if (!requestGuest) {
                toast('비로그인 계정 상태와 generation을 확인할 수 없어 저장을 시작하지 않았어요.');
                return;
            }

            const tripData = formTrip();
            if (!tripData) return;
            const generated = build(tripData);
            tripData.packing = generated.packing;
            tripData.tasks = generated.tasks;
            const trip = freeze(clone(finalizeNewTrip(tripData)));
            if (!trip || typeof trip.id !== 'string' || !trip.id.trim() ||
                !Array.isArray(trip.packing) || !Array.isArray(trip.tasks)) {
                toast('새 일정과 추천 준비물·할 일 목록을 만들지 못해 저장하지 않았어요. 입력 내용을 확인해 주세요.');
                return;
            }

            saving = true;
            const submitWasDisabled = el.submit.disabled;
            el.submit.disabled = true;
            el.submit.setAttribute('aria-busy', 'true');
            try {
                const currentEditingId = getEditingId();
                if (!Number.isSafeInteger(requestGuest.generation) || requestGuest.generation < 0 ||
                    !isSameGuestState(requestGuest) ||
                    (currentEditingId !== null && currentEditingId !== undefined && currentEditingId !== '')) {
                    toast('계정 상태가 변경되었거나 generation을 확인할 수 없어 게스트 신규 저장을 시작하지 않았어요.');
                    return;
                }

                let result;
                try {
                    result = context.appendGuestTrip(trip, requestGuest.generation);
                } catch (_) {
                    toast('로컬 저장 함수에서 오류가 발생해 저장 결과를 확인할 수 없어요. 기존 데이터와 작성 내용은 그대로 두었습니다.');
                    return;
                }
                if (result && typeof result.then === 'function') {
                    toast('appendGuestTrip 반환 형식이 동기 저장 계약과 달라 저장 결과를 확인할 수 없어요. 화면은 변경하지 않았습니다.');
                    return;
                }
                if (!result?.ok) {
                    const messages = {
                        guestModeRequired: '게스트 모드가 아니어서 로컬 일정 저장을 거부했어요.',
                        accountChanged: '계정 상태가 변경되어 로컬 일정 저장을 취소했어요. 기존 일정은 유지됩니다.',
                        invalidTrip: '기존 또는 새 일정 정보가 올바르지 않아 저장하지 않았어요.',
                        duplicateTripId: '같은 일정 ID가 이미 있어 저장하지 않았어요. 기존 일정은 유지됩니다.',
                        invalidJson: '기존 로컬 일정 데이터를 읽을 수 없어 덮어쓰지 않았어요.',
                        invalidFormat: '기존 로컬 일정 데이터 형식이 올바르지 않아 덮어쓰지 않았어요.',
                        storageUnavailable: '브라우저 저장소에 접근할 수 없어 저장하지 못했어요. 기존 일정은 유지됩니다.',
                        storageFull: '브라우저 저장 공간이 부족해 저장하지 못했어요. 기존 일정은 유지됩니다.',
                        storageWriteFailed: '브라우저 저장 중 오류가 발생했어요. 기존 일정은 유지됩니다.',
                        copyFailed: '일정 목록의 안전한 복사본을 만들지 못해 저장하지 않았어요.'
                    };
                    toast(messages[result?.reason] || '로컬 일정 저장에 실패했어요. 작성 내용은 유지됩니다.');
                    return;
                }
                if (!Array.isArray(result.trips)) {
                    toast('저장 함수는 성공을 반환했지만 일정 목록을 확인할 수 없어요. 저장 결과를 확인한 뒤 화면은 변경하지 않았습니다.');
                    return;
                }

                if (!isSameGuestState(requestGuest)) {
                    toast('로컬 일정 저장은 완료됐지만 계정 상태가 바뀌어 현재 화면에는 반영하지 않았어요.');
                    return;
                }

                try {
                    context.onGuestTripsSaved(result.trips, trip, requestGuest.generation);
                } catch (_) {
                    toast('로컬 일정 저장은 완료됐지만 화면 반영 콜백에서 오류가 발생했어요. 새로고침 후 목록을 확인해 주세요.');
                    return;
                }

                if (!isSameGuestState(requestGuest) || !guestTripsReflected(result.trips, trip)) {
                    toast('로컬 일정 저장은 완료됐지만 현재 화면에 반영됐는지 확인할 수 없어요. 새로고침 후 목록을 확인해 주세요.');
                    return;
                }
                toast('새 일정을 이 브라우저에 저장하고 화면 목록에 반영했어요.');
            } catch (_) {
                toast('로컬 일정 처리 중 오류가 발생했어요. 저장 여부와 화면 반영을 구분해 확인해 주세요. 작성 내용과 미리보기는 초기화하지 않았어요.');
            } finally {
                saving = false;
                el.submit.removeAttribute('aria-busy');
                el.submit.disabled = submitWasDisabled;
            }
        }

        async function saveCloudTrip() {
            if (saving) return;
            const appState = window.PACKMATE_APP_DATA?.getState?.();
            if (appState?.mode !== 'cloud-readonly' || getEditingId()) {
                readonlyNotice();
                return;
            }
            const captured = accountCaptureMatches(appState);
            if (!captured || !isSameAccount(captured)) {
                toast('계정 인증 상태가 변경되었어요. 다시 확인한 뒤 저장해 주세요.');
                return;
            }

            const tripData = formTrip();
            if (!tripData) return;
            const generated = build(tripData);
            tripData.packing = generated.packing;
            tripData.tasks = generated.tasks;
            const trip = freeze(clone(finalizeNewTrip(tripData)));
            const submissionKey = tripSubmissionKey(trip);
            const previousInsert = insertLocks.get(submissionKey);
            if (previousInsert) {
                toast(previousInsert === 'unknown'
                    ? '이 일정의 이전 INSERT 결과를 확인할 수 없어 중복 저장을 차단했어요. 클라우드 목록을 새로고침해 확인해 주세요.'
                    : '이 일정은 클라우드 INSERT 성공이 확인되어 중복 저장을 차단했어요.');
                return;
            }

            const writer = window.PACKMATE_CLOUD_WRITE;
            const cloudTrips = window.PACKMATE_ACCOUNT_TRIPS;
            if (typeof writer?.createTrip !== 'function' || typeof cloudTrips?.refresh !== 'function') {
                toast('클라우드 저장 기능을 사용할 수 없어요. INSERT 요청 전이므로 입력 내용은 저장되지 않았습니다.');
                return;
            }

            saving = true;
            const submitWasDisabled = el.submit.disabled;
            el.submit.disabled = true;
            el.submit.setAttribute('aria-busy', 'true');
            let insertRequestStarted = false;
            try {
                if (!isSameAccount(captured)) {
                    toast('인증 상태가 변경되어 INSERT 요청 전에 저장을 취소했어요. 입력 내용은 저장되지 않았습니다.');
                    return;
                }
                insertRequestStarted = true;
                const inserted = await writer.createTrip(
                    captured.request.userId, captured.request.generation,
                    captured.authGeneration, trip);
                if (inserted?.ok || inserted?.insertCompleted === true) {
                    insertLocks.set(submissionKey, 'confirmed');
                }

                if (!isSameAccount(captured)) {
                    if (inserted?.ok || inserted?.insertCompleted === true) {
                        toast('INSERT 성공이 확인됐지만 계정이 변경되어 현재 화면은 갱신하지 않았어요. 동일 일정 재제출은 차단했습니다.');
                    } else {
                        insertLocks.set(submissionKey, 'unknown');
                        toast('계정이 변경되어 INSERT 결과를 확인할 수 없어요. 중복 저장 방지를 위해 동일 일정 재제출을 차단했습니다. 새로고침 후 확인해 주세요.');
                    }
                    return;
                }
                if (!inserted?.ok) {
                    // These results are returned before the auth INSERT API is called.
                    if (inserted?.reason === 'invalidTrip' || inserted?.reason === 'clientUnavailable') {
                        const message = inserted.reason === 'invalidTrip'
                            ? '일정 정보가 올바르지 않아 INSERT 요청 전에 저장을 중단했어요. 입력 내용을 확인해 주세요.'
                            : '클라우드 저장 기능을 사용할 수 없어 INSERT 요청 전에 중단했어요. 입력 내용은 저장되지 않았습니다.';
                        toast(message);
                        return;
                    }
                    // accountChanged/insertFailed do not prove that the server rejected the request.
                    insertLocks.set(submissionKey, 'unknown');
                    toast('클라우드 INSERT 성공 여부를 확인할 수 없어요. 중복 저장 방지를 위해 동일 일정 재제출을 차단했습니다. 새로고침 후 클라우드 목록을 확인해 주세요.');
                    return;
                }

                let refreshed;
                try {
                    refreshed = await cloudTrips.refresh();
                } catch (_) {
                    refreshed = null;
                }
                if (!isSameAccount(captured)) {
                    toast('일정 INSERT 성공은 확인됐지만 계정이 변경되어 현재 화면은 갱신하지 않았어요.');
                    return;
                }
                if (!refreshed?.ok || refreshed.userId !== captured.request.userId ||
                    refreshed.generation !== captured.request.generation || !Array.isArray(refreshed.trips)) {
                    toast('일정 INSERT 성공은 확인됐지만 클라우드 재조회에 실패했어요. 중복 저장하지 말고 새로고침 후 확인해 주세요.');
                    return;
                }
                const containsInserted = refreshed.trips.some(row =>
                    row?.tripId === trip.id && row.payload?.id === trip.id);
                if (!containsInserted) {
                    toast('일정 INSERT 성공은 확인됐지만 재조회 목록에 새 일정이 없어요. 중복 저장하지 말고 새로고침 후 확인해 주세요.');
                    return;
                }

                if (!getCloudAccountView(captured)) {
                    toast('일정 INSERT 성공은 확인됐지만 계정이 변경되어 현재 화면은 갱신하지 않았어요.');
                    return;
                }
                try { localStorage.removeItem(DRAFT); } catch (_) { }
                toast('새 일정을 클라우드에 저장하고 목록을 재조회했어요. 화면을 갱신합니다.');
                window.setTimeout(() => {
                    if (getCloudAccountView(captured)) window.location.reload();
                }, 700);
            } catch (_) {
                if (insertLocks.get(submissionKey) === 'confirmed') {
                    toast('일정 INSERT 성공은 확인됐지만 후속 처리가 완료되지 않았어요. 중복 저장하지 말고 새로고침 후 확인해 주세요.');
                } else if (insertRequestStarted) {
                    insertLocks.set(submissionKey, 'unknown');
                    toast('클라우드 INSERT 응답을 확인할 수 없어 저장 결과가 불명확해요. 중복 저장 방지를 위해 동일 일정 재제출을 차단했습니다. 새로고침 후 확인해 주세요.');
                } else {
                    toast('INSERT 요청 전에 저장을 중단했어요. 입력 내용은 저장되지 않았습니다. 다시 확인해 주세요.');
                }
            } finally {
                saving = false;
                el.submit.removeAttribute('aria-busy');
                el.submit.disabled = submitWasDisabled;
            }
        }

        async function saveCloudTripUpdate() {
            if (saving) return;
            const appState = window.PACKMATE_APP_DATA?.getState?.();
            const tripId = getEditingId();
            if (appState?.mode !== 'cloud-readonly' || typeof tripId !== 'string' || !tripId.trim()) {
                readonlyNotice();
                return;
            }
            const captured = accountCaptureMatches(appState);
            if (!captured || !getCloudAccountView(captured)) {
                toast('계정 인증 상태가 변경되어 일정을 수정할 수 없어요. 다시 확인해 주세요.');
                return;
            }

            // This synchronous callback must return an account-bound cloud row, including its revision.
            // Without it, the submit module deliberately never calls updateTrip().
            if (typeof context.getCloudTripRecord !== 'function') {
                toast('클라우드 일정 revision 연결이 없어 UPDATE를 시작하지 않았어요. 최신 목록 연결이 필요합니다.');
                return;
            }
            let cloudRecord;
            try {
                cloudRecord = context.getCloudTripRecord(
                    tripId, captured.request.userId, captured.request.generation);
            } catch (_) {
                cloudRecord = null;
            }
            if (!cloudRecord || typeof cloudRecord.then === 'function' ||
                cloudRecord.userId !== captured.request.userId ||
                cloudRecord.generation !== captured.request.generation ||
                cloudRecord.tripId !== tripId ||
                !cloudRecord.payload || typeof cloudRecord.payload !== 'object' ||
                Array.isArray(cloudRecord.payload) || cloudRecord.payload.id !== tripId ||
                !Number.isSafeInteger(cloudRecord.revision) || cloudRecord.revision < 1 ||
                cloudRecord.revision >= Number.MAX_SAFE_INTEGER) {
                toast('현재 계정의 일정 ID와 revision을 확인할 수 없어 UPDATE를 시작하지 않았어요. 클라우드 목록을 다시 불러와 주세요.');
                return;
            }
            const existingTrip = getTrips().find(trip => trip?.id === tripId);
            if (!existingTrip) {
                toast('현재 계정의 편집 대상 일정을 찾지 못해 UPDATE를 시작하지 않았어요. 클라우드 목록을 다시 확인해 주세요.');
                return;
            }

            const lockKey = cloudUpdateKey(captured, tripId);
            const previousUpdate = updateLocks.get(lockKey);
            if (previousUpdate) {
                toast(previousUpdate === 'unknown'
                    ? '이 일정의 이전 UPDATE 결과를 확인할 수 없어 재제출을 차단했어요. 클라우드 목록을 새로고침해 확인해 주세요.'
                    : '이 일정의 UPDATE 성공이 확인되어 재제출을 차단했어요. 최신 일정을 다시 불러와 주세요.');
                return;
            }

            const writer = window.PACKMATE_CLOUD_WRITE;
            const cloudTrips = window.PACKMATE_ACCOUNT_TRIPS;
            if (typeof writer?.updateTrip !== 'function' || typeof cloudTrips?.refresh !== 'function') {
                toast('클라우드 UPDATE 또는 재조회 기능을 사용할 수 없어 요청을 시작하지 않았어요.');
                return;
            }

            const old = clone(cloudRecord.payload);
            const tripData = formTrip(old);
            if (!tripData) return;
            const generated = build(tripData);
            tripData.id = tripId;
            tripData.createdAt = old.createdAt;
            tripData.packing = preserve(generated.packing, old.packing || [], true);
            tripData.tasks = preserve(generated.tasks, old.tasks || []);
            const trip = freeze(clone(tripData));
            if (trip.id !== tripId || trip.createdAt !== old.createdAt) {
                toast('기존 일정 ID 또는 생성일을 보존하지 못해 UPDATE를 시작하지 않았어요.');
                return;
            }

            saving = true;
            const submitWasDisabled = el.submit.disabled;
            el.submit.disabled = true;
            el.submit.setAttribute('aria-busy', 'true');
            let updateRequestStarted = false;
            try {
                if (!isSameAccount(captured) || !getCloudAccountView(captured)) {
                    toast('계정 인증 상태가 변경되어 UPDATE 요청 전에 취소했어요.');
                    return;
                }
                updateRequestStarted = true;
                const updated = await writer.updateTrip(
                    captured.request.userId, captured.request.generation,
                    captured.authGeneration, tripId, cloudRecord.revision, trip);
                if (updated?.ok || updated?.updateCompleted === true) {
                    updateLocks.set(lockKey, 'confirmed');
                }

                if (!isSameAccount(captured)) {
                    if (updated?.ok || updated?.updateCompleted === true) {
                        toast('UPDATE 성공이 확인됐지만 계정이 변경되어 현재 화면은 갱신하지 않았어요.');
                    } else {
                        updateLocks.set(lockKey, 'unknown');
                        toast('계정이 변경되어 UPDATE 결과를 확인할 수 없어요. 중복 UPDATE를 막기 위해 재제출을 차단했습니다. 새로고침 후 확인해 주세요.');
                    }
                    return;
                }
                if (!updated?.ok) {
                    const reason = updated?.reason;
                    if (reason === 'revisionConflict') {
                        toast('다른 곳에서 일정이 수정되어 저장하지 않았어요. 클라우드 목록을 새로고침하고 최신 내용을 확인한 뒤 다시 수정해 주세요.');
                        return;
                    }
                    if (reason === 'tripNotFoundOrForbidden' || reason === 'updateNotAppliedOrForbidden' ||
                        reason === 'permissionDenied') {
                        toast('일정을 찾을 수 없거나 수정 권한이 없어 UPDATE하지 못했어요. 계정과 권한을 확인해 주세요.');
                        return;
                    }
                    if (reason === 'invalidTrip' || reason === 'invalidRevisionOrTripId' ||
                        reason === 'clientUnavailable' || reason === 'invalidStoredRevision') {
                        toast('일정 정보 또는 클라우드 UPDATE 설정이 올바르지 않아 저장하지 못했어요. 입력 내용은 저장되지 않았습니다.');
                        return;
                    }
                    if (reason === 'updateFailed') {
                        toast('클라우드 UPDATE 자체가 실패했어요. 일정은 갱신되지 않았습니다. 잠시 후 다시 확인해 주세요.');
                        return;
                    }
                    // Account change, transport ambiguity, or an invalid success receipt may follow a committed UPDATE.
                    updateLocks.set(lockKey, 'unknown');
                    toast('클라우드 UPDATE 결과를 확인할 수 없어 재제출을 차단했어요. 중복 저장하지 말고 클라우드 목록을 새로고침해 확인해 주세요.');
                    return;
                }

                let refreshed;
                try {
                    refreshed = await cloudTrips.refresh();
                } catch (_) {
                    refreshed = null;
                }
                if (!isSameAccount(captured)) {
                    toast('일정 UPDATE 성공은 확인됐지만 계정이 변경되어 현재 화면은 갱신하지 않았어요.');
                    return;
                }
                if (!refreshed?.ok || refreshed.userId !== captured.request.userId ||
                    refreshed.generation !== captured.request.generation || !Array.isArray(refreshed.trips)) {
                    toast('일정 UPDATE 성공은 확인됐지만 클라우드 재조회에 실패했어요. 중복 저장하지 말고 새로고침 후 확인해 주세요.');
                    return;
                }
                const refreshedRow = refreshed.trips.find(row =>
                    row?.tripId === tripId && row.payload?.id === tripId);
                if (!refreshedRow || refreshedRow.revision !== updated.revision) {
                    toast('일정 UPDATE 성공은 확인됐지만 재조회 결과에서 최신 revision을 확인하지 못했어요. 중복 저장하지 말고 목록을 다시 확인해 주세요.');
                    return;
                }
                if (!getCloudAccountView(captured)) {
                    toast('일정 UPDATE 성공은 확인됐지만 계정이 변경되어 현재 화면은 갱신하지 않았어요.');
                    return;
                }

                try { localStorage.removeItem(DRAFT); } catch (_) { }
                setEditingId(null);
                toast('기존 일정을 클라우드에서 수정하고 재조회했어요. 화면을 갱신합니다.');
                window.setTimeout(() => {
                    if (getCloudAccountView(captured)) window.location.reload();
                }, 700);
            } catch (_) {
                if (updateLocks.get(lockKey) === 'confirmed') {
                    toast('일정 UPDATE 성공은 확인됐지만 후속 재조회 중 오류가 발생했어요. 중복 저장하지 말고 목록을 새로고침해 확인해 주세요.');
                } else if (updateRequestStarted) {
                    updateLocks.set(lockKey, 'unknown');
                    toast('클라우드 UPDATE 응답을 확인할 수 없어 결과가 불명확해요. 중복 UPDATE를 막기 위해 재제출을 차단했습니다. 클라우드 목록을 새로고침해 확인해 주세요.');
                } else {
                    toast('UPDATE 요청 전에 저장을 중단했어요. 일정은 변경되지 않았습니다. 다시 확인해 주세요.');
                }
            } finally {
                saving = false;
                el.submit.removeAttribute('aria-busy');
                el.submit.disabled = submitWasDisabled;
            }
        }

        function submitTrip(e) {
            if (e.submitter !== el.submit || e.packmateExplicitSave !== true) {
                e.preventDefault();
                if (canMutate()) saveDraft();
                else if (!canPlan()) readonlyNotice();
                return;
            }
            e.preventDefault();
            if (saving) return;

            if (canMutate()) {
                const old = getTrips().find(x => x.id === getEditingId());
                const t = formTrip(old);
                if (!t) return;
                const generated = build(t);
                t.packing = old ? preserve(generated.packing, old.packing || [], true) : generated.packing;
                t.tasks = old ? preserve(generated.tasks, old.tasks || []) : generated.tasks;
                if (!old) {
                    const recommended = finalizeNewTrip(t);
                    t.packing = recommended.packing;
                    t.tasks = recommended.tasks;
                }
                const before = getTrips();
                setTrips(old ? getTrips().map(x => x.id === old.id ? t : x) : [...getTrips(), t]);
                if (!persist()) { setTrips(before); return; }
                try { localStorage.removeItem(DRAFT); } catch (_) { }
                setEditingId(null);
                openTrip(t.id);
                toast(old ? '일정과 체크 상태를 보존해 수정했어요.' : '새 일정을 저장했어요.');
                return;
            }

            const appState = window.PACKMATE_APP_DATA?.getState?.();
            if (appState?.mode === 'cloud-readonly') {
                if (getEditingId()) void saveCloudTripUpdate();
                else void saveCloudTrip();
                return;
            }
            if (appState?.mode === 'guest-preview') {
                if (getEditingId()) {
                    readonlyNotice();
                    return;
                }
                saveGuestTrip();
                return;
            }
            if (canPlan()) {
                previewPlan();
                return;
            }
            readonlyNotice();
        }

        return Object.freeze({ previewPlan, submitTrip });
    }

    return Object.freeze({ createSubmit });
})();
