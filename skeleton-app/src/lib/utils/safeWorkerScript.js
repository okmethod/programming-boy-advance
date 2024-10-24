self.onmessage = async function (event) {
  const { code, allowedGlobals } = event.data;
  if (typeof allowedGlobals !== "string") {
    throw new Error("allowedGlobals must be a serialized string.");
  }

  const workerScope = self;
  const commonModules = Object.getOwnPropertyNames(workerScope).reduce((acc, key) => {
    if (key in workerScope) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: ts(7015)
      const value = workerScope[key];
      const type = typeof value;
      if (type === "function" || type === "object") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: ts(7053)
        acc[key] = value;
      }
    }
    return acc;
  }, {});
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: ts(2339)
  commonModules.setTimeout = setTimeout.bind(self);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: ts(7006)
  const createCustomFunction = (key, value) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: ts(7019)
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: ts(7053)
        commonGlobals[key] = commonModules[key];
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: ts(7053)
        customGlobals[key] = createCustomFunction(key, value);
      }
    }
  } catch {
    throw new Error("Failed to parse allowedGlobals.");
  }
  const globals = { ...commonGlobals, ...customGlobals };

  const proxy = new Proxy(globals, {
    has: (target, key) => {
      if (key in target) {
        return true;
      }
      throw new Error(`"${String(key)}" is not exist or not allowed.`);
    },
    get: (target, key) => {
      if (typeof key === "string" && key in target) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: ts(7053)
        return target[key];
      }
      return undefined;
    },
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: ts(7006)
  const wrappedCode = (userCode) => `
with (proxy) {
  return (async () => {
    ${userCode}
  })(); 
}
`;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: ts(7006)
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
      self.postMessage({ result });
    } catch (error) {
      if (error instanceof Error) {
        self.postMessage({ error: error.message });
      } else {
        self.postMessage({ error: "UnknownError" });
      }
    }
  };

  const executeRecursiveLoop = () => {
    executeCode().then(() => {
      setTimeout(executeRecursiveLoop, 0);
    });
  };
  executeRecursiveLoop();
};
