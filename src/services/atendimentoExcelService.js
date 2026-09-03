const ExcelJS = require("exceljs");
const atendimentoService = require("./atendimentoService");

async function exportarAtendimentos(usuario) {
    // A consulta aplica as permissões do usuário autenticado no servidor.
    const atendimentos = await atendimentoService.listarAtendimentos(
        usuario.usuario_id,
        usuario.perfil
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Atendimentos");
    sheet.columns = [
        { header: "Data", key: "data", width: 15 },
        { header: "Horário", key: "horario", width: 12 },
        { header: "Paciente", key: "paciente", width: 35 },
        { header: "Responsável", key: "responsavel", width: 35 },
        { header: "Convênio", key: "convenio", width: 25 },
        { header: "Presença", key: "presenca", width: 18 },
        { header: "Valor / atendimento", key: "valor", width: 23 },
        { header: "Fisioterapeuta", key: "fisioterapeuta", width: 35 }
    ];

    let totalCentavos = 0;
    for (const atendimento of atendimentos) {
        const valor = atendimento.presenca?.toUpperCase() === "DESMARCOU"
            ? 0 : Number(atendimento.valor || 0);
        totalCentavos += Math.round(valor * 100);
        sheet.addRow({
            data: atendimento.data_atendimento
                ? new Date(atendimento.data_atendimento).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "",
            horario: atendimento.horario_atendimento || "",
            paciente: atendimento.nome__completo_paciente || "",
            responsavel: atendimento.nome_completo || "",
            convenio: atendimento.nome_convenio || "",
            presenca: atendimento.presenca || "",
            valor,
            fisioterapeuta: atendimento.nome_fisioterapeuta || usuario.nome || ""
        });
    }

    sheet.getColumn("valor").numFmt = '"R$" #,##0.00';
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `H${sheet.rowCount}` };
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    header.height = 25;
    sheet.addRow({ presenca: "Valor total", valor: totalCentavos / 100 }).font = { bold: true };

    return workbook.xlsx.writeBuffer();
}

module.exports = { exportarAtendimentos };
