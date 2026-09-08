// Cookies HttpOnly são enviados pelo navegador; nenhum segredo de sessão fica no JS.
// Remove resíduos da versão anterior sem tentar reutilizar JWTs antigos.
sessionStorage.removeItem('token');
let usuarioAtual = null;
let consultaSessao = null;
async function confirmarSessaoLogin() {
    // O HTML pode ser atualizado enquanto o Node ainda executa o backend antigo.
    // Confirma o cookie no servidor antes de navegar, evitando um ciclo de login.
    const resposta = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
    if (resposta.status === 404) {
        throw new Error('O servidor de autenticação está desatualizado. Reinicie o backend e atualize esta página.');
    }
    if (resposta.status >= 500) {
        throw new Error('Não foi possível verificar a sessão no servidor. Tente novamente em instantes.');
    }
    if (!resposta.ok) {
        throw new Error('A sessão não foi confirmada. Verifique se os cookies estão permitidos e acesse sempre o mesmo endereço local.');
    }
    const dados = await resposta.json();
    if (!dados.usuario) throw new Error('O servidor retornou uma sessão inválida. Reinicie o backend e atualize esta página.');
    usuarioAtual = dados.usuario;
    consultaSessao = Promise.resolve(dados);
    return dados;
}
async function carregarSessao() {
    if (!consultaSessao) consultaSessao = fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
        .then(async resposta => resposta.ok ? resposta.json() : null)
        .then(dados => { usuarioAtual = dados?.usuario || null; return dados; });
    return consultaSessao;
}
async function protegerPagina() {
    try {
        const dados = await carregarSessao();
        if (!dados) { window.location.href = '/login.html'; return false; }
        if (dados.trocarSenha && window.location.pathname !== '/senha.html') {
            window.location.href = '/senha.html'; return false;
        }
        return true;
    } catch {
        window.location.href = '/login.html';
        return false;
    }
}
async function logout() {
    try {
        const resposta = await fetch('/api/auth/logout', {
            method: 'POST', credentials: 'same-origin', headers: { 'X-Praxis-Request': '1' }
        });
        if (!resposta.ok) throw new Error('Falha ao revogar sessão');
        usuarioAtual = null;
        consultaSessao = null;
        window.location.href = '/login.html';
    } catch {
        // Não informa sucesso se a sessão ainda puder estar ativa no servidor.
        window.alert('Não foi possível encerrar a sessão. Verifique a conexão e tente novamente.');
    }
}
async function fetchAutenticado(url, options = {}) {
    const destino = new URL(url, window.location.origin);
    if (destino.origin !== window.location.origin) throw new Error('Destino não permitido.');
    const headers = new Headers(options.headers);
    headers.set('X-Praxis-Request', '1'); // Header não simples integra a defesa CSRF no servidor.
    const resposta = await fetch(destino.href, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
    if (resposta.status === 401) { usuarioAtual = null; window.location.href = '/login.html'; return; }
    if (resposta.status === 403) {
        const dados = await resposta.clone().json().catch(() => null);
        if (dados?.codigo === 'TROCAR_SENHA') { window.location.href = '/senha.html'; return; }
        if (dados?.erro === 'Usuário inativo.') { usuarioAtual = null; window.location.href = '/login.html'; return; }
    }
    return resposta;
}
function getUsuarioLogado() { return usuarioAtual; }
function usuarioEhAdmin() { return usuarioAtual?.perfil === 'ADMIN'; }
function usuarioEhFisioterapeuta() { return usuarioAtual?.perfil === 'FISIOTERAPEUTA'; }
