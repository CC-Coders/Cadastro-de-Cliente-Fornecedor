// VISIBILIDADE CONDICIONAL DE CAMPOS

function controlarCamposClassificacao() {
   const classificacao = ($("#classificacao").val() || "").trim();
   const isCliente = classificacao === "1";

   if (isCliente) {
      $("#divDadosBancarios").hide();
   } else {
      $("#divDadosBancarios").show();
   }
   if (isCliente) {

      if (!$("#categoria").data("optPF")) {
         let $pf = $("#categoria option[value='F']");
         if ($pf.length) {
            let eraPF = $("#categoria").val() === "F";
            $("#categoria").data("optPF", $pf.detach());

            if (eraPF) {
               $("#categoria").prop("selectedIndex", 0).trigger("change");
            }
         }
      }
   } else {
      
      let $pfSalvo = $("#categoria").data("optPF");
      if ($pfSalvo && !$("#categoria option[value='F']").length) {
         let $pj = $("#categoria option[value='J']");
         if ($pj.length) { $pj.after($pfSalvo); } else { $("#categoria").append($pfSalvo); }
         $("#categoria").removeData("optPF");
      }
   }

   if (isCliente) {
      $(".cnae-box").hide().prev(".divider").hide();
      $(".cnae-box").next(".divider").hide();
      $("#cnaePrincipal").prop("required", false).val("");
      $("#cnae-secundarios-wrap").empty();
   }

   if (isCliente) {
      $("#divMoedaGrupoMercadoria, #grupo-mercadoria-wrap").hide();
      $("#grupoMercadoria1").prop("required", false).val("");
      $("#grupo-mercadoria-wrap").empty();
   } else {

      $("#divMoedaGrupoMercadoria, #grupo-mercadoria-wrap").show();
      $("#grupoMercadoria1").prop("required", true);
   }

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

   controlarEnderecoEstrangeiro(modoEstrangeiro);

   $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual, #divInscricaoMunicipal, #divDocEstrangeiro").hide();

   $("#docCpf, #docCnpj, #docRg, #docInscricaoEstadual, #docInscricaoMunicipal, #docEstrangeiro")
      .prop("required", false);

   $("#divToggleEstrangeiro").hide();

   if (categoria === "F") {
      $("#divCpf, #divNomeFantasia, #divRg").show();
      $("#docCpf, #docRg, #nomeFantasia").prop("required", true);

      $("#divDadosPF").show();
      $("#dtNascimento, #estadoCivil, #docRgOrgao, #docRgUf").prop("required", true);

      $("#divDependentesBox").show();

      $(".cnae-box").hide().prev(".divider").hide();
      $(".cnae-box").next(".divider").hide();
      $("#cnaePrincipal").prop("required", false).val("");
      $("#cnae-secundarios-wrap").empty();

      aplicarAsteriscoObrigatorio();
      return;
   }

   $("#divDadosPF").hide();
   $("#dtNascimento, #estadoCivil, #docRgOrgao, #docRgUf").prop("required", false);


   $("#divDependentesBox").hide();
   $("#toggleDependentes").prop("checked", false);
   $("#hiddenToggleDependentes").val("");
   $("#divNumDependentesInput").addClass("field-hidden").hide();
   $("#numDependentes").val("0");

   if (categoria === "J") {
      $("#divToggleEstrangeiro").show();

      if (estrangeiro) {
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
         $(".cnae-box").show().prev(".divider").show();
         $(".cnae-box").next(".divider").show();
         $("#cnaePrincipal").prop("required", true);
         $("#divCnpj, #divNomeFantasia, #divInscricaoEstadual, #divInscricaoMunicipal").show(500);
         $("#docCnpj, #nomeFantasia").prop("required", true);

         $("#docEstrangeiro").val("");
         limparErroCampo("docEstrangeiro");
      }
   }

   controlarCamposClassificacao();
}

function controlarCamposDependentes() {
   const $painel = $("#divNumDependentesInput");
   const ativo = $("#toggleDependentes").is(":checked");
   if (ativo) {
      $painel.removeClass("field-hidden").show();
      if ((Number.parseInt($("#numDependentes").val(), 10) || 0) < 1) {
         $("#numDependentes").val("1");
      }
   } else {
      $painel.addClass("field-hidden").hide();
      $("#numDependentes").val("0");
   }
}

let _cidadeSelectOriginalHtml = null;

