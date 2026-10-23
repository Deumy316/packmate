(() => {
  'use strict';

  const form = document.getElementById('tripForm');
  const submitButton = document.getElementById('formSubmitButton');
  if (!form || !submitButton) return;

  const textInputTypes = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number']);
  let enterGuard = false;
  let activation = null;
  let activationTimer = 0;
  let authorizedSubmit = false;
  let authorizationTimer = 0;

  function clearActivation() {
    activation = null;
    window.clearTimeout(activationTimer);
  }

  function setActivation(kind) {
    activation = kind;
    window.clearTimeout(activationTimer);
    activationTimer = window.setTimeout(clearActivation, 1500);
  }

  form.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;

    if (event.target === submitButton) {
      enterGuard = false;
      return;
    }

    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.form !== form || !textInputTypes.has(input.type)) return;

    // Text-field Enter must never inherit an earlier button activation.
    clearActivation();
    enterGuard = true;
    const composing = event.isComposing || event.keyCode === 229;

    // Do not commit partially composed text in the custom activity field.
    if (input.id === 'newActivityInput' && composing) {
      event.stopPropagation();
      return;
    }

    // Preserve native datalist candidate acceptance. The form submit gate
    // below rejects any implicit submission caused by the same Enter key.
    if (input.list) {
      event.stopPropagation();
      return;
    }

    // Let IME consume Enter while composing. For ordinary text entry, cancel
    // implicit submission while leaving app-specific input handlers intact.
    if (!composing) event.preventDefault();
  }, true);

  submitButton.addEventListener('pointerdown', event => {
    if (!event.isTrusted || (event.button !== undefined && event.button !== 0)) return;
    enterGuard = false;
    setActivation('pointer');
  });

  submitButton.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.isComposing && event.keyCode !== 229 && document.activeElement === submitButton) {
      enterGuard = false;
      setActivation('keyboard');
    }
  });

  submitButton.addEventListener('click', event => {
    const explicitKeyboard = activation === 'keyboard' && document.activeElement === submitButton;
    const explicitPointer = activation === 'pointer';
    // Implicit browser clicks from text inputs have no matching button action.
    if (!event.isTrusted || (!explicitKeyboard && !explicitPointer)) return;

    clearActivation();
    authorizedSubmit = true;
    window.clearTimeout(authorizationTimer);
    authorizationTimer = window.setTimeout(() => { authorizedSubmit = false; }, 0);
  });

  document.addEventListener('submit', event => {
    if (event.target !== form) {
      // Keep a dynamically-created activity-preparation form independent.
      if (form.contains(event.target)) {
        event.target.addEventListener('submit', nestedEvent => {
          nestedEvent.stopPropagation();
        }, { once: true });
      }
      return;
    }

    const allowed = event.submitter === submitButton && authorizedSubmit && !enterGuard;
    authorizedSubmit = false;
    window.clearTimeout(authorizationTimer);
    if (allowed) {
      event.packmateExplicitSave = true;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
