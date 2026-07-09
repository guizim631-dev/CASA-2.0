// =========================================================
// Contas da Casa — Água, Luz, Internet
// =========================================================

import { Estado, getMesRef } from "./state.js";
import { MEMBROS, CONTAS_FIXAS } from "./firebase-config.js";
import { abrirModal, fecharModal, toast, hojeISO, formatDataBR, formatBRL, pct } from "./utils.js";
import { updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { botaoEditarExtraHTML, ligarBotaoEditarExtra } from "./extras.js";

export function renderContas(container) {
  const mes = Estado.mesAtual;
  if (!mes) {
    container.innerHTML = `<div class="view"><p class="section-sub">Carregando...</p></div>`;
    return;
  }

  const totalArrecadado = Object.values(mes.contribuicoes).reduce((a, b) => a + b, 0);
  const pctExtra = pct(mes.extra.arrecadado, mes.extra.meta);

  container.innerHTML = `
    <div class="view">
      <div class="section-title">Contas da Casa</div>

      ${CONTAS_FIXAS.map((c) => cartaoConta(c, mes.contas[c.id])).join("")}

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>🔧</span> Extra</div>
          <button class="info-btn" data-info-extra>i</button>
        </div>
        ${
          mes.extra.nome
            ? `
          <div class="member-name">${mes.extra.nome}</div>
          <div class="extra-desc">${mes.extra.descricao || ""}</div>
          <div class="progress-meta"><span>${formatBRL(mes.extra.arrecadado)} de ${formatBRL(mes.extra.meta)}</span><span class="progress-pct ${pctExtra >= 100 ? "complete" : ""}">${pctExtra}%</span></div>
          <div class="progress-track"><div class="progress-fill ${pctExtra >= 100 ? "complete" : ""}" style="width:${pctExtra}%"></div></div>
        `
            : `<p class="extra-desc">Nenhum extra cadastrado neste mês.</p>`
        }
        ${botaoEditarExtraHTML()}
      </div>
    </div>
  `;

  container.querySelectorAll("[data-pagar]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalPagamento(btn.dataset.pagar));
  });
  container.querySelectorAll("[data-desfazer]").forEach((btn) => {
    btn.addEventListener("click", () => desfazerPagamento(btn.dataset.desfazer));
  });
  const infoExtra = container.querySelector("[data-info-extra]");
  if (infoExtra) {
    infoExtra.addEventListener("click", () =>
      abrirInfoModal("Extra", "Valor reservado para despesas extraordinárias definidas pela administradora.")
    );
  }
  ligarBotaoEditarExtra(container);
}

function cartaoConta(contaDef, dados) {
  const pago = dados?.status === "pago";
  return `
    <div class="card conta-card">
      <div class="conta-top">
        <div class="card-title"><span class="conta-icon">${contaDef.icone}</span> ${contaDef.nome}</div>
        <span class="status-pill ${pago ? "pago" : "pendente"}">${pago ? "✅ Pago" : "Pendente"}</span>
      </div>
      ${
        pago
          ? `<div class="conta-detalhe">
              Pago por: <strong>${dados.pagoPor}</strong><br/>
              Data: ${formatDataBR(dados.data)}
              ${dados.obs ? `<br/>Obs: ${dados.obs}` : ""}
            </div>
            <div class="conta-actions">
              <button class="btn-danger-sm" data-desfazer="${contaDef.id}" style="flex:1">Desfazer pagamento</button>
            </div>`
          : `<div class="conta-actions">
              <button class="btn-primary-sm" data-pagar="${contaDef.id}">Marcar como pago</button>
            </div>`
      }
    </div>
  `;
}

function abrirModalPagamento(contaId) {
  const contaDef = CONTAS_FIXAS.find((c) => c.id === contaId);
  abrirModal(
    `
    <div class="modal">
      <h3>Marcar ${contaDef.nome} como paga</h3>
      <div class="field">
        <label for="quem-pagou">Quem realizou o pagamento?</label>
        <select id="quem-pagou">
          ${Object.values(MEMBROS)
            .map((m) => `<option value="${m.nome}" ${m.nome === Estado.usuario?.nome ? "selected" : ""}>${m.nome}</option>`)
            .join("")}
        </select>
      </div>
      <div class="field">
        <label for="data-pagamento">Data do pagamento</label>
        <input type="date" id="data-pagamento" value="${hojeISO()}" />
      </div>
      <div class="field">
        <label for="obs-pagamento">Observação (opcional)</label>
        <textarea id="obs-pagamento" placeholder="Ex: Pago pelo aplicativo do banco"></textarea>
      </div>
      <div class="modal-actions">
        <button class="cancel" id="cancelar-pag">Cancelar</button>
        <button class="confirm" id="confirmar-pag">Confirmar</button>
      </div>
    </div>
  `,
    {
      onMount: (overlay) => {
        overlay.querySelector("#cancelar-pag").addEventListener("click", fecharModal);
        overlay.querySelector("#confirmar-pag").addEventListener("click", async () => {
          const pagoPor = overlay.querySelector("#quem-pagou").value;
          const data = overlay.querySelector("#data-pagamento").value;
          const obs = overlay.querySelector("#obs-pagamento").value.trim();
          await confirmarPagamento(contaId, contaDef.nome, pagoPor, data, obs);
          fecharModal();
        });
      }
    }
  );
}

async function confirmarPagamento(contaId, nomeConta, pagoPor, data, obs) {
  const ref = getMesRef();
  await updateDoc(ref, {
    [`contas.${contaId}`]: { status: "pago", pagoPor, data, obs: obs || null },
    eventos: arrayUnion({ tipo: "conta", dia: data, pessoa: pagoPor, contaId, contaNome: nomeConta, obs: obs || null })
  });
  toast(`${nomeConta} marcada como paga.`);
}

async function desfazerPagamento(contaId) {
  const ref = getMesRef();
  await updateDoc(ref, {
    [`contas.${contaId}`]: { status: "pendente", pagoPor: null, data: null, obs: null }
  });
  toast("Pagamento desfeito.");
}

function abrirInfoModal(titulo, texto) {
  abrirModal(
    `<div class="modal"><h3>${titulo}</h3><p>${texto}</p>
      <div class="modal-actions"><button class="confirm" id="fechar-info-conta" style="width:100%">Entendi</button></div>
    </div>`,
    {
      onMount: (overlay) => {
        overlay.classList.add("info-popup");
        overlay.querySelector("#fechar-info-conta").addEventListener("click", fecharModal);
      }
    }
  );
}
