import { StateCreator } from 'zustand';
import { WinnersData } from '../types/presentation';

export interface SyncStateSlice {
  isConnected: boolean;
  latency: number | null;
  /** How many stage displays the server currently sees (null = unknown yet). */
  stagesOnline: number | null;
  winnersData: WinnersData | null;

  setIsConnected: (connected: boolean) => void;
  setLatency: (latency: number | null) => void;
  setStagesOnline: (stages: number | null) => void;
  setWinnersData: (data: WinnersData | null) => void;
}

export const createSyncSlice: StateCreator<SyncStateSlice> = (set) => ({
  isConnected: false,
  latency: null,
  stagesOnline: null,
  winnersData: null,

  setIsConnected: (connected) => set({ isConnected: connected }),
  setLatency: (latency) => set({ latency }),
  setStagesOnline: (stagesOnline) => set({ stagesOnline }),
  setWinnersData: (data) => set({ winnersData: data }),
});
