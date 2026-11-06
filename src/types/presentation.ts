export interface WheelSlice {
  id: string;
  text: string;
  color: string;
}

export type WheelRole = '1st' | '2nd' | '3rd' | 'custom';

export interface WheelConfig {
  id: string;
  name: string;
  role: WheelRole;
  slices: WheelSlice[];
  spinDuration: number; // in seconds, default 6
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  tickSound: 'click' | 'wooden' | 'electronic';
  fanfare: 'cheer' | 'trumpet' | 'synth';
  announceWinnerVoice: boolean;
}

export interface TimerSettings {
  defaultSeconds: number; // default 40
  autoStartOnWin: boolean;
}

export type PresentationSlideId = 0 | 1 | 2 | 3;

export interface PresentationState {
  currentSlide: PresentationSlideId;
  activeWheelId: string;
  isWheelSpinning: boolean;
  winningWord: string | null;
  showWinnerModal: boolean;
}
