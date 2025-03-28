import { z } from 'zod';
import s from 'axios';
import M from 'tiny-invariant';
import { createServerFn } from '@tanstack/start-client-core';

function i(e) {
  return e.replace(/^\/|\/$/g, "");
}
const p = (e, r, n) => {
  M(n, "\u{1F6A8}splitImportFn required for the server functions server runtime, but was not provided.");
  const a = `/${i(r)}/${e}`;
  return Object.assign(n, { url: a, functionId: e });
}, u = () => process.env.API_URL || "http://localhost:8080", l = s.create({ baseURL: u(), headers: { "Content-Type": "application/json" } }), d = async (e) => {
  const { data: r } = await l.post("/api/check-links", e);
  return r;
}, v = z.object({ url: z.string().url("Please enter a valid URL"), depth: z.number().min(0).max(4).default(1) }), h = p("app_routes_index_tsx--checkLinksServerFn_createServerFn_handler", "/_server", (e, r) => m.__executeServer(e, r)), m = createServerFn({ method: "POST" }).validator((e) => v.parse(e)).handler(h, async ({ data: e }) => await d(e));

export { h as checkLinksServerFn_createServerFn_handler };
//# sourceMappingURL=index-BkjnP6dm.mjs.map
