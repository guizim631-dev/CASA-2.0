// =========================================================
// Calendário — dias de contribuições, contas pagas e extras
// =========================================================

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { chaveMes, nomeMesExtenso, formatDataBR } from "./utils.js";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
let mesExibidoCal = chaveMes();
let eventosCache = [];
let diaSelecionado = null;

export async function renderCalendario(container) {
  await carregarMes(mesExibidoCal);
  desenhar(container);
}

async function carregarMes(chave) {
  const snap = await getDoc(doc(db, "meses", chave));
  eventosCache = snap.exists() ? snap.data().eventos || [] : [];
}

function desenhar(container) {
  const [ano, mes] = mesExibidoCal.split("-").map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const hojeChave = chaveMes();
  const diaHoje = new Date().getDate();

  const eventosPorDia = {};
  eventosCache.forEach((ev) => {
    const dia = Number(ev.dia?.split("-")[2]);
    if (!dia) return;
    (eventosPorDia[dia] = eventosPorDia[dia] || []).push(ev);
  });

  let celulas = "";
  for (let i = 0; i < primeiroDia; i++) celulas += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= diasNoMes; d++) {
    const evs = eventosPorDia[d] || [];
    const isHoje = mesExibidoCal === hojeChave && d === diaHoje;
    const tipos = [...new Set(evs.map((e) => e.tipo))];
    celulas += `
      <div class="cal-day ${isHoje ? "today" : ""}" data-dia="${d}">
        ${d}
        <div class="dots">
          ${tipos.map((t) => `<span class="cal-dot ${t === "contribuicao" || t === "remocao_contribuicao" ? "contrib" : t === "conta" ? "conta" : "extra"}"></span>`).join("")}
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="view">
      <div class="section-title">Calendário</div>
      <div class="cal-header">
        <button class="cal-nav-btn" id="cal-prev">‹</button>
        <strong>${nomeMesExtenso(mesExibidoCal)}</strong>
        <button class="cal-nav-btn" id="cal-next">›</button>
      </div>
      <div class="card">
        <div class="cal-grid">
          ${DIAS_SEMANA.map((d) => `<div class="cal-dow">${d}</div>`).join("")}
          ${celulas}
        </div>
        <div class="cal-legend">
          <span><span class="cal-dot contrib"></span> Contribuição</span>
          <span><span class="cal-dot conta"></span> Conta paga</span>
          <span><span class="cal-dot extra"></span> Extra</span>
        </div>
      </div>
      <div class="cal-day-detail" id="cal-day-detail"></div>
    </div>
  `;

  container.querySelector("#cal-prev").addEventListener("click", () => mudarMes(container, -1));
  container.querySelector("#cal-next").addEventListener("click", () => mudarMes(container, 1));
  container.querySelectorAll(".cal-day[data-dia]").forEach((el) => {
    el.addEventListener("click", () => {
      diaSelecionado = Number(el.dataset.dia);
      desenharDetalheDia(container, eventosPorDia[diaSelecionado] || []);
    });
  });

  if (diaSelecionado) {
    desenharDetalheDia(container, eventosPorDia[diaSelecionado] || []);
  }
}

function desenharDetalheDia(container, eventos) {
  const el = container.querySelector("#cal-day-detail");
  if (!eventos.length) {
    el.innerHTML = `<p class="section-sub">Nenhum evento neste dia.</p>`;
    return;
  }
  el.innerHTML = eventos
    .map((ev) => {
      if (ev.tipo === "contribuicao") {
        return `<div class="hist-row"><span>💰 ${ev.pessoa} contribuiu</span><span>R$ ${ev.valor.toFixed(2)}</span></div>`;
      }
      if (ev.tipo === "remocao_contribuicao") {
        return `<div class="hist-row"><span>↩️ ${ev.pessoa} removeu contribuição</span><span>R$ ${Math.abs(ev.valor).toFixed(2)}</span></div>`;
      }
      if (ev.tipo === "conta") {
        return `<div class="hist-row"><span>✅ ${ev.contaNome} paga por ${ev.pessoa}</span><span>${formatDataBR(ev.dia)}</span></div>`;
      }
      return `<div class="hist-row"><span>🔧 Extra "${ev.extraNome}" criado por ${ev.pessoa}</span><span>${formatDataBR(ev.dia)}</span></div>`;
    })
    .join("");
}

async function mudarMes(container, delta) {
  const [ano, mes] = mesExibidoCal.split("-").map(Number);
  const novaData = new Date(ano, mes - 1 + delta, 1);
  mesExibidoCal = chaveMes(novaData);
  diaSelecionado = null;
  await carregarMes(mesExibidoCal);
  desenhar(container);
}
