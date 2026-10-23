window.PACKMATE_ACCESS_POLICY = Object.freeze({
    canMutate: state => state?.mode === "local",
    canPlan: state =>
        ["local", "cloud-readonly", "guest-preview"].includes(state?.mode)
});