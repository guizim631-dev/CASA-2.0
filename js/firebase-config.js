
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8LTKq-tvENZXkr3Z14Nj0eyoFXDn7Lv4",
  authDomain: "casa-financas-2026.firebaseapp.com",
  projectId: "casa-financas-2026",
  storageBucket: "casa-financas-2026.firebasestorage.app",
  messagingSenderId: "817578432910",
  appId: "1:817578432910:web:5496fe373885305755ecdf"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch((e) => console.warn("Persistência de auth:", e));

// Permite abrir o app offline e ver os últimos dados sincronizados
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Persistência offline: outra aba está aberta, só uma pode manter cache local.");
  } else if (err.code === "unimplemented") {
    console.warn("Persistência offline não suportada neste navegador.");
  }
});

// Mapeamento fixo dos 4 integrantes da casa.
// O Firebase Authentication exige e-mail e senha, então cada pessoa tem um e-mail
// e uma senha interna fixa (o usuário não digita nada, só clica no próprio nome).
// IMPORTANTE: essas senhas precisam ser EXATAMENTE as mesmas cadastradas
// no Firebase Authentication pra cada um desses e-mails.
export const MEMBROS = {
  junior: { nome: "Júnior", email: "junior@financas-casa.app", senha: "junior-casa-2026", admin: false },
  sirlene: { nome: "Sirlene", email: "sirlene@financas-casa.app", senha: "sirlene-casa-2026", admin: true },
  giovana: { nome: "Giovana", email: "giovana@financas-casa.app", senha: "giovana-casa-2026", admin: false },
  kevin: { nome: "Kevin", email: "kevin@financas-casa.app", senha: "kevin-casa-2026", admin: false }
};

export const META_INDIVIDUAL = 400;
export const META_GERAL = 1600;
export const CONTAS_FIXAS = [
  { id: "agua", nome: "Água", icone: "💧" },
  { id: "luz", nome: "Luz", icone: "⚡" },
  { id: "internet", nome: "Internet", icone: "📶" }
];


