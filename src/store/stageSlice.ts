import { StateCreator } from 'zustand';
import { PresentationSlideId, SoundSettings } from '../types/presentation';

export interface StageStateSlice {
  currentMode: 'presentation' | 'studio';
  currentSlide: PresentationSlideId;
  isFullscreen: boolean;
  isRemoteRoute: boolean;
  soundSettings: SoundSettings;
  showRemoteModal: boolean;

  setCurrentMode: (mode: 'presentation' | 'studio') => void;
  setCurrentSlide: (slide: PresentationSlideId) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsRemoteRoute: (isRemote: boolean) => void;
  setSoundSettings: (settings: SoundSettings | ((prev: SoundSettings) => SoundSettings)) => void;
  setShowRemoteModal: (show: boolean) => void;
  toggleFullscreen: () => void;
}

export const createStageSlice: StateCreator<StageStateSlice> = (set, get) => ({
  currentMode: 'presentation',
  currentSlide: 0,
  isFullscreen: false,
  isRemoteRoute: false,
  showRemoteModal: false,
  soundSettings: {
    enabled: true,
    volume: 0.8,
    tickSound: 'click',
    fanfare: 'trumpet',
    announceWinnerVoice: true,
  },

  setCurrentMode: (mode) => set({ currentMode: mode }),
  setCurrentSlide: (slide) => set({ currentSlide: slide }),
  setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setIsRemoteRoute: (isRemote) => set({ isRemoteRoute: isRemote }),
  setSoundSettings: (settingsOrUpdater) =>
    set((state) => ({
      soundSettings:
        typeof settingsOrUpdater === 'function' ? settingsOrUpdater(state.soundSettings) : settingsOrUpdater,
    })),
  setShowRemoteModal: (show) => set({ showRemoteModal: show }),

  toggleFullscreen: () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  },
});
