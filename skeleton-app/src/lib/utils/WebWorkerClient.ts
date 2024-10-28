import { browser } from "$app/environment";
import safeWorkerScript from "$lib/utils/safeWorkerScript.js?raw";
import type { ToastStatus } from "$lib/utils/toastSettings";

interface AllowedGlobal {
  func: unknown;
  wait: number;
}
export type AllowedGlobals = Record<string, AllowedGlobal>;

export interface WorkerResult {
  status: ToastStatus;
  resultString: string;
  message: string;
}
type Callback = (result: WorkerResult) => void;

class WebWorkerClient {
  private workerScript: string;
  private webWorker: Worker | null = null;
  private workerBlob: Blob;
  private timeoutMS: number = 5000;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(timeoutMS?: number | undefined) {
    this.workerScript = safeWorkerScript;
    this.workerBlob = new Blob([this.workerScript], { type: "application/javascript" });
    this.timeoutMS = timeoutMS ? timeoutMS : this.timeoutMS;
  }

  private get worker(): Worker {
    if (!browser) console.warn("Web Worker is not supported in this environment.");
    if (this.webWorker === null) {
      this.webWorker = new Worker(URL.createObjectURL(this.workerBlob));
    }
    return this.webWorker;
  }

  public run(code: string, allowedGlobals: AllowedGlobals, callback: Callback): void {
    this.timeoutId = setTimeout(() => {
      this.worker.terminate();
      console.warn("Web Worker timed out.");
    }, this.timeoutMS);

    this.worker.onmessage = (event: MessageEvent) => {
      if (this.timeoutId) this.timeoutId = null;
      this.handleWorkerMessage(event, allowedGlobals, callback);
    };

    const serializedGlobals = JSON.stringify(allowedGlobals, (_, value) => {
      return typeof value === "function" ? value.toString() : value;
    });

    this.worker.postMessage({ code, allowedGlobals: serializedGlobals });
  }

  private formatResultToString(result: unknown): string {
    if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
      return String(result);
    } else if (Array.isArray(result) || typeof result === "object") {
      return JSON.stringify(result, null, 2);
    } else {
      return "(No Results)";
    }
  }

  private handleWorkerMessage(event: MessageEvent, allowedGlobals: AllowedGlobals, callback: Callback) {
    const { type, functionName, args, result, error } = event.data;
    if (type === "invoke") {
      const { func } = allowedGlobals[functionName];
      if (typeof func === "function") func(...args);
    } else if (result !== undefined) {
      callback({
        status: "Succeed",
        resultString: this.formatResultToString(result),
        message: "Executed successfully.",
      });
    } else if (error) {
      console.error("Error:", error);
      callback({
        status: "Error",
        resultString: "",
        message: error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError",
      });
    } else {
      console.warn("Unknown message type received from worker:", event.data);
    }
  }

  public terminate() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.worker.terminate();
    this.webWorker = null;
  }
}

export default WebWorkerClient;
