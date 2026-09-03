const atendimentoService = require("../services/atendimentoService");
const atendimentoExcelService = require("../services/atendimentoExcelService");

async function exportarAtendimentos(req, res) {
    try {
        const arquivo = await atendimentoExcelService.exportarAtendimentos(req.usuario);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="atendimentos.xlsx"');
        res.setHeader("Cache-Control", "no-store");
        res.send(Buffer.from(arquivo));
    } catch (erro) {
        console.error("Erro ao exportar atendimentos:", erro);
        res.status(erro.status || 500).json({ erro: "Não foi possível exportar os atendimentos." });
    }
}

// GET /api/atendimentos

async function listarAtendimentos(req, res) {
    try {
        const usuario_id = req.usuario.usuario_id;
        const perfil = req.usuario.perfil;

        const atendimentos =
            await atendimentoService.listarAtendimentos(
                usuario_id,
                perfil
            );

        res.status(200).json(atendimentos);

    } catch (erro) {
        console.error("Erro ao listar atendimentos:", erro);

        res.status(erro.status || 500).json({
            erro: erro.message || "Erro interno do servidor."
        });
    }
}

// GET /api/atendimentos/:id

async function buscarAtendimento(req, res) {

    try {

        const { id } = req.params;

        const usuario_id = req.usuario.usuario_id
        const perfil = req.usuario.perfil;

        const atendimento =
            await atendimentoService.buscarAtendimento(id, usuario_id, perfil);

        res.status(200).json(atendimento);

    } catch (erro) {

        console.error(
            "Erro ao buscar atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// POST

async function cadastrarAtendimento(req, res) {

    try {

        const atendimento = {

            data_atendimento:
                req.body.data_atendimento,

            horario_atendimento:
                req.body.horario_atendimento,

            id_paciente:
                req.body.id_paciente,

            presenca:
                req.body.presenca,

            usuario_id:
                req.usuario.usuario_id
        };

        const resultado =
            await atendimentoService.cadastrarAtendimento(
                atendimento
            );

        res.status(201).json({

            mensagem:
                "Atendimento cadastrado com sucesso.",

            atendimento_id:
                resultado.insertId

        });

    } catch (erro) {

        console.error(
            "Erro ao cadastrar atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// PUT

async function atualizarAtendimento(req, res) {

    try {

        const { id } = req.params;

        const usuario_id = req.usuario.usuario_id;

        const resultado =
            await atendimentoService.atualizarAtendimento(
                id,
                req.body,
                usuario_id
            );

        res.status(200).json({

            mensagem:
                "Atendimento atualizado com sucesso.",

            atendimento_id:
                Number(id),

            registros_alterados:
                resultado.affectedRows

        });

    } catch (erro) {

        console.error(
            "Erro ao atualizar atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// DELETE

async function excluirAtendimento(req, res) {

    try {

        const { id } = req.params;

        const usuario_id = req.usuario.usuario_id;

        const resultado =
            await atendimentoService.excluirAtendimento(id, usuario_id);

        res.status(200).json({

            mensagem:
                "Atendimento excluído com sucesso.",

            atendimento_id:
                Number(id),

            registros_excluidos:
                resultado.affectedRows

        });

    } catch (erro) {

        console.error(
            "Erro ao excluir atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

module.exports = {
    exportarAtendimentos,
    listarAtendimentos,
    buscarAtendimento,
    cadastrarAtendimento,
    atualizarAtendimento,
    excluirAtendimento
};
