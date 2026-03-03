import './style.css'

const Settings = {
  pomodoro: 25,
  short: 5,
  long: 15,
  theme: 'pastel',
  customColors: {
    pomodoro: null, // { bg: '#...', text: '#...', btnText: '#...', hex: '#...', glass: '#...' }
    short: null,
    long: null
  },
  bones: 0,
  unlockedBackgrounds: ['default'],
  activeBackground: 'default',
  unlockedAvatars: ['dachshund'],
  activeAvatar: 'dachshund'
};

// Preset Themes
const ThemeMap = {
  pastel: {
    pomodoro: { bg: '#ffe4e6', text: '#e11d48', btnText: '#be123c', hex: '#e11d48', glass: 'rgba(255, 255, 255, 0.4)' },
    short: { bg: '#d1fae5', text: '#059669', btnText: '#047857', hex: '#059669', glass: 'rgba(255, 255, 255, 0.4)' },
    long: { bg: '#dbeafe', text: '#2563eb', btnText: '#1d4ed8', hex: '#2563eb', glass: 'rgba(255, 255, 255, 0.4)' }
  },
  dark: {
    pomodoro: { bg: '#4c1d95', text: '#c4b5fd', btnText: '#ede9fe', hex: '#8b5cf6', glass: 'rgba(15, 23, 42, 0.6)' },
    short: { bg: '#064e3b', text: '#6ee7b7', btnText: '#d1fae5', hex: '#10b981', glass: 'rgba(15, 23, 42, 0.6)' },
    long: { bg: '#1e3a8a', text: '#93c5fd', btnText: '#bfdbfe', hex: '#3b82f6', glass: 'rgba(15, 23, 42, 0.6)' }
  },
  matte: {
    pomodoro: { bg: '#e6dfd8', text: '#8c7b6c', btnText: '#5c4e42', hex: '#a89f91', glass: '#f5f3f0' },
    short: { bg: '#d4d7d1', text: '#6a7465', btnText: '#4a5446', hex: '#8a9683', glass: '#f5f3f0' },
    long: { bg: '#d0d5d9', text: '#657585', btnText: '#445362', hex: '#879ab0', glass: '#f5f3f0' }
  },
  contrast: {
    pomodoro: { bg: '#000000', text: '#ff0000', btnText: '#ff0000', hex: '#ff0000', glass: '#111111' },
    short: { bg: '#000000', text: '#00ff00', btnText: '#00ff00', hex: '#00ff00', glass: '#111111' },
    long: { bg: '#000000', text: '#0088ff', btnText: '#0088ff', hex: '#0088ff', glass: '#111111' }
  }
};

let currentMode = 'pomodoro'; // 'pomodoro', 'short', 'long'
let timeLeft = Settings[currentMode] * 60;
let isRunning = false;
let timerInterval = null;

// --- DOM Elements ---
const bodyBg = document.getElementById('body-bg');
const timerDisplay = document.getElementById('timer-display');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const modeBtns = document.querySelectorAll('.mode-btn');
const avatarPulse = document.getElementById('avatar-pulse');
const doggyAvatar = document.getElementById('doggy-avatar');

// Modal Elements
const modalBackdrop = document.getElementById('modal-backdrop');
const settingsModal = document.getElementById('settings-modal');
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const inputPomodoro = document.getElementById('input-pomodoro');
const inputShort = document.getElementById('input-short');
const inputLong = document.getElementById('input-long');

// Theme & Color Elements
const selectTheme = document.getElementById('select-theme');
const settingsModeLabel = document.getElementById('settings-mode-label');
const inputColorBg = document.getElementById('input-color-bg');
const inputColorGlass = document.getElementById('input-color-glass');
const inputColorAccent = document.getElementById('input-color-accent');

// Store Elements
const btnStore = document.getElementById('btn-store');
const storeModalBackdrop = document.getElementById('store-modal-backdrop');
const storeModal = document.getElementById('store-modal');
const btnCloseStore = document.getElementById('btn-close-store');
const bonesBalanceTop = document.getElementById('bones-balance-top');
const bonesBalanceModal = document.getElementById('bones-balance-modal');

// Starry Elements
const starryActionsBuy = document.getElementById('starry-actions-buy');
const starryActionsOwned = document.getElementById('starry-actions-owned');
const btnBuyStarry = document.getElementById('btn-buy-starry');
const btnEquipStarry = document.getElementById('btn-equip-starry');
const btnSellStarry = document.getElementById('btn-sell-starry');

