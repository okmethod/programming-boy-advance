import { writable } from "svelte/store";

const sampleCode = `return "Hello, World!";`;

const savedTestCode = typeof localStorage !== "undefined" ? localStorage.getItem("testCode") : null;

export const testCode = writable<string>(savedTestCode ?? sampleCode);

export const unsubscribeTestCode = testCode.subscribe((value: string) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("testCode", value);
  }
});
