# Next.js Agent Rules

## Breaking Changes

> This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## Instant Navigations + Cache Components (Next.js 16+)

This codebase uses **Cache Components** and **Instant Navigations** for all routes. Every new route, server component, route handler, and server action must follow these patterns.

### 1. Enable Cache Components

`next.config.ts` MUST have:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;
```

`cacheComponents: true` enables:
- PPR (Partial Prerendering) — static shell + streamed dynamic content
- `'use cache'` directive on async functions
- `cacheLife()` / `cacheTag()` for cache control
- React `<Activity>` for preserved state across navigations

### 2. Mark every route with `unstable_instant`

Every `page.tsx`, `layout.tsx`, and route file that should render instantly MUST export:

```tsx
export const unstable_instant = { prefetch: "static" } as const;
```

This validates at build/dev time that the static shell can render at every shared layout boundary. It catches the silent-blocker bug where a misplaced Suspense boundary makes client navigations feel unresponsive.

For layouts that read cookies/headers and can't be instant (e.g. dashboards), use `export const unstable_instant = false;` to opt out, then add `unstable_instant` to inner page segments.

### 3. Static shell pattern

The static shell is everything that renders before any async work. It must work without cookies, headers, or uncached data.

```tsx
// app/page.tsx
export const unstable_instant = { prefetch: "static" } as const;

import { Suspense } from "react";

export default function Page() {
  return (
    <>
      {/* Static — prerendered at build time */}
      <header><h1>Dashboard</h1></header>

      {/* Wrapped — streams in */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </>
  );
}
```

**Rule of thumb:** if a component does not call `cookies()`, `headers()`, `searchParams`, or fetch from an untrusted source, it should be in the static shell.

### 4. Use `'use cache'` for cacheable server work

Apply `'use cache'` to async functions that:

- Read from a stable source (DB, file, public API)
- Are deterministic given their inputs
- Don't access `cookies()`, `headers()`, or `searchParams`

```tsx
import { cacheLife, cacheTag } from "next/cache";

async function getProduct(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product-${id}`);

  return db.products.findUnique({ where: { id } });
}
```

Cache key = build ID + function ID + serialized arguments + closure variables. Don't pass secrets as arguments; the cache key is a hash.

**Built-in cacheLife profiles:** `'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`.

For custom TTLs:
```tsx
cacheLife({ stale: 3600, revalidate: 7200, expire: 86400 });
```

### 5. Runtime data constraint

You **cannot** access `cookies()`, `headers()`, or `searchParams` inside a `'use cache'` scope. The error is raised at build/dev time.

**Correct pattern** — read runtime data outside, pass as argument:

```tsx
async function Page() {
  const session = (await cookies()).get("session")?.value;
  const user = await getCachedUser(session!); // session in cache key
  return <Profile user={user} />;
}

async function getCachedUser(sessionId: string) {
  "use cache";
  return db.users.findUnique({ where: { sessionId } });
}
```

**Escape hatch** — only for compliance refactors that can't move the runtime call:
```tsx
"use cache: private";
```

### 6. Cache invalidation

Tag reads so mutations can expire them:

```tsx
// On read
async function getDrop(id: string) {
  "use cache";
  cacheTag("drops", `drop-${id}`);
  return db.drop.findUnique({ where: { id } });
}

// In a Server Action after a write
"use server";
import { updateTag } from "next/cache";

export async function toggleRepost(dropId: string) {
  await db.repost.create({ data: { dropId } });
  updateTag(`drop-${dropId}`);     // immediate — same request sees fresh
  revalidateTag("drops");          // background — next request sees fresh
}
```

Use `updateTag` when the current page must show the change immediately. Use `revalidateTag` for stale-while-revalidate.

### 7. Route handlers

Route handlers are inherently dynamic per-request. They can:
- Call `'use cache'` functions internally
- Cannot be marked `'use cache'` themselves (they read cookies/headers)
- Should not block on uncached data — wrap async work in helpers that are cached

```tsx
// app/api/things/[id]/route.ts
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const thing = await getCachedThing(id); // 'use cache' inside
  return Response.json({ thing });
}
```

Make pure parsers async + `'use cache'` so they're cached per-input:

```tsx
export async function parseId(input: string) {
  "use cache";
  // ... regex
  return id;
}
```

### 8. Streaming with Suspense

Place `<Suspense>` boundaries so dynamic content can stream without blocking the static shell:

- **Always** wrap components that read `cookies()` / `headers()` / `searchParams`.
- **Always** wrap components that call untrusted (un-cached) server functions.
- **Don't** wrap stable static content — it adds latency for no benefit.

```tsx
<Suspense fallback={<MapSkeleton />}>
  <RouteMap />  {/* reads cookies, needs to suspend */}
</Suspense>
```

For nested boundaries, put the more critical content above so the page settles from the top:

```tsx
<Suspense fallback={<DropDetailSkeleton />}>
  <DropDetail id={id} />
  <Suspense fallback={<RepliesSkeleton />}>
    <Replies id={id} />
  </Suspense>
</Suspense>
```

### 9. Avoid these anti-patterns

- ❌ `await params` then call uncached fetches in the same component without `<Suspense>`. This blocks the whole shell.
- ❌ `cookies()` inside a `'use cache'` scope. Move runtime data outside.
- ❌ Ignoring `unstable_instant` errors. The validation is correct — fix the boundary placement.
- ❌ Caching per-user authenticated responses. Use `'use cache: private'` only if you must.
- ❌ Mixing `'use cache'` into Client Components. The directive only works in server contexts.

### 10. DevTools inspection

With `instantNavigationDevToolsToggle: true`, open Next.js DevTools → **Instant Navs** to:
- **Page load**: see the static shell before dynamic data streams in.
- **Client navigation**: see the prefetched UI for a route.

Both should be checked. Any visible difference between the static shell and the final UI is a placement bug.

### 11. Testing

The `@next/playwright` package exports `instant()` to scope assertions to the prefetched shell:

```ts
import { instant } from "@next/playwright";

await instant(page, async () => {
  await page.click('a[href="/store/hats"]');
  await expect(page.locator("h1")).toContainText("Baseball Cap");
});
```

Build-time `unstable_instant` validation is the primary guard; add `instant()` tests for the user flows that matter most.

### References

- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`
- `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
- `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`
- `.agents/skills/next-cache-components/SKILL.md`
