var e,t;import{B as r}from"./scheduler.CHlWy87h.js";import{w as n}from"./index.DbCp0gDc.js";function o(e){for(const t in e)e[t]=decodeURIComponent(e[t]);return e}function a({href:e}){return e.split("#")[0]}new URL("sveltekit-internal://");const s=["href","pathname","search","toString","toJSON"];function l(e,t,r){const n=new URL(e);Object.defineProperty(n,"searchParams",{value:new Proxy(n.searchParams,{get(e,n){if("get"===n||"getAll"===n||"has"===n)return t=>(r(t),e[n](t));t();const o=Reflect.get(e,n);return"function"==typeof o?o.bind(e):o}}),enumerable:!0,configurable:!0});for(const o of s)Object.defineProperty(n,o,{get:()=>(t(),e[o]),enumerable:!0,configurable:!0});return n}const i="/__data.json",u=".html__data.json";const c=window.fetch;window.fetch=(e,t)=>("GET"!==(e instanceof Request?e.method:(null==t?void 0:t.method)||"GET")&&d.delete(p(e)),c(e,t));const d=new Map;function f(e,t){const r=p(e,t),n=document.querySelector(r);if(null==n?void 0:n.textContent){let{body:e,...t}=JSON.parse(n.textContent);const o=n.getAttribute("data-ttl");o&&d.set(r,{body:e,init:t,ttl:1e3*Number(o)});return null!==n.getAttribute("data-b64")&&(e=function(e){const t=atob(e),r=new Uint8Array(t.length);for(let n=0;n<t.length;n++)r[n]=t.charCodeAt(n);return r.buffer}(e)),Promise.resolve(new Response(e,t))}return window.fetch(e,t)}function p(e,t){let r=`script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request?e.url:e)}]`;if((null==t?void 0:t.headers)||(null==t?void 0:t.body)){const e=[];t.headers&&e.push([...new Headers(t.headers)].join(",")),t.body&&("string"==typeof t.body||ArrayBuffer.isView(t.body))&&e.push(t.body),r+=`[data-hash="${function(...e){let t=5381;for(const r of e)if("string"==typeof r){let e=r.length;for(;e;)t=33*t^r.charCodeAt(--e)}else{if(!ArrayBuffer.isView(r))throw new TypeError("value must be a string or TypedArray");{const e=new Uint8Array(r.buffer,r.byteOffset,r.byteLength);let n=e.length;for(;n;)t=33*t^e[--n]}}return(t>>>0).toString(36)}(...e)}"]`}return r}const h=/^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;function m(e){const t=[];var r;return{pattern:"/"===e?/^\/$/:new RegExp(`^${(r=e,r.slice(1).split("/").filter(v)).map((e=>{const r=/^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(e);if(r)return t.push({name:r[1],matcher:r[2],optional:!1,rest:!0,chained:!0}),"(?:/(.*))?";const n=/^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(e);if(n)return t.push({name:n[1],matcher:n[2],optional:!0,rest:!1,chained:!0}),"(?:/([^/]+))?";if(!e)return;const o=e.split(/\[(.+?)\](?!\])/);return"/"+o.map(((e,r)=>{if(r%2){if(e.startsWith("x+"))return g(String.fromCharCode(parseInt(e.slice(2),16)));if(e.startsWith("u+"))return g(String.fromCharCode(...e.slice(2).split("-").map((e=>parseInt(e,16)))));const n=h.exec(e),[,a,s,l,i]=n;return t.push({name:l,matcher:i,optional:!!a,rest:!!s,chained:!!s&&(1===r&&""===o[0])}),s?"(.*?)":a?"([^/]*)?":"([^/]+?)"}return g(e)})).join("")})).join("")}/?$`),params:t}}function v(e){return!/^\([^)]+\)$/.test(e)}function g(e){return e.normalize().replace(/[[\]]/g,"\\$&").replace(/%/g,"%25").replace(/\//g,"%2[Ff]").replace(/\?/g,"%3[Ff]").replace(/#/g,"%23").replace(/[.*+?^${}()|\\]/g,"\\$&")}function y({nodes:e,server_loads:t,dictionary:r,matchers:n}){const o=new Set(t);return Object.entries(r).map((([t,[r,o,l]])=>{const{pattern:i,params:u}=m(t),c={id:t,exec:e=>{const t=i.exec(e);if(t)return function(e,t,r){const n={},o=e.slice(1),a=o.filter((e=>void 0!==e));let s=0;for(let l=0;l<t.length;l+=1){const e=t[l];let i=o[l-s];if(e.chained&&e.rest&&s&&(i=o.slice(l-s,l+1).filter((e=>e)).join("/"),s=0),void 0!==i)if(e.matcher&&!r[e.matcher](i)){if(!e.optional||!e.chained)return;s++}else{n[e.name]=i;const r=t[l+1],u=o[l+1];r&&!r.rest&&r.optional&&u&&e.chained&&(s=0),r||u||Object.keys(n).length!==a.length||(s=0)}else e.rest&&(n[e.name]="")}if(!s)return n}(t,u,n)},errors:[1,...l||[]].map((t=>e[t])),layouts:[0,...o||[]].map(s),leaf:a(r)};return c.errors.length=c.layouts.length=Math.max(c.errors.length,c.layouts.length),c}));function a(t){const r=t<0;return r&&(t=~t),[r,e[t]]}function s(t){return void 0===t?t:[o.has(t),e[t]]}}function w(e,t=JSON.parse){try{return t(sessionStorage[e])}catch{}}function b(e,t,r=JSON.stringify){const n=r(t);try{sessionStorage[e]=n}catch{}}const k=(null==(e=globalThis.__sveltekit_16rquvu)?void 0:e.base)??"/programming-boy-advance",E=(null==(t=globalThis.__sveltekit_16rquvu)?void 0:t.assets)??k,S="sveltekit:snapshot",_="sveltekit:scroll",R="sveltekit:states",A="sveltekit:pageurl",x="sveltekit:history",P="sveltekit:navigation",L={tap:1,hover:2,viewport:3,eager:4,off:-1,false:-1},U=location.origin;function j(e){if(e instanceof URL)return e;let t=document.baseURI;if(!t){const e=document.getElementsByTagName("base");t=e.length?e[0].href:document.URL}return new URL(e,t)}function O(){return{x:pageXOffset,y:pageYOffset}}function T(e,t){return e.getAttribute(`data-sveltekit-${t}`)}const $={...L,"":L.hover};function I(e){let t=e.assignedSlot??e.parentNode;return 11===(null==t?void 0:t.nodeType)&&(t=t.host),t}function C(e,t){for(;e&&e!==t;){if("A"===e.nodeName.toUpperCase()&&e.hasAttribute("href"))return e;e=I(e)}}function N(e,t){let r;try{r=new URL(e instanceof SVGAElement?e.href.baseVal:e.href,document.baseURI)}catch{}const n=e instanceof SVGAElement?e.target.baseVal:e.target;return{url:r,external:!r||!!n||B(r,t)||(e.getAttribute("rel")||"").split(/\s+/).includes("external"),target:n,download:(null==r?void 0:r.origin)===U&&e.hasAttribute("download")}}function D(e){let t=null,r=null,n=null,o=null,a=null,s=null,l=e;for(;l&&l!==document.documentElement;)null===n&&(n=T(l,"preload-code")),null===o&&(o=T(l,"preload-data")),null===t&&(t=T(l,"keepfocus")),null===r&&(r=T(l,"noscroll")),null===a&&(a=T(l,"reload")),null===s&&(s=T(l,"replacestate")),l=I(l);function i(e){switch(e){case"":case"true":return!0;case"off":case"false":return!1;default:return}}return{preload_code:$[n??"off"],preload_data:$[o??"off"],keepfocus:i(t),noscroll:i(r),reload:i(a),replace_state:i(s)}}function q(e){const t=n(e);let r=!0;return{notify:function(){r=!0,t.update((e=>e))},set:function(e){r=!1,t.set(e)},subscribe:function(e){let n;return t.subscribe((t=>{(void 0===n||r&&t!==n)&&e(n=t)}))}}}function V(){const{set:e,subscribe:t}=n(!1);let r;return{subscribe:t,check:async function(){clearTimeout(r);try{const t=await fetch(`${E}/app/version.json`,{headers:{pragma:"no-cache","cache-control":"no-cache"}});if(!t.ok)return!1;const n="1725754698618"!==(await t.json()).version;return n&&(e(!0),clearTimeout(r)),n}catch{return!1}}}}function B(e,t){return e.origin!==U||!e.pathname.startsWith(t)}const F=-1,M=-2,J=-3,W=-4,G=-5,H=-6;const K=new Set(["load","prerender","csr","ssr","trailingSlash","config"]);class z{constructor(e,t){this.status=e,this.body="string"==typeof t?{message:t}:t||{message:`Error: ${e}`}}toString(){return JSON.stringify(this.body)}}class X{constructor(e,t){this.status=e,this.location=t}}class Y extends Error{constructor(e,t,r){super(r),this.status=e,this.text=t}}const Q="x-sveltekit-invalidated",Z="x-sveltekit-trailing-slash";function ee(e){return e instanceof z||e instanceof Y?e.status:500}const te=w(_)??{},re=w(S)??{},ne={url:q({}),page:q({}),navigating:n(null),updated:V()};function oe(e){te[e]=O()}function ae(e){return location.href=e.href,new Promise((()=>{}))}function se(){}let le,ie,ue,ce,de,fe;const pe=[],he=[];let me=null;const ve=[],ge=[];let ye,we,be,ke,Ee,Se=[],_e={branch:[],error:null,url:null},Re=!1,Ae=!1,xe=!0,Pe=!1,Le=!1,Ue=!1,je=!1;const Oe=new Set;async function Te(e,t,r){var n,o;document.URL!==location.href&&(location.href=location.href),fe=e,le=y(e),ce=document.documentElement,de=t,ie=e.nodes[0],ue=e.nodes[1],ie(),ue(),we=null==(n=history.state)?void 0:n[x],be=null==(o=history.state)?void 0:o[P],we||(we=be=Date.now(),history.replaceState({...history.state,[x]:we,[P]:be},""));const s=te[we];s&&(history.scrollRestoration="manual",scrollTo(s.x,s.y)),r?await async function(e,{status:t=200,error:r,node_ids:n,params:o,route:a,data:s,form:l}){Re=!0;const i=new URL(location.href);let u;({params:o={},route:a={id:null}}=Ke(i,!1)||{});try{const e=n.map((async(t,r)=>{const n=s[r];return(null==n?void 0:n.uses)&&(n.uses=rt(n.uses)),Be({loader:fe.nodes[t],url:i,params:o,route:a,parent:async()=>{const t={};for(let n=0;n<r;n+=1)Object.assign(t,(await e[n]).data);return t},server_data_node:Me(n)})})),c=await Promise.all(e),d=le.find((({id:e})=>e===a.id));if(d){const e=d.layouts;for(let t=0;t<e.length;t++)e[t]||c.splice(t,0,void 0)}u=Ve({url:i,params:o,branch:c,status:t,error:r,form:l,route:d??null})}catch(c){if(c instanceof X)return void(await ae(new URL(c.location,location.href)));u=await He({status:ee(c),error:await Ze(c,{url:i,params:o,route:a}),url:i,route:a})}u.props.page&&(u.props.page.state={});qe(u,e,!0)}(de,r):et(location.href,{replaceState:!0}),function(){var e;history.scrollRestoration="manual",addEventListener("beforeunload",(e=>{let t=!1;if(Ce(),!Pe){const e=nt(_e,void 0,null,"leave"),r={...e.navigation,cancel:()=>{t=!0,e.reject(new Error("navigation cancelled"))}};ve.forEach((e=>e(r)))}t?(e.preventDefault(),e.returnValue=""):history.scrollRestoration="auto"})),addEventListener("visibilitychange",(()=>{"hidden"===document.visibilityState&&Ce()})),(null==(e=navigator.connection)?void 0:e.saveData)||function(){let e;function t(e){n(e.composedPath()[0],1)}ce.addEventListener("mousemove",(t=>{const r=t.target;clearTimeout(e),e=setTimeout((()=>{n(r,2)}),20)})),ce.addEventListener("mousedown",t),ce.addEventListener("touchstart",t,{passive:!0});const r=new IntersectionObserver((e=>{for(const t of e)t.isIntersecting&&(De(t.target.href),r.unobserve(t.target))}),{threshold:0});function n(e,t){const r=C(e,ce);if(!r)return;const{url:n,external:o,download:a}=N(r,k);if(o||a)return;const s=D(r);if(!s.reload)if(t<=s.preload_data){const e=Ke(n,!1);e&&async function(e){if(e.id!==(null==me?void 0:me.id)){const t={};Oe.add(t),me={id:e.id,token:t,promise:We({...e,preload:t}).then((e=>(Oe.delete(t),"loaded"===e.type&&e.state.error&&(me=null),e)))}}me.promise}(e)}else t<=s.preload_code&&De(n.pathname)}function o(){r.disconnect();for(const e of ce.querySelectorAll("a")){const{url:t,external:n,download:o}=N(e,k);if(n||o)continue;const a=D(e);a.reload||(a.preload_code===L.viewport&&r.observe(e),a.preload_code===L.eager&&De(t.pathname))}}Se.push(o),o()}();ce.addEventListener("click",(async e=>{var r;if(e.button||1!==e.which)return;if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;if(e.defaultPrevented)return;const n=C(e.composedPath()[0],ce);if(!n)return;const{url:o,external:s,target:l,download:i}=N(n,k);if(!o)return;if("_parent"===l||"_top"===l){if(window.parent!==window)return}else if(l&&"_self"!==l)return;const u=D(n);if(!(n instanceof SVGAElement)&&o.protocol!==location.protocol&&"https:"!==o.protocol&&"http:"!==o.protocol)return;if(i)return;if(s||u.reload)return void(Xe({url:o,type:"link"})?Pe=!0:e.preventDefault());const[c,d]=o.href.split("#");if(void 0!==d&&c===a(location)){const[,a]=_e.url.href.split("#");if(a===d)return e.preventDefault(),void(""===d||"top"===d&&null===n.ownerDocument.getElementById("top")?window.scrollTo({top:0}):null==(r=n.ownerDocument.getElementById(d))||r.scrollIntoView());if(Le=!0,oe(we),t(o),!u.replace_state)return;Le=!1}e.preventDefault(),await new Promise((e=>{requestAnimationFrame((()=>{setTimeout(e,0)})),setTimeout(e,100)})),Ye({type:"link",url:o,keepfocus:u.keepfocus,noscroll:u.noscroll,replace_state:u.replace_state??o.href===location.href})})),ce.addEventListener("submit",(e=>{if(e.defaultPrevented)return;const t=HTMLFormElement.prototype.cloneNode.call(e.target),r=e.submitter;if("get"!==((null==r?void 0:r.formMethod)||t.method))return;const n=new URL((null==r?void 0:r.hasAttribute("formaction"))&&(null==r?void 0:r.formAction)||t.action);if(B(n,k))return;const o=e.target,a=D(o);if(a.reload)return;e.preventDefault(),e.stopPropagation();const s=new FormData(o),l=null==r?void 0:r.getAttribute("name");l&&s.append(l,(null==r?void 0:r.getAttribute("value"))??""),n.search=new URLSearchParams(s).toString(),Ye({type:"form",url:n,keepfocus:a.keepfocus,noscroll:a.noscroll,replace_state:a.replace_state??n.href===location.href})})),addEventListener("popstate",(async e=>{var r;if(null==(r=e.state)?void 0:r[x]){const r=e.state[x];if(Ee={},r===we)return;const n=te[r],o=e.state[R]??{},s=new URL(e.state[A]??location.href),l=e.state[P],i=a(location)===a(_e.url);if(l===be&&(Ue||i))return t(s),te[we]=O(),n&&scrollTo(n.x,n.y),o!==ke.state&&(ke={...ke,state:o},ye.$set({page:ke})),void(we=r);const u=r-we;await Ye({type:"popstate",url:s,popped:{state:o,scroll:n,delta:u},accept:()=>{we=r,be=l},block:()=>{history.go(-u)},nav_token:Ee})}else if(!Le){t(new URL(location.href))}})),addEventListener("hashchange",(()=>{Le&&(Le=!1,history.replaceState({...history.state,[x]:++we,[P]:be},"",location.href))}));for(const r of document.querySelectorAll("link"))"icon"===r.rel&&(r.href=r.href);function t(e){_e.url=e,ne.page.set({...ke,url:e}),ne.page.notify()}addEventListener("pageshow",(e=>{e.persisted&&ne.navigating.set(null)}))}()}function $e(e){he.some((e=>null==e?void 0:e.snapshot))&&(re[e]=he.map((e=>{var t;return null==(t=null==e?void 0:e.snapshot)?void 0:t.capture()})))}function Ie(e){var t;null==(t=re[e])||t.forEach(((e,t)=>{var r,n;null==(n=null==(r=he[t])?void 0:r.snapshot)||n.restore(e)}))}function Ce(){oe(we),b(_,te),$e(be),b(S,re)}async function Ne(e,t,r,n){return Ye({type:"goto",url:j(e),keepfocus:t.keepFocus,noscroll:t.noScroll,replace_state:t.replaceState,state:t.state,redirect_count:r,nav_token:n,accept:()=>{t.invalidateAll&&(je=!0)}})}async function De(e){const t=le.find((t=>t.exec(ze(e))));t&&await Promise.all([...t.layouts,t.leaf].map((e=>null==e?void 0:e[1]())))}function qe(e,t,r){var n;_e=e.state;const o=document.querySelector("style[data-sveltekit]");o&&o.remove(),ke=e.props.page,ye=new fe.root({target:t,props:{...e.props,stores:ne,components:he},hydrate:r}),Ie(be);const a={from:null,to:{params:_e.params,route:{id:(null==(n=_e.route)?void 0:n.id)??null},url:new URL(location.href)},willUnload:!1,type:"enter",complete:Promise.resolve()};Se.forEach((e=>e(a))),Ae=!0}function Ve({url:e,params:t,branch:r,status:n,error:o,route:a,form:s}){let l="never";if(!k||e.pathname!==k&&e.pathname!==k+"/")for(const m of r)void 0!==(null==m?void 0:m.slash)&&(l=m.slash);else l="always";var i,u;e.pathname=(i=e.pathname,u=l,"/"===i||"ignore"===u?i:"never"===u?i.endsWith("/")?i.slice(0,-1):i:"always"!==u||i.endsWith("/")?i:i+"/"),e.search=e.search;const c={type:"loaded",state:{url:e,params:t,branch:r,error:o,route:a},props:{constructors:(d=r,d.filter((e=>null!=e))).map((e=>e.node.component)),page:ke}};var d;void 0!==s&&(c.props.form=s);let f={},p=!ke,h=0;for(let m=0;m<Math.max(r.length,_e.branch.length);m+=1){const e=r[m],t=_e.branch[m];(null==e?void 0:e.data)!==(null==t?void 0:t.data)&&(p=!0),e&&(f={...f,...e.data},p&&(c.props[`data_${h}`]=f),h+=1)}return(!_e.url||e.href!==_e.url.href||_e.error!==o||void 0!==s&&s!==ke.form||p)&&(c.props.page={error:o,params:t,route:{id:(null==a?void 0:a.id)??null},state:{},status:n,url:new URL(e),form:s??null,data:p?f:ke.data}),c}async function Be({loader:e,parent:t,url:r,params:n,route:o,server_data_node:a}){var s,i,u;let c=null,h=!0;const m={dependencies:new Set,params:new Set,parent:!1,route:!1,url:!1,search_params:new Set},v=await e();if(null==(s=v.universal)?void 0:s.load){let e=function(...e){for(const t of e){const{href:e}=new URL(t,r);m.dependencies.add(e)}};const s={route:new Proxy(o,{get:(e,t)=>(h&&(m.route=!0),e[t])}),params:new Proxy(n,{get:(e,t)=>(h&&m.params.add(t),e[t])}),data:(null==a?void 0:a.data)??null,url:l(r,(()=>{h&&(m.url=!0)}),(e=>{h&&m.search_params.add(e)})),async fetch(t,n){let o;t instanceof Request?(o=t.url,n={body:"GET"===t.method||"HEAD"===t.method?void 0:await t.blob(),cache:t.cache,credentials:t.credentials,headers:t.headers,integrity:t.integrity,keepalive:t.keepalive,method:t.method,mode:t.mode,redirect:t.redirect,referrer:t.referrer,referrerPolicy:t.referrerPolicy,signal:t.signal,...n}):o=t;const a=new URL(o,r);return h&&e(a.href),a.origin===r.origin&&(o=a.href.slice(r.origin.length)),Ae?function(e,t,r){if(d.size>0){const t=p(e,r),n=d.get(t);if(n){if(performance.now()<n.ttl&&["default","force-cache","only-if-cached",void 0].includes(null==r?void 0:r.cache))return new Response(n.body,n.init);d.delete(t)}}return window.fetch(t,r)}(o,a.href,n):f(o,n)},setHeaders:()=>{},depends:e,parent:()=>(h&&(m.parent=!0),t()),untrack(e){h=!1;try{return e()}finally{h=!0}}};c=await v.universal.load.call(null,s)??null}return{node:v,loader:e,server:a,universal:(null==(i=v.universal)?void 0:i.load)?{type:"data",data:c,uses:m}:null,data:c??(null==a?void 0:a.data)??null,slash:(null==(u=v.universal)?void 0:u.trailingSlash)??(null==a?void 0:a.slash)}}function Fe(e,t,r,n,o,a){if(je)return!0;if(!o)return!1;if(o.parent&&e)return!0;if(o.route&&t)return!0;if(o.url&&r)return!0;for(const s of o.search_params)if(n.has(s))return!0;for(const s of o.params)if(a[s]!==_e.params[s])return!0;for(const s of o.dependencies)if(pe.some((e=>e(new URL(s)))))return!0;return!1}function Me(e,t){return"data"===(null==e?void 0:e.type)?e:"skip"===(null==e?void 0:e.type)?t??null:null}function Je({error:e,url:t,route:r,params:n}){return{type:"loaded",state:{error:e,url:t,route:r,params:n,branch:[]},props:{page:ke,constructors:[]}}}async function We({id:e,invalidating:t,url:r,params:n,route:o,preload:a}){if((null==me?void 0:me.id)===e)return Oe.delete(me.token),me.promise;const{errors:s,layouts:l,leaf:i}=o,u=[...l,i];s.forEach((e=>null==e?void 0:e().catch((()=>{})))),u.forEach((e=>null==e?void 0:e[1]().catch((()=>{}))));let c=null;const d=!!_e.url&&e!==_e.url.pathname+_e.url.search,f=!!_e.route&&o.id!==_e.route.id,p=function(e,t){if(!e)return new Set(t.searchParams.keys());const r=new Set([...e.searchParams.keys(),...t.searchParams.keys()]);for(const n of r){const o=e.searchParams.getAll(n),a=t.searchParams.getAll(n);o.every((e=>a.includes(e)))&&a.every((e=>o.includes(e)))&&r.delete(n)}return r}(_e.url,r);let h=!1;const m=u.map(((e,t)=>{var r;const o=_e.branch[t],a=!!(null==e?void 0:e[0])&&((null==o?void 0:o.loader)!==e[1]||Fe(h,f,d,p,null==(r=o.server)?void 0:r.uses,n));return a&&(h=!0),a}));if(m.some(Boolean)){try{c=await tt(r,m)}catch(b){const t=await Ze(b,{url:r,params:n,route:{id:e}});return Oe.has(a)?Je({error:t,url:r,params:n,route:o}):He({status:ee(b),error:t,url:r,route:o})}if("redirect"===c.type)return c}const v=null==c?void 0:c.nodes;let g=!1;const y=u.map((async(e,t)=>{var a;if(!e)return;const s=_e.branch[t],l=null==v?void 0:v[t];if(!(l&&"skip"!==l.type||e[1]!==(null==s?void 0:s.loader)||Fe(g,f,d,p,null==(a=s.universal)?void 0:a.uses,n)))return s;if(g=!0,"error"===(null==l?void 0:l.type))throw l;return Be({loader:e[1],url:r,params:n,route:o,parent:async()=>{var e;const r={};for(let n=0;n<t;n+=1)Object.assign(r,null==(e=await y[n])?void 0:e.data);return r},server_data_node:Me(void 0===l&&e[0]?{type:"skip"}:l??null,e[0]?null==s?void 0:s.server:void 0)})}));for(const E of y)E.catch((()=>{}));const w=[];for(let E=0;E<u.length;E+=1)if(u[E])try{w.push(await y[E])}catch(k){if(k instanceof X)return{type:"redirect",location:k.location};if(Oe.has(a))return Je({error:await Ze(k,{params:n,url:r,route:{id:o.id}}),url:r,params:n,route:o});let e,t=ee(k);if(null==v?void 0:v.includes(k))t=k.status??t,e=k.error;else if(k instanceof z)e=k.body;else{if(await ne.updated.check())return await ae(r);e=await Ze(k,{params:n,url:r,route:{id:o.id}})}const l=await Ge(E,w,s);return l?Ve({url:r,params:n,branch:w.slice(0,l.idx).concat(l.node),status:t,error:e,route:o}):await Qe(r,{id:o.id},e,t)}else w.push(void 0);return Ve({url:r,params:n,branch:w,status:200,error:null,route:o,form:t?void 0:null})}async function Ge(e,t,r){for(;e--;)if(r[e]){let n=e;for(;!t[n];)n-=1;try{return{idx:n+1,node:{node:await r[e](),loader:r[e],data:{},server:null,universal:null}}}catch{continue}}}async function He({status:e,error:t,url:r,route:n}){const o={};let a=null;if(0===fe.server_loads[0])try{const e=await tt(r,[!0]);if("data"!==e.type||e.nodes[0]&&"data"!==e.nodes[0].type)throw 0;a=e.nodes[0]??null}catch{(r.origin!==U||r.pathname!==location.pathname||Re)&&await ae(r)}return Ve({url:r,params:o,branch:[await Be({loader:ie,url:r,params:o,route:n,parent:()=>Promise.resolve({}),server_data_node:Me(a)}),{node:await ue(),loader:ue,universal:null,server:null,data:null}],status:e,error:t,route:null})}function Ke(e,t){if(!e)return;if(B(e,k))return;let r;try{r=fe.hooks.reroute({url:new URL(e)})??e.pathname}catch(a){return}const n=ze(r);for(const s of le){const r=s.exec(n);if(r){return{id:e.pathname+e.search,invalidating:t,route:s,params:o(r),url:e}}}}function ze(e){return function(e){return e.split("%25").map(decodeURI).join("%25")}(e.slice(k.length)||"/")}function Xe({url:e,type:t,intent:r,delta:n}){let o=!1;const a=nt(_e,r,e,t);void 0!==n&&(a.navigation.delta=n);const s={...a.navigation,cancel:()=>{o=!0,a.reject(new Error("navigation cancelled"))}};return Pe||ve.forEach((e=>e(s))),o?null:a}async function Ye({type:e,url:t,popped:n,keepfocus:o,noscroll:a,replace_state:s,state:l={},redirect_count:i=0,nav_token:u={},accept:c=se,block:d=se}){const f=Ke(t,!1),p=Xe({url:t,type:e,delta:null==n?void 0:n.delta,intent:f});if(!p)return void d();const h=we,m=be;c(),Pe=!0,Ae&&ne.navigating.set(p.navigation),Ee=u;let v=f&&await We(f);if(!v){if(B(t,k))return await ae(t);v=await Qe(t,{id:null},await Ze(new Y(404,"Not Found",`Not found: ${t.pathname}`),{url:t,params:{},route:{id:null}}),404)}if(t=(null==f?void 0:f.url)||t,Ee!==u)return p.reject(new Error("navigation aborted")),!1;if("redirect"===v.type){if(!(i>=20))return Ne(new URL(v.location,t).href,{},i+1,u),!1;v=await He({status:500,error:await Ze(new Error("Redirect loop"),{url:t,params:{},route:{id:null}}),url:t,route:{id:null}})}else if(v.props.page.status>=400){await ne.updated.check()&&await ae(t)}if(pe.length=0,je=!1,oe(h),$e(m),v.props.page.url.pathname!==t.pathname&&(t.pathname=v.props.page.url.pathname),l=n?n.state:l,!n){const e=s?0:1,r={[x]:we+=e,[P]:be+=e,[R]:l};(s?history.replaceState:history.pushState).call(history,r,"",t),s||function(e,t){let r=e+1;for(;te[r];)delete te[r],r+=1;for(r=t+1;re[r];)delete re[r],r+=1}(we,be)}if(me=null,v.props.page.state=l,Ae){_e=v.state,v.props.page&&(v.props.page.url=t);const e=(await Promise.all(ge.map((e=>e(p.navigation))))).filter((e=>"function"==typeof e));if(e.length>0){let t=function(){Se=Se.filter((t=>!e.includes(t)))};e.push(t),Se.push(...e)}ye.$set(v.props),Ue=!0}else qe(v,de,!1);const{activeElement:g}=document;await r();const y=n?n.scroll:a?O():null;if(xe){const e=t.hash&&document.getElementById(decodeURIComponent(t.hash.slice(1)));y?scrollTo(y.x,y.y):e?e.scrollIntoView():scrollTo(0,0)}const w=document.activeElement!==g&&document.activeElement!==document.body;o||w||function(){const e=document.querySelector("[autofocus]");if(e)e.focus();else{const e=document.body,t=e.getAttribute("tabindex");e.tabIndex=-1,e.focus({preventScroll:!0,focusVisible:!1}),null!==t?e.setAttribute("tabindex",t):e.removeAttribute("tabindex");const r=getSelection();if(r&&"None"!==r.type){const e=[];for(let t=0;t<r.rangeCount;t+=1)e.push(r.getRangeAt(t));setTimeout((()=>{if(r.rangeCount===e.length){for(let t=0;t<r.rangeCount;t+=1){const n=e[t],o=r.getRangeAt(t);if(n.commonAncestorContainer!==o.commonAncestorContainer||n.startContainer!==o.startContainer||n.endContainer!==o.endContainer||n.startOffset!==o.startOffset||n.endOffset!==o.endOffset)return}r.removeAllRanges()}}))}}}(),xe=!0,v.props.page&&(ke=v.props.page),Pe=!1,"popstate"===e&&Ie(be),p.fulfil(void 0),Se.forEach((e=>e(p.navigation))),ne.navigating.set(null)}async function Qe(e,t,r,n){return e.origin!==U||e.pathname!==location.pathname||Re?await ae(e):await He({status:n,error:r,url:e,route:t})}function Ze(e,t){if(e instanceof z)return e.body;const r=ee(e),n=function(e){return e instanceof Y?e.text:"Internal Error"}(e);return fe.hooks.handleError({error:e,event:t,status:r,message:n})??{message:n}}function et(e,t={}){return(e=j(e)).origin!==U?Promise.reject(new Error("goto: invalid URL")):Ne(e,t,0)}async function tt(e,t){var r;const n=new URL(e);var o;n.pathname=(o=e.pathname).endsWith(".html")?o.replace(/\.html$/,u):o.replace(/\/$/,"")+i,e.pathname.endsWith("/")&&n.searchParams.append(Z,"1"),n.searchParams.append(Q,t.map((e=>e?"1":"0")).join(""));const a=await c(n.href);if(!a.ok){let e;throw(null==(r=a.headers.get("content-type"))?void 0:r.includes("application/json"))?e=await a.json():404===a.status?e="Not Found":500===a.status&&(e="Internal Error"),new z(a.status,e)}return new Promise((async e=>{var t;const r=new Map,n=a.body.getReader(),o=new TextDecoder;function s(e){return function(e,t){if("number"==typeof e)return o(e,!0);if(!Array.isArray(e)||0===e.length)throw new Error("Invalid input");const r=e,n=Array(r.length);function o(e,a=!1){if(e===F)return;if(e===J)return NaN;if(e===W)return 1/0;if(e===G)return-1/0;if(e===H)return-0;if(a)throw new Error("Invalid input");if(e in n)return n[e];const s=r[e];if(s&&"object"==typeof s)if(Array.isArray(s))if("string"==typeof s[0]){const r=s[0],a=null==t?void 0:t[r];if(a)return n[e]=a(o(s[1]));switch(r){case"Date":n[e]=new Date(s[1]);break;case"Set":const t=new Set;n[e]=t;for(let e=1;e<s.length;e+=1)t.add(o(s[e]));break;case"Map":const a=new Map;n[e]=a;for(let e=1;e<s.length;e+=2)a.set(o(s[e]),o(s[e+1]));break;case"RegExp":n[e]=new RegExp(s[1],s[2]);break;case"Object":n[e]=Object(s[1]);break;case"BigInt":n[e]=BigInt(s[1]);break;case"null":const l=Object.create(null);n[e]=l;for(let e=1;e<s.length;e+=2)l[s[e]]=o(s[e+1]);break;default:throw new Error(`Unknown type ${r}`)}}else{const t=new Array(s.length);n[e]=t;for(let e=0;e<s.length;e+=1){const r=s[e];r!==M&&(t[e]=o(r))}}else{const t={};n[e]=t;for(const e in s){const r=s[e];t[e]=o(r)}}else n[e]=s;return n[e]}return o(0)}(e,{Promise:e=>new Promise(((t,n)=>{r.set(e,{fulfil:t,reject:n})}))})}let l="";for(;;){const{done:a,value:i}=await n.read();if(a&&!l)break;for(l+=!i&&l?"\n":o.decode(i,{stream:!0});;){const n=l.indexOf("\n");if(-1===n)break;const o=JSON.parse(l.slice(0,n));if(l=l.slice(n+1),"redirect"===o.type)return e(o);if("data"===o.type)null==(t=o.nodes)||t.forEach((e=>{"data"===(null==e?void 0:e.type)&&(e.uses=rt(e.uses),e.data=s(e.data))})),e(o);else if("chunk"===o.type){const{id:e,data:t,error:n}=o,a=r.get(e);r.delete(e),n?a.reject(s(n)):a.fulfil(s(t))}}}}))}function rt(e){return{dependencies:new Set((null==e?void 0:e.dependencies)??[]),params:new Set((null==e?void 0:e.params)??[]),parent:!!(null==e?void 0:e.parent),route:!!(null==e?void 0:e.route),url:!!(null==e?void 0:e.url),search_params:new Set((null==e?void 0:e.search_params)??[])}}function nt(e,t,r,n){var o,a;let s,l;const i=new Promise(((e,t)=>{s=e,l=t}));i.catch((()=>{}));return{navigation:{from:{params:e.params,route:{id:(null==(o=e.route)?void 0:o.id)??null},url:e.url},to:r&&{params:(null==t?void 0:t.params)??null,route:{id:(null==(a=null==t?void 0:t.route)?void 0:a.id)??null},url:r},willUnload:!t,type:n,complete:i},fulfil:s,reject:l}}export{Te as a,k as b,et as g,ne as s};
