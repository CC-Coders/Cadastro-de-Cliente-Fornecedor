
// UI DE SELECT COM BUSCA (SINGLE SELECT)
(function () {
   "use strict";

   var $overlay    = null;   
   var $currentSel = null;   

   // MOSTRA O OVERLAY DE BUSCA, POSICIONA E POPULA A LISTA
   function _build() {
      if ($overlay) return;
      $overlay = $([
         '<div id="sso-root">',
         '  <div class="sso-backdrop"></div>',
         '  <div class="sso-panel">',
         '    <input class="sso-input" type="text" placeholder="Pesquisar..." autocomplete="off"/>',
         '    <ul class="sso-list"></ul>',
         '  </div>',
         '</div>'
      ].join(""));
      $("body").append($overlay);
      $overlay.find(".sso-backdrop").on("click", _close);
      $overlay.find(".sso-input").on("input", function () { _filter($(this).val()); });

      $overlay.find(".sso-list").on("click", ".sso-option", function () {
         if (!$currentSel) return;
         $currentSel.val($(this).data("val")).trigger("change");
         _close();
      });

      $(document).on("keydown.ssoGlobal", function (e) {
         if (!$overlay || !$overlay.hasClass("sso-open")) return;
         if (e.key === "Escape") { _close(); return; }

         var $vis = $overlay.find(".sso-option:visible");
         var $foc = $overlay.find(".sso-option.sso-focused");

         if (e.key === "ArrowDown") {
            e.preventDefault();
            var ni = $vis.index($foc) + 1;
            if (ni < $vis.length) {
               $foc.removeClass("sso-focused");
               $vis.eq(ni).addClass("sso-focused")[0].scrollIntoView({ block: "nearest" });
            }
         } else if (e.key === "ArrowUp") {
            e.preventDefault();
            var pi = $vis.index($foc) - 1;
            if (pi >= 0) {
               $foc.removeClass("sso-focused");
               $vis.eq(pi).addClass("sso-focused")[0].scrollIntoView({ block: "nearest" });
            }
         } else if (e.key === "Enter") {
            e.preventDefault();
            var $f = $overlay.find(".sso-option.sso-focused:visible");
            if ($f.length) $f.trigger("click");
         }
      });

      $(window).on("scroll.sso resize.sso", function () {
         if ($overlay && $overlay.hasClass("sso-open") && $currentSel) {
            _position($currentSel);
         }
      });
   }
   // ABRE O OVERLAY DE BUSCA PARA O SELECT ESPECIFICADO
   function _open($sel) {
      _build();

      if ($currentSel && $currentSel.is($sel) && $overlay.hasClass("sso-open")) {
         _close();
         return;
      }

      $currentSel = $sel;
      var valorAtual = $sel.val();

      var $list = $overlay.find(".sso-list").empty();
      $overlay.find(".sso-input").val("");

      $sel.find("option").each(function () {
         var val = $(this).val();
         var txt = $(this).text().trim();
         if (txt === "" || val === "") return;
         var isSel = (val === valorAtual);
         var $li   = $('<li class="sso-option' + (isSel ? " sso-selected" : "") + '"></li>')
                        .data("val", val).text(txt);
         $list.append($li);
      });

      _position($sel);
      $overlay.addClass("sso-open");
      $overlay.find(".sso-input").focus();

      var $sel2 = $overlay.find(".sso-option.sso-selected");
      if ($sel2.length) { $sel2[0].scrollIntoView({ block: "nearest" }); }
   }
   // FECHA O OVERLAY DE BUSCA (SE HOUVER)
   function _close() {
      if ($overlay) $overlay.removeClass("sso-open");
      $currentSel = null;
   }
   // FILTRA A LISTA DE OPÇÕES DO OVERLAY DE BUSCA, MOSTRANDO SÓ AS QUE CONTÊM O TEXTO INFORMADO
   function _filter(q) {
      var lower = (q || "").toLowerCase();
      var $opts = $overlay.find(".sso-option");
      $opts.removeClass("sso-focused").each(function () {
         $(this).toggle($(this).text().toLowerCase().indexOf(lower) !== -1);
      });
      $overlay.find(".sso-option:visible:first").addClass("sso-focused");
   }
   // POSICIONA O OVERLAY DE BUSCA EM RELAÇÃO AO SELECT ESPECIFICADO
   function _position($sel) {
      var rect   = $sel[0].getBoundingClientRect();
      var $panel = $overlay.find(".sso-panel");
      $panel.css({
         top  : (rect.bottom + 3) + "px",
         left : rect.left + "px",
         width: Math.max(rect.width, 220) + "px",
         bottom: "auto"
      });
   }
   // APLICA O COMPORTAMENTO DE BUSCA PARA OS SELECTS ESPECIFICADOS (SELETOR JQUERY)
   window.aplicarBuscaSelect = function (seletor) {
      $(document)
         .off("mousedown.sso",   seletor)
         .off("keydown.ssoSel",  seletor)
         .on("mousedown.sso", seletor, function (e) {
            var $sel = $(this);
            if ($sel.hasClass("campo-bloqueado") || $sel.prop("disabled")) return;
            e.preventDefault();
            _open($sel);
         })
         .on("keydown.ssoSel", seletor, function (e) {
            var $sel = $(this);
            if ($sel.hasClass("campo-bloqueado") || $sel.prop("disabled")) return;
            if (e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp" ||
                (e.altKey && e.key === "ArrowDown")) {
               e.preventDefault();
               _open($sel);
            }
         });
   };
})();

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

      // PF não tem Contribuinte ICMS nem Regime Fiscal — oculta e não exige.
      $("#divIcms, #divRegimeFiscal").hide();
      $("#icms, #regimeFiscal").prop("required", false).val("");
      limparErroCampo("icms");
      limparErroCampo("regimeFiscal");

      aplicarAsteriscoObrigatorio();
      return;
   }

   $("#divDadosPF").hide();
   $("#dtNascimento, #estadoCivil, #docRgOrgao, #docRgUf").prop("required", false);

   // Não-PF (PJ): Contribuinte ICMS e Regime Fiscal voltam a valer.
   $("#divIcms, #divRegimeFiscal").show();
   $("#icms, #regimeFiscal").prop("required", true);


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
// CONTROLA OS CAMPOS DE ENDEREÇO PARA O CASO DE ENDEREÇO ESTRANGEIRO (CNPJ PJ)
function controlarEnderecoEstrangeiro(ativo) {
   const $estadoWrap = $("#divEstado .select-wrap");

   if (ativo) {
      $("#divCep").hide();
      $("#cep").prop("required", false);

      $("#endereco, #bairro").prop("readonly", false);
      $("#divPais").hide();
      $("#pais").prop("required", false);
      $("#divSelectPaisEstrangeiro").hide();
      $("#selectPaisEstrangeiro").prop("required", false);

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
      $("#divPais").show();
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

// CONTROLA A VISIBILIDADE DO ALERTA DE CNPJ INVÁLIDO (CATEGORIA PJ, NÃO ESTRANGEIRO)
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

// CONTROLA A VISIBILIDADE DO ALERTA DE RETENÇÃO 
function controlarRetencaoPorTipo() {
   return;
}

// VERIFICA SE O TIPO SELECIONADO É RDO
function _ehTipoRDO() {
   var texto = ($("#tipo option:selected").text() || "").toUpperCase();
   return /\bRDO\b/.test(texto);
}

// CONTROLA A VISIBILIDADE DO CAMPO NATUREZA DE RENDIMENTO
function controlarNaturezaPorTipo() {
   if (ehModoView()) {
      $("#divNaturezaRendimento").show();
      return;
   }

   var atividade = Number($("#atividade").val() || 0);
   var ehValidacao = (atividade === ATIVIDADES.VALIDACAO);

   if (_ehTipoRDO() || !ehValidacao) {
      $("#divNaturezaRendimento").hide();
      $("#naturezaRendimento").prop("required", false);
      limparErroCampo("naturezaRendimento");
      if (_ehTipoRDO()) {
         $("#naturezaRendimento").val("");
         $("#codNaturezaRendimento").val("");
         $("#idNatRendimento").val("");
      }
      return;
   }

   $("#divNaturezaRendimento").show();
   $("#naturezaRendimento").prop("required", true);
}

// CONTROLA A VISIBILIDADE DO PAINEL DE RETENÇÕES 
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

// RESETA O PAINEL DE RETENÇÕES
function resetarRetencao() {
   $("#toggleRetencao").prop("checked", false);
   $("#hiddenToggleRetencao").val("");
   $("#divRetencoesPanel").addClass("field-hidden");
   $(".retencao-item input").prop("checked", false);
   $(".retencao-item").removeClass("ativo");
   $("#hiddenIss, #hiddenInss, #hiddenInputIrrf, #hiddenCsll, #hiddenPis, #hiddenCofins").val("");
}

// VERIFICA SE O FORMULÁRIO ESTÁ EM MODO DE EDIÇÃO
function ehModoEdicao() {
   if (globalThis._modoEdicao === true) {
      return true;
   }
   var cod = ($("#codcfoEdicao").val() || "").toString().trim();
   return cod !== "" && cod !== "-1" && cod !== "0";
}

// CONTROLA A VISIBILIDADE DA SEÇÃO DE DOCUMENTAÇÃO 
function aplicarVisibilidadeDocumentacao() {
   var mostrar = !ehModoEdicao();
   $("#nav-step-Documentacao, #divDivisaoDocumentacao").toggle(mostrar);
}

// EXIBE OU OCULTA A SEÇÃO DE DADOS FISCAIS
function aplicarVisibilidadeDadosFiscais() {
   var atividade = Number($("#atividade").val() || 0);
   var esconder = (atividade === ATIVIDADES.INICIO_0 ||
                   atividade === ATIVIDADES.INICIO ||
                   atividade === ATIVIDADES.CORRECAO);

   // DADOS FISCAIS É A ÚLTIMA SEÇÃO DA ETAPA 2 (PREENCHIDA NA VALIDAÇÃO), GARANTINDO SUA POSIÇÃO APÓS CONTATOS INDEPENDENTEMENTE DA ORDEM DO HTML.
   var $fiscais = $("#divDadosFiscais");
   var $contatos = $("#divContatos");
   if ($fiscais.length && $contatos.length && !$contatos.next().is("#divDadosFiscais")) {
      $fiscais.insertAfter($contatos);
   }

   $fiscais.toggle(!esconder);
}

// LIBERA TODA A SEÇÃO DE DADOS FISCAIS PARA EDIÇÃO NA VALIDAÇÃO, INDEPENDENTEMENTE DA AÇÃO "EDITAR CAMPOS"
function liberarSecaoDadosFiscais() {
   var $sec = $("#divDadosFiscais");

   $sec.find("input:not([type='hidden']), select, textarea")
      .prop("disabled", false)
      .prop("readonly", false)
      .removeClass("campo-bloqueado campo-readonly");

   $sec.find("input[type='checkbox'], input[type='radio']")
      .prop("disabled", false)
      .removeClass("campo-bloqueado");

   $sec.find(".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap")
      .removeClass("campo-bloqueado disabled-upload");

   $sec.find("button")
      .removeClass("btn-bloqueado")
      .removeAttr("tabindex");

   // Alíquota IRRF é calculada a partir do Código de Receita -> mantém só leitura.
   $sec.find("#irrf").prop("readonly", true);
}

// RETORNA A LISTA DE ETAPAS VISÍVEIS
function getStepsVisiveis() {
   var visiveis = [];

   for (var step = 1; step <= 4; step++) {
      if ($(NAV_MAP[step]).is(":visible")) {
         visiveis.push(step);
      }
   }

   return visiveis;
}

// RETORNA O NÚMERO DA ETAPA ATUAL 
function getStepAtual() {
   var stepAtual = 1;

   for (var step = 1; step <= 4; step++) {
      if ($(NAV_MAP[step]).hasClass("active")) {
         stepAtual = step;
      }
   }

   return stepAtual;
}

// NAVEGA PARA A ETAPA ESPECIFICADA (1 A 4), COM OPÇÃO DE ANIMAÇÃO
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


   var visiveis = getStepsVisiveis();
   for (var i = 0; i < visiveis.length; i++) {
      var itemStep = visiveis[i];
      if (itemStep < step) {
         $(NAV_MAP[itemStep]).addClass("done");
      } else if (itemStep === step) {
         $(NAV_MAP[itemStep]).addClass("active");
      }
   }

   atualizarSetas();

   $("html, body").animate({ scrollTop: 0 }, 200);
}

// AVANÇA PARA A PRÓXIMA ETAPA VISÍVEL, VALIDANDO A ETAPA ATUAL ANTES DE PROSSEGUIR
function goToNextVisibleStep() {
   const ehView = ehModoView();

   // Valida mostrando o toast: se faltar algo, o usuário vê o motivo em vez de a
   // seta "não funcionar" silenciosamente (acontecia muito na edição).
   if (!ehView && !validarEtapaAtual(true)) {
      return;
   }

   const steps = getStepsVisiveis();
   const atual = getStepAtual();
   const index = steps.indexOf(atual);

   if (index < steps.length - 1) {
      goToStep(steps[index + 1]);
   }
}

// RETORNA PARA A ETAPA VISÍVEL ANTERIOR, SE HOUVER
function goToPrevVisibleStep() {
   const steps = getStepsVisiveis();
   const atual = getStepAtual();
   const index = steps.indexOf(atual);

   if (index > 0) {
      goToStep(steps[index - 1]);
   }
}

// CONTROLA A NAVEGAÇÃO DIRETA PELO STEPPER, VALIDANDO AS ETAPAS AO AVANÇAR E LIBERANDO O RETORNO OU A NAVEGAÇÃO NO MODO VISUALIZAÇÃO.
function navegarParaStep(destino) {
   if (typeof ehModoView === "function" && ehModoView()) {
      goToStep(destino);
      return;
   }

   var atual = getStepAtual();

   // Voltar (ou permanecer na mesma) é permitido sem validar.
   if (destino <= atual) {
      goToStep(destino);
      return;
   }

   var steps = getStepsVisiveis();
   var idxAtual = steps.indexOf(atual);
   var idxDest = steps.indexOf(destino);

   if (idxAtual < 0 || idxDest < 0) {
      goToStep(destino);
      return;
   }

   // Avança uma etapa por vez: torna cada etapa visível e valida antes de sair.
   // Para na primeira etapa incompleta (com o toast e os campos em erro à mostra).
   for (var i = idxAtual; i < idxDest; i++) {
      goToStep(steps[i], false);
      if (!validarEtapaAtual(true)) {
         return;
      }
   }

   goToStep(destino);
}

// ATUALIZA O ESTADO DOS BOTÕES DE NAVEGAÇÃO (SETAS) DE ACORDO COM A ETAPA ATUAL E AS ETAPAS VISÍVEIS
function atualizarSetas() {
   const steps = getStepsVisiveis();
   const atual = getStepAtual();
   const index = steps.indexOf(atual);

   $("#btn-voltar").prop("disabled", index === 0);
   $("#btn-avancar").prop("disabled", index === steps.length - 1);
}

// EXPANDE OU RECOLHE A SEÇÃO ESPECIFICADA (HEAD + BODY)
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

// BLOQUEIA TODOS OS CAMPOS DE TODAS AS ETAPAS (EXCETO BOTÕES DE NAVEGAÇÃO) PARA O MODO VIEW
const SELETOR_ETAPAS = "#divPreCadastro, #divDadosCadastrais, #divDocumentacao";
function bloquearTudoInicio() {
   var $etapas = $(SELETOR_ETAPAS);


   $etapas.find("input:not([type='hidden']), textarea")
      .prop("readonly", true)
      .addClass("campo-readonly");


   $etapas.find("select, input[type='checkbox'], input[type='radio']")
      .prop("disabled", false)
      .addClass("campo-bloqueado");


   $etapas.find(".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap")
      .addClass("campo-bloqueado");


   $etapas.find(".upload-area")
      .addClass("disabled-upload campo-bloqueado")
      .off("click");

   $etapas.find("button:not(.section-head):not(.btn-visualizar-anexo)")
      .addClass("btn-bloqueado")
      .attr("tabindex", "-1");


   $etapas.find(".upload-file-remove")
      .addClass("btn-bloqueado")
      .attr("tabindex", "-1");
}

// DESBLOQUEIA TODOS OS CAMPOS DE TODAS AS ETAPAS PARA EDIÇÃO (EXCETO BOTÕES DE NAVEGAÇÃO)     
function habilitarTudoInicio() {
   var $etapas = $(SELETOR_ETAPAS);

   $etapas.find("input:not([type='hidden']), select, textarea")
      .prop("disabled", false)
      .prop("readonly", false)
      .removeClass("campo-bloqueado campo-readonly");

   $etapas.find("input[type='checkbox'], input[type='radio']")
      .prop("disabled", false)
      .removeClass("campo-bloqueado");

   $etapas.find(".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap, .upload-area")
      .removeClass("campo-bloqueado disabled-upload");

   $etapas.find("button, .upload-file-remove")
      .removeClass("btn-bloqueado")
      .removeAttr("tabindex");

   inicializarUploadsFluig();
}

// VERIFICA SE O FORMULÁRIO ESTÁ EM MODO DE VISUALIZAÇÃO (VIEW)
function ehModoView() {
   return ($("#formMode").val() || "").toUpperCase() === "VIEW";
}

// MODO VIEW 
function configurarModoView() {

   document.documentElement.setAttribute("data-device", "desktop");
   $("body").removeClass("fluig-mobile");
   $("body").removeClass("menu-open-mobile");


   $("#btnEditarCamposInicio").hide();
   $("#btnAprovar").hide();
   $("#btnReprovar").hide();
   $("#divSelectDecisao").hide();


   $(".stepper-nav-wrap").css("display", "");
   $("#btn-voltar").css("display", "");
   $("#btn-avancar").css("display", "");


   $("#observacaoValidacao").prop("readonly", true).addClass("campo-readonly");

   ajustarCamposView();
   setTimeout(ajustarCamposView, 400);
   setTimeout(ajustarCamposView, 1000);
   setTimeout(ajustarCamposView, 2000);
   setTimeout(ajustarCamposView, 3000);
}

// AJUSTA OS CAMPOS PARA O MODO VIEW (READONLY)
function ajustarCamposView() {


   if (typeof controlarDocumentacaoPorCategoria === "function") {
      controlarDocumentacaoPorCategoria();
   }
   if (typeof restaurarUploadsSalvos === "function") {
      restaurarUploadsSalvos();
   }

   resolverSpansView();


   expandirTudoView();


   bloquearTudoInicio();

   
   normalizarSelectsView();

   $("#preCadastro span.form-control").addClass("campo-readonly");
}

// EXPANDE TODAS AS SEÇÕES PARA O MODO VIEW (READONLY)
function expandirTudoView() {


   $(".section-body").show();
   $(".section-arrow").addClass("open").text("▲");


   $("#divDadosComerciais").show();
   $("#divEndereco").show();
   $("#divMoedaGrupoMercadoria").show();
   $("#grupo-mercadoria-wrap").show();
   $("#divDadosBancarios").show();
   $(".cnae-box").show();
   $(".cnae-box").prev(".divider").show();
   $(".cnae-box").next(".divider").show();


   $("#preCadastro").find("input:not([type='hidden']), span.form-control, textarea").each(function () {
      var $campo = $(this);
      var valor;

      if ($campo.is("span")) {
         valor = $campo.text().trim();
      } else {
         valor = ($campo.val() || "").trim();
      }

      if (valor !== "" && valor !== "Selecione...") {
         $campo.closest(".fg, .cnae-box, .retencao-box, .bank-card").show();
      }
   });


   $("#preCadastro .upload-area.uploaded").closest(".fg").show();
}

// NORMALIZA OS SELECTS PARA O MODO VIEW (READONLY)
function normalizarSelectsView() {
   $("#formSolicitacao select").each(function () {
      var $select = $(this);


      $select.removeAttr("size");
      $select.removeAttr("multiple");
      $select.prop("size", 0);
      this.style.setProperty("display", "none", "important");

      var texto = "";
      var $opcao = $select.find("option:selected");
      if ($opcao.val()) {
         texto = $opcao.text().trim();
      }


      var $input = $select.data("viewInput");
      if (!$input || $input.length === 0) {
         $input = $('<input type="text" class="form-control campo-readonly" readonly tabindex="-1">');
         $select.after($input);
         $select.data("viewInput", $input);
      }
      $input.val(texto);
   });
}

// RESOLVE OS SPANS PARA O MODO VIEW (READONLY)
function resolverSpansView() {
   mostrarTextoDoSpan("tipo",                $("#tipoSelecionado").val());
   mostrarTextoDoSpan("naturezaRendimento",  $("#codNaturezaRendimento").val());
   mostrarTextoDoSpan("selectDescricaoIrrf", $("#hiddenCodIrrf").val());
   mostrarTextoDoSpan("estado",              $("#hiddenEstadoValor").val());
   mostrarTextoDoSpan("cidade",              $("#nomeCidadeSalva").val());


   var i;
   for (i = 1; i <= 9; i++) {
      mostrarTextoDoSpan("grupoMercadoria" + i, $("#hiddenGrupoMercadoria" + i).val());
   }
}

// MOSTRA O TEXTO DO OPTION SELECIONADO DENTRO DE UM SPAN (MODO VIEW)
function mostrarTextoDoSpan(idCampo, valorSalvo) {
   var $span = $("#" + idCampo);


   if ($span.length === 0) return;
   if (!$span.is("span")) return;

   var $options = $span.children("option");
   if ($options.length === 0) return;

   valorSalvo = (valorSalvo || "").trim();

   var texto = "";
   $options.each(function () {
      if (String($(this).attr("value")) === String(valorSalvo)) {
         texto = $(this).text();
         return false;
      }
   });

   $span.empty().text(texto);
}

// CONTROLA A EDIÇÃO DE CAMPOS NO INÍCIO, CORREÇÃO OU VALIDAÇÃO
function controlarEdicaoInicioValidacao() {
   var atividade = Number($("#atividade").val() || 0);
   var formMode  = ($("#formMode").val() || "").toUpperCase();

   // Dados Fiscais só aparecem na Validação (escondido no Início/Correção).
   aplicarVisibilidadeDadosFiscais();

   if (formMode === "VIEW") {
      configurarModoView();
      return;
   }


   if (atividade === ATIVIDADES.INICIO_0 ||
       atividade === ATIVIDADES.INICIO ||
       atividade === ATIVIDADES.CORRECAO ||
       atividade === ATIVIDADES.INTEGRACAO) {
      $("#btnEditarCamposInicio").hide();
      return;
   }

 
   bloquearTudoInicio();


   if (atividade === ATIVIDADES.VALIDACAO) {
      // Natureza de Rendimentos é preenchida pelo Suprimentos -> sempre editável nesta etapa,
      // mesmo sem clicar em "Editar campos".
      $("#naturezaRendimento").prop("disabled", false).removeClass("campo-bloqueado");
      // Toda a seção Dados Fiscais é preenchida nesta etapa -> liberada aqui.
      liberarSecaoDadosFiscais();
      $("#btnEditarCamposInicio").show();
      $("#btnEditarCamposInicio").off("click").on("click", function () {
         habilitarTudoInicio();
         $(this)
            .prop("disabled", true)
            .removeClass("btn-warning")
            .addClass("btn-success")
            .text("Edição liberada");
      });
      return;
   }
   $("#btnEditarCamposInicio").hide();
   $("#btnAprovar, #btnReprovar, #divSelectDecisao").hide();
   $("#observacaoValidacao").prop("readonly", true).addClass("campo-readonly");
}