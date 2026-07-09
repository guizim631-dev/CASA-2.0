// =========================================================
// Dashboard — visão geral do mês
// =========================================================

import { Estado } from "./state.js";
import { formatBRL, nomeMesExtenso, pct } from "./utils.js";
import { CONTAS_FIXAS } from "./firebase-config.js";

export function renderDashboard(container) {
  const mes = Estado.mesAtual;
  if (!mes) {
    container.innerHTML = `<div class="view"><p class="section-sub">Carregando...</p></div>`;
    return;
  }

  const totalArrecadado = Object.values(mes.contribuicoes).reduce((a, b) => a + b, 0);
  const porcentagem = pct(totalArrecadado, mes.metaGeral);
  const completo = porcentagem >= 100;

  const contasStatus = CONTAS_FIXAS.map((c) => mes.contas[c.id]?.status === "pago");
  const pagas = contasStatus.filter(Boolean).length;
  const pendentes = contasStatus.length - pagas;

  container.innerHTML = `
    <div class="view">
      <div class="dash-hero">
        ${casaMedidor(porcentagem)}
        <div class="month-label">${nomeMesExtenso(Estado.chaveExibida)}</div>
        <div class="meta-value">${formatBRL(totalArrecadado)}</div>
        <div class="meta-goal">de ${formatBRL(mes.metaGeral)} da meta geral</div>
        <div class="progress-track">
          <div class="progress-fill ${completo ? "complete" : ""}" style="width:${porcentagem}%"></div>
        </div>
        <div class="progress-meta">
          <span>${completo ? "Meta batida! 🎉" : "em andamento"}</span>
          <span class="progress-pct ${completo ? "complete" : ""}">${porcentagem}%</span>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card ok">
          <div class="num">${pagas} de ${contasStatus.length}</div>
          <div class="label">Contas pagas</div>
        </div>
        <div class="stat-card pending">
          <div class="num">${pendentes}</div>
          <div class="label">Contas pendentes</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Resumo por integrante</div>
        ${Object.entries(mes.contribuicoes)
          .map(([chave, valor]) => resumoIntegrante(chave, valor))
          .join("")}
      </div>
    </div>
  `;
}

function resumoIntegrante(chave, valor) {
  const nomes = { junior: "Júnior", sirlene: "Sirlene", giovana: "Giovana", kevin: "Kevin" };
  const p = pct(valor, 400);
  return `
    <div class="progress-meta" style="margin-top:10px;">
      <span>${nomes[chave]}</span>
      <span>${formatBRL(valor)} (${p}%)</span>
    </div>
    <div class="progress-track" style="height:8px;margin-bottom:2px;">
      <div class="progress-fill ${p >= 100 ? "complete" : ""}" style="width:${p}%"></div>
    </div>
  `;
}

function casaMedidor(porcentagem) {
  // "casa-medidor": SVG de casa cujo interior enche como um líquido, conforme a % arrecadada
  const alturaTotal = 40; // altura útil de preenchimento dentro da casa
  const alturaPreenchida = (porcentagem / 100) * alturaTotal;
  const yTopo = 56 - alturaPreenchida;
  return `
    <svg class="house-gauge" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clipCasa">
          <path d="M38 8L68 32V68H8V32L38 8Z"/>
        </clipPath>
      </defs>
      <path d="M38 8L68 32V68H8V32L38 8Z" fill="rgba(255,255,255,.12)"/>
      <g clip-path="url(#clipCasa)">
        <rect x="0" y="${yTopo}" width="76" height="${alturaPreenchida + 10}" fill="rgba(255,255,255,.85)" style="transition: y 1s cubic-bezier(.22,.9,.3,1), height 1s cubic-bezier(.22,.9,.3,1)"/>
      </g>
      <path d="M38 8L68 32V68H8V32L38 8Z" stroke="white" stroke-opacity=".6" stroke-width="2"/>
    </svg>
  `;
}
