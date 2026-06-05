"use client";

/**
 * ApolloWrapper.tsx
 *
 * Sets up Apollo Client with:
 *  - HttpLink        → all queries & mutations
 *  - GraphQLWsLink   → subscriptions only (messageReceived)
 *  - split()         → routes by operation type automatically
 *  - authLink        → injects Bearer token into HTTP headers
 *  - connectionParams → sends Bearer token over WebSocket handshake
 *
 * KEY FIX: lazy: true — WS connection is only opened when the first
 * subscription is actually used, not on every page load. This stops
 * the flood of "[WS] error" messages in the console on pages like
 * /feed, /jobs, /profile that don't use subscriptions at all.
 */

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
} from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import { createClient } from "graphql-ws";
import { ReactNode, useMemo } from "react";

/** Read token safely — always client-side inside useMemo guard */
const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("bl_token") : null;

export function ApolloWrapper({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    /* ── 1. HTTP link for queries + mutations ── */
    const httpLink = new HttpLink({
      uri:
        process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8000/graphql",
    });

    /* ── 2. Auth link — attaches Bearer token to every HTTP request ── */
    const authLink = setContext((_, { headers }) => {
      const token = getToken();
      return {
        headers: {
          ...headers,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      };
    });

    const httpAuthLink = authLink.concat(httpLink);

    /* ── 3. WebSocket link — subscriptions only ──
     *
     * FIXES applied vs original:
     *
     * 1. lazy: true  — WS connection opens only when the first subscription
     *    is requested. Without this, graphql-ws v6 connects immediately on
     *    createClient(), which spams errors on every non-messages page.
     *
     * 2. retryAttempts: 3  — reduced from 5; combined with exponential
     *    backoff below this caps total wait at ~7 s before giving up.
     *
     * 3. retryWait  — exponential backoff (1 s → 2 s → 4 s) so we don't
     *    hammer the server on reconnect.
     *
     * 4. shouldRetry — only retry on abnormal closure codes, not on auth
     *    errors (4400 / 4401 / 4403) which will never succeed anyway.
     *
     * Backend WS endpoint : ws://localhost:8000/graphql/ws
     * Override via         : NEXT_PUBLIC_GRAPHQL_WS_URL in .env.local
     */
    const wsLink =
      typeof window !== "undefined"
        ? new GraphQLWsLink(
            createClient({
              url:
                process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ??
                "ws://localhost:8000/graphql/ws",

              // ✅ KEY FIX — don't connect until first subscription is used
              lazy: true,

              /** Send JWT on WS handshake (connection_init payload) */
              connectionParams: () => {
                const token = getToken();
                return token ? { authorization: `Bearer ${token}` } : {};
              },

              /** Exponential backoff: 1s, 2s, 4s */
              retryWait: async (retries) => {
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.min(1000 * 2 ** retries, 10_000))
                );
              },

              /** Only retry on network/server errors, not auth errors */
              shouldRetry: (errOrCloseEvent) => {
                if (errOrCloseEvent instanceof CloseEvent) {
                  // 4400 Bad Request, 4401 Unauthorized, 4403 Forbidden
                  // — retrying won't help, skip
                  const skipCodes = [4400, 4401, 4403];
                  return !skipCodes.includes(errOrCloseEvent.code);
                }
                return true;
              },

              retryAttempts: 3,

              on: {
                connected: () => console.debug("[WS] connected"),
                closed:    () => console.debug("[WS] closed"),
                error:     (err) => console.error("[WS] error", err),
              },
            })
          )
        : null; // SSR: no WebSocket available

    /* ── 4. Split link — route by operation type ──
     *
     * subscription → wsLink
     * query / mutation → httpAuthLink
     */
    const splitLink = wsLink
      ? split(
          ({ query }) => {
            const def = getMainDefinition(query);
            return (
              def.kind === "OperationDefinition" &&
              def.operation === "subscription"
            );
          },
          wsLink,      // true  → subscription
          httpAuthLink // false → query / mutation
        )
      : httpAuthLink; // SSR fallback

    /* ── 5. Apollo Client ── */
    return new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              /** Merge paginated messages by conversationId (cursor pagination) */
              messages: {
                keyArgs: ["input", ["conversationId"]],
                merge(existing = [], incoming: any[]) {
                  return [...existing, ...incoming];
                },
              },
            },
          },
        },
      }),
      connectToDevTools: process.env.NODE_ENV === "development",
    });
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}