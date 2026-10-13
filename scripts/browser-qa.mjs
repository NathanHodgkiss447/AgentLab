/** Actual Chrome/CDP checks. Requires an isolated Chrome on port 9225 and a running app. */
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.AGENTLAB_BASE_URL ?? "http://127.0.0.1:3000";
const debug = process.env.AGENTLAB_CHROME_URL ?? "http://127.0.0.1:9225";
const directory = new URL("../docs/screenshots/", import.meta.url);
await mkdir(directory, { recursive: true });
const target = await fetch(`${debug}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let sequence = 0; const pending = new Map(); const errors = []; const requests = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const job = pending.get(message.id); pending.delete(message.id);
    if (message.error) job?.reject(new Error(JSON.stringify(message.error))); else job?.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args.map(a => a.value ?? a.description).join(" "));
  if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
};
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}
async function until(expression, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(`Timed out waiting for: ${expression}`);
}
async function navigate(path, selector = "h1") {
  await send("Page.navigate", { url: new URL(path, base).href });
  await until(`document.readyState === 'complete' && Boolean(document.querySelector(${JSON.stringify(selector)}))`);
  await new Promise(resolve => setTimeout(resolve, 500));
}
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); }
async function screenshot(name) {
  const metrics = await send("Page.getLayoutMetrics"); const bounds = metrics.cssContentSize;
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: bounds.width, height: bounds.height, scale: 1 } });
  await writeFile(new URL(name, directory), Buffer.from(result.data, "base64"));
}
async function noOverflow() { assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "horizontal overflow"); }
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
try {
  await navigate("/"); await noOverflow(); await screenshot("landing-desktop.png");
  await click('a[href="/dashboard?mode=demo"]'); await until('Boolean(document.querySelector("button[aria-label=\"Start demo\"]"))');
  await screenshot("dashboard-idle-desktop.png");
  await evaluate("localStorage.removeItem('agentlab.sessions.v1'); localStorage.setItem('agentlab.preferences.v1',JSON.stringify({demoMode:true,autoSave:true,reducedMotion:false}))");
  for (const id of ["customer-support", "product-discovery", "knowledge-boundaries"]) {
    await navigate(`/dashboard?mode=demo&scenario=${id}`, 'button[aria-label="Start demo"]');
    await click('button[aria-label="Session options"]');
    await evaluate("const speed=document.querySelector('#playback-speed'); speed.value='4'; speed.dispatchEvent(new Event('change',{bubbles:true}))");
    await click('button[aria-label="Session options"]');
    // Keep this workflow/layout check independent of the device's voice engine.
    await evaluate("document.querySelector('button[aria-label=\"Mute demo audio\"]:not(:disabled)')?.click()");
    await click('button[aria-label="Start demo"]');
    await until('Boolean(document.querySelector("button[aria-label=\"Stop demo\"]"))');
    if (id === "customer-support") { await new Promise(resolve => setTimeout(resolve, 1600)); await screenshot("dashboard-playing-desktop.png"); }
    await until('Boolean(document.querySelector("a[href^=\"/sessions/\"]"))', 20000);
    assert.equal(await evaluate("document.querySelectorAll('.messages li').length"), 6);
    await click('a[href^="/sessions/"]'); await until('Boolean(document.querySelector("#evaluation-notes"))');
    await click('input[type="checkbox"]'); await click('input[value="pass"]');
    await evaluate("{ const notes=document.querySelector('#evaluation-notes'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(notes,'Browser verified demo evaluation.'); notes.dispatchEvent(new Event('input',{bubbles:true})); }");
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save session')).click()");
    await until("document.body.textContent.includes('Session saved in this browser.')");
    if (id === "customer-support") await screenshot("evaluation-desktop.png");
  }
  await navigate("/sessions"); assert.equal(await evaluate("document.querySelectorAll('.history-table tbody tr').length"), 3); await screenshot("history-desktop.png");
  await click('button[aria-label="Delete session"]'); await until('Boolean(document.querySelector("[role=dialog]"))');
  await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent==='Cancel').click()");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('agentlab.sessions.v1')).sessions.length"), 3);
  await navigate("/scenarios"); await screenshot("scenarios-desktop.png"); await noOverflow();
  await navigate("/settings"); await screenshot("settings-desktop.png"); await noOverflow();
  for (const width of [375, 390, 768]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: width < 768 });
    for (const path of ["/", "/dashboard?mode=demo", "/scenarios", "/sessions", "/settings"]) {
      await navigate(path, path.startsWith("/dashboard") ? 'button[aria-label="Start demo"]' : "h1"); await noOverflow();
      if (width === 390) await screenshot(`${path.split("?")[0].slice(1) || "landing"}-mobile.png`);
    }
  }
  assert.ok(!requests.some(url => /api\.elevenlabs\.|\/api\/voice\/signed-url/.test(url)), "Demo called voice API");
  const rejection = await fetch(new URL("/api/voice/signed-url", base), { method: "POST" }); assert.equal(rejection.status, 403);
  assert.deepEqual(errors, [], "browser errors");
  console.log("PASS: three scenarios, review/save/history, navigation, mobile overflow, no voice requests, 403 endpoint, and no console errors.");
  await writeFile(new URL("../verification-browser.json", directory), JSON.stringify({ verifiedAt: new Date().toISOString(), base, result: "passed", errors, screenshots: "docs/screenshots", widths: [1280, 375, 390, 768] }, null, 2));
} finally { ws.close(); await fetch(`${debug}/json/close/${target.id}`); }
