import{s as t,p as e,e as s,a as l,t as r,c as o,b as n,m as c,f as a,g as i,d as h,h as u,i as f,j as d,r as g,q as v,k as p,o as m,w as x,C as b,n as w}from"../chunks/scheduler.Cs3I9vKP.js";import{S as E,i as y,f as I,b as S,d as $,m as C,t as D,a as V,e as k}from"../chunks/index.bCNU049k.js";import{e as j}from"../chunks/each.CM8PWVFx.js";import{g as T}from"../chunks/stores.RN88v8Pp.js";import"../chunks/ProgressBar.svelte_svelte_type_style_lang.D4XB-F7-.js";import{H as P,s as N}from"../chunks/HighlightCodeEditor.C1RPuRYw.js";import{e as L}from"../chunks/safeEval.DeWsJgZJ.js";function A(t,e,s){const l=t.slice();return l[1]=e[s],l}function B(t,e,s){const l=t.slice();return l[24]=e[s],l[26]=s,l}function G(t,e,s){const l=t.slice();return l[27]=e[s],l[29]=s,l}function H(t){let e,c,g,v,m,x,b,w=t[9][t[3]]+"";return{c(){e=s("div"),c=s("div"),g=s("span"),v=r("●"),m=l(),x=s("span"),b=r(w),this.h()},l(t){e=o(t,"DIV",{class:!0});var s=n(e);c=o(s,"DIV",{class:!0});var l=n(c);g=o(l,"SPAN",{class:!0});var r=n(g);v=h(r,"●"),r.forEach(i),m=a(l),x=o(l,"SPAN",{class:!0});var u=n(x);b=h(u,w),u.forEach(i),l.forEach(i),s.forEach(i),this.h()},h(){u(g,"class",_+" text-blue-500 text-2xl"),u(x,"class",_+" text-white text-sm"),u(c,"class","relative"),u(e,"class",_)},m(t,s){f(t,e,s),d(e,c),d(c,g),d(g,v),d(c,m),d(c,x),d(x,b)},p(t,e){8&e&&w!==(w=t[9][t[3]]+"")&&p(b,w)},d(t){t&&i(e)}}}function O(t){let e,r,h,g=t[7].row===t[26]&&t[7].col===t[29]&&function(){let t,e;return{c(){t=s("div"),e=s("span"),e.textContent="S",this.h()},l(s){t=o(s,"DIV",{class:!0});var l=n(t);e=o(l,"SPAN",{class:!0,"data-svelte-h":!0}),"svelte-1kggcyi"!==c(e)&&(e.textContent="S"),l.forEach(i),this.h()},h(){u(e,"class","text-blue-500"),u(t,"class",_)},m(s,l){f(s,t,l),d(t,e)},p:w,d(e){e&&i(t)}}}(),v=t[8].row===t[26]&&t[8].col===t[29]&&function(){let t,e;return{c(){t=s("div"),e=s("span"),e.textContent="G",this.h()},l(s){t=o(s,"DIV",{class:!0});var l=n(t);e=o(l,"SPAN",{class:!0,"data-svelte-h":!0}),"svelte-4qjfye"!==c(e)&&(e.textContent="G"),l.forEach(i),this.h()},h(){u(e,"class","text-blue-500"),u(t,"class",_)},m(s,l){f(s,t,l),d(t,e)},p:w,d(e){e&&i(t)}}}(),p=t[2].row===t[26]&&t[2].col===t[29]&&H(t);return{c(){e=s("div"),g&&g.c(),r=l(),v&&v.c(),h=l(),p&&p.c(),this.h()},l(t){e=o(t,"DIV",{class:!0});var s=n(e);g&&g.l(s),r=a(s),v&&v.l(s),h=a(s),p&&p.l(s),s.forEach(i),this.h()},h(){u(e,"class","relative w-10 h-10 bg-gray-200 box-border border border-gray-300"),b(e,"border-r-2",t[27].r),b(e,"border-r-black",t[27].r),b(e,"border-b-2",t[27].b),b(e,"border-b-black",t[27].b)},m(t,s){f(t,e,s),g&&g.m(e,null),d(e,r),v&&v.m(e,null),d(e,h),p&&p.m(e,null)},p(t,s){t[7].row===t[26]&&t[7].col===t[29]&&g.p(t,s),t[8].row===t[26]&&t[8].col===t[29]&&v.p(t,s),t[2].row===t[26]&&t[2].col===t[29]?p?p.p(t,s):(p=H(t),p.c(),p.m(e,null)):p&&(p.d(1),p=null)},d(t){t&&i(e),g&&g.d(),v&&v.d(),p&&p.d()}}}function z(t){let e,r,c=j(t[24]),h=[];for(let s=0;s<c.length;s+=1)h[s]=O(G(t,c,s));return{c(){e=s("div");for(let t=0;t<h.length;t+=1)h[t].c();r=l(),this.h()},l(t){e=o(t,"DIV",{class:!0});var s=n(e);for(let e=0;e<h.length;e+=1)h[e].l(s);r=a(s),s.forEach(i),this.h()},h(){u(e,"class","flex")},m(t,s){f(t,e,s);for(let l=0;l<h.length;l+=1)h[l]&&h[l].m(e,null);d(e,r)},p(t,s){if(972&s){let l;for(c=j(t[24]),l=0;l<c.length;l+=1){const o=G(t,c,l);h[l]?h[l].p(o,s):(h[l]=O(o),h[l].c(),h[l].m(e,r))}for(;l<h.length;l+=1)h[l].d(1);h.length=c.length}},d(t){t&&i(e),m(h,t)}}}function M(t){let e,l,c=t[1]+"";return{c(){e=s("span"),l=r(c),this.h()},l(t){e=o(t,"SPAN",{class:!0});var s=n(e);l=h(s,c),s.forEach(i),this.h()},h(){u(e,"class","block border border-gray-200 rounded-sm font-pixel10")},m(t,s){f(t,e,s),d(e,l)},p(t,e){1&e&&c!==(c=t[1]+"")&&p(l,c)},d(t){t&&i(e)}}}function R(t){let b,w,E,y,T,N,L,G,H,O,R,_,q,U,F,J,K,Q,W,X,Y,Z,tt,et,st,lt,rt,ot,nt,ct,at,it,ht,ut,ft,dt,gt,vt,pt,mt,xt,bt='<strong class="cIndexSpan">Maze</strong>',wt="Code Editor",Et='<div class="cButtonSpan"><span>Execute</span></div>',yt="Turns:",It="Logs",St=j(t[6]),$t=[];for(let e=0;e<St.length;e+=1)$t[e]=z(B(t,St,e));function Ct(e){t[14](e)}let Dt={cLanguage:"language-javascript"};void 0!==t[0].code&&(Dt.code=t[0].code),K=new P({props:Dt}),e.push((()=>I(K,"code",Ct)));let Vt=j(t[0].logs),kt=[];for(let e=0;e<Vt.length;e+=1)kt[e]=M(A(t,Vt,e));return{c(){b=s("div"),w=s("div"),E=s("div"),y=s("div"),T=s("div"),T.innerHTML=bt,N=l(),L=s("div");for(let t=0;t<$t.length;t+=1)$t[t].c();G=l(),H=s("div"),O=s("div"),R=s("div"),_=s("div"),q=s("strong"),q.textContent=wt,U=l(),F=s("button"),F.textContent="✕",J=l(),S(K.$$.fragment),W=l(),X=s("div"),Y=s("button"),Y.innerHTML=Et,Z=l(),tt=s("div"),et=s("div"),st=s("div"),lt=s("div"),rt=s("strong"),rt.textContent=yt,ot=l(),nt=s("span"),ct=r(t[4]),at=l(),it=s("div"),ht=s("div"),ut=s("strong"),ut.textContent=It,ft=l(),dt=s("button"),dt.textContent="✕",gt=l(),vt=s("div");for(let t=0;t<kt.length;t+=1)kt[t].c();this.h()},l(e){b=o(e,"DIV",{class:!0});var s=n(b);w=o(s,"DIV",{class:!0});var l=n(w);E=o(l,"DIV",{class:!0});var r=n(E);y=o(r,"DIV",{});var u=n(y);T=o(u,"DIV",{class:!0,"data-svelte-h":!0}),"svelte-1a9scvh"!==c(T)&&(T.innerHTML=bt),N=a(u),L=o(u,"DIV",{class:!0});var f=n(L);for(let t=0;t<$t.length;t+=1)$t[t].l(f);f.forEach(i),u.forEach(i),r.forEach(i),l.forEach(i),G=a(s),H=o(s,"DIV",{class:!0});var d=n(H);O=o(d,"DIV",{class:!0});var g=n(O);R=o(g,"DIV",{});var v=n(R);_=o(v,"DIV",{class:!0});var p=n(_);q=o(p,"STRONG",{class:!0,"data-svelte-h":!0}),"svelte-1lke8zs"!==c(q)&&(q.textContent=wt),U=a(p),F=o(p,"BUTTON",{type:!0,class:!0,"data-svelte-h":!0}),"svelte-1v3143d"!==c(F)&&(F.textContent="✕"),p.forEach(i),J=a(v),$(K.$$.fragment,v),v.forEach(i),W=a(g),X=o(g,"DIV",{class:!0});var m=n(X);Y=o(m,"BUTTON",{type:!0,class:!0,"data-svelte-h":!0}),"svelte-1xjxi6h"!==c(Y)&&(Y.innerHTML=Et),m.forEach(i),g.forEach(i),d.forEach(i),Z=a(s),tt=o(s,"DIV",{class:!0});var x=n(tt);et=o(x,"DIV",{class:!0});var I=n(et);st=o(I,"DIV",{});var S=n(st);lt=o(S,"DIV",{class:!0});var C=n(lt);rt=o(C,"STRONG",{"data-svelte-h":!0}),"svelte-bln84g"!==c(rt)&&(rt.textContent=yt),ot=a(C),nt=o(C,"SPAN",{});var D=n(nt);ct=h(D,t[4]),D.forEach(i),C.forEach(i),S.forEach(i),at=a(I),it=o(I,"DIV",{});var V=n(it);ht=o(V,"DIV",{class:!0});var k=n(ht);ut=o(k,"STRONG",{class:!0,"data-svelte-h":!0}),"svelte-r5pkvh"!==c(ut)&&(ut.textContent=It),ft=a(k),dt=o(k,"BUTTON",{type:!0,class:!0,"data-svelte-h":!0}),"svelte-24816r"!==c(dt)&&(dt.textContent="✕"),k.forEach(i),gt=a(V),vt=o(V,"DIV",{class:!0});var j=n(vt);for(let t=0;t<kt.length;t+=1)kt[t].l(j);j.forEach(i),V.forEach(i),I.forEach(i),x.forEach(i),s.forEach(i),this.h()},h(){u(T,"class","flex justify-between ml-2"),u(L,"class","bg-gray-400 border border-gray-500 p-4"),u(E,"class","flex flex-col justify-center items-center"),u(w,"class","col-span-1"),u(q,"class","cIndexSpan"),u(F,"type","submit"),u(F,"class","relative z-30"),u(_,"class","flex justify-between ml-2"),u(Y,"type","submit"),u(Y,"class","cIconButtonStyle relative"),u(X,"class","pt-2"),u(O,"class","flex flex-col justify-center items-center space-y-1"),u(H,"class","col-span-1"),u(lt,"class","flex justify-between ml-2 space-x-1"),u(ut,"class","cIndexSpan"),u(dt,"type","submit"),u(dt,"class","relative z-30"),u(ht,"class","flex justify-between ml-2"),u(vt,"class","w-96 h-40 p-4 border border-gray-500 bg-gray-100 rounded-md space-y-1 overflow-y-auto"),u(et,"class","flex flex-col justify-cetnter items-center space-y-1"),u(tt,"class","col-span-1"),u(b,"class","grid grid-cols-1 lg:grid-cols-3 justify-center items-top gap-4 m-4")},m(e,s){f(e,b,s),d(b,w),d(w,E),d(E,y),d(y,T),d(y,N),d(y,L);for(let t=0;t<$t.length;t+=1)$t[t]&&$t[t].m(L,null);d(b,G),d(b,H),d(H,O),d(O,R),d(R,_),d(_,q),d(_,U),d(_,F),d(R,J),C(K,R,null),d(O,W),d(O,X),d(X,Y),d(b,Z),d(b,tt),d(tt,et),d(et,st),d(st,lt),d(lt,rt),d(lt,ot),d(lt,nt),d(nt,ct),d(et,at),d(et,it),d(it,ht),d(ht,ut),d(ht,ft),d(ht,dt),d(it,gt),d(it,vt);for(let t=0;t<kt.length;t+=1)kt[t]&&kt[t].m(vt,null);t[15](vt),pt=!0,mt||(xt=[g(F,"click",t[11]),g(Y,"click",t[10]),g(dt,"click",t[12])],mt=!0)},p(t,[e]){if(972&e){let s;for(St=j(t[6]),s=0;s<St.length;s+=1){const l=B(t,St,s);$t[s]?$t[s].p(l,e):($t[s]=z(l),$t[s].c(),$t[s].m(L,null))}for(;s<$t.length;s+=1)$t[s].d(1);$t.length=St.length}const s={};if(!Q&&1&e&&(Q=!0,s.code=t[0].code,v((()=>Q=!1))),K.$set(s),(!pt||16&e)&&p(ct,t[4]),1&e){let s;for(Vt=j(t[0].logs),s=0;s<Vt.length;s+=1){const l=A(t,Vt,s);kt[s]?kt[s].p(l,e):(kt[s]=M(l),kt[s].c(),kt[s].m(vt,null))}for(;s<kt.length;s+=1)kt[s].d(1);kt.length=Vt.length}},i(t){pt||(D(K.$$.fragment,t),pt=!0)},o(t){V(K.$$.fragment,t),pt=!1},d(e){e&&i(b),m($t,e),k(K),m(kt,e),t[15](null),mt=!1,x(xt)}}}const _="absolute inset-0 flex items-center justify-center";function q(t){return{r:1===parseInt(t[0]),b:1===parseInt(t[1])}}function U(t,s,l){let{codeExeProps:r}=s;const o=[["10","00","01","01","00","01","00","01","01"],["10","01","01","11","10","10","01","10","00"],["10","01","01","01","10","10","10","10","00"],["01","01","01","01","10","10","10","10","00"],["00","00","01","01","10","10","10","10","00"],["10","01","01","10","01","01","10","10","00"],["10","00","11","10","00","01","01","01","01"],["10","00","01","11","01","01","01","01","00"],["10","00","00","00","00","00","00","00","00"]],n=o.map((t=>t.map(q))),c={row:o.length-1,col:0},a={row:0,col:o[0].length-1};let i={row:o.length-1,col:0};let h="up",u=0;const f={log:d,goStraight:g,turnRight:function(){l(3,h={up:"right",right:"down",down:"left",left:"up"}[h]),l(4,u++,u)},turnLeft:function(){l(3,h={up:"left",left:"down",down:"right",right:"up"}[h]),l(4,u++,u)}};function d(t){const e=`[${(new Date).toLocaleTimeString()}] ${t}`;l(0,r.logs=[...r.logs,e],r),p&&p.scrollTo({top:p.scrollHeight,behavior:"smooth"})}function g(){var t;const e={up:{row:-1,col:0,wall:"b",checkCurrentCell:!1},down:{row:1,col:0,wall:"b",checkCurrentCell:!0},left:{row:0,col:-1,wall:"r",checkCurrentCell:!1},right:{row:0,col:1,wall:"r",checkCurrentCell:!0}}[h];if(!e)return void d("goStraight(): Invalid direction.");const s=i.row+e.row,r=i.col+e.col,o=n[i.row][i.col],c=null==(t=n[s])?void 0:t[r];s>=0&&s<n.length&&r>=0&&r<n[0].length&&(e.checkCurrentCell?!o[e.wall]:!c[e.wall])?l(2,i={row:s,col:r}):d(`goStraight(): Can't move ${h}.`),l(4,u++,u)}const v=T();let p;return t.$$set=t=>{"codeExeProps"in t&&l(0,r=t.codeExeProps)},[r,d,i,h,u,p,n,c,a,{up:"⬆",down:"⬇",left:"⬅",right:"➡️"},function(){const t=L(r.code,{...f,...r.allowedGlobals});v.trigger(N(t.message,t.status)),null!==t.resultString&&l(0,r.resultString=t.resultString,r)},function(){l(0,r.code="",r)},function(){l(0,r.logs=[],r)},g,function(e){t.$$.not_equal(r.code,e)&&(r.code=e,l(0,r))},function(t){e[t?"unshift":"push"]((()=>{p=t,l(5,p)}))}]}class F extends E{constructor(e){super(),y(this,e,U,R,t,{codeExeProps:0,log:1,goStraight:13})}get log(){return this.$$.ctx[1]}get goStraight(){return this.$$.ctx[13]}}function J(t){let l,r,c,a;function h(e){t[3](e)}let d={};return void 0!==t[1]&&(d.codeExeProps=t[1]),r=new F({props:d}),t[2](r),e.push((()=>I(r,"codeExeProps",h))),{c(){l=s("div"),S(r.$$.fragment),this.h()},l(t){l=o(t,"DIV",{class:!0});var e=n(l);$(r.$$.fragment,e),e.forEach(i),this.h()},h(){u(l,"class","cRouteBodyStyle")},m(t,e){f(t,l,e),C(r,l,null),a=!0},p(t,[e]){const s={};!c&&2&e&&(c=!0,s.codeExeProps=t[1],v((()=>c=!1))),r.$set(s)},i(t){a||(D(r.$$.fragment,t),a=!0)},o(t){V(r.$$.fragment,t),a=!1},d(e){e&&i(l),t[2](null),k(r)}}}function K(t,s,l){let r,o={allowedGlobals:{},code:"goStraight()",resultString:"",logs:[]};return[r,o,function(t){e[t?"unshift":"push"]((()=>{r=t,l(0,r)}))},function(t){o=t,l(1,o)}]}class Q extends E{constructor(e){super(),y(this,e,K,J,t,{})}}export{Q as component};
