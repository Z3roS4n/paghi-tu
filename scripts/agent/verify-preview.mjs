import { argsMap, exactPreviewTarget, readConfig } from "./preview-common.mjs";

const args = argsMap(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Uso: node scripts/agent/verify-preview.mjs --config /path/verified.json [--apply]");
  process.exit(0);
}
const config = readConfig(args.get("--config"));
const target = exactPreviewTarget(config.previewOrigin + "/", config.previewOrigin);
if (!args.has("--apply")) {
  console.log(JSON.stringify({ mode: "PLAN_ONLY", target, checks: ["anonymous Vercel challenge on page and API", "bypass reaches route without redirect", "exact origin", "manual production-off and WIF negative checks pending"] }));
  process.exit(0);
}
if (!process.env.VERCEL_PROTECTION_BYPASS) throw new Error("Bypass Preview richiesto solo in env di processo.");
const checks = [];
for (const path of ["/assistente", "/api/agent"]) {
  const anonymous = await fetch(target + path, { method: "GET", redirect: "manual", cache: "no-store" });
  const location = anonymous.headers.get("location");
  const challenge = ([302, 303, 307, 308].includes(anonymous.status) && location !== null && /^https:\/\/vercel\.com\//.test(location))
    || ([401, 403].includes(anonymous.status) && anonymous.headers.has("x-vercel-id") && /Authentication Required|Vercel Authentication|Deployment Protection/i.test((await anonymous.text()).slice(0, 10000)));
  const bypass = await fetch(target + path, { method: "GET", redirect: "manual", cache: "no-store", headers: { "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS } });
  const reachesRoute = path === "/api/agent" ? bypass.status === 405 : [200, 404].includes(bypass.status);
  checks.push({ path, anonymousStatus: anonymous.status, challenge, bypassStatus: bypass.status, reachesRoute, bypassRedirected: bypass.headers.has("location") });
}
const passed = checks.every((check) => check.challenge && check.reachesRoute && !check.bypassRedirected);
console.log(JSON.stringify({ target, checks, passed, pending: ["Production API 503 e zero provider chiamate", "WIF owner/project/environment negativi", "IAM altro DB negato", "Controlli costo/log/privacy e UI manuali"] }));
if (!passed) process.exitCode = 1;
