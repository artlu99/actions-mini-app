import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

const BASE_URL = "https://actions.artlu.xyz";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

app
	.use("*", cors())
	.use("*", secureHeaders())
	.use("*", csrf({ origin: [BASE_URL] }));

app.get("/", (c) => {
	const { MY_VAR } = c.env;
	return c.json({ MY_VAR });
});

export default app;
