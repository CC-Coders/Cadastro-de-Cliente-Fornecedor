// CARGA INICIAL
function bindEventos() {
    $("#tipo").on("change", controlarRetencaoPorTipo);
    $(document).on("input change", ".form-control[required]", function() {
        const id = this.id;

        if (["docCpf", "docCnpj"].includes(id)) {
            return;
        }
        
        const valor = ($(this).val() || "").toString().trim();

        if (!valor) {
            return;
        }

        limparErroCampo(id);
    });

    $("#categoria").on("change", function() {
        controlarCamposCategoria();
        controlarAlertaCnpj();
        controlarDocumentacaoPorCategoria();
        aplicarAsteriscoObrigatorio();
        limparErroCampo("categoria");
    });

    $("#docCnpj").on("input", function() {
        const valor = this.value;
        const numeros = valor.replaceAll(/\D/g, "");

        if (!valor) {
            limparErroCampo("docCnpj");
            aplicarStatusCampo("docCnpj", null);
            return;
        }

        if (numeros.length < 14) {
            limparErroCampo("docCnpj");
            aplicarStatusCampo("docCnpj", null);
            return;
        }

        if (validarCNPJ(valor)) {
            aplicarStatusCampo("docCnpj", true);
            return;
        }

        exibirErroCampo("docCnpj", "CNPJ inválido.");
        aplicarStatusCampo("docCnpj", false);
    });

    $("#docCpf").on("input", function() {
        const valor = this.value;
        const numeros = valor.replaceAll(/\D/g, "");

        if (!valor) {
            limparErroCampo("docCpf");
            aplicarStatusCampo("docCpf", null);
            return;
        }

        if (numeros.length < 11) {
            limparErroCampo("docCpf");
            aplicarStatusCampo("docCpf", null);
            return;
        }

        if (validarCPF(valor)) {
            aplicarStatusCampo("docCpf", true);
            return;
        }

        exibirErroCampo("docCpf", "CPF inválido.");
        aplicarStatusCampo("docCpf", false);
    });

    $("#docCnpj").on("blur keyup", controlarAlertaCnpj);

    $("#cep").on("blur", function() {
        const cep = $(this).val().replaceAll(/\D/g, "");

        if (cep.length !== 8) {
            limpaCamposEndereco();
            return;
        }

        buscarCep(cep);
    });

    $("#toggleRetencao").on("change", controlarPainelRetencoes);

    $(".retencao-item input").on("change", function() {
        $(this).closest(".retencao-item").toggleClass("ativo", this.checked);
    });

    $(document).on("click", "#btn-add-cnae", function() {
        adicionarCnae();
    });

    $(document).on("click", ".btn-remove-cnae", function() {
        $(this).closest(".cnae-secundario-item").remove();
        reordenarCnaesSecundarios();
        controlarBotaoAdicionarCnae();
    });

    $(document).on("input", ".cnae-secundario", function() {
        aplicarMascaraCnae($(this));
    });

    $(document).on("click", "#btn-add-grupo-mercadoria", function() {
        adicionarGrupoMercadoria();
    });

    $(document).on("click", ".btn-remove-grupo-mercadoria", function() {
        $(this).closest(".grupo-mercadoria-item").remove();
        reordenarGruposMercadoria();
        controlarBotaoAdicionarGrupoMercadoria();
    });

    $(document).off("click", ".upload-file-remove").on("click", ".upload-file-remove", function(e) {
        e.preventDefault();
        e.stopPropagation();

        const $botao = $(this);

        limparStatusUpload({
            inputId: $botao.data("input-id"),
            sufixoCampo: $botao.data("sufixo"),
            areaId: $botao.data("area-id")
        });
    });
}
function inicializarTela() {
    $(".section-body").show();
    goToStep(1, false);

    $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual").hide();
    $("#endereco, #bairro, #cidade, #estado").prop("readonly", true);
}
function sincronizarEstadoInicial() {
    $("#toggleRetencao").trigger("change");
    controlarCamposCategoria();
    controlarAlertaCnpj();
    controlarRetencaoPorTipo();
    controlarDocumentacaoPorCategoria();
    controlarBotaoAdicionarCnae();
    controlarBotaoAdicionarGrupoMercadoria();
    atualizarSetas();
    atualizarLayoutStepper();
}
function atualizarLayoutStepper() {
  const historicoVisivel = $("#nav-step-HistoricoDecisao").is(":visible");

  $(".stepper").toggleClass("stepper-4", historicoVisivel);
  $(".stepper").toggleClass("stepper-3", !historicoVisivel);
}


