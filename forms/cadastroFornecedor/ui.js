// VISIBILIDADE CONDICIONAL DE CAMPOS

// Controla as restrições impostas pela Classificação (Cliente / Fornecedor / Cliente+Fornecedor).
// Cliente (value "1"):
//   - Não tem CNAE
//   - Não tem Dados Bancários
//   - Não pode ser Pessoa Física → opção desabilitada no select #categoria
// Fornecedor / Cliente+Fornecedor: sem restrições extras.
function controlarCamposClassificacao() {
   const classificacao = ($("#classificacao").val() || "").trim();
   const isCliente = classificacao === "1";

   // ── Dados Bancários ────────────────────────────────────────────────────
   if (isCliente) {
      $("#divDadosBancarios").hide();
   } else {
      $("#divDadosBancarios").show();
   }

   // ── Opção Pessoa Física no select #categoria ───────────────────────────
   const $optPF = $("#categoria option[value='F']");
   if (isCliente) {
      $optPF.prop("disabled", true).hide();
      // Se Pessoa Física estava selecionada, limpa a seleção
      if ($("#categoria").val() === "F") {
         $("#categoria").val("").trigger("change");
      }
   } else {
      $optPF.prop("disabled", false).show();
   }

   // ── CNAE ───────────────────────────────────────────────────────────────
   // controlarCamposCategoria() já esconde o CNAE para PF e PJ Estrangeiro.
   // Para Cliente, esconde independentemente da categoria.
   if (isCliente) {
      $(".cnae-box").hide().prev(".divider").hide();
      $(".cnae-box").next(".divider").hide();
      $("#cnaePrincipal").prop("required", false).val("");
      $("#cnae-secundarios-wrap").empty();
   }

   // ── Grupo de Mercadoria ────────────────────────────────────────────────
   if (isCliente) {
      $("#divMoedaGrupoMercadoria, #grupo-mercadoria-wrap").hide();
      $("#grupoMercadoria1").prop("required", false).val("");
      // Remove grupos adicionais (2+)
      $("#grupo-mercadoria-wrap").empty();
   } else {
      // Reexibe o wrap além do container — se o usuário veio do modo Cliente,
      // o wrap ficou oculto e os novos itens seriam adicionados mas invisíveis.
      $("#divMoedaGrupoMercadoria, #grupo-mercadoria-wrap").show();
      $("#grupoMercadoria1").prop("required", true);
   }

   // ── Step 3 (Documentação) ───────────────────────────────────────────────
   // Cliente não precisa enviar documentos — step 3 é removido do stepper.
   // Se o usuário estiver no step 3 quando trocar para Cliente, volta ao step 2.
   if (isCliente) {
      $("#nav-step-Documentacao, #divDivisaoDocumentacao").hide();
      if (typeof getStepAtual === "function" && getStepAtual() === 3) {
         goToStep(2, false);
      }
   } else {
      $("#nav-step-Documentacao, #divDivisaoDocumentacao").show();
   }

   atualizarSetas();
   aplicarAsteriscoObrigatorio();
}

