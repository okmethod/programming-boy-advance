// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

let isProgress = true;

self.onmessage = async function (event) {
  const { code, allowedGlobals } = event.data;
  if (typeof allowedGlobals !== "string") {
    throw new Error("allowedGlobals must be a serialized string.");
  }

  const workerScope = self;
  const commonModules = Object.getOwnPropertyNames(workerScope).reduce((acc, key) => {
    if (key in workerScope) {
      const value = workerScope[key];
      const type = typeof value;
      if (type === "function" || type === "object") acc[key] = value;
    }
    return acc;
  }, {});
  commonModules.setTimeout = setTimeout.bind(self);

  const createCustomFunction = (key, value) => {
    return async (...args) => {
      const argsWithoutFunction = args.filter((arg) => typeof arg !== "function");
      self.postMessage({ type: "invoke", functionName: key, args: argsWithoutFunction });
      await new Promise((resolve) => setTimeout(resolve, value.wait));
    };
  };

  let commonGlobals = {};
  let customGlobals = {};
  try {
    const parsedGlobals = JSON.parse(allowedGlobals);
    for (const [key, value] of Object.entries(parsedGlobals)) {
      if (key in commonModules) {
        commonGlobals[key] = commonModules[key];
      } else {
        customGlobals[key] = createCustomFunction(key, value);
      }
    }
  } catch {
    throw new Error("Failed to parse allowedGlobals.");
  }
  const globals = { ...commonGlobals, ...customGlobals };

  const proxy = new Proxy(globals, {
    has: (target, key) => {
      if (key in target) return true;
      throw new Error(`"${String(key)}" is not exist or not allowed.`);
    },
    get: (target, key) => {
      return key in target ? target[key] : undefined;
    },
  });

  const wrappedCode = (userCode) => `
with (proxy) {
  return (async () => {
    ${userCode}
  })(); 
}
`;

  const replacedCode = (userCode) => {
    let replacedCode = userCode;
    for (const key of Object.keys(customGlobals)) {
      const regex = new RegExp(`(?<!\\.)\\b${key}\\b\\(([^)]*)\\)`, "g");
      replacedCode = replacedCode.replace(regex, `await ${key}($1)`);
    }
    return replacedCode;
  };

  const executeCode = async () => {
    try {
      const result = await new Function("proxy", wrappedCode(replacedCode(code)))(proxy);
      isProgress = false;
      self.postMessage({ result: result ?? null });
    } catch (error) {
      isProgress = false;
      self.postMessage({ error: error instanceof Error ? error.message : "UnknownError" });
    }
  };

  const executeRecursiveLoop = () => {
    if (isProgress) {
      executeCode().then(() => {
        setTimeout(executeRecursiveLoop, 0);
      });
    }
  };
  executeRecursiveLoop();
};
