const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const atendimentoController = require("../controllers/atendimentoController");

router.get(
    "/", authMiddleware, atendimentoController.listarAtendimentos
);

router.get(
    "/exportar", authMiddleware, atendimentoController.exportarAtendimentos
);

router.get(
    "/:id", authMiddleware, atendimentoController.buscarAtendimento
);

router.post(
    "/", authMiddleware, atendimentoController.cadastrarAtendimento
);

router.put(
    "/:id", authMiddleware, atendimentoController.atualizarAtendimento
);

router.delete(
    "/:id", authMiddleware, atendimentoController.excluirAtendimento
);

module.exports = router;
