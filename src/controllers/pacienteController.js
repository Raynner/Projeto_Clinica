// RESPONSÁVEL POR LIDAR COM REQ E RES

const pacienteService = require("../services/pacienteService");

async function listarPacientes(req, res) {

    try {
        
        const pacientes = await pacienteService.listarPacientes();
        res.status(200).json(pacientes);

    } catch (erro) {

        console.error(
            "Erro ao listar pacientes:", erro
        );

        res.status(500).json({erro: "Erro ao buscar pacientes."});
        
    }
    
}

async function buscarPaciente(req, res) {

    try {

        const { id } = req.params;

        if (!/^\d+$/.test(id)) {

            return res.status(400).json({
               erro:  "O ID do paciente deve ser numérico."
            });
        }

        const paciente = await pacienteService.buscarPaciente(id);

        if (!paciente) {

            return res.status(404).json({
                erro: "Paciente não encontrado."
            });
        }

        res.status(200).json(paciente);

    } catch (erro) {

        console.error(
            "Erro ao buscar paciente:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao buscar paciente."
        });
    }
}

async function cadastrarPaciente(req, res) {

    try {
        
        const dados = req.body;

        const resultado = await pacienteService.cadastrarPaciente(dados);

        res.status(201).json({
            mensagem: "Paciente cadastrado com sucesso!",

            paciente_id: resultado.paciente_id,

            responsavel_id: resultado.responsavel_id
        });
    } catch (erro) {

        console.error("Erro ao cadastrar paciente:", erro);

        const status = erro.status || 500;

        res.status(status).json({
            erro: erro.message || "Erro interno do servidor."
        });
        
    }
    
}

async function atualizarPaciente(req, res) {
    
    try {

        const { id } = req.params;
        const dados = req.body;

        const resultado = await pacienteService.atualizarPaciente(id, dados);

        res.status(200).json({

            mensagem: "Paciente atualizado com sucesso.",

            paciente_id: Number(id),

            registros_alterados: resultado.affectedRows
        });
    } catch (erro) {

        console.error("Erro ao atualizar paciente:", erro);

        res.status(erro.status || 500).json({

            erro:
                erro.message ||  "Erro interno do servidor."
        });
    }
}

async function excluirPaciente(req, res) {

    try {
        
        const { id } = req.params;

        const resultado = await pacienteService.excluirPaciente(id);

        res.status(200).json({

            mensagem: "Paciente excluído com sucesso.",

            paciente_id: Number(id),

            registros_excluidos: resultado.affectedRows
        });

    } catch (erro) {

        console.error("Erro ao excluir paciente:", erro);

        res.status(erro.status || 500).json({

            erro:
                erro.message || "Erro interno do servidor."
        });
        
    }
    
}

module.exports = {
    listarPacientes,
    buscarPaciente,
    cadastrarPaciente,
    atualizarPaciente,
    excluirPaciente
};