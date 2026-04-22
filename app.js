// ---- STORAGE ----
var STORAGE_KEY = 'restlog_entries';

function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  var entries = getEntries();
  entry.id = Date.now().toString();
  entry.createdAt = new Date().toISOString();
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

function updateEntry(id, updates) {
  var entries = getEntries();
  var idx = entries.findIndex(function(e) { return e.id === id; });
  if (idx !== -1) {
    entries[idx] = Object.assign({}, entries[idx], updates);
    saveEntries(entries);
    return entries[idx];
  }
  return null;
}

function deleteEntry(id) {
  var entries = getEntries().filter(function(e) { return e.id !== id; });
  saveEntries(entries);
}

// ---- UTILITIES ----
function calcHours(bedtime, waketime) {
  if (!bedtime || !waketime) return null;
  var bParts = bedtime.split(':').map(Number);
  var wParts = waketime.split(':').map(Number);
  var mins = (wParts[0] * 60 + wParts[1]) - (bParts[0] * 60 + bParts[1]);
  if (mins <= 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(1));
}

function starsText(rating) {
  var s = '';
  for (var i = 1; i <= 5; i++) {
    s += i <= rating ? '\u2605' : '\u2606';
  }
  return s;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

function isWeekday(dateStr) {
  if (!dateStr) return null;
  var parts = dateStr.split('-').map(Number);
  var day = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
  return day >= 1 && day <= 5;
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce(function(a, b) { return a + b; }, 0) / arr.length;
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function setHidden(el, hide) {
  if (hide) {
    el.setAttribute('hidden', '');
  } else {
    el.removeAttribute('hidden');
  }
}

// ---- NAVIGATION ----
var VIEWS = ['landing', 'log', 'dashboard', 'history'];

function showView(name) {
  VIEWS.forEach(function(v) {
    var el = document.getElementById('view-' + v);
    el.classList.toggle('active', v === name);
  });
  document.querySelectorAll('.nav-links button').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-view') === name);
    btn.setAttribute('aria-current', btn.getAttribute('data-view') === name ? 'page' : 'false');
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
}

// ---- STAR WIDGET ----
function initStarWidget(container, inputId, defaultVal) {
  defaultVal = defaultVal || 0;
  var input = document.getElementById(inputId);
  var selected = defaultVal;
  var stars = container.querySelectorAll('.star');

  function render(hoverIdx) {
    stars.forEach(function(s, i) {
      var filled = hoverIdx >= 0 ? i <= hoverIdx : i < selected;
      s.classList.toggle('active', filled);
      s.setAttribute('aria-checked', i < selected ? 'true' : 'false');
    });
  }

  stars.forEach(function(s, i) {
    s.addEventListener('mouseenter', function() { render(i); });
    s.addEventListener('mouseleave', function() { render(-1); });
    s.addEventListener('click', function() {
      selected = i + 1;
      input.value = selected;
      render(-1);
    });
    s.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selected = i + 1;
        input.value = selected;
        render(-1);
      }
    });
  });

  if (defaultVal) {
    input.value = defaultVal;
    render(-1);
  }

  return {
    getValue: function() { return selected; },
    setValue: function(v) {
      selected = v;
      input.value = v;
      render(-1);
    }
  };
}

// ---- LOG FORM ----
var logStarWidget;

function initLogForm() {
  logStarWidget = initStarWidget(
    document.getElementById('log-stars'),
    'log-quality',
    0
  );

  document.getElementById('log-bedtime').addEventListener('change', updateLogHours);
  document.getElementById('log-waketime').addEventListener('change', updateLogHours);
  document.getElementById('log-form').addEventListener('submit', handleLogSubmit);

  document.getElementById('log-date').value = todayISO();
}

