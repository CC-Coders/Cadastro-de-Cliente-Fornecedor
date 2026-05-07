function controlarCamposCategoria() {
   const categoria = $("#categoria").val();

   $("#divCpf, #divCnpj, #divNomeFantasia, #divRg, #divInscricaoEstadual").hide();
   $("#docCpf, #docCnpj, #docRg, #docInscricaoEstadual").prop("required", false);

   $("#divToggleEstrangeiro").hide();

   if (categoria === "F") {
      $("#divCpf, #divRg").show();
      $("#docCpf, #docRg").prop("required", true);

      $("#divToggleEstrangeiro").hide();

      aplicarAsteriscoObrigatorio();
      return;
   }

   if (categoria === "J") {
      $("#divCnpj, #divNomeFantasia, #divInscricaoEstadual").show();
      $("#docCnpj, #nomeFantasia").prop("required", true);

      $("#divToggleEstrangeiro").show();
   }

   aplicarAsteriscoObrigatorio();
}

function controlarAlertaCnpj() {
   const categoria = $("#categoria").val();
   const cnpj = ($("#docCnpj").val() || "").replaceAll(/\D/g, "");

   if (categoria === "J" && cnpj.length < 14) {
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
      $("#divToggleRetencao").show();
      return;
   }

   $("#divToggleRetencao").hide();
   resetarRetencao();
}

function controlarPainelRetencoes() {
   const $painel = $("#divRetencoesPanel");

   if ($("#toggleRetencao").is(":checked")) {
      $painel.removeClass("field-hidden").show();
      return;
   }

   $painel.addClass("field-hidden").hide().removeClass("retencao-error");

   $(".retencao-item input").prop("checked", false);
   $(".retencao-item").removeClass("ativo");
}

function resetarRetencao() {
   $("#toggleRetencao").prop("checked", false);
   $("#divRetencoesPanel").addClass("field-hidden");
   $(".retencao-item input").prop("checked", false);
   $(".retencao-item").removeClass("ativo");
}

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
// EDITAR CAMPOS NA VALIDAÇÃO
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