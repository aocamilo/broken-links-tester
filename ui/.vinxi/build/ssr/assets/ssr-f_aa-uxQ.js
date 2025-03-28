import{RouterProvider as R,createRootRoute as g,Outlet as b,HeadContent as v,Scripts as S,createFileRoute as y,lazyRouteComponent as _,createRouter as k}from"@tanstack/react-router";import{jsx as n,jsxs as c}from"react/jsx-runtime";import{z as l}from"zod";import M from"tiny-invariant";import{PassThrough as C}from"node:stream";import{isbot as d}from"isbot";import i from"react-dom/server";import{defineHandlerCallback as P,transformReadableStreamWithRouter as T,transformPipeableStreamWithRouter as w,createStartHandler as x}from"@tanstack/start-server-core";function u(e){return n(R,{router:e.router})}const j=P(async({request:e,router:t,responseHeaders:a})=>{if(typeof i.renderToReadableStream=="function"){const r=await i.renderToReadableStream(n(u,{router:t}),{signal:e.signal});d(e.headers.get("User-Agent"))&&await r.allReady;const o=T(t,r);return new Response(o,{status:t.state.statusCode,headers:a})}if(typeof i.renderToPipeableStream=="function"){const r=new C;try{const s=i.renderToPipeableStream(n(u,{router:t}),{...d(e.headers.get("User-Agent"))?{onAllReady(){s.pipe(r)}}:{onShellReady(){s.pipe(r)}},onError:(f,h)=>{console.error("Error in renderToPipeableStream:",f,h)}})}catch(s){console.error("Error in renderToPipeableStream:",s)}const o=w(t,r);return new Response(o,{status:t.state.statusCode,headers:a})}throw new Error("No renderToReadableStream or renderToPipeableStream found in react-dom/server. Ensure you are using a version of react-dom that supports streaming.")}),D=()=>({routes:{__root__:{filePath:"__root.tsx",children:["/"],preloads:["/_build/assets/client-Dc6jMhd6.js","/_build/assets/client-C7JLtMvq.js"]},"/":{filePath:"index.tsx"}}});function E(e){return globalThis.MANIFEST[e]}function F(){const e=D(),t=e.routes.__root__=e.routes.__root__||{};t.assets=t.assets||[];let a="";const r=E("client"),o=r.inputs[r.handler]?.output.path;return o||M(o,"Could not find client entry in vinxi manifest"),t.assets.push({tag:"script",attrs:{type:"module",suppressHydrationWarning:!0,async:!0},children:`${a}import("${o}")`}),e}function $(){const e=F();return{...e,routes:Object.fromEntries(Object.entries(e.routes).map(([t,a])=>{const{preloads:r,assets:o}=a;return[t,{preloads:r,assets:o}]}))}}const m=g({head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1"},{title:"Broken Links Checker"},{name:"description",content:"Check and find broken links on your website"}],link:[{rel:"icon",href:"/favicon.svg",type:"image/svg+xml"},{rel:"icon",href:"/favicon.ico",sizes:"32x32"},{rel:"apple-touch-icon",href:"/favicon.svg"},{rel:"icon",href:"/favicon.svg",sizes:"any"}]}),component:A});function A(){return n(H,{children:n(b,{})})}function H({children:e}){return c("html",{lang:"en",className:"scroll-smooth",children:[c("head",{children:[n(v,{}),n("script",{dangerouslySetInnerHTML:{__html:`
              (function() {
                try {
                  const savedDarkMode = localStorage.getItem('darkMode');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.error('Failed to apply dark mode', e);
                }
              })();
            `}})]}),c("body",{className:"min-h-screen antialiased",children:[e,n(S,{})]})]})}const I=()=>import("./index-CaFBwplQ.js");l.object({url:l.string().url("Please enter a valid URL"),depth:l.number().min(0).max(4).default(1)});const p=y("/")({component:_(I,"component",()=>p.ssr),loader:async()=>({initialResults:[]})}),L=p.update({id:"/",path:"/",getParentRoute:()=>m}),z={IndexRoute:L},N=m._addFileChildren(z)._addFileTypes();function O(){return k({routeTree:N,scrollRestoration:!0})}const X=x({createRouter:O,getRouterManifest:$})(j);export{p as R,X as h};
