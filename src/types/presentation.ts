export interface WheelSlice {
  id: string;
  text: string;
  color: string;
  weight?: number;
  enabled?: boolean;
  image?: string | null;
}

export type WheelRole = 'general' | 'tiebreak' | '1st' | '2nd' | '3rd' | 'championship' | 'custom';
export type WheelGroup = 'elementary' | 'high_school' | 'custom';
export type WheelPlace = 'general' | 'tiebreak' | '1st' | '2nd_3rd' | 'championship' | 'custom';

export interface WheelConfig {
  id: string;
  name: string;
  subtitle?: string;
  role: WheelRole;
  group?: WheelGroup;
  grade?: string;
  place?: WheelPlace;
  slices: WheelSlice[];
  spinDuration: number; // in seconds, default 6
  timerDuration?: number; // in seconds, default 40 for 1st, 20 for 2nd/3rd
  hubRadiusRatio?: number;
  centerImageSrc?: string | null;
  paletteKey?: string;
  sliceBorders?: boolean;
  wheelShadow?: boolean;
  idleSpin?: boolean;
  confetti?: boolean;
  showPopup?: boolean;
  winnerMessage?: string;
  autoRemove?: boolean;
  maxVisibleSlices?: number;
  tickSound?: string;
  winSound?: string;
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

export interface WinnersData {
  first: string;
  second: string;
  third: string;
}

export interface PresentationState {
  currentSlide: PresentationSlideId;
  activeWheelId: string;
  isWheelSpinning: boolean;
  winningWord: string | null;
  showWinnerModal: boolean;
  winnersData?: WinnersData | null;
}
