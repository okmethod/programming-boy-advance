import { browser } from "$app/environment";
import workerScript from "$lib/utils/workerScript.js?raw";

type AllowedGlobals = Record<string, unknown>;

class WebWorkerClient {
  private workerScript: string;
  private webWorker: Worker | null = null;
  private timeoutMS: number = 5000;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.workerScript = workerScript;
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

  public run<T>(
    code: string,
    allowedGlobals: AllowedGlobals,
    callback: (result: T | null, error: string | null) => void,
  ): void {
    this.timeoutId = setTimeout(() => {
      this.worker.terminate();
      console.warn("Web Worker timed out.");
    }, this.timeoutMS);

    this.worker.onmessage = (event) => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (event.data.error) {
        callback(null, event.data.error);
      } else {
        callback(event.data.result, null);
      }
    };

    const serializedGlobals = JSON.stringify(allowedGlobals, (_, value) => {
      if (typeof value === "function") {
        return value.toString();
      }
      return value;
    });

    this.worker.postMessage({ code, allowedGlobals: serializedGlobals });
  }

  public terminate() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.worker.terminate();
  }
}

export default WebWorkerClient;
