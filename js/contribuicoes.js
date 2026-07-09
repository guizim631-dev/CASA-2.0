// =========================================================
// Contribuições — cartões dos 4 integrantes + cartão Mercado
// =========================================================

import { Estado, getMesRef } from "./state.js";
import { MEMBROS, META_INDIVIDUAL } from "./firebase-config.js";
import { formatBRL, pct, abrirModal, fecharModal, celebrar, toast, hojeISO, iniciais } from "./utils.js";
import {
  updateDoc,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function renderContribuicoes(container) {
  const mes = Estado.mesAtual;
  if (!mes) {
    container.innerHTML = `<div class="view"><p class="section-sub">Carregando...</p></div>`;
    return;
  }

  const total = Object.values(mes.contribuicoes).reduce((a, b) => a + b, 0);
  const pctMercado = pct(total, mes.metaGeral);

  container.innerHTML = `
    <div class="view">
      <div class="section-title">Contribuições</div>
      <div class="section-sub">Meta individual: ${formatBRL(META_INDIVIDUAL)}</div>

      ${Object.entries(MEMBROS)
        .map(([chave, m]) => cartaoIntegrante(chave, m, mes.contribuicoes[chave]))
        .join("")}

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>🛒</span> Mercado</div>
          <button class="info-btn" data-info="mercado">i</button>
        </div>
        <div class="progress-meta"><span>${formatBRL(total)} arrecadado</span><span class="progress-pct">${pctMercado}%</span></div>
        <div class="progress-track">
          <div class="progress-fill ${pctMercado >= 100 ? "complete" : ""}" style="width:${pctMercado}%"></div>
        </div>
        <div class="progress-meta"><span>Meta: ${formatBRL(mes.metaGeral)}</span><span></span></div>
      </div>
    </div>
  `;

  container.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalContribuicao(btn.dataset.add));
  });
  container.querySelectorAll("[data-remover]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalRemoverContribuicao(btn.dataset.remover));
  });

  container.querySelectorAll("[data-info='mercado']").forEach((btn) => {
    btn.addEventListener("click", () =>
      abrirInfo("Mercado", "Representa o dinheiro disponível para alimentação da família neste mês.")
    );
  });
}

function cartaoIntegrante(chave, membro, valor) {
  const p = pct(valor, META_INDIVIDUAL);
  const completo = p >= 100;
  const restante = Math.max(0, META_INDIVIDUAL - valor);
  const souEu = Estado.usuario?.chave === chave;

  return `
    <div class="card member-card">
      <div class="card-row">
        <span class="avatar">${iniciais(membro.nome)}</span>
        <div style="flex:1;">
          <div class="member-name">${membro.nome}</div>
          <div class="member-remaining">${formatBRL(valor)} de ${formatBRL(META_INDIVIDUAL)}</div>
        </div>
        <span class="progress-pct ${completo ? "complete" : ""}">${p}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${completo ? "complete" : ""}" style="width:${p}%"></div>
      </div>
      ${
        completo
          ? `<div class="meta-concluida">🎉 Parabéns! Meta concluída.</div>`
          : `<div class="member-remaining" style="margin-top:8px;">Faltam ${formatBRL(restante)}</div>`
      }
      ${
        souEu
          ? `<div style="display:flex;gap:10px;margin-top:14px;">
              <button class="btn-add" data-add="${chave}" style="margin-top:0;flex:1;">Adicionar</button>
              <button class="btn-ghost" data-remover="${chave}" style="flex:1;">Remover</button>
            </div>`
          : ""
      }
    </div>
  `;
}

function abrirModalContribuicao(chave) {
  const membro = MEMBROS[chave];
  abrirModal(
    `
    <div class="modal">
      <h3>Adicionar contribuição — ${membro.nome}</h3>
      <div class="field">
        <label for="valor-contrib">Valor (R$)</label>
        <input type="number" id="valor-contrib" min="0" step="0.01" placeholder="0,00" inputmode="decimal" />
      </div>
      <div class="field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="destinar-extra" style="width:auto;" />
        <label for="destinar-extra" style="margin:0;">Destinar também ao Extra deste mês</label>
      </div>
      <div class="modal-actions">
        <button class="cancel" id="cancelar-contrib">Cancelar</button>
        <button class="confirm" id="confirmar-contrib">Confirmar</button>
      </div>
    </div>
  `,
    {
      onMount: (overlay) => {
        overlay.querySelector("#cancelar-contrib").addEventListener("click", fecharModal);
        overlay.querySelector("#confirmar-contrib").addEventListener("click", async () => {
          const valor = parseFloat(overlay.querySelector("#valor-contrib").value);
          if (!valor || valor <= 0) {
            toast("Digite um valor válido.");
            return;
          }
          const destinarExtra = overlay.querySelector("#destinar-extra").checked;
          await confirmarContribuicao(chave, valor, destinarExtra);
          fecharModal();
        });
      }
    }
  );
}

