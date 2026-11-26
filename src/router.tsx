import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Keep the query data used by SSR available during the browser's first
    // render. Without this, useSuspenseQuery can fetch a second snapshot while
    // React is hydrating HTML rendered from the first snapshot.
    // Router's serializability validator cannot infer React Query's runtime
    // serialization of query keys and cached data, so narrow at this boundary.
    dehydrate: () => dehydrate(queryClient) as never,
    hydrate: (state) => hydrate(queryClient, state as never),
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
