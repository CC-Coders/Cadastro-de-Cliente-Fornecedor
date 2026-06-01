
(function () {
   "use strict";

   var $overlay    = null;   
   var $currentSel = null;   


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

   function _close() {
      if ($overlay) $overlay.removeClass("sso-open");
      $currentSel = null;
   }


   function _filter(q) {
      var lower = (q || "").toLowerCase();
      var $opts = $overlay.find(".sso-option");
      $opts.removeClass("sso-focused").each(function () {
         $(this).toggle($(this).text().toLowerCase().indexOf(lower) !== -1);
      });
      $overlay.find(".sso-option:visible:first").addClass("sso-focused");
   }

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


globalThis.LIMITE_CNAE_SECUNDARIO = globalThis.LIMITE_CNAE_SECUNDARIO || 5;
globalThis.LIMITE_GRUPO_MERCADORIA = 9;


const PANEL_MAP = {
   1: "#divPreCadastro",
   2: "#divDadosCadastrais",
   3: "#divDocumentacao",
   4: "#paginaHistorico"
};


const NAV_MAP = {
   1: "#nav-step-PreCad",
   2: "#nav-step-DadosCadastrais",
   3: "#nav-step-Documentacao",
   4: "#nav-step-HistoricoDecisao"
};


const OPCOES_GRUPO_MERCADORIA = [
   "Materiais de Construção",
   "Equipamentos e Máquinas",
   "Serviços de Engenharia",
   "Combustíveis e Lubrificantes",
   "Serviços Administrativos",
   "Tecnologia e TI",
   "Seguro e Apólices"
];


const ATIVIDADES = {
   INICIO_0: 0,         
   INICIO: 4,           
   VALIDACAO: 11,       
   INTEGRACAO: 16,      
   ERRO_INTEGRACAO: 19, 
   CORRECAO: 27         
            
};

window._formRestaurando = true;
$(document).ready(function () {
   inicializarTela();
   inicializarMascaras();
   carregarTiposClienteFornecedor();
   carregarNaturezaRendimento();
   carregarOpcoesIrrf(true);
   popularSelectsGrupoMercadoria(); 
   popularSelectEstado();            
   bindEventos();
   aplicarLayoutMobile();
   aplicarBuscaSelect("#formSolicitacao select");
   inicializarUploadsFluig();

   try {
      sincronizarEstadoInicial();
   } catch (error_) {
      console.error("Erro em sincronizarEstadoInicial:", error_);
   }

   restaurarUploadsSalvos();
   aplicarAsteriscoObrigatorio();
   aplicarBarraProcesso();
   controlarStepperHistorico();

   if ($("#categoria").val()) {
      abrirDadosComerciais();
   } else {
      fecharDadosComerciais();
   }

   $("#categoria").off("change.abrirDadosComerciais").on("change.abrirDadosComerciais", function () {
      if ($(this).val()) {
         abrirDadosComerciais();
      } else {
         fecharDadosComerciais(true); 
      }
   });

   $("#tipo").on("change", function () {
      let texto = $("#tipo option:selected").text();
      $("#tipoSelecionado").val($(this).val());
      $("#tipoDescricao").val(texto);
   });

   $("#divDadosComerciais .section-head")
      .off("click.toggleDadosComerciais")
      .on("click.toggleDadosComerciais", function () {
         const body = $("#divDadosComerciais .section-body");
         const seta = $("#divDadosComerciais .section-arrow");

         body.stop(true, true).slideToggle(500);
         seta.toggleClass("open");
         seta.text(seta.hasClass("open") ? "▲" : "▼");
      });

   let cnpjJaConsultado = "";
   $(document).on("input", "#docCnpj", function () {
      let cnpj = normalizarCnpj($(this).val());

      if (cnpj.length === 14 && cnpj !== cnpjJaConsultado) {
         cnpjJaConsultado = cnpj;
         buscarCnpj(cnpj);
      }
   });

   setTimeout(function () {
      controlarEdicaoInicioValidacao();
      controlarBotoesImprimir();
   }, 600);

   $("#preCadastro").css("visibility", "visible");

});


function controlarBotoesImprimir() {
   const formMode = ($("#formMode").val() || "").toUpperCase();

   if (formMode === "VIEW") return;


   $("button, .btn, input[type='button']").filter(function () {
      return /imprimir/i.test($(this).text().trim() + ($(this).val() || ""));
   }).hide();

   try {
      if (parent && parent.$ && parent.document !== document) {
         parent.$("button, .btn").filter(function () {
            return /imprimir/i.test(parent.$(this).text().trim());
         }).hide();
      }
   } catch (_) { }
}


function inicializarTela() {
   $(".section-body").show();

   goToStep(1, false);

   $("#divDadosFornecedor .section-body").show();
   $("#divDadosFornecedor .section-arrow").addClass("open").text("▲");

   if ($("#categoria").val()) {
      abrirDadosComerciais();
   } else {
      fecharDadosComerciais();
   }

  
   $("#divCpf, #divCnpj, #divNomeFantasia, #divRg, #divInscricaoEstadual").hide();
   $("#endereco, #bairro, #cidade, #estado").prop("readonly", true);

   $("#pais").prop("readonly", true);
   if (!($("#pais").val() || "").trim()) {
      $("#pais").val("Brasil");
   }
   $("#divSelectPaisEstrangeiro").hide();
}
function fecharDadosComerciais(animar) {

   if (animar) {
      $("#divDadosComerciais, #divEndereco").stop(true, true).slideUp(300);
   } else {
      $("#divDadosComerciais, #divEndereco").hide();
   }
}
function abrirDadosComerciais() {
   ["#divDadosComerciais", "#divEndereco"].forEach(function (id) {
      var $sec = $(id);
      $sec.find(".section-body").show();
      $sec.find(".section-arrow").addClass("open").text("▲");
      $sec.stop(true, true).slideDown(300);
   });
}
function sincronizarEstadoInicial() {
   const funcoesIniciais = [
      controlarCamposClassificacao,      
      controlarCamposCategoria,          
      controlarAlertaCnpj,               
      controlarRetencaoPorTipo,          
      controlarDocumentacaoPorCategoria, 
      restaurarGruposMercadoriaSalvos,   
      restaurarCnaesSecundariosSalvos,   
      restaurarEnderecoRM,               
      controlarBotaoAdicionarCnae,      
      controlarBotaoAdicionarGrupoMercadoria,
      inicializarDadosBancarios, 
      atualizarSetas,                    
      atualizarLayoutStepper             
   ];

   funcoesIniciais.forEach(function (funcao) {
      try {
         funcao();
      } catch (error_) {
         console.error("Erro ao sincronizar estado inicial:", error_);
      }
   });


   setTimeout(function () {
      window._formRestaurando = false;
      inicializarSnapshotEdicaoValidacao();
   }, 2000);
   setTimeout(function () {
      var valorTipo = ($("#tipo").attr("value") || $("#tipo").val() || "").trim();
      if (valorTipo) {
         $("#tipo").val(valorTipo);
         var textoTipo = $("#tipo option:selected").text();
         $("#tipoSelecionado").val(valorTipo);
         $("#tipoDescricao").val(textoTipo);
      }
      var ufSalvo = ($("#hiddenEstadoValor").val() || "").trim();
      if (ufSalvo && !$("#estado").val()) {
         $("#estado").val(ufSalvo);
         popularSelectMunicipio(ufSalvo);
      }
      var ufAtual = ($("#hiddenEstadoValor").val() || $("#estado").val() || "").trim();
      if (ufAtual && !$("#cidade").val()) {
         var nomeSalvo = ($("#nomeCidadeSalva").val() || "").trim();
         if (nomeSalvo) {
      
            if ($("#cidade option").length <= 1) {
               popularSelectMunicipio(ufAtual);
            }
            $("#cidade").val(nomeSalvo);
            var $optCidade = $("#cidade").find("option:selected");
            if ($optCidade.val()) {
               $("#codMunicipio").val($optCidade.data("cod") || "");
               console.log("[1200ms] Cidade restaurada:", nomeSalvo);
            } else {
               console.warn("[1200ms] Cidade '" + nomeSalvo + "' não encontrada nas opções do select.");
            }
         }
      }

      var valorGrupo1 = ($("#hiddenGrupoMercadoria1").val() || "").trim();
      if (valorGrupo1 && !$("#grupoMercadoria1").val()) {
         $("#grupoMercadoria1").val(valorGrupo1);
         console.log("[1200ms] Grupo de mercadoria 1 restaurado:", valorGrupo1);
      }

   }, 1200);
}


$(globalThis).on("load", function () {
   setTimeout(restaurarCheckboxesSalvos, 400);
});

function _checkboxAtivo($el) {

   const hiddenId = $el.attr("id") ? "#hidden" + $el.attr("id").charAt(0).toUpperCase() + $el.attr("id").slice(1) : "";
   const hiddenVal = hiddenId ? ($(hiddenId).val() || "") : "";

   if (hiddenVal !== "") {
      return hiddenVal === "on";
   }

   const attrChecked = ($el.attr("checked") || "").toLowerCase();
   const attrValue   = ($el.attr("value")   || "").toLowerCase();
   const isChecked   = $el.is(":checked");

   console.log("[restaurarCheckboxesSalvos] fallback #" + $el.attr("id"),
      "| is(:checked):", isChecked,
      "| attr(checked):", attrChecked,
      "| attr(value):",   attrValue,
      "| val():",         $el.val()
   );

   return isChecked ||
          attrChecked === "checked" || attrChecked === "on" || attrChecked === "true" ||
          attrValue   === "on"      || attrValue   === "true";
}

function restaurarCheckboxesSalvos() {

   const $toggleRetencao = $("#toggleRetencao");
   const retencaoAtiva = _checkboxAtivo($toggleRetencao);
   if (retencaoAtiva) {
      $toggleRetencao.prop("checked", true);
      controlarPainelRetencoes();
   }


   ["iss", "inss", "inputIrrf", "csll", "pis", "cofins"].forEach(function (id) {
      const $cb = $("#" + id);
      if (_checkboxAtivo($cb)) {
         $cb.prop("checked", true).closest(".retencao-item").addClass("ativo");
      }
   });


   const $toggleEst = $("#toggleEstrangeiro");
   const estrangeiroAtivo = _checkboxAtivo($toggleEst);
   if (estrangeiroAtivo) {
      $toggleEst.prop("checked", true);
      controlarCamposCategoria();
      controlarAlertaCnpj();
   }

   const $toggleSN = $("#toggleSimplesNacional");

   const simplesAtivo = _checkboxAtivo($toggleSN) ||
                        ($("#simplesNacional").val() || "").trim() === "1";
   if (simplesAtivo) {
      $toggleSN.prop("checked", true);
      $("#hiddenToggleSimplesNacional").val("on");
      $("#simplesNacional").val("1");
   }

   const $toggleDep = $("#toggleDependentes");
   const dependentesAtivo = _checkboxAtivo($toggleDep);
   if (dependentesAtivo) {
      $toggleDep.prop("checked", true);
      controlarCamposDependentes();
   }

   if (typeof validarPainelRetencaoVisual === "function") {
      validarPainelRetencaoVisual();
   }
}


// RESTAURAÇÃO DE CAMPOS DINÂMICOS
function restaurarGruposMercadoriaSalvos() {

   const valorGrupo1 = ($("#hiddenGrupoMercadoria1").val() || "").trim();
   if (valorGrupo1 && !$("#grupoMercadoria1").val()) {
      $("#grupoMercadoria1").val(valorGrupo1);
   }

   for (let i = 2; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const valor = ($("#hiddenGrupoMercadoria" + i).val() || "").trim();

      if (valor && !$("#grupoMercadoria" + i).length) {
         adicionarGrupoMercadoria();
         const $sel = $("#grupoMercadoria" + i);
         $sel.val(valor);
      }
   }
}
function restaurarCnaesSecundariosSalvos() {
   const limite = globalThis.LIMITE_CNAE_SECUNDARIO || 5;

   const cnaesSalvos = [];

   for (let i = 1; i <= limite; i++) {
      const valor = ($("#hiddenCnaeSecundario" + i).val() || "").trim();
      if (valor) cnaesSalvos.push(valor);
   }


   $("#cnae-secundarios-wrap .cnae-secundario-item").remove();
   cnaesSalvos.forEach(function (valor, index) {
      adicionarCnae();

      const campo = $("#cnaeSecundario" + (index + 1));

      campo.val(valor);
      aplicarMascaraCnae(campo);
   });

   sincronizarCamposDinamicosHidden();
}



function aplicarBarraProcesso() {
   const atividade = Number($("#atividade").val() || 0);
   const formMode  = ($("#formMode").val() || "").toUpperCase();
   const $steps    = $(".wizard-progress .step");

   let indiceAtual = 0;

   if (formMode === "VIEW") {
      indiceAtual = 1;
   } else if (atividade === ATIVIDADES.INICIO_0 || atividade === ATIVIDADES.INICIO || atividade === ATIVIDADES.CORRECAO) {
      indiceAtual = 0;
   } else if (atividade === ATIVIDADES.VALIDACAO) {
      indiceAtual = 1;
   } else if (atividade === ATIVIDADES.INTEGRACAO || atividade === ATIVIDADES.ERRO_INTEGRACAO) {
      indiceAtual = 2;
   }

   $steps.removeClass("active completed");

   $steps.each(function (index) {
      if (index < indiceAtual) {
         $(this).addClass("completed");
      }

      if (index === indiceAtual) {
         $(this).addClass("active");
      }
   });
}
function atualizarLayoutStepper() {
   const historicoVisivel = $("#nav-step-HistoricoDecisao").is(":visible");

   $(".stepper")
      .toggleClass("stepper-4", historicoVisivel)
      .toggleClass("stepper-3", !historicoVisivel);
}
function destacarBotao(botaoSelecionado) {
   $("#btnAprovar, #btnReprovar")
      .removeClass("btn-primary")
      .addClass(function () {
         return this.id === "btnAprovar" ? "btn-success" : "btn-danger";
      });

   $(botaoSelecionado)
      .removeClass("btn-success btn-danger")
      .addClass("btn-primary");
}