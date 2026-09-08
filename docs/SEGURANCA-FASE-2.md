# Correção de alta prioridade — autenticação, MySQL e HTTPS

Data: 08/09/2026. Escopo: implementação local, migração do MySQL local e verificação pública somente de leitura. Não houve deploy ou alteração das variáveis do Railway.

## 1. Login e proteção contra tentativas

- `src/middlewares/loginRateLimit.js` limita a 5 requisições por minuto por IP e 10 por 15 minutos por endereço de e-mail normalizado. Conta tentativas bem-sucedidas e malsucedidas. As janelas são fixas; pode haver duas cotas próximas à virada de janela.
- IPv6 é agrupado por /64. Headers de encaminhamento só são considerados conforme os peers explicitamente confiáveis.
- `src/repositories/sessionRepository.js` mantém os contadores no MySQL com incremento atômico. Reinício do Node e múltiplos processos não zeram as cotas. As chaves são hashes de IP/e-mail e janela, sem esses valores em claro; isso é pseudonimização, não anonimização irreversível.
- Exceder a cota retorna HTTP 429 e `Retry-After`. Falha do banco não permite continuar sem limite.
- Contas inexistentes, inativas, com perfil inválido ou senha incorreta recebem a mesma mensagem/401. A consulta a usuário ausente executa comparação com hash fictício; isso reduz diferença de tempo, sem prometer tempo constante entre todas as contas legadas.
- Tipos e limites das credenciais são verificados antes do bcrypt. Login usa e-mail normalizado e senha sem alteração.

## 2. Política e troca de senha

- `src/services/passwordPolicy.js`: mínimo de 15 caracteres Unicode e máximo de 72 bytes UTF-8 para evitar truncamento pelo bcrypt. Frases-senha, espaços, acentos e outros alfabetos são aceitos.
- Rejeita repetição de um caractere e algumas sequências comuns. A lista é pequena: não é uma consulta a bases de senhas vazadas e não equivale a MFA.
- Cadastro e troca de senha usam bcrypt com custo 12. Hashes antigos continuam verificáveis; a senha em claro nunca é armazenada.
- Senha legada que não atende à política gera sessão restrita: somente consultar a própria sessão, alterar senha ou sair. As outras APIs retornam `TROCAR_SENHA`.
- `POST /api/auth/senha` exige a senha atual, uma nova senha diferente e válida, e limita a 5 tentativas por 15 minutos por usuário.
- A atualização do hash e a exclusão de todas as sessões ocorrem na mesma transação. Login simultâneo é serializado pelo bloqueio da linha do usuário.
- `client/senha.html` oferece a troca voluntária pelo menu e a troca obrigatória para senhas antigas fracas. O usuário volta ao login ao concluir.
- Senhas já armazenadas não podem ser avaliadas sem o usuário apresentá-las. A verificação acontece no próximo login, sem redefinição administrativa em massa.

## 3. Sessões e CSRF

- JWT foi substituído por identificador opaco aleatório de 32 bytes. O pacote `jsonwebtoken` foi removido.
- Somente o hash SHA-256 do identificador fica em `auth_sessions`; o segredo é enviado em cookie HttpOnly, SameSite=Strict e Path=/.
- HTTPS usa Secure e nome `__Host-praxis_session`, sem Domain. No desenvolvimento HTTP local, o cookie se chama `praxis_session` e não tem Secure. Não há exceção HTTP para produção.
- Duração absoluta: 2 horas. Expiração por inatividade: 15 minutos, verificada no servidor. Requisições autenticadas renovam apenas a atividade, não as duas horas.
- O cookie não aparece no JSON de login e não fica em sessionStorage/localStorage. O frontend remove o JWT antigo e consulta `/api/auth/me` antes de iniciar cada página. Identidade fica em memória.
- `POST /api/auth/logout` revoga o registro no banco antes de limpar o cookie e informar sucesso. Se houver falha de rede, a interface informa que a saída não foi confirmada.
- Bloqueio/reativação de uma conta revogam sessões em transação. A autenticação também consulta perfil e status atuais e compara a impressão do hash da senha, invalidando sessões se a senha mudar por outro caminho.
- A migração invalida JWTs legados. Todos os usuários precisarão entrar novamente após publicar a nova versão.
- Como cookies são enviados automaticamente, requisições de escrita exigem `X-Praxis-Request: 1`; Origin, quando presente, deve coincidir exatamente com APP_ORIGIN, e Sec-Fetch-Site cross-site é rejeitado. O servidor não habilita CORS permissivo. Clientes não-browser devem enviar o mesmo header e cookie.
- HttpOnly reduz o furto direto do segredo por JavaScript; não torna XSS inofensivo. As correções de renderização da etapa anterior continuam necessárias.

## 4. MySQL local: alteração efetivamente aplicada

