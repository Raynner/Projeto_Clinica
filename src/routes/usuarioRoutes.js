const express = require("express");

const router = express.Router();

const usuarioController = require("../controllers/usuarioController");

// POST /api/usuarios

router.post("/", usuarioController.cadastrarUsuario);

// GET /api/usuarios/:id

router.get("/:id", usuarioController.buscarUsuarioPorId);

module.exports = router;