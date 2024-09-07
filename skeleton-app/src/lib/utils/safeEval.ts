export type AllowedGlobals = Record<string, unknown>;

const proxy = (allowedGlobals: AllowedGlobals) => {
  return new Proxy(allowedGlobals, {
    has: () => true,
    get: (target, prop) => {
      if (typeof prop === "string" && prop in target) {
        return target[prop];
      }
      return undefined;
    },
  });
};

const executeCode = (proxy: AllowedGlobals, code: string) => {
  return new Function("proxy", `with (proxy) { ${code} }`)(proxy);
};

export function safeEval(allowedGlobals: AllowedGlobals, code: string): unknown {
  return executeCode(proxy(allowedGlobals), code);
}
