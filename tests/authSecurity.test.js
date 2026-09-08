const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const express = require('express');
const { senhaForte } = require('../src/services/passwordPolicy');
const { configuracao } = require('../src/config/security');

// Repositórios simulados: testa HTTP e serviços reais sem alterar contas da clínica.
const senha = 'Uma frase segura para o Praxis!';
const usuarios = {
    'ativo@example.test': { usuario_id: 1, perfil: 'ADMIN', ativo: 1, senha: bcrypt.hashSync(senha, 12) },
    'inativo@example.test': { usuario_id: 2, perfil: 'ADMIN', ativo: 0, senha: bcrypt.hashSync(senha, 12) },
    'legado@example.test': { usuario_id: 3, perfil: 'FISIOTERAPEUTA', ativo: 1, senha: bcrypt.hashSync('antiga', 10) }
};
const sessoes = new Map();
const limites = new Map();
const repository = {
    async criar(u, trocarSenha) {
        const token = crypto.randomBytes(32).toString('base64url');
        sessoes.set(token, { ...u, trocar_senha: trocarSenha });
        return token;
    },
    async buscar(token) { return sessoes.get(token) || null; },
    async revogar(token) { sessoes.delete(token); },
    async alterarSenha(id, anterior, nova) {
        const u = Object.values(usuarios).find(x => x.usuario_id === id);
        assert.equal(u.senha, anterior); u.senha = nova;
        for (const [token, s] of sessoes) if (s.usuario_id === id) sessoes.delete(token);
    },
    async consumir(chave, limite) {
        const hits = (limites.get(chave) || 0) + 1; limites.set(chave, hits);
        return { permitido: hits <= limite, retryAfter: 60 };
    }
};
require.cache[require.resolve('../src/repositories/sessionRepository')] = { exports: repository };
require.cache[require.resolve('../src/config/database')] = { exports: {} };
require.cache[require.resolve('../src/repositories/usuarioRepository')] = { exports: {
    buscarPorEmail: async email => usuarios[email],
    buscarCredenciaisPorId: async id => Object.values(usuarios).find(u => u.usuario_id === id)
} };
const app = require('../src/app');

test('Política de senha aceita frases, rejeita senha curta, repetida e truncamento bcrypt', () => {
    assert.equal(senhaForte('123456'), false);
    assert.equal(senhaForte('a'.repeat(20)), false);
    assert.equal(senhaForte('passwordpassword'), false);
    assert.equal(senhaForte('Olá mundo '.repeat(10)), false);
    assert.equal(senhaForte(senha), true);
    assert.equal(senhaForte(null), false);
    assert.equal(senhaForte('Frase ' + 'é'.repeat(34)), false);
});

