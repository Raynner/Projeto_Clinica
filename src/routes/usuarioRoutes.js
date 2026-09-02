const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfil = require("../middlewares/perfilMiddleware");

const usuarioController = require("../controllers/usuarioController");

// GET/ TODOS OS USUÁRIOS

router.get(
    "/",
    authMiddleware,
    autorizarPerfil("ADMIN"),
    usuarioController.listarUsuarios
);

// GET /api/usuarios/:id

router.get("/:id", authMiddleware, usuarioController.buscarUsuarioPorId);

// POST /api/usuarios

router.post("/", authMiddleware, autorizarPerfil("ADMIN"), usuarioController.cadastrarUsuario);

// ATUALIZAR STATUS DO USUÁRIO

router.patch(
    "/:id/status",
    authMiddleware,
    autorizarPerfil("ADMIN"),
    usuarioController.atualizarStatusUsuario
);

module.exports = router;