
const express = require("express");

const router = express.Router();

const pacienteController = require("../controllers/pacienteController");
const authMiddleware = require("../middlewares/authMiddleware");
const autorizarPerfil = require("../middlewares/perfilMiddleware");

// Protege todas as operações, inclusive futuras rotas: o servidor valida o JWT,
// a conta ativa e o perfil atual no banco antes de acessar dados dos pacientes.
// Mantém o cadastro compartilhado entre os dois perfis existentes na clínica.
router.use(authMiddleware, autorizarPerfil("ADMIN", "FISIOTERAPEUTA"));

router.get(
    "/", pacienteController.listarPacientes
);

router.get(
    "/:id", pacienteController.buscarPaciente
);

router.post(
    "/", pacienteController.cadastrarPaciente
);

router.put(
    "/:id", pacienteController.atualizarPaciente
);

router.delete(
    "/:id", pacienteController.excluirPaciente
);

module.exports = router;
