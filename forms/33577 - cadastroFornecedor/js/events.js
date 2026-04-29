// EVENTOS GERAIS
function bindEventos() {
    bindEventosCamposBasicos();
    bindEventosDocumentos();
    bindEventosEndereco();
    bindEventosRetencao();
    bindEventosCnaeSecundario();
    bindEventosGrupoMercadoria();
    bindEventosUpload();
}
function bindEventosCamposBasicos() {
    $(document).on("input change", ".form-control[required]", function () {
        limparErroCampoObrigatorioPreenchido(this);
    });

    $("#categoria").on("change", function () {
        controlarCamposCategoria();
        controlarAlertaCnpj();
        controlarDocumentacaoPorCategoria();
        aplicarAsteriscoObrigatorio();

        limparErroCampo("categoria");
    });

    $("#tipo").on("change", controlarRetencaoPorTipo);
}
function limparErroCampoObrigatorioPreenchido(campo) {
    const id = campo.id;

    if (["docCpf", "docCnpj"].includes(id)) {
        return;
    }

    const valor = ($(campo).val() || "").toString().trim();

    if (valor) {
        limparErroCampo(id);
    }
}
function bindEventosDocumentos() {
    $("#docCnpj").on("input", function () {
        validarDocumentoDigitado({
            campoId: "docCnpj",
            tamanhoMinimo: 14,
            mensagemErro: "CNPJ inválido.",
            validador: validarCNPJ
        });
    });

    $("#docCpf").on("input", function () {
        validarDocumentoDigitado({
            campoId: "docCpf",
            tamanhoMinimo: 11,
            mensagemErro: "CPF inválido.",
            validador: validarCPF
        });
    });

    $("#docCnpj").on("blur keyup", controlarAlertaCnpj);
}
function validarDocumentoDigitado(config) {
    const valor = $("#" + config.campoId).val() || "";
    const numeros = valor.replaceAll(/\D/g, "");

    if (!valor || numeros.length < config.tamanhoMinimo) {
        limparErroCampo(config.campoId);
        aplicarStatusCampo(config.campoId, null);
        return;
    }

    if (config.validador(valor)) {
        limparErroCampo(config.campoId);
        aplicarStatusCampo(config.campoId, true);
        return;
    }

    exibirErroCampo(config.campoId, config.mensagemErro);
    aplicarStatusCampo(config.campoId, false);
}
function bindEventosEndereco() {
    $("#cep").on("blur", function () {
        const cep = ($(this).val() || "").replaceAll(/\D/g, "");

        if (cep.length !== 8) {
            limpaCamposEndereco();
            return;
        }

        buscarCep(cep);
    });
}
function bindEventosRetencao() {
    $("#toggleRetencao").on("change", controlarPainelRetencoes);

    $(".retencao-item input").on("change", function () {
        $(this)
            .closest(".retencao-item")
            .toggleClass("ativo", this.checked);
    });
}
function bindEventosCnaeSecundario() {
    $(document).on("click", "#btn-add-cnae", adicionarCnae);

    $(document).on("click", ".btn-remove-cnae", function () {
        $(this).closest(".cnae-secundario-item").remove();

        reordenarCnaesSecundarios();
        controlarBotaoAdicionarCnae();
    });

    $(document).on("input", ".cnae-secundario", function () {
        aplicarMascaraCnae($(this));
    });
}
function bindEventosGrupoMercadoria() {
    $(document).on("click", "#btn-add-grupo-mercadoria", adicionarGrupoMercadoria);

    $(document).on("click", ".btn-remove-grupo-mercadoria", function () {
        $(this).closest(".grupo-mercadoria-item").remove();

        reordenarGruposMercadoria();
        controlarBotaoAdicionarGrupoMercadoria();
    });
}
function bindEventosUpload() {
  monitorarInputNativoFluig();

  $(document)
    .off("click", ".upload-file-remove")
    .on("click", ".upload-file-remove", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const $botao = $(this);

      limparStatusUpload({
        inputId: $botao.data("input-id"),
        sufixoCampo: $botao.data("sufixo"),
        areaId: $botao.data("area-id")
      });
    });
}