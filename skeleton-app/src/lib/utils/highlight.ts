import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml"; // for HTML
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/github-dark.css";

// Skeleton v5 で storeHighlightJs が廃止されたため、highlight.js を直接構成して共有する
hljs.registerLanguage("xml", xml); // for HTML
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);

export default hljs;
