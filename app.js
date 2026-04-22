// ---- STORAGE ----
const STORAGE_KEY = 'restlog_entries';

function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = getEntries();
  entry.id = Date.now().toString();
  entry.createdAt = new Date().toISOString();
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

function updateEntry(id, updates) {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...updates };
    saveEntries(entries);
    return entries[idx];
  }
  return null;
}

function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

// ---- UTILS ----
function calcHours(bedtime, waketime) {
  if (!bedtime || !waketime) return null;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = waketime.split(':').map(Number);
  let mins = (wH * 60 + wM) - (bH * 60 + bM);
  if (mins <= 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(1));
}

function starsHtml(rating, size = '1em') {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= rating ? '★' : '☆';
  }
  return `<span aria-label="${rating} out of 5 stars" style="font-size:${size}">${s}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

function isWeekday(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day >= 1 && day <= 5;
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ---- NAVIGATION ----
const views = ['landing', 'log', 'dashboard', 'history'];

function showView(name) {
  views.forEach(v => {
    document.getElementById(`view-${v}`).classList.toggle('active', v === name);
  });
  document.querySelectorAll('.nav-links button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
}

// ---- STAR WIDGET ----
function initStarWidget(container, inputId, defaultVal = 0) {
  const input = document.getElementById(inputId);
  let selected = defaultVal;

  function render(hover = -1) {
    container.querySelectorAll('.star').forEach((s, i) => {
      const filled = hover >= 0 ? i <= hover : i < selected;
      s.classList.toggle('active', filled);
      s.setAttribute('aria-pressed', filled ? 'true' : 'false');
    });
  }

  container.querySelectorAll('.star').forEach((s, i) => {
    s.addEventListener('mouseenter', () => render(i));
    s.addEventListener('mouseleave', () => render());
    s.addEventListener('click', () => {
      selected = i + 1;
      input.value = selected;
      render();
    });
    s.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        selected = i + 1;
        input.value = selected;
        render();
      }
    });
  });

  if (defaultVal) {
    input.value = defaultVal;
    render();
  }

  return {
    getValue: () => selected,
    setValue: (v) => {
      selected = v;
      input.value = v;
      render();
    }
  };
}

// ---- LOG FORM ----
let logStarWidget;

function initLogForm() {
  const starContainer = document.getElementById('log-stars');
  logStarWidget = initStarWidget(starContainer, 'log-quality', 0);

  ['log-bedtime', 'log-waketime'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateHoursDisplay);
  });

  document.getElementById('log-form').addEventListener('submit', handleLogSubmit);

  // default date to today
  document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
}

function updateHoursDisplay() {
  const bed = document.getElementById('log-bedtime').value;
  const wake = document.getElementById('log-waketime').value;
  const disp = document.getElementById('log-hours-display');
  const h = calcHours(bed, wake);
  disp.textContent = h !== null ? `${h} hours` : '—';
}

function handleLogSubmit(e) {
  e.preventDefault();
  const date = document.getElementById('log-date').value;
  const bedtime = document.getElementById('log-bedtime').value;
  const waketime = document.getElementById('log-waketime').value;
  const quality = parseInt(document.getElementById('log-quality').value || '0');
  const notes = document.getElementById('log-notes').value.trim();

  if (!date || !bedtime || !waketime) {
    showToast('Please fill in date, bedtime, and wake time.');
    return;
  }
  if (!quality) {
    showToast('Please rate your sleep quality.');
    return;
  }

  const hours = calcHours(bedtime, waketime);
  addEntry({ date, bedtime, waketime, hours, quality, notes });
  showToast('Sleep logged! ✓');
  e.target.reset();
  document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('log-hours-display').textContent = '—';
  logStarWidget.setValue(0);
  showView('dashboard');
}

// ---- DASHBOARD ----
function renderDashboard() {
  const entries = getEntries();
  const dash = document.getElementById('dashboard-content');
  const empty = document.getElementById('dashboard-empty');

  if (!entries.length) {
    dash.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  dash.style.display = 'block';
  empty.style.display = 'none';

  const hours = entries.map(e => e.hours).filter(Boolean);
  const qualities = entries.map(e => e.quality).filter(Boolean);
  const avgHours = avg(hours);
  const avgQuality = avg(qualities);

  document.getElementById('stat-avg-hours').textContent = avgHours ? avgHours.toFixed(1) : '—';
  document.getElementById('stat-avg-quality').textContent = avgQuality ? avgQuality.toFixed(1) : '—';
  document.getElementById('stat-total').textContent = entries.length;

  renderInsights(entries, avgHours, avgQuality);
}

function renderInsights(entries, avgHours, avgQuality) {
  const container = document.getElementById('insights-list');
  const insights = [];

  // Weekday vs weekend
  if (entries.length >= 4) {
    const weekday = entries.filter(e => isWeekday(e.date) && e.hours);
    const weekend = entries.filter(e => !isWeekday(e.date) && e.hours);
    if (weekday.length >= 2 && weekend.length >= 1) {
      const wdAvg = avg(weekday.map(e => e.hours));
      const weAvg = avg(weekend.map(e => e.hours));
      const diff = Math.abs(wdAvg - weAvg).toFixed(1);
      if (diff >= 0.5) {
        if (wdAvg < weAvg) {
          insights.push(`📅 You tend to sleep <strong>${diff} hours less</strong> on weekdays (${wdAvg.toFixed(1)}h) than weekends (${weAvg.toFixed(1)}h).`);
        } else {
          insights.push(`📅 You sleep about the same or more on weekdays — nice consistency!`);
        }
      }
    }
  }

  // Hours vs quality correlation
  if (entries.length >= 3) {
    const pairs = entries.filter(e => e.hours && e.quality);
    if (pairs.length >= 3) {
      const lowHours = pairs.filter(e => e.hours < avgHours);
      const highHours = pairs.filter(e => e.hours >= avgHours);
      if (lowHours.length && highHours.length) {
        const lowQ = avg(lowHours.map(e => e.quality));
        const highQ = avg(highHours.map(e => e.quality));
        if (highQ - lowQ >= 0.5) {
          insights.push(`😴 Nights with <strong>more sleep</strong> tend to get higher quality ratings — there's a pattern here.`);
        } else if (lowQ - highQ >= 0.5) {
          insights.push(`🤔 Interestingly, more hours aren't always linked to better quality for you. Notes might reveal why.`);
        }
      }
    }
  }

  // Sleep under 7 hours
  if (avgHours > 0 && avgHours < 7) {
    insights.push(`⚡ Your average of <strong>${avgHours.toFixed(1)} hours</strong> is below the recommended 7–9 hours. Small improvements can make a big difference.`);
  } else if (avgHours >= 7 && avgHours <= 9) {
    insights.push(`✅ You're averaging <strong>${avgHours.toFixed(1)} hours</strong> — right in the healthy range. Keep it up!`);
  } else if (avgHours > 9) {
    insights.push(`💤 You're averaging over 9 hours. Consistently sleeping too long can also affect energy levels.`);
  }

  // Quality insight
  if (avgQuality > 0 && avgQuality < 3) {
    insights.push(`📝 Your average quality rating is low (<strong>${avgQuality.toFixed(1)}/5</strong>). Try adding notes to track what affects your sleep.`);
  }

  // Consistency
  if (entries.length >= 5) {
    const recentHours = entries.slice(0, 5).map(e => e.hours).filter(Boolean);
    if (recentHours.length >= 4) {
      const maxH = Math.max(...recentHours);
      const minH = Math.min(...recentHours);
      if (maxH - minH >= 2.5) {
        insights.push(`🌙 Your sleep varies by up to <strong>${(maxH - minH).toFixed(1)} hours</strong> recently. A consistent schedule can boost how rested you feel.`);
      }
    }
  }

  if (!insights.length) {
    insights.push(`🌟 Keep logging — after a few more entries, you'll start seeing meaningful patterns in your sleep.`);
  }

  container.innerHTML = insights.map(text =>
    `<div class="insight-card">${text}</div>`
  ).join('');
}

