CREATE TABLE pais (
    pais_id INT NOT NULL AUTO_INCREMENT,
    nome_completo VARCHAR (1000) NOT NULL,
    telefone VARCHAR (255),
    endereco VARCHAR (500),
    PRIMARY KEY (pais_id)
);

CREATE TABLE convenio (
    convenio_id INT NOT NULL AUTO_INCREMENT,
    nome_convenio VARCHAR (255) NOT NULL,
    valor DECIMAL (10,2) NOT NULL,
    PRIMARY KEY (convenio_id)
);

CREATE TABLE pacientes (
    paciente_id INT NOT NULL AUTO_INCREMENT,
    nome__completo_paciente VARCHAR (1000) NOT NULL,
    data_nascimento DATE,
    id_responsavel INT NOT NULL,
    id_convenio INT NOT NULL,
    PRIMARY KEY (paciente_id),
    FOREIGN KEY (id_responsavel) REFERENCES pais(pais_id),
    FOREIGN KEY (id_convenio) REFERENCES convenio(convenio_id)
);

CREATE TABLE atendimento (
    atendimento_id INT NOT NULL AUTO_INCREMENT,
    data_atendimento DATE NOT NULL,
    horario_atendimento TIME(0) NOT NULL,
    id_paciente INT NOT NULL,
    presenca VARCHAR(255) NOT NULL,
    PRIMARY KEY (atendimento_id),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(paciente_id)
);

CREATE TABLE usuarios (
	usuario_id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id)
);

CREATE OR REPLACE VIEW vw_atendimentos AS
SELECT
    aten.atendimento_id AS 'id',
    aten.data_atendimento AS 'Data',
    aten.horario_atendimento AS 'Horário',
    paci.nome__completo_paciente AS 'Paciente',
    pa.nome_completo AS 'Responsável',
    con.nome_convenio AS 'Convenio',
    aten.presenca AS 'Atendido ou não',
    con.valor AS 'Valor recebido pelo atendimento'

FROM atendimento aten
JOIN pacientes paci
    ON aten.id_paciente = paci.paciente_id
JOIN pais pa
    ON paci.id_responsavel = pa.pais_id
JOIN convenio con
    ON paci.id_convenio = con.convenio_id
ORDER BY
    aten.data_atendimento DESC,
    aten.horario_atendimento DESC;


    