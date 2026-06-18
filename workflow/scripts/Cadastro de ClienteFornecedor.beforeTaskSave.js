/**
 * Evento disparado ao concluir cada atividade do processo.
 * Registra o histórico da etapa (Solicitação, Validação, Correção) e, quando a
 * Validação decide por "Correção", notifica o solicitante por e-mail. Só age
 * quando a tarefa é de fato concluída (WKCompletTask == true).
 *
 * @param {string} colleagueId    - usuário que está movimentando a tarefa
 * @param {string} nextSequenceId - sequência de destino escolhida
 * @param {java.util.List} userList - responsáveis pela próxima atividade
 */
function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    var atividadeAtual = Number(getValue("WKNumState"));
    var completTask = getValue("WKCompletTask") == "true";

    log.info("[E-MAIL-DEBUG] beforeTaskSave | atividade=" + atividadeAtual + " | colleagueId=" + colleagueId + " | completTask=" + completTask + " | WKUser=" + getValue("WKUser"));

    if (!completTask) {
        return;
    }

    if (atividadeAtual == 0 || atividadeAtual == 4) {
        if (!hAPI.getCardValue("solicitante")) {
            hAPI.setCardValue("solicitante", colleagueId);
        }
        adicionarHistorico(colleagueId, "Solicitação", "Enviado", "Solicitação enviada para validação.");
        return;
    }

    if (atividadeAtual == 11) {
        var decisao = hAPI.getCardValue("selectDecisao");
        var observacao = hAPI.getCardValue("observacaoValidacao");

        var acao = "";
        var atividade = "Validação";

        if (decisao == "Correcao") {
            acao = "Correção do Cadastro";
        } else if (decisao == "enviarRm") {
            acao = "Enviar ao RM";
        } else {
            acao = "Validação";
        }


        var motivoCorrecao = observacao;

        if (!observacao) {
            observacao = "Decisão registrada na etapa de validação.";
        }

        var alteracoes = montarAlteracoesEdicaoValidacao();

        if (alteracoes) {
            observacao += alteracoes;
        }

        adicionarHistorico(colleagueId, atividade, acao, observacao);

        if (decisao == "Correcao") {
            notificarSolicitanteCorrecao(motivoCorrecao, userList, colleagueId);
        }


        hAPI.setCardValue("observacaoValidacao", "");
        hAPI.setCardValue("selectDecisao", "");
        hAPI.setCardValue("snapshotEdicaoValidacao", "");

        return;
    }

    if (atividadeAtual == 27) {
        var observacao = hAPI.getCardValue("observacaoValidacao");

        if (!observacao) {
            observacao = "Cadastro ajustado e reenviado para validação.";
        }

        adicionarHistorico(
            colleagueId,
            "Correção Cadastro",
            "Reenvio para Validação",
            observacao
        );

        hAPI.setCardValue("observacaoValidacao", "");
        hAPI.setCardValue("selectDecisao", "");

        return;
    }
}



// HISTÓRICO DE DECISÃO
function adicionarHistorico(usuario, atividade, acao, observacao) {
    hAPI.addCardChild("tableHistorico", {
        tableHistoricoUsuario: usuario,
        tableHistoricoData: new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()),
        tableHistoricoAtividade: atividade,
        tableHistoricoObservacao: observacao,
        tableHistoricoAcao: acao
    });
}


