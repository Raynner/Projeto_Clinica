// Verificação somente de leitura: HEAD na página inicial e handshake TLS validado.
const https = require('node:https');
async function main() {
    const url = new URL(process.argv[2]);
    if (url.protocol !== 'https:') throw new Error('Informe uma URL HTTPS.');
    for (const scheme of ['https:', 'http:']) {
        const target = new URL(url.origin); target.protocol = scheme;
        const response = await fetch(target, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
        console.log(JSON.stringify({ url: target.origin, status: response.status, location: response.headers.get('location'), hsts: response.headers.get('strict-transport-security') }));
    }
    await new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'HEAD', timeout: 15000, rejectUnauthorized: true }, res => {
            const certificate = res.socket.getPeerCertificate();
            console.log(JSON.stringify({ authorized: res.socket.authorized, protocol: res.socket.getProtocol(), validTo: certificate.valid_to, issuer: certificate.issuer?.O }));
            res.resume(); res.on('end', resolve);
        });
        req.on('timeout', () => req.destroy(new Error('Timeout TLS')));
        req.on('error', reject); req.end();
    });
}
main().catch(error => { console.error(error.cause?.code || error.code || error.message); process.exitCode = 1; });
