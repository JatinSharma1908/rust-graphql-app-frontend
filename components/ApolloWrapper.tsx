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
import { ReactNode, useMemo } from "react";

const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("bl_token") : null;

export function ApolloWrapper({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
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
              // Backend WS route is /ws (not /graphql/ws)
              // Set NEXT_PUBLIC_GRAPHQL_WS_URL=ws://yourhost/ws in production
              url:
                process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ??
                "ws://localhost:8000/ws",

              // Only connects when first subscription is used
              lazy: true,

              connectionParams: () => {
                const token = getToken();
                return token ? { authorization: `Bearer ${token}` } : {};
              },

              retryAttempts: 3,

              retryWait: async (retries) => {
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.min(1000 * 2 ** retries, 10_000))
                );
              },

              shouldRetry: (errOrCloseEvent) => {
                if (errOrCloseEvent instanceof CloseEvent) {
                  return ![4400, 4401, 4403].includes(errOrCloseEvent.code);
                }
                return true;
              },

              on: {
                connected: () => console.debug("[WS] connected"),
                closed:    () => console.debug("[WS] closed"),
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
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}