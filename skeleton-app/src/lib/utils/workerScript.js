self.onmessage = async function (event) {
  const code = event.data;
  try {
    const result = await eval(`(async () => { ${code} })()`);
    self.postMessage({ result });
  } catch (error) {
    if (error instanceof Error) {
      self.postMessage({ error: error.message });
    } else {
      self.postMessage({ error: "UnknownError" });
    }
  }
};
