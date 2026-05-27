let statesData = null;
let countdownIntervals = {};

async function loadStates() {
  const res = await fetch('data/states.json');
  const json = await res.json();
  statesData = json;
  renderStateTabs();
  activateState(statesData.states[0].code);
}

function renderStateTabs() {
  const container = document.getElementById('state-tabs');
  statesData.states.forEach(state => {
    const btn = document.createElement('button');
    btn.className = 'state-tab-btn';
    btn.dataset.code = state.code;
    btn.textContent = state.code;
    btn.addEventListener('click', () => activateState(state.code));
    container.appendChild(btn);
  });
}

function activateState(code) {
  document.querySelectorAll('.state-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.code === code);
  });
  document.querySelectorAll('.state-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.code === code);
  });
  const panel = document.querySelector(`.state-panel[data-code="${code}"]`);
  if (panel && !panel.dataset.rendered) {
    const state = statesData.states.find(s => s.code === code);
    renderStatePanel(panel, state);
    panel.dataset.rendered = 'true';
    startCountdown(state);
  }
}

function renewalMetaText(state) {
  if (state.renewalCycle === 'annual') {
    return `Annual renewal · ${monthName(state.renewalMonth)} ${state.renewalDay}`;
  }
  if (state.renewalCycle === 'annual-variable') {
    return `Annual renewal · dates vary by dealer type`;
  }
  if (state.renewalCycle === 'district-based') {
    return `District-based renewal · varies by dealer type`;
  }
  if (state.renewalCycle === 'biennial') {
    return `Biennial renewal · every 2 years`;
  }
  return '';
}

