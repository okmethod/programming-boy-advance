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

function runScriptOnWorker<T>(
  code: string,
  timeout: number = 5000,
  callback: (result: T | null, error: string | null) => void,
): void {
  if (!browser) {
    callback(null, "Web Worker is not supported in this environment.");
    return;
  }
  const workerBlob = new Blob([workerScript], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(workerBlob));

  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
    worker.terminate();
    callback(null, "Worker execution timed out.");
  }, timeout);

  worker.onmessage = function (event) {
    clearTimeout(timeoutId);
    if (event.data.error) {
      callback(null, event.data.error);
    } else {
      callback(event.data.result, null);
    }
  };
  worker.postMessage(code);
}

export default runScriptOnWorker;
