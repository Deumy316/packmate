window.PACKMATE_TRIP_ACTIVITIES = (() => {
    "use strict";

    function createActivities(context) {
        const {
            el, $, $$, key, rules, escape,
            canPlan, builtIn, updatePreview, updateActivitySearch,
            getSelectedCustom, getSelectedBuiltIn,
            setSelectedBuiltIn, getDefinitions
        } = context;

        function selectedActivities(fd = null) {
            const a = fd
                ? fd.getAll("activities")
                : $$('input[name="activities"]:checked', el.form).map(x => x.value);

            const seen = new Set();

            return a.concat(getSelectedCustom())
                .map(x => String(x ?? "").trim())
                .filter(x => {
                    const k = key(x);
                    if (!k || seen.has(k)) return false;
                    seen.add(k);
                    return true;
                });
        }

        function renderActivities() {
            const options = $(".activity-options");

            const checked = new Set([
                ...getSelectedBuiltIn(),
                ...$$('input[name="activities"]:checked', options).map(x => x.value)
            ].map(key));

            options.replaceChildren();

            Object.keys(rules).forEach(name => {
                const row = document.createElement("div");
                row.className = "activity-option-entry";

                const label = document.createElement("label");
                label.className = "check-chip";
                label.innerHTML = `<input type="checkbox" name="activities" value="${escape(name)}" ${checked.has(key(name)) ? "checked" : ""}><span>${escape(name)}</span>`;

                const button = document.createElement("button");
                button.type = "button";
                button.className = "activity-mini-action basic-activity-settings";
                button.dataset.basicActivitySettings = name;
                button.textContent = "준비물 설정";
                button.disabled = !canPlan();
                button.setAttribute("aria-label", `${name} 기본 추천 준비물에 사용자 준비물 추가`);

                row.append(label, button);
                options.append(row);
            });

            setSelectedBuiltIn(
                $$('input[name="activities"]:checked', options).map(x => x.value)
            );

            const list = $("#customActivityList");
            list.replaceChildren();

            const seen = new Set();

            getDefinitions().forEach(d => {
                if (builtIn(d.name) || seen.has(key(d.name))) return;
                seen.add(key(d.name));

                const row = document.createElement("div");
                row.className = "custom-activity-entry";

                row.innerHTML = `<label class="check-chip custom-activity-check"><input type="checkbox" name="activities" value="${escape(d.name)}" ${getSelectedCustom().some(x => key(x) === key(d.name)) ? "checked" : ""}><span>${escape(d.name)}</span></label><div class="activity-card-actions"><button type="button" class="activity-mini-action" data-activity-settings="${escape(d.id)}" ${canPlan() ? "" : "disabled"}>준비물 설정</button><button type="button" class="activity-mini-action icon-action" data-activity-edit="${escape(d.id)}" aria-label="${escape(d.name)} 활동 이름 수정" ${canPlan() ? "" : "disabled"}>✎</button><button type="button" class="activity-mini-action icon-action remove-action" data-activity-remove="${escape(d.id)}" aria-label="${escape(d.name)} 활동 삭제" ${canPlan() ? "" : "disabled"}>×</button></div>`;

                list.append(row);
            });

            updatePreview();
            updateActivitySearch();
        }

        return Object.freeze({ selectedActivities, renderActivities });
    }

    return Object.freeze({ createActivities });
})();