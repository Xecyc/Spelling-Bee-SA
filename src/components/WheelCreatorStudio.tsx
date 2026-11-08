import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sliders,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Shuffle,
  ArrowDownAZ,
  Image as ImageIcon,
  Plus,
  X,
  Trophy,
  List,
  Scale,
  Crown,
  Volume2,
  VolumeX,
  Play,
  Trash2,
  Check,
  Disc,
  RotateCcw,
  Palette,
  FilePlus,
  FileText,
  Sparkles,
  ChevronDown,
  Wrench,
  Dices,
  Timer,
  RefreshCw,
  AlertTriangle,
  Layers,
  Smartphone,
} from 'lucide-react';
import {
  WheelConfig,
  WheelSlice,
  WheelRole,
  SoundSettings,
} from '../types/presentation';
import { MAX_SLICES } from '../utils/defaultData';

/***************************************************************************
 * 1. CURATED COLOR PALETTES & PRESETS
 ***************************************************************************/
export const COLOR_PALETTES: Record<string, { name: string; colors: string[] }> = {
  classic: {
    name: 'Classic Primary',
    colors: ['#3369e8', '#d50f25', '#eeb211', '#009925', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
  },
  cyberpunk: {
    name: 'Neon Cyber',
    colors: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0', '#06d6a0', '#ffd166', '#ef476f'],
  },
  pastel: {
    name: 'Pastel Candy',
    colors: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'],
  },
  sunset: {
    name: 'Sunset Warmth',
    colors: ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#577590'],
  },
  ocean: {
    name: 'Ocean Breeze',
    colors: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#ade8f4'],
  },
  monochrome: {
    name: 'Sleek Slate',
    colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#3b82f6', '#6366f1'],
  },
};

interface ResultEntry {
  id: string;
  entryId: string;
  text: string;
  color: string;
  image?: string | null;
  time: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  gravity: number;
  drag: number;
}

interface WheelCreatorStudioProps {
  wheels: WheelConfig[];
  activeWheelId: string;
  onSelectWheel: (wheelId: string) => void;
  onUpdateWheel: (updated: WheelConfig) => void;
  onCreateWheel: (role: WheelRole, name: string) => void;
  onDeleteWheel?: (wheelId: string) => void;
  onReturnToDeck: () => void;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  onOpenDocumentAnalyzer?: () => void;
  // Dev & Testing tools
  onRevertAllWheels?: () => void;
  onRemoveAllWheels?: () => void;
  onRandomizeWheels?: () => void;
  onReplaceAllWheels?: (newWheels: WheelConfig[]) => void;
  onTriggerTestCelebration?: (word?: string) => void;
  onResetCloudStorage?: () => void;
}

export const WheelCreatorStudio: React.FC<WheelCreatorStudioProps> = ({
  wheels,
  activeWheelId,
  onSelectWheel,
  onUpdateWheel,
  onCreateWheel,
  onDeleteWheel,
  onReturnToDeck,
  isSpinning: parentIsSpinning,
  onSpinStart: parentOnSpinStart,
  onSpinEnd: parentOnSpinEnd,
  soundSettings,
  onUpdateSoundSettings,
  onOpenDocumentAnalyzer,
  onRevertAllWheels,
  onRemoveAllWheels,
  onRandomizeWheels,
  onReplaceAllWheels,
  onTriggerTestCelebration,
  onResetCloudStorage,
}) => {
  const currentWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0];

  // UI Tabs & Views
  const [activeSidebarTab, setActiveSidebarTab] = useState<'entries' | 'results'>('entries');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  // Modals state
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizeTab, setCustomizeTab] = useState<'spin' | 'after' | 'appearance'>('spin');
  const [showTitleEditorModal, setShowTitleEditorModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wheelToDelete, setWheelToDelete] = useState<WheelConfig | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winningSlice, setWinningSlice] = useState<WheelSlice | null>(null);
  const [showWheelsMenu, setShowWheelsMenu] = useState(false);

  // Title modal inputs
  const [titleDraft, setTitleDraft] = useState(currentWheel.name);
  const [subtitleDraft, setSubtitleDraft] = useState(
    currentWheel.subtitle || 'Click the wheel or press Ctrl+Enter to spin!'
  );

  // History & Removed entries
  const [resultsHistory, setResultsHistory] = useState<ResultEntry[]>([]);
  const [removedEntries, setRemovedEntries] = useState<WheelSlice[]>([]);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  const targetWheelToDelete = wheelToDelete || currentWheel;

  const handleConfirmDeleteWheel = () => {
    if (wheels.length <= 1) {
      showToast('Cannot remove the only remaining wheel.');
      setShowDeleteModal(false);
      return;
    }
    const idToDelete = targetWheelToDelete.id;
    if (onDeleteWheel) {
      onDeleteWheel(idToDelete);
      showToast(`Removed "${targetWheelToDelete.name}"`);
    }
    setShowDeleteModal(false);
    setWheelToDelete(null);
  };

  // Dev & Testing Tools state (Studio View Only)
  const [showDevToolsMenu, setShowDevToolsMenu] = useState(false);
  const [devActionConfirm, setDevActionConfirm] = useState<{
    type: 'remove_all' | 'revert_all' | 'clear_storage';
    title: string;
    message: string;
  } | null>(null);
  const devToolsDropdownRef = useRef<HTMLDivElement | null>(null);
  const importAllBackupInputRef = useRef<HTMLInputElement | null>(null);

  // Close dev tools dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        devToolsDropdownRef.current &&
        !devToolsDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDevToolsMenu(false);
      }
    };
    if (showDevToolsMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showDevToolsMenu]);

  // Dev actions
  const handleTriggerRemoveAll = () => {
    setShowDevToolsMenu(false);
    setDevActionConfirm({
      type: 'remove_all',
      title: 'Remove All Wheels?',
      message: 'This will clear all current wheels and leave 1 fresh starter wheel for testing.',
    });
  };

  const handleTriggerRevertAll = () => {
    setShowDevToolsMenu(false);
    setDevActionConfirm({
      type: 'revert_all',
      title: 'Revert All Wheels?',
      message: 'This will restore all 10 official factory wheels (1st-3rd, 4th-6th & High School General & Tiebreak) with original words and timer durations.',
    });
  };

  const handleTriggerRandomizeAll = () => {
    setShowDevToolsMenu(false);
    if (onRandomizeWheels) {
      onRandomizeWheels();
      showToast('All wheels randomized with fresh colors & shuffled slices!');
    }
  };

  const handleShuffleCurrent = () => {
    setShowDevToolsMenu(false);
    const shuffled = [...currentWheel.slices].sort(() => Math.random() - 0.5);
    onUpdateWheel({ ...currentWheel, slices: shuffled });
    showToast(`Shuffled ${shuffled.length} words on "${currentWheel.name}"`);
  };

  const SAMPLE_COMPETITION_WORDS = [
    'ASTRONOMY', 'BRILLIANT', 'CAROUSEL', 'DICTIONARY', 'ELEPHANT',
    'FLOURISH', 'GALAXY', 'HARMONIOUS', 'ILLUMINATE', 'JOURNEY',
    'KALEIDOSCOPE', 'LABYRINTH', 'MAGNIFICENT', 'NAVIGATOR', 'ORCHESTRA',
    'PERSISTENCE', 'QUANTUM', 'REVOLUTION', 'SYMPHONY', 'TELESCOPE',
  ];

  const handlePopulateDemoWords = () => {
    setShowDevToolsMenu(false);
    const newSlices: WheelSlice[] = SAMPLE_COMPETITION_WORDS.map((w, idx) => ({
      id: `slice-demo-${Date.now()}-${idx}`,
      text: w,
      color: COLOR_PALETTES.classic.colors[idx % COLOR_PALETTES.classic.colors.length],
      weight: 1,
      enabled: true,
    }));
    onUpdateWheel({ ...currentWheel, slices: newSlices });
    showToast(`Populated 20 competition words in "${currentWheel.name}"`);
  };

  const handleStressTest50 = () => {
    setShowDevToolsMenu(false);
    const stressWords = [
      'ASTRONAUT', 'BEAUTIFUL', 'CHAMPION', 'DELIGHT', 'ENERGY', 'FESTIVAL', 'GENIUS', 'HORIZON',
      'ISLAND', 'JUBILEE', 'KINGDOM', 'LEOPARD', 'MIRACLE', 'NOSTALGIA', 'OLYMPIC', 'PHANTOM',
      'QUARTZ', 'RAINBOW', 'SAPPHIRE', 'TRIUMPH', 'UNIVERSE', 'VICTORY', 'WONDER', 'XYLOPHONE',
      'YOUTH', 'ZEPHYR', 'ADVENTURE', 'BRILLIANCE', 'CELEBRATE', 'DISCOVERY', 'EMERALD', 'FREEDOM',
      'GRATITUDE', 'HONOR', 'INVENTOR', 'JUSTICE', 'KINDNESS', 'LIGHTNING', 'MAJESTY', 'NATURE',
      'OPTIMISM', 'PASSION', 'QUEST', 'RADIANT', 'STRENGTH', 'TREASURE', 'ULTIMATE', 'VALOR',
      'WISDOM', 'ZENITH',
    ];
    const newSlices: WheelSlice[] = stressWords.slice(0, MAX_SLICES).map((w, idx) => ({
      id: `slice-stress-${Date.now()}-${idx}`,
      text: w,
      color: COLOR_PALETTES.cyberpunk.colors[idx % COLOR_PALETTES.cyberpunk.colors.length],
      weight: 1,
      enabled: true,
    }));
    onUpdateWheel({ ...currentWheel, slices: newSlices });
    showToast(`Loaded ${newSlices.length} slices (Maximum Density Stress-Test)`);
  };

  const handleTestCelebration = () => {
    setShowDevToolsMenu(false);
    if (onTriggerTestCelebration) {
      onTriggerTestCelebration();
    } else {
      setWinningSlice(currentWheel.slices[0] || { id: 'test-1', text: 'CHAMPION', color: '#FBBF24' });
      setShowWinnerModal(true);
    }
  };

  const handleExportAllWheelsBackup = () => {
    setShowDevToolsMenu(false);
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: 'salto-angel-spelling-bee-2026-v4',
        totalWheels: wheels.length,
        wheels,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spelling_bee_all_wheels_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported all ${wheels.length} wheels to JSON backup`);
    } catch {
      showToast('Failed to export wheels backup.');
    }
  };

  const handleImportAllWheelsBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedList = Array.isArray(parsed) ? parsed : parsed.wheels;
        if (Array.isArray(importedList) && importedList.length > 0 && onReplaceAllWheels) {
          onReplaceAllWheels(importedList);
          showToast(`Successfully restored ${importedList.length} wheels from backup!`);
        } else {
          showToast('Invalid backup file structure.');
        }
      } catch {
        showToast('Could not read or parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTriggerClearStorage = () => {
    setShowDevToolsMenu(false);
    setDevActionConfirm({
      type: 'clear_storage',
      title: 'Reset Server Sync & Storage?',
      message: 'This will reset all server data and local cache back to clean factory state.',
    });
  };

  const handleConfirmDevAction = () => {
    if (!devActionConfirm) return;
    if (devActionConfirm.type === 'remove_all') {
      if (onRemoveAllWheels) {
        onRemoveAllWheels();
        showToast('All wheels removed. Starter wheel created.');
      }
    } else if (devActionConfirm.type === 'revert_all') {
      if (onRevertAllWheels) {
        onRevertAllWheels();
        showToast('Reverted all wheels to factory defaults (14 official wheels).');
      }
    } else if (devActionConfirm.type === 'clear_storage') {
      if (onResetCloudStorage) {
        onResetCloudStorage();
        showToast('Server sync and storage reset to factory default.');
      }
    }
    setDevActionConfirm(null);
  };

  // Settings for current wheel with fallbacks
  const spinDuration = currentWheel.spinDuration ?? 8;
  const timerDuration = currentWheel.timerDuration ?? 40;
  const tickSoundProfile = currentWheel.tickSound ?? soundSettings.tickSound ?? 'classic';
  const winSoundProfile = currentWheel.winSound ?? 'none'; // Default 'none' to respect previous user request, customizable
  const volume = Math.round(soundSettings.volume * 100);
  const idleSpin = currentWheel.idleSpin ?? true;
  const confettiEnabled = currentWheel.confetti ?? true;
  const showPopup = currentWheel.showPopup ?? true;
  const winnerMessage = currentWheel.winnerMessage || 'We have a winner!';
  const autoRemove = currentWheel.autoRemove ?? false;
  const maxVisibleSlices = currentWheel.maxVisibleSlices ?? 200;
  const hubRadiusRatio = currentWheel.hubRadiusRatio ?? 0.16;
  const sliceBorders = currentWheel.sliceBorders ?? true;
  const wheelShadow = currentWheel.wheelShadow ?? true;
  const paletteKey = currentWheel.paletteKey ?? 'classic';

  // Local draft timer input so typing '4' or clearing doesn't jump
  const [timerDurationInput, setTimerDurationInput] = useState(String(timerDuration));
  useEffect(() => {
    setTimerDurationInput(String(timerDuration));
  }, [timerDuration, currentWheel.id]);

  const handleTimerInputChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setTimerDurationInput(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateWheel({
        ...currentWheel,
        timerDuration: Math.min(600, parsed),
      });
    }
  };

  const handleTimerInputBlur = () => {
    const parsed = parseInt(timerDurationInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setTimerDurationInput('40');
      onUpdateWheel({ ...currentWheel, timerDuration: 40 });
    } else {
      const clamped = Math.max(1, Math.min(600, parsed));
      setTimerDurationInput(String(clamped));
      onUpdateWheel({ ...currentWheel, timerDuration: clamped });
    }
  };

  // Plain textarea bulk string
  const [textareaValue, setTextareaValue] = useState(() =>
    currentWheel.slices.map((s) => s.text).join('\n')
  );

  useEffect(() => {
    setTextareaValue(currentWheel.slices.map((s) => s.text).join('\n'));
    setTitleDraft(currentWheel.name);
    setSubtitleDraft(currentWheel.subtitle || 'Click the wheel or press Ctrl+Enter to spin!');
  }, [currentWheel.id, currentWheel.slices, currentWheel.name, currentWheel.subtitle]);

  // Audio synthesizer context
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const playTickSound = useCallback(() => {
    if (tickSoundProfile === 'none' || !soundSettings.enabled || soundSettings.volume <= 0.01) return;
    try {
      ensureAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vol = soundSettings.volume;

      if (tickSoundProfile === 'classic') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.032);
        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (tickSoundProfile === 'wood') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (tickSoundProfile === 'casino') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.025);
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.028);
      } else if (tickSoundProfile === 'retro') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(vol * 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.032);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [tickSoundProfile, soundSettings.enabled, soundSettings.volume, ensureAudioContext]);

  const playWinnerFanfare = useCallback(() => {
    if (winSoundProfile === 'none' || !soundSettings.enabled || soundSettings.volume <= 0.01) return;
    try {
      ensureAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = soundSettings.volume;

      if (winSoundProfile === 'fanfare') {
        const notes = [
          { freq: 523.25, delay: 0, dur: 0.14 },
          { freq: 659.25, delay: 0.12, dur: 0.14 },
          { freq: 783.99, delay: 0.24, dur: 0.14 },
          { freq: 1046.5, delay: 0.36, dur: 0.55 },
        ];
        notes.forEach((n) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, now + n.delay);
          gain.gain.setValueAtTime(0.001, now + n.delay);
          gain.gain.linearRampToValueAtTime(vol * 0.4, now + n.delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + n.delay + n.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + n.delay);
          osc.stop(now + n.delay + n.dur + 0.02);
        });
      } else if (winSoundProfile === 'bell') {
        const freqs = [587.33, 880, 1174.66, 1760];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(vol * (0.3 / (idx + 1)), now);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.15);
        });
      } else if (winSoundProfile === 'applause') {
        const bufferSize = ctx.sampleRate * 0.7;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start(now);
        whiteNoise.stop(now + 0.7);
      }
    } catch {
      // Ignore audio error
    }
  }, [winSoundProfile, soundSettings.enabled, soundSettings.volume, ensureAudioContext]);

  // Hidden File Inputs
  const entryImageInputRef = useRef<HTMLInputElement | null>(null);
  const centerImageInputRef = useRef<HTMLInputElement | null>(null);
  const importJsonInputRef = useRef<HTMLInputElement | null>(null);

  // Wheel Physics Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelAngleRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);
  const spinStartTimeRef = useRef<number>(0);
  const spinStartAngleRef = useRef<number>(0);
  const spinTotalDeltaRef = useRef<number>(0);
  const pointerDeflectionRef = useRef<number>(0);
  const pointerVelocityRef = useRef<number>(0);
  const previousSliceIdRef = useRef<string | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Live pointer state
  const [livePointerSlice, setLivePointerSlice] = useState<{ text: string; color: string } | null>(null);

  // Confetti overlay system
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiParticlesRef = useRef<ConfettiParticle[]>([]);
  const confettiRunningRef = useRef<boolean>(false);

  const launchConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors =
      COLOR_PALETTES[paletteKey]?.colors || COLOR_PALETTES.classic.colors;

    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI + Math.PI;
      const speed = 6 + Math.random() * 14;
      confettiParticlesRef.current.push({
        x: canvas.width * (0.25 + Math.random() * 0.5),
        y: canvas.height * 0.65,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.abs(Math.sin(angle) * speed) - 4,
        size: 6 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.26 + Math.random() * 0.1,
        drag: 0.985,
      });
    }

    if (!confettiRunningRef.current) {
      confettiRunningRef.current = true;
      const updateConfetti = () => {
        const cCtx = canvas.getContext('2d');
        if (!cCtx) return;
        cCtx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = confettiParticlesRef.current.length - 1; i >= 0; i--) {
          const p = confettiParticlesRef.current[i];
          p.vx *= p.drag;
          p.vy = p.vy * p.drag + p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;

          if (p.y > canvas.height + 30) {
            confettiParticlesRef.current.splice(i, 1);
            continue;
          }

          cCtx.save();
          cCtx.translate(p.x, p.y);
          cCtx.rotate((p.rotation * Math.PI) / 180);
          cCtx.fillStyle = p.color;
          cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          cCtx.restore();
        }

        if (confettiParticlesRef.current.length > 0) {
          requestAnimationFrame(updateConfetti);
        } else {
          confettiRunningRef.current = false;
          cCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
      requestAnimationFrame(updateConfetti);
    }
  }, [paletteKey]);

  // Image cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const centerHubImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (currentWheel.centerImageSrc) {
      const img = new Image();
      img.onload = () => {
        centerHubImgRef.current = img;
      };
      img.src = currentWheel.centerImageSrc;
    } else {
      centerHubImgRef.current = null;
    }
  }, [currentWheel.centerImageSrc]);

  // Active enabled entries
  const activeEntries = React.useMemo(() => {
    const enabled = currentWheel.slices.filter(
      (s) => (s.enabled ?? true) && (s.text.trim() !== '' || s.image)
    );
    return enabled.slice(0, maxVisibleSlices);
  }, [currentWheel.slices, maxVisibleSlices]);

  // Slices with computed angles
  const computedSlices = React.useMemo(() => {
    const list =
      activeEntries.length > 0
        ? activeEntries
        : [
            { id: 'ph-1', text: 'Add words', color: '#60A5FA', weight: 1 },
            { id: 'ph-2', text: 'in panel', color: '#FBBF24', weight: 1 },
            { id: 'ph-3', text: 'to spin!', color: '#34D399', weight: 1 },
          ];

    const totalWeight = list.reduce((acc, s) => acc + (s.weight || 1), 0);
    const palette =
      COLOR_PALETTES[paletteKey]?.colors || COLOR_PALETTES.classic.colors;

    let currentAngle = 0;
    return list.map((slice, idx) => {
      const weight = slice.weight || 1;
      const arc = (weight / totalWeight) * (Math.PI * 2);
      const color = slice.color || palette[idx % palette.length];
      const res = {
        slice,
        index: idx,
        startAngle: currentAngle,
        endAngle: currentAngle + arc,
        arcAngle: arc,
        color,
      };
      currentAngle += arc;
      return res;
    });
  }, [activeEntries, paletteKey]);

  // Luminance calculation
  const getLuminance = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6) return 0.5;
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  // Slices under pointer (right pointer at 0 radians)
  const getSliceAtPointer = useCallback(
    (angle: number) => {
      if (!computedSlices.length) return null;
      const twoPi = Math.PI * 2;
      const pointerRel = (twoPi - (angle % twoPi)) % twoPi;
      for (let i = 0; i < computedSlices.length; i++) {
        if (pointerRel >= computedSlices[i].startAngle && pointerRel < computedSlices[i].endAngle) {
          return computedSlices[i];
        }
      }
      return computedSlices[computedSlices.length - 1];
    },
    [computedSlices]
  );

  // Draw wheel frame
  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) - 24;

      // Outer glow / shadow
      if (wheelShadow) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius + 3, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(15, 23, 42, 0.4)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.restore();
      }

      // Draw slices
      computedSlices.forEach((cs) => {
        const start = angle + cs.startAngle;
        const end = angle + cs.endAngle;
        const mid = start + cs.arcAngle / 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, start, end);
        ctx.closePath();
        ctx.fillStyle = cs.color;
        ctx.fill();

        if (sliceBorders && computedSlices.length > 1) {
          ctx.lineWidth = computedSlices.length > 40 ? 0.8 : 1.5;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.stroke();
        }

        // Slice Image
        if (cs.slice.image) {
          let img = imageCacheRef.current.get(cs.slice.image);
          if (!img) {
            img = new Image();
            img.src = cs.slice.image;
            imageCacheRef.current.set(cs.slice.image, img);
          }
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(mid);
            const imgDist = maxRadius * 0.58;
            const imgSize = Math.min(maxRadius * 0.22, Math.max(16, cs.arcAngle * maxRadius * 0.45));
            ctx.beginPath();
            ctx.arc(imgDist, 0, imgSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, imgDist - imgSize / 2, -imgSize / 2, imgSize, imgSize);
            ctx.restore();
          }
        }

        // Slice Text Label
        const label = (cs.slice.text || '').trim();
        if (label) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(mid);

          const lum = getLuminance(cs.color);
          ctx.fillStyle = lum > 0.58 ? '#0f172a' : '#ffffff';

          const hubR = maxRadius * hubRadiusRatio;
          const outerPad = 16;
          const innerPad = hubR + (cs.slice.image ? maxRadius * 0.3 : 14);
          const availWidth = Math.max(25, maxRadius - outerPad - innerPad);

          const chord = 2 * (maxRadius * 0.72) * Math.sin(Math.min(Math.PI / 2, cs.arcAngle / 2));
          let fontSize = Math.min(20, chord * 0.52, maxRadius * 0.08);
          fontSize = Math.max(8.5, fontSize);

          ctx.font = `700 ${fontSize}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';

          let displayStr = label;
          if (ctx.measureText(displayStr).width > availWidth) {
            while (displayStr.length > 1 && ctx.measureText(displayStr + '…').width > availWidth) {
              displayStr = displayStr.slice(0, -1);
            }
            displayStr += '…';
          }

          if (lum <= 0.58) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 3;
          }

          ctx.fillText(displayStr, maxRadius - outerPad, 0);
          ctx.restore();
        }
      });

      // Outer metallic rim ring & peg studs
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      if (computedSlices.length <= 60 && computedSlices.length > 1) {
        computedSlices.forEach((cs) => {
          const a = angle + cs.startAngle;
          const px = centerX + Math.cos(a) * maxRadius;
          const py = centerY + Math.sin(a) * maxRadius;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#f8fafc';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#334155';
          ctx.stroke();
        });
      }
      ctx.restore();

      // Center Hub Cap
      const hubR = maxRadius * hubRadiusRatio;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, hubR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      if (centerHubImgRef.current && centerHubImgRef.current.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, hubR - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(centerHubImgRef.current, centerX - hubR, centerY - hubR, hubR * 2, hubR * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = '#4f46e5';
        ctx.font = `800 ${Math.max(10, Math.round(hubR * 0.38))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isSpinningRef.current ? '•••' : 'SPIN', centerX, centerY);
      }
      ctx.restore();

      // Draw Right-Edge Pointer Flapper (at 0 radians / 3 o'clock)
      const pivotX = centerX + maxRadius + 12;
      const pivotY = centerY;
      const pLen = 30;
      const pHalf = 12;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(pointerDeflectionRef.current);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.moveTo(-pLen, 0);
      ctx.lineTo(4, -pHalf);
      ctx.arc(4, 0, pHalf, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-pLen, -pHalf, 10, pHalf);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#be123c');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(4, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // Live slice indicator & sound tick
      const cur = getSliceAtPointer(angle);
      if (cur) {
        setLivePointerSlice({ text: cur.slice.text, color: cur.color });
        if (previousSliceIdRef.current !== null && previousSliceIdRef.current !== cur.slice.id) {
          if (isSpinningRef.current) {
            playTickSound();
            pointerDeflectionRef.current = -0.42;
          }
        }
        previousSliceIdRef.current = cur.slice.id;
      }

      ctx.restore();
    },
    [
      wheelShadow,
      computedSlices,
      sliceBorders,
      hubRadiusRatio,
      getSliceAtPointer,
      playTickSound,
    ]
  );

  // Spin lifecycle function
  const triggerSpin = useCallback(() => {
    if (isSpinningRef.current || parentIsSpinning) return;
    if (activeEntries.length === 0) {
      showToast('Please add at least 1 entry to spin!');
      return;
    }

    ensureAudioContext();
    setShowWinnerModal(false);
    parentOnSpinStart();

    isSpinningRef.current = true;
    spinStartTimeRef.current = performance.now();
    spinStartAngleRef.current = wheelAngleRef.current;

    const durSec = Math.max(1, Math.min(30, spinDuration));
    const minSpins = Math.max(4, Math.floor(durSec * 1.3));
    const extraSpins = Math.random() * 4;
    const randomRadian = Math.random() * Math.PI * 2;
    spinTotalDeltaRef.current = (minSpins + extraSpins) * Math.PI * 2 + randomRadian;
  }, [
    parentIsSpinning,
    activeEntries.length,
    ensureAudioContext,
    parentOnSpinStart,
    spinDuration,
    showToast,
  ]);

  // Main animation frame loop
  useEffect(() => {
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 4.2);

    const loop = (now: number) => {
      // Flapper spring physics
      if (
        Math.abs(pointerDeflectionRef.current) > 0.001 ||
        Math.abs(pointerVelocityRef.current) > 0.001
      ) {
        const springK = 0.28;
        const damping = 0.72;
        const force = -springK * pointerDeflectionRef.current;
        pointerVelocityRef.current = (pointerVelocityRef.current + force) * damping;
        pointerDeflectionRef.current += pointerVelocityRef.current;
      } else {
        pointerDeflectionRef.current = 0;
      }

      if (isSpinningRef.current) {
        const durationMs = spinDuration * 1000;
        const elapsed = now - spinStartTimeRef.current;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutQuint(progress);

        wheelAngleRef.current = spinStartAngleRef.current + spinTotalDeltaRef.current * eased;

        if (progress >= 1) {
          isSpinningRef.current = false;
          wheelAngleRef.current = wheelAngleRef.current % (Math.PI * 2);

          const cur = getSliceAtPointer(wheelAngleRef.current);
          if (cur) {
            setWinningSlice(cur.slice);
            const nowTime = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            setResultsHistory((prev) => [
              {
                id: `res-${Date.now()}`,
                entryId: cur.slice.id,
                text: cur.slice.text,
                color: cur.color,
                image: cur.slice.image,
                time: nowTime,
              },
              ...prev,
            ]);

            playWinnerFanfare();
            if (confettiEnabled) {
              launchConfetti();
            }

            if (showPopup) {
              setShowWinnerModal(true);
            }

            parentOnSpinEnd(cur.slice);
          }
        }
      } else if (idleSpin) {
        wheelAngleRef.current = (wheelAngleRef.current + 0.0022) % (Math.PI * 2);
      }

      drawWheel(wheelAngleRef.current);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    spinDuration,
    idleSpin,
    confettiEnabled,
    showPopup,
    getSliceAtPointer,
    drawWheel,
    playWinnerFanfare,
    launchConfetti,
    parentOnSpinEnd,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerSpin();
      } else if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        triggerSpin();
      } else if (e.key === 'Escape') {
        setShowCustomizeModal(false);
        setShowTitleEditorModal(false);
        setShowResetModal(false);
        setShowWinnerModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSpin]);

  // Textarea input sync
  const handleTextareaChange = (raw: string) => {
    setTextareaValue(raw);
    const lines = raw.split('\n');
    const updatedSlices: WheelSlice[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (i < currentWheel.slices.length) {
        updatedSlices.push({
          ...currentWheel.slices[i],
          text: lineText,
        });
      } else {
        const pal =
          COLOR_PALETTES[paletteKey]?.colors || COLOR_PALETTES.classic.colors;
        updatedSlices.push({
          id: `slice-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          text: lineText,
          color: pal[i % pal.length],
          weight: 1,
          enabled: true,
        });
      }
    }

    onUpdateWheel({
      ...currentWheel,
      slices: updatedSlices,
    });
  };

  // Add new slice
  const handleAddSlice = () => {
    if (currentWheel.slices.length >= MAX_SLICES) return;
    const pal = COLOR_PALETTES[paletteKey]?.colors || COLOR_PALETTES.classic.colors;
    const newSlice: WheelSlice = {
      id: `slice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: `Option ${currentWheel.slices.length + 1}`,
      color: pal[currentWheel.slices.length % pal.length],
      weight: 1,
      enabled: true,
    };
    onUpdateWheel({
      ...currentWheel,
      slices: [...currentWheel.slices, newSlice],
    });
  };

  // Delete slice
  const handleDeleteSlice = (id: string) => {
    if (currentWheel.slices.length <= 2) {
      showToast('A wheel needs at least 2 entries');
      return;
    }
    onUpdateWheel({
      ...currentWheel,
      slices: currentWheel.slices.filter((s) => s.id !== id),
    });
  };

  // Shuffle slices
  const handleShuffle = () => {
    const nonBlank = currentWheel.slices.filter((s) => s.text.trim() !== '' || s.image);
    for (let i = nonBlank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonBlank[i], nonBlank[j]] = [nonBlank[j], nonBlank[i]];
    }
    onUpdateWheel({
      ...currentWheel,
      slices: nonBlank,
    });
    showToast('Entries shuffled!');
  };

  // Sort slices A-Z
  const handleSortAZ = () => {
    const nonBlank = [...currentWheel.slices].filter((s) => s.text.trim() !== '' || s.image);
    nonBlank.sort((a, b) => a.text.localeCompare(b.text, undefined, { numeric: true }));
    onUpdateWheel({
      ...currentWheel,
      slices: nonBlank,
    });
    showToast('Entries sorted A–Z!');
  };

  // Remove winner from wheel
  const handleRemoveWinningWord = () => {
    if (!winningSlice) return;
    const idx = currentWheel.slices.findIndex((s) => s.id === winningSlice.id);
    if (idx !== -1) {
      const removed = currentWheel.slices[idx];
      setRemovedEntries((prev) => [...prev, removed]);
      onUpdateWheel({
        ...currentWheel,
        slices: currentWheel.slices.filter((s) => s.id !== winningSlice.id),
      });
      showToast(`Removed "${winningSlice.text}" from wheel`);
    }
    setShowWinnerModal(false);
  };

  // Restore removed entries
  const handleRestoreRemoved = () => {
    if (removedEntries.length === 0) {
      showToast('No removed entries to restore');
      return;
    }
    onUpdateWheel({
      ...currentWheel,
      slices: [...currentWheel.slices, ...removedEntries],
    });
    showToast(`Restored ${removedEntries.length} removed entries!`);
    setRemovedEntries([]);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(currentWheel, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = currentWheel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `${safeName}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Wheel configuration exported!');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.slices)) {
          onUpdateWheel({
            ...currentWheel,
            ...parsed,
          });
          showToast('Wheel configuration imported!');
        } else {
          showToast('Invalid wheel JSON format');
        }
      } catch {
        showToast('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Slice Image
  const handleAddSliceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').substring(0, 20);
      const pal = COLOR_PALETTES[paletteKey]?.colors || COLOR_PALETTES.classic.colors;
      const newSlice: WheelSlice = {
        id: `slice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: cleanName || 'Image Slice',
        color: pal[currentWheel.slices.length % pal.length],
        weight: 1,
        enabled: true,
        image: dataUrl,
      };
      onUpdateWheel({
        ...currentWheel,
        slices: [...currentWheel.slices, newSlice],
      });
      setIsAdvancedMode(true);
      showToast('Image slice added!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Center hub image upload
  const handleCenterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      onUpdateWheel({
        ...currentWheel,
        centerImageSrc: dataUrl,
      });
      showToast('Center hub image updated!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Dark/Light theme toggle
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Save Title Modal
  const handleSaveTitleModal = () => {
    onUpdateWheel({
      ...currentWheel,
      name: titleDraft.trim() || 'Wheel of Names',
      subtitle: subtitleDraft.trim() || 'Click the wheel or press Ctrl+Enter to spin!',
    });
    setShowTitleEditorModal(false);
    showToast('Wheel title updated!');
  };

  // Presets
  const applyPreset = (key: 'lunch' | 'classroom' | 'weighted' | 'yesno') => {
    if (key === 'lunch') {
      const items = [
        '🍕 Woodfired Pizza',
        '🍣 Sushi & Ramen',
        '🌮 Street Tacos',
        '🍔 Smash Burgers',
        '🥗 Mediterranean Bowls',
        '🍜 Thai Curry',
        '🥪 Artisanal Sandwiches',
        '🥟 Korean BBQ',
      ];
      const pal = COLOR_PALETTES.classic.colors;
      onUpdateWheel({
        ...currentWheel,
        name: 'Team Lunch Decision Wheel',
        slices: items.map((text, i) => ({
          id: `slice-${Date.now()}-${i}`,
          text,
          color: pal[i % pal.length],
          weight: 1,
          enabled: true,
        })),
      });
      setIsAdvancedMode(false);
    } else if (key === 'classroom') {
      const names = [
        'Alex Rivera',
        'Brianna Chen',
        'Carlos Mendez',
        'Diana Prince',
        'Ethan Hunt',
        'Fatima Al-Mansoor',
        'Gabriel Reyes',
        'Hannah Abbott',
        'Isaac Clarke',
        'Jasmine Patel',
      ];
      const pal = COLOR_PALETTES.classic.colors;
      onUpdateWheel({
        ...currentWheel,
        name: 'Classroom Random Picker',
        slices: names.map((text, i) => ({
          id: `slice-${Date.now()}-${i}`,
          text: text.toUpperCase(),
          color: pal[i % pal.length],
          weight: 1,
          enabled: true,
        })),
      });
      setIsAdvancedMode(false);
    } else if (key === 'weighted') {
      onUpdateWheel({
        ...currentWheel,
        name: 'Weighted Giveaway Raffle',
        slices: [
          { id: 'w-1', text: '🎖️ VIP Gold (5x)', color: '#eab308', weight: 5, enabled: true },
          { id: 'w-2', text: '🥈 Silver (3x)', color: '#6366f1', weight: 3, enabled: true },
          { id: 'w-3', text: '🥉 Bronze (2x)', color: '#ec4899', weight: 2, enabled: true },
          { id: 'w-4', text: '🎟️ Standard Ticket #1', color: '#10b981', weight: 1, enabled: true },
          { id: 'w-5', text: '🎟️ Standard Ticket #2', color: '#06b6d4', weight: 1, enabled: true },
          { id: 'w-6', text: '🎟️ Standard Ticket #3', color: '#8b5cf6', weight: 1, enabled: true },
        ],
      });
      setIsAdvancedMode(true);
    } else if (key === 'yesno') {
      onUpdateWheel({
        ...currentWheel,
        name: 'Yes or No Decision Maker',
        slices: [
          { id: 'yn-1', text: 'YES! ✅', color: '#10b981', weight: 1, enabled: true },
          { id: 'yn-2', text: 'NO ❌', color: '#ef4444', weight: 1, enabled: true },
          { id: 'yn-3', text: 'YES! ✅', color: '#10b981', weight: 1, enabled: true },
          { id: 'yn-4', text: 'NO ❌', color: '#ef4444', weight: 1, enabled: true },
          { id: 'yn-5', text: 'MAYBE 🤔', color: '#f59e0b', weight: 1, enabled: true },
          { id: 'yn-6', text: 'SPIN AGAIN 🔄', color: '#6366f1', weight: 1, enabled: true },
        ],
      });
      setIsAdvancedMode(false);
    }
    showToast('Loaded preset wheel!');
  };

  return (
    <div
      className={`relative flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors duration-200 select-none ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Fullscreen Confetti Canvas Overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={entryImageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAddSliceImage}
      />
      <input
        type="file"
        ref={centerImageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleCenterImageUpload}
      />
      <input
        type="file"
        ref={importJsonInputRef}
        accept="application/json"
        className="hidden"
        onChange={handleImportJson}
      />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-xs shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Editable Wheel Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 cursor-pointer group" onClick={() => setShowTitleEditorModal(true)}>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {currentWheel.name}
                </h1>
                <span className="text-slate-400 group-hover:text-amber-500 text-xs transition-colors">
                  ✎
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Analyze Word/Excel Document Button */}
            {onOpenDocumentAnalyzer && (
              <button
                onClick={onOpenDocumentAnalyzer}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                title="Analyze Word (.docx) or Excel (.xlsx) file and create wheels"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Analyze Word/Excel</span>
              </button>
            )}

            {/* Dev & Testing Tools Dropdown (Studio View Only) */}
            <div className="relative" ref={devToolsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowDevToolsMenu((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/35 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Developer & Testing Tools (Demo Mode)"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Dev Tools</span>
                <ChevronDown
                  className={`w-3 h-3 text-amber-500 transition-transform ${
                    showDevToolsMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDevToolsMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[90vw] bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2 py-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-display font-black uppercase text-[10px] tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3" />
                      <span>Studio Dev &amp; Testing Suite</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      demo
                    </span>
                  </div>

                  {/* Section 1: Wheel Reset & Revert */}
                  <div className="space-y-1 mb-2">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Collection Management
                    </div>

                    {/* Revert All Wheels */}
                    <button
                      type="button"
                      onClick={handleTriggerRevertAll}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                        <span>Revert All Wheels</span>
                      </span>
                      <span className="text-[10px] text-slate-400">14 official</span>
                    </button>

                    {/* Remove All Wheels */}
                    <button
                      type="button"
                      onClick={handleTriggerRemoveAll}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-between transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Remove All Wheels</span>
                      </span>
                      <span className="text-[10px] text-rose-400">fresh starter</span>
                    </button>

                    {/* Randomize Wheels */}
                    <button
                      type="button"
                      onClick={handleTriggerRandomizeAll}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Dices className="w-3.5 h-3.5 text-amber-500" />
                        <span>Randomize All Wheels</span>
                      </span>
                      <span className="text-[10px] text-slate-400">colors &amp; order</span>
                    </button>
                  </div>

                  {/* Section 2: Current Wheel Actions */}
                  <div className="space-y-1 mb-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active Wheel ("{currentWheel.name.slice(0, 14)}...")
                    </div>

                    {/* Shuffle Current Wheel */}
                    <button
                      type="button"
                      onClick={handleShuffleCurrent}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition cursor-pointer text-left"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Shuffle Current Words</span>
                    </button>

                    {/* Populate 20 Demo Words */}
                    <button
                      type="button"
                      onClick={handlePopulateDemoWords}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>Fill 20 Competition Words</span>
                      </span>
                      <span className="text-[10px] text-slate-400">demo</span>
                    </button>

                    {/* Stress-Test 50 Words */}
                    <button
                      type="button"
                      onClick={handleStressTest50}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Layers className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Stress-Test 50 Slices</span>
                      </span>
                      <span className="text-[10px] text-slate-400">max</span>
                    </button>
                  </div>

                  {/* Section 3: Testing Simulation */}
                  <div className="space-y-1 mb-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Live Simulation
                    </div>

                    {/* Test Winner Celebration */}
                    <button
                      type="button"
                      onClick={handleTestCelebration}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-between transition cursor-pointer text-left font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>Test Winner Celebration</span>
                      </span>
                      <span className="text-[10px] text-amber-500">fanfare</span>
                    </button>

                    {/* Open Mobile Stage Remote in New Tab */}
                    <a
                      href="/remote"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-between transition cursor-pointer text-left font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                        <span>Open Mobile Stage Remote</span>
                      </span>
                      <span className="text-[10px] text-blue-500">/remote</span>
                    </a>
                  </div>

                  {/* Section 4: Backup & Storage */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Backup &amp; Reset
                    </div>

                    {/* Export All Backup */}
                    <button
                      type="button"
                      onClick={handleExportAllWheelsBackup}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Export All Wheels (.json)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{wheels.length}</span>
                    </button>

                    {/* Import All Backup */}
                    <button
                      type="button"
                      onClick={() => importAllBackupInputRef.current?.click()}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition cursor-pointer text-left"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>Restore Wheels Backup (.json)</span>
                    </button>

                    {/* Reset Server Storage */}
                    <button
                      type="button"
                      onClick={handleTriggerClearStorage}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-2 transition cursor-pointer text-left"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset Cloud &amp; Local Storage</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* New / Reset Button */}
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Create a new blank wheel"
            >
              <FilePlus className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">New</span>
            </button>

            {/* Customize Modal Trigger */}
            <button
              onClick={() => {
                setCustomizeTab('spin');
                setShowCustomizeModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJson}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Export Wheel (.json)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Import JSON */}
            <button
              onClick={() => importJsonInputRef.current?.click()}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Import Wheel (.json)"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">Import</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Hide/Show Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Hide or Show Entries Panel"
            >
              {isSidebarVisible ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="hidden sm:inline">
                {isSidebarVisible ? 'Hide Panel' : 'Show Panel'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-3 flex flex-col lg:flex-row items-center lg:items-stretch gap-4 sm:gap-6 overflow-hidden min-h-0">
        {/* LEFT / CENTER AREA: WHEEL STAGE */}
        <section className="flex-1 w-full flex flex-col items-center justify-between relative min-h-0 min-w-0 overflow-y-auto">
          {/* Wheel Selector Menu & Group Bar */}
          <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 shrink-0 mb-1">
            {/* Left: Group Tabs + Hidden Wheel Selection Menu */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Group Tabs: Elementary vs High School */}
              <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg text-xs font-bold">
                <button
                  onClick={() => {
                    const target =
                      wheels.find((w) => w.group === 'elementary') || wheels[0];
                    onSelectWheel(target.id);
                  }}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    currentWheel.group === 'elementary'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  Elementary
                </button>
                <button
                  onClick={() => {
                    const target =
                      wheels.find((w) => w.group === 'high_school') || wheels[0];
                    onSelectWheel(target.id);
                  }}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    currentWheel.group === 'high_school'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  High School
                </button>
              </div>

              {/* Clickable Wheel Selection Menu (Hidden until clicked, zero bloated text) */}
              <div className="relative">
                <button
                  onClick={() => setShowWheelsMenu(!showWheelsMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs hover:border-indigo-400 transition cursor-pointer"
                  title="Click to switch wheel"
                >
                  <Disc className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate max-w-[170px] sm:max-w-[240px] font-bold">
                    {currentWheel.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showWheelsMenu ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {showWheelsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowWheelsMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-1.5 w-64 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                        Select Wheel ({currentWheel.group === 'high_school' ? 'High School' : 'Elementary'})
                      </div>
                      {wheels
                        .filter((w) =>
                          currentWheel.group === 'high_school'
                            ? w.group === 'high_school'
                            : w.group === 'elementary' || !w.group
                        )
                        .map((w) => (
                          <div
                            key={w.id}
                            className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between group ${
                              w.id === activeWheelId
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <button
                              onClick={() => {
                                onSelectWheel(w.id);
                                setShowWheelsMenu(false);
                              }}
                              className="flex-1 text-left truncate cursor-pointer mr-2"
                            >
                              {w.name}
                            </button>
                            {w.id === activeWheelId && <Check className="w-3.5 h-3.5 shrink-0 mr-1" />}
                            {wheels.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWheelToDelete(w);
                                  setShowDeleteModal(true);
                                  setShowWheelsMenu(false);
                                }}
                                className="p-1 rounded hover:bg-rose-500/20 text-rose-500 transition cursor-pointer shrink-0"
                                title={`Delete ${w.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Remove Current Wheel Button */}
              <button
                onClick={() => {
                  setWheelToDelete(currentWheel);
                  setShowDeleteModal(true);
                }}
                disabled={wheels.length <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={wheels.length <= 1 ? 'Cannot remove the only remaining wheel' : `Remove "${currentWheel.name}"`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Remove Wheel</span>
              </button>
            </div>

            {/* Countdown Timer Duration for Current Wheel */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-xs"
              title="Countdown timer duration for this wheel (in seconds)"
            >
              <span className="text-slate-400 font-bold">Timer:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={timerDurationInput}
                onChange={(e) => handleTimerInputChange(e.target.value)}
                onBlur={handleTimerInputBlur}
                className="w-9 text-center font-bold text-indigo-600 dark:text-indigo-400 outline-none bg-transparent"
                aria-label="Timer duration in seconds"
              />
              <span className="text-slate-400 font-bold">s</span>
            </div>
          </div>

          {/* Floating Live Slice Indicator Pill */}
          <div className="my-1 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2.5 transition-all">
            <span
              className="w-3 h-3 rounded-full inline-block shadow-xs"
              style={{ backgroundColor: livePointerSlice?.color || '#6366f1' }}
            />
            <span className="font-display font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[240px] sm:max-w-[360px]">
              {livePointerSlice?.text || 'Ready to Spin!'}
            </span>
          </div>

          {/* Responsive Wheel Canvas Container */}
          <div className="relative flex items-center justify-center w-full flex-1 max-w-[min(540px,85vw,56vh)] aspect-square my-auto">
            <canvas
              ref={canvasRef}
              onClick={triggerSpin}
              className="w-full h-full cursor-pointer block drop-shadow-xl"
              title="Click or tap to spin the wheel!"
            />
          </div>

          {/* Bottom Quick Hint & Audio Status */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                Ctrl + Enter
              </kbd>
              or
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                Space
              </kbd>
              to spin
            </span>
            <span>•</span>
            <button
              onClick={() => {
                const next = !soundSettings.enabled;
                onUpdateSoundSettings({ ...soundSettings, enabled: next });
              }}
              className="flex items-center gap-1 hover:text-indigo-500 transition cursor-pointer"
            >
              {soundSettings.enabled ? (
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span>{soundSettings.enabled ? `Sound (${volume}%)` : 'Muted'}</span>
            </button>
          </div>
        </section>

        {/* RIGHT SIDEBAR: ENTRIES & RESULTS PANEL */}
        <aside
          className={`shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col h-[520px] lg:h-[calc(100vh-80px)] overflow-hidden transition-all duration-300 ${
            isSidebarVisible
              ? 'w-full lg:w-[390px] xl:w-[420px]'
              : 'w-0 overflow-hidden border-none pointer-events-none hidden'
          }`}
        >
          {/* Tabs Header */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-1.5 gap-1.5 shrink-0">
            <button
              onClick={() => setActiveSidebarTab('entries')}
              className={`py-2 px-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                activeSidebarTab === 'entries'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Entries</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold">
                {activeEntries.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('results')}
              className={`py-2 px-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                activeSidebarTab === 'results'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Results</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {resultsHistory.length}
              </span>
            </button>
          </div>

          {/* TAB 1: ENTRIES CONTENT */}
          {activeSidebarTab === 'entries' ? (
            <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 gap-2.5">
              {/* Entries Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={handleShuffle}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Randomize order of entries"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Shuffle</span>
                  </button>
                  <button
                    onClick={handleSortAZ}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Sort alphabetically A to Z"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Sort</span>
                  </button>
                  <button
                    onClick={() => entryImageInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Add an image slice to the wheel"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                    <span>Add Image</span>
                  </button>
                </div>

                {/* Advanced Mode Toggle Checkbox */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isAdvancedMode}
                    onChange={(e) => setIsAdvancedMode(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Advanced</span>
                </label>
              </div>

              {/* SIMPLE MODE: Plain Multi-line Textarea */}
              {!isAdvancedMode ? (
                <div className="flex-1 flex flex-col min-h-0 relative">
                  <textarea
                    value={textareaValue}
                    onChange={(e) => handleTextareaChange(e.target.value)}
                    placeholder="Enter one word or name per line..."
                    className="w-full flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/60 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
                    spellCheck="false"
                  />
                </div>
              ) : (
                /* ADVANCED MODE: Rich Interactive List (Weights, Custom Slice Color, Image, Visibility) */
                <div className="flex-1 flex flex-col min-h-0 gap-2 overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                    {currentWheel.slices.map((slice, index) => (
                      <div
                        key={slice.id}
                        className={`p-2 rounded-xl border transition flex items-center gap-2 ${
                          slice.enabled !== false
                            ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                            : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800/40 opacity-50'
                        }`}
                      >
                        {/* Visibility Checkbox */}
                        <input
                          type="checkbox"
                          checked={slice.enabled !== false}
                          onChange={(e) => {
                            const updated = currentWheel.slices.map((s) =>
                              s.id === slice.id ? { ...s, enabled: e.target.checked } : s
                            );
                            onUpdateWheel({ ...currentWheel, slices: updated });
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          title="Include on wheel"
                        />

                        {/* Slice Color Picker */}
                        <input
                          type="color"
                          value={slice.color}
                          onChange={(e) => {
                            const updated = currentWheel.slices.map((s) =>
                              s.id === slice.id ? { ...s, color: e.target.value } : s
                            );
                            onUpdateWheel({ ...currentWheel, slices: updated });
                          }}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent shrink-0"
                          title="Custom slice color"
                        />

                        {/* Image Thumbnail */}
                        {slice.image && (
                          <img
                            src={slice.image}
                            alt="Slice thumbnail"
                            className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-300 dark:border-slate-600 cursor-pointer"
                            title="Click to remove image"
                            onClick={() => {
                              const updated = currentWheel.slices.map((s) =>
                                s.id === slice.id ? { ...s, image: null } : s
                              );
                              onUpdateWheel({ ...currentWheel, slices: updated });
                            }}
                          />
                        )}

                        {/* Word Text Input */}
                        <input
                          type="text"
                          value={slice.text}
                          onChange={(e) => {
                            const updated = currentWheel.slices.map((s) =>
                              s.id === slice.id ? { ...s, text: e.target.value.toUpperCase() } : s
                            );
                            onUpdateWheel({ ...currentWheel, slices: updated });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold uppercase"
                        />

                        {/* Weight Stepper */}
                        <div
                          className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 shrink-0"
                          title="Slice Weight / Probability Multiplier (1x - 20x)"
                        >
                          <Scale className="w-3 h-3 text-slate-400 mr-1" />
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={slice.weight || 1}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                              const updated = currentWheel.slices.map((s) =>
                                s.id === slice.id ? { ...s, weight: val } : s
                              );
                              onUpdateWheel({ ...currentWheel, slices: updated });
                            }}
                            className="w-7 text-center bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                          />
                        </div>

                        {/* Delete Slice */}
                        <button
                          onClick={() => handleDeleteSlice(slice.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddSlice}
                    className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Entry Row</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: RESULTS CONTENT */
            <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 gap-3">
              {/* Results Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (resultsHistory.length < 2) return;
                      const sorted = [...resultsHistory].sort((a, b) => a.text.localeCompare(b.text));
                      setResultsHistory(sorted);
                      showToast('Results sorted A–Z');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Sort</span>
                  </button>
                  <button
                    onClick={handleRestoreRemoved}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Removed</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setResultsHistory([]);
                    showToast('Results cleared');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Results Chronological List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {resultsHistory.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 gap-2">
                    <Trophy className="w-8 h-8 opacity-40" />
                    <p className="text-xs sm:text-sm font-medium">No winners recorded yet.</p>
                    <p className="text-[11px] opacity-75">Spin the wheel to see results here!</p>
                  </div>
                ) : (
                  resultsHistory.map((res, idx) => (
                    <div
                      key={res.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: res.color || '#6366f1' }}
                        >
                          {resultsHistory.length - idx}
                        </span>
                        <div className="min-w-0">
                          <div className="font-display font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                            {res.text}
                          </div>
                          <div className="text-[10px] text-slate-400">{res.time}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setResultsHistory((prev) => prev.filter((r) => r.id !== res.id));
                        }}
                        className="text-slate-400 hover:text-rose-500 transition text-xs p-1 cursor-pointer"
                        title="Delete from results"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: WINNER ANNOUNCEMENT POPUP                                        */}
      {/* ========================================================================= */}
      {showWinnerModal && winningSlice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Dynamic Colored Header matching Winning Slice */}
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{
                backgroundColor: winningSlice.color || '#4f46e5',
                color: getLuminance(winningSlice.color || '#4f46e5') > 0.6 ? '#0f172a' : '#ffffff',
              }}
            >
              <h3 className="font-display font-bold text-base tracking-wide flex items-center gap-2">
                <Crown className="w-5 h-5 fill-current" />
                <span>{winnerMessage}</span>
              </h3>
              <button
                onClick={() => setShowWinnerModal(false)}
                className="w-7 h-7 rounded-lg bg-black/15 hover:bg-black/25 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Winner Body */}
            <div className="p-6 sm:p-8 text-center space-y-4">
              {winningSlice.image && (
                <div className="flex justify-center">
                  <img
                    src={winningSlice.image}
                    alt="Winner"
                    className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-indigo-500/30"
                  />
                </div>
              )}
              <div
                className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white break-words leading-tight"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              >
                {winningSlice.text}
              </div>
            </div>

            {/* Winner Modal Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowWinnerModal(false)}
                className="px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleRemoveWinningWord}
                className="px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-xs shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Word</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPREHENSIVE CUSTOMIZATION MODAL (3 TABS)                       */}
      {/* ========================================================================= */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Customize Wheel
                </h2>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customize Modal Navigation Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4 pt-2 gap-2 shrink-0">
              <button
                onClick={() => setCustomizeTab('spin')}
                className={`pb-3 pt-2 font-display font-bold text-xs sm:text-sm border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
                  customizeTab === 'spin'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Disc className="w-4 h-4" />
                <span>During Spin</span>
              </button>
              <button
                onClick={() => setCustomizeTab('after')}
                className={`pb-3 pt-2 font-display font-bold text-xs sm:text-sm border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
                  customizeTab === 'after'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>After Spin</span>
              </button>
              <button
                onClick={() => setCustomizeTab('appearance')}
                className={`pb-3 pt-2 font-display font-bold text-xs sm:text-sm border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
                  customizeTab === 'appearance'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </button>
            </div>

            {/* Customize Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB: DURING SPIN */}
              {customizeTab === 'spin' && (
                <div className="space-y-5">
                  {/* Tick Sound Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Ticking Sound Profile
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Synthesized sound when slices pass the pointer
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={tickSoundProfile}
                        onChange={(e) => {
                          onUpdateWheel({ ...currentWheel, tickSound: e.target.value });
                          onUpdateSoundSettings({ ...soundSettings, tickSound: e.target.value as any });
                        }}
                        className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="classic">Classic Plastic Flapper</option>
                        <option value="wood">Warm Woodblock Tick</option>
                        <option value="casino">Metallic Casino Peg</option>
                        <option value="retro">8-Bit Arcade Beep</option>
                        <option value="none">No Sound (Mute Ticks)</option>
                      </select>
                      <button
                        onClick={playTickSound}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white transition cursor-pointer"
                        title="Test Sound"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <label className="font-semibold text-slate-800 dark:text-slate-100">
                        Master Sound Volume
                      </label>
                      <span className="font-mono text-xs text-indigo-500 font-bold">{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSoundSettings({ ...soundSettings, volume: val / 100 });
                      }}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Spin Duration Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <label className="font-semibold text-slate-800 dark:text-slate-100">
                        Spin Time (seconds)
                      </label>
                      <span className="font-mono text-xs text-indigo-500 font-bold">
                        {spinDuration}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={spinDuration}
                      onChange={(e) => {
                        onUpdateWheel({
                          ...currentWheel,
                          spinDuration: parseInt(e.target.value, 10),
                        });
                      }}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1s (Instant)</span>
                      <span>8s (Standard)</span>
                      <span>30s (Suspenseful)</span>
                    </div>
                  </div>

                  {/* Countdown Timer Duration for Tiebreaks */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <label className="font-semibold text-slate-800 dark:text-slate-100">
                        Countdown Timer Duration (seconds)
                      </label>
                      <span className="font-mono text-xs text-indigo-500 font-bold">
                        {timerDuration}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={timerDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateWheel({ ...currentWheel, timerDuration: val });
                        setTimerDurationInput(String(val));
                      }}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Max Visible Slices Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <label className="font-semibold text-slate-800 dark:text-slate-100">
                        Max Visible Words on Wheel
                      </label>
                      <span className="font-mono text-xs text-indigo-500 font-bold">
                        {maxVisibleSlices}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={maxVisibleSlices}
                      onChange={(e) => {
                        onUpdateWheel({
                          ...currentWheel,
                          maxVisibleSlices: parseInt(e.target.value, 10),
                        });
                      }}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Idle Slow Spin Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Spin Slowly While Idle
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Gently rotates the wheel before clicking spin
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={idleSpin}
                      onChange={(e) => {
                        onUpdateWheel({ ...currentWheel, idleSpin: e.target.checked });
                      }}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB: AFTER SPIN */}
              {customizeTab === 'after' && (
                <div className="space-y-5">
                  {/* Winner Fanfare Sound */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Winner Sound Effect
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Played when the wheel stops on a winner
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={winSoundProfile}
                        onChange={(e) => {
                          onUpdateWheel({ ...currentWheel, winSound: e.target.value });
                        }}
                        className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="none">No Sound (Silent / Kept Clean)</option>
                        <option value="fanfare">Tada Brass Fanfare</option>
                        <option value="applause">Crowd Cheer & Chime</option>
                        <option value="bell">Crystal Harmonic Bell</option>
                      </select>
                      <button
                        onClick={playWinnerFanfare}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white transition cursor-pointer"
                        title="Test Winner Sound"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Popup Winner Message */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Popup Winner Message
                    </label>
                    <input
                      type="text"
                      value={winnerMessage}
                      onChange={(e) => {
                        onUpdateWheel({ ...currentWheel, winnerMessage: e.target.value });
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Launch Confetti Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Launch Confetti Celebration
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        60fps particle burst when winner lands
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={confettiEnabled}
                      onChange={(e) => {
                        onUpdateWheel({ ...currentWheel, confetti: e.target.checked });
                      }}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Display Winner Popup Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Display Popup with Winner
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Opens modal dialog showing winning word
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPopup}
                      onChange={(e) => {
                        onUpdateWheel({ ...currentWheel, showPopup: e.target.checked });
                      }}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Auto-remove winner after 5 seconds */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Auto-remove Winner
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically removes the chosen word from the wheel
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoRemove}
                      onChange={(e) => {
                        onUpdateWheel({ ...currentWheel, autoRemove: e.target.checked });
                      }}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB: APPEARANCE */}
              {customizeTab === 'appearance' && (
                <div className="space-y-5">
                  {/* Curated Theme Palettes */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Wheel Color Theme Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.entries(COLOR_PALETTES).map(([key, pal]) => {
                        const isSelected = paletteKey === key;
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              onUpdateWheel({
                                ...currentWheel,
                                paletteKey: key,
                                slices: currentWheel.slices.map((s, idx) => ({
                                  ...s,
                                  color: pal.colors[idx % pal.colors.length],
                                })),
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {pal.name}
                            </span>
                            <div className="flex h-3 w-full rounded-md overflow-hidden">
                              {pal.colors.map((c, i) => (
                                <span
                                  key={i}
                                  className="flex-1 h-full"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Center Hub Customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <label className="font-semibold text-slate-800 dark:text-slate-100">
                          Center Cap Size
                        </label>
                        <span className="font-mono text-xs text-indigo-500 font-bold">
                          {Math.round(hubRadiusRatio * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="28"
                        value={Math.round(hubRadiusRatio * 100)}
                        onChange={(e) => {
                          onUpdateWheel({
                            ...currentWheel,
                            hubRadiusRatio: parseInt(e.target.value, 10) / 100,
                          });
                        }}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Center Hub Image / Logo
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => centerImageInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>
                        {currentWheel.centerImageSrc && (
                          <button
                            onClick={() => {
                              onUpdateWheel({ ...currentWheel, centerImageSrc: null });
                              showToast('Center hub image cleared');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slice Borders & Wheel Shadows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <span className="text-xs font-semibold">Slice Outlines</span>
                      <input
                        type="checkbox"
                        checked={sliceBorders}
                        onChange={(e) => {
                          onUpdateWheel({ ...currentWheel, sliceBorders: e.target.checked });
                        }}
                        className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <span className="text-xs font-semibold">Outer Glow & Shadow</span>
                      <input
                        type="checkbox"
                        checked={wheelShadow}
                        onChange={(e) => {
                          onUpdateWheel({ ...currentWheel, wheelShadow: e.target.checked });
                        }}
                        className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT WHEEL TITLE & SUBTITLE                                      */}
      {/* ========================================================================= */}
      {showTitleEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Edit Wheel Title & Subtitle
              </h3>
              <button
                onClick={() => setShowTitleEditorModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Wheel Title
                </label>
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Subtitle / Instructions
                </label>
                <input
                  type="text"
                  value={subtitleDraft}
                  onChange={(e) => setSubtitleDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowTitleEditorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTitleModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RESET / NEW WHEEL CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Create a New Wheel?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              This will create a new custom wheel with clean starter words.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onCreateWheel('custom', 'NEW CUSTOM WHEEL');
                  setShowResetModal(false);
                  showToast('Created new custom wheel!');
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE / REMOVE WHEEL CONFIRMATION                                */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Remove Wheel?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200 font-bold">"{targetWheelToDelete.name}"</strong>? This will permanently delete this wheel.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWheelToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteWheel}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-600/25 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev Action Confirmation Modal */}
      {devActionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {devActionConfirm.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dev &amp; Testing Action
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {devActionConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDevActionConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDevAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  devActionConfirm.type === 'remove_all'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden input for Restoring Full Wheels Backup (.json) */}
      <input
        type="file"
        ref={importAllBackupInputRef}
        accept="application/json"
        className="hidden"
        onChange={handleImportAllWheelsBackup}
      />

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
