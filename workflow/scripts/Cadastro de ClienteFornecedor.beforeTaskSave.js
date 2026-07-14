
// REGISTRA O HISTÓRICO DE AÇÕES DO USUÁRIO NO CARD (tableHistorico) E CAPTURA SNAPSHOT PARA AUDITORIA
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
        // baseline da auditoria: estado enviado para a validação
        hAPI.setCardValue("snapshotEdicaoValidacao", capturarSnapshotCardParaAuditoria());

        var obsInicio = String(hAPI.getCardValue("observacaoValidacao") || "").trim();
        var msgInicio = obsInicio || "Solicitação enviada para validação.";
        adicionarHistorico(colleagueId, "Solicitação", "Enviado", msgInicio);

        // limpa as observações para não vazar para a etapa de Validação
        hAPI.setCardValue("observacaoValidacao", "");
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

        // novo baseline da auditoria: estado corrigido reenviado para a validação
        hAPI.setCardValue("snapshotEdicaoValidacao", capturarSnapshotCardParaAuditoria());

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

// ADICIONA UMA LINHA NA 'tableHistorico'
function adicionarHistorico(usuario, atividade, acao, observacao) {
    hAPI.addCardChild("tableHistorico", {
        tableHistoricoUsuario: usuario,
        tableHistoricoData: new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()),
        tableHistoricoAtividade: atividade,
        tableHistoricoObservacao: observacao,
        tableHistoricoAcao: acao
    });
}

// MONTA O RESUMO DE ALTERAÇÕES REALIZADAS NA EDIÇÃO PARA INCLUIR NO HISTÓRICO E NO E-MAIL DE NOTIFICAÇÃO
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


    var campos = listaCamposAuditoria();

    var alteracoes = [];

    for (var i = 0; i < campos.length; i++) {
        var campo = campos[i][0];
        var label = campos[i][1];

        // Snapshots antigos (capturados com outra lista de campos) podem não
        // conter esta chave. Sem baseline confiável, não registramos alteração
        // — evita falso positivo ao mudar a lista de campos auditados.
        if (typeof snapshot[campo] === "undefined") {
            continue;
        }

        var antigoRaw = String(snapshot[campo] || "").trim();
        var novoRaw = String(hAPI.getCardValue(campo) || "").trim();

        var antigoComp;
        var novoComp;

        if (isCampoCheckboxAuditoria(campo)) {
            antigoComp = normalizarCheckboxAuditoria(antigoRaw);
            novoComp = normalizarCheckboxAuditoria(novoRaw);
            antigoRaw = antigoComp;
            novoRaw = novoComp;
        } else {
            // Compara apenas o conteúdo significativo (ignora máscara e descrição),
            // evitando "alterações" falsas quando o formulário só muda a
            // representação do mesmo valor (ex.: CNAE "4530703 — ..." vs "4530-7/03").
            antigoComp = normalizarValorAuditoria(campo, antigoRaw);
            novoComp = normalizarValorAuditoria(campo, novoRaw);
        }

        if (antigoComp != novoComp) {
            alteracoes.push(label + ": de '" + antigoRaw + "' para '" + novoRaw + "'");
        }
    }

    if (alteracoes.length == 0) {
        return "";
    }

    return "<br><br><b>Alterações realizadas:</b><br>• " + alteracoes.join("<br>• ");
}

