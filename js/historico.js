// =========================================================
// Histórico — meses anteriores e pagamentos de contas
// =========================================================

import { listarMesesHistorico } from "./state.js";
import { MEMBROS, META_INDIVIDUAL, CONTAS_FIXAS } from "./firebase-config.js";
import { formatBRL, formatDataBR, nomeMesExtenso } from "./utils.js";

export async function renderHistorico(container) {
  container.innerHTML = `<div class="view"><p class="section-sub">Carregando histórico...</p></div>`;
  const meses = await listarMesesHistorico();

  if (meses.length === 0) {
    container.innerHTML = `
      <div class="view">
        <div class="section-title">Histórico</div>
        <p class="section-sub">Ainda não há meses anteriores registrados.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="view">
      <div class="section-title">Histórico</div>
      ${meses.map((m) => blocoMes(m)).join("")}
    </div>
  `;
}

function blocoMes(mes) {
  const total = Object.values(mes.contribuicoes).reduce((a, b) => a + b, 0);
  const pagas = CONTAS_FIXAS.filter((c) => mes.contas[c.id]?.status === "pago");
  const todosConcluiram = Object.values(mes.contribuicoes).every((v) => v >= META_INDIVIDUAL);

  return `
    <div class="card hist-month">
      <h4>${nomeMesExtenso(mes.chave)}</h4>

      <div class="hist-list">
        ${
          todosConcluiram
            ? `<div class="hist-row"><span>Todos concluíram a meta</span><span class="hist-tag ok">✅</span></div>`
            : Object.entries(mes.contribuicoes)
                .map(
                  ([chave, valor]) => `
              <div class="hist-row">
                <span>${MEMBROS[chave].nome}</span>
                <span class="hist-tag ${valor >= META_INDIVIDUAL ? "ok" : "no"}">${valor >= META_INDIVIDUAL ? "✅" : "❌"}</span>
              </div>`
                )
                .join("")
        }
      </div>

      <div class="progress-meta" style="margin-top:14px;">
        <span>Total arrecadado</span><span><strong>${formatBRL(total)}</strong></span>
      </div>
      <div class="progress-meta">
        <span>Contas pagas</span><span>${pagas.length} de ${CONTAS_FIXAS.length}</span>
      </div>

      ${
        pagas.length
          ? `<div class="hist-list" style="margin-top:10px;">
              ${pagas
                .map((c) => {
                  const d = mes.contas[c.id];
                  return `<div class="hist-row">
                    <span>${c.icone} ${c.nome} — pago por ${d.pagoPor}</span>
                    <span>${formatDataBR(d.data)}</span>
                  </div>`;
                })
                .join("")}
            </div>`
          : ""
      }

      ${
        mes.extra?.nome
          ? `<div class="progress-meta" style="margin-top:10px;">
              <span>Extra: ${mes.extra.nome}</span>
              <span>${formatBRL(mes.extra.arrecadado)} de ${formatBRL(mes.extra.meta)}</span>
            </div>`
          : ""
      }
    </div>
  `;
}
