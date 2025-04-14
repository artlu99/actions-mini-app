import type { CastParamType, CastResponse } from "@neynar/nodejs-sdk/build/api";
import { Redis } from "@upstash/redis/cloudflare";
import { fetcher } from "itty-fetcher";

const neynarApi = fetcher({ base: "https://api.neynar.com" });
const TTL = 30 * 24 * 60 * 60; // 30 days

const cachedFetcherGet = async <T>(env: Env, url: string) => {
  const redis = Redis.fromEnv(env);
  const cache = await redis.get(`neynar:${url}`);

  if (cache) {
    return cache as T;
  }

  const res = await neynarApi.get(url, undefined, {
    headers: {
      "x-api-key": env.NEYNAR_API_KEY,
      "x-neynar-experimental": "false",
    },
  });

  await redis.set(`neynar:${url}`, JSON.stringify(res), { ex: TTL });

  return res as T;
};

export const lookupCastByHashOrWarpcastUrl = async (
  env: Env,
  hashOrUrl: string
) => {
  const type: CastParamType = hashOrUrl.startsWith("https://warpcast.com/")
    ? "url"
    : "hash";

  try {
    const res = await cachedFetcherGet<CastResponse>(
      env,
      `/v2/farcaster/cast?identifier=${encodeURIComponent(
        hashOrUrl
      )}&type=${type}`
    );
    return res;
  } catch (error) {
    console.error(error);
    return null;
  }
};
