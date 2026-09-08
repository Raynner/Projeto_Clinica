const { test } = require("node:test");
const assert = require("node:assert/strict");


// Isola dados e controllers: nenhuma chamada destes testes acessa o MySQL real.
const usuarios = {
    1: { usuario_id: 1, perfil: "ADMIN", ativo: 1 },
    2: { usuario_id: 2, perfil: "FISIOTERAPEUTA", ativo: 1 },
    3: { usuario_id: 3, perfil: "ADMIN", ativo: 0 },
    4: { usuario_id: 4, perfil: "DESCONHECIDO", ativo: 1 }
};
require.cache[require.resolve("../src/config/database")] = {
    exports: { query() { throw new Error("Acesso inesperado ao banco"); } }
};
require.cache[require.resolve("../src/repositories/usuarioRepository")] = {
    exports: { buscarPorId: async id => usuarios[id] }
};
let chamadas = 0;
for (const [recurso, nomes] of [
    ["paciente", ["listarPacientes", "buscarPaciente", "cadastrarPaciente", "atualizarPaciente", "excluirPaciente"]],
    ["convenio", ["listarConvenios", "buscarConvenio", "cadastrarConvenio", "atualizarConvenio", "excluirConvenio"]]
]) {
    require.cache[require.resolve(`../src/controllers/${recurso}Controller`)] = {
        exports: Object.fromEntries(nomes.map(nome => [nome, (req, res) => {
            chamadas++;
            res.json({ perfil: req.usuario.perfil, operacao: nome });
        }]))
    };
}
require.cache[require.resolve('../src/repositories/sessionRepository')] = { exports: {
    buscar: async token => usuarios[Number(token.slice(0, 2))] || null
} };
const app = require("../src/app");

test("Todas as operações de pacientes e convênios exigem conta ativa e perfil permitido", async t => {
    const server = await new Promise(resolve => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const token = id => String(id).padStart(2, '0') + 'x'.repeat(41);
    const casos = [
        ["sem token", null, 401],
        ["token inválido", "invalido", 401],
        ["token expirado", token(98), 401],
        ["conta removida", token(99), 401],
        ["conta inativa", token(3), 403],
        ["perfil desconhecido", token(4), 403],
        ["administrador", token(1), 200],
        ["fisioterapeuta", token(2), 200]
    ];
    for (const [nome, credencial, esperado] of casos) {
        await t.test(nome, async () => {
            for (const recurso of ["pacientes", "convenios"]) {
                for (const [method, sufixo] of [["GET", ""], ["GET", "/1"], ["POST", ""], ["PUT", "/1"], ["DELETE", "/1"]]) {
                    const antes = chamadas;
                    const resposta = await fetch(`${base}/api/${recurso}${sufixo}`, {
                        method,
                        headers: { 'X-Praxis-Request': '1', ...(credencial ? { Cookie: `praxis_session=${credencial}` } : {}) }
                    });
                    assert.equal(resposta.status, esperado, `${method} ${recurso}${sufixo}`);
                    const dados = await resposta.json();
                    assert.equal(chamadas - antes, esperado === 200 ? 1 : 0);
                    if (esperado === 200) {
                        assert.equal(dados.perfil, nome === "administrador" ? "ADMIN" : "FISIOTERAPEUTA");
                    }
                }
            }
        });
    }
});
