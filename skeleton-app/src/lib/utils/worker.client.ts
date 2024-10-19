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

function runScriptOnWorker<T>(code: string, callback: (result: T | null, error: string | null) => void): void {
  if (!browser) {
    callback(null, "Web Worker is not supported in this environment.");
    return;
  }
  const workerBlob = new Blob([workerScript], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(workerBlob));

  worker.onmessage = function (event) {
    if (event.data.error) {
      callback(null, event.data.error);
    } else {
      callback(event.data.result, null);
    }
  };
  worker.postMessage(code);
}

export default runScriptOnWorker;
