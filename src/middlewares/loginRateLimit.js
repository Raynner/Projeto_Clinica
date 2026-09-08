const sessions = require('../repositories/sessionRepository');
const { isIP } = require('node:net');

// Normaliza IPv6 para /64 para não permitir rotação do endereço dentro da rede.
function chaveIp(ip) {
    if (ip.startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
    if (isIP(ip) !== 6) return ip;
    const url = new URL(`http://[${ip}]/`);
    const partes = url.hostname.slice(1, -1).split('::');
    const esquerda = partes[0] ? partes[0].split(':') : [];
    const direita = partes[1] ? partes[1].split(':') : [];
    return [...esquerda, ...Array(Math.max(0, 8 - esquerda.length - direita.length)).fill('0'), ...direita].slice(0, 4).map(x => parseInt(x, 16).toString(16)).join(':') + '::/64';
}
module.exports = async function limitarLogin(req, res, next) {
    try {
        const ip = await sessions.consumir(`ip:${chaveIp(req.securityClientIp || req.ip || req.socket.remoteAddress)}`, 5, 60000);
        if (!ip.permitido) return res.set('Retry-After', String(ip.retryAfter)).status(429).json({ erro: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
        const conta = await sessions.consumir(`conta:${email}`, 10, 15 * 60000);
        if (!conta.permitido) return res.set('Retry-After', String(conta.retryAfter)).status(429).json({ erro: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
        next();
    } catch (erro) { next(erro); } // Banco indisponível não libera tentativas ilimitadas.
};
