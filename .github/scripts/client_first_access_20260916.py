from pathlib import Path

worker_path = Path("src/worker.js")
worker = worker_path.read_text(encoding="utf-8")
start_marker = 'function accessChoice(user, message = "") {'
end_marker = '\nfunction authPage('
start = worker.find(start_marker)
end = worker.find(end_marker, start)
if start < 0 or end <= start:
    raise SystemExit("accessChoice boundaries not found")
current = worker[start:end]
for sentinel in (
    'href="/area-clienti"',
    'href="/area-amministratore"',
    'Scegli la tua area',
    'if (user) return redirect(user.isAdmin ? "/admin" : "/studio");',
):
    if sentinel not in current:
        raise SystemExit(f"accessChoice guard missing: {sentinel}")
replacement = '''function accessChoice(user, message = "") {
  if (user) return redirect(user.isAdmin ? "/admin" : "/studio");
  return redirect("/area-clienti");
}'''
worker_path.write_text(worker[:start] + replacement + worker[end:], encoding="utf-8")

smoke_path = Path("test/smoke.mjs")
smoke = smoke_path.read_text(encoding="utf-8")
smoke_start = 'const accessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env)).text();'
smoke_end = 'console.log("/accesso: schermate cliente e amministratore separate");'
s = smoke.find(smoke_start)
e = smoke.find(smoke_end, s)
if s < 0 or e < 0:
    raise SystemExit("smoke access-choice block not found")
e += len(smoke_end)
replacement_smoke = '''const accessResponse = await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env);
if (accessResponse.status !== 303 || accessResponse.headers.get("location") !== "/area-clienti") throw new Error("Accesso: /accedi non porta direttamente all’Area clienti");
const clientAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-clienti"), env)).text();
if (!clientAccessHtml.includes('action="/area-clienti"') || !clientAccessHtml.includes("Accedi al tuo Studio") || /name="password"[^>]*minlength/.test(clientAccessHtml)) throw new Error("Accesso clienti: schermata o compatibilità password storiche non valida");
const adminAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore"), env)).text();
if (!adminAccessHtml.includes('action="/area-amministratore"') || !adminAccessHtml.includes("sblocco dei pagamenti")) throw new Error("Accesso amministratore: schermata non valida");
console.log("/accesso: percorso pubblico client-first; area amministratore diretta preservata");'''
smoke_path.write_text(smoke[:s] + replacement_smoke + smoke[e:], encoding="utf-8")

Path("test/client-first-access-smoke.mjs").write_text('''import worker from "../src/worker.js";\n\nconst DB = {\n  prepare(sql = "") {\n    return {\n      bind() { return this; },\n      async run() { return { success: true }; },\n      async first() { return sql === "SELECT 1 AS ok" ? { ok: 1 } : null; },\n      async all() { return { results: [] }; }\n    };\n  },\n  async batch(statements) { return statements.map(() => ({ success: true })); }\n};\nconst env = { DB, APP_URL: "https://www.splendoria.vip", ADMIN_EMAIL: "admin@example.invalid", EMAIL_FROM: "contatti@splendoria.vip", AI: { async run() { return { response: "ok" }; } } };\n\nconst choice = await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env);\nif (choice.status !== 303 || choice.headers.get("location") !== "/area-clienti") throw new Error("anonymous /accedi must redirect to /area-clienti");\nconst client = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti"), env);\nif (client.status !== 200 || !(await client.text()).includes('action="/area-clienti"')) throw new Error("client login route changed unexpectedly");\nconst admin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore"), env);\nif (admin.status !== 200 || !(await admin.text()).includes('action="/area-amministratore"')) throw new Error("direct admin login route changed unexpectedly");\nconsole.log("client-first access: anonymous choice removed; client/admin direct routes preserved");\n''', encoding="utf-8")

print("client-first access patch prepared")
