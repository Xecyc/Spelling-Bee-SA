import { StateCreator } from 'zustand';
import { WinnersData } from '../types/presentation';

export interface SyncStateSlice {
  isConnected: boolean;
  latency: number | null;
  winnersData: WinnersData | null;

  setIsConnected: (connected: boolean) => void;
  setLatency: (latency: number | null) => void;
  setWinnersData: (data: WinnersData | null) => void;
}

export const createSyncSlice: StateCreator<SyncStateSlice> = (set) => ({
  isConnected: false,
  latency: null,
  winnersData: null,

  setIsConnected: (connected) => set({ isConnected: connected }),
  setLatency: (latency) => set({ latency }),
  setWinnersData: (data) => set({ winnersData: data }),
});
