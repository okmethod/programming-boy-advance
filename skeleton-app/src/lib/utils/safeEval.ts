// import ts from "typescript";
import type { ToastStatus } from "$lib/utils/toastSettings";

export type AllowedGlobals = Record<string, unknown>;

/**
function compileTypeScript(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2023,
      sourceMap: false,
    },
  });
  return result.outputText;
}
**/

const proxy = (allowedGlobals: AllowedGlobals) => {
  return new Proxy(allowedGlobals, {
    has: (target, key) => {
      if (key in target) {
        return true;
      }
      throw new Error(`"${String(key)}" is not exist or not allowed.`);
    },
    get: (target, key) => {
      if (typeof key === "string" && key in target) {
        return target[key];
      }
      return undefined;
    },
  });
};

function safeEval(code: string, allowedGlobals: AllowedGlobals): unknown {
  const functionBody = `with (proxy) { "use strict"; ${code} }`;
  return new Function("proxy", functionBody)(proxy(allowedGlobals));
}

export function executeEval(
  code: string,
  allowedGlobals: AllowedGlobals,
): { resultString: string | null; message: string; status: ToastStatus } {
  let message: string;
  let status: ToastStatus;
  let resultString: string | null;

  if (!code) {
    message = "Code is empty.";
    status = "Warning";
    resultString = null;
  } else {
    try {
      // const compiledCode = compileTypeScript(code);
      const result = safeEval(code, allowedGlobals);
      if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
        resultString = String(result);
      } else if (Array.isArray(result) || typeof result === "object") {
        resultString = JSON.stringify(result, null, 2);
      } else {
        resultString = "(No Results)";
      }
      message = "Executed successfully.";
      status = "Succeed";
    } catch (error: unknown) {
      console.error("Failed to execute code:", error);
      resultString = "(Failed)";
      message = error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError";
      status = "Error";
    }
  }

  return { resultString, message, status };
}
