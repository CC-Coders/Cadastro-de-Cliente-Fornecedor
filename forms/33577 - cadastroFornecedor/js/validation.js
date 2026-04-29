const UPLOADS_POR_CATEGORIA = {
    pf: [
        "fileRgCpf",
        "fileComprovanteEndereco",
        "fileLaudoMedicoPcd",
        "fileDeclaracaoDependentesIrrf"
    ],
    pj: [
        "fileCartaoCnpj",
        "fileContratoSocial",
        "fileCodigoConduta",
        "filePoliticaAnticorrupcao",
        "fileConflitoInteresses",
        "fileCienciaLgpd"
    ]
};


function aplicarAsteriscoObrigatorio() {
    $("label .req").remove();

    $(".form-control, input, select, textarea").each(function() {
        const $campo = $(this);
        const isRequired = $campo.prop("required");

        if (!isRequired) return;

        const $label = $campo.closest(".fg").find("label").first();

        if (!$label.length) return;

        $label.append(' <span class="req">*</span>');
    });
}

function exibirErroCampo(campoId, mensagem) {
    const $campo = $("#" + campoId);
    const $container = $campo.closest(".fg");
    const mensagemId = "erro-" + campoId;

    limparErroCampo(campoId);

    $container.addClass("has-error");
    $campo.attr("aria-invalid", "true");

    $campo.after(
        '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
        mensagem +
        "</small>"
    );
}

function focusCampoComErro() {
    const $primeiroErro = $(".fg.has-error:visible")
        .first()
        .find("input, select, textarea")
        .first();

    if ($primeiroErro.length) {
        $primeiroErro.focus();
    }
}

function validarCampoObrigatorio(campoId, label) {
    const $campo = $("#" + campoId);

    if (!$campo.length) return true;

    const valor = ($campo.val() || "").trim();

    if (!$campo.is(":visible") || $campo.prop("readonly")) {
        return true;
    }

    if (!valor) {
        exibirErroCampo(campoId, "Campo '" + label + "' é obrigatório.");
        return false;
    }

    return true;
}

function validarDocumentosPorCategoria() {
    const categoria = ($("#categoria").val() || "").trim();

    const CAMPOS_DOCUMENTO_POR_CATEGORIA = {
        "Pessoa Física": [
            { id: "docCpf", label: "CPF" },
            { id: "docRg", label: "RG" }
        ],
        "Pessoa Jurídica": [
            { id: "docCnpj", label: "CNPJ" },
            { id: "docInscricaoEstadual", label: "Inscrição Estadual" }
        ]
    };

    const campos = CAMPOS_DOCUMENTO_POR_CATEGORIA[categoria] || [];

    return validarListaCampos(campos);
}

function limparUploadsCategoria(tipo) {
    const campos = UPLOADS_POR_CATEGORIA[tipo] || [];

    campos.forEach(function (campoId) {
        const $campo = $("#" + campoId);

        if (!$campo.length) {
            return;
        }

        const $area = $campo.closest(".fg").find(".upload-area").first();
        const areaId = $area.attr("id") || "";
        const sufixoCampo = campoId.replace("file", "");

        limparStatusUpload({
            inputId: campoId,
            areaId: areaId,
            sufixoCampo: sufixoCampo
        });

        limparErroCampo(campoId);
    });
}

function validarListaCampos(campos) {
    let valido = true;

    campos.forEach(campo => {
        if (!validarCampoObrigatorio(campo.id, campo.label)) {
            valido = false;
        }
    });

    return valido;
}

function validarPreCadastro() {
    limparErrosPreCadastro();

    const camposCliente = [{
            id: "classificacao",
            label: "Classificação"
        },
        {
            id: "categoria",
            label: "Categoria"
        },
        {
            id: "tipo",
            label: "Tipo"
        },
        {
            id: "classificacaoOperacional",
            label: "Classificação Operacional"
        }
    ];

    const camposEndereco = [{
            id: "razaoSocial",
            label: "Razão Social / Nome"
        },
        {
            id: "cep",
            label: "CEP"
        },
        {
            id: "endereco",
            label: "Endereço"
        },
        {
            id: "numero",
            label: "Número"
        },

        {
            id: "bairro",
            label: "Bairro"
        },
        {
            id: "cidade",
            label: "Cidade"
        },
        {
            id: "pais",
            label: "País"
        },
        {
            id: "estado",
            label: "Estado"
        }
    ];

    let valido = true;

    if (!validarListaCampos(camposCliente)) {
        valido = false;
    }

    if (!validarDocumentosPorCategoria()) {
        valido = false;
    }

    if (!validarListaCampos(camposEndereco)) {
        valido = false;
    }

    if (!valido) {
        FLUIGC.toast({
            title: "Atenção",
            message: "Preencha todos os campos obrigatórios para avançar.",
            type: "warning",
            timeout: 3000
        });

    }

    return valido;
}

