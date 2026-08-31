const express = require("express");
const router = express.Router();
const convenioController = require("../controllers/convenioController");

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