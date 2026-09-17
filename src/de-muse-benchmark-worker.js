export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/healthz') return Response.json({status:'ok', benchmark:true});
    if (url.pathname !== '/run' || request.method !== 'POST') return new Response('Not found', {status:404});
    const auth = request.headers.get('authorization') || '';
    if (!env.BENCH_TOKEN || auth !== `Bearer ${env.BENCH_TOKEN}`) return new Response('Unauthorized', {status:401});
    const body = await request.json();
    const allowed = new Set(['@cf/qwen/qwen3.8-27b','@cf/meta/llama-3.3-70b-instruct-fp8-fast']);
    if (!allowed.has(body?.model)) return new Response('Model not allowed', {status:400});
    const options = {
      messages: Array.isArray(body.messages) ? body.messages : [],
      temperature: Number.isFinite(body.temperature) ? body.temperature : 0.2,
      max_tokens: Number.isFinite(body.max_tokens) ? body.max_tokens : 900
    };
    if (body.model.includes('qwen3.8')) {
      options.chat_template_kwargs = { enable_thinking: false };
    }
    const result = await env.AI.run(body.model, options);
    return Response.json({ok:true,result});
  }
};