test('Autenticação, revogação e migração de senhas pela API', async t => {
    const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(route, { method = 'POST', body, cookie, headers = {} } = {}) {
        return fetch(base + route, { method, headers: { 'Content-Type': 'application/json', 'X-Praxis-Request': '1', ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
    }
    async function login(email = 'ativo@example.test', password = senha) {
        limites.clear();
        const res = await request('/api/auth/login', { body: { email, senha: password } });
        assert.equal(res.status, 200);
        const setCookie = res.headers.get('set-cookie');
        assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/);
        assert.match(setCookie, /Max-Age=7200/);
        assert.equal((await res.json()).token, undefined);
        return setCookie.split(';')[0];
    }
    await t.test('Resposta uniforme para conta inexistente, inativa e senha errada', async () => {
        const respostas = [];
        for (const [email, password] of [['ausente@example.test', senha], ['inativo@example.test', senha], ['ativo@example.test', 'incorreta']]) {
            limites.clear(); const res = await request('/api/auth/login', { body: { email, senha: password } });
            assert.equal(res.status, 401); respostas.push(await res.text());
        }
        assert.equal(new Set(respostas).size, 1);
    });
    await t.test('Limita o sexto login por IP, mesmo com X-Forwarded-For forjado', async () => {
        limites.clear();
        for (let i = 0; i < 6; i++) {
            const res = await request('/api/auth/login', { body: { email: `ausente${i}@example.test`, senha }, headers: { 'X-Forwarded-For': `192.0.2.${i}` } });
            assert.equal(res.status, i < 5 ? 401 : 429);
            if (i === 5) assert.ok(Number(res.headers.get('retry-after')) > 0);
            await res.text();
        }
    });
    await t.test('Cookie opaco, identidade no servidor e logout com replay bloqueado', async () => {
        const cookie = await login();
        let res = await request('/api/auth/me', { method: 'GET', cookie });
        assert.equal(res.status, 200); assert.equal((await res.json()).usuario.perfil, 'ADMIN');
        res = await request('/api/auth/logout', { cookie }); assert.equal(res.status, 204);
        res = await request('/api/auth/me', { method: 'GET', cookie }); assert.equal(res.status, 401);
        res = await request('/api/auth/me', { method: 'GET', headers: { Authorization: 'Bearer token-antigo' } }); assert.equal(res.status, 401);
    });
    await t.test('Limite por conta permanece mesmo antes de esgotar a cota do IP', async () => {
        limites.clear(); limites.set('conta:ativo@example.test', 10);
        const res = await request('/api/auth/login', { body: { email: ' ATIVO@example.test ', senha } });
        assert.equal(res.status, 429);
    });
    await t.test('CSRF bloqueia origem externa e requisição sem header dedicado', async () => {
        const cookie = await login();
        for (const headers of [{ Origin: 'https://outro.example' }, { 'X-Praxis-Request': '' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
            const res = await request('/api/auth/logout', { cookie, headers }); assert.equal(res.status, 403);
        }
        const res = await request('/api/auth/me', { method: 'GET', cookie }); assert.equal(res.status, 200);
    });
    await t.test('Senha legada exige troca e a troca revoga todas as sessões', async () => {
        const cookie = await login('legado@example.test', 'antiga');
        const outroCookie = await login('legado@example.test', 'antiga');
        let res = await request('/api/pacientes', { method: 'GET', cookie });
        assert.equal(res.status, 403); assert.equal((await res.json()).codigo, 'TROCAR_SENHA');
        res = await request('/api/auth/senha', { cookie, body: { senhaAtual: 'errada', novaSenha: senha } }); assert.equal(res.status, 400);
        res = await request('/api/auth/senha', { cookie, body: { senhaAtual: 'antiga', novaSenha: '123456' } }); assert.equal(res.status, 400);
        res = await request('/api/auth/senha', { cookie, body: { senhaAtual: 'antiga', novaSenha: senha } }); assert.equal(res.status, 200);
        for (const c of [cookie, outroCookie]) { res = await request('/api/auth/me', { method: 'GET', cookie: c }); assert.equal(res.status, 401); }
        const nova = await login('legado@example.test', senha);
        res = await request('/api/auth/me', { method: 'GET', cookie: nova }); assert.equal((await res.json()).trocarSenha, false);
    });
});

test('Produção exige HTTPS e só aceita indicação TLS de proxy explicitamente confiável', async t => {
    assert.throws(() => configuracao({ NODE_ENV: 'production', APP_ORIGIN: 'http://localhost:5000' }), /HTTPS/);
    assert.throws(() => configuracao({ TRUSTED_PROXIES: 'true' }), /IPs/);
    const original = { NODE_ENV: process.env.NODE_ENV, APP_ORIGIN: process.env.APP_ORIGIN, TRUSTED_PROXIES: process.env.TRUSTED_PROXIES };
    t.after(() => { for (const [k, v] of Object.entries(original)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
    process.env.NODE_ENV = 'production'; process.env.APP_ORIGIN = 'https://praxis.example';
    for (const trusted of ['', '127.0.0.1']) {
        process.env.TRUSTED_PROXIES = trusted;
        const mini = express(); require('../src/middlewares/transportSecurity')(mini);
        mini.get('/', (req, res) => res.sendStatus(200));
        mini.use(express.json());
        mini.post('/api/auth/login', require('../src/controllers/authController').login);
        const server = await new Promise(resolve => { const s = mini.listen(0, '127.0.0.1', () => resolve(s)); });
        try {
            const res = await fetch(`http://127.0.0.1:${server.address().port}/`, { headers: { 'X-Forwarded-Proto': 'https' } });
            assert.equal(res.status, trusted ? 200 : 426);
            if (trusted) assert.equal(res.headers.get('strict-transport-security'), 'max-age=31536000');
            if (trusted) {
                const login = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
                    method: 'POST', headers: { 'X-Forwarded-Proto': 'https', 'X-Praxis-Request': '1', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'ativo@example.test', senha })
                });
                assert.equal(login.status, 200);
                assert.match(login.headers.get('set-cookie'), /^__Host-praxis_session=/);
                assert.match(login.headers.get('set-cookie'), /; Secure;/);
                assert.match(login.headers.get('set-cookie'), /HttpOnly/);
            }
        } finally { await new Promise(resolve => server.close(resolve)); }
    }
    // A configuração de produção seleciona um cookie host-only com Secure.
    assert.equal(configuracao().cookieName, '__Host-praxis_session');
    assert.equal(configuracao().secure, true);
});
