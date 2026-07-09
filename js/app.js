// =========================================================
// App — bootstrap, navegação entre abas e tema claro/escuro
// =========================================================

import { renderLogin, logout, iniciarObservadorAuth } from "./auth.js";
import { Estado, observarMes, aoAtualizar } from "./state.js";
import { renderDashboard } from "./dashboard.js";
import { renderContribuicoes } from "./contribuicoes.js";
import { renderContas } from "./contas.js";
import { renderHistorico } from "./historico.js";
import { renderCalendario } from "./calendario.js";
import { iniciais } from "./utils.js";

const root = document.getElementById("root");
let abaAtiva = "dashboard";

const ABAS = {
  dashboard: { titulo: "Início", render: renderDashboard, icone: iconeHome() },
  contribuicoes: { titulo: "Contribuições", render: renderContribuicoes, icone: iconeMoeda() },
  contas: { titulo: "Contas", render: renderContas, icone: iconeContas() },
  historico: { titulo: "Histórico", render: renderHistorico, icone: iconeHistorico() },
  calendario: { titulo: "Calendário", render: renderCalendario, icone: iconeCalendario() }
};

iniciarObservadorAuth(aoLogar, aoDeslogar);

function aoDeslogar() {
  document.getElementById("loading-screen")?.classList.add("hidden");
  renderLogin(root);
}

async function aoLogar() {
  document.getElementById("loading-screen")?.classList.add("hidden");
  aplicarTemaInicial();
  await observarMes();
  montarShell();
}

aoAtualizar(() => {
  const container = document.getElementById("view-container");
  if (container) ABAS[abaAtiva].render(container);
});

function montarShell() {
  root.innerHTML = `
    <div class="app-shell">
      <nav class="bottom-nav" id="bottom-nav">
        ${Object.entries(ABAS)
          .map(
            ([id, aba]) => `
          <button class="nav-item ${id === abaAtiva ? "active" : ""}" data-aba="${id}">
            ${aba.icone}
            <span>${aba.titulo}</span>
          </button>`
          )
          .join("")}
      </nav>
      <div style="flex:1;display:flex;flex-direction:column;">
        <header class="topbar">
          <div class="brand">
            ${iconeCasaMarca()}
            Finanças da Casa
          </div>
          <div class="topbar-actions">
            <button class="theme-toggle" id="theme-toggle">${iconeTema()}</button>
            <span class="avatar">${iniciais(Estado.usuario.nome)}</span>
            <button class="logout-btn" id="btn-logout">Sair</button>
          </div>
        </header>
        <main class="main-content" id="view-container"></main>
      </div>
    </div>
    <div id="toast"></div>
  `;

  ABAS[abaAtiva].render(document.getElementById("view-container"));

  document.querySelectorAll("[data-aba]").forEach((btn) => {
    btn.addEventListener("click", () => trocarAba(btn.dataset.aba));
  });
  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("theme-toggle").addEventListener("click", alternarTema);
}

function trocarAba(id) {
  abaAtiva = id;
  document.querySelectorAll("[data-aba]").forEach((b) => b.classList.toggle("active", b.dataset.aba === id));
  ABAS[id].render(document.getElementById("view-container"));
}

// ---------- Tema claro/escuro ----------
function aplicarTemaInicial() {
  const salvo = localStorage.getItem("tema") || "light";
  document.documentElement.setAttribute("data-theme", salvo);
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme");
  const novo = atual === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", novo);
  localStorage.setItem("tema", novo);
}

// ---------- Ícones (inline SVG, sem dependências externas) ----------
function iconeHome() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11L12 4l9 7"/><path d="M5 10v10h14V10"/></svg>`;
}
function iconeMoeda() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.2c0 2.8-6 1.3-6 4 0 1.3 1.3 2.3 3 2.3s3-.9 3-2.1"/></svg>`;
}
function iconeContas() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`;
}
function iconeHistorico() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`;
}
function iconeCalendario() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
}
function iconeTema() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
}
function iconeCasaMarca() {
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 6L58 26V56H6V26L32 6Z" fill="#1E5EFF"/>
    <rect x="16" y="30" width="32" height="26" fill="var(--surface)"/>
    <rect x="27" y="40" width="10" height="16" fill="#1E5EFF"/>
  </svg>`;
}
