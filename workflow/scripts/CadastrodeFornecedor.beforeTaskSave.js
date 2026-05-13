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
        } else if (decisao == "enviarRm") {
            acao = "Enviar ao RM";
        } else {
            acao = "Validação";
        }

        if (!observacao) {
            observacao = "Decisão registrada na etapa de validação.";
        }

        // Compara o snapshot tirado no início da Validação com os valores atuais.
        // Se o validador editou algum campo do solicitante, as diferenças aparecem no histórico.
        var alteracoes = montarAlteracoesEdicaoValidacao();

        if (alteracoes) {
            observacao += alteracoes;
        }

        adicionarHistorico(colleagueId, atividade, acao, observacao);

        // Limpa campos transitórios para não vazar para a próxima atividade.
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

    // Lista completa de campos auditáveis: [id do campo no card, rótulo legível].
    // Campos hidden (hiddenBancoNCod, hiddenCnaeSecundarioN etc.) são usados porque
    // são a fonte de verdade dos campos dinâmicos (ver Functions.js — sincronizarTabelaBancaria).
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

        ["hiddenBanco1Cod",     "Banco (Conta 1)"],
        ["hiddenBanco1Agencia", "Agência (Conta 1)"],
        ["hiddenBanco1Conta",   "Conta (Conta 1)"],
        ["hiddenBanco2Cod",      "Banco (Conta 2)"],
        ["hiddenBanco2Agencia",  "Agência (Conta 2)"],
        ["hiddenBanco2Conta",    "Conta (Conta 2)"],
        ["hiddenBanco3Cod",      "Banco (Conta 3)"],
        ["hiddenBanco3Agencia",  "Agência (Conta 3)"],
        ["hiddenBanco3Conta",    "Conta (Conta 3)"],
        ["hiddenBanco4Cod",      "Banco (Conta 4)"],
        ["hiddenBanco4Agencia",  "Agência (Conta 4)"],
        ["hiddenBanco4Conta",    "Conta (Conta 4)"],
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

        // Campos de checkbox armazenam valores variados ("on", "true", "1", "Sim" etc.).
        // Normaliza para "Sim"/"Não" antes de comparar para evitar falsos-positivos.
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

// Retorna true para os campos cujo valor é booleano/checkbox.
// Esses campos precisam de normalização antes da comparação de auditoria.
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

// Converte qualquer representação booleana para "Sim" ou "Não".
// Necessário porque o Fluig persiste checkboxes como "on", "true", "1" ou string vazia.
function normalizarCheckboxAuditoria(valor) {
    var v = String(valor || "").toLowerCase().trim();

    if (v == "on" || v == "true" || v == "1" || v == "sim" || v == "s") {
        return "Sim";
    }

    return "Não";
}
