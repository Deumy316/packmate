window.PACKMATE_CHECKLIST_CONTROLLER = (() => {
    "use strict";

    function createController(context) {
        const {
            displayTrip, displayDestination, category, $,
            renderItems, renderPersonal, renderMissed,
            progressUI, view, applyAccess, el,
            setActiveId
        } = context;

        function openTrip(tripId, { noHistory = false, keepScroll = false } = {}) {
            const t = displayTrip(tripId);
            if (!t) return;

            setActiveId(tripId);

            const meta = [
                displayDestination(t),
                category(t),
                t.subPurpose || t.purpose,
                Number(t.duration)
                    ? `${t.duration}박 ${Number(t.duration) + 1}일`
                    : "당일",
                t.startDate,
                t.endDate,
                t.transport,
                ...(t.activities || [])
            ].filter(Boolean);

            $("#checklistKicker").textContent =
                `${category(t)} · ${t.type === "international" ? "해외" : "국내"}`;
            $("#checklistTitle").textContent = t.name;
            $("#tripMeta").textContent = meta.join(" · ");
            $("#officialNote").hidden = t.type !== "international";

            renderItems(el.packing, t.packing, "packing");
            renderItems(el.tasks, t.tasks, "task");
            renderPersonal();
            renderMissed();
            progressUI();

            view("checklist", { noHistory, keepScroll });
            applyAccess();
        }

        return Object.freeze({ openTrip });
    }

    return Object.freeze({ createController });
})();