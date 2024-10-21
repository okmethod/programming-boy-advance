import { browser } from "$app/environment";
import safeWorkerScript from "$lib/utils/safeWorkerScript.js?raw";

type AllowedGlobals = Record<string, unknown>;
type Callback<T> = (result: T | null, error: string | null) => void;

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
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.handleWorkerMessage<T>(event, callback);
    };

    const serializedGlobals = JSON.stringify(allowedGlobals, (_, value) => {
      if (typeof value === "function") {
        return value.toString();
      }
      return value;
    });

    this.worker.postMessage({ code, allowedGlobals: serializedGlobals });
  }

  private handleWorkerMessage<T>(event: MessageEvent, callback: Callback<T>) {
    const { result, error } = event.data;
    if (error) {
      callback(null, error);
    } else {
      callback(result, null);
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
