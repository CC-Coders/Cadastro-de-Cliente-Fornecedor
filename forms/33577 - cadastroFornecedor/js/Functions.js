// CARGA INICIAL
function inicializarTela() {
  $(".section-body").show();
  goToStep(1,false);

  $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual").hide();
  $("#endereco, #bairro, #cidade, #estado").prop("readonly", true);
}
function inicializarMascaras() {
  $("#docCpf").mask("000.000.000-00");
  $("#docCnpj").mask("00.000.000/0000-00");
  $("#docRg").mask("00.000.000-0");
  $("#docInscricaoEstadual").mask("00000000000000");
  $("#cep").mask("00000-000");
  $("#numero").mask("000000");
}
function sincronizarEstadoInicial() {
  $("#toggleRetencao").trigger("change");
  controlarCamposCategoria();
  controlarAlertaCnpj();
  controlarRetencaoPorTipo();
  controlarBotaoAdicionarCnae();
  controlarBotaoAdicionarGrupoMercadoria();
  atualizarSetas();
}
function bindEventos() {
  $("#tipo").on("change", controlarRetencaoPorTipo);

  $("#categoria").on("change", function () {
    controlarCamposCategoria();
    controlarAlertaCnpj();
  });

  $("#docCnpj").on("blur keyup", controlarAlertaCnpj);

  $("#cep").on("blur", function () {
    const cep = $(this).val().replace(/\D/g, "");

    if (cep.length !== 8) {
      limpaCamposEndereco();
      return;
    }
    buscarCep(cep);
  });

  $("#toggleRetencao").on("change", controlarPainelRetencoes);
  $(".retencao-item input").on("change", function () {
    $(this).closest(".retencao-item").toggleClass("ativo", this.checked);
  });
    $("#classificacao").on("change", function () {
    limparErroCampo("classificacao");
  });

  $(document).on("click", "#btn-add-cnae", function () {
    adicionarCnae();
  });
  $(document).on("click", ".btn-remove-cnae", function () {
    $(this).closest(".cnae-secundario-item").remove();
    reordenarCnaesSecundarios();
    controlarBotaoAdicionarCnae();
  });
  $(document).on("input", ".cnae-secundario", function () {
    aplicarMascaraCnae($(this));
  });

  $(document).on("click", "#btn-add-grupo-mercadoria", function () {
    adicionarGrupoMercadoria();
  });
  $(document).on("click", ".btn-remove-grupo-mercadoria", function () {
    $(this).closest(".grupo-mercadoria-item").remove();
    reordenarGruposMercadoria();
    controlarBotaoAdicionarGrupoMercadoria();
  });

  $(document).off("click", ".upload-file-remove").on("click", ".upload-file-remove", function (e) {
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

// VALIDAÇÃO DOS CAMPOS
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
function validarPreCadastro() {
  let valido = true;
  const mensagensErro = [];

  limparErrosPreCadastro();

  // 1. Dados do Cliente / Fornecedor
  if (!validarCampoObrigatorio("classificacao", "Classificação")) {
    valido = false;
    mensagensErro.push("Classificação");
  }

  if (!validarCampoObrigatorio("categoria", "Categoria")) {
    valido = false;
    mensagensErro.push("Categoria");
  }

  if (!validarCampoObrigatorio("tipo", "Tipo")) {
    valido = false;
    mensagensErro.push("Tipo");
  }

  if (!validarCampoObrigatorio("classificacaoOperacional", "Classificação Operacional")) {
    valido = false;
    mensagensErro.push("Classificação Operacional");
  }
  // 2. Dados Comerciais
  if (!validarDocumentosPorCategoria()) {
    valido = false;

    const categoria = ($("#categoria").val() || "").trim();

    if (categoria === "Pessoa Física") {
      mensagensErro.push("CPF");
      mensagensErro.push("RG");
    }

    if (categoria === "Pessoa Jurídica") {
      mensagensErro.push("CNPJ");
      mensagensErro.push("Inscrição Estadual");
    }
  }

  if (!validarCampoObrigatorio("razaoSocial", "Razão Social / Nome")) {
    valido = false;
    mensagensErro.push("Razão Social / Nome");
  }

  if (!validarCampoObrigatorio("cep", "CEP")) {
    valido = false;
    mensagensErro.push("CEP");
  }

  if (!validarCampoObrigatorio("endereco", "Endereço")) {
    valido = false;
    mensagensErro.push("Endereço");
  }

  if (!validarCampoObrigatorio("numero", "Número")) {
    valido = false;
    mensagensErro.push("Número");
  }

  if (!validarCampoObrigatorio("bairro", "Bairro")) {
    valido = false;
    mensagensErro.push("Bairro");
  }

  if (!validarCampoObrigatorio("cidade", "Cidade")) {
    valido = false;
    mensagensErro.push("Cidade");
  }

  if (!validarCampoObrigatorio("pais", "País")) {
    valido = false;
    mensagensErro.push("País");
  }

  if (!validarCampoObrigatorio("estado", "Estado")) {
    valido = false;
    mensagensErro.push("Estado");
  }

  if (!valido) {
    FLUIGC.toast({
      title: "Atenção",
      message: "Preencha todos os campos obrigatórios para avançar.",
      type: "warning",
      timeout: 3000
    });

    focusCampoComErro();
  }

  return valido;
}
function validarDadosCadastrais() {
  let valido = true;
  limparErrosDadosCadastrais();
  if (!validarCampoObrigatorio("icms", "Contribuinte ICMS")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("IputIrrf", "Alíquota IRRF")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("simplesNacional", "Simples Nacional")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("naturezaRendimento", "Natureza de Rendimentos")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("regimeFiscal", "Regime Fiscal")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("tipoDocEmitido", "Tipo de Documento Emitido")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("moeda", "Moeda do Pedido")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("grupoMercadoria1", "Grupo de Mercadoria")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("cnaePrincipal", "CNAE Principal")) {
    valido = false;
  }
  if ($("#toggleRetencao").is(":checked")) {
    const impostosSelecionados = [
      $("#iss").is(":checked"),
      $("#inss").is(":checked"),
      $("#irrf").is(":checked"),
      $("#csll").is(":checked"),
      $("#pis").is(":checked"),
      $("#cofins").is(":checked")
    ];

    const algumSelecionado = impostosSelecionados.some(v => v === true);

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
  if (!validarCampoObrigatorio("condicaoPagamento", "Condição de Pagamento")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("banco", "Banco")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("agencia", "Agência")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("conta", "Conta")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("telFinanceiro", "Telefone Financeiro")) {
  valido = false;
  }
  if (!validarCampoObrigatorio("telComercial", "Telefone Comercial")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("celular", "Celular")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("emailNfe", "E-mail NFE")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("emailComercial", "E-mail Comercial")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("emailCr", "E-mail Contas a Receber")) {
    valido = false;
  }
  if (!validarCampoObrigatorio("emailJuridico", "E-mail Jurídico")) {
    valido = false;
  }         
  if (!valido) {
    FLUIGC.toast({
      title: "Atenção",
      message: "Preencha todos os campos obrigatórios dos Dados Cadastrais.",
      type: "warning",
      timeout: 5000
    });

    focusCampoComErro();
  }

  return valido;
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
    "IputIrrf",
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


// PAGINAÇÃO
function getStepsVisiveis() {
  return Object.keys(NAV_MAP)
    .map(Number)
    .filter(function (step) {
      return $(NAV_MAP[step]).is(":visible");
    });
}
function getStepAtual() {
  let stepAtual = 1;

  Object.keys(NAV_MAP).forEach(function (step) {
    if ($(NAV_MAP[step]).hasClass("active")) {
      stepAtual = parseInt(step, 10);
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

  getStepsVisiveis().forEach(function (itemStep) {
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

  $("#btnPrevStep").prop("disabled", index === 0);
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
function controlarCamposCategoria(animar) {
  const categoria = $("#categoria").val();
  const metodoShow = animar ? "show" : "show";
  const metodoHide = animar ? "hide" : "hide";

  $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual").hide();
  $("#docCpf, #docCnpj, #docRg, #docInscricaoEstadual").prop("required", false);

  if (categoria === "Pessoa Física") {
    $("#divCpf, #divRg").show();
    $("#docCpf, #docRg").prop("required", true);
    return;
  }

  if (categoria === "Pessoa Jurídica") {
    $("#divCnpj, #divInscricaoEstadual").show();
    $("#docCnpj, #docInscricaoEstadual").prop("required", true);
  }
}
function controlarAlertaCnpj() {
  const categoria = $("#categoria").val();
  const cnpj = ($("#docCnpj").val() || "").replace(/\D/g, "");

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
    success: function (data) {
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
    error: function () {
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
  const opcoesHtml = OPCOES_GRUPO_MERCADORIA.map(function (opcao) {
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
  $("#grupo-mercadoria-wrap .grupo-mercadoria-item").each(function (index) {
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
  $("#cnae-secundarios-wrap .cnae-secundario-item").each(function (index) {
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
function aplicarMascaraCnae($campo) {
  let valor = $campo.val().replace(/\D/g, "");

  if (valor.length > 7) {
    valor = valor.substring(0, 7);
  }

  if (valor.length > 5) {
    valor = valor.replace(/^(\d{4})(\d{1})(\d{0,2}).*/, "$1-$2/$3");
  } else if (valor.length > 4) {
    valor = valor.replace(/^(\d{4})(\d{0,1}).*/, "$1-$2");
  }

  $campo.val(valor);
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
  $(".upload-area").each(function () {
    const $area = $(this);
    const inputId = $area.data("upload-id");
    const $input = $("#" + inputId);

    if (!$input.length) {
      return;
    }

    $area.off("click").on("click", function (e) {
      if ($(e.target).closest(".upload-file-remove").length) {
        return;
      }

      e.preventDefault();
      $input[0].click();
    });

    $input.off("change").on("change", function () {
      if (this.files && this.files.length > 0) {
        atualizarVisualUpload(this.id, $area);
      }
    });
  });
}
function atualizarVisualUpload(inputId, $area) {
  const input = document.getElementById(inputId);

  if (!input || !input.files || !input.files.length) {
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
  const inputId = config && config.inputId ? config.inputId : "";
  const sufixoCampo = config && config.sufixoCampo ? config.sufixoCampo : "";
  const areaId = config && config.areaId ? config.areaId : "";

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

  if (!input || !input.files || input.files.length === 0) {
    exibirErroUpload(campoId, "Anexo '" + label + "' é obrigatório.");
    return false;
  }

  return true;
}

function limparErrosDocumentacao() {
  const camposDocumentacao = [
    "fileCartaoCnpj",
    "fileComprovanteBanco",
    "fileContratoSocial",
    "fileCodigoConduta",
    "filePoliticaAnticorrupcao",
    "fileConflitoInteresses",
    "fileCienciaLgpd"
  ];

  camposDocumentacao.forEach(function (campoId) {
    limparErroCampo(campoId);
  });
}

function validarDocumentacao() {
  let valido = true;

  limparErrosDocumentacao();

  // =========================================================
  // 1. ANEXOS DE DOCUMENTOS
  // =========================================================
  if (!validarUploadObrigatorio("fileCartaoCnpj", "Cartão CNPJ")) {
    valido = false;
  }

  if (!validarUploadObrigatorio("fileComprovanteBanco", "Comprovante Bancário")) {
    valido = false;
  }

  if (!validarUploadObrigatorio("fileContratoSocial", "Contrato Social")) {
    valido = false;
  }

  // =========================================================
  // 2. CONFORMIDADE E ÉTICA
  // =========================================================
  if (!validarUploadObrigatorio("fileCodigoConduta", "Código de Conduta")) {
    valido = false;
  }

  if (!validarUploadObrigatorio("filePoliticaAnticorrupcao", "Política Anticorrupção")) {
    valido = false;
  }

  if (!validarUploadObrigatorio("fileConflitoInteresses", "Conflito de Interesses")) {
    valido = false;
  }

  if (!validarUploadObrigatorio("fileCienciaLgpd", "Ciência sobre LGPD")) {
    valido = false;
  }

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