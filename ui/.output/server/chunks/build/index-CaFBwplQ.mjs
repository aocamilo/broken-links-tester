import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as i from 'react';
import { useRouter } from '@tanstack/react-router';
import { z } from 'zod';
import { Sun, Moon, Filter, Search, Check, ChevronDown, ArrowUpDown, X, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as A from '@radix-ui/react-slider';
import { useReactTable, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { p } from '../nitro/nitro.mjs';
import { createServerFn, startSerializer, mergeHeaders } from '@tanstack/start-client-core';
import { isPlainObject, encode, isRedirect, isNotFound } from '@tanstack/router-core';
import { getHeaders, getEvent } from '@tanstack/start-server-core';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:async_hooks';
import 'vinxi/lib/invariant';
import 'vinxi/lib/path';
import 'node:url';
import 'tiny-invariant';
import 'node:stream';
import 'isbot';
import 'react-dom/server';

async function Te(n, s, o) {
  var k;
  const u = s[0];
  if (isPlainObject(u) && u.method) {
    const c = u, f = c.data instanceof FormData ? "formData" : "payload", _ = new Headers({ ...f === "payload" ? { "content-type": "application/json", accept: "application/json" } : {}, ...c.headers instanceof Headers ? Object.fromEntries(c.headers.entries()) : c.headers });
    if (c.method === "GET") {
      const m = encode({ payload: startSerializer.stringify({ data: c.data, context: c.context }) });
      m && (n.includes("?") ? n += `&${m}` : n += `?${m}`);
    }
    n.includes("?") ? n += "&createServerFn" : n += "?createServerFn", c.response === "raw" && (n += "&raw");
    const g = await o(n, { method: c.method, headers: _, signal: c.signal, ...je(c) }), S = await Y(g);
    if ((k = S.headers.get("content-type")) != null && k.includes("application/json")) {
      const m = startSerializer.decode(await S.json());
      if (isRedirect(m) || isNotFound(m) || m instanceof Error) throw m;
      return m;
    }
    return S;
  }
  const v = await Y(await o(n, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(s) })), h = v.headers.get("content-type");
  return h && h.includes("application/json") ? startSerializer.decode(await v.json()) : v.text();
}
function je(n) {
  var _a;
  return n.method === "POST" ? n.data instanceof FormData ? (n.data.set("__TSR_CONTEXT", startSerializer.stringify(n.context)), { body: n.data }) : { body: startSerializer.stringify({ data: (_a = n.data) != null ? _a : null, context: n.context }) } : {};
}
async function Y(n) {
  if (!n.ok) {
    const s = n.headers.get("content-type");
    throw s && s.includes("application/json") ? startSerializer.decode(await n.json()) : new Error(await n.text());
  }
  return n;
}
function $e(n) {
  return n.replace(/^\/|\/$/g, "");
}
const He = (n, s) => {
  const o = `/${$e(s)}/${n}`;
  return Object.assign((...u) => Te(o, u, async (v, h) => {
    h.headers = mergeHeaders(getHeaders(), h.headers);
    const c = await $fetch.native(v, h), f = getEvent(), _ = mergeHeaders(c.headers, f.___ssrRpcResponseHeaders);
    return f.___ssrRpcResponseHeaders = _, c;
  }), { url: o, functionId: n });
};
function j(...n) {
  return twMerge(clsx(n));
}
function Ie({ className: n, type: s, ...o }) {
  return jsx("input", { type: s, "data-slot": "input", className: j("file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", n), ...o });
}
function Ve({ className: n, defaultValue: s, value: o, min: k = 0, max: u = 100, ...v }) {
  const h = i.useMemo(() => Array.isArray(o) ? o : Array.isArray(s) ? s : [k, u], [o, s, k, u]);
  return jsxs(A.Root, { "data-slot": "slider", defaultValue: s, value: o, min: k, max: u, className: j("relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col", n), ...v, children: [jsx(A.Track, { "data-slot": "slider-track", className: j("bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"), children: jsx(A.Range, { "data-slot": "slider-range", className: j("bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full") }) }), Array.from({ length: h.length }, (c, f) => jsx(A.Thumb, { "data-slot": "slider-thumb", className: "border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50" }, f))] });
}
const Oe = (n) => {
  if (!n) return { formatted: "N/A", ms: 0 };
  if (n.endsWith("ms")) {
    const o = parseFloat(n.replace("ms", ""));
    return { formatted: n, ms: isNaN(o) ? 0 : o };
  }
  const s = parseFloat(n);
  return isNaN(s) ? { formatted: n, ms: 0 } : s < 1e3 ? { formatted: `${s.toFixed(2)}ms`, ms: s } : { formatted: `${(s / 1e3).toFixed(2)}s`, ms: s };
}, Ue = (n) => n === 0 ? "bg-gray-200 dark:bg-gray-700" : n < 300 ? "bg-green-500" : n < 1e3 ? "bg-yellow-500" : "bg-red-500", E = { url: "url", parent_url: "parent_url", status: "is_working", status_code: "status_code", response_time: "responseTimeMs" }, Be = { status: [{ value: "working", label: "Working" }, { value: "broken", label: "Broken" }] }, B = (n, s, o) => {
  if (!o || Array.isArray(o) && !o.length) return true;
  const k = n.getValue(s);
  if (s === "is_working") {
    const u = k === true ? "working" : "broken";
    return o.includes(u);
  }
  return o.includes(String(k));
};
function Le({ data: n, isLoading: s = false }) {
  useRouter();
  const o = new URLSearchParams(window.location.search), [k, u] = i.useState(null), [v, h] = i.useState(void 0), c = o.get("filter");
  o.get("filterValue");
  const f = o.get("sortColumn"), _ = o.get("sortDir"), [g, S] = i.useState(f && _ ? [{ id: E[f] || "is_working", desc: _ === "desc" }] : [{ id: "is_working", desc: false }]), [m, C] = i.useState([]), [$, H] = i.useState({}), [p, N] = i.useState(["url", "parent_url", "status", "status_code", "response_time"]), w = (e) => {
    const r = Object.entries(E).find(([a, d]) => d === e);
    return r ? r[0] : e;
  }, [b, L] = i.useState(c || null), [R, I] = i.useState([]), [D, V] = i.useState([]), [P, ae] = i.useState(f || "status"), ne = i.useMemo(() => n.map((e) => {
    const { formatted: r, ms: a } = Oe(e.response_time);
    return { ...e, formattedResponseTime: r, responseTimeMs: a };
  }), [n]), W = i.useMemo(() => {
    const e = /* @__PURE__ */ new Set();
    return n.forEach((r) => {
      r.status_code && e.add(String(r.status_code));
    }), Array.from(e).sort((r, a) => {
      const d = parseInt(r, 10), x = parseInt(a, 10);
      return d - x;
    }).map((r) => {
      let a = `${r}`;
      return r === "200" ? a += " (OK)" : r === "201" ? a += " (Created)" : r === "301" ? a += " (Moved Permanently)" : r === "302" ? a += " (Found)" : r === "304" ? a += " (Not Modified)" : r === "400" ? a += " (Bad Request)" : r === "401" ? a += " (Unauthorized)" : r === "403" ? a += " (Forbidden)" : r === "404" ? a += " (Not Found)" : r === "500" && (a += " (Internal Server Error)"), { value: r, label: a };
    });
  }, [n]), K = i.useMemo(() => [{ accessorKey: "url", header: "URL", cell: ({ row: e }) => jsx("div", { className: "max-w-[400px] truncate", title: e.getValue("url"), children: jsx("a", { href: e.getValue("url"), target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline", children: e.getValue("url") }) }), enableSorting: true, enableColumnFilter: true, size: 400 }, { accessorKey: "parent_url", header: "Parent URL", cell: ({ row: e }) => jsx("div", { className: "max-w-[350px] truncate", title: e.getValue("parent_url") || "N/A", children: e.getValue("parent_url") ? jsx("a", { href: e.getValue("parent_url"), target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline", children: e.getValue("parent_url") }) : "N/A" }), enableSorting: true, enableColumnFilter: true, size: 350 }, { accessorKey: "is_working", id: "is_working", header: "Status", cell: ({ row: e }) => {
    const r = e.original.is_working;
    return jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${r ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"}`, children: r ? "Working" : "Broken" });
  }, enableSorting: true, filterFn: B, size: 120 }, { accessorKey: "status_code", header: "Status Code", cell: ({ row: e }) => jsx("div", { children: e.getValue("status_code") || "N/A" }), enableSorting: true, enableColumnFilter: true, filterFn: B, size: 150 }, { accessorKey: "responseTimeMs", id: "responseTimeMs", header: "Response Time", cell: ({ row: e }) => {
    const r = e.original.responseTimeMs, a = e.original.formattedResponseTime;
    return jsxs("div", { className: "flex items-center gap-2 min-w-[180px]", children: [jsx("div", { className: "w-24 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden", children: jsx("div", { className: `h-full ${Ue(r)}`, style: { width: r === 0 ? "10%" : `${Math.min(100, Math.max(10, r / 20))}%` } }) }), jsx("span", { className: "text-xs font-medium", children: a })] });
  }, enableSorting: true, enableColumnFilter: false, size: 200 }], []), y = useReactTable({ data: ne, columns: K, state: { sorting: g, columnFilters: m, columnVisibility: $, columnOrder: p }, filterFns: { multiSelect: B }, onSortingChange: S, onColumnFiltersChange: C, onColumnVisibilityChange: H, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });
  i.useEffect(() => {
    const e = new URLSearchParams();
    if (m.length > 0 && m.forEach((d) => {
      const x = d.id, M = w(x);
      if (Array.isArray(d.value)) {
        const Z = d.value.join(",");
        Z && e.set(`filter_${M}`, Z);
      } else e.set(`filter_${M}`, String(d.value));
    }), g.length > 0) {
      const d = g[0].id, x = w(d);
      e.set("sortColumn", x), e.set("sortDir", g[0].desc ? "desc" : "asc");
    }
    const r = e.toString(), a = r ? `?${r}` : window.location.pathname;
    window.history.pushState({}, "", a);
  }, [m, g]);
  const J = i.useCallback((e) => {
    I(e), e.length === 0 ? C((r) => r.filter((a) => a.id !== "is_working")) : C((r) => {
      const a = r.findIndex((d) => d.id === "is_working");
      if (a >= 0) {
        const d = [...r];
        return d[a] = { id: "is_working", value: e }, d;
      }
      return [...r, { id: "is_working", value: e }];
    });
  }, []), G = i.useCallback((e) => {
    V(e), e.length === 0 ? C((r) => r.filter((a) => a.id !== "status_code")) : C((r) => {
      const a = r.findIndex((d) => d.id === "status_code");
      if (a >= 0) {
        const d = [...r];
        return d[a] = { id: "status_code", value: e }, d;
      }
      return [...r, { id: "status_code", value: e }];
    });
  }, []), O = i.useCallback((e) => {
    L(e), e !== "status" && I([]), e !== "status_code" && V([]);
  }, []), se = i.useCallback(() => {
    if (!P) return;
    const e = E[P];
    if (!e) return;
    const r = g.find((a) => a.id === e);
    r ? r.desc ? S([]) : S([{ id: e, desc: true }]) : S([{ id: e, desc: false }]);
  }, [P, g]), le = (e) => {
    if (!e.destination) return;
    const r = Array.from(p), [a] = r.splice(e.source.index, 1);
    r.splice(e.destination.index, 0, a), N(r);
  }, X$1 = (() => {
    if (g.length === 0) return null;
    const e = g[0].id;
    return { column: w(e), direction: g[0].desc ? "desc" : "asc" };
  })(), F = i.useRef(null);
  i.useEffect(() => {
    F.current && !v && h("400px");
  }, [v]), i.useEffect(() => {
    if (F.current && n.length > 0) {
      const e = F.current.offsetHeight;
      e > 0 && u(e);
    }
  }, [n, g, m]);
  const [Ge, ie] = i.useState(500);
  i.useEffect(() => {
    F.current && n.length > 0 && F.current.offsetHeight > 300 && ie(Math.max(500, F.current.offsetHeight));
  }, [n.length]);
  const oe = () => m.length;
  return jsxs("div", { className: "space-y-4", children: [jsxs("div", { className: "bg-white dark:bg-gray-900 p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-700", children: [jsxs("div", { className: "flex flex-wrap gap-3 items-center mb-3", children: [jsxs("div", { className: "flex items-center gap-2", children: [jsxs("button", { disabled: s, className: `h-9 px-3 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${b ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"} disabled:opacity-50`, onClick: () => {
    O(b ? null : "url");
  }, children: [jsx(Filter, { size: 14 }), jsx("span", { children: b ? "Change filter" : "Add filter" })] }), b && jsxs("select", { value: b, onChange: (e) => O(e.target.value), className: "h-9 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 text-sm", disabled: s, children: [jsx("option", { value: "url", children: "URL" }), jsx("option", { value: "parent_url", children: "Parent URL" }), jsx("option", { value: "status", children: "Status" }), jsx("option", { value: "status_code", children: "Status Code" })] })] }), b === "url" || b === "parent_url" ? jsxs("div", { className: "relative", children: [jsx("input", { type: "text", placeholder: `Filter by ${b}...`, onChange: (e) => {
    const r = e.target.value, a = E[b];
    a && C(r ? (d) => {
      const x = d.findIndex((M) => M.id === a);
      if (x >= 0) {
        const M = [...d];
        return M[x] = { id: a, value: r }, M;
      }
      return [...d, { id: a, value: r }];
    } : (d) => d.filter((x) => x.id !== a));
  }, className: "w-64 px-3 h-9 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg text-sm", disabled: s }), jsx(Search, { size: 14, className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" })] }) : b === "status" ? jsx("div", { className: "flex items-center gap-2", children: Be.status.map((e) => jsxs("label", { className: `flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border ${R.includes(e.value) ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`, children: [jsx("input", { type: "checkbox", checked: R.includes(e.value), onChange: () => {
    const r = R.includes(e.value) ? R.filter((a) => a !== e.value) : [...R, e.value];
    J(r);
  }, className: "sr-only", disabled: s }), jsx("span", { className: `w-4 h-4 rounded border flex items-center justify-center ${R.includes(e.value) ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"}`, children: R.includes(e.value) && jsx(Check, { size: 12, className: "text-white" }) }), jsx("span", { children: e.label })] }, e.value)) }) : b === "status_code" && W.length > 0 ? jsx("div", { className: "flex items-center gap-2 flex-wrap", children: jsxs("div", { className: "relative", children: [jsxs("select", { className: "h-9 w-60 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 text-sm appearance-none pr-8", disabled: s, value: "", onChange: (e) => {
    if (!e.target.value) return;
    const r = e.target.value;
    if (!D.includes(r)) {
      const a = [...D, r];
      G(a);
    }
  }, children: [jsx("option", { value: "", children: "Select status code..." }), W.map((e) => jsx("option", { value: e.value, disabled: D.includes(e.value), children: e.label }, e.value))] }), jsx(ChevronDown, { size: 14, className: "absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" })] }) }) : null, jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [jsxs("select", { value: P || "status", onChange: (e) => ae(e.target.value), className: "h-9 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 text-sm min-w-[120px]", disabled: s, children: [jsx("option", { value: "", children: "Sort by..." }), jsx("option", { value: "url", children: "URL" }), jsx("option", { value: "parent_url", children: "Parent URL" }), jsx("option", { value: "status", children: "Status" }), jsx("option", { value: "status_code", children: "Status Code" }), jsx("option", { value: "response_time", children: "Response Time" })] }), jsxs("button", { disabled: s, className: `h-9 px-3 rounded-lg flex items-center gap-1 text-sm font-medium border ${g.length > 0 ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"} disabled:opacity-50`, onClick: se, children: [jsx(ArrowUpDown, { size: 14 }), jsx("span", { children: g.length > 0 && X$1 ? X$1.direction === "asc" ? "Ascending" : "Descending" : "Sort" })] })] }), jsx("div", { className: "flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400", children: jsx("select", { value: y.getState().pagination.pageSize, onChange: (e) => {
    y.setPageSize(Number(e.target.value));
  }, disabled: s, className: "h-8 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 disabled:opacity-50", children: [10, 20, 30, 40, 50].map((e) => jsxs("option", { value: e, children: [e, " per page"] }, e)) }) })] }), oe() > 0 && jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700", children: [jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Active filters:" }), jsxs("div", { className: "flex flex-wrap gap-2", children: [R.map((e) => jsxs("div", { className: "flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800", children: [jsx("span", { className: "mr-1 font-medium", children: "Status:" }), " ", e === "working" ? "Working" : "Broken", jsx("button", { onClick: () => {
    const r = R.filter((a) => a !== e);
    J(r);
  }, className: "ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300", children: jsx(X, { size: 12 }) })] }, e)), D.map((e) => jsxs("div", { className: "flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800", children: [jsx("span", { className: "mr-1 font-medium", children: "Status Code:" }), " ", e, jsx("button", { onClick: () => {
    const r = D.filter((a) => a !== e);
    G(r);
  }, className: "ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300", children: jsx(X, { size: 12 }) })] }, e)), m.filter((e) => e.id === "url" || e.id === "parent_url").map((e) => jsxs("div", { className: "flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800", children: [jsxs("span", { className: "mr-1 font-medium", children: [w(e.id), ":"] }), String(e.value).length > 20 ? String(e.value).slice(0, 20) + "..." : e.value, jsx("button", { onClick: () => {
    C((r) => r.filter((a) => a.id !== e.id));
  }, className: "ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300", children: jsx(X, { size: 12 }) })] }, e.id))] }), jsx("button", { disabled: s, onClick: () => {
    C([]), I([]), V([]), L(null);
  }, className: "ml-auto text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50", children: "Clear all filters" })] })] }), jsxs("div", { className: "rounded-md shadow-sm bg-white dark:bg-gray-900 p-[1px] gradient-border", style: { height: "500px", display: "flex", flexDirection: "column" }, children: [jsx("div", { ref: F, className: "flex-grow overflow-auto bg-white dark:bg-gray-900 rounded-md", style: { minHeight: 0 }, children: s ? jsx("div", { className: "flex items-center justify-center h-full", children: jsxs("div", { className: "flex flex-col items-center", children: [jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" }), jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Checking links..." })] }) }) : jsx(DragDropContext, { onDragEnd: le, children: jsxs("table", { className: "w-full table-auto", children: [jsx(Droppable, { droppableId: "columns", direction: "horizontal", children: (e) => jsx("thead", { ref: e.innerRef, ...e.droppableProps, className: "sticky top-0 z-10", children: jsx("tr", { className: "border-b bg-gray-50/80 dark:bg-gray-800 dark:border-gray-700", children: y.getHeaderGroups().map((r) => jsxs(i.Fragment, { children: [r.headers.map((a, d) => jsx(Draggable, { draggableId: a.id, index: d, isDragDisabled: s, children: (x) => jsxs("th", { ref: x.innerRef, ...x.draggableProps, className: "relative h-12 px-4 text-left font-medium text-gray-500 dark:text-gray-300", style: { width: a.getSize(), ...x.draggableProps.style }, children: [jsxs("div", { className: "flex items-center gap-2", children: [jsx("div", { ...x.dragHandleProps, className: `cursor-grab ${s ? "opacity-30" : "opacity-50"}`, children: jsx(GripVertical, { size: 14 }) }), jsxs("div", { className: "flex items-center gap-1", children: [jsx("span", { children: a.column.columnDef.header }), a.column.getCanSort() && jsx("button", { onClick: () => a.column.toggleSorting(a.column.getIsSorted() === "asc"), disabled: s, className: `ml-1 ${s ? "opacity-30" : ""}`, children: jsx(ArrowUpDown, { size: 14 }) })] })] }), jsx("div", { onMouseDown: s ? void 0 : a.getResizeHandler(), onTouchStart: s ? void 0 : a.getResizeHandler(), className: `absolute right-0 top-0 h-full w-1 cursor-col-resize ${a.column.getIsResizing() ? "bg-blue-500" : ""}` })] }) }, a.id)), e.placeholder] }, r.id)) }) }) }), jsx("tbody", { children: y.getRowModel().rows.length > 0 ? y.getRowModel().rows.map((e) => jsx("tr", { className: "border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800", children: e.getVisibleCells().map((r) => jsx("td", { className: "p-4 align-middle", style: { width: r.column.getSize() }, children: flexRender(r.column.columnDef.cell, r.getContext()) }, r.id)) }, e.id)) : jsx("tr", { children: jsx("td", { colSpan: K.length, className: "h-24 text-center align-middle text-gray-500 dark:text-gray-400", children: "No results found" }) }) })] }) }) }), jsxs("div", { className: "flex items-center justify-between border-t p-3 bg-white dark:bg-gray-900 dark:border-gray-700", children: [jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: y.getPrePaginationRowModel().rows.length > 0 && jsxs(Fragment, { children: ["Showing ", y.getRowModel().rows.length, " of", " ", y.getPrePaginationRowModel().rows.length, " results"] }) }), jsxs("div", { className: "flex items-center gap-2", children: [jsx("button", { onClick: () => y.previousPage(), disabled: !y.getCanPreviousPage() || s, className: "h-8 rounded-md border border-gray-300 dark:border-gray-600 px-2 disabled:opacity-50 dark:text-gray-300", children: "Previous" }), jsxs("span", { className: "text-sm dark:text-gray-300", children: ["Page ", y.getState().pagination.pageIndex + 1, " of", " ", y.getPageCount() || 1] }), jsx("button", { onClick: () => y.nextPage(), disabled: !y.getCanNextPage() || s, className: "h-8 rounded-md border border-gray-300 dark:border-gray-600 px-2 disabled:opacity-50 dark:text-gray-300", children: "Next" })] })] })] })] });
}
const re = z.object({ url: z.string().url("Please enter a valid URL"), depth: z.number().min(0).max(4).default(1) }), We = He("app_routes_index_tsx--checkLinksServerFn_createServerFn_handler", "/_server"), Ke = createServerFn({ method: "POST" }).validator((n) => re.parse(n)).handler(We), ut = function() {
  useRouter();
  const { initialResults: s } = p.useLoaderData(), [o, k] = i.useState(s), [u, v] = i.useState(false), [h, c] = i.useState(false), [f, _] = i.useState({ url: "", depth: 1 }), [g, S] = i.useState({});
  i.useEffect(() => {
    const p = localStorage.getItem("darkMode"), N = window.matchMedia("(prefers-color-scheme: dark)").matches;
    p !== null ? c(p === "true") : N && c(true);
  }, []), i.useEffect(() => {
    h ? document.documentElement.classList.add("dark") : document.documentElement.classList.remove("dark"), localStorage.setItem("darkMode", h.toString());
  }, [h]);
  const m = () => {
    c((p) => !p);
  }, C = async (p) => {
    p.preventDefault();
    try {
      const N = re.parse(f);
      S({}), v(true);
      try {
        const w = await Ke({ data: N });
        k(w);
      } catch (w) {
        console.error("Error checking links:", w);
      } finally {
        v(false);
      }
    } catch (N) {
      if (N instanceof z.ZodError) {
        const w = {};
        N.errors.forEach((b) => {
          b.path[0] && (w[b.path[0]] = b.message);
        }), S(w);
      }
    }
  }, $ = (p) => {
    const { name: N, value: w } = p.target;
    _((b) => ({ ...b, [N]: w }));
  }, H = (p) => {
    _((N) => ({ ...N, depth: p }));
  };
  return jsxs("div", { className: "min-h-screen flex flex-col items-center p-4 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950", children: [jsx("div", { className: "absolute top-4 right-4", children: jsx("button", { onClick: m, className: "p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all", "aria-label": h ? "Switch to light mode" : "Switch to dark mode", children: h ? jsx(Sun, { size: 20, className: "text-yellow-500" }) : jsx(Moon, { size: 20, className: "text-indigo-600" }) }) }), jsx("div", { className: "w-full max-w-md mx-auto mb-6", children: jsxs("div", { className: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 transition-colors", children: [jsx("h1", { className: "text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text", children: "Broken Links Checker" }), jsxs("form", { onSubmit: C, className: "space-y-5", children: [jsxs("div", { className: "grid gap-2", children: [jsx("label", { htmlFor: "url", className: "text-sm font-medium leading-none text-gray-600 dark:text-gray-300", children: "Website URL" }), jsx(Ie, { id: "url", name: "url", type: "url", placeholder: "https://example.com", value: f.url, onChange: $, disabled: u, className: `h-9 px-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors ${g.url ? "border-red-500 focus:ring-red-500" : ""}` }), g.url && jsx("p", { className: "text-red-500 text-xs", children: g.url })] }), jsxs("div", { className: "grid gap-2", children: [jsxs("div", { className: "flex justify-between items-center", children: [jsx("label", { htmlFor: "depth", className: "text-sm font-medium leading-none text-gray-600 dark:text-gray-300", children: "Search Depth" }), jsx("span", { className: "text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 font-medium transition-colors", children: f.depth })] }), jsx("div", { className: "px-1 py-3", children: jsx(Ve, { id: "depth", value: [f.depth], min: 0, max: 4, step: 1, onValueChange: (p) => H(p[0]), disabled: u, className: "w-full" }) }), jsxs("div", { className: "flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1", children: [jsx("span", { children: "Shallow (0)" }), jsx("span", { children: "Deep (4)" })] })] }), jsx("button", { type: "submit", disabled: u, className: "w-full h-10 px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700", children: u ? jsxs(Fragment, { children: [jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Checking Links..."] }) : "Check Links" })] })] }) }), (o.length > 0 || u) && jsx("div", { className: "w-full max-w-6xl mx-auto", children: jsx(Le, { data: o, isLoading: u }) })] });
};

export { ut as component };
//# sourceMappingURL=index-CaFBwplQ.mjs.map
