export type AllowedGlobals = Record<string, unknown>;

const proxy = (allowedGlobals: AllowedGlobals) => {
  return new Proxy(allowedGlobals, {
    // has: () => true,
    get: (target, prop) => {
      if (typeof prop === "string" && prop in target) {
        return target[prop];
      }
      return undefined;
    },
  });
};

const executeCode = (code: string, proxy: AllowedGlobals) => {
  return new Function("proxy", `with (proxy) { "use strict"; ${code} }`)(proxy);
};

export function safeEval(code: string, allowedGlobals: AllowedGlobals): unknown {
  return executeCode(code, proxy(allowedGlobals));
}

export function executeEval(
  code: string,
  allowedGlobals: AllowedGlobals,
): { resultString: string; message: string; succeed: boolean } {
  let message = "";
  let succeed = false;
  let resultString = "";

  if (!code) {
    message = "Code is empty.";
    succeed = true;
  } else {
    try {
      const result = safeEval(code, allowedGlobals);
      if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
        resultString = String(result);
      } else if (Array.isArray(result) || typeof result === "object") {
        resultString = JSON.stringify(result, null, 2);
      } else {
        resultString = "(No Results)";
      }
      message = "Executed successfully.";
      succeed = true;
    } catch (error: unknown) {
      console.error("Failed to execute code:", error);
      resultString = "(Failed)";
      message = error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError";
      succeed = false;
    }
  }

  return { resultString, message, succeed };
}
