const { isIP } = require("node:net");

function configuracao(env = process.env) {
    const production = env.NODE_ENV === "production";
    const origin = new URL(env.APP_ORIGIN || `http://localhost:${env.PORT || 5000}`);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
        throw new Error("APP_ORIGIN deve conter somente protocolo, host e porta.");
    }
    // HTTP é permitido somente no desenvolvimento local, nunca em produção.
    if (origin.protocol !== 'https:' && (production || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) {
        throw new Error("APP_ORIGIN deve usar HTTPS fora do desenvolvimento local.");
    }
    const proxies = (env.TRUSTED_PROXIES || '').split(',').map(x => x.trim()).filter(Boolean);
    if (proxies.some(value => {
        const [ip, prefix, extra] = value.split('/');
        const family = isIP(ip);
        return !family || extra !== undefined || (prefix !== undefined && (!/^\d+$/.test(prefix) || Number(prefix) < 1 || Number(prefix) > (family === 4 ? 32 : 128)));
    })) throw new Error("TRUSTED_PROXIES aceita somente IPs ou redes CIDR explícitos, sem /0.");
    const clientIpHeader = env.CLIENT_IP_HEADER || 'x-forwarded-for';
    if (!['x-forwarded-for', 'x-real-ip'].includes(clientIpHeader)) throw new Error('CLIENT_IP_HEADER inválido.');
    return { origin: origin.origin, secure: origin.protocol === 'https:', proxies, clientIpHeader,
        cookieName: origin.protocol === 'https:' ? '__Host-praxis_session' : 'praxis_session',
        absoluteMs: 2 * 60 * 60 * 1000, idleMs: 15 * 60 * 1000 };
}
module.exports = { configuracao };
