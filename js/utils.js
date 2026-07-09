// =========================================================
// Utilidades compartilhadas
// =========================================================

export function formatBRL(valor) {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function chaveMes(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function nomeMesExtenso(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  const data = new Date(ano, mes - 1, 1);
  const nome = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function formatDataBR(isoDate) {
  if (!isoDate) return "-";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export function pct(valor, meta) {
  if (!meta) return 0;
  return Math.min(100, Math.round((valor / meta) * 100));
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- Modal genérico ----------
export function abrirModal(html, { onMount } = {}) {
  fecharModal();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "active-modal-overlay";
  overlay.innerHTML = html;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal();
  });
  document.body.appendChild(overlay);
  if (onMount) onMount(overlay);
  return overlay;
}

export function fecharModal() {
  const el = document.getElementById("active-modal-overlay");
  if (el) el.remove();
}

// ---------- Confete + celebração ----------
export function celebrar(mensagem) {
  const overlay = document.createElement("div");
  overlay.id = "celebration-overlay";
  overlay.innerHTML = `<div class="celebration-msg">${mensagem}</div>`;
  document.body.appendChild(overlay);

  const cores = ["#1E5EFF", "#12B76A", "#F59E0B", "#5B8DEF", "#E5484D"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const size = 6 + Math.random() * 8;
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.width = size + "px";
    piece.style.height = size * 0.5 + "px";
    piece.style.background = cores[Math.floor(Math.random() * cores.length)];
    piece.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
    piece.style.animationDelay = Math.random() * 0.6 + "s";
    overlay.appendChild(piece);
  }

  setTimeout(() => overlay.remove(), 4200);
  overlay.addEventListener("click", () => overlay.remove());
}

// ---------- Iniciais para avatar ----------
export function iniciais(nome) {
  return nome
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
