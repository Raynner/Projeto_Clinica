function autorizarPerfil(...perfisPermitidos) {
    return (req, res, next) => {
        const usuario = req.usuario;

        if (!usuario) {
            return res.status(401).json({
                erro: "Usuário não autenticado."
            });
        }

        if (!perfisPermitidos.includes(usuario.perfil)) {
            return res.status(403).json({
                erro: "Acesso não autorizado."
            });
        }

        next();
    };

}

module.exports = autorizarPerfil;