// DEFINE A LISTA DE CAMPOS AUDITADOS PARA REGISTRAR ALTERAÇÕES NO HISTÓRICO E NO E-MAIL DE NOTIFICAÇÃO
function listaCamposAuditoria() {
    return [
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
        ["estado", "Estado"],

        // A seção "Dados Fiscais" (País, ICMS, IRRF, Simples, Regime, Natureza,
        // Grupo de Mercadoria, CNAE e Retenções) é preenchida SOMENTE na Validação.
        // Por isso NÃO entra na auditoria: nasce vazia no Início e apareceria
        // sempre como "alteração" (de '' para X) sem o validador ter editado nada.

        ["hiddenBanco1Condicao", "Condição de Pagamento (Conta 1)"],
        ["hiddenBanco1Cod", "Banco (Conta 1)"],
        ["hiddenBanco1Agencia", "Agência (Conta 1)"],
        ["hiddenBanco1Conta", "Conta (Conta 1)"],
        ["hiddenBanco2Condicao", "Condição de Pagamento (Conta 2)"],
        ["hiddenBanco2Cod", "Banco (Conta 2)"],
        ["hiddenBanco2Agencia", "Agência (Conta 2)"],
        ["hiddenBanco2Conta", "Conta (Conta 2)"],
        ["hiddenBanco3Condicao", "Condição de Pagamento (Conta 3)"],
        ["hiddenBanco3Cod", "Banco (Conta 3)"],
        ["hiddenBanco3Agencia", "Agência (Conta 3)"],
        ["hiddenBanco3Conta", "Conta (Conta 3)"],
        ["hiddenBanco4Condicao", "Condição de Pagamento (Conta 4)"],
        ["hiddenBanco4Cod", "Banco (Conta 4)"],
        ["hiddenBanco4Agencia", "Agência (Conta 4)"],
        ["hiddenBanco4Conta", "Conta (Conta 4)"],
        ["hiddenBanco5Condicao", "Condição de Pagamento (Conta 5)"],
        ["hiddenBanco5Cod", "Banco (Conta 5)"],
        ["hiddenBanco5Agencia", "Agência (Conta 5)"],
        ["hiddenBanco5Conta", "Conta (Conta 5)"],

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
}

// CAPTURA O SNAPSHOT DO CARD PARA AUDITORIA (JSON)
function capturarSnapshotCardParaAuditoria() {
    var campos = listaCamposAuditoria();
    var snap = {};
    for (var i = 0; i < campos.length; i++) {
        var id = campos[i][0];
        snap[id] = String(hAPI.getCardValue(id) || "");
    }
    return JSON.stringify(snap);
}

// NORMALIZA O VALOR DE UM CAMPO PARA COMPARAÇÃO NA AUDITORIA (IGNORA MÁSCARA/REPRESENTAÇÃO)
function normalizarValorAuditoria(campo, valor) {
    var v = String(valor || "").trim();
    if (!v) {
        return "";
    }
    // Normaliza CNAE e Natureza de Rendimentos comparando apenas os dígitos do código, sem descrição ou máscara.
    if (campo === "cnaePrincipal" ||
        campo.indexOf("CnaeSecundario") >= 0 ||
        campo === "naturezaRendimento" ||
        campo === "codNaturezaRendimento") {
        // Remove a descrição após o separador e mantém apenas os dígitos do código, ignorando a máscara.
        v = v.split(/\s[—–-]\s/)[0];
        return v.replace(/\D/g, "");
    }

    // Campos mascarados (documentos, CEP, telefones, bancos): compara só dígitos.
    var soDigitos = [
        "docCpf", "docCnpj", "docRg", "docInscricaoEstadual", "cep",
        "telefone", "telComercial", "celular",
        "hiddenBanco1Cod", "hiddenBanco1Agencia", "hiddenBanco1Conta",
        "hiddenBanco2Cod", "hiddenBanco2Agencia", "hiddenBanco2Conta",
        "hiddenBanco3Cod", "hiddenBanco3Agencia", "hiddenBanco3Conta",
        "hiddenBanco4Cod", "hiddenBanco4Agencia", "hiddenBanco4Conta",
        "hiddenBanco5Cod", "hiddenBanco5Agencia", "hiddenBanco5Conta"
    ];
    if (soDigitos.indexOf(campo) >= 0) {
        return v.replace(/\D/g, "");
    }

    return v;
}

// IDENTIFICA SE UM CAMPO É DO TIPO CHECKBOX PARA NORMALIZAR O VALOR NA AUDITORIA
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

// CONVERTE O VALOR DE UM CHECKBOX PARA "Sim" OU "Não" PARA COMPARAÇÃO NA AUDITORIA
function normalizarCheckboxAuditoria(valor) {
    var v = String(valor || "").toLowerCase().trim();

    if (v == "on" || v == "true" || v == "1" || v == "sim" || v == "s") {
        return "Sim";
    }

    return "Não";
}

// URL DO FLUIG PARA INCLUIR NOS E-MAILS (dsGetServerURL)
var _urlFluigCache = null;
function obterUrlFluig() {
    if (_urlFluigCache) { return _urlFluigCache; }
    var url = "http://fluig.castilho.com.br:1010";
    try {
        var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
        if (ds != null && ds.rowsCount > 0) {
            var achou = "";
            var candidatos = ["url", "URL", "serverURL", "SERVER_URL", "server_url"];
            for (var c = 0; c < candidatos.length && !achou; c++) {
                try {
                    var v = ds.getValue(0, candidatos[c]);
                    if (v && /^https?:\/\//i.test(String(v))) { achou = String(v).trim(); }
                } catch (eC) {}
            }
            if (!achou) { 
                try {
                    var cols = ds.getColumnsName();
                    for (var i = 0; i < cols.size() && !achou; i++) {
                        var val = ds.getValue(0, cols.get(i));
                        if (val && /^https?:\/\//i.test(String(val))) { achou = String(val).trim(); }
                    }
                } catch (eCols) {}
            }
            if (achou) { url = achou; }
        }
    } catch (e) {
        log.warn("[URL] Falha ao consultar dsGetServerURL, usando fallback: " + e);
    }
    _urlFluigCache = url;
    return url;
}

// NOTIFICA O SOLICITANTE POR E-MAIL QUANDO A VALIDAÇÃO ENVIA PARA CORREÇÃO, INFORMANDO O MOTIVO E O LINK PARA AJUSTES
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
        var link = obterUrlFluig() + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numProcesso;

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
