import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

async function createActorWithRetry(
  options?: Parameters<typeof createActorWithConfig>[0],
  retries = 5,
): Promise<backendInterface> {
  let lastError: unknown;
  for (let i = 1; i <= retries; i++) {
    try {
      const actor = await createActorWithConfig(options);
      return actor;
    } catch (e) {
      lastError = e;
      if (i < retries) {
        await new Promise((res) => setTimeout(res, i * 1500));
      }
    }
  }
  throw lastError;
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithRetry();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithRetry(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      // Wrap in try-catch: cold-start failures here must NOT kill the actor
      try {
        await actor._initializeAccessControlWithSecret(adminToken);
      } catch (e) {
        console.warn(
          "_initializeAccessControlWithSecret failed (cold start), continuing:",
          e,
        );
      }
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // Retry actor creation up to 3 times automatically
    retry: 3,
    retryDelay: (attempt) => attempt * 2000,
    enabled: true,
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
