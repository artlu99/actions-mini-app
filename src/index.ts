import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { lookupCastByHashOrWarpcastUrl } from "./neynar";

const BASE_URL = "https://actions.artlu.xyz";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

app
  .use("*", cors())
  .use("*", secureHeaders())
  .use("*", csrf({ origin: [BASE_URL] }));

app
  .get("/", (c) => {
    const { MY_VAR, SECRET } = c.env;
    return c.json({ MY_VAR, SECRET });
  })
  .get(
    "/:hashOrUrl{.+}",
    cors({
      origin: [BASE_URL],
      allowMethods: ["GET"],
      allowHeaders: ["Content-Type"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    }),
    zValidator(
      "param",
      z.object({
        hashOrUrl: z
          .string()
          .min(1)
          .max(2000)
          .refine(
            (val) => {
              try {
                // If it's a URL, validate it
                if (val.includes("/")) {
                  const url = new URL(val);
                  return (
                    url.protocol === "https:" && url.hostname === "farcaster.xyz"
                  );
                }
                // If it's a hash, validate it's a alphanumeric cast hash
                return (
                  ((val.startsWith("0x") && val.length === 42) ||
                    val.length === 40) &&
                  /^[a-zA-Z0-9]+$/.test(val)
                );
              } catch {
                return false;
              }
            },
            {
              message: "Must be a valid URL or alphanumeric hash",
            }
          ),
      })
    ),
    async (c) => {
      const { hashOrUrl } = c.req.valid("param");

      try {
        const cast = await lookupCastByHashOrWarpcastUrl(c.env, hashOrUrl);

        if (!cast) {
          return c.json({ message: "Cast not found", hashOrUrl }, 404);
        }

        return c.json({
          fid: cast.cast.author.fid,
          hash: cast.cast.hash,
          parentUrl: cast.cast.parent_url,
          channel: cast.cast.channel,
          timestamp: cast.cast.timestamp,
          text: cast.cast.text,
        });
      } catch (error) {
        console.error("Error fetching cast:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

export default app;