function validarDadosCadastrais() {
    limparErrosDadosCadastrais();

    const camposFiscais = [{
            id: "icms",
            label: "Contribuinte ICMS"
        },
        {
            id: "irrf",
            label: "Alíquota IRRF"
        },
        {
            id: "simplesNacional",
            label: "Simples Nacional"
        },
        {
            id: "naturezaRendimento",
            label: "Natureza de Rendimentos"
        },
        {
            id: "regimeFiscal",
            label: "Regime Fiscal"
        },
        {
            id: "tipoDocEmitido",
            label: "Tipo de Documento Emitido"
        }
    ];

    const camposComerciais = [{
            id: "moeda",
            label: "Moeda do Pedido"
        },
        {
            id: "grupoMercadoria1",
            label: "Grupo de Mercadoria"
        },
        {
            id: "cnaePrincipal",
            label: "CNAE Principal"
        }
    ];

    const camposFinanceiros = [{
            id: "condicaoPagamento",
            label: "Condição de Pagamento"
        },
        {
            id: "banco",
            label: "Banco"
        },
        {
            id: "agencia",
            label: "Agência"
        },
        {
            id: "conta",
            label: "Conta"
        }
    ];

    const camposContato = [{
            id: "telefone",
            label: "Telefone"
        },

        {
            id: "emailNfe",
            label: "E-mail NFE"
        },
        {
            id: "emailAdministrativo",
            label: "E-mail Administrativo"
        }

    ];

    let valido = true;

    if (!validarListaCampos(camposFiscais)) valido = false;
    if (!validarListaCampos(camposComerciais)) valido = false;

    // REGRA ESPECIAL (retenção)
    if ($("#toggleRetencao").is(":checked")) {
        const algumSelecionado = [
            "#iss", "#inss", "#irrf", "#csll", "#pis", "#cofins"
        ].some(id => $(id).is(":checked"));

        if (!algumSelecionado) {
            FLUIGC.toast({
                title: "Atenção",
                message: "Selecione pelo menos um imposto para retenção.",
                type: "warning",
                timeout: 4000
            });

            valido = false;
        }
    }

    if (!validarListaCampos(camposFinanceiros)) valido = false;
    if (!validarListaCampos(camposContato)) valido = false;

    if (!valido) {
        FLUIGC.toast({
            title: "Atenção",
            message: "Preencha todos os campos obrigatórios dos Dados Cadastrais.",
            type: "warning",
            timeout: 5000
        });

    }

    return valido;
}

function mostrarPagina(indice) {
    $(".pagination-active").removeClass("pagination-active");
    const pagSelecionada = $(`.pagination[data-index="${indice}"]`);
    if (pagSelecionada.length) pagSelecionada.addClass("pagination-active");
    const pageId = pagSelecionada.length ? pagSelecionada.attr("data-id") : undefined;
    const paginasNodeList = document.querySelectorAll(".pagina");
    paginasNodeList.forEach(p => {
        p.classList.remove("ativa", "escondida-para-esquerda", "escondida-para-direita");
        p.style.position = "absolute";
    });
    if (pageId) {
        const paginaReal = document.getElementById(pageId);
        if (paginaReal) {
            paginaReal.classList.add("ativa");
            paginaReal.style.position = "relative";
            paginaReal.classList.remove("escondida-para-direita", "escondida-para-esquerda");
            $(window).scrollTop(0);
            return;
        }
    }
    const paginas = Array.from(paginasNodeList);
    if (paginas.length > 0 && indice >= 0 && indice < paginas.length) {
        paginas.forEach((p, i) => {
            if (i === indice) {
                p.classList.add("ativa");
                p.style.position = "relative";
            } 
            else if (i < indice) {
                p.classList.add("escondida-para-esquerda");
                p.style.position = "absolute";
            } 
            else {
                p.classList.add("escondida-para-direita");
                p.style.position = "absolute";
            }
        });
        $(window).scrollTop(0);
        return;
    }
    if (paginas.length > 0) {
        paginas[0].classList.add("ativa");
        paginas[0].style.position = "relative";
    }
    $(window).scrollTop(0);
}

