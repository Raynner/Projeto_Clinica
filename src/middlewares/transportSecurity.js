const { configuracao } = require('../config/security');
const { isIP } = require('node:net');

module.exports = function configurarTransporte(app) {
    const config = configuracao();
    // Nunca confie em X-Forwarded-* de qualquer origem: somente no proxy listado.
    app.set('trust proxy', config.proxies.length ? config.proxies : false);
    app.disable('x-powered-by');
    app.use((req, res, next) => {
        req.securityClientIp = req.ip;
        // Railway documenta X-Real-IP. Só aceita esse header de um peer confiável
        // configurado para sobrescrevê-lo; um cliente direto não controla o limite.
        if (config.clientIpHeader === 'x-real-ip' && app.get('trust proxy fn')(req.socket.remoteAddress, 0)) {
            if (!isIP(req.get('X-Real-IP') || '')) return res.status(400).json({ erro: 'IP do cliente não informado pelo proxy.' });
            req.securityClientIp = req.get('X-Real-IP');
        }
        if (config.secure && !req.secure) {
            // Não redireciona POST com credenciais: rejeita antes de processar o corpo.
            return res.status(426).json({ erro: 'HTTPS é obrigatório.' });
        }
        if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
        if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
        if (req.path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            // Cookie exige defesa CSRF: header não simples e origem exata.
            // Não habilitar CORS permissivo: formulários de outro site não podem enviar este header.
            if (req.get('X-Praxis-Request') !== '1' || (req.get('Origin') && req.get('Origin') !== config.origin) || req.get('Sec-Fetch-Site') === 'cross-site') {
                return res.status(403).json({ erro: 'Origem da requisição não permitida.' });
            }
        }
        next();
    });
};
