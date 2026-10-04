/* Form buttons, made robust: some embedded viewers (like in-app previews) swallow form
   "submit" events, which makes Save / Sign in buttons look dead. This runs each form's
   handler directly when its submit button is clicked or Enter is pressed in a field. */
(function () {
  if (typeof document === 'undefined' || window.__hirelineFormShim) return;
  window.__hirelineFormShim = true;

  function run(form) {
    const bad = Array.from(form.querySelectorAll('[required]')).find((x) => !String(x.value).trim());
    if (bad) {
      const label = (bad.closest('.field') && bad.closest('.field').querySelector('span')) || null;
      if (window.hirelineToast) window.hirelineToast((label ? label.textContent : 'This field') + ' is needed');
      bad.focus();
      return;
    }
    const fake = { preventDefault() {}, stopPropagation() {}, persist() {}, currentTarget: form, target: form, type: 'submit' };
    const reactKey = Object.keys(form).find((k) => k.indexOf('__reactProps$') === 0);
    if (reactKey && typeof form[reactKey].onSubmit === 'function') return form[reactKey].onSubmit(fake);
    if (typeof form.onsubmit === 'function') return form.onsubmit(fake);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('button');
    if (!btn || !btn.form || (btn.getAttribute('type') || 'submit') !== 'submit') return;
    e.preventDefault();
    run(btn.form);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || !el.form || ['checkbox', 'radio', 'button'].includes(el.type)) return;
    e.preventDefault();
    run(el.form);
  }, true);
})();
