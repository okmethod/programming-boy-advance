import { browser } from "$app/environment";

const workerScript = `
self.onmessage = function(event) {
  const code = event.data;
  try {
    const result = eval(code);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
`;

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

  public run<T>(code: string, callback: (result: T | null, error: string | null) => void): void {
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

    this.worker.postMessage(code);
  }

  public terminate() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.worker.terminate();
  }
}

export default WebWorkerClient;