function controlarCamposCategoria() {
   const categoria = $("#categoria").val();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");
   const modoEstrangeiro = (categoria === "J" && estrangeiro);

   // Controla endereço ANTES dos condicionais de categoria
   controlarEnderecoEstrangeiro(modoEstrangeiro);

   $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual, #divInscricaoMunicipal, #divDocEstrangeiro").hide();

   $("#docCpf, #docCnpj, #docRg, #docInscricaoEstadual, #docInscricaoMunicipal, #docEstrangeiro")
      .prop("required", false);

   $("#divToggleEstrangeiro").hide();

   if (categoria === "F") {
      $("#divCpf, #divNomeFantasia, #divRg").show();
      $("#docCpf, #docRg, #nomeFantasia").prop("required", true);

      // Pessoa Física não tem CNAE
      $(".cnae-box").hide().prev(".divider").hide();
      $(".cnae-box").next(".divider").hide();
      $("#cnaePrincipal").prop("required", false).val("");
      $("#cnae-secundarios-wrap").empty();

      aplicarAsteriscoObrigatorio();
      return;
   }

   if (categoria === "J") {
      $("#divToggleEstrangeiro").show();

      if (estrangeiro) {
         // PJ Estrangeiro não tem CNAE (sem CNPJ, sem CNAE brasileiro)
         $(".cnae-box").hide().prev(".divider").hide();
         $(".cnae-box").next(".divider").hide();
         $("#cnaePrincipal").prop("required", false).val("");
         $("#cnae-secundarios-wrap").empty();

         $("#divDocEstrangeiro").show();
         $("#docEstrangeiro").prop("required", true);

         $("#docCnpj, #docInscricaoEstadual, #docInscricaoMunicipal").val("");
         limparErroCampo("docCnpj");
         limparErroCampo("docInscricaoEstadual");
         limparErroCampo("docInscricaoMunicipal");
      } else {
         // PJ Nacional tem CNAE
         $(".cnae-box").show().prev(".divider").show();
         $(".cnae-box").next(".divider").show();
         $("#cnaePrincipal").prop("required", true);
         $("#divCnpj, #divNomeFantasia, #divInscricaoEstadual, #divInscricaoMunicipal").show(500);
         $("#docCnpj, #nomeFantasia").prop("required", true);

         $("#docEstrangeiro").val("");
         limparErroCampo("docEstrangeiro");
      }
   }

   // Reaplica as restrições de classificação por cima das de categoria
   // (ex.: Cliente PJ Nacional não deve exibir CNAE nem bancos)
   controlarCamposClassificacao();
}

// Controla CEP, campos de endereço e o campo País ao ativar/desativar modo estrangeiro.
// Chamado por controlarCamposCategoria() a cada mudança de categoria ou toggle.
function controlarEnderecoEstrangeiro(ativo) {
   if (ativo) {
      // ── MODO ESTRANGEIRO ──────────────────────────────────────────────
      // Oculta e desvalida o CEP (não existe CEP fora do Brasil)
      $("#divCep").hide();
      $("#cep").prop("required", false);

      // Libera os campos de endereço para preenchimento manual
      $("#endereco, #bairro, #cidade").prop("readonly", false);

      // Troca o input de País pelo select consultado do dataset GPAIS
      $("#pais").hide().prop("required", false);
      $("#divSelectPaisEstrangeiro").show();
      $("#selectPaisEstrangeiro").prop("required", true);

      // Carrega a lista de países (usa cache após primeira carga)
      carregarPaisesEstrangeiros();

      // Estado → "End. Exterior" (opcional, pois nem todo país tem UF equivalente)
      $("#divEstado label").text("End. Exterior");
      $("#estado")
         .prop({ required: false, readonly: false })
         .attr("placeholder", "Estado / Região / Província");

   } else {
      // ── MODO NACIONAL (padrão) ────────────────────────────────────────
      // Reexibe e revalida o CEP
      $("#divCep").show();
      $("#cep").prop("required", true);

      // Restaura readonly nos campos de endereço (preenchidos pela busca de CEP)
      $("#endereco, #bairro, #cidade, #estado").prop("readonly", true);

      // Restaura o input de País, garante valor padrão "Brasil"
      $("#divSelectPaisEstrangeiro").hide();
      $("#selectPaisEstrangeiro").prop("required", false);
      $("#pais").show().prop("required", true);

      if (!($("#pais").val() || "").trim()) {
         $("#pais").val("Brasil");
      }

      // Restaura label e placeholder originais do Estado
      $("#divEstado label").text("Estado");
      $("#estado")
         .prop("required", true)
         .attr("placeholder", "UF");
   }
}
function controlarAlertaCnpj() {
   const categoria = $("#categoria").val();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");
   const cnpj = ($("#docCnpj").val() || "").replaceAll(/\D/g, "");

   // Estrangeiro não tem CNPJ brasileiro — alerta não se aplica
   if (categoria === "J" && !estrangeiro && cnpj.length < 14) {
      $("#alertCnpj").show();
   } else {
      $("#alertCnpj").hide();
   }

   if (categoria === "F") {
      $("#alertCPF").show();
   } else {
      $("#alertCPF").hide();
   }
}
function controlarRetencaoPorTipo() {
   const tipo = $("#tipo").val();

   if (TIPOS_COM_RETENCAO.includes(tipo)) {
      return;
   }

   resetarRetencao();
}
function controlarPainelRetencoes() {
   const $painel = $("#divRetencoesPanel");

   if ($("#toggleRetencao").is(":checked")) {
      $painel.removeClass("field-hidden").show();
      return;
   }

   // "retencao-erro" (não "retencao-error") — corrige typo que impedia limpeza do border
   $painel.addClass("field-hidden").hide().removeClass("retencao-erro");

   // Limpa o texto de erro "Selecione pelo menos um imposto." do painel dedicado
   $("#erroMinimoImposto").hide();

   $(".retencao-item input").prop("checked", false);
   $(".retencao-item").removeClass("ativo");
}
function resetarRetencao() {
   $("#toggleRetencao").prop("checked", false);
   $("#hiddenToggleRetencao").val("");
   $("#divRetencoesPanel").addClass("field-hidden");
   $(".retencao-item input").prop("checked", false);
   $(".retencao-item").removeClass("ativo");
   // Limpa hidden anchors dos impostos
   $("#hiddenIss, #hiddenInss, #hiddenInputIrrf, #hiddenCsll, #hiddenPis, #hiddenCofins").val("");
}


