import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor -- retry up to 5 times for cold canister
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            const actor = await createActorWithConfig();
            // Try a lightweight call to warm up the canister
            // Wrap _initializeAccessControlWithSecret so a cold-start failure
            // doesn't prevent the actor from being returned at all
            try {
              const adminToken = getSecretParameter("caffeineAdminToken") || "";
              await actor._initializeAccessControlWithSecret(adminToken);
            } catch {
              // Ignore -- the actor still works for login/register calls
            }
            return actor;
          } catch (e) {
            if (attempt < 5) {
              await delay(2000);
            } else {
              throw e;
            }
          }
        }
        // Fallback (TypeScript needs this)
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const actor = await createActorWithConfig(actorOptions);
          try {
            const adminToken = getSecretParameter("caffeineAdminToken") || "";
            await actor._initializeAccessControlWithSecret(adminToken);
          } catch {
            // Ignore -- actor still works for data calls
          }
          return actor;
        } catch (e) {
          if (attempt < 5) {
            await delay(2000);
          } else {
            throw e;
          }
        }
      }
      // Fallback
      return await createActorWithConfig(actorOptions);
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
    retry: 3,
    retryDelay: 2000,
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
