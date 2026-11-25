/* ============================================================
   captions.js — Legenda com IA (Pilar 3)
   Templates dinâmicos em 3 estilos (Direta, Emocional, Humor),
   alimentados pelo score e pelo "clima" da foto (luz alta/baixa).
   Português natural. Determinístico p/ a mesma foto.
   ============================================================ */

const Captions = (() => {
  const POOL = {
    direta: [
      "Luz na medida, momento certo. Essa vai pro feed.",
      "Enquadramento limpo, foco preciso. Pronta pra postar.",
      "Detalhe nítido, cor viva. Melhor take do dia.",
      "Simples e certeira. Sem filtro, só o momento.",
    ],
    emocional: [
      "Tem momentos que a gente só quer guardar. Esse é um deles.",
      "A luz certa transforma um instante em memória.",
      "Nem todo dia se repete — ainda bem que esse ficou registrado.",
      "Momentos assim lembram por que vale a pena olhar de novo.",
    ],
    humor: [
      "Tirei 30, mas o Studio já sabia qual era a boa.",
      "Photo dump? Não. Photo drop. Só a melhor.",
      "Minha câmera trabalhou, a IA escolheu, eu só postei.",
      "Spoiler: as outras 29 não passaram no teste.",
    ],
  };

  // escolhe índice de forma determinística com base no score
  function pick(arr, seed) { return arr[seed % arr.length]; }

  // gera as 3 legendas a partir do resultado da melhor foto
  function generate(result) {
    const seed = (result.total + result.luz + result.expr) | 0;
    return [
      { style: "Direta", accent: "select", text: pick(POOL.direta, seed) },
      { style: "Emocional", accent: "score", text: pick(POOL.emocional, seed + 1) },
      { style: "Humor", accent: "caption", text: pick(POOL.humor, seed + 2) },
    ];
  }

  return { generate };
})();
