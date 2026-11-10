import { useCallback, useEffect, useRef } from 'react';
import { useContestStore } from '../store';
import { createRemoteClient, type RemoteClient } from '../utils/remoteClient';
import type { CommandType, DeliveryResult, StageSyncState } from '../utils/remoteProtocol';
import type { WinnersData } from '../types/presentation';

export type { StageSyncState } from '../utils/remoteProtocol';

interface UseStageSyncOptions {
  /** Stage only: called once for every command the phone sends. */
  onRemoteAction?: (action: string, data?: any) => void;
  /** Remote only: called with the stage's latest snapshot. */
  onStageState?: (state: StageSyncState) => void;
}

const NOT_READY: DeliveryResult = { ok: false, error: 'Not connected yet' };

/**
 * React wrapper around the transport in utils/remoteClient.ts (all the real logic, and its tests, live there).
 * The page is a *stage* normally and a *remote* on /remote or ?view=remote.
 */
export function useStageSync(options?: UseStageSyncOptions) {
  const isRemoteRoute = useContestStore((s) => s.isRemoteRoute);
  const setIsConnected = useContestStore((s) => s.setIsConnected);
  const setLatency = useContestStore((s) => s.setLatency);
  const setStagesOnline = useContestStore((s) => s.setStagesOnline);
  const setWinnersData = useContestStore((s) => s.setWinnersData);

  const clientRef = useRef<RemoteClient | null>(null);
  const onRemoteActionRef = useRef(options?.onRemoteAction);
  const onStageStateRef = useRef(options?.onStageState);
  onRemoteActionRef.current = options?.onRemoteAction;
  onStageStateRef.current = options?.onStageState;

  useEffect(() => {
    const client = createRemoteClient({
      role: isRemoteRoute ? 'remote' : 'stage',
      onCommand: (command) => onRemoteActionRef.current?.(command.type, command.payload),
      onStageState: (state) => onStageStateRef.current?.(state),
      onWinners: (winners: WinnersData) => setWinnersData(winners),
      onConnection: setIsConnected,
      onPresence: setStagesOnline,
      onLatency: setLatency,
    });
    clientRef.current = client;
    return () => {
      client.destroy();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [isRemoteRoute, setIsConnected, setLatency, setStagesOnline, setWinnersData]);

  const send = useCallback(
    (type: CommandType, payload?: unknown): Promise<DeliveryResult> =>
      clientRef.current ? clientRef.current.send(type, payload) : Promise.resolve(NOT_READY),
    []
  );

  const broadcastStageState = useCallback((state: StageSyncState) => {
    clientRef.current?.publishStageState(state);
  }, []);

  const requestStageState = useCallback(() => {
    clientRef.current?.requestStageState();
  }, []);

  return {
    send,
    pushWinners: useCallback((winners: WinnersData) => send('push_winners', winners), [send]),
    clearBoard: useCallback(() => send('clear_board'), [send]),
    spinWheel: useCallback(() => send('spin_wheel'), [send]),
    stopSpin: useCallback(() => send('stop_spin'), [send]),
    startTimer: useCallback(() => send('start_timer'), [send]),
    pauseTimer: useCallback(() => send('pause_timer'), [send]),
    resetTimer: useCallback(() => send('reset_timer'), [send]),
    setTimerDuration: useCallback((seconds: number) => send('set_timer_duration', seconds), [send]),
    removeWord: useCallback(() => send('remove_word'), [send]),
    closeModal: useCallback(() => send('close_modal'), [send]),
    setSlide: useCallback((slide: number) => send('set_slide', slide), [send]),
    toggleFullscreen: useCallback(() => send('toggle_fullscreen'), [send]),
    broadcastStageState,
    requestStageState,
  };
}
