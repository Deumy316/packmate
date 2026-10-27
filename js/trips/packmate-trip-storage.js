window.PACKMATE_TRIP_STORAGE = (() => {
    "use strict";

    function createStorage(context) {
        const { canMutate, toast, PERSONAL_KEYS, TRIPS, getTrips } = context;

        function loadLocalTrips() {
            let raw;
            try {
                raw = localStorage.getItem(TRIPS);
            } catch (_) {
                return { ok: false, reason: "storageUnavailable" };
            }

            if (raw === null || (typeof raw === "string" && raw.trim() === "")) {
                return { ok: false, reason: "empty" };
            }

            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (_) {
                return { ok: false, reason: "invalidJson" };
            }

            if (!Array.isArray(parsed)) {
                return { ok: false, reason: "invalidFormat" };
            }

            const validTrips = parsed.every(trip =>
                trip !== null && typeof trip === "object" && !Array.isArray(trip) &&
                typeof trip.id === "string" && trip.id.trim().length > 0);
            if (!validTrips) {
                return { ok: false, reason: "invalidTrip" };
            }

            try {
                return { ok: true, trips: JSON.parse(JSON.stringify(parsed)) };
            } catch (_) {
                return { ok: false, reason: "copyFailed" };
            }
        }

        function getGuestSession() {
            try {
                const state = window.PACKMATE_APP_DATA?.getState?.();
                if (!state || state.mode !== "guest-preview") return null;
                const userId = state.userId ?? state.account?.userId ?? state.session?.user?.id ?? null;
                if (userId !== null && userId !== "") return null;
                return {
                    mode: state.mode,
                    userId,
                    generation: state.generation,
                    accountGeneration: state.accountGeneration ?? state.account?.generation,
                    authGeneration: state.authGeneration
                };
            } catch (_) {
                return null;
            }
        }

        function sameGuestSession(first, second) {
            return !!first && !!second &&
                first.mode === second.mode &&
                Object.is(first.userId, second.userId) &&
                Object.is(first.generation, second.generation) &&
                Object.is(first.accountGeneration, second.accountGeneration) &&
                Object.is(first.authGeneration, second.authGeneration);
        }

        function appendGuestTrip(trip, requestGeneration) {
            const initialSession = getGuestSession();
            if (!initialSession) return { ok: false, reason: "guestModeRequired" };
            if (!Number.isSafeInteger(requestGeneration) || requestGeneration < 0) {
                return { ok: false, reason: "invalidGeneration" };
            }
            if (!Object.is(initialSession.generation, requestGeneration)) {
                return { ok: false, reason: "accountChanged" };
            }

            if (trip === null || typeof trip !== "object" || Array.isArray(trip) ||
                typeof trip.id !== "string" || !trip.id.trim()) {
                return { ok: false, reason: "invalidTrip" };
            }

            let newTrip;
            try {
                newTrip = JSON.parse(JSON.stringify(trip));
            } catch (_) {
                return { ok: false, reason: "invalidTrip" };
            }
            if (!newTrip || typeof newTrip !== "object" || Array.isArray(newTrip) ||
                typeof newTrip.id !== "string" || !newTrip.id.trim() || newTrip.id !== trip.id) {
                return { ok: false, reason: "invalidTrip" };
            }

            let raw;
            try {
                raw = localStorage.getItem(TRIPS);
            } catch (_) {
                return { ok: false, reason: "storageUnavailable" };
            }

            let existingTrips = [];
            if (raw !== null) {
                try {
                    existingTrips = JSON.parse(raw);
                } catch (_) {
                    return { ok: false, reason: "invalidJson" };
                }
                if (!Array.isArray(existingTrips)) {
                    return { ok: false, reason: "invalidFormat" };
                }
            }

            const existingIds = new Set();
            for (const existingTrip of existingTrips) {
                if (existingTrip === null || typeof existingTrip !== "object" || Array.isArray(existingTrip) ||
                    typeof existingTrip.id !== "string" || !existingTrip.id.trim()) {
                    return { ok: false, reason: "invalidTrip" };
                }
                if (existingIds.has(existingTrip.id)) {
                    return { ok: false, reason: "duplicateTripId" };
                }
                existingIds.add(existingTrip.id);
            }
            if (existingIds.has(newTrip.id)) {
                return { ok: false, reason: "duplicateTripId" };
            }

            const currentSession = getGuestSession();
            if (!sameGuestSession(initialSession, currentSession)) {
                return { ok: false, reason: "accountChanged" };
            }

            const nativeStorage = window.PACKMATE_NATIVE_STORAGE;
            if (typeof nativeStorage?.appendGuestTrip !== "function") {
                return { ok: false, reason: "storageUnavailable" };
            }

            let result;
            try {
                result = nativeStorage.appendGuestTrip(newTrip, requestGeneration);
            } catch (error) {
                console.error("게스트 일정 저장 예외", {
                    name: error?.name,
                    message: error?.message
                });
                const reason = error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
                    ? "storageFull"
                    : "storageWriteFailed";
                return { ok: false, reason };
            }

            if (!result || typeof result !== "object" || result.ok !== true) {
                return {
                    ok: false,
                    reason: typeof result?.reason === "string" ? result.reason : "storageWriteFailed"
                };
            }
            if (!Array.isArray(result.trips)) {
                return { ok: false, reason: "invalidFormat" };
            }

            const savedIds = new Set();
            const validSavedTrips = result.trips.every(savedTrip => {
                if (savedTrip === null || typeof savedTrip !== "object" || Array.isArray(savedTrip) ||
                    typeof savedTrip.id !== "string" || !savedTrip.id.trim() || savedIds.has(savedTrip.id)) {
                    return false;
                }
                savedIds.add(savedTrip.id);
                return true;
            });
            if (!validSavedTrips || result.trips.length === 0 ||
                result.trips[result.trips.length - 1]?.id !== newTrip.id) {
                return { ok: false, reason: "invalidTrip" };
            }

            let savedTrips;
            try {
                savedTrips = JSON.parse(JSON.stringify(result.trips));
            } catch (_) {
                return { ok: false, reason: "copyFailed" };
            }
            if (!Array.isArray(savedTrips)) {
                return { ok: false, reason: "copyFailed" };
            }

            return { ok: true, trips: savedTrips };
        }

        function getGuestDeleteSession() {
            try {
                const state = window.PACKMATE_APP_DATA?.getState?.();
                const account = window.PACKMATE_ACCOUNT_STATE?.getState?.();
                const auth = window.PACKMATE_AUTH?.getState?.();
                const loggedOut = value => value === null || value === undefined || value === "";
                if (state?.mode !== "guest-preview" || state.status !== "unauthenticated" ||
                    !loggedOut(state.userId) || account?.status !== "ready" ||
                    !loggedOut(account.userId) || auth?.status !== "ready" || !loggedOut(auth.user?.id) ||
                    !Number.isSafeInteger(account.generation) || account.generation < 0 ||
                    !Number.isSafeInteger(auth.generation) || auth.generation < 0 ||
                    state.generation !== account.generation) return null;
                return Object.freeze({
                    accountGeneration: account.generation,
                    authGeneration: auth.generation
                });
            } catch (_) {
                return null;
            }
        }

        function sameGuestDeleteSession(first, second) {
            return !!first && !!second &&
                first.accountGeneration === second.accountGeneration &&
                first.authGeneration === second.authGeneration;
        }

        function deleteGuestTrip(tripId, expectedSession) {
            const initialSession = getGuestDeleteSession();
            if (!sameGuestDeleteSession(initialSession, expectedSession)) {
                return { ok: false, reason: "accountChanged" };
            }
            const remove = window.PACKMATE_NATIVE_STORAGE?.deleteGuestTrip;
            if (typeof remove !== "function") return { ok: false, reason: "storageUnavailable" };

            let result;
            try { result = remove(tripId, initialSession); }
            catch (_) { return { ok: false, reason: "storageWriteFailed" }; }
            if (!result?.ok || !Array.isArray(result.trips)) {
                return { ok: false, reason: result?.reason || "storageWriteFailed" };
            }
            if (result.removedId !== tripId || result.beforeCount !== result.trips.length + 1 ||
                result.trips.some(trip => trip?.id === tripId) ||
                !sameGuestDeleteSession(initialSession, getGuestDeleteSession())) {
                return { ok: false, reason: "accountChanged" };
            }
            try { return { ok: true, trips: JSON.parse(JSON.stringify(result.trips)) }; }
            catch (_) { return { ok: false, reason: "copyFailed" }; }
        }

        function updateGuestItemDone(tripId, itemKind, itemId, done, expectedDone, expectedSession) {
            const initialSession = getGuestDeleteSession();
            if (!sameGuestDeleteSession(initialSession, expectedSession)) return { ok: false, reason: "accountChanged" };
            const update = window.PACKMATE_NATIVE_STORAGE?.updateGuestItemDone;
            if (typeof update !== "function") return { ok: false, reason: "storageUnavailable" };
            let result;
            try { result = update(tripId, itemKind, itemId, done, expectedDone, initialSession); }
            catch (_) { return { ok: false, reason: "storageWriteFailed" }; }
            if (!result?.ok || !Array.isArray(result.trips) || result.tripId !== tripId ||
                result.itemKind !== itemKind || result.itemId !== itemId || result.done !== done ||
                !sameGuestDeleteSession(initialSession, getGuestDeleteSession())) {
                return { ok: false, reason: result?.reason || "accountChanged" };
            }
            try { return { ok: true, trips: JSON.parse(JSON.stringify(result.trips)) }; }
            catch (_) { return { ok: false, reason: "copyFailed" }; }
        }

        function changeGuestMissedAttention(tripId, itemId, action, expectedSession) {
            const initialSession = getGuestDeleteSession();
            if (!sameGuestDeleteSession(initialSession, expectedSession)) return { ok: false, reason: "accountChanged" };
            const change = window.PACKMATE_NATIVE_STORAGE?.changeGuestMissedAttention;
            if (typeof change !== "function") return { ok: false, reason: "storageUnavailable" };
            let result;
            try { result = change(tripId, itemId, action, initialSession); }
            catch (_) { return { ok: false, reason: "storageWriteFailed" }; }
            if (!result?.ok || !Array.isArray(result.trips) || result.tripId !== tripId || result.itemId !== itemId || result.action !== action || !sameGuestDeleteSession(initialSession, getGuestDeleteSession())) return { ok: false, reason: result?.reason || "accountChanged" };
            try { return { ...result, trips: JSON.parse(JSON.stringify(result.trips)) }; }
            catch (_) { return { ok: false, reason: "copyFailed" }; }
        }

        function save(k, v) {
            if (PERSONAL_KEYS.has(k) && !canMutate()) return false;

            try {
                localStorage.setItem(k, JSON.stringify(v));
                return true;
            } catch (e) {
                console.warn("저장 실패", e);
                toast("저장하지 못했어요. 브라우저 저장 공간과 권한을 확인해 주세요.");
                return false;
            }
        }

        function persist() {
            return canMutate() && save(TRIPS, getTrips());
        }

        return Object.freeze({ loadLocalTrips, appendGuestTrip, getGuestDeleteSession, deleteGuestTrip, updateGuestItemDone, changeGuestMissedAttention, save, persist });
    }

    return Object.freeze({ createStorage });
})();
