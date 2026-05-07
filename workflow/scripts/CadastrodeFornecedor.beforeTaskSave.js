function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    var atividadeAtual = Number(getValue("WKNumState"));
    var completTask = getValue("WKCompletTask") == "true";

    if (!completTask) {
        return;
    }

    if (atividadeAtual == 0 || atividadeAtual == 4) {
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
        } else if (decisao == "envioRM") {
            acao = "Enviar ao RM";
        } else {
            acao = "Validação";
        }

        if (!observacao) {
            observacao = "Decisão registrada na etapa de validação.";
        }

        var alteracoes = montarAlteracoesEdicaoValidacao();

        if (alteracoes) {
            observacao += alteracoes;
        }

        adicionarHistorico(colleagueId, atividade, acao, observacao);

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

function adicionarHistorico(usuario, atividade, acao, observacao) {
    hAPI.addCardChild("tableHistorico", {
        tableHistoricoUsuario: usuario,
        tableHistoricoData: new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()),
        tableHistoricoAtividade: atividade,
        tableHistoricoObservacao: observacao,
        tableHistoricoAcao: acao
    });
}

function anexarDocumentosNoProcesso() {
    var camposDocumentos = [
        "anxCartaoCnpjId",
        "anxCompBancoId",
        "anxContratoId",
        "anxRgCpfId",
        "anxCompEnderecoId",
        "anxLaudoPcdId",
        "anxDependentesId",
        "anxCodCondutaId",
        "anxAntiCorrupcaoId",
        "anxConflitoId",
        "anxLgpdId"
    ];

    for (var i = 0; i < camposDocumentos.length; i++) {
        var campo = camposDocumentos[i];
        var documentId = hAPI.getCardValue(campo);

        log.info("Campo anexo: " + campo + " | documentId: " + documentId);

        if (documentId && String(documentId).trim() !== "" && !isNaN(documentId)) {
            anexaDocumentoNoProcesso(documentId);
        }
    }
}

function anexaDocumentoNoProcesso(documentId) {
    documentId = Number(documentId);

    var attachments = hAPI.listAttachments();
    var jaAnexado = false;

    for (var i = 0; i < attachments.size(); i++) {
        var anexoId = Number(attachments.get(i).getDocumentId());

        if (documentId === anexoId) {
            jaAnexado = true;
            break;
        }
    }

    if (!jaAnexado) {
        log.info("Anexando documento no processo: " + documentId);
        hAPI.attachDocument(documentId);
    } else {
        log.info("Documento já estava anexado: " + documentId);
    }
}

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
        ["irrf", "Alíquota IRRF"],
        ["simplesNacional", "Simples Nacional"],
        ["naturezaRendimento", "Natureza de Rendimentos"],
        ["regimeFiscal", "Regime Fiscal"],
        ["tipoDocEmitido", "Tipo de Documento Emitido"],

        ["moeda", "Moeda do Pedido"],
        ["grupoMercadoria1", "Grupo de Mercadoria 1"],
        ["hiddenGrupoMercadoria2", "Grupo de Mercadoria 2"],
        ["hiddenGrupoMercadoria3", "Grupo de Mercadoria 3"],
        ["hiddenGrupoMercadoria4", "Grupo de Mercadoria 4"],
        ["hiddenGrupoMercadoria5", "Grupo de Mercadoria 5"],

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

        ["condicaoPagamento", "Condição de Pagamento"],
        ["banco", "Banco"],
        ["agencia", "Agência"],
        ["conta", "Conta"],

        ["telefone", "Telefone"],
        ["telComercial", "Telefone Comercial"],
        ["celular", "Celular"],
        ["emailAdministrativo", "E-mail Administrativo"],
        ["emailComercial", "E-mail Comercial"],
        ["emailCr", "E-mail Financeiro / Contabilidade"],
        ["site", "Site"],

        ["anxCartaoCnpj", "Anexo Cartão CNPJ"],
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