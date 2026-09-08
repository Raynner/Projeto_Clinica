const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function carregar(fetch) {
    const alertas = [];
    const window = { location: { origin: 'http://localhost:5000', pathname: '/index.html', href: '/index.html' }, alert: x => alertas.push(x) };
    const contexto = vm.createContext({ fetch, URL, Headers, window,
        sessionStorage: { removeItem: key => assert.equal(key, 'token'), setItem() { assert.fail('Não gravar credenciais no storage'); } }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../client/js/auth.js'), 'utf8'), contexto);
    return { contexto, window, alertas };
}
test('Frontend carrega identidade uma vez pelo servidor e envia cookie/header CSRF', async () => {
    const calls = [];
    const { contexto } = carregar(async (url, options) => {
        calls.push({ url, options });
        return new Response(JSON.stringify({ usuario: { usuario_id: 1, perfil: 'ADMIN' } }), { status: 200 });
    });
    assert.equal(contexto.getUsuarioLogado(), null);
    await Promise.all([contexto.protegerPagina(), contexto.protegerPagina()]);
    assert.equal(calls.length, 1);
    assert.equal(contexto.getUsuarioLogado().perfil, 'ADMIN');
    await contexto.fetchAutenticado('/api/pacientes', { method: 'POST' });
    assert.equal(calls[1].options.credentials, 'same-origin');
    assert.equal(calls[1].options.headers.get('X-Praxis-Request'), '1');
    assert.equal(calls[1].options.headers.get('Authorization'), null);
    await assert.rejects(contexto.fetchAutenticado('https://externo.example/'), /Destino/);
});
test('Frontend direciona senha legada para troca e não confirma logout sem revogação', async () => {
    const { contexto, window, alertas } = carregar(async url => {
        if (url === '/api/auth/logout') throw new Error('Offline');
        return new Response(JSON.stringify({ usuario: { usuario_id: 1 }, trocarSenha: true }), { status: 200 });
    });
    assert.equal(await contexto.protegerPagina(), false);
    assert.equal(window.location.href, '/senha.html');
    await contexto.logout();
    assert.equal(window.location.href, '/senha.html');
    assert.equal(alertas.length, 1);
});

test('Login não navega quando backend antigo, cookie ausente ou erro impedem confirmar a sessão', async () => {
    for (const [status, mensagem] of [[404, /desatualizado/], [401, /cookies/], [500, /verificar a sessão/]]) {
        const { contexto, window } = carregar(async () => new Response('{}', { status }));
        window.location.href = '/login.html';
        await assert.rejects(contexto.confirmarSessaoLogin(), mensagem);
        assert.equal(window.location.href, '/login.html');
        assert.equal(contexto.getUsuarioLogado(), null);
    }
});

test('Login confirmado obtém o destino de troca de senha e identidade da sessão', async () => {
    const { contexto } = carregar(async () => new Response(JSON.stringify({
        usuario: { usuario_id: 1, perfil: 'ADMIN' }, trocarSenha: true
    }), { status: 200 }));
    const sessao = await contexto.confirmarSessaoLogin();
    assert.equal(sessao.trocarSenha, true);
    assert.equal(contexto.getUsuarioLogado().perfil, 'ADMIN');
});