function controlarEnderecoEstrangeiro(ativo) {
   const $estadoWrap = $("#divEstado .select-wrap");

   if (ativo) {
      $("#divCep").hide();
      $("#cep").prop("required", false);

      $("#endereco, #bairro").prop("readonly", false);
      $("#pais").hide().prop("required", false);
      $("#divSelectPaisEstrangeiro").show();
      $("#selectPaisEstrangeiro").prop("required", true);
      carregarPaisesEstrangeiros();

      const $estado = $("#estado");
      if (!$estado.find("option[value='EX']").length) {
         $estado.prepend('<option value="EX">EX</option>');
      }
      $estado.val("EX").prop("required", false);
      $estadoWrap.hide();
      if ($("#estadoExteriorDisplay").length) {
         $("#estadoExteriorDisplay").val("EX");
      } else {
         $estadoWrap.after(
            '<input type="text" id="estadoExteriorDisplay" class="form-control"' +
            ' value="EX" readonly tabindex="-1">'
         );
      }
      $("#estadoExteriorDisplay").show();
      $("#divEstado label").text("End. Exterior");


      let $cidadeWrap = $("#divCidade .select-wrap");
      if ($("#cidade").is("select")) {
         _cidadeSelectOriginalHtml = $cidadeWrap[0].outerHTML;
         $cidadeWrap.replaceWith(
            '<input type="text" id="cidade" name="cidade" class="form-control"' +
            ' placeholder="Cidade / Localidade" required>'
         );
      }
      let nomeSalvo = ($("#nomeCidadeSalva").val() || "").trim();
      if (nomeSalvo) $("#cidade").val(nomeSalvo);
      $("#cidade").prop("readonly", false);

   } else {

      $("#divCep").show();
      $("#cep").prop("required", true);

      $("#endereco, #bairro").prop("readonly", true);
      $("#divSelectPaisEstrangeiro").hide();
      $("#selectPaisEstrangeiro").prop("required", false);
      $("#pais").show().prop("required", true);
      if (!($("#pais").val() || "").trim()) {
         $("#pais").val("Brasil");
      }


      $("#divEstado label").text("Estado");
      $estadoWrap.show();
      $("#estadoExteriorDisplay").hide();
      $("#estado option[value='EX']").remove();
      $("#estado").val("").prop({ required: true, readonly: true });


      if (_cidadeSelectOriginalHtml) {
         let $cidadeInput = $("#cidade");
         if ($cidadeInput.is("input")) {
            $cidadeInput.replaceWith(_cidadeSelectOriginalHtml);
            _cidadeSelectOriginalHtml = null;
         }
      }
      $("#cidade").val("").prop("readonly", true);
      $("#codMunicipio").val("");
      if (!globalThis._formRestaurando) {
         $("#nomeCidadeSalva").val("");
      }
   }
}
function controlarAlertaCnpj() {
   const categoria = $("#categoria").val();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");
   const cnpj = ($("#docCnpj").val() || "").replace(/[^A-Za-z0-9]/g, "");


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

   $painel.addClass("field-hidden").hide().removeClass("retencao-erro");

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
   $("#hiddenIss, #hiddenInss, #hiddenInputIrrf, #hiddenCsll, #hiddenPis, #hiddenCofins").val("");
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

   $("html, body").animate({ scrollTop: 0 }, 200);
}
function goToNextVisibleStep() {
   const ehView = ehModoView();

   if (!ehView && !validarEtapaAtual(false)) {
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

const CONTAINERS_INICIO = ["#divPreCadastro", "#divDadosCadastrais", "#divDocumentacao"];

function bloquearTudoInicio() {
   const containers = CONTAINERS_INICIO;

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
   const containers = CONTAINERS_INICIO;

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

function ehModoView() {
   return $("body").hasClass("modo-view") ||
          ($("#formMode").val() || "").toUpperCase() === "VIEW";
}
function controlarEdicaoInicioValidacao() {
   const atividade = Number($("#atividade").val() || 0);
   const formMode  = ($("#formMode").val() || "").toUpperCase();

   const ehHistorico      = formMode === "VIEW";


   const ATIVIDADES_EDITAVEIS = [
      ATIVIDADES.INICIO_0,
      ATIVIDADES.INICIO,
      ATIVIDADES.CORRECAO,
      ATIVIDADES.INTEGRACAO
   ];


   const ehSomenteLeitura = ehHistorico ||
                            atividade === ATIVIDADES.ERRO_INTEGRACAO ||
                            (!ATIVIDADES_EDITAVEIS.includes(atividade) && atividade !== ATIVIDADES.VALIDACAO);


   if (atividade !== ATIVIDADES.VALIDACAO && !ehSomenteLeitura) {
      $("#btnEditarCamposInicio").hide();
      return;
   }

   bloquearTudoInicio();

   if (atividade === ATIVIDADES.VALIDACAO) {
      $("#btnEditarCamposInicio").show();
      $("#btnEditarCamposInicio").off("click").on("click", function () {
         habilitarTudoInicio();
         $(this)
            .prop("disabled", true)
            .removeClass("btn-warning")
            .addClass("btn-success")
            .text("Edição liberada");
      });
   } else {
      $("body").addClass("modo-view");
      $("#btnEditarCamposInicio").hide();
      $("#btnAprovar, #btnReprovar, #divSelectDecisao").hide();
      $("#observacaoValidacao").prop("readonly", true).addClass("campo-readonly");
      goToStep(1, false);

      setTimeout(function () {
         let $hdr = $("#divHeaderPreCad");
         $hdr.css({
            "display":        "flex",
            "flex-direction": "row",
            "flex-wrap":      "nowrap",
            "align-items":    "center",
            "text-align":     "left"
         });
         $hdr.find(".page-header-info").css({
            "flex":       "1",
            "min-width":  "0",
            "text-align": "left"
         });
         $hdr.find(".page-header-title, .page-header-sub, .step-badge").css("text-align", "left");
         $(".stepper-nav-wrap").css("display", "flex");
         $(".stepper-wrap").css({ "display": "block", "overflow-x": "auto" });
         $(".stepper").css({ "display": "flex", "visibility": "visible" });
         $(".step-item").css({ "display": "flex", "visibility": "visible", "pointer-events": "auto" });
         $(".step-connector").css({ "display": "flex", "visibility": "visible" });
         $("#btn-voltar, #btn-avancar").css({ "display": "inline-flex", "visibility": "visible", "pointer-events": "auto" });
      }, 150);
   }
}