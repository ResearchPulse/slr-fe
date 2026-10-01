import { HubConnectionState } from "@microsoft/signalr";
import type { SignalREvents } from "../types/signalr";

/**
 * SignalRManager (Polling Adapter Mode)
 * SignalR is decommissioned in favor of TanStack Query polling and mutation invalidation.
 * This class provides a safe no-op implementation to prevent runtime crashes.
 */
class SignalRManager {
  private static instance: SignalRManager;

  private constructor() {}

  public static getInstance(): SignalRManager {
    if (!SignalRManager.instance) {
      SignalRManager.instance = new SignalRManager();
    }
    return SignalRManager.instance;
  }

  public async start(accessToken: string): Promise<null> {
    // No-op: Realtime handled via TanStack Query Polling
    void accessToken;
    return null;
  }

  public async registerHandler<E extends keyof SignalREvents>(
    eventName: E,
    handler: SignalREvents[E],
  ): Promise<void> {
    // No-op
    void eventName;
    void handler;
  }

  public removeHandler<E extends keyof SignalREvents>(
    eventName: E,
    handler: SignalREvents[E],
  ): void {
    // No-op
    void eventName;
    void handler;
  }

  public async stop() {
    // No-op
  }

  public getConnectionState(): HubConnectionState {
    return HubConnectionState.Disconnected;
  }
}

export const signalRService = SignalRManager.getInstance();

export const getSignalRConnection = (accessToken?: string) => {
  void accessToken;
  return Promise.resolve(null);
};
export const startSignalRConnection = (accessToken?: string) => {
  void accessToken;
  return Promise.resolve(null);
};
export const stopSignalRConnection = () => Promise.resolve();
