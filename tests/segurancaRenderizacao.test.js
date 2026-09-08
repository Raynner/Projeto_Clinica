const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// DOM mínimo com armadilha nos sinks HTML: executa as funções reais das páginas
// e falha se qualquer célula ou botão tentar interpretar os dados como HTML.
class Elemento {
    constructor(tag) { this.tag = tag; this.children = []; this.style = {}; this.eventos = {}; }
    set innerHTML(valor) {
        assert.equal(this.tag, "tbody", "Dados não devem chegar a innerHTML");
        assert.equal(valor, "", "Somente a limpeza da tabela é permitida neste cenário");
        this.children = [];
    }
    appendChild(elemento) { this.children.push(elemento); }
    addEventListener(nome, callback) { this.eventos[nome] = callback; }
}
function carregar(pagina, funcao, marcadorFinal, extras = {}) {
    const source = fs.readFileSync(path.join(__dirname, "../client", pagina), "utf8");
    const inicio = source.indexOf(`    function ${funcao}(`);
    const fim = source.indexOf(marcadorFinal, inicio);
    assert.ok(inicio >= 0 && fim > inicio);
    const tabela = new Elemento("tbody");
    const chamadas = [];
    const contexto = vm.createContext({
        document: { createElement: tag => new Elemento(tag) }, tabela,
        editarPaciente: id => chamadas.push(["editar", id]),
        excluirPaciente: id => chamadas.push(["excluir", id]),
        abrirEdicao: id => chamadas.push(["editar", id]),
        excluirAtendimento: id => chamadas.push(["excluir", id]),
        atualizarResumo() {}, ...extras
    });
    vm.runInContext(source.slice(inicio, fim), contexto);
    return { renderizar: contexto[funcao], tabela, chamadas };
}
const payloads = [
    '<img src=x onerror="globalThis.invadiu=true">',
    '<svg onload="globalThis.invadiu=true"></svg>',
    '</td><script>globalThis.invadiu=true</script>',
    '&lt;img src=x onerror=alert(1)&gt;',
    'Maria & João "D’Ávila"'
];

test("Pacientes: nomes maliciosos permanecem texto e os botões preservam suas ações", () => {
    const { renderizar, tabela, chamadas } = carregar("pacientes.html", "mostrarPacientes", "    // EXCLUIR PACIENTES");
    for (const texto of payloads) {
        const id = '1);globalThis.invadiu=true;//';
        renderizar([{ paciente_id: id, nome__completo_paciente: texto, nome_responsavel: texto, nome_convenio: texto }]);
        const celulas = tabela.children[0].children;
        assert.equal(celulas.length, 6);
        for (const indice of [1, 3, 4]) {
            assert.equal(celulas[indice].textContent, texto);
            assert.equal(celulas[indice].children.length, 0);
        }
        for (const botao of celulas[5].children) botao.eventos.click();
        assert.deepEqual(chamadas.slice(-2), [["editar", id], ["excluir", id]]);
    }
});

for (const perfil of ["ADMIN", "FISIOTERAPEUTA"]) {
    test(`Atendimentos: renderização segura e ações para ${perfil}`, () => {
        const { renderizar, tabela, chamadas } = carregar("atendimentos.html", "mostrarAtendimentos", "    //Atualizar resumo", {
            usuarioLogado: { usuario_id: 1, perfil }
        });
        for (const texto of payloads) {
            renderizar([{
                atendimento_id: 42, usuario_id: 1, horario_atendimento: texto,
                nome__completo_paciente: texto, nome_completo: texto,
                nome_convenio: texto, nome_fisioterapeuta: texto, presenca: texto, valor: 100
            }]);
            const celulas = tabela.children[0].children;
            assert.equal(celulas.length, perfil === "ADMIN" ? 9 : 8);
            for (const indice of [1, 2, 3, 4, 5, ...(perfil === "ADMIN" ? [7] : [])]) {
                assert.equal(celulas[indice].textContent, texto);
                assert.equal(celulas[indice].children.length, 0);
            }
            for (const botao of celulas.at(-1).children) botao.eventos.click();
            assert.deepEqual(chamadas.slice(-2), [["editar", 42], ["excluir", 42]]);
        }
        renderizar([{ usuario_id: 2, valor: 0 }]);
        const acoes = tabela.children[0].children.at(-1);
        assert.equal(acoes.children.length, 1);
        assert.equal(acoes.children[0].tag, "span");
        assert.equal(acoes.children[0].textContent, "Somente leitura");
    });
}
