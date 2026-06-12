(function () {
  // SHOW_NAME is defined in app.js (loads before this file)
  var SHOW_NAME_VAL = (typeof SHOW_NAME !== 'undefined') ? SHOW_NAME : '';
  // "SEIADA 2026" → "source-show-seiada-2026"
  var SHOW_TAG = SHOW_NAME_VAL
    ? 'source-show-' + SHOW_NAME_VAL.toLowerCase().replace(/\s+/g, '-')
    : '';

  var QUEUE_KEY = 'ashton-contact-queue';

  var overlay = document.getElementById('contact-modal');
  if (!overlay) return;

  // Inject native form into modal body (replaces placeholder iframe)
  var modalBody = overlay.querySelector('.contact-modal-body');
  if (modalBody) {
    modalBody.innerHTML =
      '<form id="ashton-contact-form" novalidate>' +
        '<div style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;" aria-hidden="true">' +
          '<input id="ac-website" name="website" type="text" tabindex="-1" autocomplete="off">' +
        '</div>' +
        '<div class="form-row" style="margin-bottom:0">' +
          '<div class="form-group">' +
            '<label class="form-label" for="ac-first">First name *</label>' +
            '<input class="form-input" id="ac-first" name="firstName" type="text" placeholder="Jane" autocomplete="given-name" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="ac-last">Last name *</label>' +
            '<input class="form-input" id="ac-last" name="lastName" type="text" placeholder="Smith" autocomplete="family-name" required>' +
          '</div>' +
        '</div>' +
        '<div class="form-group" style="margin-top:16px">' +
          '<label class="form-label" for="ac-phone">Phone *</label>' +
          '<input class="form-input" id="ac-phone" name="phone" type="tel" placeholder="(555) 000-0000" autocomplete="tel" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ac-email">Email *</label>' +
          '<input class="form-input" id="ac-email" name="email" type="email" placeholder="jane@dealership.com" autocomplete="email" required>' +
        '</div>' +
        '<div class="form-row" style="margin-bottom:0">' +
          '<div class="form-group">' +
            '<label class="form-label" for="ac-company">Dealership</label>' +
            '<input class="form-input" id="ac-company" name="dealership" type="text" placeholder="ABC Motors" autocomplete="organization">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="ac-state">State</label>' +
            '<input class="form-input" id="ac-state" name="state" type="text" placeholder="FL" maxlength="2" autocomplete="address-level1">' +
          '</div>' +
        '</div>' +
        '<p style="font-size:0.72rem;color:var(--color-text-muted);line-height:1.5;margin:16px 0;">' +
          'By submitting you agree to receive occasional updates from Ashton Agency.' +
        '</p>' +
        '<button type="submit" class="btn btn-primary btn-full" id="ac-submit">Enter drawing</button>' +
        '<div id="ac-error" style="display:none;margin-top:12px;font-size:0.82rem;color:#dc2626;text-align:center;"></div>' +
      '</form>' +
      '<div id="ac-success" style="display:none;text-align:center;padding:32px 0 16px;">' +
        '<div style="width:48px;height:48px;border-radius:50%;background:var(--color-primary-light);border:2px solid var(--color-primary-muted);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="22" height="22" style="color:var(--color-primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>' +
        '</div>' +
        '<div style="font-family:var(--font-serif);font-size:1.1rem;font-weight:600;margin-bottom:8px;color:var(--color-text);">You\'re entered.</div>' +
        '<p style="font-size:0.85rem;color:var(--color-text-muted);margin:0;">Check your email — we\'ll be in touch after the show.</p>' +
      '</div>';
  }

  // ── Queue helpers ──────────────────────────────────────────────
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
    catch (e) {}
  }

  function submitToAPI(entry) {
    return fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  function flushQueue() {
    if (!navigator.onLine) return;
    var q = getQueue();
    if (!q.length) return;
    var remaining = [];
    Promise.all(
      q.map(function (entry) {
        return submitToAPI(entry).then(function (ok) {
          if (!ok) remaining.push(entry);
        });
      })
    ).then(function () { saveQueue(remaining); });
  }

  // Flush any queued submissions on load and whenever connection returns
  flushQueue();
  window.addEventListener('online', flushQueue);

  // ── Modal open / close ─────────────────────────────────────────
  function openModal() {
    window._ashtonModalOpenTime = Date.now();
    var form = document.getElementById('ashton-contact-form');
    var success = document.getElementById('ac-success');
    var error = document.getElementById('ac-error');
    if (form) { form.reset(); form.style.display = ''; }
    if (success) success.style.display = 'none';
    if (error) error.style.display = 'none';
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // Focus first input for accessibility
    var first = overlay.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closeModal() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  document.getElementById('contact-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('contact-fab-btn')?.addEventListener('click', openModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeModal();
  });

  document.querySelectorAll('[data-open-contact-modal]').forEach(function (el) {
    el.addEventListener('click', openModal);
  });

  // ── Form submit ────────────────────────────────────────────────
  overlay.addEventListener('submit', function (e) {
    if (e.target.id !== 'ashton-contact-form') return;
    e.preventDefault();

    var form = e.target;
    var errorDiv = document.getElementById('ac-error');
    errorDiv.style.display = 'none';

    var firstName = form.firstName.value.trim();
    var lastName  = form.lastName.value.trim();
    var phone     = form.phone.value.trim();
    var email     = form.email.value.trim();

    if (!firstName || !lastName || !phone || !email) {
      errorDiv.textContent = 'Please fill in all required fields.';
      errorDiv.style.display = 'block';
      return;
    }

    var entry = {
      firstName:  firstName,
      lastName:   lastName,
      phone:      phone,
      email:      email,
      dealership: form.dealership.value.trim(),
      state:      form.state.value.trim(),
      showName:   SHOW_NAME_VAL,
      showTag:    SHOW_TAG,
      queuedAt:   Date.now(),
      _hp:        form.website ? form.website.value : '',
      _t:         window._ashtonModalOpenTime ? Date.now() - window._ashtonModalOpenTime : 9999,
    };

    // Save to queue immediately — this is the offline safety net
    var q = getQueue();
    q.push(entry);
    saveQueue(q);

    // Show success right away — don't make them wait on the network
    form.style.display = 'none';
    document.getElementById('ac-success').style.display = 'block';

    // Attempt live submission; if it succeeds, remove from queue
    submitToAPI(entry).then(function (ok) {
      if (ok) {
        var q2 = getQueue().filter(function (e) { return e.queuedAt !== entry.queuedAt; });
        saveQueue(q2);
      }
    });
  });
})();
