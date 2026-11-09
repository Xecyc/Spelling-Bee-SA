import { StateCreator } from 'zustand';
import { WheelConfig, WheelSlice, WheelRole } from '../types/presentation';
import { INITIAL_WHEELS } from '../utils/defaultData';
import { getSessionTimerDuration } from '../utils/timerSession';

export interface WheelStateSlice {
  wheels: WheelConfig[];
  activeWheelId: string;
  isWheelSpinning: boolean;
  winningSlice: WheelSlice | null;
  showWinnerModal: boolean;
  autoStartTimerTrigger: number;
  showDocumentAnalyzer: boolean;

  setWheels: (wheels: WheelConfig[] | ((prev: WheelConfig[]) => WheelConfig[])) => void;
  setActiveWheelId: (id: string) => void;
  updateWheel: (updated: WheelConfig) => void;
  createWheel: (role: WheelRole, name: string) => void;
  deleteWheel: (wheelId: string) => void;
  revertAllWheels: () => void;
  setIsWheelSpinning: (spinning: boolean) => void;
  setWinningSlice: (slice: WheelSlice | null) => void;
  setShowWinnerModal: (show: boolean) => void;
  triggerTimer: () => void;
  setShowDocumentAnalyzer: (show: boolean) => void;
}

export const createWheelSlice: StateCreator<WheelStateSlice> = (set) => ({
  wheels: INITIAL_WHEELS,
  activeWheelId: INITIAL_WHEELS[0].id,
  isWheelSpinning: false,
  winningSlice: null,
  showWinnerModal: false,
  autoStartTimerTrigger: 0,
  showDocumentAnalyzer: false,

  setWheels: (wheelsOrUpdater) =>
    set((state) => ({
      wheels: typeof wheelsOrUpdater === 'function' ? wheelsOrUpdater(state.wheels) : wheelsOrUpdater,
    })),

  setActiveWheelId: (id) => set({ activeWheelId: id }),

  updateWheel: (updated) =>
    set((state) => ({
      wheels: state.wheels.map((w) => (w.id === updated.id ? updated : w)),
    })),

  createWheel: (role, name) =>
    set((state) => {
      const defaultTimer = getSessionTimerDuration();
      const newWheel: WheelConfig = {
        id: `wheel-${Date.now()}`,
        name,
        role,
        group: 'elementary',
        spinDuration: 6,
        timerDuration: defaultTimer,
        slices: [
          { id: `s-${Date.now()}-1`, text: 'WORD 1', color: '#FBBF24' },
          { id: `s-${Date.now()}-2`, text: 'WORD 2', color: '#60A5FA' },
          { id: `s-${Date.now()}-3`, text: 'WORD 3', color: '#34D399' },
          { id: `s-${Date.now()}-4`, text: 'WORD 4', color: '#F472B6' },
        ],
      };
      return {
        wheels: [...state.wheels, newWheel],
        activeWheelId: newWheel.id,
      };
    }),

  deleteWheel: (wheelId) =>
    set((state) => {
      if (state.wheels.length <= 1) return state;
      const remaining = state.wheels.filter((w) => w.id !== wheelId);
      return {
        wheels: remaining,
        activeWheelId: state.activeWheelId === wheelId ? remaining[0].id : state.activeWheelId,
      };
    }),

  revertAllWheels: () =>
    set({
      wheels: INITIAL_WHEELS,
      activeWheelId: INITIAL_WHEELS[0].id,
    }),

  setIsWheelSpinning: (spinning) => set({ isWheelSpinning: spinning }),
  setWinningSlice: (slice) => set({ winningSlice: slice }),
  setShowWinnerModal: (show) => set({ showWinnerModal: show }),
  triggerTimer: () => set((state) => ({ autoStartTimerTrigger: state.autoStartTimerTrigger + 1 })),
  setShowDocumentAnalyzer: (show) => set({ showDocumentAnalyzer: show }),
});
