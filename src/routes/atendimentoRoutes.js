const express = require("express");
const router = express.Router();
const atendimentoController = require("../controllers/atendimentoController");

router.get(
    "/", atendimentoController.listarAtendimentos
);

router.get(
    "/:id", atendimentoController.buscarAtendimento
);

router.post(
    "/", atendimentoController.cadastrarAtendimento
);

router.put(
    "/:id", atendimentoController.atualizarAtendimento
);

router.delete(
    "/:id", atendimentoController.excluirAtendimento
);

module.exports = router;