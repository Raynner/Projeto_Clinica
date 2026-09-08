const { test } = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");
const express = require("express");


// Dados fictícios: os testes não acessam o banco de dados da clínica.
const registros = [
    { usuario_id: 1, nome_fisioterapeuta: "Ana", nome__completo_paciente: "=1+1", data_atendimento: "2026-09-03", presenca: "SIM", valor: "100.50" },
    { usuario_id: 1, nome_fisioterapeuta: "Ana", data_atendimento: "2026-09-03", presenca: "DESMARCOU", valor: "200.00" },
    { usuario_id: 2, nome_fisioterapeuta: "Bia", data_atendimento: "2026-09-03", presenca: "FALTOU", valor: "50.00" }
];
const usuarios = {
    1: { usuario_id: 1, nome: "Ana", perfil: "FISIOTERAPEUTA", ativo: 1 },
    2: { usuario_id: 2, nome: "Bia", perfil: "FISIOTERAPEUTA", ativo: 1 },
    3: { usuario_id: 3, nome: "Admin", perfil: "ADMIN", ativo: 1 },
    4: { usuario_id: 4, nome: "Sem registros", perfil: "FISIOTERAPEUTA", ativo: 1 },
    5: { usuario_id: 5, nome: "Inativo", perfil: "ADMIN", ativo: 0 }
};
const databasePath = require.resolve("../src/config/database");
require.cache[databasePath] = { exports: {
    query(sql, params, callback) {
        if (typeof params === "function") {
            params(null, registros);
            return;
        }
        assert.match(sql, /WHERE aten\.usuario_id = \?/);
        callback(null, registros.filter(item => item.usuario_id === params[0]));
    }
} };
const usuarioPath = require.resolve("../src/repositories/usuarioRepository");
require.cache[usuarioPath] = { exports: { buscarPorId: async id => usuarios[id] } };
// Sessões são consultadas no servidor; cookies não carregam perfis ou IDs legíveis.
require.cache[require.resolve('../src/repositories/sessionRepository')] = { exports: {
    buscar: async token => usuarios[Number(token.slice(0, 2))] || null
} };

test("Exportação Excel aplica autenticação e permissões do servidor", async t => {
    const app = express();
    app.use("/api/atendimentos", require("../src/routes/atendimentoRoutes"));
    const server = await new Promise(resolve => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    t.after(() => new Promise(resolve => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/api/atendimentos/exportar`;
    async function exportar(id, perfil = "ADMIN") {
        // Tentativas de ampliar o perfil pela query não mudam a sessão do servidor.
        const token = String(id).padStart(2, "0") + "x".repeat(41);
        return fetch(url + "?usuario_id=2&perfil=ADMIN", {
            headers: { Cookie: `praxis_session=${token}` }
        });
    }
    async function lerPlanilha(resposta) {
        assert.equal(resposta.status, 200);
        assert.match(resposta.headers.get("content-type"), /spreadsheetml/);
        assert.match(resposta.headers.get("content-disposition"), /atendimentos.xlsx/);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(Buffer.from(await resposta.arrayBuffer()));
        return workbook.getWorksheet("Atendimentos");
    }
    await t.test("rejeita acesso sem token e usuário inativo", async () => {
        assert.equal((await fetch(url)).status, 401);
        assert.equal((await exportar(5)).status, 403);
    });
    await t.test("fisioterapeuta exporta somente os próprios registros", async () => {
        const sheet = await lerPlanilha(await exportar(1));
        assert.equal(sheet.rowCount, 4);
        assert.equal(sheet.getCell("H2").value, "Ana");
        assert.equal(sheet.getCell("H3").value, "Ana");
        assert.equal(sheet.getCell("G3").value, 0);
        assert.equal(sheet.getCell("G4").value, 100.5);
        assert.equal(sheet.getCell("C2").value, "=1+1");
        assert.equal(sheet.getCell("C2").type, ExcelJS.ValueType.String);
        assert.equal(sheet.getCell("A2").value, "03/09/2026");
        const outra = await lerPlanilha(await exportar(2));
        assert.equal(outra.rowCount, 3);
        assert.equal(outra.getCell("H2").value, "Bia");
    });
    await t.test("administrador exporta todos os usuários com total correto", async () => {
        const sheet = await lerPlanilha(await exportar(3));
        assert.equal(sheet.rowCount, 5);
        assert.equal(sheet.getCell("H4").value, "Bia");
        assert.equal(sheet.getCell("G5").value, 150.5);
    });
    await t.test("usuário sem atendimentos recebe cabeçalho e total zero", async () => {
        const sheet = await lerPlanilha(await exportar(4));
        assert.equal(sheet.rowCount, 2);
        assert.equal(sheet.getCell("G2").value, 0);
    });
});