function todayISO() {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

function updateLogHours() {
  var bed = document.getElementById('log-bedtime').value;
  var wake = document.getElementById('log-waketime').value;
  var disp = document.getElementById('log-hours-display');
  var h = calcHours(bed, wake);
  disp.textContent = h !== null ? h + ' hours' : '\u2014';
}

function handleLogSubmit(e) {
  e.preventDefault();
  var date = document.getElementById('log-date').value;
  var bedtime = document.getElementById('log-bedtime').value;
  var waketime = document.getElementById('log-waketime').value;
  var quality = parseInt(document.getElementById('log-quality').value || '0', 10);
  var notes = document.getElementById('log-notes').value.trim();

  if (!date || !bedtime || !waketime) {
    showToast('Please fill in date, bedtime, and wake time.');
    return;
  }
  if (!quality) {
    showToast('Please rate your sleep quality.');
    return;
  }

  var hours = calcHours(bedtime, waketime);
  addEntry({ date: date, bedtime: bedtime, waketime: waketime, hours: hours, quality: quality, notes: notes });
  showToast('Sleep logged \u2713');
  e.target.reset();
  document.getElementById('log-date').value = todayISO();
  document.getElementById('log-hours-display').textContent = '\u2014';
  logStarWidget.setValue(0);
  showView('dashboard');
}

// ---- DASHBOARD ----
function renderDashboard() {
  var entries = getEntries();
  var dashContent = document.getElementById('dashboard-content');
  var dashEmpty = document.getElementById('dashboard-empty');

  if (!entries.length) {
    setHidden(dashContent, true);
    setHidden(dashEmpty, false);
    return;
  }

  setHidden(dashContent, false);
  setHidden(dashEmpty, true);

  var hours = entries.map(function(e) { return e.hours; }).filter(Boolean);
  var qualities = entries.map(function(e) { return e.quality; }).filter(Boolean);
  var avgHours = average(hours);
  var avgQuality = average(qualities);

  document.getElementById('stat-avg-hours').textContent = avgHours ? avgHours.toFixed(1) : '\u2014';
  document.getElementById('stat-avg-quality').textContent = avgQuality ? avgQuality.toFixed(1) : '\u2014';
  document.getElementById('stat-total').textContent = entries.length;

  renderInsights(entries, avgHours, avgQuality);
}

function renderInsights(entries, avgHours, avgQuality) {
  var container = document.getElementById('insights-list');
  var insights = [];

  // Weekday vs weekend
  if (entries.length >= 4) {
    var weekdayEntries = entries.filter(function(e) { return isWeekday(e.date) && e.hours; });
    var weekendEntries = entries.filter(function(e) { return !isWeekday(e.date) && e.hours; });
    if (weekdayEntries.length >= 2 && weekendEntries.length >= 1) {
      var wdAvg = average(weekdayEntries.map(function(e) { return e.hours; }));
      var weAvg = average(weekendEntries.map(function(e) { return e.hours; }));
      var diff = Math.abs(wdAvg - weAvg).toFixed(1);
      if (diff >= 0.5) {
        if (wdAvg < weAvg) {
          insights.push('\ud83d\udcc5 You tend to sleep <strong>' + diff + ' hours less</strong> on weekdays (' + wdAvg.toFixed(1) + 'h) than weekends (' + weAvg.toFixed(1) + 'h).');
        } else {
          insights.push('\ud83d\udcc5 You sleep about the same or more on weekdays \u2014 nice consistency!');
        }
      }
    }
  }

  // Hours vs quality correlation
  if (entries.length >= 3) {
    var pairs = entries.filter(function(e) { return e.hours && e.quality; });
    if (pairs.length >= 3) {
      var lowH = pairs.filter(function(e) { return e.hours < avgHours; });
      var highH = pairs.filter(function(e) { return e.hours >= avgHours; });
      if (lowH.length && highH.length) {
        var lowQ = average(lowH.map(function(e) { return e.quality; }));
        var highQ = average(highH.map(function(e) { return e.quality; }));
        if (highQ - lowQ >= 0.5) {
          insights.push('\ud83d\ude34 Nights with <strong>more sleep</strong> tend to get higher quality ratings \u2014 there\'s a pattern here.');
        } else if (lowQ - highQ >= 0.5) {
          insights.push('\ud83e\udd14 Interestingly, more hours aren\'t always linked to better quality for you. Notes might reveal why.');
        }
      }
    }
  }

  // Average vs recommended
  if (avgHours > 0 && avgHours < 7) {
    insights.push('\u26a1 Your average of <strong>' + avgHours.toFixed(1) + ' hours</strong> is below the recommended 7\u20139 hours. Small improvements can make a big difference.');
  } else if (avgHours >= 7 && avgHours <= 9) {
    insights.push('\u2705 You\'re averaging <strong>' + avgHours.toFixed(1) + ' hours</strong> \u2014 right in the healthy range. Keep it up!');
  } else if (avgHours > 9) {
    insights.push('\ud83d\udca4 You\'re averaging over 9 hours. Consistently sleeping too long can also affect energy levels.');
  }

  // Low quality warning
  if (avgQuality > 0 && avgQuality < 3) {
    insights.push('\ud83d\udcdd Your average quality rating is low (<strong>' + avgQuality.toFixed(1) + '/5</strong>). Try adding notes to track what affects your sleep.');
  }

  // Consistency check
  if (entries.length >= 5) {
    var recentHours = entries.slice(0, 5).map(function(e) { return e.hours; }).filter(Boolean);
    if (recentHours.length >= 4) {
      var maxH = Math.max.apply(null, recentHours);
      var minH = Math.min.apply(null, recentHours);
      if (maxH - minH >= 2.5) {
        insights.push('\ud83c\udf19 Your sleep varies by up to <strong>' + (maxH - minH).toFixed(1) + ' hours</strong> recently. A consistent schedule can boost how rested you feel.');
      }
    }
  }

  if (!insights.length) {
    insights.push('\ud83c\udf1f Keep logging \u2014 after a few more entries, you\'ll start seeing meaningful patterns in your sleep.');
  }

  container.innerHTML = insights.map(function(text) {
    return '<div class="insight-card">' + text + '</div>';
  }).join('');
}

// ---- HISTORY ----
function renderHistory() {
  var entries = getEntries();
  var list = document.getElementById('history-list');
  var empty = document.getElementById('history-empty');

  if (!entries.length) {
    setHidden(empty, false);
    list.innerHTML = '';
    return;
  }

  setHidden(empty, true);

  list.innerHTML = entries.map(function(e) {
    var safeDate = formatDate(e.date);
    var safeNotes = e.notes
      ? '<p class="entry-notes">\u201c' + escapeHtml(e.notes) + '\u201d</p>'
      : '';
    return '<li class="history-entry" id="entry-' + e.id + '">' +
      '<div class="entry-header">' +
        '<div>' +
          '<p class="entry-date">' + safeDate + '</p>' +
          '<div class="entry-meta">' +
            '<span>\ud83c\udf19 ' + escapeHtml(e.bedtime) + ' \u2192 \u2600\ufe0f ' + escapeHtml(e.waketime) + '</span>' +
            '<span class="entry-stars" aria-label="' + e.quality + ' out of 5 stars">' + starsText(e.quality) + '</span>' +
          '</div>' +
          safeNotes +
        '</div>' +
        '<div class="entry-hours" aria-label="' + e.hours + ' hours sleep">' + e.hours + 'h</div>' +
      '</div>' +
      '<div class="entry-actions">' +
        '<button class="btn btn-ghost" onclick="openEdit(\'' + e.id + '\')" aria-label="Edit entry for ' + safeDate + '">Edit</button>' +
        '<button class="btn btn-danger" onclick="confirmDelete(\'' + e.id + '\')" aria-label="Delete entry for ' + safeDate + '">Delete</button>' +
      '</div>' +
    '</li>';
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- EDIT ----
var editStarWidget = null;
var editingId = null;

function openEdit(id) {
  var entries = getEntries();
  var entry = null;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].id === id) { entry = entries[i]; break; }
  }
  if (!entry) return;

  editingId = id;
  document.getElementById('edit-date').value = entry.date;
  document.getElementById('edit-bedtime').value = entry.bedtime;
  document.getElementById('edit-waketime').value = entry.waketime;
  document.getElementById('edit-notes').value = entry.notes || '';
  updateEditHours();

  // Re-clone stars to reset event listeners
  var starContainer = document.getElementById('edit-stars');
  var freshStars = starContainer.cloneNode(true);
  starContainer.parentNode.replaceChild(freshStars, starContainer);
  editStarWidget = initStarWidget(freshStars, 'edit-quality', entry.quality);

  document.getElementById('modal').classList.add('open');
  document.getElementById('edit-date').focus();
}

function updateEditHours() {
  var bed = document.getElementById('edit-bedtime').value;
  var wake = document.getElementById('edit-waketime').value;
  var disp = document.getElementById('edit-hours-display');
  var h = calcHours(bed, wake);
  disp.textContent = h !== null ? h + ' hours' : '\u2014';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  editingId = null;
}

function handleEditSubmit(e) {
  e.preventDefault();
  if (!editingId) return;

  var date = document.getElementById('edit-date').value;
  var bedtime = document.getElementById('edit-bedtime').value;
  var waketime = document.getElementById('edit-waketime').value;
  var quality = parseInt(document.getElementById('edit-quality').value || '0', 10);
  var notes = document.getElementById('edit-notes').value.trim();

  if (!date || !bedtime || !waketime || !quality) {
    showToast('Please fill in all required fields.');
    return;
  }

  var hours = calcHours(bedtime, waketime);
  updateEntry(editingId, { date: date, bedtime: bedtime, waketime: waketime, hours: hours, quality: quality, notes: notes });
  closeModal();
  renderHistory();
  showToast('Entry updated \u2713');
}

function confirmDelete(id) {
  if (window.confirm('Delete this sleep entry?')) {
    deleteEntry(id);
    renderHistory();
    showToast('Entry deleted');
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', function() {
  initLogForm();

  // Wire all data-view buttons
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-view]');
    if (target) {
      showView(target.getAttribute('data-view'));
    }
  });

  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
  document.getElementById('edit-cancel').addEventListener('click', closeModal);
  document.getElementById('edit-bedtime').addEventListener('change', updateEditHours);
  document.getElementById('edit-waketime').addEventListener('change', updateEditHours);

  // Close modal on backdrop click
  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('modal').classList.contains('open')) {
      closeModal();
    }
  });

  showView('landing');
});
