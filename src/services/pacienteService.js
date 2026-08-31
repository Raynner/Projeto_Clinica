//SEPARANDO A REGRA DE NEGÓCIOS

const pacienteRepository = require("../repositories/pacienteRepository");

async function listarPacientes() {
    
    const pacientes = await pacienteRepository.buscarTodos();

    return pacientes;
}

async function buscarPaciente(id) {

    const paciente =
        await pacienteRepository.buscarPorId(id);

    return paciente;
}

async function cadastrarPaciente(dados) {

    const {
        nomeResponsavel,
        telefone,
        endereco,
        nomePaciente,
        dataNascimento,
        idConvenio
    } = dados
    
    if (!nomeResponsavel || nomeResponsavel.trim() === "") {
        const erro = new Error("Nome do responsável é obrigatório.");

        erro.status = 400;
        throw erro;  
    }

    if (!nomePaciente || nomePaciente.trim() === "") {
        const erro = new Error("O nome do paciente é obrigatório.");

        erro.status = 400;
        throw erro;
    }

    if (!dataNascimento) {
        const erro = new Error("A data de nascimento é obrigatória.");

        erro.status = 400;
        throw erro;
    }

    if (!idConvenio) {
        const erro = new Error("O convênio é obrigatório.");

        erro.status = 400;
        throw erro;
    }

    const resultado = await pacienteRepository.cadastrar(dados);

    return resultado;
}

async function atualizarPaciente(id, dados) {
    if (!/^\d+$/.test(String(id))) {

        const erro = new Error("O ID do paciente deve ser numérico.");

        erro.status = 400;
        throw erro;
    }

    if (!dados.nomePaciente || dados.nomePaciente.trim() === "") {

        const erro = new Error("O nome do paciente é obrigatório.");

        erro.status = 400;
        throw erro;
    }

    if (!dados.dataNascimento) {

        const erro = new Error("A data de nascimento é obrigatória.");

        erro.status = 400;
        throw erro;
    }

    if (!dados.idConvenio) {

        const erro = new Error("O convênio é obrigatório.");

        erro.status = 400;
        throw erro;
    }

    const paciente = await pacienteRepository.buscarPorId(id);

    if (!paciente) {
        const erro = new Error("Paciente não encontrado.");

        erro.status = 404;
        throw erro;
    }

    const resultado = await pacienteRepository.atualizar(id, dados);

    return resultado;
}

async function excluirPaciente(id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error("O ID do paciente deve ser numérico.");

        erro.status = 400;
        throw erro;
    }

    const paciente = await pacienteRepository.buscarPorId(id);

    if (!paciente) {

        const erro = new Error("Paciente não encontrado.");

        erro.status = 404;
        throw erro;
    }

    const totalAtendimentos = await pacienteRepository.contarAtendimentosPorPaciente(id);

    if (totalAtendimentos > 0) {

        const erro = new Error("Não é possível excluir o paciente porque existem atendimentos vinculados.");

        erro.status = 409;
        throw erro;
    }

    return await pacienteRepository.excluir(id);
}

module.exports = {
    listarPacientes,
    buscarPaciente,
    cadastrarPaciente,
    atualizarPaciente,
    excluirPaciente
};