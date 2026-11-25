/* ============================================================
   scoring.js — Score Visual (Pilar 2)
   Analisa os PIXELS da imagem via Canvas API, 100% no navegador.
   Sem upload, sem servidor. Calcula 4 heurísticas e um total 0–100.

     • Luz  ....... exposição / luminância média
     • Foco ....... nitidez (variância do Laplaciano)
     • Comp ....... composição (contraste + regra dos terços)
     • Expr ....... vivacidade do assunto (proxy de cor/contraste central)

   Retorna { total, luz, foco, comp, expr, verdict, reason }.
   ============================================================ */

const Scoring = (() => {
  const MAXDIM = 224; // reduz a imagem p/ análise rápida e estável

  // Carrega a imagem e devolve o ImageData reduzido + dimensões
  function toImageData(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(1, MAXDIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve({ data: ctx.getImageData(0, 0, w, h), w, h });
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Converte RGBA -> array de luminância (0–255)
  function luminanceArray(imgData) {
    const { data } = imgData;
    const gray = new Float32Array(data.length / 4);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    return gray;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // 1) LUZ — recompensa exposição equilibrada (nem escura, nem estourada)
  function scoreLuz(gray) {
    let sum = 0;
    for (let i = 0; i < gray.length; i++) sum += gray[i];
    const mean = sum / gray.length;          // 0–255
    // curva gaussiana centrada em ~135 (bem exposto)
    const ideal = 135, spread = 68;
    const g = Math.exp(-((mean - ideal) ** 2) / (2 * spread * spread));
    return { score: clamp(Math.round(45 + g * 54), 40, 99), mean };
  }

  // 2) FOCO — variância do Laplaciano (imagem nítida => alta variância)
  function scoreFoco(gray, w, h) {
    let mean = 0;
    const lap = new Float32Array(gray.length);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
        lap[i] = v; mean += v;
      }
    }
    const n = (w - 2) * (h - 2);
    mean /= n;
    let varr = 0;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const d = lap[y * w + x] - mean; varr += d * d;
      }
    varr /= n;
    // normaliza logaritmicamente (satura em imagens muito nítidas)
    const norm = clamp(Math.log10(varr + 1) / 3.1, 0, 1);
    return { score: clamp(Math.round(42 + norm * 57), 40, 99), varr };
  }

  // 3) COMPOSIÇÃO — contraste global + energia de borda nos terços
  function scoreComp(gray, w, h) {
    // contraste = desvio padrão da luminância
    let sum = 0; for (let i = 0; i < gray.length; i++) sum += gray[i];
    const mean = sum / gray.length;
    let varr = 0; for (let i = 0; i < gray.length; i++) varr += (gray[i] - mean) ** 2;
    const std = Math.sqrt(varr / gray.length);
    const contrast = clamp(std / 70, 0, 1);

    // regra dos terços: fração de energia de gradiente perto das interseções
    let totalE = 0, thirdsE = 0;
    const tx = [w / 3, (2 * w) / 3], ty = [h / 3, (2 * h) / 3];
    const rad = Math.min(w, h) / 6;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = gray[i + 1] - gray[i - 1];
        const gy = gray[i + w] - gray[i - w];
        const e = Math.abs(gx) + Math.abs(gy);
        totalE += e;
        for (const cx of tx) for (const cy of ty) {
          if (Math.hypot(x - cx, y - cy) < rad) { thirdsE += e; }
        }
      }
    }
    const thirds = totalE ? clamp((thirdsE / totalE) * 2.4, 0, 1) : 0;
    const s = 0.55 * contrast + 0.45 * thirds;
    return { score: clamp(Math.round(45 + s * 53), 40, 99), contrast, thirds };
  }

  // 4) EXPRESSÃO — proxy de vivacidade (saturação + contraste na região central)
  function scoreExpr(imgData, w, h) {
    const { data } = imgData;
    const x0 = Math.floor(w * 0.28), x1 = Math.floor(w * 0.72);
    const y0 = Math.floor(h * 0.22), y1 = Math.floor(h * 0.78);
    let satSum = 0, cnt = 0, lmin = 255, lmax = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        satSum += mx === 0 ? 0 : (mx - mn) / mx;
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (l < lmin) lmin = l; if (l > lmax) lmax = l;
        cnt++;
      }
    }
    const sat = clamp((satSum / cnt) / 0.55, 0, 1);
    const localContrast = clamp((lmax - lmin) / 210, 0, 1);
    const s = 0.6 * sat + 0.4 * localContrast;
    return { score: clamp(Math.round(46 + s * 52), 40, 99) };
  }

  function verdictFor(total) {
    if (total >= 85) return "Ótima para postar";
    if (total >= 75) return "Boa escolha";
    if (total >= 65) return "Publicável";
    return "Dá pra melhorar";
  }

  function reasonFor(m) {
    const labels = { luz: "luz", foco: "nitidez", comp: "composição", expr: "expressão" };
    const top = Object.entries({ luz: m.luz, foco: m.foco, comp: m.comp, expr: m.expr })
      .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => labels[k]);
    return `Melhor ${top[0]} e ${top[1]}.`;
  }

  // API pública: analisa 1 imagem
  async function analyze(src) {
    const { data: imgData, w, h } = await toImageData(src);
    const gray = luminanceArray(imgData);
    const luz = scoreLuz(gray);
    const foco = scoreFoco(gray, w, h);
    const comp = scoreComp(gray, w, h);
    const expr = scoreExpr(imgData, w, h);

    const total = clamp(Math.round(
      0.28 * luz.score + 0.30 * foco.score + 0.24 * comp.score + 0.18 * expr.score
    ), 40, 99);

    const m = { total, luz: luz.score, foco: foco.score, comp: comp.score, expr: expr.score };
    return { ...m, verdict: verdictFor(total), reason: reasonFor(m) };
  }

  return { analyze };
})();
