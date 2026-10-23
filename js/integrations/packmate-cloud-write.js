window.PACKMATE_CLOUD_WRITE = (() => {
    "use strict";

    async function createTrip(expectedUserId, expectedAccountGeneration, expectedAuthGeneration, trip) {
        const auth = window.PACKMATE_AUTH;
        const accounts = window.PACKMATE_ACCOUNT_STATE;
        const state = auth?.getState?.();
        const account = accounts?.getState?.();

        if (!state?.user || state.user.id !== expectedUserId || state.status !== "ready" ||
            state.generation !== expectedAuthGeneration ||
            !account || account.status !== "ready" || account.userId !== expectedUserId ||
            account.generation !== expectedAccountGeneration) {
            return { ok: false, reason: "accountChanged" };
        }

        if (!trip || typeof trip !== "object" || Array.isArray(trip) ||
            typeof trip.id !== "string" || !trip.id.trim()) {
            return { ok: false, reason: "invalidTrip" };
        }

        const create = auth.createCloudTrip;
        if (typeof create !== "function") {
            return { ok: false, reason: "clientUnavailable" };
        }

        try {
            const result = await create(expectedUserId, expectedAuthGeneration, trip);
            const afterAuth = auth.getState?.();
            const afterAccount = accounts.getState?.();
            if (!afterAuth || afterAuth.status !== "ready" || afterAuth.user?.id !== expectedUserId ||
                afterAuth.generation !== expectedAuthGeneration ||
                !afterAccount || afterAccount.status !== "ready" || afterAccount.userId !== expectedUserId ||
                afterAccount.generation !== expectedAccountGeneration) {
                return result?.ok
                    ? { ok: false, reason: "accountChanged", insertCompleted: true }
                    : { ok: false, reason: "accountChanged" };
            }
            if (!result?.ok) return result || { ok: false, reason: "insertFailed" };
            if (result.userId && result.userId !== expectedUserId) {
                return { ok: false, reason: "accountChanged", insertCompleted: true };
            }
            return { ...result, ok: true, userId: expectedUserId, tripId: trip.id };
        } catch (_) {
            return { ok: false, reason: "insertFailed" };
        }
    }

    async function updateTrip(expectedUserId, expectedAccountGeneration, expectedAuthGeneration,
        tripId, expectedRevision, trip) {
        const auth = window.PACKMATE_AUTH;
        const accounts = window.PACKMATE_ACCOUNT_STATE;
        const state = auth?.getState?.();
        const account = accounts?.getState?.();

        if (!state?.user || state.user.id !== expectedUserId || state.status !== "ready" ||
            state.generation !== expectedAuthGeneration ||
            !account || account.status !== "ready" || account.userId !== expectedUserId ||
            account.generation !== expectedAccountGeneration) {
            return { ok: false, reason: "accountChanged" };
        }
        if (typeof tripId !== "string" || !tripId.trim() ||
            !Number.isSafeInteger(expectedRevision) || expectedRevision < 1 ||
            expectedRevision >= Number.MAX_SAFE_INTEGER) {
            return { ok: false, reason: "invalidRevisionOrTripId" };
        }
        if (!trip || typeof trip !== "object" || Array.isArray(trip) ||
            typeof trip.id !== "string" || trip.id !== tripId) {
            return { ok: false, reason: "invalidTrip" };
        }

        const update = auth.updateCloudTrip;
        if (typeof update !== "function") return { ok: false, reason: "clientUnavailable" };

        try {
            const result = await update(expectedUserId, expectedAuthGeneration,
                tripId, expectedRevision, trip);
            const afterAuth = auth.getState?.();
            const afterAccount = accounts.getState?.();
            if (!afterAuth || afterAuth.status !== "ready" || afterAuth.user?.id !== expectedUserId ||
                afterAuth.generation !== expectedAuthGeneration ||
                !afterAccount || afterAccount.status !== "ready" || afterAccount.userId !== expectedUserId ||
                afterAccount.generation !== expectedAccountGeneration) {
                return result?.ok
                    ? { ok: false, reason: "accountChanged", updateCompleted: true }
                    : { ok: false, reason: "accountChanged" };
            }
            if (!result?.ok) return result || { ok: false, reason: "updateFailed" };
            if ((result.userId && result.userId !== expectedUserId) ||
                (result.tripId && result.tripId !== tripId) ||
                result.revision !== expectedRevision + 1) {
                return { ok: false, reason: "updateResultInvalid" };
            }
            return { ...result, ok: true, userId: expectedUserId, tripId, revision: expectedRevision + 1 };
        } catch (_) {
            const afterAuth = auth.getState?.();
            const afterAccount = accounts.getState?.();
            if (!afterAuth || afterAuth.status !== "ready" || afterAuth.user?.id !== expectedUserId ||
                afterAuth.generation !== expectedAuthGeneration ||
                !afterAccount || afterAccount.status !== "ready" || afterAccount.userId !== expectedUserId ||
                afterAccount.generation !== expectedAccountGeneration) {
                return { ok: false, reason: "accountChanged" };
            }
            return { ok: false, reason: "updateOutcomeUnknown" };
        }
    }

    async function deleteTrip(expectedUserId, expectedAccountGeneration, expectedAuthGeneration,
        tripId, expectedRevision) {
        const auth = window.PACKMATE_AUTH;
        const accounts = window.PACKMATE_ACCOUNT_STATE;
        const state = auth?.getState?.();
        const account = accounts?.getState?.();

        if (!state?.user || state.user.id !== expectedUserId || state.status !== "ready" ||
            state.generation !== expectedAuthGeneration ||
            !account || account.status !== "ready" || account.userId !== expectedUserId ||
            account.generation !== expectedAccountGeneration) {
            return { ok: false, reason: "accountChanged" };
        }
        if (typeof tripId !== "string" || !tripId.trim() ||
            !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
            return { ok: false, reason: "invalidRevisionOrTripId" };
        }

        const remove = auth.deleteCloudTrip;
        if (typeof remove !== "function") return { ok: false, reason: "clientUnavailable" };

        const isSameAccount = () => {
            const currentAuth = auth.getState?.();
            const currentAccount = accounts.getState?.();
            return currentAuth?.status === "ready" && currentAuth.user?.id === expectedUserId &&
                currentAuth.generation === expectedAuthGeneration &&
                currentAccount?.status === "ready" && currentAccount.userId === expectedUserId &&
                currentAccount.generation === expectedAccountGeneration;
        };

        try {
            const result = await remove(expectedUserId, expectedAuthGeneration, tripId, expectedRevision);
            if (!isSameAccount()) {
                return result?.ok
                    ? { ok: false, reason: "accountChanged", deleteCompleted: true }
                    : { ok: false, reason: "accountChanged" };
            }
            if (!result?.ok) return result || { ok: false, reason: "deleteFailed" };
            if ((result.userId && result.userId !== expectedUserId) ||
                (result.tripId && result.tripId !== tripId) || result.revision !== expectedRevision) {
                return { ok: false, reason: "deleteResultInvalid" };
            }
            return { ...result, ok: true, userId: expectedUserId, tripId, revision: expectedRevision };
        } catch (_) {
            return isSameAccount()
                ? { ok: false, reason: "deleteOutcomeUnknown" }
                : { ok: false, reason: "accountChanged" };
        }
    }

    return Object.freeze({ createTrip, updateTrip, deleteTrip });
})();
