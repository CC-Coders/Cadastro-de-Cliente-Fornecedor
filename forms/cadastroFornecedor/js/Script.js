
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

const TIPOS_COM_RETENCAO = [];
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

   // busca selects
   if (typeof aplicarBuscaSelect === "function") {
      aplicarBuscaSelect("#formSolicitacao select");
   }

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
      if (typeof controlarNaturezaPorTipo === "function") {
         controlarNaturezaPorTipo();
      }
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

   globalThis._cnpjJaConsultado = "";
   $(document).on("input", "#docCnpj", function () {
      let cnpj = normalizarCnpj($(this).val());

      if (cnpj.length === 14 && cnpj !== globalThis._cnpjJaConsultado) {
         globalThis._cnpjJaConsultado = cnpj;
         buscarCnpj(cnpj);
      }
   });


   globalThis._cpfJaConsultado = "";
   $(document).on("input", "#docCpf", function () {
      let cpf = ($(this).val() || "").replace(/\D/g, "");

      if (cpf.length === 11 && cpf !== globalThis._cpfJaConsultado) {
         globalThis._cpfJaConsultado = cpf;
         verificarCpfDuplicado(cpf);
      }
   });

   setTimeout(function () {
      controlarEdicaoInicioValidacao();
      controlarBotoesImprimir();
      if (typeof aplicarVisibilidadeDocumentacao === "function") {
         aplicarVisibilidadeDocumentacao();
      }
      if (typeof realcarCamposAlterados === "function") {
         var atvAtual = Number($("#atividade").val() || 0);
         if (atvAtual === ATIVIDADES.VALIDACAO || atvAtual === ATIVIDADES.CORRECAO) {
            realcarCamposAlterados();
         }
      }
   }, 600);

   $("#preCadastro").css("visibility", "visible");

   inicializarTelaSelecao();
});


function inicializarTelaSelecao() {
   var atividade = Number($("#atividade").val() || 0);
   var modo = ($("#formMode").val() || "").toUpperCase();
   var ehAberturaNova = (atividade === ATIVIDADES.INICIO_0 || atividade === ATIVIDADES.INICIO) && modo !== "VIEW";

   if (!ehAberturaNova) {
      return;
   }

   $("#formSolicitacao > header, #preCadastro").hide();
   $("#telaSelecaoInicial").addClass("tsi-ativo");

   $("#btnSelCadastrar").off("click").on("click", function () {
      $("#telaSelecaoInicial").removeClass("tsi-ativo");
      $("#formSolicitacao > header, #preCadastro").show();
   });

   $("#btnSelEditar").off("click").on("click", function () {
      if (typeof abrirModalEdicao === "function") {
         abrirModalEdicao();
      }
   });
}


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
   var $secoes = $("#divDadosComerciais, #divEndereco");
   $secoes.find(".section-body").show();
   $secoes.find(".section-arrow").addClass("open").text("▲");
   $secoes.stop(true, true).slideDown(300);
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

   for (var i = 0; i < funcoesIniciais.length; i++) {
      try {
         funcoesIniciais[i]();
      } catch (error_) {
         console.error("Erro ao sincronizar estado inicial:", error_);
      }
   }


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
      if (typeof controlarNaturezaPorTipo === "function") {
         controlarNaturezaPorTipo();
      }
      
      if (($("#categoria").val() || "") === "F") {
         $("#divIcms, #divRegimeFiscal").hide();
         $("#icms, #regimeFiscal").prop("required", false);
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
            }
         }
      }

      var valorGrupo1 = ($("#hiddenGrupoMercadoria1").val() || "").trim();
      if (valorGrupo1 && !$("#grupoMercadoria1").val()) {
         $("#grupoMercadoria1").val(valorGrupo1);
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


   var impostos = ["inss", "csll", "pis", "cofins"];
   for (var i = 0; i < impostos.length; i++) {
      var $cb = $("#" + impostos[i]);
      if (_checkboxAtivo($cb)) {
         $cb.prop("checked", true).closest(".retencao-item").addClass("ativo");
      }
   }


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

   for (let i = 0; i < cnaesSalvos.length; i++) {
      adicionarCnae();

      const campo = $("#cnaeSecundario" + (i + 1));
      campo.val(cnaesSalvos[i]);
      aplicarMascaraCnae(campo);
   }

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
   $("#btnAprovar").removeClass("btn-primary").addClass("btn-success");
   $("#btnReprovar").removeClass("btn-primary").addClass("btn-danger");

   $(botaoSelecionado).removeClass("btn-success btn-danger").addClass("btn-primary");
}