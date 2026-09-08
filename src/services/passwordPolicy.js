// Frases-senha são aceitas sem regras artificiais de símbolos. O limite em bytes
// impede truncamento silencioso do bcrypt, inclusive com caracteres multibyte.
function senhaForte(senha) {
    if (typeof senha !== 'string' || [...senha].length < 15 || Buffer.byteLength(senha, 'utf8') > 72) return false;
    const simples = senha.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/^(.)\1+$/.test(senha) || /^(1234567890?|password|senha|qwerty|admin)+$/.test(simples)) return false;
    return senha.trim().length > 0;
}
function validarSenha(senha) {
    if (!senhaForte(senha)) {
        const erro = new Error('Use uma frase-senha com pelo menos 15 caracteres, até 72 bytes, sem sequências comuns ou repetidas.');
        erro.status = 400;
        throw erro;
    }
}
module.exports = { senhaForte, validarSenha };
