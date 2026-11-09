import { create } from 'zustand';
import { createStageSlice, StageStateSlice } from './stageSlice';
import { createSyncSlice, SyncStateSlice } from './syncSlice';

export type ContestStore = StageStateSlice & SyncStateSlice;

export const useContestStore = create<ContestStore>()((...a) => ({
  ...createStageSlice(...a),
  ...createSyncSlice(...a),
}));