function renderBondTable(state) {
  return `
    <table class="bond-table">
      <thead>
        <tr>
          <th>Dealer type</th>
          <th style="text-align:right">Bond required</th>
        </tr>
      </thead>
      <tbody>
        ${state.dealerTypes.map(d => `
          <tr>
            <td>
              <div>${d.type}</div>
              ${d.commission ? `<div class="bond-note">${d.commission}</div>` : ''}
              ${d.note ? `<div class="bond-note">${d.note}</div>` : ''}
            </td>
            <td style="text-align:right">
              <div class="bond-amount">${formatCurrency(d.bondAmount)}</div>
              ${d.renewalMonth ? `<div class="bond-note" style="text-align:right">${monthName(d.renewalMonth)} ${d.renewalDay}</div>` : ''}
              ${d.renewalNote ? `<div class="bond-note" style="text-align:right">${d.renewalNote}</div>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderCountdownSection(state) {
  // Biennial — no fixed date we can count to
  if (state.renewalCycle === 'biennial') {
    return `
      <div class="countdown-section" style="margin:20px 16px 0;border-radius:12px;">
        <div class="countdown-label">Renewal cycle</div>
        <div style="font-size:1.1rem;font-weight:600;color:#fff;margin:6px 0 10px;font-family:var(--font-mono);">Biennial — every 2 years</div>
        <div class="countdown-renewal-date">Tennessee does not use a fixed annual deadline. Contact Ashton to confirm your next renewal window.</div>
      </div>
    `;
  }

  // District-based (Louisiana)
  if (state.renewalCycle === 'district-based') {
    return `
      <div class="countdown-section" style="margin:20px 16px 0;border-radius:12px;">
        <div class="countdown-label">Renewal varies by dealer type &amp; district</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <div style="font-size:0.875rem;color:rgba(255,255,255,0.8);">
            <span style="color:var(--color-primary);font-weight:700;">New dealers (LMVC)</span> — Oct 31 or Apr 30
          </div>
          <div style="font-size:0.875rem;color:rgba(255,255,255,0.8);">
            <span style="color:var(--color-primary);font-weight:700;">Used dealers (LUMVC)</span> — Dec 31 or district-assigned
          </div>
        </div>
        <div class="countdown-renewal-date" style="margin-top:10px;">Confirm your district assignment with Ashton before filing.</div>
      </div>
    `;
  }

  // Annual (fixed or variable) — show live countdown to next deadline
  return `
    <div class="countdown-section" style="margin:20px 16px 0;border-radius:12px;" id="countdown-${state.code}">
      <div class="countdown-label" id="countdown-label-${state.code}">Next renewal deadline</div>
      <div class="countdown-display">
        <div class="countdown-unit">
          <span class="countdown-value" id="cd-months-${state.code}">--</span>
          <span class="countdown-unit-label">months</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value" id="cd-days-${state.code}">--</span>
          <span class="countdown-unit-label">days</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value" id="cd-hrs-${state.code}">--</span>
          <span class="countdown-unit-label">hrs</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value" id="cd-min-${state.code}">--</span>
          <span class="countdown-unit-label">min</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value" id="cd-sec-${state.code}">--</span>
          <span class="countdown-unit-label">sec</span>
        </div>
      </div>
      <div class="countdown-renewal-date" id="countdown-date-${state.code}"></div>
    </div>
  `;
}

function renderStatePanel(panel, state) {
  panel.innerHTML = `
    <div class="state-header">
      <div class="state-name">${state.name}</div>
      <div class="state-meta">${renewalMetaText(state)}</div>
    </div>

    <!-- Bond amounts -->
    <div style="padding:20px 16px 0;">
      <div class="section-heading">Dealer Bond Requirements</div>
      ${renderBondTable(state)}
    </div>

    <!-- Garage liability -->
    <div style="padding:20px 16px 0;">
      <div class="section-heading">Garage Liability Minimum</div>
      <div style="font-family:var(--font-serif);font-size:1.5rem;font-weight:600;color:var(--color-text);margin-bottom:4px;">
        ${formatCurrency(state.garageLiabilityMin)}<span style="font-size:1rem;font-weight:400;color:var(--color-text-muted);"> / occurrence</span>
      </div>
      ${state.garageLiabilityNote ? `<div class="bond-note" style="margin-top:6px;">${state.garageLiabilityNote}</div>` : ''}
    </div>

    <!-- National average bar -->
    <div class="avg-bar-section" style="padding:20px 16px 0;">
      ${renderAvgBar(state)}
    </div>

    <!-- Countdown / renewal info -->
    ${renderCountdownSection(state)}

    <!-- Pro tip -->
    <div style="padding:20px 16px 0;">
      <div class="pro-tip">
        <div class="pro-tip-eyebrow">Pro tip</div>
        <div class="pro-tip-text">${state.proTip}</div>
      </div>
    </div>

    <!-- Regulator -->
    <div style="padding:20px 16px 0;">
      <div class="section-heading" style="padding:0 0 12px;">Regulating Authority</div>
      <div class="regulator-card" style="margin:0;">
        <div class="regulator-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
          </svg>
        </div>
        <div>
          <div class="regulator-name">${state.regulatorName}</div>
          <div class="regulator-phone">
            <a href="tel:${state.regulatorPhone.replace(/\D/g,'')}">${state.regulatorPhone}</a>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:20px 16px 32px;">
      <div class="state-cta">
        <div class="state-cta-title">Ready to get bonded in ${state.name}?</div>
        <div class="state-cta-sub">Fast turnaround. Real people. Every state.</div>
        <a href="tel:18004514854" class="btn btn-white btn-full">Call Ashton — (800) 451-4854</a>
      </div>
    </div>
  `;
}

function renderAvgBar(state) {
  const { nationalAvgBond, nationalAvgRange } = statesData;
  const [minVal, maxVal] = nationalAvgRange;
  const stateBond = state.dealerTypes[0].bondAmount;
  const range = maxVal - minVal;

  const statePercent = Math.min(((stateBond - minVal) / range) * 100, 100);
  const avgPercent   = ((nationalAvgBond - minVal) / range) * 100;

  const diff = stateBond - nationalAvgBond;
  const diffText = diff === 0
    ? 'Equal to national average'
    : diff > 0
      ? `${formatCurrency(Math.abs(diff))} above national average`
      : `${formatCurrency(Math.abs(diff))} below national average`;

  return `
    <div class="section-heading">Compared to National Average</div>
    <div class="avg-bar-label-row">
      <span>Min ${formatCurrency(minVal)}</span>
      <span>Max ${formatCurrency(maxVal)}</span>
    </div>
    <div class="avg-bar-track">
      <div class="avg-bar-state-fill" style="width:${statePercent}%"></div>
      <div class="avg-bar-avg-line" style="left:${avgPercent}%">
        <span class="avg-bar-avg-label">Avg ${formatCurrency(nationalAvgBond)}</span>
      </div>
    </div>
    <div class="avg-callout">
      <strong>${state.name}: ${formatCurrency(stateBond)}</strong> &nbsp;·&nbsp; ${diffText}
    </div>
  `;
}

function getNextDeadline(state) {
  const now = new Date();

  if (state.renewalCycle === 'annual') {
    let target = new Date(now.getFullYear(), state.renewalMonth - 1, state.renewalDay, 23, 59, 59);
    if (target <= now) target = new Date(now.getFullYear() + 1, state.renewalMonth - 1, state.renewalDay, 23, 59, 59);
    return { target, label: `Renewal due ${monthName(state.renewalMonth)} ${state.renewalDay}` };
  }

  if (state.renewalCycle === 'annual-variable') {
    const seen = new Set();
    const deadlines = state.dealerTypes
      .filter(d => d.renewalMonth)
      .filter(d => {
        const key = `${d.renewalMonth}-${d.renewalDay}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(d => {
        let t = new Date(now.getFullYear(), d.renewalMonth - 1, d.renewalDay, 23, 59, 59);
        if (t <= now) t = new Date(now.getFullYear() + 1, d.renewalMonth - 1, d.renewalDay, 23, 59, 59);
        return { target: t, label: `Next deadline: ${monthName(d.renewalMonth)} ${d.renewalDay}` };
      });
    deadlines.sort((a, b) => a.target - b.target);
    return deadlines[0] || null;
  }

  return null;
}

function startCountdown(state) {
  if (state.renewalCycle === 'biennial' || state.renewalCycle === 'district-based') return;

  const code = state.code;
  if (countdownIntervals[code]) return;

  const deadline = getNextDeadline(state);
  if (!deadline) return;

  const dateEl = document.getElementById(`countdown-date-${code}`);
  if (dateEl) dateEl.textContent = deadline.label;

  function tick() {
    const now = new Date();
    const totalMs  = deadline.target - now;
    if (totalMs <= 0) {
      clearInterval(countdownIntervals[code]);
      return;
    }
    const totalSec  = Math.floor(totalMs / 1000);
    const secs      = totalSec % 60;
    const totalMin  = Math.floor(totalSec / 60);
    const mins      = totalMin % 60;
    const totalHrs  = Math.floor(totalMin / 60);
    const hrs       = totalHrs % 24;
    const totalDays = Math.floor(totalHrs / 24);
    const months    = Math.floor(totalDays / 30);
    const days      = totalDays % 30;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val).padStart(2, '0');
    };
    set(`cd-months-${code}`, months);
    set(`cd-days-${code}`,   days);
    set(`cd-hrs-${code}`,    hrs);
    set(`cd-min-${code}`,    mins);
    set(`cd-sec-${code}`,    secs);
  }

  tick();
  countdownIntervals[code] = setInterval(tick, 1000);
}

function monthName(num) {
  return ['January','February','March','April','May','June',
          'July','August','September','October','November','December'][num - 1];
}

loadStates();
