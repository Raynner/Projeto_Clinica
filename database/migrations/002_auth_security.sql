-- Sessões opacas: apenas o hash SHA-256 do cookie fica armazenado no banco.
CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    usuario_id INT NOT NULL,
    password_fingerprint CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    trocar_senha BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at BIGINT NOT NULL,
    last_seen BIGINT NOT NULL,
    INDEX auth_sessions_usuario (usuario_id),
    INDEX auth_sessions_expiry (expires_at),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
);
-- Contadores persistentes e compartilhados por processos, sem IP/email em claro.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    chave CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    hits INT UNSIGNED NOT NULL,
    expires_at BIGINT NOT NULL,
    INDEX auth_rate_expiry (expires_at)
);
