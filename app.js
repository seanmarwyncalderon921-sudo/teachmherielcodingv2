(() => {
  'use strict';

  const STORAGE_KEY = 'mheriel-code-state';
  const DEFAULTS = {
    xp: 0,
    streak: 0,
    lastDate: null,
    activityDates: [],
    completed: [],
    notes: [],
    theme: 'dark',
    snippets: [],
    drafts: {},
    sandboxLanguage: 'html',
    customFile: 'html',
    links: { spotify: 'https://open.spotify.com', youtube: 'https://www.youtube.com' },
    sync: false,
    track: 'html'
  };
  const TRACK_ICONS = { html: '</>', css: '#', javascript: 'JS', json: '{}', python: 'Py' };
  const LESSON_ICONS = {
    html: ['H1', '↗', '▧', '☷', '↵'],
    css: ['◉', 'Aa', '↔', '◒', '↗'],
    javascript: ['JS', 'Aa', '?', '[]', 'ƒ'],
    json: ['{}', '01', '[]', '{ }', '✓'],
    python: ['Py', '±', 'if', '[]', 'ƒ']
  };
  const TRACK_TAGLINES = {
    html: 'Shape a page',
    css: 'Give it a feeling',
    javascript: 'Make it respond',
    json: 'Keep details tidy',
    python: 'Write a small program'
  };
  const SNIPPETS = {
    html: '<h1>Hello, Mheriel ♥</h1>\n<p>Make this little page yours.</p>',
    css: '.note {\n  color: #ec4899;\n  padding: 16px;\n  border-radius: 12px;\n}',
    javascript: 'const greeting = "Hello, Mheriel!";\nconsole.log(greeting);',
    json: '{\n  "name": "Mheriel",\n  "favorite": "coding"\n}',
    python: 'name = "Mheriel"\nprint(f"Hello, {name}!")'
  };
  const CODE_SHORTCUTS = [
    ['<', '<', 'less-than sign'], ['>', '>', 'greater-than sign'], ['/', '/', 'slash'], ['=', '=', 'equals sign'],
    ['"', '"', 'double quote'], ["'", "'", 'single quote'], ['{}', '{}', 'curly braces'], ['[]', '[]', 'square brackets'],
    ['()', '()', 'parentheses'], [':', ':', 'colon'], [';', ';', 'semicolon'], ['_', '_', 'underscore'],
    ['2 spaces', '  ', 'indent two spaces']
  ];
  const editorSelections = new WeakMap();
  const CUSTOM_STARTER = {
    html: '<main class="card">\n  <h1>A page of my own</h1>\n  <p>Change this, then press the button.</p>\n  <button id="hello">Say hello</button>\n  <p id="message"></p>\n</main>',
    css: 'body {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #fdf7fa;\n  font: 16px system-ui, sans-serif;\n}\n.card {\n  width: min(90%, 420px);\n  padding: 24px;\n  border: 1px solid #f1dce6;\n  border-radius: 18px;\n  background: white;\n}\nbutton {\n  padding: 10px 14px;\n  border: 0;\n  border-radius: 10px;\n  background: #db2777;\n  color: white;\n}',
    javascript: 'document.querySelector("#hello").addEventListener("click", () => {\n  document.querySelector("#message").textContent = "It works!";\n  console.log("Hello from your custom sandbox.");\n});'
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const renderSpeechText = value => escapeHTML(value).replace(/`([^`]+)`/g, '<code>$1</code>');
  const trackFor = id => TRACKS.find(track => track.id === id) || TRACKS[0];
  const lessonKey = (trackId, lessonId) => `${trackId}/${lessonId}`;
  const firebaseConfigured = () => Boolean(window.FirebaseSync?.isFirebaseConfigured?.() || window.FirebaseSync?.configured?.());
  const makeId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let touchChipDrag = null;
  let touchPillDrag = null;
  let suppressChipClickUntil = 0;

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        ...DEFAULTS,
        ...saved,
        xp: Number.isFinite(Number(saved.xp)) ? Math.max(0, Number(saved.xp)) : 0,
        streak: Number.isFinite(Number(saved.streak)) ? Math.max(0, Number(saved.streak)) : 0,
        activityDates: Array.isArray(saved.activityDates) ? saved.activityDates.filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item)).slice(-90) : [],
        theme: saved.theme === 'light' ? 'light' : 'dark',
        track: TRACKS.some(track => track.id === saved.track) ? saved.track : DEFAULTS.track,
        links: { ...DEFAULTS.links, ...(saved.links || {}) },
        completed: Array.isArray(saved.completed) ? saved.completed.filter(item => typeof item === 'string') : [],
        notes: Array.isArray(saved.notes) ? saved.notes.filter(item => typeof item === 'string') : [],
        snippets: Array.isArray(saved.snippets) ? saved.snippets.filter(item => item && typeof item.lang === 'string' && typeof item.code === 'string').map((item, index) => ({ id: item.id || `legacy-${index}-${item.lang}`, name: item.name || `${item.lang.toUpperCase()} snippet ${index + 1}`, lang: item.lang, code: item.code })) : [],
        drafts: saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : {},
        sandboxLanguage: ['html', 'css', 'javascript', 'json', 'python'].includes(saved.sandboxLanguage) ? saved.sandboxLanguage : DEFAULTS.sandboxLanguage,
        customFile: ['html', 'css', 'javascript'].includes(saved.customFile) ? saved.customFile : DEFAULTS.customFile
      };
    } catch {
      return { ...DEFAULTS, links: { ...DEFAULTS.links } };
    }
  }

  const state = readState();
  let activeTrack = trackFor(state.track);
  let activeView = 'path';
  let selectedUnit = 0;
  let session = null;
  let sandboxOpen = false;
  let customSandboxOpen = false;
  let customFile = state.customFile;
  let sandboxLanguage = state.sandboxLanguage;
  let pyodidePromise = null;
  let toastTimer = 0;
  let syncTimer = 0;
  let installPrompt = null;
  let runnerBusy = false;
  let runSequence = 0;
  let pendingFrameRun = null;

  function save({ cloud = true } = {}) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast('This browser could not save progress.');
    }
    renderStatus();
    if (cloud && state.sync && firebaseConfigured()) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => window.FirebaseSync.syncUpToCloud(state).catch(() => {}), 1200);
    }
  }

  function todayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function renderStatus() {
    const xp = $('#xp-top');
    const lessonXp = $('#lesson-xp-value');
    const streak = $('#streak-top');
    const name = $('#active-track');
    const icon = $('#track-icon');
    const themeButton = $('[data-action="theme"]');
    if (xp) xp.textContent = String(state.xp);
    if (lessonXp) lessonXp.textContent = String(state.xp);
    if (streak) streak.textContent = String(state.streak);
    if (name) name.textContent = activeTrack.name;
    if (icon) icon.textContent = TRACK_ICONS[activeTrack.id] || activeTrack.icon;
    if (themeButton) {
      themeButton.innerHTML = `<span aria-hidden="true">${state.theme === 'dark' ? '☼' : '☾'}</span>`;
      themeButton.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'Light' : 'Dark'} theme`);
    }
    document.documentElement.dataset.theme = state.theme;
    const themeColor = $('meta[name="theme-color"]');
    if (themeColor) themeColor.content = state.theme === 'dark' ? '#0b1b28' : '#f4f9fb';
  }

  function awardXP(amount) {
    const previousLevel = Math.floor(state.xp / 100);
    const today = todayKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (state.lastDate !== today) {
      state.streak = state.lastDate === todayKey(yesterday) ? state.streak + 1 : 1;
      state.lastDate = today;
    }
    state.activityDates = [...new Set([...(state.activityDates || []), today])].sort().slice(-90);
    state.xp += amount;
    save();
    checkMilestones();
    if (Math.floor(state.xp / 100) > previousLevel) {
      celebrateHearts();
      showToast('A new Love XP level. Look at you ♥');
    }
  }

  function milestoneReached(milestone) {
    const threshold = Number(milestone.threshold) || 0;
    if (milestone.reqType === 'lessons') return state.completed.length >= threshold;
    if (milestone.reqType === 'streak') return state.streak >= threshold;
    if (milestone.reqType === 'xp') return state.xp >= threshold;
    return false;
  }

  function checkMilestones() {
    for (const milestone of LOVE_MILESTONES) {
      if (milestoneReached(milestone) && !state.notes.includes(milestone.id)) {
        state.notes.push(milestone.id);
        save();
        showToast(`A love note is yours: ${milestone.title} ♥`);
      }
    }
  }

  function seanMarkup(message, mood = 'idle', compact = false) {
    const figureClass = compact ? 'sean-figure' : 'sean-mini';
    return `<span class="${figureClass}" data-mood="${escapeHTML(mood)}" role="img" aria-label="Usagi the coding companion">
      <img src="./usagi.png" alt="" aria-hidden="true">
    </span>${message ? `<span class="companion-message"><strong class="sean-name">Usagi</strong>${escapeHTML(message)}</span>` : ''}`;
  }

  function safeLink(value, fallback) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : fallback;
    } catch {
      return fallback;
    }
  }

  function renderCodeShortcutBar(editorId, runAction) {
    const tokens = CODE_SHORTCUTS.map(([label, value, description]) => `<button type="button" class="code-shortcut" data-shortcut-insert="${escapeHTML(value)}" aria-label="Insert ${escapeHTML(description)}">${escapeHTML(label)}</button>`).join('');
    return `<div class="code-shortcuts" role="group" aria-label="Code shortcuts" data-editor-target="${escapeHTML(editorId)}">${tokens}<span class="code-shortcut-divider" aria-hidden="true"></span><button type="button" class="code-shortcut code-shortcut-run" data-shortcut-run="${escapeHTML(runAction)}" aria-label="Run code">▶ Run</button><button type="button" class="code-shortcut code-shortcut-sean" data-shortcut-sean aria-label="Ask Usagi for a hint">Usagi ♥</button></div>`;
  }

  function codeShortcutEditor(button) {
    const bar = button.closest('.code-shortcuts');
    return bar ? document.getElementById(bar.dataset.editorTarget) : null;
  }

  function rememberEditorSelection(editor) {
    if (!editor) return;
    editorSelections.set(editor, { start: editor.selectionStart, end: editor.selectionEnd });
  }

  function rememberEditorSelectionOnChange(editor) {
    ['click', 'keyup', 'select', 'input', 'blur'].forEach(type => editor.addEventListener(type, () => rememberEditorSelection(editor)));
  }

  function handleCodeShortcutPointerDown(event) {
    const button = event.target.closest?.('.code-shortcuts button');
    if (!button) return;
    rememberEditorSelection(codeShortcutEditor(button));
    // Preserve textarea focus for mouse use; leave touch gestures free to scroll the shortcut strip.
    if (event.pointerType === 'mouse') event.preventDefault();
  }

  function focusEditorAtSavedSelection(editor) {
    if (!editor) return;
    const selection = editorSelections.get(editor);
    editor.focus({ preventScroll: true });
    if (selection) editor.setSelectionRange(selection.start, selection.end);
  }

  function insertCodeShortcut(button) {
    const editor = codeShortcutEditor(button);
    if (!editor) return;
    const saved = editorSelections.get(editor);
    const focused = document.activeElement === editor;
    const start = focused ? editor.selectionStart : (saved?.start ?? editor.value.length);
    const end = focused ? editor.selectionEnd : (saved?.end ?? start);
    const value = button.dataset.shortcutInsert;
    editor.focus({ preventScroll: true });
    editor.setRangeText(value, start, end, 'end');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    rememberEditorSelection(editor);
  }

  function runCodeShortcut(button) {
    const editor = codeShortcutEditor(button);
    focusEditorAtSavedSelection(editor);
    const action = button.dataset.shortcutRun;
    if (action === 'run-custom-sandbox') runCustomSandbox();
    else if (action === 'run-sandbox') runSandbox();
    else runLessonCode();
  }

  function vibeLinks() {
    const spotify = safeLink(state.links.spotify, DEFAULTS.links.spotify);
    const youtube = safeLink(state.links.youtube, DEFAULTS.links.youtube);
    return `<div class="vibes-links">
      <a class="vibe-link" href="${escapeHTML(spotify)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">♫</span> Open Spotify</a>
      <a class="vibe-link" href="${escapeHTML(youtube)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">▷</span> Open YouTube</a>
    </div>`;
  }

  function renderPath() {
    activeView = 'path';
    session = null;
    activeTrack = trackFor(state.track);
    const done = activeTrack.lessons.filter(lesson => state.completed.includes(lessonKey(activeTrack.id, lesson.id))).length;
    const focusIndex = activeTrack.lessons.findIndex(lesson => !state.completed.includes(lessonKey(activeTrack.id, lesson.id)));
    const percent = Math.round((done / activeTrack.lessons.length) * 100);
    const activeUnit = Math.max(0, Math.min(9, selectedUnit));
    const unitStart = activeUnit * 10;
    const unitLessons = activeTrack.lessons.slice(unitStart, unitStart + 10);
    const units = Array.from({ length: 10 }, (_, unitIndex) => {
      const start = unitIndex * 10;
      const completeInUnit = activeTrack.lessons.slice(start, start + 10).filter(lesson => state.completed.includes(lessonKey(activeTrack.id, lesson.id))).length;
      return `<button class="path-unit-tab ${unitIndex === activeUnit ? 'selected' : ''}" data-unit="${unitIndex}" aria-current="${unitIndex === activeUnit ? 'step' : 'false'}"><span>Unit ${unitIndex + 1}</span><b>${completeInUnit}/10</b></button>`;
    }).join('');
    const lessonPath = unitLessons.map((lesson, localIndex) => {
      const index = unitStart + localIndex;
      const finished = state.completed.includes(lessonKey(activeTrack.id, lesson.id));
      const icon = finished ? '✓' : (LESSON_ICONS[activeTrack.id]?.[index] || String(index + 1));
      const stop = `<article class="path-stop ${index % 2 ? 'path-stop-right' : 'path-stop-left'} ${index === focusIndex ? 'path-stop-next' : ''}">
        <button class="lesson-node ${finished ? 'done' : ''} ${index === focusIndex ? 'focus' : ''}" data-lesson="${escapeHTML(lesson.id)}" aria-label="${finished ? 'Review' : 'Start'} lesson ${index + 1}: ${escapeHTML(lesson.title)}">
          <span class="node-number">${icon}</span>
        </button>
        <div class="node-copy"><small>LESSON ${String(index + 1).padStart(2, '0')} · ${finished ? 'DONE' : 'OPEN'}</small><b>${escapeHTML(lesson.title)}</b><span>${lesson.steps.length} short steps</span></div>
      </article>`;
      const sean = index === 2 ? `<div class="path-companion">${seanMarkup('Pick any step. I’m right here.', 'happy', true)}</div>` : '';
      return stop + sean;
    }).join('');
    $('#main').innerHTML = `<section class="path-page" aria-labelledby="path-title">
      <header class="unit-banner">
        <div class="unit-copy">
          <p class="eyebrow">Unit ${activeUnit + 1} · ${escapeHTML(activeTrack.name)}</p>
          <h1 id="path-title">${escapeHTML(curriculumTitle(activeTrack, activeUnit))}</h1>
          <p>Lessons ${unitStart + 1}–${unitStart + 10} · all open</p>
        </div>
        <div class="unit-progress" style="--progress:${percent}%" aria-label="${percent}% complete"><strong>${percent}%</strong></div>
      </header>
      <div class="path-units" aria-label="Choose a unit">${units}</div>
      <div class="path-caption"><h2>Your lesson path</h2><button class="love-path-button" data-view="notes"><span aria-hidden="true">♥</span><b>Love Notes</b><small>${state.notes.length}/${LOVE_MILESTONES.length}</small></button></div>
      <div class="node-path" aria-label="Lessons ${unitStart + 1} to ${unitStart + 10}">${lessonPath}</div>
      <p class="path-footer">Choose a node to start. You can visit them in any order.</p>
    </section>`;
    updateNavigation();
    renderStatus();
  }

  function renderStreak() {
    activeView = 'streak';
    session = null;
    const today = new Date();
    const monday = new Date(today);
    const dayIndex = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - dayIndex);
    monday.setHours(0, 0, 0, 0);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = todayKey(date);
      const isToday = key === todayKey(today);
      const checked = (state.activityDates || []).includes(key);
      return `<div class="streak-day ${checked ? 'checked' : ''} ${isToday ? 'today' : ''}"><span>${label}</span><b aria-label="${checked ? 'Complete' : 'Not complete'}">${checked ? '✓' : '·'}</b></div>`;
    }).join('');
    $('#main').innerHTML = `<section class="streak-page" aria-labelledby="streak-title">
      <div class="streak-celebration-card">
        <div class="streak-flame" aria-hidden="true">♨</div>
        <p class="eyebrow">Your little rhythm</p>
        <h1 id="streak-title">${state.streak} day${state.streak === 1 ? '' : 's'} streak</h1>
        <p class="streak-message">Every small session counts. Keep the warm little flame going.</p>
        <div class="streak-week" aria-label="This week's coding activity">${days}</div>
        <button class="primary-button streak-keep-going" data-action="keep-going">KEEP GOING</button>
      </div>
      <div class="streak-sean">${seanMarkup('I’m cheering for the next tiny step.', 'happy', true)}</div>
    </section>`;
    updateNavigation();
    renderStatus();
  }

  function curriculumTitle(track, unitIndex) {
    const titles = {
      html: ['Text & structure', 'Links & media', 'Lists & tables', 'Forms', 'Semantic pages', 'Accessible patterns', 'Embedded content', 'Page metadata', 'Reusable components', 'Small projects'],
      css: ['Color & type', 'Spacing & borders', 'Selectors', 'Flexbox', 'Grid', 'Responsive design', 'States & motion', 'Layout patterns', 'Polish', 'Small projects'],
      javascript: ['Values & variables', 'Choices & loops', 'Arrays & objects', 'Functions', 'DOM basics', 'Events', 'Async work', 'Data handling', 'Browser APIs', 'Small projects'],
      json: ['JSON shape', 'Strings & numbers', 'Objects', 'Arrays', 'Nested data', 'Validation', 'Applications', 'Interchange', 'Careful editing', 'Small projects'],
      python: ['Values & output', 'Choices & loops', 'Collections', 'Functions', 'Strings & files', 'Errors', 'Modules', 'Data patterns', 'Python tools', 'Small projects']
    };
    return titles[track.id]?.[unitIndex] || track.tagline;
  }
  function getCurrentStep() {
    if (!session) return null;
    return session.lesson.steps[session.stepIndex] || null;
  }

  function fillPartsMarkup(step) {
    const lines = [[]];
    step.parts.forEach(part => {
      if (typeof part === 'string') {
        const fragments = part.split('\n');
        fragments.forEach((fragment, index) => {
          if (fragment) lines[lines.length - 1].push(`<span class="code-fragment">${escapeHTML(fragment)}</span>`);
          if (index < fragments.length - 1) lines.push([]);
        });
        return;
      }
      const index = Number(part.blank);
      const selection = session.fillValues[index];
      const selected = session.selectedBlank === index;
      lines[lines.length - 1].push(`<button class="fill-slot ${selection ? 'filled' : ''} ${selected ? 'active' : ''}" data-blank-index="${index}" aria-pressed="${selected}" aria-label="${selection ? `Clear ${escapeHTML(selection.value)}` : `Blank ${index + 1}`} in code">${selection ? escapeHTML(selection.value) : '___'}</button>`);
    });
    return `<div class="numbered-code" role="group" aria-label="Code with blanks">${lines.map((parts, index) => `<div class="numbered-code-line"><span class="code-line-number" aria-hidden="true">${index + 1}</span><code>${parts.join('') || '&nbsp;'}</code></div>`).join('')}</div>`;
  }

  function renderLesson() {
    if (!session) return renderPath();
    activeView = 'lesson';
    activeTrack = trackFor(session.trackId);
    const { lesson, stepIndex } = session;
    const step = getCurrentStep();
    if (!step) return completeLesson();
    const progress = Math.round(((stepIndex + 1) / lesson.steps.length) * 100);
    let body = '';
    if (step.type === 'concept') {
      body = `<div class="concept-example"><pre><code>${escapeHTML(step.code)}</code></pre></div>
        <p class="takeaway">${escapeHTML(step.takeaway)}</p>
        <div class="concept-next"><button class="primary-button" data-action="continue">Got it <span class="key-hint">Enter</span></button></div>`;
    } else if (step.type === 'fill_blank') {
      session.fillValues ||= new Array(step.answers.length).fill(null);
      const usedChips = new Set(session.fillValues.filter(Boolean).map(value => value.chipIndex));
      const codeLanguage = ({ javascript: 'js' })[activeTrack.id] || activeTrack.id;
      body = `<section class="exercise-code-card" aria-label="Interactive code"><div class="exercise-code-head"><span class="language-pill">${escapeHTML(codeLanguage)}</span><small>Tap a blank or drag a token here</small></div>
        <div class="fill-code">${fillPartsMarkup(step)}</div></section>
        <section class="fill-tray" aria-label="Fill tray"><div class="fill-tray-heading"><h2>Fill tray</h2><small>Tap a token to use it</small></div><div class="choice-chips" role="group" aria-label="Code tokens">${step.chips.map((chip, index) => `<button class="choice-chip" data-chip-index="${index}" draggable="${usedChips.has(index) ? 'false' : 'true'}" ${usedChips.has(index) ? 'disabled' : ''}>${escapeHTML(chip)}</button>`).join('')}</div></section>
        <div class="fill-actions"><button class="secondary-button" data-action="clear-fill">Clear</button><button class="primary-button" data-action="check-fill">Check</button></div>
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
    } else if (step.type === 'pill_challenge') {
      session.order ||= [];
      const used = new Set(session.order);
      const card = step.answers.map((_, position) => {
        const lineIndex = session.order[position];
        const line = Number.isInteger(lineIndex) ? step.lines[lineIndex] : null;
        return `<div class="pill-code-line"><span class="code-line-number" aria-hidden="true">${position + 1}</span>${line ? `<button class="token-pill ${escapeHTML(line.kind)}" draggable="true" data-pill-slot="${position}" data-pill-token="${lineIndex}" data-ordered-position="${position}" aria-label="Move or remove ${escapeHTML(line.text)}">${escapeHTML(line.text)}</button>` : `<button class="token-pill blank-pill" data-pill-slot="${position}" aria-label="Drop a token in slot ${position + 1}">tap a token</button>`}</div>`;
      }).join('');
      const tray = step.chips.map((chip, index) => {
        const chipText = typeof chip === 'string' ? chip : chip.text;
        const chipIndex = typeof chip === 'string' ? index : (chip.index ?? index);
        const selected = used.has(chipIndex);
        return selected ? `<span class="token-tray-slot" aria-label="Used token">${escapeHTML(chipText)}</span>` : `<button class="token-tray-chip" draggable="true" data-pill-index="${chipIndex}">${escapeHTML(chipText)}</button>`;
      }).join('');
      body = `<section class="pill-challenge" aria-label="Pill token challenge"><div class="exercise-code-head"><span class="language-pill">${escapeHTML(({ javascript: 'js' })[activeTrack.id] || activeTrack.id)}</span><small>Tap tokens to fill the numbered code</small></div><div class="pill-code-card" role="group" aria-label="Numbered code card">${card}</div><div class="token-tray" role="group" aria-label="Token tray">${tray}</div><div class="pill-actions"><span class="step-hint">${session.order.length} of ${step.answers.length} slots filled</span><button class="primary-button" data-action="check-pill">CHECK</button></div><div class="challenge-dock" id="challenge-dock"><p class="feedback" id="feedback" aria-live="polite"></p><button class="why-button" data-action="why">WHY?</button><button class="sean-dock-button" data-action="ask" aria-label="Ask Sean for a deeper explanation">Sean ♥</button></div><div class="why-panel" id="why-panel" hidden><p>${renderSpeechText(step.why || 'Each token has a job, and the order makes the code work together.')}</p><button class="secondary-button" data-action="ask-why">Ask Sean ♥</button><div class="why-ai-reply" id="why-ai-reply" aria-live="polite" hidden></div></div></section>`;
    } else if (step.type === 'code_challenge') {
      session.code = session.code ?? step.starter ?? '';
      body = `<div class="challenge-layout">
          <div class="editor-panel"><label class="panel-label" for="code-editor">Your code <small>${escapeHTML(step.language)}<span class="resize-cue"> · drag corner</span></small></label>
            ${renderCodeShortcutBar('code-editor', 'run')}
            <textarea id="code-editor" class="code-editor" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Code editor">${escapeHTML(session.code)}</textarea>
            <div class="runner-actions"><div class="runner-links"><button data-action="drill">+ Extra drill</button></div><button class="primary-button" data-action="run">Run &amp; check <span class="key-hint">Ctrl ↵</span></button></div>
          </div>
          <div class="pane-splitter" role="separator" aria-orientation="vertical" aria-valuemin="28" aria-valuemax="72" aria-valuenow="54" tabindex="0" aria-label="Drag to resize code and preview"></div>
          <div class="result-panel"><div class="panel-label">Preview <small>Output</small></div><div class="output-box"><iframe id="lesson-preview" sandbox="allow-scripts" title="Lesson code preview"></iframe><pre id="lesson-output" aria-live="polite">Run your code to see what happens.</pre></div></div>
        </div><p class="challenge-feedback" id="feedback" aria-live="polite"></p>`;
    }
    const promptText = step.type === 'concept' ? step.text : (step.prompt || step.text || step.takeaway || 'Take this one small step at a time.');
    const seansOpening = step.sean || (step.type === 'concept' ? 'Let’s start with one small idea.' : 'Take your time. I’m right here.');
    $('#main').innerHTML = `<section class="lesson-page" aria-label="Lesson step">
      <header class="lesson-progress-head">
        <button class="lesson-exit-button" data-action="exit-lesson" aria-label="Exit lesson">×</button>
        <div class="lesson-progress-center"><div class="lesson-progress-meta"><span>${escapeHTML(activeTrack.name)} · ${escapeHTML(lesson.title)}</span><span class="step-indicator">${stepIndex + 1}/${lesson.steps.length}</span></div><div class="step-track"><i style="width:${progress}%"></i></div></div>
        <div class="lesson-top-actions"><span class="lesson-xp-badge" aria-label="${state.xp} Love XP"><span aria-hidden="true">♥</span><b id="lesson-xp-value">${state.xp}</b><small>XP</small></span><button class="lesson-ask-button" data-action="ask" aria-label="Ask Sean for a hint">Ask Sean <span aria-hidden="true">♥</span></button></div>
      </header>
      <article class="lesson-card">
        <section class="lesson-coach-row"><div class="lesson-sean" id="coach-note" data-mood="idle">${seanMarkup('', 'idle', true)}</div><div class="prompt-bubble"><span class="prompt-label">${escapeHTML(step.type === 'concept' ? 'A small idea' : 'Your task')}</span><h1>${escapeHTML(step.title)}</h1><p>${renderSpeechText(promptText)}</p><div class="sean-reaction" aria-live="polite"><strong>Sean</strong><span class="sean-reaction-text">${renderSpeechText(seansOpening)}</span></div></div></section>
        <div class="ai-reply" id="ai-reply" aria-live="polite" hidden></div>
        ${body}
      </article>
    </section>`;
    const editor = $('#code-editor');
    if (editor) {
      editor.addEventListener('input', () => { session.code = editor.value; });
      editor.addEventListener('keydown', editorKeys);
      rememberEditorSelectionOnChange(editor);
    }
    setupPaneSplitter($('.challenge-layout'));
    updateNavigation();
    renderStatus();
  }

  function launchLesson(id) {
    const lesson = activeTrack.lessons.find(item => item.id === id);
    if (!lesson) return;
    session = { trackId: activeTrack.id, lesson, stepIndex: 0, code: null, order: [], fillValues: null, selectedBlank: null, earnedSteps: [], completed: false };
    renderLesson();
  }

  function updateNavigation() {
    const current = activeView === 'lesson' ? 'path' : activeView;
    $$('[data-view]').forEach(button => {
      if (button.dataset.view === current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function renderCurrentView() {
    if (activeView === 'lesson' && session) return renderLesson();
    if (activeView === 'sandbox') return customSandboxOpen ? renderCustomSandbox() : sandboxOpen ? renderSandbox() : renderSandboxHome();
    if (activeView === 'notes') return renderNotes();
    if (activeView === 'vibes') return renderVibes();
    if (activeView === 'me') return renderMe();
    if (activeView === 'streak') return renderStreak();
    return renderPath();
  }

  function setView(view) {
    if (view !== 'lesson') session = null;
    activeView = view;
    if (view === 'path') renderPath();
    else if (view === 'sandbox') { sandboxOpen = false; customSandboxOpen = false; renderSandboxHome(); }
    else if (view === 'notes') renderNotes();
    else if (view === 'vibes') renderVibes();
    else if (view === 'me') renderMe();
  }

  function renderNotes() {
    activeView = 'notes';
    const notes = LOVE_MILESTONES.map(note => {
      const earned = state.notes.includes(note.id);
      return `<article class="love-note ${earned ? 'earned' : ''}"><span class="note-mark" aria-hidden="true">${earned ? '♥' : '♡'}</span><div><h2>${escapeHTML(note.title)}</h2><p>${escapeHTML(note.note)}</p><small>${escapeHTML(note.reward)}</small></div><span class="note-state">${earned ? 'Yours' : 'A little later'}</span></article>`;
    }).join('');
    $('#main').innerHTML = `<section class="notes-page"><header class="page-heading"><div><p class="eyebrow">Kept for you</p><h1>Love notes</h1><p>Little things to look forward to as you learn.</p></div>${seanMarkup('Every note is yours to keep.', 'happy', true)}</header><div class="notes-list">${notes}</div></section>`;
    updateNavigation();
  }

  function renderVibes() {
    activeView = 'vibes';
    $('#main').innerHTML = `<section class="vibes-page"><header class="page-heading"><div><p class="eyebrow">A little background music</p><h1>Study vibes</h1><p>Put on something nice, then take one small step.</p></div>${seanMarkup('I picked a quiet corner for us.', 'idle', true)}</header><div class="content-card"><p class="eyebrow">Your links</p>${vibeLinks()}<button class="secondary-button" data-action="customize">Customize links</button></div></section>`;
    updateNavigation();
  }

  function renderMe() {
    activeView = 'me';
    const done = state.completed.length;
    const installSettings = isAppInstalled() ? '' : '<div class="setting-row"><span><strong>Install this app</strong><small>Add MherielCode to your home screen for quick access.</small></span><button class="primary-button" data-action="install-app">Install app</button></div>';
    const syncConfigured = Boolean(window.FirebaseSync?.configured());
    const syncStatus = syncConfigured
      ? 'Save progress across devices with Google.'
      : window.FirebaseSync
        ? 'Add Firebase web app details to enable sync.'
        : 'Firebase sync did not load. Refresh the app and try again.';
    $('#main').innerHTML = `<section class="me-page"><header class="page-heading"><div><p class="eyebrow">Your little corner</p><h1>Hi, Mheriel.</h1><p>Your learning stays saved on this device.</p></div>${seanMarkup('You’re doing just fine.', 'happy', true)}</header>
      <div class="content-card"><p class="eyebrow">So far</p><div class="stats-grid"><div class="stat-tile"><b>♥ ${state.xp}</b><small>Love XP</small></div><div class="stat-tile"><b>♨ ${state.streak}</b><small>Day streak</small></div><div class="stat-tile"><b>${done}</b><small>Lessons done</small></div></div>
        <div class="settings-list">${installSettings}<div class="setting-row"><span><strong>Theme</strong><small>${state.theme === 'dark' ? 'SideMe Dark' : 'SideMe Light'}</small></span><button class="secondary-button" data-action="theme">Switch</button></div>
        <label class="setting-row" for="sync-toggle"><span><strong>Sync between devices</strong><small>${escapeHTML(syncStatus)}</small></span><input type="checkbox" id="sync-toggle" aria-label="Enable sync between devices" ${state.sync ? 'checked' : ''}></label>
        ${syncConfigured && state.sync ? '<button class="secondary-button" data-action="sync-now">Connect or sync now</button>' : ''}</div>
      </div></section>`;
    updateNavigation();
  }

  function isAppInstalled() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      installPrompt = null;
      renderMe();
      return;
    }
    const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const instructions = isAppleMobile
      ? '<ol><li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>'
      : '<ol><li>Open your browser menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm the install.</li></ol>';
    showModal('Install MherielCode', 'Keep your coding path one tap away.', instructions, 'Install app');
  }

  function renderSandboxHome() {
    activeView = 'sandbox';
    sandboxOpen = false;
    customSandboxOpen = false;
    const spaces = [
      ['html', 'HTML', '</>', 'Write markup and see the page preview.', 'Page preview'],
      ['css', 'CSS', '#', 'Try colors, spacing, borders, and layout.', 'Style preview'],
      ['javascript', 'JavaScript', 'JS', 'Run code and read console output.', 'Console'],
      ['json', 'JSON', '{}', 'Check data and inspect the formatted result.', 'Validator'],
      ['python', 'Python', 'Py', 'Run a small program in the browser.', 'Python runner']
    ];
    const cards = spaces.map(([id, name, mark, description, tool]) => {
      const savedCount = state.snippets.filter(item => item.lang === id).length;
      const hasDraft = state.drafts[id] !== undefined;
      return `<button class="sandbox-launch-card" data-open-sandbox="${id}" aria-label="Open ${name} sandbox"><span class="sandbox-launch-mark" aria-hidden="true">${mark}</span><span class="sandbox-launch-copy"><strong>${name}</strong><small>${description}</small><em>${tool} · ${hasDraft ? 'Draft saved' : 'Starter ready'}${savedCount ? ` · ${savedCount} saved` : ''}</em></span><span class="sandbox-launch-arrow" aria-hidden="true">›</span></button>`;
    }).join('');
    const customCount = state.snippets.filter(item => item.lang === 'custom').length;
    const customDraft = state.drafts.customProject;
    const customCard = `<button class="sandbox-launch-card custom-sandbox-launch" data-open-custom-sandbox aria-label="Open Custom sandbox"><span class="sandbox-launch-mark" aria-hidden="true">&lt;/&gt;</span><span class="sandbox-launch-copy"><strong>Custom sandbox</strong><small>Build one page with your own HTML, CSS, and JavaScript.</small><em>Live preview · ${customDraft ? 'Project saved' : 'Starter ready'}${customCount ? ` · ${customCount} saved` : ''}</em></span><span class="sandbox-launch-arrow" aria-hidden="true">›</span></button>`;
    $('#main').innerHTML = `<section class="sandbox-page sandbox-home"><header class="page-heading"><div><p class="eyebrow">A place to try things</p><h1>Sandbox</h1><p>Pick a language, or open a custom page with all three web files together.</p></div><div class="sandbox-mascot">${seanMarkup('Nothing here is graded. Play around.', 'idle', true)}</div></header><div class="sandbox-launch-grid" aria-label="Choose a sandbox">${customCard}${cards}</div><p class="sandbox-home-note">Each workspace keeps its own draft and snippets.</p></section>`;
    updateNavigation();
  }

  function renderCustomSandbox() {
    activeView = 'sandbox';
    sandboxOpen = false;
    customSandboxOpen = true;
    const existing = state.drafts.customProject;
    const draft = { ...CUSTOM_STARTER };
    if (existing && typeof existing === 'object') {
      Object.keys(draft).forEach(file => { if (typeof existing[file] === 'string') draft[file] = existing[file]; });
    }
    state.drafts.customProject = draft;
    if (!['html', 'css', 'javascript'].includes(customFile)) customFile = 'html';
    state.customFile = customFile;
    const saved = state.snippets.filter(item => item.lang === 'custom');
    const savedRows = saved.length ? saved.map(item => `<div class="snippet-row"><span><strong>${escapeHTML(item.name)}</strong><small>HTML · CSS · JS</small></span><button class="secondary-button" data-load-snippet="${escapeHTML(item.id)}">Load</button><button class="quiet-button" data-delete-snippet="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.name)}">Delete</button></div>`).join('') : '<p class="sort-empty">Your saved custom projects will show up here.</p>';
    const fileTabs = [['html', 'HTML'], ['css', 'CSS'], ['javascript', 'JavaScript']].map(([id, label]) => `<button class="custom-file-tab" role="tab" aria-selected="${customFile === id}" data-custom-file="${id}">${label}</button>`).join('');
    const languageName = customFile === 'javascript' ? 'JavaScript' : customFile.toUpperCase();
    $('#main').innerHTML = `<section class="sandbox-page custom-sandbox-page"><header class="page-heading sandbox-page-heading"><div><button class="quiet-button sandbox-back-button" data-action="sandbox-home">‹ All sandboxes</button><p class="eyebrow">One project, three files</p><h1>Custom sandbox</h1><p>Mix your own HTML, CSS, and JavaScript in one live page.</p></div><div class="sandbox-mascot">${seanMarkup('Edit a file, then run the whole page.', 'idle', true)}</div></header>
      <section class="sandbox-workspace" aria-label="Custom web project"><div class="sandbox-toolbar"><span class="sandbox-current-language"><b>Web project</b><small>HTML + CSS + JavaScript</small></span><span class="runner-status"><i aria-hidden="true"></i> Sandboxed preview</span></div>
      <div class="sandbox-layout custom-sandbox-layout"><div class="editor-panel"><div class="custom-file-tabs" role="tablist" aria-label="Project files">${fileTabs}</div><div class="sandbox-editor-toolbar"><label class="panel-label" for="custom-editor">${escapeHTML(languageName)} <small>Custom project</small></label><button class="quiet-button" data-action="reset-custom-sandbox">Starter</button></div>
        <div class="ai-reply sandbox-ai-reply" id="sandbox-ai-reply" aria-live="polite" hidden></div>
        ${renderCodeShortcutBar('custom-editor', 'run-custom-sandbox')}
        <textarea id="custom-editor" class="code-editor" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Custom ${escapeHTML(languageName)} editor">${escapeHTML(draft[customFile])}</textarea>
        <div class="runner-actions sandbox-runner-actions"><button class="primary-button" data-action="run-custom-sandbox">Run project <span class="key-hint">Ctrl+Enter</span></button><button class="secondary-button" data-action="copy-custom-file">Copy ${escapeHTML(languageName)}</button></div>
        <div class="snippet-save"><label for="custom-snippet-name">Save as</label><input id="custom-snippet-name" maxlength="48" value="My custom page" autocapitalize="sentences"><button class="secondary-button" data-action="save-custom-snippet">Save project</button></div>
        <div class="sandbox-help"><span>All three files save as one project.</span><span>Ctrl+Enter / Cmd+Enter to run</span></div>
        <div class="saved-snippets"><h2>Saved custom projects</h2>${savedRows}</div></div>
        <div class="pane-splitter" role="separator" aria-orientation="vertical" aria-valuemin="28" aria-valuemax="72" aria-valuenow="54" tabindex="0" aria-label="Drag to resize editor and preview"></div>
        <div class="result-panel"><div class="panel-label">Live preview <small>HTML · CSS · JS</small></div><div class="output-box has-preview"><iframe id="custom-preview" sandbox="allow-scripts" title="Custom project preview"></iframe><pre id="custom-output" aria-live="polite">Run the project to see the page and console output.</pre></div></div></div></section></section>`;
    const editor = $('#custom-editor');
    editor.addEventListener('input', () => {
      state.drafts.customProject[customFile] = editor.value;
      save();
    });
    editor.addEventListener('keydown', editorKeys);
    rememberEditorSelectionOnChange(editor);
    setupPaneSplitter($('.custom-sandbox-layout'));
    updateNavigation();
  }

  function renderSandbox() {
    activeView = 'sandbox';
    sandboxOpen = true;
    const selected = sandboxLanguage;
    const snippet = state.drafts[selected] ?? SNIPPETS[selected];
    const modeDescriptions = {
      html: 'Build a page and preview it safely.',
      css: 'Style a little sample page and see each change.',
      javascript: 'Run JavaScript and read its console output.',
      json: 'Check JSON and inspect the formatted result.',
      python: 'Run Python in the browser with Pyodide.'
    };
    const showPreview = selected === 'html' || selected === 'css';
    const savedSnippets = state.snippets.filter(item => item.lang === selected);
    const savedRows = savedSnippets.length ? savedSnippets.map(item => `<div class="snippet-row"><span><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.lang)}</small></span><button class="secondary-button" data-load-snippet="${escapeHTML(item.id)}">Load</button><button class="quiet-button" data-delete-snippet="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.name)}">Delete</button></div>`).join('') : '<p class="sort-empty">No saved snippets for this language yet.</p>';
    const outputLabel = showPreview ? 'Live preview' : ({ javascript: 'Console', json: 'JSON result', python: 'Python output' })[selected];
    const initialOutput = showPreview ? 'Run your code to update the preview.' : ({ javascript: 'Run your code to see console output.', json: 'Run your code to validate and format the JSON.', python: 'Run your code to see printed output.' })[selected];
    const languageLabel = selected === 'javascript' ? 'JavaScript' : selected.toUpperCase();
    $('#main').innerHTML = `<section class="sandbox-page"><header class="page-heading sandbox-page-heading"><div><button class="quiet-button sandbox-back-button" data-action="sandbox-home">‹ All sandboxes</button><p class="eyebrow">Separate workspace</p><h1>${escapeHTML(languageLabel)} sandbox</h1><p>${escapeHTML(modeDescriptions[selected])} Nothing is graded.</p></div><div class="sandbox-mascot">${seanMarkup('Try one small idea, then build on it.', 'idle', true)}</div></header>
      <section class="sandbox-workspace" aria-label="${escapeHTML(languageLabel)} sandbox"><div class="sandbox-toolbar"><span class="sandbox-current-language"><b>${escapeHTML(languageLabel)}</b><small>Independent editor and saved work</small></span><span class="runner-status"><i aria-hidden="true"></i> Runs in your browser</span></div>
      <div class="sandbox-mode-note"><strong>${escapeHTML(selected === 'javascript' ? 'JavaScript' : selected.toUpperCase())}</strong><span>${escapeHTML(modeDescriptions[selected])}</span></div>
      <div class="sandbox-layout" id="sandbox-panel" role="region" aria-label="${escapeHTML(languageLabel)} editor and result"><div class="editor-panel"><div class="sandbox-editor-toolbar"><label class="panel-label" for="sandbox-editor">Your code <small>${escapeHTML(selected)}<span class="resize-cue"> · drag corner</span></small></label><div class="sandbox-editor-actions"><button class="quiet-button" data-action="reset-sandbox">Starter</button>${selected === 'json' ? '<button class="quiet-button" data-action="format-json">Format JSON</button>' : ''}</div></div>
        <div class="ai-reply sandbox-ai-reply" id="sandbox-ai-reply" aria-live="polite" hidden></div>
        ${renderCodeShortcutBar('sandbox-editor', 'run-sandbox')}
        <textarea id="sandbox-editor" class="code-editor" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Sandbox code editor">${escapeHTML(snippet)}</textarea>
        <div class="runner-actions sandbox-runner-actions"><button class="primary-button" data-action="run-sandbox">Run code <span class="key-hint">Ctrl+Enter</span></button><div class="sandbox-utility-actions"><button class="secondary-button" data-action="clear-sandbox-output">Clear output</button><button class="secondary-button" data-action="copy-sandbox-code">Copy code</button></div></div>
        <div class="snippet-save"><label for="snippet-name">Save as</label><input id="snippet-name" maxlength="48" value="${escapeHTML(`${selected.toUpperCase()} idea`)}" autocapitalize="sentences"><button class="secondary-button" data-action="save-snippet">Save snippet</button></div>
        <div class="sandbox-help"><span>Your draft saves on this device.</span><span>Ctrl+Enter / Cmd+Enter to run</span></div>
        <div class="saved-snippets"><h2>Saved ${escapeHTML(selected.toUpperCase())} snippets</h2>${savedRows}</div></div>
        <div class="pane-splitter" role="separator" aria-orientation="vertical" aria-valuemin="28" aria-valuemax="72" aria-valuenow="54" tabindex="0" aria-label="Drag to resize code and result"></div>
        <div class="result-panel"><div class="panel-label">${escapeHTML(outputLabel)}<small>${showPreview ? 'Sandboxed' : 'No grading'}</small></div><div class="output-box ${showPreview ? 'has-preview' : 'output-only'}"><iframe id="sandbox-preview" class="${showPreview ? '' : 'output-frame-hidden'}" sandbox="allow-scripts" title="Sandbox preview" tabindex="-1"></iframe><pre id="sandbox-output" aria-live="polite">${escapeHTML(initialOutput)}</pre></div></div></div></section></section>`;
    const editor = $('#sandbox-editor');
    editor.addEventListener('input', () => { state.drafts[sandboxLanguage] = editor.value; save(); });
    editor.addEventListener('keydown', editorKeys);
    rememberEditorSelectionOnChange(editor);
    setupPaneSplitter($('.sandbox-layout'));
    updateNavigation();
  }

  function showModal(title, copy, content, label = title) {
    $('#modal-root').innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(label)}"><button class="modal-close" data-action="close-modal" aria-label="Close">×</button><h2>${escapeHTML(title)}</h2><p class="modal-copy">${escapeHTML(copy)}</p>${content}</section></div>`;
    $('.modal-close')?.focus();
  }

  function showLanguages() {
    const options = TRACKS.map(track => `<button class="language-option ${track.id === activeTrack.id ? 'active' : ''}" data-track-select="${track.id}"><span class="language-symbol">${escapeHTML(TRACK_ICONS[track.id] || track.icon)}</span><span><b>${escapeHTML(track.name)}</b><small>${escapeHTML(track.description)}</small></span><span aria-hidden="true">${track.id === activeTrack.id ? '✓' : '›'}</span></button>`).join('');
    showModal('Languages', 'All five paths are open. Switch whenever you like.', `<div class="language-list">${options}</div>`, 'Choose a language');
  }

  function showCustomizeLinks() {
    showModal('Customize links', 'Save the places you like to listen and watch.', `<label>Spotify link<input id="spotify-url" type="url" inputmode="url" value="${escapeHTML(state.links.spotify)}" autocomplete="url"></label><label>YouTube link<input id="youtube-url" type="url" inputmode="url" value="${escapeHTML(state.links.youtube)}" autocomplete="url"></label><button class="primary-button" data-action="save-links">Save links</button>`);
  }

  function closeModal() {
    $('#modal-root').innerHTML = '';
  }

  function selectTrack(id) {
    if (!TRACKS.some(track => track.id === id)) return;
    state.track = id;
    selectedUnit = 0;
    activeTrack = trackFor(id);
    closeModal();
    renderPath();
    save();
  }

  function updateSeanMood(mood, message) {
    const note = $('#coach-note');
    if (!note) return;
    note.dataset.mood = mood;
    const reaction = $('.sean-reaction-text', note.parentElement);
    if (reaction) reaction.textContent = message;
    const text = $('.companion-message', note);
    if (text) text.innerHTML = `<strong class="sean-name">Sean</strong>${escapeHTML(message)}`;
    const figure = $('.sean-mini, .sean-figure', note);
    if (figure) figure.dataset.mood = mood;
  }

  function setFeedback(message, kind = '') {
    const feedback = $('#feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `feedback ${kind}`.trim();
  }

  function completeStep() {
    if (!session || session.earnedSteps.includes(session.stepIndex)) return;
    session.earnedSteps.push(session.stepIndex);
    awardXP(8);
  }

  function showContinueButton(button) {
    if (!button?.isConnected) return;
    const next = document.createElement('button');
    next.className = 'primary-button feedback-continue';
    next.dataset.action = 'continue';
    next.innerHTML = 'CONTINUE <span class="key-hint">Enter</span>';
    const feedback = $('#feedback');
    if (feedback) {
      button.remove();
      feedback.append(next);
    } else button.replaceWith(next);
    next.focus({ preventScroll: true });
  }

  function nextStep() {
    if (!session) return;
    if (session.stepIndex >= session.lesson.steps.length - 1) return completeLesson();
    session.stepIndex += 1;
    session.code = null;
    session.order = [];
    session.fillValues = null;
    session.selectedBlank = null;
    runnerBusy = false;
    renderLesson();
  }

  function completeLesson() {
    if (!session || session.completed) return;
    session.completed = true;
    const key = lessonKey(session.trackId, session.lesson.id);
    const isNew = !state.completed.includes(key);
    if (isNew) {
      state.completed.push(key);
      awardXP(20);
      checkMilestones();
    }
    updateSeanMood('celebrating', isNew ? 'You finished a whole lesson. That’s lovely.' : 'A nice little review.');
    celebrateHearts();
    showToast(isNew ? 'Lesson finished. Nice work, Mheriel ♥' : 'A lovely review. Nice work, Mheriel ♥');
    const finishedSession = session;
    setTimeout(() => {
      if (session === finishedSession && activeView === 'lesson') renderPath();
    }, 650);
  }

  function celebrateHearts() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const layer = $('#celebrations');
    if (!layer) return;
    const max = 14;
    const active = $$('.heart-particle', layer);
    active.slice(0, Math.max(0, active.length + 12 - max)).forEach(heart => heart.remove());
    for (let index = 0; index < 12; index += 1) {
      if ($$('.heart-particle', layer).length >= max) break;
      const heart = document.createElement('span');
      heart.className = 'heart-particle';
      heart.textContent = index % 3 === 0 ? '♥' : '♡';
      heart.style.left = `${10 + Math.random() * 80}%`;
      heart.style.setProperty('--drift', `${Math.round(Math.random() * 100 - 50)}px`);
      layer.append(heart);
      setTimeout(() => heart.remove(), 1800);
    }
  }

  function selectBlank(index) {
    const step = getCurrentStep();
    if (!session || !step || session.earnedSteps.includes(session.stepIndex)) return;
    if (session.fillValues[index]) session.fillValues[index] = null;
    session.selectedBlank = index;
    renderLesson();
  }

  function placeChip(chipIndex) {
    const step = getCurrentStep();
    if (!session || !step || session.earnedSteps.includes(session.stepIndex)) return;
    if (session.fillValues.some(item => item?.chipIndex === chipIndex)) return;
    let index = session.selectedBlank;
    if (index == null || session.fillValues[index]) index = session.fillValues.findIndex(item => !item);
    if (index < 0) return;
    session.fillValues[index] = { value: step.chips[chipIndex], chipIndex };
    session.selectedBlank = null;
    renderLesson();
  }

  function placeChipAt(chipIndex, blankIndex) {
    const step = getCurrentStep();
    if (!session || !step || step.type !== 'fill_blank' || session.earnedSteps.includes(session.stepIndex)) return;
    if (!Number.isInteger(chipIndex) || chipIndex < 0 || chipIndex >= step.chips.length) return;
    if (!Number.isInteger(blankIndex) || blankIndex < 0 || blankIndex >= step.answers.length) return;
    if (session.fillValues.some(item => item?.chipIndex === chipIndex)) return;
    session.fillValues[blankIndex] = { value: step.chips[chipIndex], chipIndex };
    session.selectedBlank = null;
    renderLesson();
  }

  function chipFromEvent(event) {
    const encoded = event.dataTransfer?.getData('application/x-mheriel-chip');
    const plain = encoded || event.dataTransfer?.getData('text/plain');
    if (plain !== '') {
      const parsed = Number(plain);
      if (Number.isInteger(parsed)) return parsed;
    }
    return Number(event.target.closest('[data-chip-index]')?.dataset.chipIndex);
  }

  function handleChipDragStart(event) {
    if (touchChipDrag) {
      event.preventDefault();
      return;
    }
    const chip = event.target.closest('[data-chip-index]');
    if (!chip || chip.disabled || getCurrentStep()?.type !== 'fill_blank') return;
    const index = Number(chip.dataset.chipIndex);
    event.dataTransfer?.setData('application/x-mheriel-chip', String(index));
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    chip.classList.add('dragging');
  }

  function clearChipDragStyles() {
    $$('.choice-chip.dragging').forEach(chip => chip.classList.remove('dragging'));
    $$('.fill-slot.drag-over').forEach(slot => slot.classList.remove('drag-over'));
  }

  function handleChipDragOver(event) {
    const slot = event.target.closest('[data-blank-index]');
    if (!slot || getCurrentStep()?.type !== 'fill_blank') return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    $$('.fill-slot.drag-over').forEach(item => { if (item !== slot) item.classList.remove('drag-over'); });
    slot.classList.add('drag-over');
  }

  function handleChipDrop(event) {
    const slot = event.target.closest('[data-blank-index]');
    if (!slot) return;
    event.preventDefault();
    const chipIndex = chipFromEvent(event);
    const blankIndex = Number(slot.dataset.blankIndex);
    if (Number.isInteger(chipIndex)) {
      placeChipAt(chipIndex, blankIndex);
      suppressChipClickUntil = Date.now() + 350;
    }
    clearChipDragStyles();
  }

  function clearTouchChipDrag() {
    if (!touchChipDrag) return;
    touchChipDrag.source?.classList.remove('dragging');
    touchChipDrag.over?.classList.remove('drag-over');
    touchChipDrag.ghost?.remove();
    touchChipDrag = null;
  }

  function handleChipPointerDown(event) {
    if (event.pointerType === 'mouse' || getCurrentStep()?.type !== 'fill_blank') return;
    const chip = event.target.closest('[data-chip-index]');
    if (!chip || chip.disabled) return;
    touchChipDrag = {
      pointerId: event.pointerId,
      chipIndex: Number(chip.dataset.chipIndex),
      source: chip,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      ghost: null,
      over: null
    };
  }

  function handleChipPointerMove(event) {
    const drag = touchChipDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.started && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    if (!drag.started) {
      drag.started = true;
      drag.source.classList.add('dragging');
      const ghost = document.createElement('div');
      ghost.className = 'drag-chip-ghost';
      ghost.textContent = drag.source.textContent.trim();
      document.body.append(ghost);
      drag.ghost = ghost;
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    const under = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-blank-index]') || null;
    if (drag.over !== under) {
      drag.over?.classList.remove('drag-over');
      drag.over = under;
      drag.over?.classList.add('drag-over');
    }
  }

  function handleChipPointerUp(event) {
    const drag = touchChipDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.started && event.type !== 'pointercancel') {
      suppressChipClickUntil = Date.now() + 500;
      if (drag.over) placeChipAt(drag.chipIndex, Number(drag.over.dataset.blankIndex));
    }
    clearTouchChipDrag();
  }

  function clearFill() {
    if (!session || session.earnedSteps.includes(session.stepIndex)) return;
    const step = getCurrentStep();
    if (step?.type !== 'fill_blank') return;
    session.fillValues = new Array(step.answers.length).fill(null);
    session.selectedBlank = null;
    renderLesson();
  }

  function checkFill() {
    const step = getCurrentStep();
    if (!session || !step || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    const values = session.fillValues.map(item => item?.value ?? null);
    const correct = values.length === step.answers.length && values.every((value, index) => value === step.answers[index]);
    if (correct) {
      setFeedback('✓ That fits.', 'good');
      updateSeanMood('happy', 'Yes, that fits.');
      completeStep();
      showContinueButton($('.fill-actions [data-action="check-fill"]'));
    } else {
      setFeedback('Not quite. Try another token or tap a filled blank to clear it.', 'try-again');
      updateSeanMood('thinking', 'Almost. Have another go.');
    }
  }

  function placeReorderLine(index) {
    if (!session || session.completed || session.earnedSteps.includes(session.stepIndex) || session.order.includes(index)) return;
    session.order.push(index);
    renderLesson();
  }

  function returnReorderLine(position) {
    if (!session || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    session.order.splice(position, 1);
    renderLesson();
  }

  function checkReorder() {
    const step = getCurrentStep();
    if (!step || !session || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    const correct = JSON.stringify(session.order) === JSON.stringify(step.solution);
    if (correct) {
      setFeedback('✓ That is the right order.', 'good');
      updateSeanMood('happy', 'That reads right now.');
      completeStep();
      showContinueButton($('.reorder-actions [data-action="check-reorder"]'));
    } else {
      setFeedback('Not yet. Move a line back or try a different order.', 'try-again');
      updateSeanMood('thinking', 'Have another look at the order.');
    }
  }

  function placePill(index) {
    const step = getCurrentStep();
    if (!step || step.type !== 'pill_challenge' || !session || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    if (session.order.includes(index)) return;
    session.order.push(index);
    renderLesson();
  }

  function handlePillDragStart(event) {
    const source = event.target.closest('[data-pill-index], [data-pill-token]');
    if (!source || getCurrentStep()?.type !== 'pill_challenge') return;
    const index = source.dataset.pillIndex ?? source.dataset.pillToken;
    event.dataTransfer?.setData('application/x-mheriel-pill', String(index));
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    source.classList.add('dragging');
  }

  function handlePillDragOver(event) {
    const slot = event.target.closest('[data-pill-slot]');
    if (!slot || getCurrentStep()?.type !== 'pill_challenge') return;
    event.preventDefault();
    slot.classList.add('drag-over');
  }

  function handlePillDrop(event) {
    const slot = event.target.closest('[data-pill-slot]');
    if (!slot || !session || getCurrentStep()?.type !== 'pill_challenge') return;
    event.preventDefault();
    const raw = event.dataTransfer?.getData('application/x-mheriel-pill') || event.dataTransfer?.getData('text/plain');
    const tokenIndex = Number(raw);
    const slotIndex = Number(slot.dataset.pillSlot);
    if (!Number.isInteger(tokenIndex) || !Number.isInteger(slotIndex)) return;
    const order = session.order.filter(index => index !== tokenIndex);
    order.splice(Math.min(slotIndex, order.length), 0, tokenIndex);
    session.order = order.slice(0, getCurrentStep().answers.length);
    renderLesson();
  }

  function clearPillDragStyles() {
    $$('.token-pill.dragging, [data-pill-slot].drag-over').forEach(item => item.classList.remove('dragging', 'drag-over'));
  }

  function clearTouchPillDrag() {
    if (!touchPillDrag) return;
    touchPillDrag.source?.classList.remove('dragging');
    touchPillDrag.over?.classList.remove('drag-over');
    touchPillDrag.ghost?.remove();
    touchPillDrag = null;
  }

  function handlePillPointerDown(event) {
    if (event.pointerType === 'mouse' || getCurrentStep()?.type !== 'pill_challenge') return;
    const source = event.target.closest('[data-pill-index], [data-pill-token]');
    if (!source || source.disabled) return;
    const rawIndex = source.dataset.pillIndex ?? source.dataset.pillToken;
    const tokenIndex = Number(rawIndex);
    if (!Number.isInteger(tokenIndex)) return;
    touchPillDrag = { pointerId: event.pointerId, tokenIndex, source, startX: event.clientX, startY: event.clientY, started: false, over: null, ghost: null };
    source.setPointerCapture?.(event.pointerId);
  }

  function handlePillPointerMove(event) {
    const drag = touchPillDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.started && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    if (!drag.started) {
      drag.started = true;
      drag.source.classList.add('dragging');
      const ghost = document.createElement('div');
      ghost.className = 'drag-pill-ghost';
      ghost.textContent = drag.source.textContent.trim();
      document.body.append(ghost);
      drag.ghost = ghost;
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    const under = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-pill-slot]') || null;
    if (drag.over !== under) {
      drag.over?.classList.remove('drag-over');
      drag.over = under;
      drag.over?.classList.add('drag-over');
    }
  }

  function handlePillPointerUp(event) {
    const drag = touchPillDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.started && event.type !== 'pointercancel' && drag.over && session && !session.completed) {
      const slotIndex = Number(drag.over.dataset.pillSlot);
      const step = getCurrentStep();
      if (step?.type === 'pill_challenge' && Number.isInteger(slotIndex)) {
        const order = session.order.filter(index => index !== drag.tokenIndex);
        order.splice(Math.min(slotIndex, order.length), 0, drag.tokenIndex);
        session.order = order.slice(0, step.answers.length);
        suppressChipClickUntil = Date.now() + 500;
        clearTouchPillDrag();
        renderLesson();
        return;
      }
    }
    clearTouchPillDrag();
  }

  function returnPill(position) {
    if (!session || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    session.order.splice(position, 1);
    renderLesson();
  }

  function runCompletedPill() {
    const step = getCurrentStep();
    if (!step || step.type !== 'pill_challenge' || !session) return;
    const source = session.order.map(index => step.lines[index]?.text || '').join('\n');
    const language = step.language || activeTrack.id;
    state.drafts[language] = source;
    sandboxLanguage = language;
    state.sandboxLanguage = language;
    sandboxOpen = true;
    customSandboxOpen = false;
    save();
    renderSandbox();
  }

  function checkPill() {
    const step = getCurrentStep();
    if (!step || step.type !== 'pill_challenge' || !session || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    const correct = JSON.stringify(session.order) === JSON.stringify(step.answers);
    if (!correct) {
      setFeedback('Not yet. Try the token order again.', 'try-again');
      updateSeanMood('thinking', 'Each token has a place. Try one small move.');
      return;
    }
    setFeedback('✓ Correct! +8 XP', 'good');
    updateSeanMood('happy', 'That token sequence works.');
    completeStep();
    $('[data-action="check-pill"]')?.remove();
    const feedback = $('#feedback');
    if (feedback) {
      const run = document.createElement('button');
      run.className = 'secondary-button feedback-run';
      run.dataset.action = 'run-pill';
      run.textContent = 'RUN CODE';
      feedback.append(run);
      const next = document.createElement('button');
      next.className = 'primary-button feedback-continue';
      next.dataset.action = 'continue';
      next.innerHTML = 'CONTINUE <span class="key-hint">Enter</span>';
      feedback.append(next);
      next.focus({ preventScroll: true });
    }
  }

  function toggleWhy() {
    const panel = $('#why-panel');
    if (panel) panel.hidden = !panel.hidden;
  }

  function escapeScriptText(value) {
    return JSON.stringify(value).replace(/<\/script/gi, '<\\/script');
  }

  function javascriptDocument(code, runId) {
    const source = escapeScriptText(code);
    const id = JSON.stringify(runId);
    return `<!doctype html><meta charset="utf-8"><script>(()=>{const runId=${id};let failed=false;const send=(type,value,error=false)=>parent.postMessage({mherielRun:runId,type,value:String(value),error},'*');const format=value=>{if(typeof value==='string')return value;try{return JSON.stringify(value)}catch{return String(value)}};const logger={log:(...values)=>send('line',values.map(format).join(' ')),info:(...values)=>send('line',values.map(format).join(' ')),warn:(...values)=>send('line',values.map(format).join(' ')),error:(...values)=>{failed=true;send('line',values.map(format).join(' '),true)}};try{const result=(new Function('console',${source}))(logger);Promise.resolve(result).then(()=>send('done','',failed)).catch(error=>{send('line',error.message||error,true);send('done','',true)})}catch(error){send('line',error.message||error,true);send('done','',true)}})();<\/script>`;
  }

  function runJavaScript(source, frame, output) {
    return new Promise(resolve => {
      const runId = `run-${Date.now()}-${++runSequence}`;
      const lines = [];
      let settled = false;
      const finish = success => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        window.removeEventListener('message', receive);
        output.textContent = lines.join('\n') || (success ? 'JavaScript ran successfully.' : 'The code stopped with an error.');
        resolve(success);
      };
      const receive = event => {
        if (event.source !== frame.contentWindow || event.data?.mherielRun !== runId) return;
        if (event.data.type === 'line') lines.push(`${event.data.error ? 'Error: ' : ''}${event.data.value}`);
        if (event.data.type === 'done') finish(!event.data.error);
      };
      const timeout = setTimeout(() => finish(false), 4500);
      window.addEventListener('message', receive);
      frame.srcdoc = javascriptDocument(source, runId);
    });
  }

  async function getPyodide() {
    if (pyodidePromise) return pyodidePromise;
    showToast('Sean is warming up Python...');
    pyodidePromise = new Promise((resolve, reject) => {
      if (window.loadPyodide) {
        window.loadPyodide().then(resolve, reject);
        return;
      }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
        script.async = true;
        script.onload = () => window.loadPyodide().then(resolve, reject);
        script.onerror = () => reject(new Error('Python could not load. Check your connection and try again.'));
        document.head.append(script);
    }).catch(error => {
      pyodidePromise = null;
      throw error;
    });
    return pyodidePromise;
  }

  function formatJSONError(error) {
    const detail = error?.message || 'The text could not be parsed.';
    return `JSON is not valid: ${detail} Use double quotes around text, for example {"text":"the page c"}.`;
  }

  async function readAIResponse(response) {
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
    if (!response.ok) {
      throw new Error(data.error || `Sean's AI request failed (${response.status}).`);
    }
    return data;
  }

  async function executeCode(language, source, frame, output) {
    output.textContent = '';
    if (language === 'html') {
      frame.srcdoc = `${source}\n<script>document.addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault()})<\/script>`;
      output.textContent = 'Rendered in the preview.';
      return true;
    }
    if (language === 'css') {
      frame.srcdoc = `<!doctype html><meta charset="utf-8"><style>body{padding:20px;font:16px system-ui;color:#211927}.demo{padding:18px;border:1px solid #eadde5;border-radius:12px}.heart{color:#db2777}</style><style>${source}</style><main class="demo"><h2 class="heart">A little style test</h2><p class="heart">Change the text, space, or shape.</p><button class="heart">Mheriel ♥</button></main>`;
      output.textContent = 'Rendered in the preview.';
      return true;
    }
    if (language === 'javascript') {
      output.textContent = 'Running…';
      return runJavaScript(source, frame, output);
    }
    if (language === 'json') {
      try {
        JSON.parse(source);
        output.textContent = 'Valid JSON ✓';
        return true;
      } catch (error) {
        output.textContent = formatJSONError(error);
        return false;
      }
    }
    if (language === 'python') {
      try {
        const pyodide = await getPyodide();
        const lines = [];
        pyodide.setStdout({ batched: line => lines.push(line) });
        pyodide.setStderr({ batched: line => lines.push(`Error: ${line}`) });
        await pyodide.runPythonAsync(source);
        output.textContent = lines.join('\n') || 'Python ran successfully ✓';
        return true;
      } catch (error) {
        output.textContent = String(error);
        return false;
      }
    }
    output.textContent = 'That runner is not available.';
    return false;
  }

  function inspectionDocumentScript(runId, checks) {
    const id = JSON.stringify(runId);
    const list = JSON.stringify(checks || []);
    return `<script>(()=>{const id=${id},checks=${list};try{const inspection=checks.map(check=>{const nodes=[...document.querySelectorAll(check.selector||'*')],node=nodes[0];if(check.property==='exists')return nodes.length>0;if(check.property==='count')return nodes.length;if(check.attribute)return node?.getAttribute(check.attribute)||'';if(check.property==='text')return node?.textContent?.trim()||'';return node?getComputedStyle(node).getPropertyValue(check.property).trim():''});parent.postMessage({mherielRun:id,type:'done',inspection},'*')}catch(error){parent.postMessage({mherielRun:id,type:'done',error:error.message||String(error)},'*')}})();<\/script>`;
  }

  function javascriptRunnerDocument(source, runId) {
    const id = JSON.stringify(runId);
    const code = escapeScriptText(source);
    return `<!doctype html><meta charset="utf-8"><script>(()=>{const id=${id},code=${code},lines=[];const format=value=>{if(typeof value==='string')return value;try{return JSON.stringify(value)}catch{return String(value)}};const log={log:(...values)=>lines.push(values.map(format).join(' ')),info:(...values)=>lines.push(values.map(format).join(' ')),warn:(...values)=>lines.push(values.map(format).join(' ')),error:(...values)=>lines.push(values.map(format).join(' '))};const done=(error='')=>parent.postMessage({mherielRun:id,type:'done',logs:lines,error},'*');try{Promise.resolve((new Function('console',code))(log)).then(()=>done(),error=>done(error.message||String(error)))}catch(error){done(error.message||String(error))}})();<\/script>`;
  }

  function runFrame(frame, output, documentText) {
    return new Promise(resolve => {
      const runId = `mheriel-${Date.now()}-${++runSequence}`;
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        window.removeEventListener('message', receive);
        const messages = result.logs || [];
        output.textContent = result.error || messages.join('\n') || (result.inspection ? 'Preview ready.' : 'Code ran without output.');
        resolve({ ...result, logs: messages, ok: !result.error });
      };
      const receive = event => {
        if (event.source !== frame.contentWindow || event.data?.mherielRun !== runId || event.data.type !== 'done') return;
        finish(event.data);
      };
      const timeout = setTimeout(() => finish({ error: 'This code took too long to finish. Try a smaller change.' }), 5000);
      window.addEventListener('message', receive);
      frame.srcdoc = documentText(runId);
    });
  }

  function customSandboxDocument(project, runId) {
    const id = JSON.stringify(runId);
    const javascript = escapeScriptText(project.javascript || '');
    const css = String(project.css || '').replace(/<\/style/gi, '<\\/style');
    const styleBlock = `<style>${css}</style>`;
    const monitor = `<script>(()=>{const lines=[];const format=value=>{if(typeof value==='string')return value;try{return JSON.stringify(value)}catch{return String(value)}};['log','info','warn','error'].forEach(method=>{console[method]=(...values)=>lines.push(values.map(format).join(' '))});window.addEventListener('error',event=>lines.push('Error: '+(event.message||'The page script had an error.')));window.__mherielCustomLogs=lines})();<\/script>`;
    const execute = `<script>(()=>{const id=${id},lines=window.__mherielCustomLogs||[];const finish=(error='')=>parent.postMessage({mherielRun:id,type:'done',logs:lines,inspection:true,error},'*');try{(new Function('console',${javascript}))(window.console);finish()}catch(error){lines.push('Error: '+(error.message||String(error)));finish(error.message||String(error))}})();<\/script>`;
    let page = String(project.html || '');
    if (/<\/head>/i.test(page)) page = page.replace(/<\/head>/i, `${styleBlock}${monitor}</head>`);
    else page = `<!doctype html><html><head><meta charset="utf-8">${styleBlock}${monitor}</head><body>${page}</body></html>`;
    if (/<\/body>/i.test(page)) return page.replace(/<\/body>/i, `${execute}</body>`);
    return `${page}${execute}`;
  }

  async function runCode(language, source, frame, output, rule = null) {
    output.textContent = 'Running…';
    if (language === 'html') {
      const inspector = runId => `<!doctype html><meta charset="utf-8"><style>html{overflow-wrap:anywhere}body{margin:0;padding:14px;color:#211927;font:16px/1.55 "DM Sans",system-ui,sans-serif}h1{margin:0 0 10px;font-size:1.5rem;line-height:1.25}p{margin:.65em 0}img{max-width:100%;height:auto}</style>${source}\n${inspectionDocumentScript(runId, rule?.checks)}`;
      return runFrame(frame, output, inspector);
    }
    if (language === 'css') {
      const inspector = runId => `<!doctype html><meta charset="utf-8"><style>body{padding:20px;font:16px system-ui;color:#211927}.demo{padding:18px;border:1px solid #eadde5;border-radius:12px}.row{display:flex;gap:8px}.note{padding:12px}.card{padding:12px}.title{font-size:20px}</style><style>${source}</style><main class="demo"><h1 class="title">A little title</h1><p class="note">A note for Mheriel</p><section class="card">A card</section><div class="row"><span>Tea</span><span>Cake</span></div></main>${inspectionDocumentScript(runId, rule?.checks)}`;
      return runFrame(frame, output, inspector);
    }
    if (language === 'javascript') return runFrame(frame, output, runId => javascriptRunnerDocument(source, runId));
    if (language === 'json') {
      try {
        const json = JSON.parse(source);
        output.textContent = `Valid JSON ✓\n\n${JSON.stringify(json, null, 2)}`;
        return { ok: true, json, logs: [] };
      } catch (error) {
        output.textContent = formatJSONError(error);
        return { ok: false, error: error.message, logs: [] };
      }
    }
    if (language === 'python') {
      try {
        const pyodide = await getPyodide();
        const lines = [];
        pyodide.setStdout({ batched: line => lines.push(line) });
        pyodide.setStderr({ batched: line => lines.push(line) });
        await pyodide.runPythonAsync(source);
        output.textContent = lines.join('\n') || 'Python ran successfully.';
        return { ok: true, logs: lines };
      } catch (error) {
        output.textContent = String(error);
        return { ok: false, error: String(error), logs: [] };
      }
    }
    output.textContent = 'That runner is not available.';
    return { ok: false, error: 'Runner unavailable.', logs: [] };
  }

  function ruleValueMatches(actual, test, expected) {
    if (test === 'nonempty') return typeof actual === 'string' && actual.trim().length > 0;
    if (test === 'notempty') return typeof actual === 'string' && actual.trim().length > 0;
    if (test === 'true') return actual === true;
    if (test === 'equals') return String(actual).toLowerCase() === String(expected).toLowerCase();
    if (test === 'contains') return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    if (test === 'gte') return Number(actual) >= Number(expected);
    if (test === 'minpx') return parseFloat(actual) >= Number(expected);
    if (test === 'nottransparent') return Boolean(actual) && actual !== 'transparent' && actual !== 'rgba(0, 0, 0, 0)';
    if (test === 'type') {
      const actualType = actual === null ? 'null' : Array.isArray(actual) ? 'array' : typeof actual;
      return actualType === expected;
    }
    if (test === 'array-min') return Array.isArray(actual) && actual.length >= Number(expected);
    return false;
  }

  function valueAtPath(value, path) {
    return path.split('.').reduce((current, key) => current == null ? undefined : current[key], value);
  }

  function evaluateRule(rule, result, source) {
    if (!rule) return true;
    if (rule.kind === 'changed') return source.trim().length > 0 && source.trim() !== rule.original;
    if (rule.kind === 'html' || rule.kind === 'css') {
      if (!Array.isArray(rule.checks) || !Array.isArray(result.inspection)) return false;
      const passed = rule.checks.filter((check, index) => ruleValueMatches(result.inspection[index], check.test, check.value)).length;
      const minimum = Number.isInteger(rule.minChecks) ? rule.minChecks : rule.checks.length;
      return passed >= Math.max(1, Math.min(rule.checks.length, minimum));
    }
    if (rule.kind === 'json') {
      if (!Array.isArray(rule.checks)) return false;
      const passed = rule.checks.filter(check => ruleValueMatches(valueAtPath(result.json, check.path), check.test, check.value)).length;
      const minimum = Number.isInteger(rule.minChecks) ? rule.minChecks : rule.checks.length;
      return passed >= Math.max(1, Math.min(rule.checks.length, minimum));
    }
    if (rule.kind === 'js' || rule.kind === 'python') {
      const outputText = (result.logs || []).join('\n');
      const sourceOkay = (rule.sourceIncludes || []).every(fragment => source.includes(fragment));
      const outputOkay = (rule.outputIncludes || []).every(fragment => outputText.toLowerCase().includes(fragment.toLowerCase()));
      return sourceOkay && outputOkay;
    }
    return false;
  }

  async function runLessonCode() {
    const step = getCurrentStep();
    const editor = $('#code-editor');
    const button = $('[data-action="run"]');
    const output = $('#lesson-output');
    const frame = $('#lesson-preview');
    if (!step || !editor || !output || !frame || runnerBusy || session.completed || session.earnedSteps.includes(session.stepIndex)) return;
    runnerBusy = true;
    session.code = editor.value;
    if (button) button.disabled = true;
    try {
      const result = await runCode(step.language, editor.value, frame, output, step.rule);
      const passed = result.ok && evaluateRule(step.rule, result, editor.value);
      if (passed) {
        setFeedback(`✓ ${step.success || 'That works.'}`, 'good');
        updateSeanMood('happy', 'Nice, that works.');
        completeStep();
        editor.readOnly = true;
        showContinueButton(button);
      } else {
        setFeedback(step.retryHint || 'Not quite yet. Make one small change and run it again.', 'try-again');
        updateSeanMood('thinking', step.retryHint || 'You are close. Try one small change.');
      }
    } catch (error) {
      output.textContent = error.message || 'The code could not run.';
      setFeedback('That did not run yet. Check the message and try again.', 'try-again');
      updateSeanMood('thinking', 'The message below should point us in the right direction.');
    } finally {
      runnerBusy = false;
      if (button?.isConnected) button.disabled = false;
    }
  }

  async function runSandbox() {
    const editor = $('#sandbox-editor');
    const output = $('#sandbox-output');
    const frame = $('#sandbox-preview');
    if (!editor || !output || !frame || runnerBusy) return;
    runnerBusy = true;
    const button = $('[data-action="run-sandbox"]');
    if (button) button.disabled = true;
    state.drafts[sandboxLanguage] = editor.value;
    save();
    try {
      await runCode(sandboxLanguage, editor.value, frame, output);
    } catch (error) {
      output.textContent = error.message || 'The code could not run.';
    } finally {
      runnerBusy = false;
      if (button?.isConnected) button.disabled = false;
    }
  }

  async function runCustomSandbox() {
    const editor = $('#custom-editor');
    const output = $('#custom-output');
    const frame = $('#custom-preview');
    const button = $('[data-action="run-custom-sandbox"]');
    if (!editor || !output || !frame || runnerBusy) return;
    state.drafts.customProject[customFile] = editor.value;
    save();
    runnerBusy = true;
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    output.textContent = 'Running your page…';
    try {
      await runFrame(frame, output, runId => customSandboxDocument(state.drafts.customProject, runId));
    } catch (error) {
      output.textContent = error.message || 'The custom page could not run.';
    } finally {
      runnerBusy = false;
      if (button?.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  }

  function resetCustomSandbox() {
    state.drafts.customProject = { ...CUSTOM_STARTER };
    customFile = 'html';
    state.customFile = customFile;
    save();
    renderCustomSandbox();
    showToast('Custom starter restored.');
  }

  async function copyCustomFile() {
    const editor = $('#custom-editor');
    if (!editor) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(editor.value);
      else { editor.focus(); editor.select(); if (!document.execCommand('copy')) throw new Error('Copy unavailable'); }
      showToast(`${customFile === 'javascript' ? 'JavaScript' : customFile.toUpperCase()} copied.`);
    } catch {
      showToast('Could not copy here. Select the code and copy it.');
    }
  }

  function saveCustomSnippet() {
    const name = $('#custom-snippet-name')?.value.trim();
    if (!name) { showToast('Give this project a name first.'); return; }
    const code = JSON.stringify(state.drafts.customProject);
    const existing = state.snippets.find(item => item.lang === 'custom' && item.name.toLowerCase() === name.toLowerCase());
    if (existing) existing.code = code;
    else state.snippets.push({ id: makeId('custom'), name, lang: 'custom', code });
    save();
    renderCustomSandbox();
    showToast('Custom project saved on this device.');
  }

  function resetSandbox() {
    const editor = $('#sandbox-editor');
    if (!editor) return;
    state.drafts[sandboxLanguage] = SNIPPETS[sandboxLanguage] || '';
    editor.value = state.drafts[sandboxLanguage];
    save();
    const output = $('#sandbox-output');
    if (output) output.textContent = 'Starter loaded. Run it to see the result.';
    showToast('Starter code restored.');
  }

  function clearSandboxOutput() {
    const output = $('#sandbox-output');
    if (output) output.textContent = 'Output cleared.';
  }

  function formatSandboxJSON() {
    const editor = $('#sandbox-editor');
    const output = $('#sandbox-output');
    if (!editor || sandboxLanguage !== 'json') return;
    try {
      editor.value = JSON.stringify(JSON.parse(editor.value), null, 2);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      if (output) output.textContent = 'JSON formatted. Run it to validate.';
    } catch (error) {
      if (output) output.textContent = `JSON could not be formatted. ${formatJSONError(error)}`;
    }
  }

  async function copySandboxCode() {
    const editor = $('#sandbox-editor');
    if (!editor) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(editor.value);
      } else {
        editor.focus();
        editor.select();
        if (!document.execCommand('copy')) throw new Error('Copy is not available in this browser.');
      }
      showToast('Code copied.');
    } catch {
      showToast('Could not copy here. Select the code and copy it.');
    }
  }

  async function askSean(buttonOverride = null, panelSelector = '#ai-reply', why = false) {
    if (activeView === 'sandbox' && (customSandboxOpen || sandboxOpen)) return askSeanInSandbox(buttonOverride);
    const step = getCurrentStep();
    const button = buttonOverride || $('[data-action="ask"]');
    if (!step || !button) return;
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Finding a hint…';
    button.setAttribute('aria-busy', 'true');
    renderSeanReply({ state: 'loading' }, panelSelector);
    updateSeanMood('thinking', 'Let me take a look.');
    try {
      let work = '';
      if (step.type === 'code_challenge') work = $('#code-editor')?.value || '';
      else if (step.type === 'fill_blank') work = step.parts.map(part => typeof part === 'string' ? part : (session.fillValues?.[Number(part.blank)]?.value || '___')).join('');
      else if (step.type === 'reorder' || step.type === 'pill_challenge') work = (session.order || []).map(index => step.lines[index]?.text || step.lines[index]).join('\n');
      else if (step.type === 'concept') work = step.code || '';
      const response = await fetch(new URL('/api/ai', window.location.origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ mode: 'hint', track: activeTrack.name, stepType: why ? 'why explanation' : step.type, language: step.language || activeTrack.id, prompt: why ? `Explain briefly why this rule works: ${step.why || step.prompt || step.title}` : (step.prompt || step.text || step.takeaway), topic: step.title, code: work, output: $('#lesson-output')?.textContent || '' })
      });
      const data = await readAIResponse(response);
      const answer = typeof data.answer === 'string' ? { hint: data.answer, nextStep: '' } : data.answer;
      if (!answer || typeof answer.hint !== 'string') throw new Error('Sean sent an empty reply. Try once more.');
      renderSeanReply({ hint: answer.hint, nextStep: answer.nextStep || '' }, panelSelector);
      updateSeanMood('happy', 'I left a small hint above.');
    } catch (error) {
      renderSeanReply({ state: 'error', hint: error.message || 'Sean could not answer right now.', nextStep: 'Your lesson is still here. You can keep working offline.' }, panelSelector);
      updateSeanMood('thinking', 'The note above explains what happened.');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = originalLabel;
      }
    }
  }

  function renderSeanReply({ state = 'answer', hint = '', nextStep = '' } = {}, panelSelector = '#ai-reply') {
    const panel = $(panelSelector);
    if (!panel) return;
    panel.hidden = false;
    const loading = state === 'loading';
    const error = state === 'error';
    const title = loading ? 'Sean is thinking' : error ? 'A quick note from Sean' : 'A hint for this step';
    const message = loading ? 'Just a sec. A small hint is on the way.' : hint;
    panel.dataset.state = state;
    panel.innerHTML = `<span class="ai-reply-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h15A3.5 3.5 0 0 1 27 7.5v11a3.5 3.5 0 0 1-3.5 3.5H15l-6 5v-5.1a3.5 3.5 0 0 1-4-3.4v-11Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 12.5c0-1.3 1.7-1.8 2.5-.6.8-1.2 2.5-.7 2.5.6 0 1.1-2.5 2.8-2.5 2.8S12 13.6 12 12.5Z" fill="currentColor"/></svg></span><div class="ai-reply-copy"><div class="ai-reply-heading"><strong>${escapeHTML(title)}</strong><span>${loading ? '<i class="ai-reply-spinner" aria-hidden="true"></i>' : error ? 'OFFLINE' : 'SEAN ♥'}</span></div><p class="ai-reply-hint">${escapeHTML(message)}</p>${nextStep ? `<div class="ai-reply-next"><small>${error ? 'FOR NOW' : 'TRY THIS'}</small><p>${escapeHTML(nextStep)}</p></div>` : ''}</div>`;
  }

  async function askSeanInSandbox(buttonOverride = null) {
    const editor = $('#custom-editor') || $('#sandbox-editor');
    const button = buttonOverride || $('[data-shortcut-sean]');
    if (!editor || !button) return;
    const language = customSandboxOpen ? customFile : sandboxLanguage;
    const languageName = language === 'javascript' ? 'JavaScript' : language.toUpperCase();
    const output = $('#custom-output') || $('#sandbox-output');
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Thinking…';
    button.setAttribute('aria-busy', 'true');
    renderSeanReply({ state: 'loading' }, '#sandbox-ai-reply');
    try {
      const response = await fetch(new URL('/api/ai', window.location.origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          mode: 'hint', track: `${languageName} sandbox`, stepType: 'sandbox', language,
          prompt: `Give one small, beginner-friendly hint for this ${languageName} code.`,
          topic: `${languageName} sandbox`, code: editor.value, output: output?.textContent || ''
        })
      });
      const data = await readAIResponse(response);
      const answer = typeof data.answer === 'string' ? { hint: data.answer, nextStep: '' } : data.answer;
      if (!answer || typeof answer.hint !== 'string') throw new Error('Sean sent an empty reply. Try once more.');
      renderSeanReply({ hint: answer.hint, nextStep: answer.nextStep || '' }, '#sandbox-ai-reply');
    } catch (error) {
      renderSeanReply({ state: 'error', hint: error.message || 'Sean could not answer right now.', nextStep: 'Your code is still here. Try again in a moment.' }, '#sandbox-ai-reply');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = originalLabel;
      }
    }
  }

  async function addPracticeDrill() {
    const step = getCurrentStep();
    if (!step || !session) return;
    const button = $('[data-action="drill"]');
    const originalLabel = button?.textContent || '+ Extra drill';
    if (button) { button.disabled = true; button.textContent = 'Making a quick card…'; button.setAttribute('aria-busy', 'true'); }
    try {
      const response = await fetch(new URL('/api/ai', window.location.origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ mode: 'drill', track: activeTrack.name, prompt: step.prompt || step.text, topic: step.title, language: step.language || activeTrack.id })
      });
      const data = await readAIResponse(response);
      const drill = typeof data.drill === 'string' ? JSON.parse(data.drill) : data.drill;
      if (!drill || drill.type !== 'code_challenge' || !drill.prompt || !drill.language || !['html', 'css', 'javascript', 'json', 'python'].includes(drill.language)) throw new Error('Sean sent an incomplete drill. Try again in a moment.');
      drill.rule = { kind: 'changed', original: String(drill.starter || '').trim() };
      session.lesson.steps.push(drill);
      showToast('Sean made you a little extra practice ♥');
      nextStep();
    } catch (error) {
      renderSeanReply({ state: 'error', hint: error.message || 'Sean could not make a practice card right now.', nextStep: 'Keep going with this challenge and ask again later.' });
    } finally {
      if (button?.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = originalLabel; }
    }
  }

  function editorKeys(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const editor = event.currentTarget;
      editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (activeView === 'sandbox' && customSandboxOpen) runCustomSandbox();
      else if (activeView === 'sandbox' && sandboxOpen) runSandbox();
      else runLessonCode();
    }
  }

  function setupPaneSplitter(layout) {
    if (!layout) return;
    const splitter = $('.pane-splitter', layout);
    if (!splitter) return;
    const clampShare = value => Math.max(28, Math.min(72, value));
    const currentShare = () => {
      const saved = parseFloat(layout.style.getPropertyValue('--editor-share'));
      return Number.isFinite(saved) ? saved : Number(splitter.getAttribute('aria-valuenow')) || 54;
    };
    const setShare = value => {
      const share = Math.round(clampShare(value));
      layout.style.setProperty('--editor-share', `${share}%`);
      splitter.setAttribute('aria-valuenow', String(share));
      splitter.setAttribute('aria-valuetext', `Code editor ${share} percent, preview ${100 - share} percent`);
    };
    const moveSplitter = clientX => {
      const bounds = layout.getBoundingClientRect();
      const styles = getComputedStyle(layout);
      const gap = parseFloat(styles.columnGap) || 0;
      const available = Math.max(1, bounds.width - splitter.offsetWidth - gap * 2);
      setShare(((clientX - bounds.left - gap) / available) * 100);
    };
    let activePointer = null;
    const movePointer = event => {
      if (event.pointerId === activePointer) moveSplitter(event.clientX);
    };
    const stopDragging = event => {
      if (event?.pointerId != null && event.pointerId !== activePointer) return;
      activePointer = null;
      window.removeEventListener('pointermove', movePointer);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      document.body.classList.remove('resizing-panes');
    };
    splitter.addEventListener('pointerdown', event => {
      if (getComputedStyle(splitter).display === 'none') return;
      event.preventDefault();
      activePointer = event.pointerId;
      splitter.setPointerCapture?.(event.pointerId);
      window.addEventListener('pointermove', movePointer);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
      document.body.classList.add('resizing-panes');
      moveSplitter(event.clientX);
    });
    splitter.addEventListener('lostpointercapture', () => stopDragging());
    splitter.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setShare(currentShare() + (event.key === 'ArrowRight' ? 3 : -3));
    });
  }

  function firebaseSyncError(error) {
    const code = error?.code || '';
    if (code === 'auth/unauthorized-domain') return 'Add this site under Firebase Authentication → Settings → Authorized domains.';
    if (code === 'auth/operation-not-allowed') return 'Enable Google sign-in under Firebase Authentication → Sign-in method.';
    if (code === 'auth/popup-blocked') return 'Your browser blocked the Google sign-in window. Allow popups for this site and try again.';
    if (code === 'auth/popup-closed-by-user') return 'The Google sign-in window closed before it finished. Try again.';
    if (code === 'permission-denied') return 'Firestore rejected the save. Check the Rules tab under Cloud Firestore and publish the MherielCode rules.';
    return error?.message || 'Cloud sync could not connect.';
  }

  async function syncSignedInProgress() {
    const cloud = await window.FirebaseSync.syncDownFromCloud();
    if (cloud) mergeCloudState(cloud);
    await window.FirebaseSync.syncUpToCloud(state);
    state.sync = true;
    save({ cloud: false });
    closeModal();
    renderMe();
    showToast('Progress synced across devices ♥');
  }

  function failFirebaseSync(error) {
    state.sync = false;
    save({ cloud: false });
    closeModal();
    renderMe();
    showToast(firebaseSyncError(error));
  }

  async function syncProgress(enabled) {
    state.sync = enabled;
    save({ cloud: false });
    if (!enabled) {
      closeModal();
      showToast('Cloud sync is off. This device still saves your progress.');
      renderMe();
      return;
    }
    if (!window.FirebaseSync?.configured()) {
      state.sync = false;
      save({ cloud: false });
      showToast(window.FirebaseSync ? 'Add Firebase web app details to turn on sync.' : 'Firebase sync did not load. Refresh the app and try again.');
      renderMe();
      return;
    }
    try {
      await window.FirebaseSync.prepare();
      const user = await window.FirebaseSync.currentUser();
      if (!user) {
        renderMe();
        showModal('Connect your progress', 'Sign in with Google to save your progress across devices.', '<button class="primary-button" data-action="firebase-signin">Continue with Google</button>', 'Connect progress');
        return;
      }
      await syncSignedInProgress();
    } catch (error) {
      failFirebaseSync(error);
    }
  }

  function continueGoogleSignIn() {
    let signIn;
    try {
      // Start the popup synchronously from this button tap so the browser allows it.
      signIn = window.FirebaseSync.signInWithGoogle();
    } catch (error) {
      failFirebaseSync(error);
      return;
    }
    const button = $('#modal-root [data-action="firebase-signin"]');
    if (button) { button.disabled = true; button.textContent = 'Waiting for Google…'; }
    completeGoogleSignIn(signIn);
  }

  async function completeGoogleSignIn(signIn) {
    try {
      await signIn;
      await syncSignedInProgress();
    } catch (error) {
      failFirebaseSync(error);
    }
  }

  function mergeCloudState(cloud) {
    const localXp = state.xp;
    const localStreak = state.streak;
    const localDate = state.lastDate;
    const localActivityDates = state.activityDates || [];
    const localCompleted = state.completed;
    const localNotes = state.notes;
    const localSnippets = state.snippets;
    const localLinks = state.links;
    Object.assign(state, cloud);
    state.xp = Math.max(Number(state.xp) || 0, Number(cloud.xp) || 0, Number(localXp) || 0);
    state.streak = Math.max(Number(state.streak) || 0, Number(cloud.streak) || 0, Number(localStreak) || 0);
    const dates = [localDate, cloud.lastDate].filter(Boolean).sort();
    state.lastDate = dates[dates.length - 1] || null;
    state.activityDates = [...new Set([...(Array.isArray(cloud.activityDates) ? cloud.activityDates : []), ...localActivityDates])].filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item)).sort().slice(-90);
    state.completed = [...new Set([...(Array.isArray(cloud.completed) ? cloud.completed : []), ...localCompleted])];
    state.notes = [...new Set([...(Array.isArray(cloud.notes) ? cloud.notes : []), ...localNotes])];
    const localLinksCustomized = localLinks.spotify !== DEFAULTS.links.spotify || localLinks.youtube !== DEFAULTS.links.youtube;
    state.links = { ...DEFAULTS.links, ...(localLinksCustomized ? (cloud.links || {}) : localLinks), ...(localLinksCustomized ? localLinks : (cloud.links || {})) };
    const snippets = new Map();
    [...(Array.isArray(cloud.snippets) ? cloud.snippets : []), ...localSnippets].forEach((item, index) => {
      if (!item || typeof item.lang !== 'string' || typeof item.code !== 'string') return;
      const name = item.name || `${item.lang.toUpperCase()} snippet ${index + 1}`;
      const id = item.id || `synced-${item.lang}-${index}`;
      snippets.set(id, { ...item, id, name });
    });
    state.snippets = [...snippets.values()];
    state.drafts = { ...(cloud.drafts || {}), ...(state.drafts || {}) };
    if (!['html', 'css', 'javascript', 'json', 'python'].includes(state.sandboxLanguage)) state.sandboxLanguage = 'html';
    sandboxLanguage = state.sandboxLanguage;
    if (!['html', 'css', 'javascript'].includes(state.customFile)) state.customFile = 'html';
    customFile = state.customFile;
    state.sync = true;
    activeTrack = trackFor(state.track);
  }

  async function restoreCloud() {
    if (!state.sync || !window.FirebaseSync?.configured()) return;
    try {
      const cloud = await window.FirebaseSync.syncDownFromCloud({ interactive: false });
      if (!cloud) return;
      mergeCloudState(cloud);
      save({ cloud: false });
      renderCurrentView();
    } catch (error) {
      showToast(error.message || 'Could not load cloud progress.');
    }
  }

  function handleClick(event) {
    const target = event.target.closest('button');
    if (!target) {
      if (event.target.classList.contains('modal-backdrop')) closeModal();
      return;
    }
    if (target.hasAttribute('data-shortcut-insert')) return insertCodeShortcut(target);
    if (target.hasAttribute('data-shortcut-run')) return runCodeShortcut(target);
    if (target.hasAttribute('data-shortcut-sean')) {
      focusEditorAtSavedSelection(codeShortcutEditor(target));
      return askSean(target);
    }
    if (target.dataset.view) return setView(target.dataset.view);
    if (target.dataset.unit !== undefined) { selectedUnit = Number(target.dataset.unit) || 0; return renderPath(); }
    if (target.dataset.trackSelect) return selectTrack(target.dataset.trackSelect);
    if (target.dataset.lesson) return launchLesson(target.dataset.lesson);
    if (target.dataset.openSandbox) {
      sandboxLanguage = target.dataset.openSandbox;
      state.sandboxLanguage = sandboxLanguage;
      sandboxOpen = true;
      customSandboxOpen = false;
      save();
      return renderSandbox();
    }
    if (target.dataset.openCustomSandbox !== undefined) {
      sandboxOpen = false;
      customSandboxOpen = true;
      return renderCustomSandbox();
    }
    if (target.dataset.customFile) {
      customFile = target.dataset.customFile;
      state.customFile = customFile;
      save();
      return renderCustomSandbox();
    }
    if (target.dataset.blankIndex !== undefined) return selectBlank(Number(target.dataset.blankIndex));
    if (target.dataset.chipIndex !== undefined) {
      if (Date.now() < suppressChipClickUntil) return;
      return placeChip(Number(target.dataset.chipIndex));
    }
    if (target.dataset.poolIndex !== undefined) return placeReorderLine(Number(target.dataset.poolIndex));
    if (target.dataset.orderedPosition !== undefined) return getCurrentStep()?.type === 'pill_challenge' ? returnPill(Number(target.dataset.orderedPosition)) : returnReorderLine(Number(target.dataset.orderedPosition));
    if (target.dataset.pillIndex !== undefined) return placePill(Number(target.dataset.pillIndex));
    if (target.dataset.loadSnippet !== undefined) {
      const saved = state.snippets.find(item => item.id === target.dataset.loadSnippet);
      if (saved) {
        if (saved.lang === 'custom') {
          try {
            const loaded = JSON.parse(saved.code);
            const project = { ...CUSTOM_STARTER };
            if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
              Object.keys(project).forEach(file => { if (typeof loaded[file] === 'string') project[file] = loaded[file]; });
            }
            state.drafts.customProject = project;
            customFile = 'html';
            state.customFile = customFile;
            sandboxOpen = false;
            customSandboxOpen = true;
            save();
            renderCustomSandbox();
          } catch {
            showToast('That custom project could not be opened.');
          }
          return;
        }
        sandboxLanguage = saved.lang;
        state.sandboxLanguage = sandboxLanguage;
        state.drafts[saved.lang] = saved.code;
        customSandboxOpen = false;
        sandboxOpen = true;
        save();
        renderSandbox();
      }
      return;
    }
    if (target.dataset.deleteSnippet !== undefined) {
      state.snippets = state.snippets.filter(item => item.id !== target.dataset.deleteSnippet);
      save();
      if (customSandboxOpen) renderCustomSandbox();
      else if (sandboxOpen) renderSandbox();
      else renderSandboxHome();
      return;
    }
    switch (target.dataset.action) {
      case 'languages': showLanguages(); break;
      case 'install-app': installApp(); break;
      case 'theme': state.theme = state.theme === 'dark' ? 'light' : 'dark'; save(); renderStatus(); if (activeView === 'me') renderMe(); break;
      case 'streak': renderStreak(); break;
      case 'keep-going': setView('path'); break;
      case 'continue': nextStep(); break;
      case 'exit-lesson': setView('path'); break;
      case 'check-fill': checkFill(); break;
      case 'clear-fill': clearFill(); break;
      case 'check-reorder': checkReorder(); break;
      case 'check-pill': checkPill(); break;
      case 'run-pill': runCompletedPill(); break;
      case 'why': toggleWhy(); break;
      case 'ask-why': {
        const panel = $('#why-panel');
        if (panel) panel.hidden = false;
        askSean(target, '#why-ai-reply', true);
        break;
      }
      case 'run': runLessonCode(); break;
      case 'run-sandbox': runSandbox(); break;
      case 'run-custom-sandbox': runCustomSandbox(); break;
      case 'sandbox-home': sandboxOpen = false; customSandboxOpen = false; renderSandboxHome(); break;
      case 'reset-sandbox': resetSandbox(); break;
      case 'reset-custom-sandbox': resetCustomSandbox(); break;
      case 'clear-sandbox-output': clearSandboxOutput(); break;
      case 'format-json': formatSandboxJSON(); break;
      case 'copy-sandbox-code': copySandboxCode(); break;
      case 'copy-custom-file': copyCustomFile(); break;
      case 'save-custom-snippet': saveCustomSnippet(); break;
      case 'save-snippet': {
        const editor = $('#sandbox-editor');
        const name = $('#snippet-name')?.value.trim();
        if (!editor || !name) { showToast('Give this snippet a name first.'); break; }
        const existing = state.snippets.find(item => item.lang === sandboxLanguage && item.name.toLowerCase() === name.toLowerCase());
        if (existing) existing.code = editor.value;
        else state.snippets.push({ id: makeId('snippet'), name, lang: sandboxLanguage, code: editor.value });
        save();
        renderSandbox();
        showToast('Snippet saved on this device.');
        break;
      }
      case 'ask': askSean(); break;
      case 'drill': addPracticeDrill(); break;
      case 'sync-now': syncProgress(true); break;
      case 'firebase-signin': continueGoogleSignIn(); break;
      case 'customize': showCustomizeLinks(); break;
      case 'save-links': {
        state.links.spotify = safeLink($('#spotify-url')?.value, DEFAULTS.links.spotify);
        state.links.youtube = safeLink($('#youtube-url')?.value, DEFAULTS.links.youtube);
        save();
        closeModal();
        if (activeView === 'vibes') renderVibes();
        showToast('Your links are saved.');
        break;
      }
      case 'close-modal': closeModal(); break;
    }
  }

  function handleChange(event) {
    if (event.target.id === 'sync-toggle') syncProgress(event.target.checked);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && $('#modal-root .modal')) return closeModal();
    const step = getCurrentStep();
    const activeTag = document.activeElement?.tagName;
    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey && step?.type === 'concept' && !['BUTTON', 'A', 'INPUT', 'TEXTAREA'].includes(activeTag)) {
      event.preventDefault();
      nextStep();
    }
  }

  function start() {
    renderStatus();
    if (window.location.hash === '#sandbox') renderSandboxHome();
    else renderPath();
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('dragstart', handleChipDragStart);
    document.addEventListener('dragstart', handlePillDragStart);
    document.addEventListener('dragover', handleChipDragOver);
    document.addEventListener('dragover', handlePillDragOver);
    document.addEventListener('drop', handleChipDrop);
    document.addEventListener('drop', handlePillDrop);
    document.addEventListener('dragend', clearChipDragStyles);
    document.addEventListener('dragend', clearPillDragStyles);
    document.addEventListener('pointerdown', handleChipPointerDown);
    document.addEventListener('pointerdown', handlePillPointerDown);
    document.addEventListener('pointerdown', handleCodeShortcutPointerDown);
    window.addEventListener('pointermove', handleChipPointerMove, { passive: false });
    window.addEventListener('pointermove', handlePillPointerMove, { passive: false });
    window.addEventListener('pointerup', handleChipPointerUp);
    window.addEventListener('pointerup', handlePillPointerUp);
    window.addEventListener('pointercancel', handleChipPointerUp);
    window.addEventListener('pointercancel', handlePillPointerUp);
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      installPrompt = event;
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      if (activeView === 'me') renderMe();
      showToast('MherielCode was installed.');
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
    restoreCloud();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
