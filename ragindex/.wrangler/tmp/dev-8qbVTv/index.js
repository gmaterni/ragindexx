var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Clear-Key"
};
var _createJsonResponse = /* @__PURE__ */ __name(function(data, status = 200) {
  const body = JSON.stringify(data);
  const response = new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
  return response;
}, "_createJsonResponse");
var handlePostAnalytics = /* @__PURE__ */ __name(async function(request, env) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    console.error("handlePostAnalytics: Error parsing JSON", error);
    const errorResponse = _createJsonResponse({ error: "Invalid JSON" }, 400);
    return errorResponse;
  }
  const appName = body.appName;
  const userId = body.userId;
  const actionName = body.actionName;
  if (!appName || !userId || !actionName) {
    const missingResponse = _createJsonResponse({ error: "Missing required fields: appName, userId, actionName" }, 400);
    return missingResponse;
  }
  const userAgent = body.userAgent || null;
  const timezone = body.timezone || null;
  const language = body.language || null;
  const referrer = body.referrer || null;
  const urlParams = body.urlParams ? JSON.stringify(body.urlParams) : null;
  const timestamp = body.timestamp || Math.floor(Date.now() / 1e3);
  let result = null;
  try {
    const insertResult = await env.DB.prepare(
      "INSERT INTO analytics (app_name, user_id, action_name, user_agent, timezone, language, referrer, url_params, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(appName, userId, actionName, userAgent, timezone, language, referrer, urlParams, timestamp).run();
    result = _createJsonResponse({ success: true, id: insertResult.meta.last_row_id }, 201);
  } catch (error) {
    console.error("handlePostAnalytics: DB Error", error);
    result = _createJsonResponse({ error: "Database error" }, 500);
  }
  return result;
}, "handlePostAnalytics");
var handleGetAnalytics = /* @__PURE__ */ __name(async function(request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 1e3);
  const appName = url.searchParams.get("appName");
  const actionName = url.searchParams.get("actionName");
  const userId = url.searchParams.get("userId");
  let query = "SELECT * FROM analytics WHERE 1=1";
  const params = [];
  if (appName) {
    query += " AND app_name = ?";
    params.push(appName);
  }
  if (actionName) {
    query += " AND action_name = ?";
    params.push(actionName);
  }
  if (userId) {
    query += " AND user_id = ?";
    params.push(userId);
  }
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  let result = null;
  try {
    const stmt = env.DB.prepare(query);
    const dbResult = await stmt.bind(...params).all();
    result = _createJsonResponse(dbResult.results);
  } catch (error) {
    console.error("handleGetAnalytics: DB Error", error);
    result = _createJsonResponse({ error: "Database error" }, 500);
  }
  return result;
}, "handleGetAnalytics");
var handleGetAnalyticsById = /* @__PURE__ */ __name(async function(request, env, id) {
  let result = null;
  try {
    const dbResult = await env.DB.prepare("SELECT * FROM analytics WHERE id = ?").bind(id).first();
    if (!dbResult) {
      result = _createJsonResponse({ error: "Not found" }, 404);
    } else {
      result = _createJsonResponse(dbResult);
    }
  } catch (error) {
    console.error("handleGetAnalyticsById: DB Error", error);
    result = _createJsonResponse({ error: "Database error" }, 500);
  }
  return result;
}, "handleGetAnalyticsById");
var handlePostQuery = /* @__PURE__ */ __name(async function(request, env) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    const errorResponse = _createJsonResponse({ error: "Invalid JSON" }, 400);
    return errorResponse;
  }
  const sql = body.sql ? body.sql.trim() : "";
  if (!sql.toUpperCase().startsWith("SELECT")) {
    const forbiddenResponse = _createJsonResponse({ error: "Only SELECT queries are allowed" }, 403);
    return forbiddenResponse;
  }
  const forbiddenPatterns = [/DROP/i, /DELETE/i, /INSERT/i, /UPDATE/i, /ALTER/i, /TRUNCATE/i];
  const isForbidden = forbiddenPatterns.some((pattern) => pattern.test(sql));
  if (isForbidden) {
    const unsafeResponse = _createJsonResponse({ error: "SQL statement contains forbidden keywords" }, 403);
    return unsafeResponse;
  }
  let result = null;
  try {
    const dbResult = await env.DB.prepare(sql).all();
    result = _createJsonResponse({ results: dbResult.results, meta: dbResult.meta });
  } catch (error) {
    console.error("handlePostQuery: DB Error", error);
    result = _createJsonResponse({ error: error.message }, 500);
  }
  return result;
}, "handlePostQuery");
var handleDeleteClear = /* @__PURE__ */ __name(async function(request, env) {
  const clearKey = request.headers.get("X-Clear-Key");
  const SECRET_KEY = env.CLEAR_KEY || "ragindex-secret-clear-2026";
  if (clearKey !== SECRET_KEY) {
    const unauthorizedResponse = _createJsonResponse({ error: "Unauthorized" }, 401);
    return unauthorizedResponse;
  }
  let result = null;
  try {
    const dbResult = await env.DB.prepare("DELETE FROM analytics").run();
    result = _createJsonResponse({ success: true, deleted: dbResult.meta.rows_written });
  } catch (error) {
    console.error("handleDeleteClear: DB Error", error);
    result = _createJsonResponse({ error: "Database error" }, 500);
  }
  return result;
}, "handleDeleteClear");
var src_default = {
  /**
   * Handler principale fetch per il Worker.
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      const optionsResponse = new Response(null, { headers: corsHeaders });
      return optionsResponse;
    }
    let response = null;
    if (path === "/api/analytics") {
      if (method === "POST") {
        response = await handlePostAnalytics(request, env);
      } else if (method === "GET") {
        response = await handleGetAnalytics(request, env);
      }
    } else if (path.startsWith("/api/analytics/")) {
      const id = path.split("/").pop();
      if (id === "clear") {
        if (method === "DELETE") {
          response = await handleDeleteClear(request, env);
        }
      } else if (method === "GET") {
        response = await handleGetAnalyticsById(request, env, id);
      }
    } else if (path === "/api/query" && method === "POST") {
      response = await handlePostQuery(request, env);
    }
    if (!response) {
      response = _createJsonResponse({ error: "Not Found" }, 404);
    }
    return response;
  }
};

// ../../../../../home/ua/.nvm/versions/node/v25.4.0/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../home/ua/.nvm/versions/node/v25.4.0/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-HAKt7X/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../home/ua/.nvm/versions/node/v25.4.0/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-HAKt7X/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
