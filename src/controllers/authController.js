const authService = require("../services/authService");

async function login(req, res, next) {

    try {

        const {
            email,
            senha
        } = req.body;


        const resultado =
            await authService.login(
                email,
                senha
            );


        res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            ...resultado
        });


    } catch (erro) {

        next(erro);
    }
}


module.exports = {
    login
};