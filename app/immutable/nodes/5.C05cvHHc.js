import{s as t,p as s,e as a,a as e,c as n,b as l,m as o,f as r,g as c,h as i,i as u,j as d,q as p,x as $,y as f,z as h,A as m}from"../chunks/scheduler.Cs3I9vKP.js";import{S as x,i as b,f as g,b as v,d as y,m as T,t as S,a as j,e as I}from"../chunks/index.bCNU049k.js";import{C as P}from"../chunks/ContentsTabGroup.DUCW52vY.js";const _=Object.freeze(Object.defineProperty({__proto__:null,load:async function(){return{slotTabSettings:[{index:0,label:"(Index)",title:"迷路リスト",path:""},{index:1,label:"(room 1)",title:"入口",path:"room1"}]}}},Symbol.toStringTag,{value:"Module"}));function k(t){let s;const a=t[3].default,e=$(a,t,t[5],null);return{c(){e&&e.c()},l(t){e&&e.l(t)},m(t,a){e&&e.m(t,a),s=!0},p(t,n){e&&e.p&&(!s||32&n)&&f(e,a,t,t[5],s?m(a,t[5],n,null):h(t[5]),null)},i(t){s||(S(e,t),s=!0)},o(t){j(e,t),s=!1},d(t){e&&e.d(t)}}}function w(t){let $,f,h,m,x,b,_='<h1 class="cTitleStyle md:!text-3xl">迷路ゲーム</h1>';function w(s){t[4](s)}let C={tabSettings:t[1],navigatePathPrefix:"/labyrinth",cContainer:"w-full",cPanel:"max-h-[calc(100vh-12rem)] overflow-y-auto",$$slots:{default:[k]},$$scope:{ctx:t}};return void 0!==t[0]&&(C.currentTabIndex=t[0]),m=new P({props:C}),s.push((()=>g(m,"currentTabIndex",w))),{c(){$=a("div"),f=a("div"),f.innerHTML=_,h=e(),v(m.$$.fragment),this.h()},l(t){$=n(t,"DIV",{class:!0});var s=l($);f=n(s,"DIV",{class:!0,"data-svelte-h":!0}),"svelte-111pr8f"!==o(f)&&(f.innerHTML=_),h=r(s),y(m.$$.fragment,s),s.forEach(c),this.h()},h(){i(f,"class","cTitlePartStyle"),i($,"class","cRouteBodyStyle")},m(t,s){u(t,$,s),d($,f),d($,h),T(m,$,null),b=!0},p(t,[s]){const a={};32&s&&(a.$$scope={dirty:s,ctx:t}),!x&&1&s&&(x=!0,a.currentTabIndex=t[0],p((()=>x=!1))),m.$set(a)},i(t){b||(S(m.$$.fragment,t),b=!0)},o(t){j(m.$$.fragment,t),b=!1},d(t){t&&c($),I(m)}}}function C(t,s,a){let{$$slots:e={},$$scope:n}=s,{data:l}=s;const o=l.slotTabSettings;let r=0;return t.$$set=t=>{"data"in t&&a(2,l=t.data),"$$scope"in t&&a(5,n=t.$$scope)},[r,o,l,e,function(t){r=t,a(0,r)},n]}class D extends x{constructor(s){super(),b(this,s,C,w,t,{data:2})}}export{D as component,_ as universal};