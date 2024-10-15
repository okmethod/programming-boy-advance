import type { AllowedGlobals, EvalResult } from "$lib/utils/safeEval";
import { executeEval } from "$lib/utils/safeEval";

const workerScript = `
self.onmessage = function (e) {
  const { code, allowedGlobals } = e.data;
  try {
    const executeEval = ${executeEval.toString()};
    const result = executeEval(code, allowedGlobals);
    self.postMessage({ result });
  } catch (error) {
    if (error instanceof Error) {
      self.postMessage({ error: error.message });
    } else {
      self.postMessage({ error: String(error) });
    }
  }
};
`;

export function evalWithTimeout(
  code: string,
  allowedGlobals: AllowedGlobals,
  timeout: number = 1000,
): Promise<EvalResult> {
  return new Promise((resolve, reject) => {
    const workerBlob = new Blob([workerScript], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(workerBlob));

    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Execution timed out"));
    }, timeout);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      const { result, error } = e.data;
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    };

    const serializableAllowedGlobals = JSON.parse(JSON.stringify(allowedGlobals));
    worker.postMessage({ code, allowedGlobals: serializableAllowedGlobals });
  });
}
