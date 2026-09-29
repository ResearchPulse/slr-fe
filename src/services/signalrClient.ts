import { HubConnectionState } from "@microsoft/signalr";

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

  public async start(_accessToken: string): Promise<any> {
    // No-op: Realtime handled via TanStack Query Polling
    return null;
  }

  public async registerHandler(_eventName: string, _handler: (...args: any[]) => void) {
    // No-op
  }

  public removeHandler(_eventName: string, _handler: (...args: any[]) => void) {
    // No-op
  }

  public async stop() {
    // No-op
  }

  public getConnectionState(): HubConnectionState {
    return HubConnectionState.Disconnected;
  }
}

export const signalRService = SignalRManager.getInstance();

export const getSignalRConnection = (_accessToken?: string) => Promise.resolve(null);
export const startSignalRConnection = (_accessToken?: string) => Promise.resolve(null);
export const stopSignalRConnection = () => Promise.resolve();