// ---- HISTORY ----
function renderHistory() {
  const entries = getEntries();
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');

  if (!entries.length) {
    list.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  list.style.display = 'block';
  empty.style.display = 'none';

  list.innerHTML = entries.map(e => `
    <div class="history-entry" id="entry-${e.id}">
      <div class="entry-header">
        <div>
          <div class="entry-date">${formatDate(e.date)}</div>
          <div class="entry-meta">
            <span>🌙 ${e.bedtime} → ☀️ ${e.waketime}</span>
            <span class="entry-stars">${starsHtml(e.quality, '0.95em')}</span>
          </div>
          ${e.notes ? `<div class="entry-notes">"${e.notes}"</div>` : ''}
        </div>
        <div class="entry-hours">${e.hours}h</div>
      </div>
      <div class="entry-actions">
        <button class="btn btn-ghost" onclick="openEdit('${e.id}')" aria-label="Edit entry for ${formatDate(e.date)}">Edit</button>
        <button class="btn btn-danger" onclick="confirmDelete('${e.id}')" aria-label="Delete entry for ${formatDate(e.date)}">Delete</button>
      </div>
    </div>
  `).join('');
}

// ---- EDIT ----
let editStarWidget;
let editingId = null;

function openEdit(id) {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  editingId = id;
  document.getElementById('edit-date').value = entry.date;
  document.getElementById('edit-bedtime').value = entry.bedtime;
  document.getElementById('edit-waketime').value = entry.waketime;
  document.getElementById('edit-notes').value = entry.notes || '';

  updateEditHoursDisplay();

  const starContainer = document.getElementById('edit-stars');
  // Re-init star widget each time
  starContainer.querySelectorAll('.star').forEach(s => {
    const newS = s.cloneNode(true);
    s.parentNode.replaceChild(newS, s);
  });
  editStarWidget = initStarWidget(starContainer, 'edit-quality', entry.quality);

  document.getElementById('modal').classList.add('open');
}

function updateEditHoursDisplay() {
  const bed = document.getElementById('edit-bedtime').value;
  const wake = document.getElementById('edit-waketime').value;
  const disp = document.getElementById('edit-hours-display');
  const h = calcHours(bed, wake);
  disp.textContent = h !== null ? `${h} hours` : '—';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  editingId = null;
}

function handleEditSubmit(e) {
  e.preventDefault();
  if (!editingId) return;

  const date = document.getElementById('edit-date').value;
  const bedtime = document.getElementById('edit-bedtime').value;
  const waketime = document.getElementById('edit-waketime').value;
  const quality = parseInt(document.getElementById('edit-quality').value || '0');
  const notes = document.getElementById('edit-notes').value.trim();

  if (!date || !bedtime || !waketime || !quality) {
    showToast('Please fill in all required fields.');
    return;
  }

  const hours = calcHours(bedtime, waketime);
  updateEntry(editingId, { date, bedtime, waketime, hours, quality, notes });
  closeModal();
  renderHistory();
  showToast('Entry updated ✓');
}

function confirmDelete(id) {
  if (confirm('Delete this sleep entry?')) {
    deleteEntry(id);
    renderHistory();
    showToast('Entry deleted');
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initLogForm();

  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => showView(el.dataset.view));
  });

  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
  document.getElementById('edit-cancel').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
  });

  ['edit-bedtime', 'edit-waketime'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateEditHoursDisplay);
  });

  showView('landing');
});
