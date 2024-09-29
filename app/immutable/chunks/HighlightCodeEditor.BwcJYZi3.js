import{s as e,e as t,a,t as o,c as s,b as n,g as r,f as c,d as l,h as i,i as d,j as u,r as g,k as f,n as h,T as m,K as p}from"./scheduler.CSycGpb7.js";import{S as v,i as E}from"./index.Bvdk1IJ9.js";import{g as w,s as b}from"./stores.8Bjpy7Uc.js";import"./ProgressBar.svelte_svelte_type_style_lang.CxFzStii.js";const y={Succeed:{cBackground:"bg-green-100",autohide:!0},Warning:{cBackground:"bg-yellow-100",autohide:!0},Error:{cBackground:"bg-red-100",autohide:!1}};function $(e,t){const a=y[t];return{message:e,background:`${a.cBackground} select-none`,timeout:2e3,autohide:a.autohide}}function k(e){let m,p,v,E,w,b,y,$,k,L,S,T,P;return{c(){m=t("div"),p=t("textarea"),v=a(),E=t("pre"),w=o("    "),b=t("code"),y=o("\n      "),$=o(e[0]),k=o("\n    "),S=o("\n  "),this.h()},l(t){m=s(t,"DIV",{class:!0});var a=n(m);p=s(a,"TEXTAREA",{id:!0,rows:!0,cols:!0,class:!0}),n(p).forEach(r),v=c(a),E=s(a,"PRE",{class:!0});var o=n(E);w=l(o,"    "),b=s(o,"CODE",{id:!0,class:!0});var i=n(b);y=l(i,"\n      "),$=l(i,e[0]),k=l(i,"\n    "),i.forEach(r),S=l(o,"\n  "),o.forEach(r),a.forEach(r),this.h()},h(){i(p,"id",e[2]),p.value=e[0],i(p,"rows",x),i(p,"cols",j),i(p,"class",B+" p-4 border border-gray-300 rounded-md font-mono text-transparent bg-transparent caret-white custom-selection resize-none whitespace-nowrap overflow-hidden absolute top-0 left-0 z-10 svelte-maoyn7"),i(b,"id",e[3]),i(b,"class",L=e[1]+" h-full w-full rounded-md svelte-maoyn7"),i(E,"class",B+" relative -top-6 z-0 svelte-maoyn7"),i(m,"class","relative h-full")},m(t,a){d(t,m,a),u(m,p),u(m,v),u(m,E),u(E,w),u(E,b),u(b,y),u(b,$),u(b,k),u(E,S),T||(P=g(p,"input",e[4]),T=!0)},p(e,[t]){1&t&&(p.value=e[0]),1&t&&f($,e[0]),2&t&&L!==(L=e[1]+" h-full w-full rounded-md svelte-maoyn7")&&i(b,"class",L)},i:h,o:h,d(e){e&&r(m),T=!1,P()}}}const x=12,j=36,B="w-96 h-80";function L(e){let t=0;for(const a of e){const e=a.codePointAt(0);t+=e&&(e>255||e<32)?2:1}return t}function S(e,t,a){let{code:o}=t,{cLanguage:s}=t;const n=Math.random().toString(36).slice(2,11),r=`code-editor-${n}`,c=`code-block-${n}`,l=w(),i=m(b);function d(e=void 0){if(e){const t=e.target,s=t.value.split("\n");if(u(s)){l.trigger($("Textarea overflow.","Warning"));const a=t.selectionStart;return e.preventDefault(),e.stopImmediatePropagation(),t.value=o,void t.setSelectionRange(a-1,a-1)}a(0,o=t.value)}!function(e,t){const a=document.getElementById(e),o=document.createElement("code");o.id=e,o.innerHTML=t,o.className=a.className,i.highlightElement(o),a.replaceWith(o)}(c,o)}const u=e=>{if(e.length>x)return!0;for(const t of e)if(L(t)>j)return!0;return!1};let g=!1;return p((()=>{d(),a(5,g=!0)})),e.$$set=e=>{"code"in e&&a(0,o=e.code),"cLanguage"in e&&a(1,s=e.cLanguage)},e.$$.update=()=>{33&e.$$.dirty&&g&&void 0!==o&&d()},[o,s,r,c,d,g]}class T extends v{constructor(t){super(),E(this,t,S,k,e,{code:0,cLanguage:1})}}export{T as H,$ as s};
