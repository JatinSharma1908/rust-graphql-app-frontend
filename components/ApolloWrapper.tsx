"use client";

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
import { ReactNode, useRef } from "react";

const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("bl_token") : null;

// Build the client once, outside the component, so React re-renders never
// recreate it (which would teardown the WS connection on every state change).
function buildApolloClient() {
  /* ── 1. HTTP link ── */
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8000/graphql",
  });

  /* ── 2. Auth link ── */
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

  /* ── 3. WebSocket link ── */
  const wsLink =
    typeof window !== "undefined"
      ? new GraphQLWsLink(
          createClient({
            url:
              process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ??
              "ws://localhost:8000/ws",

            // FIX 1: lazy: false — connect immediately and keep the socket open.
            // lazy: true closes the socket when subscription count hits 0,
            // which happens on every React re-render and causes the server to
            // send "complete" immediately after the first message.
            lazy: false,

            connectionParams: () => {
              const token = getToken();
              return token ? { authorization: `Bearer ${token}` } : {};
            },

            // FIX 2: unlimited retries — 3 retries meant the socket gave up
            // permanently after 3 reconnect cycles.
            retryAttempts: Infinity,

            retryWait: async (retries) => {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.min(1000 * 2 ** retries, 30_000))
              );
            },

            shouldRetry: (errOrCloseEvent) => {
              if (errOrCloseEvent instanceof CloseEvent) {
                // 4400 bad request, 4401 unauthorized, 4403 forbidden — don't retry auth errors
                return ![4400, 4401, 4403].includes(errOrCloseEvent.code);
              }
              return true;
            },

            on: {
              connected: () => console.debug("[WS] connected"),
              closed: () => console.debug("[WS] closed"),
              error: (err) => console.warn("[WS] connection error", err),
            },
          })
        )
      : null;

  /* ── 4. Split: subscription → WS, everything else → HTTP ── */
  const splitLink = wsLink
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return (
            def.kind === "OperationDefinition" &&
            def.operation === "subscription"
          );
        },
        wsLink,
        httpAuthLink
      )
    : httpAuthLink;

  /* ── 5. Apollo Client ── */
  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            messages: {
              keyArgs: ["input", ["conversationId"]],
              merge(existing = [], incoming: any[]) {
                const existingIds = new Set(
                  (existing as any[]).map((ref: any) => ref.__ref ?? ref.id)
                );
                const newItems = (incoming as any[]).filter(
                  (ref: any) => !existingIds.has(ref.__ref ?? ref.id)
                );
                return [...existing, ...newItems];
              },
            },
          },
        },
      },
    }),
    connectToDevTools: process.env.NODE_ENV === "development",
  });
}

// FIX 3: create the client once at module level (SSR-safe: window check is
// inside buildApolloClient). useMemo with [] still re-runs on hot-reload and
// in some Next.js versions on every render — a module-level singleton does not.
let clientSingleton: ApolloClient<any> | null = null;

function getClient() {
  if (typeof window === "undefined") {
    // SSR: always create a fresh client per request
    return buildApolloClient();
  }
  // Client: reuse the same instance across all renders
  if (!clientSingleton) {
    clientSingleton = buildApolloClient();
  }
  return clientSingleton;
}

export function ApolloWrapper({ children }: { children: ReactNode }) {
  // useRef ensures the same client instance across re-renders even in
  // strict mode double-invocation, without recreating the WS connection.
  const clientRef = useRef<ApolloClient<any> | null>(null);
  if (!clientRef.current) {
    clientRef.current = getClient();
  }

  return (
    <ApolloProvider client={clientRef.current}>{children}</ApolloProvider>
  );
}