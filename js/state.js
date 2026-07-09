// =========================================================
// Estado central da aplicação
// - Sessão do usuário logado
// - Documento do mês atual (tempo real via onSnapshot)
// - Reinício mensal automático (cria doc novo quando muda o mês)
// =========================================================

import { db, MEMBROS, META_GERAL, CONTAS_FIXAS } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { chaveMes } from "./utils.js";

export const Estado = {
  usuario: null, // { chave, nome, admin, email }
  mesAtualChave: chaveMes(),
  mesAtual: null, // dados do doc do mês em uso na tela (pode ser mês passado, se navegando no histórico)
  chaveExibida: chaveMes(), // qual mês está sendo exibido/observado
  unsubscribe: null
};

const ouvintes = [];
export function aoAtualizar(fn) {
  ouvintes.push(fn);
}
function notificar() {
  ouvintes.forEach((fn) => fn(Estado));
}

function docVazio() {
  const contas = {};
  CONTAS_FIXAS.forEach((c) => {
    contas[c.id] = { status: "pendente", pagoPor: null, data: null, obs: null };
  });
  const contribuicoes = {};
  Object.keys(MEMBROS).forEach((k) => (contribuicoes[k] = 0));
  return {
    metaGeral: META_GERAL,
    contribuicoes,
    contas,
    extra: { nome: "", descricao: "", meta: 0, arrecadado: 0 },
    eventos: [],
    criadoEm: new Date().toISOString()
  };
}

/** Garante que o mês atual (real) tenha um documento no Firestore.
 *  É assim que o "reinício mensal" acontece: quando o primeiro usuário
 *  abre o app em um mês novo, o doc é criado do zero automaticamente. */
async function garantirMesAtual() {
  const chaveReal = chaveMes();
  const ref = doc(db, "meses", chaveReal);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, docVazio());
  }
}

/** Observa um mês específico em tempo real (padrão: mês atual real) */
export async function observarMes(chave = chaveMes()) {
  if (Estado.unsubscribe) Estado.unsubscribe();
  Estado.chaveExibida = chave;

  if (chave === chaveMes()) {
    await garantirMesAtual();
  }

  const ref = doc(db, "meses", chave);
  Estado.unsubscribe = onSnapshot(ref, (snap) => {
    Estado.mesAtual = snap.exists() ? snap.data() : docVazio();
    notificar();
  });
}

export async function listarMesesHistorico() {
  const q = query(collection(db, "meses"), orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  const meses = [];
  snap.forEach((d) => {
    if (d.id !== chaveMes()) meses.push({ chave: d.id, ...d.data() });
  });
  return meses;
}

export function getMesRef(chave = Estado.chaveExibida) {
  return doc(db, "meses", chave);
}