// AUDITORIA DE EDIÇÃO NA VALIDAÇÃO
function montarAlteracoesEdicaoValidacao() {
    var snapshotTexto = hAPI.getCardValue("snapshotEdicaoValidacao");

    if (!snapshotTexto) {
        return "";
    }

    var snapshot = {};

    try {
        snapshot = JSON.parse(snapshotTexto);
    } catch (e) {
        log.error("Erro ao ler snapshotEdicaoValidacao: " + e);
        return "";
    }


    var campos = [
        ["classificacao", "Classificação"],
        ["categoria", "Categoria"],
        ["tipo", "Tipo"],
        ["classificacaoOperacional", "Classificação Operacional"],

        ["docCpf", "CPF"],
        ["docCnpj", "CNPJ"],
        ["docRg", "RG"],
        ["docInscricaoEstadual", "Inscrição Estadual"],

        ["razaoSocial", "Razão Social"],
        ["nomeFantasia", "Nome Fantasia"],
        ["cep", "CEP"],
        ["endereco", "Endereço"],
        ["numero", "Número"],
        ["complemento", "Complemento"],
        ["bairro", "Bairro"],
        ["cidade", "Cidade"],
        ["pais", "País"],
        ["estado", "Estado"],

        ["icms", "Contribuinte ICMS"],
        ["codIrrf", "Código de Receita IRRF"],
        ["irrf", "Alíquota IRRF"],
        ["simplesNacional", "Simples Nacional"],
        ["codNaturezaRendimento", "Natureza de Rendimentos"],
        ["regimeFiscal", "Regime Fiscal"],
        ["tipoDocEmitido", "Tipo de Documento Emitido"],

        ["grupoMercadoria1", "Grupo de Mercadoria 1"],
        ["hiddenGrupoMercadoria2", "Grupo de Mercadoria 2"],
        ["hiddenGrupoMercadoria3", "Grupo de Mercadoria 3"],
        ["hiddenGrupoMercadoria4", "Grupo de Mercadoria 4"],
        ["hiddenGrupoMercadoria5", "Grupo de Mercadoria 5"],
        ["hiddenGrupoMercadoria6", "Grupo de Mercadoria 6"],
        ["hiddenGrupoMercadoria7", "Grupo de Mercadoria 7"],
        ["hiddenGrupoMercadoria8", "Grupo de Mercadoria 8"],
        ["hiddenGrupoMercadoria9", "Grupo de Mercadoria 9"],

        ["cnaePrincipal", "CNAE Principal"],
        ["hiddenCnaeSecundario1", "CNAE Secundário 1"],
        ["hiddenCnaeSecundario2", "CNAE Secundário 2"],
        ["hiddenCnaeSecundario3", "CNAE Secundário 3"],
        ["hiddenCnaeSecundario4", "CNAE Secundário 4"],
        ["hiddenCnaeSecundario5", "CNAE Secundário 5"],
        ["toggleRetencao", "Haverá retenção?"],
        ["iss", "Retenção ISS"],
        ["inss", "Retenção INSS"],
        ["inputIrrf", "Retenção IRRF"],
        ["csll", "Retenção CSLL"],
        ["pis", "Retenção PIS"],
        ["cofins", "Retenção COFINS"],

        ["hiddenBanco1Condicao", "Condição de Pagamento (Conta 1)"],
        ["hiddenBanco1Cod",     "Banco (Conta 1)"],
        ["hiddenBanco1Agencia", "Agência (Conta 1)"],
        ["hiddenBanco1Conta",   "Conta (Conta 1)"],
        ["hiddenBanco2Condicao", "Condição de Pagamento (Conta 2)"],
        ["hiddenBanco2Cod",      "Banco (Conta 2)"],
        ["hiddenBanco2Agencia",  "Agência (Conta 2)"],
        ["hiddenBanco2Conta",    "Conta (Conta 2)"],
        ["hiddenBanco3Condicao", "Condição de Pagamento (Conta 3)"],
        ["hiddenBanco3Cod",      "Banco (Conta 3)"],
        ["hiddenBanco3Agencia",  "Agência (Conta 3)"],
        ["hiddenBanco3Conta",    "Conta (Conta 3)"],
        ["hiddenBanco4Condicao", "Condição de Pagamento (Conta 4)"],
        ["hiddenBanco4Cod",      "Banco (Conta 4)"],
        ["hiddenBanco4Agencia",  "Agência (Conta 4)"],
        ["hiddenBanco4Conta",    "Conta (Conta 4)"],
        ["hiddenBanco5Condicao", "Condição de Pagamento (Conta 5)"],
        ["hiddenBanco5Cod",      "Banco (Conta 5)"],
        ["hiddenBanco5Agencia",  "Agência (Conta 5)"],
        ["hiddenBanco5Conta",    "Conta (Conta 5)"],

        ["telefone", "Telefone"],
        ["telComercial", "Telefone Comercial"],
        ["celular", "Celular"],
        ["emailAdministrativo", "E-mail Administrativo"],
        ["emailComercial", "E-mail Comercial"],
        ["emailCr", "E-mail Financeiro / Contabilidade"],
        ["site", "Site"],

        ["anxCartaoCnpj", "Anexo Documento de Identificação Júridica"],
        ["anxCompBanco", "Anexo Comprovante Bancário"],
        ["anxContrato", "Anexo Contrato Social"],
        ["anxRgCpf", "Anexo RG / CPF"],
        ["anxCompEndereco", "Anexo Comprovante de Endereço"],
        ["anxLaudoPcd", "Anexo Laudo Médico PCD"],
        ["anxDependentes", "Anexo Dependentes IRRF"],
        ["anxCodConduta", "Anexo Código de Conduta"],
        ["anxAntiCorrupcao", "Anexo Política Anticorrupção"],
        ["anxConflito", "Anexo Conflito de Interesses"],
        ["anxLgpd", "Anexo Ciência LGPD"]
    ];

    var alteracoes = [];

    for (var i = 0; i < campos.length; i++) {
        var campo = campos[i][0];
        var label = campos[i][1];

        var antigo = String(snapshot[campo] || "").trim();
        var novo = String(hAPI.getCardValue(campo) || "").trim();

        if (isCampoCheckboxAuditoria(campo)) {
            antigo = normalizarCheckboxAuditoria(antigo);
            novo = normalizarCheckboxAuditoria(novo);
        }

        if (antigo != novo) {
            alteracoes.push(label + ": de '" + antigo + "' para '" + novo + "'");
        }
    }

    if (alteracoes.length == 0) {
        return "";
    }

    return "<br><br><b>Alterações realizadas:</b><br>• " + alteracoes.join("<br>• ");
}

