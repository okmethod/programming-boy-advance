import{s as t,p as s,e,a,c as n,b as o,m as l,f as c,g as r,h as i,i as u,j as d,q as h,x as p,y as $,z as f,A as m}from"../chunks/scheduler.BrQl0MTG.js";import{S as x,i as b,f as g,b as v,d as T,m as y,t as S,a as k,e as j}from"../chunks/index.BNSTJDHr.js";import{C as I}from"../chunks/ContentsTabGroup.BSnvF54y.js";const P=Object.freeze(Object.defineProperty({__proto__:null,load:async function(){return{slotTabSettings:[{index:0,label:"(Index)",title:"Bookリスト",path:""},{index:1,label:"(Book 1)",title:"チートシート",path:"cheat-sheet"},{index:2,label:"(Book 2)",title:"プログラムの基礎",path:"pgm-basis"}]}}},Symbol.toStringTag,{value:"Module"}));function B(t){let s;const e=t[3].default,a=p(e,t,t[5],null);return{c(){a&&a.c()},l(t){a&&a.l(t)},m(t,e){a&&a.m(t,e),s=!0},p(t,n){a&&a.p&&(!s||32&n)&&$(a,e,t,t[5],s?m(e,t[5],n,null):f(t[5]),null)},i(t){s||(S(a,t),s=!0)},o(t){k(a,t),s=!1},d(t){a&&a.d(t)}}}function M(t){let p,$,f,m,x,b,P='<h1 class="cTitleStyle md:!text-3xl">PGM Books</h1>';function M(s){t[4](s)}let _={tabSettings:t[1],navigatePathPrefix:"/books",cContainer:"w-full",cPanel:"max-h-[calc(100vh-12rem)] overflow-y-auto",$$slots:{default:[B]},$$scope:{ctx:t}};return void 0!==t[0]&&(_.currentTabIndex=t[0]),m=new I({props:_}),s.push((()=>g(m,"currentTabIndex",M))),{c(){p=e("div"),$=e("div"),$.innerHTML=P,f=a(),v(m.$$.fragment),this.h()},l(t){p=n(t,"DIV",{class:!0});var s=o(p);$=n(s,"DIV",{class:!0,"data-svelte-h":!0}),"svelte-17olhsd"!==l($)&&($.innerHTML=P),f=c(s),T(m.$$.fragment,s),s.forEach(r),this.h()},h(){i($,"class","cTitlePartStyle"),i(p,"class","cRouteBodyStyle")},m(t,s){u(t,p,s),d(p,$),d(p,f),y(m,p,null),b=!0},p(t,[s]){const e={};32&s&&(e.$$scope={dirty:s,ctx:t}),!x&&1&s&&(x=!0,e.currentTabIndex=t[0],h((()=>x=!1))),m.$set(e)},i(t){b||(S(m.$$.fragment,t),b=!0)},o(t){k(m.$$.fragment,t),b=!1},d(t){t&&r(p),j(m)}}}function _(t,s,e){let{$$slots:a={},$$scope:n}=s,{data:o}=s;const l=o.slotTabSettings;let c=0;return t.$$set=t=>{"data"in t&&e(2,o=t.data),"$$scope"in t&&e(5,n=t.$$scope)},[c,l,o,a,function(t){c=t,e(0,c)},n]}class w extends x{constructor(s){super(),b(this,s,_,M,t,{data:2})}}export{w as component,P as universal};
