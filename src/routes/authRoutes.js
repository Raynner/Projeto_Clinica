const router = require('express').Router();
const controller = require('../controllers/authController');
const autenticar = require('../middlewares/authMiddleware');
const limitarLogin = require('../middlewares/loginRateLimit');
const sessions = require('../repositories/sessionRepository');
router.post('/login', limitarLogin, controller.login);
router.post('/logout', controller.logout);
router.get('/me', autenticar, controller.me);
router.post('/senha', autenticar, async (req, res, next) => {
    try {
        // A confirmação de senha também precisa de limite para não virar outro login ilimitado.
        const limite = await sessions.consumir('senha:' + req.usuario.usuario_id, 5, 15 * 60000);
        if (!limite.permitido) return res.set('Retry-After', String(limite.retryAfter)).status(429).json({ erro: 'Muitas tentativas. Aguarde.' });
        next();
    } catch (erro) { next(erro); }
}, controller.alterarSenha);
module.exports = router;