function isCampoCheckboxAuditoria(campo) {
    return [
        "toggleEstrangeiro",
        "toggleRetencao",
        "iss",
        "inss",
        "inputIrrf",
        "csll",
        "pis",
        "cofins"
    ].indexOf(campo) >= 0;
}


function normalizarCheckboxAuditoria(valor) {
    var v = String(valor || "").toLowerCase().trim();

    if (v == "on" || v == "true" || v == "1" || v == "sim" || v == "s") {
        return "Sim";
    }

    return "Não";
}



// var URL_FLUIG = "http://fluig.castilho.com.br:1010";             // Produção
var URL_FLUIG = "http://homologacao.castilho.com.br:2020";   // Homologação

/**
 * Notifica o solicitante por e-mail de que o cadastro voltou para CORREÇÃO,
 * com o motivo informado na validação e o link da solicitação. Resolve o
 * destinatário em 3 níveis: card "solicitante" -> userList[0] -> colleagueId.
 *
 * @param {string} motivo       - observação/motivo registrado na validação
 * @param {java.util.List} userList - responsáveis pela próxima atividade (correção)
 * @param {string} colleagueId  - usuário que está movimentando (último recurso)
 */
function notificarSolicitanteCorrecao(motivo, userList, colleagueId) {
    try {
        // 1) Fonte primária: card "solicitante" (salvo na abertura, p/ processos novos).
        var solicitante = hAPI.getCardValue("solicitante");
        log.info("[E-MAIL] solicitante (card) = '" + solicitante + "'");

        // 2) Fallback: destinatário da próxima atividade (a correção volta ao solicitante).
        if (!solicitante && userList != null) {
            try {
                if (userList.size() > 0) {
                    solicitante = String(userList.get(0));
                    log.info("[E-MAIL] fallback userList[0] = '" + solicitante + "'");
                }
            } catch (eu) {
                log.warn("[E-MAIL] erro ao ler userList: " + eu);
            }
        }

        // 3) Último recurso: quem está movendo a tarefa.
        if (!solicitante) {
            solicitante = colleagueId;
            log.info("[E-MAIL] fallback colleagueId = '" + solicitante + "'");
        }

        var email = buscaEmailUsuarioFluig(solicitante);
        log.info("[E-MAIL] e-mail encontrado para '" + solicitante + "' = '" + email + "'");

        if (!email) {
            log.warn("[E-MAIL] Solicitante sem e-mail cadastrado: " + solicitante);
            return;
        }

        if (!motivo) {
            motivo = "Sem observação informada.";
        }

        var numProcesso = getValue("WKNumProces");
        var link = URL_FLUIG + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numProcesso;

        var corpoEmail = "";
        corpoEmail += "Olá, <br>";
        corpoEmail += "Sua solicitação nº " + numProcesso + " de <b>Cadastro de Cliente/Fornecedor</b> foi enviada para <b>CORREÇÃO DE CADASTRO</b> pela equipe de validação.<br>";
        corpoEmail += "<br>";
        corpoEmail += "<b>Motivo / Observação:</b><br>" + motivo + "<br>";
        corpoEmail += "<br>";
        corpoEmail += "Para realizar os ajustes, <a href='" + link + "'>clique aqui</a>.";

        enviarEmailFluig(email, "Cadastro de Cliente/Fornecedor enviado para CORREÇÃO - #" + numProcesso, corpoEmail);
    } catch (e) {
        log.error("[E-MAIL] Erro ao notificar correção: " + e);
        if (e.javaException) {
            log.error("[E-MAIL] Causa (Java): " + e.javaException);
        }
    }
}


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

    log.info("[E-MAIL] Chamando customEmailSender | to=" + email + " | company=" + getValue("WKCompany"));

    var vo = clientService.invoke(JSONUtil.toJSON(requestData));
    log.info("[E-MAIL] Retorno customEmailSender: " + (vo == null ? "null" : vo.getResult()));

    if (vo == null || vo.getResult() == null || vo.getResult().isEmpty()) {
        throw new Exception("Retorno do envio de e-mail está vazio");
    } else {
        log.info("[E-MAIL] Enviado para " + email + " | assunto: " + assunto);
        return vo.getResult();
    }
}
