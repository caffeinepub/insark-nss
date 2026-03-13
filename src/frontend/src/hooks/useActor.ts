import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      // Retry actor creation up to 5 times with backoff on cold starts
      let lastError: unknown;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          if (!isAuthenticated) {
            return await createActorWithConfig();
          }

          const actorOptions = {
            agentOptions: {
              identity,
            },
          };

          const actor = await createActorWithConfig(actorOptions);
          const adminToken = getSecretParameter("caffeineAdminToken") || "";

          // Wrap initialization in try/catch so a cold-start failure
          // doesn't prevent the actor from being returned
          try {
            await actor._initializeAccessControlWithSecret(adminToken);
          } catch {
            // Initialization failed (cold start / canister waking up)
            // The actor is still usable for all other calls
          }

          return actor;
        } catch (err) {
          lastError = err;
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          }
        }
      }
      throw lastError;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
    retry: 3,
    retryDelay: (attempt) => 2000 * (attempt + 1),
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
