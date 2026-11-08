import { create } from 'zustand';
import { createWheelSlice, WheelStateSlice } from './wheelSlice';
import { createStageSlice, StageStateSlice } from './stageSlice';
import { createSyncSlice, SyncStateSlice } from './syncSlice';

export type ContestStore = WheelStateSlice & StageStateSlice & SyncStateSlice;

export const useContestStore = create<ContestStore>()((...a) => ({
  ...createWheelSlice(...a),
  ...createStageSlice(...a),
  ...createSyncSlice(...a),
}));
