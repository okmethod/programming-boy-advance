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

function runScriptOnWorker(code: string): void {
  if (!browser) {
    console.warn("Worker is not supported in this environment.");
    return;
  }
  const workerBlob = new Blob([workerScript], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(workerBlob));

  worker.onmessage = function (event) {
    if (event.data.error) {
      console.error("Error:", event.data.error);
    } else {
      console.log("Result:", event.data.result);
    }
  };

  worker.postMessage(code);
}

export default runScriptOnWorker;
