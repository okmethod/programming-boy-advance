import { browser } from "$app/environment";
import safeWorkerScript from "$lib/utils/safeWorkerScript.js?raw";

interface AllowedGlobal {
  func: unknown;
  wait: number;
}

export type AllowedGlobals = Record<string, AllowedGlobal>;

type Callback<T> = (result: T | null, error: Error | null) => void;

class WebWorkerClient {
  private workerScript: string;
  private webWorker: Worker | null = null;
  private timeoutMS: number = 5000;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.workerScript = safeWorkerScript;
  }

  public init(timeoutMS?: number | undefined): void {
    if (!browser) {
      console.warn("Web Worker is not supported in this environment.");
      return;
    }
    this.timeoutMS = timeoutMS ? timeoutMS : this.timeoutMS;
    const workerBlob = new Blob([this.workerScript], { type: "application/javascript" });
    this.webWorker = new Worker(URL.createObjectURL(workerBlob));
  }

  private get worker(): Worker {
    if (this.webWorker === null) {
      throw new Error("Web Worker is not initialized.");
    }
    return this.webWorker;
  }

  public run<T>(code: string, allowedGlobals: AllowedGlobals, callback: Callback<T>): void {
    this.timeoutId = setTimeout(() => {
      this.worker.terminate();
      console.warn("Web Worker timed out.");
    }, this.timeoutMS);

    this.worker.onmessage = (event: MessageEvent) => {
      if (this.timeoutId) this.timeoutId = null;
      this.handleWorkerMessage<T>(event, allowedGlobals, callback);
    };

    const serializedGlobals = JSON.stringify(allowedGlobals, (_, value) => {
      return typeof value === "function" ? value.toString() : value;
    });

    this.worker.postMessage({ code, allowedGlobals: serializedGlobals });
  }

  private handleWorkerMessage<T>(event: MessageEvent, allowedGlobals: AllowedGlobals, callback: Callback<T>) {
    const { type, functionName, args, result, error } = event.data;
    if (type === "invoke") {
      const { func } = allowedGlobals[functionName];
      if (typeof func === "function") func(...args);
    } else if (result !== undefined) {
      callback(result, null);
    } else if (error) {
      callback(null, error);
    } else {
      console.warn("Unknown message type received from worker:", event.data);
    }
  }

  public terminate() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.worker.terminate();
  }
}

export default WebWorkerClient;
