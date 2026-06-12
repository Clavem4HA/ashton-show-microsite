// Show name — update for next show (e.g. "SEIADA 2027")
const SHOW_NAME = 'NIADA 2026';

// Update all show name placeholders in DOM
document.querySelectorAll('[data-show-name]').forEach(el => {
  el.textContent = SHOW_NAME;
});

// Mark active nav tab based on current page
(function markActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const href = tab.getAttribute('href')?.split('/').pop();
    if (href === path) tab.classList.add('active');
  });
})();

// PWA install prompt
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const banner = document.getElementById('install-banner');
  if (banner) {
    setTimeout(() => banner.classList.add('visible'), 3000);
  }
});

document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('install-banner')?.classList.remove('visible');
});

document.getElementById('install-dismiss')?.addEventListener('click', () => {
  document.getElementById('install-banner')?.classList.remove('visible');
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

// Shared: format currency
function formatCurrency(amount) {
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'k';
  }
  return '$' + amount.toLocaleString();
}