// VALIDAÇÃO DOS CAMPOS
function aplicarAsteriscoObrigatorio() {
    $(".req").remove(); // limpa todos antes

    $(".form-control, input, select, textarea").each(function() {
        const $campo = $(this);
        const isRequired = $campo.prop("required");

        if (!isRequired) return;

        const $label = $("label[for='" + $campo.attr("id") + "']");

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
    const valor = ($("#" + campoId).val() || "").trim();

    if (!valor) {
        exibirErroCampo(campoId, "Campo '" + label + "' é obrigatório.");
        return false;
    }

    return true;
}
function validarDocumentosPorCategoria() {
    let valido = true;
    const categoria = ($("#categoria").val() || "").trim();

    if (categoria === "Pessoa Física") {
        if (!validarCampoObrigatorio("docCpf", "CPF")) {
            valido = false;
        }

        if (!validarCampoObrigatorio("docRg", "RG")) {
            valido = false;
        }
    }

    if (categoria === "Pessoa Jurídica") {
        if (!validarCampoObrigatorio("docCnpj", "CNPJ")) {
            valido = false;
        }

        if (!validarCampoObrigatorio("docInscricaoEstadual", "Inscrição Estadual")) {
            valido = false;
        }
    }

    return valido;
}
function controlarDocumentacaoPorCategoria() {
    const categoria = ($("#categoria").val() || "").trim();

    const $containerDocs = $("#divAnexosDocumentos .grid");
    const $containerConf = $("#divConformidadeEtica .grid");

    $(".doc-pf, .conformidade-pf").hide();
    $(".doc-pj, .conformidade-pj").hide();

    if (categoria === "Pessoa Física") {
        $(".doc-pf, .conformidade-pf").show();

        $containerDocs.addClass("grid-pf");
        $containerConf.addClass("grid-pf");

        limparUploadsCategoria("pj");
        return;
    }

    if (categoria === "Pessoa Jurídica") {
        $(".doc-pj, .conformidade-pj").show();

        $containerDocs.removeClass("grid-pf");
        $containerConf.removeClass("grid-pf");

        limparUploadsCategoria("pf");
    }
}
function limparUploadsCategoria(tipo) {
    const camposPf = [
        "fileRgCpf",
        "fileComprovanteEndereco",
        "fileLaudoMedicoPcd",
        "fileDeclaracaoDependentesIrrf"
    ];

    const camposPj = [
        "fileCartaoCnpj",
        "fileContratoSocial",
        "fileCodigoConduta",
        "filePoliticaAnticorrupcao",
        "fileConflitoInteresses",
        "fileCienciaLgpd"
    ];

    const campos = tipo === "pf" ? camposPf : camposPj;

    campos.forEach(function(campoId) {
        const $area = $("#" + campoId).closest(".fg").find(".upload-area").first();
        const areaId = $area.attr("id") || "";
        const sufixo = campoId.replace("file", "");

        limparStatusUpload({
            inputId: campoId,
            areaId: areaId,
            sufixoCampo: sufixo
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
            id: "telFinanceiro",
            label: "Telefone Financeiro"
        },
        {
            id: "telComercial",
            label: "Telefone Comercial"
        },
        {
            id: "celular",
            label: "Celular"
        },
        {
            id: "emailNfe",
            label: "E-mail NFE"
        },
        {
            id: "emailComercial",
            label: "E-mail Comercial"
        },
        {
            id: "emailCr",
            label: "E-mail Contas a Receber"
        },
        {
            id: "emailJuridico",
            label: "E-mail Jurídico"
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
        "telFinanceiro",
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


// PAGINAÇÃO
function getStepsVisiveis() {
    return Object.keys(NAV_MAP)
        .map(Number)
        .filter(function(step) {
            return $(NAV_MAP[step]).is(":visible");
        });
}
function getStepAtual() {
    let stepAtual = 1;

    Object.keys(NAV_MAP).forEach(function(step) {
        if ($(NAV_MAP[step]).hasClass("active")) {
            stepAtual = Number.parseInt(step, 10);
        }
    });

    return stepAtual;
}
function goToStep(step, animar) {
    if (animar === undefined) {
        animar = true;
    }

    $(".step-panel").removeClass("active");

    if (animar) {
        $(".step-panel").hide(500);
        $(PANEL_MAP[step]).addClass("active").show(500);
    } else {
        $(".step-panel").hide();
        $(PANEL_MAP[step]).addClass("active").show();
    }

    $(".step-item").removeClass("active done");

    getStepsVisiveis().forEach(function(itemStep) {
        if (itemStep < step) {
            $(NAV_MAP[itemStep]).addClass("done");
        } else if (itemStep === step) {
            $(NAV_MAP[itemStep]).addClass("active");
        }
    });

    atualizarSetas();
}
function goToNextVisibleStep() {
    if (!validarEtapaAtual()) {
        return;
    }

    const steps = getStepsVisiveis();
    const atual = getStepAtual();
    const index = steps.indexOf(atual);

    if (index < steps.length - 1) {
        goToStep(steps[index + 1]);
    }
}
function goToPrevVisibleStep() {
    const steps = getStepsVisiveis();
    const atual = getStepAtual();
    const index = steps.indexOf(atual);

    if (index > 0) {
        goToStep(steps[index - 1]);
    }
}
function atualizarSetas() {
    const steps = getStepsVisiveis();
    const atual = getStepAtual();
    const index = steps.indexOf(atual);

    $("#btn-voltar").prop("disabled", index === 0);
    $("#btnNextStep").prop("disabled", index === steps.length - 1);
}
function toggleSection(el) {
    const $head = $(el);
    const $body = $head.next(".section-body, .panel-body");
    const $arrow = $head.find(".section-arrow, .glyphicon");

    $head.toggleClass("open");
    $body.slideToggle(200);

    if ($arrow.hasClass("glyphicon")) {
        $arrow.toggleClass("glyphicon-chevron-down glyphicon-chevron-up");
    } else {
        $arrow.toggleClass("open");
    }
}


// EXIBIÇÃO CONDICIONAL DE CAMPOS
function controlarCamposCategoria() {
    const categoria = $("#categoria").val();

    $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual").hide();
    $("#docCpf, #docCnpj, #docRg, #docInscricaoEstadual").prop("required", false);

    if (categoria === "Pessoa Física") {
        $("#divCpf, #divRg").show();
        $("#docCpf, #docRg").prop("required", true);
        aplicarAsteriscoObrigatorio();
        return;
    }

    if (categoria === "Pessoa Jurídica") {
        $("#divCnpj, #divInscricaoEstadual").show();
        $("#docCnpj, #docInscricaoEstadual").prop("required", true);
    }

    aplicarAsteriscoObrigatorio();
}
function controlarAlertaCnpj() {
    const categoria = $("#categoria").val();
    const cnpj = ($("#docCnpj").val() || "").replaceAll(/\D/g, "");

    if (categoria === "Pessoa Jurídica" && cnpj.length < 14) {
        $("#alertCnpj").show();
    } else {
        $("#alertCnpj").hide();
    }

    if (categoria === "Pessoa Física") {
        $("#alertCPF").show();
    } else {
        $("#alertCPF").hide();
    }
}
function controlarRetencaoPorTipo() {
    const tipo = $("#tipo").val();

    if (TIPOS_COM_RETENCAO.includes(tipo)) {
        $("#divToggleRetencao").show();
        return;
    }

    $("#divToggleRetencao").hide();
    resetarRetencao();
}


// API DE CEP
function buscarCep(cep) {
    $.ajax({
        url: "https://viacep.com.br/ws/" + cep + "/json/",
        method: "GET",
        dataType: "json",
        success: function(data) {
            if (data.erro) {
                FLUIGC.toast({
                    message: "CEP não encontrado.",
                    type: "danger"
                });

                limpaCamposEndereco();
                return;
            }

            preencherEndereco(data);
        },
        error: function() {
            FLUIGC.toast({
                message: "Erro ao buscar CEP.",
                type: "danger"
            });

            limpaCamposEndereco();
        }
    });
}
function preencherEndereco(data) {
    $("#endereco").val(data.logradouro || "");
    $("#bairro").val(data.bairro || "");
    $("#cidade").val(data.localidade || "");
    $("#estado").val(data.uf || "");
    $("#pais").val("Brasil");

    limparErroCampo("cep");
    limparErroCampo("endereco");
    limparErroCampo("bairro");
    limparErroCampo("cidade");
    limparErroCampo("estado");
    limparErroCampo("pais");

    $("#numero").focus();
}
function limpaCamposEndereco() {
    $("#endereco").val("");
    $("#bairro").val("");
    $("#cidade").val("");
    $("#estado").val("");
    $("#pais").val("");
    $("#numero").val("");
}


// GRUPO DE MERCADORIA 
function obterOpcoesGrupoMercadoria() {
    const opcoesHtml = OPCOES_GRUPO_MERCADORIA.map(function(opcao) {
        return `<option value="${opcao}">${opcao}</option>`;
    }).join("");

    return `<option value="">Selecione...</option>${opcoesHtml}`;
}
function adicionarGrupoMercadoria() {
    const $wrap = $("#grupo-mercadoria-wrap");
    const quantidadeTotal = 1 + $wrap.find(".grupo-mercadoria-item").length;

    if (quantidadeTotal >= LIMITE_GRUPO_MERCADORIA) {
        FLUIGC.toast({
            title: "Atenção",
            message: "Você pode adicionar no máximo 5 grupos de mercadoria.",
            type: "warning"
        });
        return;
    }
    const numero = quantidadeTotal + 1;
    const html = `
    <div class="grid g3 grupo-mercadoria-item" id="grupo-mercadoria-item-${numero}">
      <div class="fg span2">
        <label for="grupoMercadoria${numero}">Grupo de Mercadoria ${numero}</label>
        <div class="select-wrap">
          <select
            id="grupoMercadoria${numero}"
            name="grupoMercadoria${numero}"
            class="form-control grupo-mercadoria"
          >
            ${obterOpcoesGrupoMercadoria()}
          </select>
        </div>
      </div>

      <div class="fg" style="align-self:flex-end;">
        <button type="button" class="btn btn-danger btn-remove-grupo-mercadoria">
          Remover
        </button>
      </div>
    </div>
  `;
    $wrap.append(html);
    controlarBotaoAdicionarGrupoMercadoria();
}
function reordenarGruposMercadoria() {
    // index + 2 porque o item fixo do HTML é o "Grupo de Mercadoria 1"
    $("#grupo-mercadoria-wrap .grupo-mercadoria-item").each(function(index) {
        const numero = index + 2;

        $(this).attr("id", "grupo-mercadoria-item-" + numero);

        $(this).find("label")
            .attr("for", "grupoMercadoria" + numero)
            .text("Grupo de Mercadoria " + numero);

        $(this).find("select")
            .attr("id", "grupoMercadoria" + numero)
            .attr("name", "grupoMercadoria" + numero);
    });
}
function controlarBotaoAdicionarGrupoMercadoria() {
    const quantidadeTotal = 1 + $("#grupo-mercadoria-wrap .grupo-mercadoria-item").length;
    const $botao = $("#btn-add-grupo-mercadoria");

    if (quantidadeTotal >= LIMITE_GRUPO_MERCADORIA) {
        $botao.prop("disabled", true).addClass("disabled");
    } else {
        $botao.prop("disabled", false).removeClass("disabled");
    }
}

// MASCARAS
function inicializarMascaras() {
    $("#docCpf").mask("000.000.000-00");
    $("#docCnpj").mask("00.000.000/0000-00");
    $("#docRg").mask("00.000.000-0");
    $("#docInscricaoEstadual").mask("00000000000000");
    $("#cep").mask("00000-000");
    $("#numero").mask("000000");
    $("#telFinanceiro, #telComercial, #celular").on("input", function () {
      const valor = $(this).val().replaceAll(/\D/g, "");

      if (valor.length <= 11) {
        $(this).mask("(00) 00000-0000");
      } 
    });
    $("#cnaePrincipal").on("input", function () {
      aplicarMascaraCnae($(this));
    });

    inicializarMascarasBancarias();
}
function aplicarMascaraCnae($campo) {
    let valor = $campo.val().replaceAll(/\D/g, "");

    if (valor.length > 7) {
        valor = valor.substring(0, 7);
    }

    if (valor.length > 5) {
        valor = valor.replace(/^(\d{4})(\d)(\d{0,2})$/, "$1-$2/$3");
    } else if (valor.length > 4) {
        valor = valor.replace(/^(\d{4})(\d?)$/, "$1-$2");
    }

    $campo.val(valor);
}
function inicializarMascarasBancarias() {
  $("#agencia").on("input", function () {
    let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 5);

    if (valor.length > 4) {
      valor = valor.replace(/^(\d{4})(\d)$/, "$1-$2");
    }

    $(this).val(valor);
    atualizarCamposBancariosRm();
  });

  $("#conta").on("input", function () {
    let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 12);

    if (valor.length > 1) {
      valor = valor.replace(/(\d+)(\d)$/, "$1-$2");
    }

    $(this).val(valor);
    atualizarCamposBancariosRm();
  });
}
function atualizarCamposBancariosRm() {
  $("#agenciaRm").val(($("#agencia").val() || "").replaceAll(/\D/g, ""));
  $("#contaRm").val(($("#conta").val() || "").replaceAll(/\D/g, ""));
}


// CNAE 
function adicionarCnae() {
    const $wrap = $("#cnae-secundarios-wrap");
    const quantidadeAtual = $wrap.find(".cnae-secundario-item").length;

    if (quantidadeAtual >= LIMITE_CNAE_SECUNDARIO) {
        FLUIGC.toast({
            title: "Atenção",
            message: "Você pode adicionar no máximo 5 CNAEs secundários.",
            type: "warning"
        });
        return;
    }

    const numero = quantidadeAtual + 1;
    const html = `
    <div class="grid g3 cnae-secundario-item" id="cnae-secundario-${numero}" style="margin-bottom:12px;">
      <div class="fg span2">
        <label for="cnaeSecundario${numero}">CNAE Secundário ${numero}</label>
        <input type="text" id="cnaeSecundario${numero}" name="cnaeSecundario${numero}" placeholder="0000-0/00" maxlength="9" class="cnae-secundario form-control">
      </div>
      <div class="fg" style="align-self:flex-end;">
        <button type="button" class="btn btn-danger btn-remove-cnae">
          Remover
        </button>
      </div>
    </div>
  `;
    $wrap.append(html);
    controlarBotaoAdicionarCnae();
}
function reordenarCnaesSecundarios() {
    $("#cnae-secundarios-wrap .cnae-secundario-item").each(function(index) {
        const numero = index + 1;

        $(this).attr("id", "cnae-secundario-" + numero);
        $(this).find("label")
            .attr("for", "cnaeSecundario" + numero)
            .text("CNAE Secundário " + numero);
        $(this).find("input")
            .attr("id", "cnaeSecundario" + numero)
            .attr("name", "cnaeSecundario" + numero);
    });
}
function controlarBotaoAdicionarCnae() {
    const quantidadeAtual = $("#cnae-secundarios-wrap .cnae-secundario-item").length;
    const $botao = $("#btn-add-cnae");

    if (quantidadeAtual >= LIMITE_CNAE_SECUNDARIO) {
        $botao.prop("disabled", true).addClass("disabled");
    } else {
        $botao.prop("disabled", false).removeClass("disabled");
    }
}


// RETENÇÕES DE IMPOSTOS
function controlarPainelRetencoes() {
    if ($(this).is(":checked")) {
        $("#divRetencoesPanel").removeClass("field-hidden");
    } else {
        $("#divRetencoesPanel").addClass("field-hidden");
    }
}
function resetarRetencao() {
    $("#toggleRetencao").prop("checked", false);
    $("#divRetencoesPanel").addClass("field-hidden");
    $(".retencao-item input").prop("checked", false);
    $(".retencao-item").removeClass("ativo");
}


// ANEXOS
function inicializarUploadsFluig() {
    $(".upload-area").each(function() {
        const $area = $(this);
        const inputId = $area.data("upload-id");
        const $input = $("#" + inputId);

        if (!$input.length) {
            return;
        }

        $area.off("click").on("click", function(e) {
            if ($(e.target).closest(".upload-file-remove").length) {
                return;
            }

            e.preventDefault();
            $input[0].click();
        });

      $input.off("change").on("change", function () {
        if (this.files && this.files.length > 0) {
          atualizarVisualUpload(this.id, $area);
          marcarUploadSucesso(this.id);
        }
      });
    });
}
function atualizarVisualUpload(inputId, $area) {
    const input = document.getElementById(inputId);

    if (!input?.files?.length) {
        return;
    }

    const arquivo = input.files[0];
    const meta = obterMetaUpload(inputId, $area);

    $area.addClass("uploaded");

    if (meta.statusId) {
        $("#" + meta.statusId).show(500);
    }

    if (meta.nomeId) {
        $("#" + meta.nomeId).text(arquivo.name);
    }

    FLUIGC.toast({
        title: "OK",
        message: "Arquivo pronto para envio.",
        type: "success"
    });
}
function obterMetaUpload(inputId, $area) {
    const areaId = $area.attr("id") || "";
    let sufixoCampo = "";

    if (areaId.indexOf("upload") === 0) {
        sufixoCampo = areaId.replace("upload", "");
    } else if (inputId.indexOf("file") === 0) {
        sufixoCampo = inputId.replace("file", "");
    }

    return {
        areaId: areaId,
        inputId: inputId,
        sufixoCampo: sufixoCampo,
        statusId: sufixoCampo ? "statusFile" + sufixoCampo : "",
        nomeId: sufixoCampo ? "nomeFile" + sufixoCampo : ""
    };
}
function limparStatusUpload(config) {
    const inputId = config?.inputId ? config.inputId : "";
    const sufixoCampo = config?.sufixoCampo ? config.sufixoCampo : "";
    const areaId = config?.areaId ? config.areaId : "";

    if (areaId) {
        $("#" + areaId).removeClass("uploaded");
    }

    if (sufixoCampo) {
        $("#statusFile" + sufixoCampo).hide(500);
        $("#nomeFile" + sufixoCampo).text("");
    }

    if (inputId) {
        $("#" + inputId).val("");
    }
}
function exibirErroUpload(campoId, mensagem) {
    const $campo = $("#" + campoId);
    const $container = $campo.closest(".fg");
    const mensagemId = "erro-" + campoId;

    limparErroCampo(campoId);

    $container.addClass("has-error");
    $campo.attr("aria-invalid", "true");

    const $areaUpload = $container.find(".upload-area").first();

    if ($areaUpload.length) {
        $areaUpload.after(
            '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
            mensagem +
            "</small>"
        );
    } else {
        $campo.after(
            '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
            mensagem +
            "</small>"
        );
    }
}
function validarUploadObrigatorio(campoId, label) {
  const input = document.getElementById(campoId);

  if (!input?.files || input.files.length === 0) {
    marcarUploadErro(campoId, "Anexo '" + label + "' é obrigatório.");
    return false;
  }

  marcarUploadSucesso(campoId);
  return true;
}
function obterCamposDocumentacaoObrigatorios() {
    const categoria = ($("#categoria").val() || "").trim();

    if (categoria === "Pessoa Física") {
        return [{
                id: "fileRgCpf",
                label: "RG / CPF"
            },
            {
                id: "fileComprovanteBanco",
                label: "Comprovante Bancário"
            },
            {
                id: "fileComprovanteEndereco",
                label: "Comprovante de Endereço"
            },
            {
                id: "fileLaudoMedicoPcd",
                label: "Laudo Médico para Isenção de Impostos (PCD)"
            },
            {
                id: "fileDeclaracaoDependentesIrrf",
                label: "Declaração de Dependentes para IRRF"
            }
        ];
    }

    if (categoria === "Pessoa Jurídica") {
        return [{
                id: "fileCartaoCnpj",
                label: "Cartão CNPJ"
            },
            {
                id: "fileComprovanteBanco",
                label: "Comprovante Bancário"
            },
            {
                id: "fileContratoSocial",
                label: "Contrato Social"
            },
            {
                id: "fileCodigoConduta",
                label: "Código de Conduta"
            },
            {
                id: "filePoliticaAnticorrupcao",
                label: "Política Anticorrupção"
            },
            {
                id: "fileConflitoInteresses",
                label: "Conflito de Interesses"
            },
            {
                id: "fileCienciaLgpd",
                label: "Ciência sobre LGPD"
            }
        ];
    }

    return [];
}
function marcarUploadErro(campoId, mensagem) {
  const $campo = $("#" + campoId);
  const $container = $campo.closest(".fg");
  const $area = $container.find(".upload-area").first();
  const mensagemId = "erro-" + campoId;

  limparErroCampo(campoId);

  $container.addClass("has-error");
  $area.addClass("upload-error").removeClass("uploaded");

  $area.after(
    '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
      mensagem +
    "</small>"
  );
}
function marcarUploadSucesso(campoId) {
  const $campo = $("#" + campoId);
  const $container = $campo.closest(".fg");
  const $area = $container.find(".upload-area").first();

  limparErroCampo(campoId);

  $container.removeClass("has-error");
  $area.removeClass("upload-error").addClass("uploaded");
}
function validarDocumentacao() {
  let valido = true;
  const campos = obterCamposDocumentacaoObrigatorios();

  limparErrosDocumentacao();

  campos.forEach(function (campo) {
    if (!validarUploadObrigatorio(campo.id, campo.label)) {
      valido = false;
    }
  });

  if (!valido) {
    FLUIGC.toast({
      title: "Atenção",
      message: "Anexe todos os documentos obrigatórios para avançar.",
      type: "warning",
      timeout: 5000
    });

    focusCampoComErro();
  }

  return valido;
}
function limparErrosDocumentacao() {
    const camposDocumentacao = [
        "fileCartaoCnpj",
        "fileComprovanteBanco",
        "fileContratoSocial",
        "fileCodigoConduta",
        "filePoliticaAnticorrupcao",
        "fileConflitoInteresses",
        "fileCienciaLgpd",
        "fileRgCpf",
        "fileComprovanteEndereco",
        "fileLaudoMedicoPcd",
        "fileDeclaracaoDependentesIrrf"
    ];

    camposDocumentacao.forEach(function(campoId) {
        limparErroCampo(campoId);
    });
}

// HISTORICO E DECISÃO
async function asyncMontaHistorico() {
    $("#divLinhasHistorico").empty();

    var linhasHistorico = getLinhasHistorico();
    linhasHistorico = linhasHistorico.reverse();

    for (const linha of linhasHistorico) {
        var html = geraHtmlHistorico(linha);

        $("#divLinhasHistorico").append(html);

        try {
            $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
        } catch (erro) {
            console.warn("Não foi possível carregar imagem do usuário:", linha.USUARIO, erro);
        }
    }
}
function getLinhasHistorico() {
    var retorno = [];
    $("#tableHistorico tbody tr").each(function () {
        const usuario = $(this).find(".tableHistoricoUsuario").val();
        // ignora linha vazia
        if (!usuario) return;

        retorno.push({
            USUARIO: usuario,
            DATA: $(this).find(".tableHistoricoData").val(),
            OBSERVACAO: $(this).find(".tableHistoricoObservacao").val(),
            ACAO: $(this).find(".tableHistoricoAcao").val(),
            ATIVIDADE: $(this).find(".tableHistoricoAtividade").val()
        });
    });
    return retorno;
}
function geraHtmlHistorico(linha) {
    var DATA = linha.DATA ? linha.DATA.split(" ") : ["", ""];
    const textoObs = (linha.OBSERVACAO || "").replace(/^(<br\s*\/?>|\s)*/gi, "").trim();

    if (DATA[0]) {
        DATA = DATA[0].split("-").reverse().join("/") + " " + (DATA[1] || "");
    } else {
        DATA = "";
    }

    const nomeUsuario = linha.USUARIO || "Usuário não identificado";

    var html = `
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body" style="${linha.ACAO == "Aprovado" ? "border:solid 1px green;" : linha.ACAO == "Reprovado" ? "border:solid 1px red;" : "border:solid 1px #ddd;"}">
                <div style="display:flex; align-items:flex-start;">
                    <div class="divImageUser" style="margin-right:20px;"></div>
                    <div>
                        <h3 class="card-title" style="margin-bottom:0px; color:black;">
                            ${nomeUsuario} <small>${linha.ATIVIDADE || ""}</small>
                        </h3>
                        <small>${DATA}</small>
                        <p class="card-text">${textoObs ? textoObs : (linha.ACAO || "")}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    return html;
}
function promiseBuscaImagemUsuario(usuario) {
return fetch("/api/public/social/image/" + usuario)
    .then(res => res.blob())
    .then(blob => {
        const img = new Image();
        img.width = 60;
        img.height = 60;
        img.src = URL.createObjectURL(blob);
        img.classList.add("userImage");
        return img;
    });
}
function controlarStepperHistorico() {
  const possuiHistorico = getLinhasHistorico().length > 0;

  if (possuiHistorico) {
    $("#nav-step-HistoricoDecisao").show();
    $("#divDivisaoHistorico").show();

    $(".stepper").removeClass("stepper-3").addClass("stepper-4");

    $("#divLinhasHistorico").empty();
    asyncMontaHistorico();
  } else {
    $("#nav-step-HistoricoDecisao").hide();
    $("#divDivisaoHistorico").hide();

    $(".stepper").removeClass("stepper-4").addClass("stepper-3");
  }

  atualizarSetas();
}



function bloquearTudoInicio() {
  const containers = [
    "#divPreCadastro",
    "#divDadosCadastrais",
    "#divDocumentacao"
  ];

  containers.forEach(function (container) {
    const $container = $(container);

    // inputs normais
    $container.find("input, select, textarea").each(function () {
      const $el = $(this);

      if ($el.is(":checkbox") || $el.is(":radio")) {
        $el.prop("disabled", true);
      } else {
        $el.prop("readonly", true).prop("disabled", true);
      }
    });

    // uploads (área customizada)
    $container.find(".upload-area").addClass("disabled-upload");

    // remove clique de upload
    $container.find(".upload-area").off("click");
  });
}
function habilitarTudoInicio() {
  const containers = [
    "#divPreCadastro",
    "#divDadosCadastrais",
    "#divDocumentacao"
  ];

  containers.forEach(function (container) {
    const $container = $(container);

    $container.find("input, select, textarea").each(function () {
      $(this).prop("disabled", false).prop("readonly", false);
    });

    // reativa upload
    $container.find(".upload-area").removeClass("disabled-upload");
  });
}
function controlarEdicaoInicioValidacao() {
  const atividade = Number($("#atividade").val() || 0);

  if (atividade !== ATIVIDADES.VALIDACAO) {
    $("#btnEditarCamposInicio").hide();
    return;
  }

  $("#btnEditarCamposInicio").show();

  bloquearTudoInicio();

  $("#btnEditarCamposInicio").off("click").on("click", function () {
    habilitarTudoInicio();

    $(this)
      .prop("disabled", true)
      .removeClass("btn-warning")
      .addClass("btn-success")
      .text("Edição liberada");
  });
}