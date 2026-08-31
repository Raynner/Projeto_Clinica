const convenioRepository = require("../repositories/convenioRepository");

// LISTAR CONVÊNIOS

async function listarConvenios() {

    return await convenioRepository.buscarTodos();

}

// BUSCAR CONVÊNIO

async function buscarConvenio(id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do convênio deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }


    const convenio =
        await convenioRepository.buscarPorId(id);


    if (!convenio) {

        const erro = new Error(
            "Convênio não encontrado."
        );

        erro.status = 404;

        throw erro;
    }


    return convenio;
}

// CADASTRAR CONVÊNIO

async function cadastrarConvenio(dados) {

    const {
        nomeConvenio,
        valor
    } = dados;


    if (
        !nomeConvenio ||
        nomeConvenio.trim() === ""
    ) {

        const erro = new Error(
            "O nome do convênio é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        const erro = new Error(
            "O valor do convênio é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (Number(valor) < 0) {

        const erro = new Error(
            "O valor do convênio não pode ser negativo."
        );

        erro.status = 400;

        throw erro;
    }


    return await convenioRepository.cadastrar(dados);
}

// ATUALIZAR CONVÊNIO

async function atualizarConvenio(id, dados) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do convênio deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }


    const convenio =
        await convenioRepository.buscarPorId(id);


    if (!convenio) {

        const erro = new Error(
            "Convênio não encontrado."
        );

        erro.status = 404;

        throw erro;
    }


    const {
        nomeConvenio,
        valor
    } = dados;


    if (
        !nomeConvenio ||
        nomeConvenio.trim() === ""
    ) {

        const erro = new Error(
            "O nome do convênio é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        const erro = new Error(
            "O valor do convênio é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (Number(valor) < 0) {

        const erro = new Error(
            "O valor do convênio não pode ser negativo."
        );

        erro.status = 400;

        throw erro;
    }


    return await convenioRepository.atualizar(
        id,
        dados
    );
}

// EXCLUIR CONVÊNIO

async function excluirConvenio(id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do convênio deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }


    const convenio =
        await convenioRepository.buscarPorId(id);


    if (!convenio) {

        const erro = new Error(
            "Convênio não encontrado."
        );

        erro.status = 404;

        throw erro;
    }


    return await convenioRepository.excluir(id);
}

module.exports = {
    listarConvenios,
    buscarConvenio,
    cadastrarConvenio,
    atualizarConvenio,
    excluirConvenio
};