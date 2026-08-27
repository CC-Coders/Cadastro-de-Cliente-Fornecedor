
// NOTIFICAÇÃO DE FINALIZAÇÃO DE CADASTRO DE CLIENTE/FORNECEDOR
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

        var numSolicitacao = getValue("WKNumProces");
        var link = obterUrlFluig() + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolicitacao;

        var codcfoEdicao = String(hAPI.getCardValue("codcfoEdicao") || "").trim();
        var ehEdicao = codcfoEdicao && codcfoEdicao !== "-1" && codcfoEdicao !== "0";

        var assunto = ehEdicao
            ? "Cliente/Fornecedor alterado - Nº " + numSolicitacao
            : "Cadastro de Cliente/Fornecedor finalizado - Nº " + numSolicitacao;

        var corpoEmail = montarCorpoEmailFinalizacao(numSolicitacao, link, ehEdicao, codcfoEdicao);

        enviarEmailFluig(email, assunto, corpoEmail);
    } catch (erro) {
        log.error("[E-MAIL] Erro ao notificar finalização: " + erro);
    }
}

// MONTA O CORPO DO E-MAIL DE FINALIZAÇÃO
function montarCorpoEmailFinalizacao(numSolicitacao, link, ehEdicao, codcfoEdicao) {
    var statusTexto = ehEdicao ? "ALTERADA" : "FINALIZADA";
    var statusCor   = ehEdicao ? "#e8821e" : "#27ae60";

    var frase = ehEdicao
        ? "A solicitação de <b>alteração</b> de Cliente/Fornecedor foi concluída e o cadastro já está atualizado no RM."
        : "A solicitação de cadastro de Cliente/Fornecedor foi concluída com sucesso.";

    var detalheCfo = (ehEdicao && codcfoEdicao)
        ? "<div style=\"font-size:13px; color:#8a6d3b; background:#fcf3e6; border-radius:6px; padding:8px 12px; margin-top:14px;\">Cadastro no RM (código <b>" + codcfoEdicao + "</b>) atualizado.</div>"
        : "";

    var corpo = "";
    corpo += "<div style=\"font-family: Arial, Helvetica, sans-serif; color: #2c2c2a;\">";
    corpo += "<p style=\"font-size:15px; margin:0 0 18px;\">Olá,</p>";

    // Quadro destacado: status + número
    corpo += "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border:1px solid #f0e6da; border-radius:12px; background:#faf7f3;\">";
    corpo += "<tr><td style=\"padding:22px 24px;\">";
    corpo += "<span style=\"display:inline-block; background:" + statusCor + "; color:#ffffff; font-size:12px; font-weight:bold; padding:5px 14px; border-radius:20px;\">" + statusTexto + "</span>";
    corpo += "<div style=\"font-size:22px; font-weight:bold; color:#2c2c2a; margin:14px 0 4px;\">Solicitação Nº " + numSolicitacao + "</div>";
    corpo += "<div style=\"font-size:14px; color:#6f6f6f;\">Cadastro de Cliente/Fornecedor</div>";
    corpo += detalheCfo;
    corpo += "</td></tr></table>";

    corpo += "<p style=\"font-size:15px; line-height:1.6; margin:18px 0;\">" + frase + "</p>";

    // Botão
    corpo += "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:6px 0;\">";
    corpo += "<tr><td style=\"background:#e8821e; border-radius:8px;\">";
    corpo += "<a href=\"" + link + "\" style=\"display:inline-block; padding:13px 30px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none;\">Ver detalhes da solicitação</a>";
    corpo += "</td></tr></table>";

    corpo += "</div>";
    return corpo;
}

// NOTIFICAÇÃO POR E-MAIL
var _urlFluigCache = null;
function obterUrlFluig() {
    if (_urlFluigCache) { return _urlFluigCache; }
    var url = "http://fluig.castilho.com.br:1010"; // fallback (produção)
    try {
        var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
        if (ds != null && ds.rowsCount > 0) {
            var achou = "";
            var candidatos = ["url", "URL", "serverURL", "SERVER_URL", "server_url"];
            for (var indiceCandidato = 0; indiceCandidato < candidatos.length && !achou; indiceCandidato++) {
                try {
                    var valorCandidato = ds.getValue(0, candidatos[indiceCandidato]);
                    if (valorCandidato && /^https?:\/\//i.test(String(valorCandidato))) { achou = String(valorCandidato).trim(); }
                } catch (erroCandidato) {}
            }
            if (!achou) { // varre as colunas retornadas e usa a que contém uma URL
                try {
                    var cols = ds.getColumnsName();
                    for (var indiceColuna = 0; indiceColuna < cols.size() && !achou; indiceColuna++) {
                        var valorColuna = ds.getValue(0, cols.get(indiceColuna));
                        if (valorColuna && /^https?:\/\//i.test(String(valorColuna))) { achou = String(valorColuna).trim(); }
                    }
                } catch (erroColunas) {}
            }
            if (achou) { url = achou; }
        }
    } catch (erro) {
        log.warn("[URL] Falha ao consultar dsGetServerURL, usando fallback: " + erro);
    }
    _urlFluigCache = url;
    return url;
}

// RETORNA O E-MAIL DO USUÁRIO FLUIG PELO LOGIN
function buscaEmailUsuarioFluig(login) {
    var c1 = DatasetFactory.createConstraint("login", login, login, ConstraintType.MUST);
    var dataset = DatasetFactory.getDataset("colleague", null, [c1], null);

    if (dataset != null && dataset.rowsCount > 0) {
        return dataset.getValue(0, "mail");
    }

    return null;
}

// ENVIAR E-MAIL USANDO O SERVIÇO DE NOTIFICAÇÃO DO FLUIG
function enviarEmailFluig(email, assunto, corpoEmail) {
    var data = {
        "to": email,
        from: "fluig@construtoracastilho.com.br",
        "subject": assunto,
        "templateId": "TPL_PADRAO_CASTILHO",
        "dialectId": "pt_BR",
        "param": {
            "CORPO_EMAIL": corpoEmail,
            "SERVER_URL": obterUrlFluig(),
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
        return vo.getResult();
    }
}
