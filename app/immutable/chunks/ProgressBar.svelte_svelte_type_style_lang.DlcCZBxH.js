import{w as e,r as t}from"./index.C2xmSUYP.js";import{E as s,F as n,D as o}from"./scheduler.CkQL2NoT.js";const r=e(void 0),i={message:"Missing Toast Message",autohide:!0,timeout:5e3},a="toastStore";function c(){const e=n(a);if(!e)throw new Error("toastStore is not initialized. Please ensure that `initializeStores()` is invoked in the root layout file of this app!");return e}function u(){const t=function(){const{subscribe:t,set:s,update:n}=e([]),o=e=>n((t=>{if(t.length>0){const s=t.findIndex((t=>t.id===e)),n=t[s];n&&(n.callback&&n.callback({id:e,status:"closed"}),n.timeoutId&&clearTimeout(n.timeoutId),t.splice(s,1))}return t}));function r(e){if(!0===e.autohide)return setTimeout((()=>{o(e.id)}),e.timeout)}return{subscribe:t,close:o,trigger:e=>{const t=function(){const e=Math.random();return Number(e).toString(32)}();return n((s=>{e&&e.callback&&e.callback({id:t,status:"queued"}),e.hideDismiss&&(e.autohide=!0);const n={...i,...e,id:t};return n.timeoutId=r(n),s.push(n),s})),t},freeze:e=>n((t=>(t.length>0&&clearTimeout(t[e].timeoutId),t))),unfreeze:e=>n((t=>(t.length>0&&(t[e].timeoutId=r(t[e])),t))),clear:()=>s([])}}();return s(a,t)}const d={};function l(e){return"local"===e?localStorage:sessionStorage}function m(t,s,n){const r=JSON,i="local";function a(e,t){l(i).setItem(e,r.stringify(t))}if(!d[t]){const n=e(s,(e=>{const s=l(i).getItem(t);s&&e(r.parse(s));{const s=s=>{s.key===t&&e(s.newValue?r.parse(s.newValue):null)};return window.addEventListener("storage",s),()=>window.removeEventListener("storage",s)}})),{subscribe:c,set:u}=n;d[t]={set(e){a(t,e),u(e)},update(e){const s=e(o(n));a(t,s),u(s)},subscribe:c}}return d[t]}m("modeOsPrefers",!1),m("modeUserPrefers",void 0),m("modeCurrent",!1);const f="(prefers-reduced-motion: reduce)";const h=t(window.matchMedia(f).matches,(e=>{{const t=t=>{e(t.matches)},s=window.matchMedia(f);return s.addEventListener("change",t),()=>{s.removeEventListener("change",t)}}}));export{c as g,u as i,h as p,r as s};