function abrirModalRemoverContribuicao(chave) {
  const membro = MEMBROS[chave];
  const valorAtual = Estado.mesAtual?.contribuicoes?.[chave] || 0;
  abrirModal(
    `
    <div class="modal">
      <h3>Remover contribuição — ${membro.nome}</h3>
      <p class="section-sub" style="margin:-6px 0 14px;">Contribuído até agora: ${formatBRL(valorAtual)}</p>
      <div class="field">
        <label for="valor-remover">Valor a remover (R$)</label>
        <input type="number" id="valor-remover" min="0" step="0.01" placeholder="0,00" inputmode="decimal" />
      </div>
      <div class="field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="remover-extra" style="width:auto;" />
        <label for="remover-extra" style="margin:0;">Remover também do Extra deste mês</label>
      </div>
      <div class="modal-actions">
        <button class="cancel" id="cancelar-remover">Cancelar</button>
        <button class="confirm" id="confirmar-remover" style="background:var(--red-500);">Remover</button>
      </div>
    </div>
  `,
    {
      onMount: (overlay) => {
        overlay.querySelector("#cancelar-remover").addEventListener("click", fecharModal);
        overlay.querySelector("#confirmar-remover").addEventListener("click", async () => {
          const valor = parseFloat(overlay.querySelector("#valor-remover").value);
          if (!valor || valor <= 0) {
            toast("Digite um valor válido.");
            return;
          }
          if (valor > valorAtual) {
            toast(`O valor não pode ser maior que ${formatBRL(valorAtual)}.`);
            return;
          }
          const removerExtra = overlay.querySelector("#remover-extra").checked;
          await confirmarRemocaoContribuicao(chave, valor, removerExtra);
          fecharModal();
        });
      }
    }
  );
}

async function confirmarRemocaoContribuicao(chave, valor, removerExtra) {
  const ref = getMesRef();
  const extraAtual = Estado.mesAtual?.extra?.arrecadado || 0;
  const updateData = {
    [`contribuicoes.${chave}`]: increment(-valor),
    eventos: arrayUnion({
      tipo: "remocao_contribuicao",
      dia: hojeISO(),
      pessoa: MEMBROS[chave].nome,
      valor: -valor
    })
  };
  if (removerExtra) {
    updateData["extra.arrecadado"] = increment(-Math.min(valor, extraAtual));
  }
  await updateDoc(ref, updateData);
  toast("Contribuição removida.");
}


async function confirmarContribuicao(chave, valor, destinarExtra) {
  const ref = getMesRef();
  const updateData = {
    [`contribuicoes.${chave}`]: increment(valor),
    eventos: arrayUnion({
      tipo: "contribuicao",
      dia: hojeISO(),
      pessoa: MEMBROS[chave].nome,
      valor
    })
  };
  if (destinarExtra) {
    updateData["extra.arrecadado"] = increment(valor);
  }
  await updateDoc(ref, updateData);
  toast("Contribuição registrada!");

  // Verifica celebrações após a atualização local chegar via onSnapshot
  setTimeout(verificarCelebracoes, 700);
}

let ultimaCelebracaoIndividual = {};
let celebracaoGeralFeita = false;

function verificarCelebracoes() {
  const mes = Estado.mesAtual;
  if (!mes) return;

  Object.entries(mes.contribuicoes).forEach(([chave, valor]) => {
    const completo = valor >= META_INDIVIDUAL;
    if (completo && !ultimaCelebracaoIndividual[chave]) {
      ultimaCelebracaoIndividual[chave] = true;
    }
  });

  const todosCompletos = Object.values(mes.contribuicoes).every((v) => v >= META_INDIVIDUAL);
  if (todosCompletos && !celebracaoGeralFeita) {
    celebracaoGeralFeita = true;
    celebrar("🎉 Toda a família concluiu a meta deste mês!");
  }
}

function abrirInfo(titulo, texto) {
  abrirModal(
    `<div class="modal"><h3>${titulo}</h3><p>${texto}</p>
      <div class="modal-actions"><button class="confirm" id="fechar-info" style="width:100%">Entendi</button></div>
    </div>`,
    {
      onMount: (overlay) => {
        overlay.classList.add("info-popup");
        overlay.querySelector("#fechar-info").addEventListener("click", fecharModal);
      }
    }
  );
}

export { abrirInfo };