// Poodle Elements
const poodleActionsBuy = document.getElementById('poodle-actions-buy');
const poodleActionsOwned = document.getElementById('poodle-actions-owned');
const btnBuyPoodle = document.getElementById('btn-buy-poodle');
const btnEquipPoodle = document.getElementById('btn-equip-poodle');
const btnSellPoodle = document.getElementById('btn-sell-poodle');

// --- Initialization ---
function init() {
  loadSettings();
  updateDisplay();
  setupEventListeners();
  applyColorsForMode(currentMode);
}

function loadSettings() {
  const saved = localStorage.getItem('doggy-pomodoro-settings');
  if (saved) {
    const parsed = JSON.parse(saved);
    Settings.pomodoro = parseInt(parsed.pomodoro) || 25;
    Settings.short = parseInt(parsed.short) || 5;
    Settings.long = parseInt(parsed.long) || 15;
    Settings.theme = parsed.theme || 'pastel';
    if (parsed.customColors) {
      Settings.customColors = parsed.customColors;
    }
    Settings.bones = parseInt(parsed.bones) || 0;
    Settings.unlockedBackgrounds = parsed.unlockedBackgrounds || ['default'];
    Settings.activeBackground = parsed.activeBackground || 'default';
    Settings.unlockedAvatars = parsed.unlockedAvatars || ['dachshund'];
    Settings.activeAvatar = parsed.activeAvatar || 'dachshund';
  }
  resetTimer();
  updateBonesDisplay();
  applyActiveBackground();
  applyActiveAvatar();
}

// --- Helper Functions ---
function getActiveColors(mode) {
  // If user has defined custom colors for this mode, use them.
  // Otherwise, fallback to the preset matching the currently saved theme.
  if (Settings.customColors[mode]) {
    return Settings.customColors[mode];
  }
  return ThemeMap[Settings.theme][mode];
}

