function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    var atividadeAtual = getValue("WKNumState");

    if (atividadeAtual == 0 || atividadeAtual == 4) {
        hAPI.addCardChild("tableHistorico", {
            tableHistoricoUsuario: colleagueId,
            tableHistoricoData: new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()),
            tableHistoricoAtividade: "Solicitação",
            tableHistoricoObservacao: "Solicitação enviada para validação.",
            tableHistoricoAcao: "Enviado"
        });
    }
}