# Finanças da Casa — PWA

App de controle financeiro familiar para Júnior, Sirlene, Giovana e Kevin, com sincronização em tempo real via Firebase.

## Estrutura do projeto

```
financas-familia/
├── index.html            → shell do app
├── manifest.json         → configuração do PWA
├── service-worker.js     → cache offline
├── firestore.rules       → regras de segurança do Firestore
├── css/style.css         → design system completo (light/dark)
├── icons/                → ícones do app (192, 512, apple-touch)
└── js/
    ├── firebase-config.js  → chaves do Firebase + constantes (SUBSTITUIR!)
    ├── utils.js             → formatação, toast, modal, confete
    ├── state.js             → sessão + doc do mês em tempo real
    ├── auth.js              → tela de login
    ├── dashboard.js         → visão geral (casa-medidor)
    ├── contribuicoes.js     → cartões dos 4 integrantes + Mercado
    ├── contas.js            → Água / Luz / Internet + Extra
    ├── extras.js            → edição do Extra (só admin)
    ├── historico.js         → meses anteriores
    ├── calendario.js        → calendário de eventos
    └── app.js               → navegação, tema, bootstrap
```

## Passo a passo para colocar no ar

### 1. Criar o projeto no Firebase
1. Acesse https://console.firebase.google.com e crie um projeto novo.
2. Em **Compilação > Authentication**, ative o provedor **E-mail/senha**.
3. Em **Compilação > Firestore Database**, crie o banco (modo produção).
4. Cole o conteúdo de `firestore.rules` nas regras do Firestore.
5. Em **Configurações do projeto > Seus apps**, crie um app Web e copie o objeto `firebaseConfig`.
6. Cole esses valores em `js/firebase-config.js` (substitua `SUA_API_KEY`, etc).

### 2. Criar os 4 usuários
No Firebase Authentication, crie manualmente 4 usuários com e-mail/senha — **use exatamente as senhas que já estão em `js/firebase-config.js`**, porque o app faz login sozinho quando a pessoa clica no próprio nome (ninguém digita senha na tela):

| Integrante | E-mail                        | Senha (já vem pronta no código) |
|---|---|---|
| Júnior  | junior@financas-casa.app  | junior-casa-2026  |
| Sirlene | sirlene@financas-casa.app | sirlene-casa-2026 |
| Giovana | giovana@financas-casa.app | giovana-casa-2026 |
| Kevin   | kevin@financas-casa.app   | kevin-casa-2026   |

Se quiser trocar essas senhas, só editar em `js/firebase-config.js` (campo `senha` de cada integrante) **e** trocar a mesma senha no Firebase Authentication — as duas precisam ser idênticas.

> ⚠️ Como não há senha digitada na hora de entrar, qualquer pessoa com acesso ao celular/computador onde o app está aberto/instalado consegue entrar em qualquer conta só clicando no nome. É a troca feita para deixar o login rápido pro uso em família — combina com o uso pretendido (dispositivos de confiança), mas vale saber.

### 3. Testar localmente
Como o app usa `import` de módulos ES, precisa rodar por um servidor local (não abrir o `index.html` direto com `file://`):

```bash
cd financas-familia
python3 -m http.server 8080
```

Acesse `http://localhost:8080`.

### 4. Publicar (GitHub Pages, Firebase Hosting, etc.)
Qualquer hospedagem estática funciona. Exemplos:

**Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # aponte para esta pasta
firebase deploy
```

**GitHub Pages:** suba a pasta para um repositório e ative Pages nas configurações (mesmo esquema que você já usa no `AKINDO`).

### 5. Instalar como app no celular
- **Android (Chrome):** abrir o site → menu → "Instalar aplicativo" / "Adicionar à tela inicial".
- **iPhone (Safari):** abrir o site → botão de compartilhar → "Adicionar à Tela de Início".

## Como funciona o reinício mensal

Não há Cloud Function agendada (exigiria plano pago/Blaze). Em vez disso, o próprio app cria o documento do novo mês automaticamente na primeira vez que alguém abre o app depois da virada do mês (`js/state.js → garantirMesAtual`). O mês anterior permanece intacto na coleção `meses` e vira histórico. Se quiser um reinício 100% garantido mesmo sem ninguém abrir o app no dia 1, dá pra evoluir isso depois com Cloud Functions + Cloud Scheduler.

## Pontos de configuração rápida

- Meta geral e meta individual: `js/firebase-config.js` (`META_GERAL`, `META_INDIVIDUAL`).
- Cores/tema: variáveis CSS no topo de `css/style.css`.
- Ícones do app: gerados em `icons/` — troque pelos seus se quiser uma logo própria.

## Limitação conhecida

As regras do Firestore (`firestore.rules`) cobrem o essencial (só a Sirlene edita nome/descrição/meta do Extra). Para um controle ainda mais fino por integrante (ex.: impedir que a Giovana altere a contribuição do Kevin), o ideal é migrar para Cloud Functions com Custom Claims — funciona bem assim para uso familiar, mas fica registrado caso queira endurecer mais pra frente.
