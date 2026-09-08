const express = require("express");
const router = express.Router();
const convenioController = require("../controllers/convenioController");
const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfil = require("../middlewares/perfilMiddleware");

// Autenticação e autorização no router impedem acesso direto anônimo à API,
// mesmo que alguém ignore a proteção das páginas. Preserva os perfis existentes.
router.use(authMiddleware, autorizarPerfil("ADMIN", "FISIOTERAPEUTA"));

router.get(
    "/",
    convenioController.listarConvenios
);

router.get(
    "/:id",
    convenioController.buscarConvenio
);

router.post(
    "/",
    convenioController.cadastrarConvenio
);

router.put(
    "/:id",
    convenioController.atualizarConvenio
);

router.delete(
    "/:id",
    convenioController.excluirConvenio
);

module.exports = router;
