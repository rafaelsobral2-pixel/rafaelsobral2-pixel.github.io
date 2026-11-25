/* ============================================================
   app.js — Orquestração da jornada JOVI Studio
   Da câmera ao feed: Seleciona → Analisa → Legenda → Compartilha,
   com performance percebida (skeleton, progress, toast).
   ============================================================ */

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const METRICS = [
    { key: "luz", label: "LUZ", color: "#f59e0b" },
    { key: "foco", label: "FOCO", color: "#2f5bff" },
    { key: "comp", label: "COMP.", color: "#8b5cf6" },
    { key: "expr", label: "EXPR.", color: "#10b981" },
  ];

  const SCREEN_TAB = { splash: 0, gallery: 0, selector: 1, processing: 1, score: 1, captions: 3, done: 3, favorites: 2 };
  let currentScreen = "splash";

  /* ---------------- Navegação entre telas ---------------- */
  function showScreen(id) {
    currentScreen = id;
    $$(".screen").forEach((s) => s.classList.remove("is-active"));
    const el = $("#screen-" + id);
    if (el) el.classList.add("is-active");

    // tema da status bar e visibilidade do tabbar
    $("#statusbar").classList.toggle("on-dark", id === "splash");
    const hideNav = id === "splash" || id === "processing";
    $(".tabbar").style.display = hideNav ? "none" : "";

    // destaque do tab
    const idx = SCREEN_TAB[id];
    $$(".tab").forEach((t, i) => t.classList.toggle("active", i === idx));

    $("#viewport").scrollTop = 0;
  }

  /* ---------------- Badge de score ---------------- */
  function badgeClass(v) {
    if (v >= 85) return "sb-high";
    if (v >= 75) return "sb-good";
    if (v >= 65) return "sb-mid";
    return "sb-low";
  }
  function gaugeColor(v) {
    if (v >= 85) return "#10b981";
    if (v >= 75) return "#2f5bff";
    if (v >= 65) return "#f59e0b";
    return "#64748b";
  }

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    $("#toast-text").textContent = msg;
    const t = $("#toast");
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------------- Scoring ---------------- */
  // garante que todas as fotos informadas tenham score calculado
  async function ensureScored(ids) {
    const pending = ids.filter((id) => !State.scores[id]);
    await Promise.all(
      pending.map(async (id) => {
        const p = State.photos.find((x) => x.id === id);
        if (p) {
          try { State.scores[id] = await Scoring.analyze(p.src); }
          catch { State.scores[id] = null; }
        }
      })
    );
  }

  /* ---------------- Galeria ---------------- */
  function tile(p, opts = {}) {
    const s = State.scores[p.id];
    const badge = s ? `<span class="score-badge ${badgeClass(s.total)}">${s.total}</span>` : "";
    return `
      <div class="relative rounded-xl overflow-hidden bg-slate-100 ${opts.cls || ""}" style="aspect-ratio:1" data-photo="${p.id}">
        <img src="${p.src}" alt="${p.label}" class="w-full h-full object-cover" loading="lazy"/>
        ${badge}
      </div>`;
  }

  function renderGallery() {
    const q = ($("#search").value || "").toLowerCase().trim();
    const list = State.photos.filter((p) => !q || p.label.toLowerCase().includes(q));

    // Destaques = top 3 por score
    const ranked = [...list].filter((p) => State.scores[p.id])
      .sort((a, b) => State.scores[b.id].total - State.scores[a.id].total);
    $("#highlights").innerHTML = ranked.slice(0, 3).map((p) => tile(p)).join("")
      || `<p class="col-span-3 text-sm text-slate-400 py-4 text-center">Calculando destaques…</p>`;

    $("#gallery-grid").innerHTML = list.map((p) => tile(p)).join("")
      || `<p class="col-span-3 text-sm text-slate-400 py-4 text-center">Nenhuma foto encontrada.</p>`;
  }

  /* ---------------- Favoritos ---------------- */
  function renderFavorites() {
    const favs = State.photos
      .filter((p) => State.scores[p.id] && State.scores[p.id].total >= 82)
      .sort((a, b) => State.scores[b.id].total - State.scores[a.id].total);
    $("#fav-empty").classList.toggle("hidden", favs.length > 0);
    $("#fav-grid").innerHTML = favs.map((p) => {
      const s = State.scores[p.id];
      return `<div class="relative rounded-xl overflow-hidden bg-slate-100" style="aspect-ratio:4/5" data-photo="${p.id}">
        <img src="${p.src}" alt="${p.label}" class="w-full h-full object-cover" loading="lazy"/>
        <span class="score-badge ${badgeClass(s.total)}">${s.total}</span>
        <span class="absolute bottom-2 right-2 text-white text-xs font-semibold drop-shadow">${p.label}</span>
      </div>`;
    }).join("");
  }

  /* ---------------- Seletor Inteligente ---------------- */
  function renderSelector() {
    $("#selector-grid").innerHTML = State.photos.map((p) => `
      <div class="pick ${State.selected.has(p.id) ? "selected" : ""}" style="aspect-ratio:1" data-pick="${p.id}">
        <img src="${p.src}" alt="${p.label}" loading="lazy"/>
        <span class="check">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>`).join("");
    updateSelCount();
  }

  function updateSelCount() {
    const n = State.selected.size;
    $("#selcount").textContent = `${n} selecionada${n === 1 ? "" : "s"} · Toque para marcar`;
    $("#btn-analyze").disabled = n === 0;
    $("#selstatus").textContent = n === 0 ? "Selecione ao menos 1 foto" : "Pronto para analisar";
  }

  function togglePick(id) {
    if (State.selected.has(id)) {
      State.selected.delete(id);
    } else {
      if (State.selected.size >= State.MAX_SELECT) { toast(`Máximo de ${State.MAX_SELECT} fotos`); return; }
      State.selected.add(id);
    }
    const el = $(`[data-pick="${id}"]`);
    if (el) el.classList.toggle("selected", State.selected.has(id));
    updateSelCount();
  }

  /* ---------------- Processamento (Pilar 5) ---------------- */
  const STEPS = ["Lendo os pixels…", "Calculando luminância…", "Avaliando nitidez…", "Analisando composição…", "Elegendo a melhor…"];

  async function runProcessing() {
    const skel = $("#proc-skeleton"), run = $("#proc-running");
    skel.classList.remove("hidden"); run.classList.add("hidden");
    $("#proc-bar").style.width = "0%"; $("#proc-pct").textContent = "0";

    // 1) skeleton curto (app "reage antes de terminar")
    await wait(650);
    skel.classList.add("hidden"); run.classList.remove("hidden");

    // 2) calcula os scores das selecionadas em paralelo à animação
    const ids = Array.from(State.selected);
    const scoring = ensureScored(ids);

    // 3) barra de progresso + textos de etapa
    await animateProgress((pct) => {
      $("#proc-bar").style.width = pct + "%";
      $("#proc-pct").textContent = Math.round(pct);
      const step = STEPS[Math.min(STEPS.length - 1, Math.floor(pct / (100 / STEPS.length)))];
      $("#proc-step").textContent = step;
    }, 2100);

    await scoring;

    // 4) elege a melhor foto entre as selecionadas
    State.best = ids
      .filter((id) => State.scores[id])
      .sort((a, b) => State.scores[b.id].total - State.scores[a.id].total)[0] || ids[0];

    renderScore();
    showScreen("score");
    renderGallery(); renderFavorites();
  }

  function animateProgress(onTick, dur) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function frame(now) {
        const t = Math.min(1, (now - t0) / dur);
        // easing suave
        const eased = 1 - Math.pow(1 - t, 2.2);
        onTick(eased * 100);
        if (t < 1) requestAnimationFrame(frame); else resolve();
      })(t0);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------- Score Visual (Telas 3) ---------------- */
  function renderScore() {
    const p = State.photos.find((x) => x.id === State.best);
    const s = State.scores[State.best];
    if (!p || !s) return;

    $("#score-img").src = p.src;
    $("#score-verdict-text").textContent = s.verdict;
    $("#score-reason").textContent = s.reason;

    // cor do veredito
    const vc = $("#score-verdict");
    vc.style.color = gaugeColor(s.total);
    vc.style.background = gaugeColor(s.total) + "1a";

    // gauge
    const r = 74, C = 2 * Math.PI * r;
    const fill = $("#gauge-fill");
    fill.style.stroke = gaugeColor(s.total);
    fill.style.strokeDasharray = C;
    fill.style.strokeDashoffset = C; // começa vazio
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = C * (1 - s.total / 100);
    });
    countUp($("#gauge-num"), s.total, 1100);

    // métricas
    $("#metrics").innerHTML = METRICS.map((m) => `
      <div class="rounded-xl border border-slate-100 p-3">
        <div class="flex items-baseline justify-between">
          <span class="text-[11px] font-bold tracking-wide text-slate-400">${m.label}</span>
          <span class="font-display font-extrabold text-lg" style="color:${m.color}">${s[m.key]}</span>
        </div>
        <div class="metric-track mt-2"><div class="metric-fill" data-w="${s[m.key]}" style="background:${m.color}"></div></div>
      </div>`).join("");
    requestAnimationFrame(() => {
      $$("#metrics .metric-fill").forEach((el) => { el.style.width = el.dataset.w + "%"; });
    });
  }

  function countUp(el, target, dur) {
    const t0 = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target);
      if (t < 1) requestAnimationFrame(frame);
    })(t0);
  }

  /* ---------------- Legenda com IA (Tela 4) ---------------- */
  function renderCaptions() {
    const s = State.scores[State.best];
    if (!s) return;
    State.captions = Captions.generate(s);
    State.chosenCaption = State.captions[0].text;

    const ACCENT = { select: "#2f5bff", score: "#f59e0b", caption: "#8b5cf6" };
    $("#caption-list").innerHTML = State.captions.map((c, i) => `
      <div class="caption-card rounded-xl border p-4 cursor-pointer transition ${i === 0 ? "ring-2" : ""}"
           style="border-color:${ACCENT[c.accent]}33; --tw-ring-color:${ACCENT[c.accent]}"
           data-cap="${i}">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold" style="color:${ACCENT[c.accent]}">${c.style}</span>
          <button class="copy-btn text-xs font-semibold text-slate-400 flex items-center gap-1" data-copy="${i}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Copiar
          </button>
        </div>
        <p class="text-navy leading-snug">"${c.text}"</p>
      </div>`).join("");
  }

  function chooseCaption(i) {
    State.chosenCaption = State.captions[i].text;
    $$(".caption-card").forEach((el, idx) => el.classList.toggle("ring-2", idx === i));
  }

  /* ---------------- Compartilhamento (Pilar 4) ---------------- */
  async function share() {
    const s = State.scores[State.best];
    const text = `${State.chosenCaption}\n\n📸 Escolhida pelo JOVI Studio · Score ${s.total}/100`;
    if (navigator.share) {
      try { await navigator.share({ title: "JOVI Studio", text }); return true; }
      catch (e) { if (e && e.name === "AbortError") return false; }
    }
    // fallback: copia a legenda
    await copyText(text);
    toast("Legenda copiada!");
    return true;
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove(); return true;
    }
  }

  /* ---------------- Concluído (Tela 5) ---------------- */
  function renderDone() {
    const p = State.photos.find((x) => x.id === State.best);
    const s = State.scores[State.best];
    if (p) $("#done-img").src = p.src;
    if (s) { $("#done-verdict").textContent = s.verdict; $("#done-score").textContent = s.total; }
    $("#done-caption").textContent = `"${State.chosenCaption}"`;
  }

  /* ---------------- Upload (Pilar 1: zero upload/servidor) ---------------- */
  async function handleUpload(files) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    const added = [];
    imgs.slice(0, 10).forEach((f, i) => {
      const id = "u" + Date.now() + i;
      const src = URL.createObjectURL(f);
      const photo = { id, src, label: f.name.replace(/\.[^.]+$/, "").slice(0, 20) || "Sua foto", uploaded: true };
      State.photos.unshift(photo);
      added.push(id);
    });
    toast(`${added.length} foto${added.length === 1 ? "" : "s"} adicionada${added.length === 1 ? "" : "s"}`);
    renderGallery(); renderSelector();
    await ensureScored(added);
    renderGallery(); renderFavorites();
  }

  /* ---------------- Eventos ---------------- */
  function wire() {
    // botões data-go
    document.body.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go) {
        const dest = go.dataset.go;
        if (dest === "processing") { showScreen("processing"); runProcessing(); return; }
        if (dest === "score" && !State.best) { toast("Analise fotos primeiro"); return; }
        if (dest === "captions") { if (!State.best) { toast("Analise fotos primeiro"); return; } renderCaptions(); }
        if (dest === "done") { share().then((ok) => { if (ok) { renderDone(); showScreen("done"); } }); return; }
        showScreen(dest);
        return;
      }

      // seleção de fotos
      const pick = e.target.closest("[data-pick]");
      if (pick) { togglePick(pick.dataset.pick); return; }

      // tocar numa foto da galeria/favoritos abre o seletor
      const ph = e.target.closest("[data-photo]");
      if (ph) { showScreen("selector"); return; }

      // copiar legenda
      const cp = e.target.closest("[data-copy]");
      if (cp) {
        const i = +cp.dataset.copy;
        copyText(State.captions[i].text).then(() => toast("Legenda copiada!"));
        chooseCaption(i);
        e.stopPropagation();
        return;
      }
      // escolher card de legenda
      const cap = e.target.closest("[data-cap]");
      if (cap) chooseCaption(+cap.dataset.cap);
    });

    // tabs
    $$(".tab").forEach((t) => t.addEventListener("click", () => {
      const dest = t.dataset.tab;
      if (dest === "captions" && !State.best) { toast("Analise fotos primeiro"); showScreen("gallery"); return; }
      if (dest === "captions") renderCaptions();
      if (dest === "favorites") renderFavorites();
      showScreen(dest);
    }));

    // busca
    $("#search").addEventListener("input", renderGallery);

    // upload
    $("#upload").addEventListener("change", (e) => handleUpload(e.target.files));

    // re-compartilhar
    $("#btn-reshare").addEventListener("click", () => share().then((ok) => ok && toast("Pronto para compartilhar!")));
  }

  /* ---------------- Init ---------------- */
  async function init() {
    State.photos = DEMO_PHOTOS.slice();
    renderGallery();
    renderFavorites();
    renderSelector();
    wire();

    // animação da splash → galeria
    animateProgress((p) => { $("#splash-bar").style.width = p + "%"; }, 1500)
      .then(() => showScreen("gallery"));

    // scoring das fotos-demo em background (badges reais na galeria)
    await ensureScored(State.photos.map((p) => p.id));
    renderGallery(); renderFavorites(); renderSelector();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
