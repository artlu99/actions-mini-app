import type { CastParamType, CastResponse } from "@neynar/nodejs-sdk/build/api";
import { fetcher } from "itty-fetcher";

const neynarApi = fetcher({ base: "https://api.neynar.com" });
const TTL = 30 * 24 * 60 * 60; // 30 days

const cachedFetcherGet = async <T>(env: Env, url: string) => {
  const cache = await env.KV.get(`neynar:${url}`);

  if (cache) {
    return JSON.parse(cache) as T;
  }

  const res = await neynarApi.get(url, undefined, {
    headers: {
      "x-api-key": env.NEYNAR_API_KEY,
      "x-neynar-experimental": "false",
    },
  });

  await env.KV.put(`neynar:${url}`, JSON.stringify(res), {
    expirationTtl: TTL,
  });

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
