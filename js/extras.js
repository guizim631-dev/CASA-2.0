// =========================================================
// Extras — apenas a administradora (Sirlene) pode editar
// =========================================================

import { Estado, getMesRef } from "./state.js";
import { abrirModal, fecharModal, toast, hojeISO } from "./utils.js";
import { updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/** Botão "Editar Extra", visível apenas para o usuário administrador */
export function botaoEditarExtraHTML() {
  if (!Estado.usuario?.admin) return "";
  return `<button class="btn-ghost" id="btn-editar-extra" style="margin-top:12px;width:100%;">Editar Extra do mês</button>`;
}

export function ligarBotaoEditarExtra(container) {
  const btn = container.querySelector("#btn-editar-extra");
  if (!btn) return;
  btn.addEventListener("click", abrirModalExtra);
}

function abrirModalExtra() {
  const extraAtual = Estado.mesAtual?.extra || { nome: "", descricao: "", meta: 0 };
  abrirModal(
    `
    <div class="modal">
      <h3>Editar Extra do mês</h3>
      <div class="field">
        <label for="extra-nome">Nome do extra</label>
        <input type="text" id="extra-nome" value="${extraAtual.nome || ""}" placeholder="Ex: Troca do chuveiro" />
      </div>
      <div class="field">
        <label for="extra-desc">Descrição</label>
        <textarea id="extra-desc" placeholder="Ex: Compra de um chuveiro novo">${extraAtual.descricao || ""}</textarea>
      </div>
      <div class="field">
        <label for="extra-meta">Valor da meta (R$)</label>
        <input type="number" id="extra-meta" min="0" step="0.01" value="${extraAtual.meta || 0}" />
      </div>
      <div class="modal-actions">
        <button class="cancel" id="cancelar-extra">Cancelar</button>
        <button class="confirm" id="salvar-extra">Salvar</button>
      </div>
    </div>
  `,
    {
      onMount: (overlay) => {
        overlay.querySelector("#cancelar-extra").addEventListener("click", fecharModal);
        overlay.querySelector("#salvar-extra").addEventListener("click", async () => {
          const nome = overlay.querySelector("#extra-nome").value.trim();
          const descricao = overlay.querySelector("#extra-desc").value.trim();
          const meta = parseFloat(overlay.querySelector("#extra-meta").value) || 0;
          if (!nome) {
            toast("Dê um nome para o extra.");
            return;
          }
          await salvarExtra(nome, descricao, meta);
          fecharModal();
        });
      }
    }
  );
}

async function salvarExtra(nome, descricao, meta) {
  const ref = getMesRef();
  const jaExistia = !!Estado.mesAtual?.extra?.nome;
  await updateDoc(ref, {
    "extra.nome": nome,
    "extra.descricao": descricao,
    "extra.meta": meta,
    ...(jaExistia ? {} : { "extra.arrecadado": 0 }),
    eventos: arrayUnion({ tipo: "extra", dia: hojeISO(), pessoa: Estado.usuario.nome, extraNome: nome })
  });
  toast("Extra atualizado!");
}
