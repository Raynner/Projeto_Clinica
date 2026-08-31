const atendimentoRepository = require("../repositories/atendimentoRepository");

const pacienteRepository = require("../repositories/pacienteRepository");

// LISTAR

async function listarAtendimentos() {

    return await atendimentoRepository.buscarTodos();

}

// BUSCAR POR ID

async function buscarAtendimento(id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do atendimento deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }

    const atendimento =
        await atendimentoRepository.buscarPorId(id);

    if (!atendimento) {

        const erro = new Error(
            "Atendimento não encontrado."
        );

        erro.status = 404;

        throw erro;
    }

    return atendimento;
}

// CADASTRAR

async function cadastrarAtendimento(dados) {

    const {
        dataAtendimento,
        horario,
        idPaciente,
        presenca
    } = dados;


    if (!dataAtendimento) {

        const erro = new Error(
            "A data do atendimento é obrigatória."
        );

        erro.status = 400;

        throw erro;
    }


    if (!horario) {

        const erro = new Error(
            "O horário do atendimento é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (!idPaciente) {

        const erro = new Error(
            "O paciente é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (!presenca) {

        const erro = new Error(
            "A presença é obrigatória."
        );

        erro.status = 400;

        throw erro;
    }


    const paciente =
        await pacienteRepository.buscarPorId(
            idPaciente
        );

    if (!paciente) {

        const erro = new Error(
            "O paciente informado não existe."
        );

        erro.status = 404;

        throw erro;
    }


    const presencasValidas = [
        "SIM",
        "FALTOU",
        "DESMARCOU"
    ];

    if (!presencasValidas.includes(presenca)) {

        const erro = new Error(
            "Presença inválida. Use SIM, FALTOU ou DESMARCOU."
        );

        erro.status = 400;

        throw erro;
    }


    return await atendimentoRepository.cadastrar(
        dados
    );
}

// ATUALIZAR

async function atualizarAtendimento(id, dados) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do atendimento deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }


    const atendimento =
        await atendimentoRepository.buscarPorId(id);

    if (!atendimento) {

        const erro = new Error(
            "Atendimento não encontrado."
        );

        erro.status = 404;

        throw erro;
    }


    const {
        dataAtendimento,
        horario,
        idPaciente,
        presenca
    } = dados;


    if (
        !dataAtendimento ||
        !horario ||
        !idPaciente ||
        !presenca
    ) {

        const erro = new Error(
            "Data, horário, paciente e presença são obrigatórios."
        );

        erro.status = 400;

        throw erro;
    }


    const paciente =
        await pacienteRepository.buscarPorId(
            idPaciente
        );

    if (!paciente) {

        const erro = new Error(
            "O paciente informado não existe."
        );

        erro.status = 404;

        throw erro;
    }


    const presencasValidas = [
        "SIM",
        "FALTOU",
        "DESMARCOU"
    ];

    if (!presencasValidas.includes(presenca)) {

        const erro = new Error(
            "Presença inválida. Use SIM, FALTOU ou DESMARCOU."
        );

        erro.status = 400;

        throw erro;
    }


    return await atendimentoRepository.atualizar(
        id,
        dados
    );
}

// EXCLUIR

async function excluirAtendimento(id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do atendimento deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }


    const atendimento =
        await atendimentoRepository.buscarPorId(id);

    if (!atendimento) {

        const erro = new Error(
            "Atendimento não encontrado."
        );

        erro.status = 404;

        throw erro;
    }


    return await atendimentoRepository.excluir(id);
}

module.exports = {
    listarAtendimentos,
    buscarAtendimento,
    cadastrarAtendimento,
    atualizarAtendimento,
    excluirAtendimento
};