// Helper to convert rgba to hex so the <input type="color"> can read it
function rgbaToHex(rgbaOrHex) {
  if (rgbaOrHex.startsWith('#')) return rgbaOrHex.slice(0, 7); // keep only 6 character hex
  const rgbaArray = rgbaOrHex.replace(/[^\d,]/g, '').split(',');
  if (rgbaArray.length < 3) return '#ffffff';

  const r = parseInt(rgbaArray[0]).toString(16).padStart(2, '0');
  const g = parseInt(rgbaArray[1]).toString(16).padStart(2, '0');
  const b = parseInt(rgbaArray[2]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// --- Timer Logic ---
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  const timeString = `${formattedMinutes}:${formattedSeconds}`;
  timerDisplay.textContent = timeString;
  document.title = `${timeString} - Doggy Pomodoro`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  btnStart.textContent = 'Pause';
  btnStart.classList.add('shadow-inner');
  btnStart.classList.remove('shadow-[0_8px_16px_rgba(0,0,0,0.06)]');

  avatarPulse.classList.add('animate-ping');
  avatarPulse.classList.remove('opacity-0');
  avatarPulse.classList.add('opacity-100');

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      completeTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  btnStart.textContent = 'Start';
  btnStart.classList.remove('shadow-inner');
  btnStart.classList.add('shadow-[0_8px_16px_rgba(0,0,0,0.06)]');

  avatarPulse.classList.remove('animate-ping');
  avatarPulse.classList.remove('opacity-100');
  avatarPulse.classList.add('opacity-0');
}

function completeTimer() {
  pauseTimer();
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play().catch(e => console.log('Audio play prevented by browser', e));

  // Reward bones for completing a Pomodoro
  if (currentMode === 'pomodoro') {
    Settings.bones += 50;
    updateBonesDisplay();
    saveSettingsInternal(); // Silent save
  }

  resetTimer();
}

function resetTimer() {
  pauseTimer();
  timeLeft = Settings[currentMode] * 60;
  updateDisplay();
}

function applyColorsForMode(modeName) {
  // Update data attribute logic on body for base theme text mapping (if using dark/light defaults)
  bodyBg.setAttribute('data-theme', Settings.theme);

  const colors = getActiveColors(modeName);

  // Apply colors to root CSS variables
  document.documentElement.style.setProperty('--theme-mode-bg', colors.bg);
  document.documentElement.style.setProperty('--glass-bg', colors.glass);
  // We apply the accent color to text, btnText, and hex generic usage
  document.documentElement.style.setProperty('--theme-mode-text', colors.text || colors.hex);
  document.documentElement.style.setProperty('--theme-mode-btn-text', colors.btnText || colors.hex);
  document.documentElement.style.setProperty('--theme-mode-hex', colors.hex);

  // Update Buttons UI active states
  modeBtns.forEach(btn => {
    btn.classList.remove('active-mode');
    if (btn.dataset.mode === modeName) {
      btn.classList.add('active-mode');
    }
  });
}

function switchMode(newMode) {
  currentMode = newMode;
  resetTimer();
  applyColorsForMode(currentMode);
}

// --- Settings Modal Logic ---
function openModal() {
  // Populate generic settings
  inputPomodoro.value = Settings.pomodoro;
  inputShort.value = Settings.short;
  inputLong.value = Settings.long;
  selectTheme.value = Settings.theme;

  settingsModeLabel.textContent = currentMode;

  // Populate Color Pickers based on what is active
  const activeColors = getActiveColors(currentMode);
  inputColorBg.value = rgbaToHex(activeColors.bg);
  inputColorGlass.value = rgbaToHex(activeColors.glass);
  inputColorAccent.value = rgbaToHex(activeColors.hex);

  modalBackdrop.classList.remove('pointer-events-none', 'opacity-0');
  settingsModal.classList.remove('scale-95', 'opacity-0');
  settingsModal.classList.add('scale-100', 'opacity-100');
}

function closeModal() {
  modalBackdrop.classList.add('pointer-events-none', 'opacity-0');
  settingsModal.classList.add('scale-95', 'opacity-0');
  settingsModal.classList.remove('scale-100', 'opacity-100');
}

function handlePresetThemeChange() {
  const selectedTheme = selectTheme.value;
  // If the user changes the preset theme selection, we clear out custom overrides for ALL modes 
  // so the whole app switches cleanly to the new presets.
  Settings.customColors.pomodoro = null;
  Settings.customColors.short = null;
  Settings.customColors.long = null;
  Settings.theme = selectedTheme;

  // Update the pickers visually based on the new preset for the current mode
  const presetColors = ThemeMap[selectedTheme][currentMode];
  inputColorBg.value = rgbaToHex(presetColors.bg);
  inputColorGlass.value = rgbaToHex(presetColors.glass);
  inputColorAccent.value = rgbaToHex(presetColors.hex);
}

function saveSettings() {
  const p = parseInt(inputPomodoro.value);
  const s = parseInt(inputShort.value);
  const l = parseInt(inputLong.value);
  const t = selectTheme.value;

  if (p > 0 && s > 0 && l > 0) {
    Settings.pomodoro = p;
    Settings.short = s;
    Settings.long = l;
    Settings.theme = t;

    // Check if the pickers differ from the Base Preset. 
    // If so, save them as custom colors for the CURRENT MODE ONLY.
    const preset = ThemeMap[t][currentMode];
    const pickedBg = inputColorBg.value;
    const pickedGlass = inputColorGlass.value;
    const pickedAccent = inputColorAccent.value;

    // We do a loose check. If the user interacted with the pickers, we save the custom map.
    Settings.customColors[currentMode] = {
      bg: pickedBg,
      glass: pickedGlass,
      hex: pickedAccent,
      text: pickedAccent, // Tie text color to the accent selected
      btnText: pickedAccent // Tie active button icon color to the accent selected
    };

    localStorage.setItem('doggy-pomodoro-settings', JSON.stringify({
      pomodoro: Settings.pomodoro,
      short: Settings.short,
      long: Settings.long,
      theme: Settings.theme,
      customColors: Settings.customColors,
      bones: Settings.bones,
      unlockedBackgrounds: Settings.unlockedBackgrounds,
      activeBackground: Settings.activeBackground,
      unlockedAvatars: Settings.unlockedAvatars,
      activeAvatar: Settings.activeAvatar
    }));

    resetTimer();
    applyColorsForMode(currentMode);
    closeModal();
  } else {
    alert("Please enter valid times greater than 0.");
  }
}

// Silent save for internal updates (like earning bones or equipping items)
function saveSettingsInternal() {
  localStorage.setItem('doggy-pomodoro-settings', JSON.stringify({
    pomodoro: Settings.pomodoro,
    short: Settings.short,
    long: Settings.long,
    theme: Settings.theme,
    customColors: Settings.customColors,
    bones: Settings.bones,
    unlockedBackgrounds: Settings.unlockedBackgrounds,
    activeBackground: Settings.activeBackground,
    unlockedAvatars: Settings.unlockedAvatars,
    activeAvatar: Settings.activeAvatar
  }));
}

// --- Store Logic ---
function updateBonesDisplay() {
  bonesBalanceTop.textContent = `${Settings.bones} 🦴`;
  bonesBalanceModal.textContent = Settings.bones;
  updateStoreUI();
}

function updateStoreUI() {
  const isUnlocked = Settings.unlockedBackgrounds.includes('starry');
  const isEquipped = Settings.activeBackground === 'starry';

  if (isUnlocked) {
    starryActionsBuy.classList.add('hidden');
    starryActionsBuy.classList.remove('block');
    starryActionsOwned.classList.remove('hidden');
    starryActionsOwned.classList.add('flex');

    if (isEquipped) {
      btnEquipStarry.textContent = 'Unequip';
      btnEquipStarry.classList.replace('bg-blue-600', 'bg-slate-600');
      btnEquipStarry.classList.replace('hover:bg-blue-700', 'hover:bg-slate-700');
    } else {
      btnEquipStarry.textContent = 'Equip';
      btnEquipStarry.classList.replace('bg-slate-600', 'bg-blue-600');
      btnEquipStarry.classList.replace('hover:bg-slate-700', 'hover:bg-blue-700');
    }
  } else {
    starryActionsBuy.classList.remove('hidden');
    starryActionsBuy.classList.add('block');
    starryActionsOwned.classList.add('hidden');
    starryActionsOwned.classList.remove('flex');

    // Disable buy if not enough bones
    if (Settings.bones < 100) {
      btnBuyStarry.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btnBuyStarry.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // --- Poodle Avatar Store UI Logic ---
  const isPoodleUnlocked = Settings.unlockedAvatars.includes('poodle');
  const isPoodleEquipped = Settings.activeAvatar === 'poodle';

  if (isPoodleUnlocked) {
    poodleActionsBuy.classList.add('hidden');
    poodleActionsBuy.classList.remove('block');
    poodleActionsOwned.classList.remove('hidden');
    poodleActionsOwned.classList.add('flex');

    if (isPoodleEquipped) {
      btnEquipPoodle.textContent = 'Unequip';
      btnEquipPoodle.classList.replace('bg-blue-600', 'bg-slate-600');
      btnEquipPoodle.classList.replace('hover:bg-blue-700', 'hover:bg-slate-700');
    } else {
      btnEquipPoodle.textContent = 'Equip';
      btnEquipPoodle.classList.replace('bg-slate-600', 'bg-blue-600');
      btnEquipPoodle.classList.replace('hover:bg-slate-700', 'hover:bg-blue-700');
    }
  } else {
    poodleActionsBuy.classList.remove('hidden');
    poodleActionsBuy.classList.add('block');
    poodleActionsOwned.classList.add('hidden');
    poodleActionsOwned.classList.remove('flex');

    // Disable buy if not enough bones (Poodle is 150)
    if (Settings.bones < 50) {
      btnBuyPoodle.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btnBuyPoodle.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

function handleBuyStarry() {
  if (Settings.bones >= 100 && !Settings.unlockedBackgrounds.includes('starry')) {
    Settings.bones -= 100;
    Settings.unlockedBackgrounds.push('starry');
    Settings.activeBackground = 'starry'; // auto equip
    saveSettingsInternal();
    updateBonesDisplay();
    applyActiveBackground();
  } else if (Settings.bones < 100) {
    // Visual shake or alert for lack of funds
    btnBuyStarry.classList.add('animate-pulse');
    setTimeout(() => btnBuyStarry.classList.remove('animate-pulse'), 500);
  }
}

function handleEquipToggleStarry() {
  if (Settings.activeBackground === 'starry') {
    // Unequip
    Settings.activeBackground = 'default';
  } else {
    // Equip
    Settings.activeBackground = 'starry';
  }
  saveSettingsInternal();
  updateStoreUI();
  applyActiveBackground();
}

function handleSellStarry() {
  if (Settings.unlockedBackgrounds.includes('starry')) {
    // Sell for half price (50 bones)
    Settings.bones += 50;
    Settings.unlockedBackgrounds = Settings.unlockedBackgrounds.filter(bg => bg !== 'starry');
    if (Settings.activeBackground === 'starry') {
      Settings.activeBackground = 'default';
    }
    saveSettingsInternal();
    updateBonesDisplay();
    applyActiveBackground();
  }
}

function applyActiveBackground() {
  if (Settings.activeBackground === 'starry') {
    document.body.classList.add('active-starry-night');
  } else {
    document.body.classList.remove('active-starry-night');
  }
}

// --- Poodle Logic ---
function handleBuyPoodle() {
  if (Settings.bones >= 50 && !Settings.unlockedAvatars.includes('poodle')) {
    Settings.bones -= 50;
    Settings.unlockedAvatars.push('poodle');
    Settings.activeAvatar = 'poodle'; // auto equip
    saveSettingsInternal();
    updateBonesDisplay();
    applyActiveAvatar();
  } else if (Settings.bones < 50) {
    // Visual shake or alert for lack of funds
    btnBuyPoodle.classList.add('animate-pulse');
    setTimeout(() => btnBuyPoodle.classList.remove('animate-pulse'), 500);
  }
}

function handleEquipTogglePoodle() {
  if (Settings.activeAvatar === 'poodle') {
    // Unequip (revert to dachshund)
    Settings.activeAvatar = 'dachshund';
  } else {
    // Equip
    Settings.activeAvatar = 'poodle';
  }
  saveSettingsInternal();
  updateStoreUI();
  applyActiveAvatar();
}

function handleSellPoodle() {
  if (Settings.unlockedAvatars.includes('poodle')) {
    // Sell for half price (75 bones)
    Settings.bones += 25;
    Settings.unlockedAvatars = Settings.unlockedAvatars.filter(av => av !== 'poodle');
    if (Settings.activeAvatar === 'poodle') {
      Settings.activeAvatar = 'dachshund';
    }
    saveSettingsInternal();
    updateBonesDisplay();
    applyActiveAvatar();
  }
}

function applyActiveAvatar() {
  if (Settings.activeAvatar === 'poodle') {
    doggyAvatar.src = './poodle.png';
  } else {
    doggyAvatar.src = './dachshund.png';
  }
}

function openStore() {
  storeModalBackdrop.classList.remove('pointer-events-none', 'opacity-0');
  storeModal.classList.remove('scale-95', 'opacity-0');
  storeModal.classList.add('scale-100', 'opacity-100');
  updateBonesDisplay();
}

function closeStore() {
  storeModalBackdrop.classList.add('pointer-events-none', 'opacity-0');
  storeModal.classList.add('scale-95', 'opacity-0');
  storeModal.classList.remove('scale-100', 'opacity-100');
}

// --- Event Listeners ---
function setupEventListeners() {
  btnStart.addEventListener('click', () => {
    if (isRunning) pauseTimer();
    else startTimer();
  });

  btnReset.addEventListener('click', resetTimer);

  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => switchMode(e.target.dataset.mode));
  });

  btnSettings.addEventListener('click', () => {
    pauseTimer();
    openModal();
  });

  btnCloseSettings.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  selectTheme.addEventListener('change', handlePresetThemeChange);
  btnSaveSettings.addEventListener('click', saveSettings);

  // Store Event Listeners
  btnStore.addEventListener('click', () => {
    pauseTimer();
    openStore();
  });
  btnCloseStore.addEventListener('click', closeStore);
  storeModalBackdrop.addEventListener('click', (e) => {
    if (e.target === storeModalBackdrop) closeStore();
  });
  btnBuyStarry.addEventListener('click', handleBuyStarry);
  btnEquipStarry.addEventListener('click', handleEquipToggleStarry);
  btnSellStarry.addEventListener('click', handleSellStarry);

  btnBuyPoodle.addEventListener('click', handleBuyPoodle);
  btnEquipPoodle.addEventListener('click', handleEquipTogglePoodle);
  btnSellPoodle.addEventListener('click', handleSellPoodle);
}

// Run app
init();
