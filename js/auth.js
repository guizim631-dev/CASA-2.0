// =========================================================
// Autenticação — tela de login e sessão
// =========================================================

import { auth, MEMBROS } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { Estado } from "./state.js";
import { iniciais } from "./utils.js";

let entrando = false;

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-logo">
          ${svgCasa()}
          <div class="title">Finanças da Casa</div>
          <div class="subtitle">Toque no seu nome pra entrar</div>
        </div>
        <div class="user-select-grid" id="user-grid">
          ${Object.entries(MEMBROS)
            .map(
              ([chave, m]) => `
            <button class="user-pick" data-chave="${chave}" type="button">
              <span class="avatar lg">${iniciais(m.nome)}</span>
              ${m.nome}
            </button>`
            )
            .join("")}
        </div>
        <div class="login-error hidden" id="login-error"></div>
      </div>
    </div>
  `;

  const grid = container.querySelector("#user-grid");
  const erroEl = container.querySelector("#login-error");

  grid.querySelectorAll(".user-pick").forEach((btn) => {
    btn.addEventListener("click", () => entrar(btn.dataset.chave, btn, grid, erroEl));
  });
}

async function entrar(chave, btn, grid, erroEl) {
  if (entrando) return;
  entrando = true;
  erroEl.classList.add("hidden");
  grid.querySelectorAll(".user-pick").forEach((b) => (b.disabled = true));
  btn.classList.add("selected");

  try {
    const membro = MEMBROS[chave];
    await signInWithEmailAndPassword(auth, membro.email, membro.senha);
  } catch (e) {
    erroEl.textContent = "Não foi possível entrar. Verifique se essa conta já foi criada no Firebase Authentication.";
    erroEl.classList.remove("hidden");
    grid.querySelectorAll(".user-pick").forEach((b) => (b.disabled = false));
    btn.classList.remove("selected");
    entrando = false;
  }
}

export function logout() {
  signOut(auth);
}

export function iniciarObservadorAuth(aoLogar, aoDeslogar) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const chave = Object.keys(MEMBROS).find((k) => MEMBROS[k].email === user.email);
      if (!chave) {
        signOut(auth);
        return;
      }
      Estado.usuario = { chave, nome: MEMBROS[chave].nome, admin: MEMBROS[chave].admin, email: user.email };
      aoLogar();
    } else {
      Estado.usuario = null;
      aoDeslogar();
    }
  });
}

function svgCasa() {
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 6L58 26V56H6V26L32 6Z" fill="#1E5EFF"/>
    <rect x="16" y="30" width="32" height="26" fill="white"/>
    <rect x="27" y="40" width="10" height="16" fill="#1E5EFF"/>
  </svg>`;
}
