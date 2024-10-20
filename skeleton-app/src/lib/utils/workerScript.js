self.onmessage = async function (event) {
  const { code, allowedGlobals } = event.data;
  if (typeof allowedGlobals !== "string") {
    throw new Error("allowedGlobals must be a serialized string.");
  }

  let globals;
  try {
    globals = JSON.parse(allowedGlobals, (_, value) => {
      if (typeof value === "string" && value.startsWith("function")) {
        return eval(`(${value})`);
      }
      return value;
    });
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
