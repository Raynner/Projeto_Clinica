const atendimentoRepository = require("../repositories/atendimentoRepository");

const pacienteRepository = require("../repositories/pacienteRepository");

// LISTAR

async function listarAtendimentos(usuario_id, perfil) {
    if (!usuario_id) {
        const erro = new Error("Usuário autenticado é obrigatório.");
        erro.status = 401;
        throw erro;
    }

    if (perfil === "ADMIN") {
        return await atendimentoRepository.buscarTodosAdmin();
    }

    return await atendimentoRepository.buscarTodos(usuario_id);
}

// BUSCAR POR ID

async function buscarAtendimento(id, usuario_id, perfil) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do atendimento deve ser numérico."
        );

        erro.status = 400;
        throw erro;
    }

    if (!usuario_id) {
        const erro = new Error(
            "Usuário autenticado é obrigatório."
        );

        erro.status = 401;
        throw erro;
    }

    let atendimento;

    if (perfil === "ADMIN") {
        atendimento =
            await atendimentoRepository.buscarPorIdAdmin(id);
    } else {
        atendimento =
            await atendimentoRepository.buscarPorId(
                id,
                usuario_id
            );
    }
    

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
        data_atendimento,
        horario_atendimento,
        id_paciente,
        presenca,
        usuario_id
    } = dados;


    if (!data_atendimento) {

        const erro = new Error(
            "A data do atendimento é obrigatória."
        );

        erro.status = 400;

        throw erro;
    }


    if (!horario_atendimento) {

        const erro = new Error(
            "O horário do atendimento é obrigatório."
        );

        erro.status = 400;

        throw erro;
    }


    if (!id_paciente) {

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


    if (!usuario_id) {

        const erro = new Error(
            "Usuário autenticado é obrigatório."
        );

        erro.status = 401;

        throw erro;
    }


    const paciente =
        await pacienteRepository.buscarPorId(
            id_paciente
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

async function atualizarAtendimento(id, dados, usuario_id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do atendimento deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }

    if (!usuario_id) {
        const erro = new Error(
            "Usuário autenticado é obrigatório."
        );

        erro.status = 401;
        throw erro;
    }


    const atendimento =
        await atendimentoRepository.buscarPorId(id, usuario_id);

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
        dados,
        usuario_id
    );
}

// EXCLUIR

async function excluirAtendimento(id, usuario_id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do atendimento deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }

    if (!usuario_id) {

        const erro = new Error(
            "Usuário autenticado é obrigatório."
        );

        erro.status = 401;
        throw erro;
    }


    const atendimento =
        await atendimentoRepository.buscarPorId(id, usuario_id);

    if (!atendimento) {

        const erro = new Error(
            "Atendimento não encontrado."
        );

        erro.status = 404;

        throw erro;
    }


    return await atendimentoRepository.excluir(id, usuario_id);
}

module.exports = {
    listarAtendimentos,
    buscarAtendimento,
    cadastrarAtendimento,
    atualizarAtendimento,
    excluirAtendimento
};