// SISTEMA DE NAVEGAÇÃO POR STEPS (WIZARD)
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

   getStepsVisiveis().forEach(function (itemStep) {
      if (itemStep < step) {
         $(NAV_MAP[itemStep]).addClass("done");
      } else if (itemStep === step) {
         $(NAV_MAP[itemStep]).addClass("active");
      }
   });

   atualizarSetas();

   // Rola para o topo ao trocar de etapa para que o page-header fique visível
   // (especialmente importante em telas menores onde o conteúdo anterior empurra o scroll para baixo)
   $("html, body").animate({ scrollTop: 0 }, 200);
}
function goToNextVisibleStep() {
   if (!validarEtapaAtual(false)) {
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
   $("#btn-avancar").prop("disabled", index === steps.length - 1);
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


// BLOQUEIO / DESBLOQUEIO DE CAMPOS NA VALIDAÇÃO
function bloquearTudoInicio() {
   const containers = [
      "#divPreCadastro",
      "#divDadosCadastrais",
      "#divDocumentacao"
   ];

   containers.forEach(function (container) {
      const $container = $(container);

      $container
         .find("input:not([type='hidden']), textarea")
         .prop("readonly", true)
         .addClass("campo-readonly");

      $container
         .find("select, input[type='checkbox'], input[type='radio']")
         .prop("disabled", false)
         .addClass("campo-bloqueado");

      $container
         .find(".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap")
         .addClass("campo-bloqueado");

      $container
         .find(".upload-area")
         .addClass("disabled-upload campo-bloqueado")
         .off("click");

      $container
         .find("button:not(.section-head):not(.btn-visualizar-anexo)")
         .addClass("btn-bloqueado")
         .attr("tabindex", "-1");

      $container
         .find(".upload-file-remove")
         .addClass("btn-bloqueado")
         .attr("tabindex", "-1");
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

      $container
         .find("input:not([type='hidden']), select, textarea")
         .prop("disabled", false)
         .prop("readonly", false)
         .removeClass("campo-bloqueado campo-readonly");

      $container
         .find("input[type='checkbox'], input[type='radio']")
         .prop("disabled", false)
         .removeClass("campo-bloqueado");

      $container
         .find(".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap, .upload-area")
         .removeClass("campo-bloqueado disabled-upload");

      $container
         .find("button, .upload-file-remove")
         .removeClass("btn-bloqueado")
         .removeAttr("tabindex");
   });

   inicializarUploadsFluig();
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