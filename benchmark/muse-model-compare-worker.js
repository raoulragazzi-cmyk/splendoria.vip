const MODELS = new Set([
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/moonshotai/kimi-k2.6"
]);

function extractText(result) {
  if (typeof result === "string") return result.trim();
  if (typeof result?.response === "string") return result.response.trim();
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map(part => part?.text || part?.content || "").join("").trim();
  return "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") return Response.json({ status: "ok", ai: Boolean(env.AI?.run) });
    if (request.method !== "POST" || url.pathname !== "/run") return new Response("Not found", { status: 404 });
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
    const model = String(body?.model || "");
    if (!MODELS.has(model)) return Response.json({ error: "model_not_allowed" }, { status: 400 });
    const messages = [
      { role: "system", content: String(body?.system || "") },
      { role: "user", content: String(body?.user || "") }
    ];
    const options = {
      messages,
      temperature: 0.12,
      max_tokens: Math.max(128, Math.min(2400, Number(body?.maxTokens) || 1200))
    };
    if (model === "@cf/moonshotai/kimi-k2.6") options.chat_template_kwargs = { thinking: false };
    const started = Date.now();
    try {
      const result = await env.AI.run(model, options);
      return Response.json({
        ok: true,
        model,
        elapsedMs: Date.now() - started,
        text: extractText(result),
        usage: result?.usage || null,
        resultKeys: result && typeof result === "object" ? Object.keys(result) : []
      });
    } catch (error) {
      return Response.json({
        ok: false,
        model,
        elapsedMs: Date.now() - started,
        error: String(error?.message || error)
      }, { status: 200 });
    }
  }
};
