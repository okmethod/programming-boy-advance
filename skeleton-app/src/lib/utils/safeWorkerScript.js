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

  let globals = {};
  try {
    const parsedGlobals = JSON.parse(allowedGlobals);
    for (const [key] of Object.entries(parsedGlobals)) {
      if (key in commonModules) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: ts(7053)
        globals[key] = commonModules[key];
      }
    }
  } catch {
    throw new Error("Failed to parse allowedGlobals.");
  }

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

  try {
    const result = await new Function("proxy", `with (proxy) { return (async () => { ${code} })(); }`)(proxy);
    self.postMessage({ result });
  } catch (error) {
    if (error instanceof Error) {
      self.postMessage({ error: error.message });
    } else {
      self.postMessage({ error: "UnknownError" });
    }
  }
};