function validarEtapaAtual() {
    const paginaAtual = getStepAtual();

    if (paginaAtual === 1) {
        return validarPreCadastro();
    }
    if (paginaAtual === 2) {
        return validarDadosCadastrais();
    }
    if (paginaAtual === 3) {
        return validarDocumentacao();
    }
    if (paginaAtual === 4) {
        return validarHistoricoDecisao();
    }

    return true;
}

function controlarDocumentacaoPorCategoria() {
    const categoria = ($("#categoria").val() || "").trim();

    const $containerDocs = $("#divAnexosDocumentos .grid");
    const $containerConf = $("#divConformidadeEtica .grid");

    $(".doc-pf, .doc-pj, .conformidade-pf, .conformidade-pj").hide();

    if (categoria === "Pessoa Física") {
        $(".doc-pf, .conformidade-pf").show();
        $(".doc-pj:not(.doc-pf), .conformidade-pj:not(.conformidade-pf)").hide();

        $containerDocs.addClass("grid-pf");
        $containerConf.addClass("grid-pf");

        limparUploadsCategoria("pj");
        $("#divFileComprovanteBanco").show();

        return;
    }

    if (categoria === "Pessoa Jurídica") {
        $(".doc-pj, .conformidade-pj").show();
        $(".doc-pf:not(.doc-pj), .conformidade-pf:not(.conformidade-pj)").hide();

        $containerDocs.removeClass("grid-pf");
        $containerConf.removeClass("grid-pf");

        limparUploadsCategoria("pf");
        $("#divFileComprovanteBanco").show();

        return;
    }

    $containerDocs.removeClass("grid-pf");
    $containerConf.removeClass("grid-pf");
}

function validarDocumentacao() {
    let valido = true;
    const categoria = ($("#categoria").val() || "").trim();

    if (!validarUploadObrigatorio("fileComprovanteBanco", "Comprovante Bancário")) {
        valido = false;
    }

    const tipo = categoria === "Pessoa Física" ? "pf" : "pj";
    const campos = UPLOADS_POR_CATEGORIA[tipo] || [];

    campos.forEach(campoId => {
        if (!validarUploadObrigatorio(campoId, campoId)) {
            valido = false;
        }
    });

    return valido;
}

function limparErroCampo(campoId) {
    const $campo = $("#" + campoId);
    const $container = $campo.closest(".fg");
    const mensagemId = "erro-" + campoId;

    $container.removeClass("has-error");
    $("#" + mensagemId).remove();

    $campo.attr("aria-invalid", "false");
}

function limparErrosPreCadastro() {
    const camposPreCadastro = [
        "classificacao",
        "categoria",
        "tipo",
        "classificacaoOperacional",
        "docCpf",
        "docCnpj",
        "docRg",
        "docInscricaoEstadual",
        "razaoSocial",
        "cep",
        "endereco",
        "numero",
        "bairro",
        "cidade",
        "pais",
        "estado"
    ];

    camposPreCadastro.forEach(function(campoId) {
        limparErroCampo(campoId);
    });
}

function limparErrosDadosCadastrais() {
    const camposDadosCadastrais = [
        "icms",
        "irrf",
        "simplesNacional",
        "naturezaRendimento",
        "regimeFiscal",
        "tipoDocEmitido",
        "moeda",
        "grupoMercadoria1",
        "cnaePrincipal",
        "condicaoPagamento",
        "banco",
        "agencia",
        "conta",
        "telefone",
        "telComercial",
        "celular",
        "emailNfe",
        "emailComercial",
        "emailCr",
        "emailJuridico"
    ];
    camposDadosCadastrais.forEach(function(campoId) {
        limparErroCampo(campoId);
    });
}

function aplicarStatusCampo(campoId, valido) {
    const $campo = $("#" + campoId);
    const $container = $campo.closest(".fg");

    $container.removeClass("has-error has-success");

    if (valido === true) {
        $container.addClass("has-success");
        limparErroCampo(campoId);
    }

    if (valido === false) {
        $container.addClass("has-error");
    }
}

function validarCPF(cpf) {
    cpf = cpf.replaceAll(/[^\d]+/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
        soma += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != Number.parseInt(cpf.substring(9, 10))) return false;

    soma = 0;

    for (let i = 1; i <= 10; i++) {
        soma += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;

    return resto == Number.parseInt(cpf.substring(10, 11));
}

function validarCNPJ(cnpj) {
    cnpj = cnpj.replaceAll(/[^\d]+/g, '');

    if (cnpj.length !== 14) return false;

    if (/^(\d)\1+$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);

    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);

    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    return resultado == digitos.charAt(1);
}