- Executado `scripts/provision-security.js` com a configuração administrativa local anterior.
- Aplicada `database/migrations/002_auth_security.sql`, criando `auth_sessions` e `auth_rate_limits`, com índices de expiração e usuário.
- Criada uma conta exclusiva de nome aleatório, restrita a localhost, com senha aleatória de 48 caracteres. Os valores não são incluídos no relatório.
- Concessões: SELECT/INSERT/UPDATE para usuarios e pais; SELECT/INSERT/UPDATE/DELETE para pacientes, convenio, atendimento, auth_sessions e auth_rate_limits. Sem ALL PRIVILEGES, GRANT OPTION, CREATE, ALTER ou DROP.
- A conexão e os grants foram verificados antes da alteração do `.env`. A aplicação local deixou de usar root. A conta administrativa root continua existindo para administração do MySQL.
- `.env` permanece ignorado pelo Git. JWT_SECRET foi removido por não ser mais utilizado. A senha root não foi mantida na nova configuração da aplicação.
- `src/config/database.js` recusa root, senha de banco com menos de 24 caracteres e MySQL remoto sem TLS validado. CA privada pode ser configurada em DB_SSL_CA; `rejectUnauthorized` nunca é desativado.
- Adotado pool com 10 conexões e fila limitada a 100. O cadastro de pacientes agora reserva e libera sua própria conexão transacional, para não misturar a criação de sessões com uma transação clínica em andamento.
- `src/server.js` verifica as tabelas antes de ouvir conexões. Limpa sessões/contadores expirados na inicialização e a cada minuto; a aplicação não cria tabelas nem recebe privilégios de migração.

## 5. HTTPS verificado no Railway

URL: https://projetoclinica-production-b26f.up.railway.app/

Verificado com `scripts/check-https.js`, por HEAD e handshake TLS com validação normal de certificado:

| Verificação | Resultado observado |
| --- | --- |
| HTTPS | HTTP 200 |
| HTTP | HTTP 301 para a mesma URL em HTTPS |
| Certificado | Aceito pela cadeia de confiança e pelo hostname |
| Emissor | Let's Encrypt |
| TLS negociado | TLS 1.3 |
| Expiração apresentada | 27/10/2026, 02:40:54 GMT |
| HSTS publicado | Ausente |

Não foram enviados login, senhas ou operações de alteração para o domínio público. Não foram testadas todas as versões de TLS ou conjuntos de cifras.

O novo middleware envia HSTS por um ano em respostas reconhecidas como HTTPS e recusa HTTP com 426 quando APP_ORIGIN usa HTTPS, antes de processar credenciais. O redirecionamento externo continua sendo função do edge/proxy.

## 6. Publicação no Railway: requisitos ainda não aplicados

1. Aplicar a migração no banco de produção usando credencial administrativa separada. Não executar o provisionador local contra produção.
2. Criar a conta exclusiva no MySQL de produção, com as mesmas concessões por tabela e restrição de origem adequada à rede. Atualizar DB_USER/DB_PASSWORD/DB_HOST/DB_NAME/DB_PORT no Railway. A conta local @localhost não é transferida automaticamente.
3. Configurar NODE_ENV=production e APP_ORIGIN=https://projetoclinica-production-b26f.up.railway.app. BIND_HOST deve permitir conexão do edge, normalmente `0.0.0.0` na plataforma. Utilizar a PORT fornecida pelo Railway.
4. Configurar TRUSTED_PROXIES com os IPs/redes CIDR efetivos dos peers que entregam tráfego ao processo. Não usar true, contagem de saltos, /0 ou redes amplas arbitrárias. Verificar que os peers sobrescrevem headers do cliente e que não há caminho público direto que contorne o proxy.
5. No Railway, configurar CLIENT_IP_HEADER=x-real-ip, conforme a documentação da plataforma. Esse header só é usado quando o peer é confiável; sem isso pode ocorrer limitação indevida de vários usuários como se fossem um IP.
6. Para MySQL remoto, configurar DB_TLS=true e DB_SSL_CA quando necessário. Confirmar suporte e certificado do servidor; não desabilitar validação para fazer a conexão funcionar.
7. Publicar frontend e backend juntos, reiniciar e testar login, troca obrigatória, operações autorizadas, logout e HSTS. Cookies Secure não funcionam por HTTP.

Sem origem HTTPS válida, tabelas ou credenciais seguras, a inicialização falha em vez de expor o serviço de forma insegura. Sem a configuração correta do proxy, o middleware recusa tráfego percebido como HTTP. Não foi realizada alteração remota nem deploy nesta tarefa.

## 7. Validação

- `npm test`: 28 testes aprovados, sem falhas, cobrindo rotas, exportação, XSS, frontend e novos testes de autenticação com repositórios simulados.
- `scripts/check-security-db.js`: verificação real da conta MySQL local, grants, revogação, expiração absoluta, inatividade, impressão da senha e incremento concorrente dos contadores. Criou apenas sessões e contadores artificiais, removidos ao final; não alterou senhas, perfis ou cadastros clínicos.
- Verificação de sintaxe dos scripts JS e dos scripts inline das páginas.
- Revisão de diff, ausência de JWT/storage de credenciais e preservação dos comentários explicativos.
- Não foi realizado teste visual em navegador nem publicação da versão no Railway.

## Referências técnicas

- OWASP Authentication: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Express e proxies: https://expressjs.com/en/guide/behind-proxies/
- Railway, headers e TLS: https://docs.railway.com/networking/public-networking/specs-and-limits
