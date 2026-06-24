
function afterProcessFinish(colleagueId, processId, threadSequence, userList) {
    try {
        var solicitante = hAPI.getCardValue("solicitante");
        if (!solicitante) {
            solicitante = colleagueId;
        }

        var email = buscaEmailUsuarioFluig(solicitante);
        if (!email) {
            log.warn("[E-MAIL] Solicitante sem e-mail cadastrado: " + solicitante);
            return;
        }

        var link = URL_FLUIG + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + processId;

        var corpoEmail = "";
        corpoEmail += "Olá, <br>";
        corpoEmail += "Sua solicitação nº " + processId + " de <b>Cadastro de Cliente/Fornecedor</b> foi <b>finalizada</b>.<br>";
        corpoEmail += "<br>";
        corpoEmail += "Para consultar os detalhes, <a href='" + link + "'>clique aqui</a>.";

        enviarEmailFluig(email, "Cadastro de Cliente/Fornecedor finalizado - #" + processId, corpoEmail);
    } catch (e) {
        log.error("[E-MAIL] Erro ao notificar finalização: " + e);
    }
}



// NOTIFICAÇÃO POR E-MAIL 
var URL_FLUIG = "http://fluig.castilho.com.br:1010";             // Produção
// var URL_FLUIG = "http://homologacao.castilho.com.br:2020";   // Homologação


function buscaEmailUsuarioFluig(login) {
    var c1 = DatasetFactory.createConstraint("login", login, login, ConstraintType.MUST);
    var dataset = DatasetFactory.getDataset("colleague", null, [c1], null);

    if (dataset != null && dataset.rowsCount > 0) {
        return dataset.getValue(0, "mail");
    }

    return null;
}


function enviarEmailFluig(email, assunto, corpoEmail) {
    var data = {
        "to": email,
        from: "fluig@construtoracastilho.com.br",
        "subject": assunto,
        "templateId": "TPL_PADRAO_CASTILHO",
        "dialectId": "pt_BR",
        "param": {
            "CORPO_EMAIL": corpoEmail,
            "SERVER_URL": URL_FLUIG,
            "TENANT_ID": "1"
        }
    };

    var clientService = fluigAPI.getAuthorizeClientService();
    var requestData = {
        companyId: getValue("WKCompany") + '',
        serviceCode: 'ServicoFluig',
        endpoint: '/api/public/alert/customEmailSender',
        method: 'post',
        params: data,
        options: {
            encoding: 'UTF-8',
            mediaType: 'application/json',
            useSSL: true
        },
        headers: {
            "Content-Type": 'application/json;charset=UTF-8'
        }
    };

    var vo = clientService.invoke(JSONUtil.toJSON(requestData));

    if (vo.getResult() == null || vo.getResult().isEmpty()) {
        throw new Exception("Retorno do envio de e-mail está vazio");
    } else {
        log.info("[E-MAIL] Enviado para " + email + " | assunto: " + assunto);
        return vo.getResult();
    }
}
