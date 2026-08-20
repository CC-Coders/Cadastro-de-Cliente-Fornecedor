
// GLOBAL CONSTANTS
globalThis.LIMITE_CNAE_SECUNDARIO = globalThis.LIMITE_CNAE_SECUNDARIO || 5;
globalThis.LIMITE_GRUPO_MERCADORIA = 9;

// CONSTANTES DE MAPEAMENTO DE CAMPOS DINÂMICOS
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

// CONSTANTES DE MAPEAMENTO DE ATIVIDADES
const ATIVIDADES = {
  INICIO_0: 0,
  INICIO: 4,
  VALIDACAO: 11,
  INTEGRACAO: 16,
  ERRO_INTEGRACAO: 19,
  CORRECAO: 27
  
};

// CONFIGURA OS TOASTS DO FLUIG PARA FECHAREM AUTOMATICAMENTE APÓS 4 SEGUNDOS E REMOVE SUAS BORDAS VISUAIS.
(function () {
  // Aplica timeout de 4s a todos os toasts do Fluig e injeta o CSS que remove suas bordas.
  function configurarToasts() {
    try {
      if (typeof FLUIGC !== "undefined" && FLUIGC.toast && !FLUIGC._toast4s) {
        var _toastOriginal = FLUIGC.toast;
        FLUIGC.toast = function (opts) {
          opts = opts || {};
          opts.timeout = 4000;
          return _toastOriginal.call(FLUIGC, opts);
        };
        FLUIGC._toast4s = true;
      }
    } catch (e) {
      console.warn("[toast] timeout:", e);
    }
    
    var css =
    '.fluig-style-guide.fluig-toast .alert{margin:0 !important;}' +
    '.toast,.toaster,.fluig-toast,[class*="toaster"]{border:0 !important;outline:0 !important;}';
    
    // INJETA O CSS PARA REMOVER AS BORDAS DOS TOASTS
    function injetar(doc) {
      try {
        if (!doc || doc.getElementById("cssToastSemBorda")) return;
        var st = doc.createElement("style");
        st.id = "cssToastSemBorda";
        st.textContent = css;
        (doc.head || doc.documentElement).appendChild(st);
      } catch (e) {}
    }
    injetar(document);
    try { injetar(window.parent.document); } catch (e) {}
    
    _autoDismissToasts(document);
    try { _autoDismissToasts(window.parent.document); } catch (e) {}
  }
  
  // Observa o container de toasts e fecha cada alerta automaticamente após 4s.
  function _autoDismissToasts(doc) {
    if (!doc) return;

    // Agenda o fechamento de um alerta após 4s (clica no .close ou remove o nó).
    function dispensar(alertEl) {
      if (!alertEl || alertEl._autoDismissOk) return;
      alertEl._autoDismissOk = true;
      setTimeout(function () {
        try {
          var btn = alertEl.querySelector(".close, [data-dismiss]");
          if (btn) btn.click();
          else if (alertEl.parentNode) alertEl.parentNode.removeChild(alertEl);
        } catch (e) {}
      }, 4000);
    }
    
    // Liga um MutationObserver no toaster para auto-dispensar cada .alert que aparecer.
    function observar(toaster) {
      if (!toaster || toaster._autoDismissObs) return;
      toaster._autoDismissObs = true;
      Array.prototype.forEach.call(toaster.querySelectorAll(".alert"), dispensar);
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.classList && n.classList.contains("alert")) dispensar(n);
            else if (n.querySelectorAll) {
              Array.prototype.forEach.call(n.querySelectorAll(".alert"), dispensar);
            }
          });
        });
      }).observe(toaster, { childList: true });
    }
    
    var t = doc.getElementById("toaster") || doc.querySelector(".fluig-toast.toaster, .toaster, .fluig-toast");
    if (t) { observar(t); return; }
    
    try {
      new MutationObserver(function () {
        var tt = doc.getElementById("toaster") || doc.querySelector(".fluig-toast.toaster, .toaster, .fluig-toast");
        if (tt) observar(tt);
      }).observe(doc.body || doc.documentElement, { childList: true });
    } catch (e) {}
  }
  
  configurarToasts();
  if (typeof $ === "function") {
    $(configurarToasts);
  }
})();

// VARIÁVEL GLOBAL PARA INDICAR QUE O FORMULÁRIO ESTÁ EM PROCESSO DE RESTAURAÇÃO DE CAMPOS DINÂMICOS
window._formRestaurando = true;

// INICIALIZA O FORMULÁRIO, CARREGA DADOS, CONFIGURA EVENTOS E APLICA AS REGRAS INICIAIS DA TELA
$(document).ready(function () {
  inicializarTela();
  inicializarMascaras();
  carregarTiposClienteFornecedor();
  carregarNaturezaRendimento();
  carregarOpcoesIrrf(true);
  popularSelectsGrupoMercadoria();
  popularSelectEstado();
  bindEventos();
  initFooterCadastro();
  aplicarLayoutMobile();
  
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
  aplicarBarraProcessoCadastro();
  controlarStepperHistorico();
  
  if ($("#categoria").val()) {
    abrirDadosComerciais();
  } else {
    fecharDadosComerciais();
  }
  
  // CONTROLA A ABERTURA DOS DADOS COMERCIAIS CONFORME A CATEGORIA SELECIONADA
  $("#categoria").off("change.abrirDadosComerciais").on("change.abrirDadosComerciais", function () {
    if ($(this).val()) {
      abrirDadosComerciais();
    } else {
      fecharDadosComerciais();
    }
  });
  
  // ATUALIZA OS DADOS DO TIPO SELECIONADO E APLICA SUAS REGRAS
  $("#tipo").on("change", function () {
    let texto = $("#tipo option:selected").text();
    $("#tipoSelecionado").val($(this).val());
    $("#tipoDescricao").val(texto);
    if (typeof controlarNaturezaPorTipo === "function") {
      controlarNaturezaPorTipo();
    }
    if (typeof aplicarRegrasPfRdo === "function") {
      aplicarRegrasPfRdo();
    }
  });
  
  // DEFINE O REGIME FISCAL AUTOMATICAMENTE CONFORME A OPÇÃO PELO SIMPLES NACIONAL
  $(document).on("change", "#toggleSimplesNacional", function () {
    
    if ($(this).is(":checked")) {
      
      
      $("#regimeFiscal")
        .val("04")
        .prop("disabled", false)
        .addClass("campo-bloqueado")
        .attr("data-bloqueado", "1")
        .trigger("change");
      
      $("#regimeFiscalHidden").val("04");
      
    } else {
      
      $("#regimeFiscal")
        .prop("disabled", false)
        .removeClass("campo-bloqueado")
        .removeAttr("data-bloqueado")
        .val("")
        .trigger("change");
      
      $("#regimeFiscalHidden").val("");
      
    }
    
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
    ocultarEnviarNativoFluig();
    prepararAcoesValidacao();
    prepararEnvioInicio();
    if (typeof aplicarVisibilidadeDocumentacao === "function") {
      aplicarVisibilidadeDocumentacao();
    }
    if (typeof realcarCamposAlterados === "function") {
      var atvAtual = Number($("#atividade").val() || 0);
      if (atvAtual === ATIVIDADES.VALIDACAO || atvAtual === ATIVIDADES.CORRECAO) {
        realcarCamposAlterados();
      }
    }
  }, 100);
  
  $("#preCadastro").css("visibility", "visible");
  
  inicializarTelaSelecao();
});

// DEFINE A DECISÃO COMO APROVAÇÃO E ACIONA O ENVIO DO PROCESSO PELO FLUIG
$(document).on("click", "#btnAprovar", function () {
  $("#selectDecisao").val("enviarRm").trigger("change");
  acionarEnvioFluig();
});

// DEFINE A DECISÃO COMO REPROVAÇÃO E ACIONA O ENVIO DO PROCESSO PELO FLUIG
$(document).on("click", "#btnReprovar", function () {
  $("#selectDecisao").val("Correcao").trigger("change");
  acionarEnvioFluig();
});

// ACIONA O ENVIO DA SOLICITAÇÃO PELO BOTÃO NATIVO DO FLUIG
$(document).on("click", "#btnEnviarSolicitacao", function () {
  acionarEnvioFluig();
});

// APLICA AS REGRAS DE CADASTRO ASSERTIVO APÓS ALTERAÇÃO DA CLASSIFICAÇÃO OU CATEGORIA DO CADASTRO
$(document).on("change", "#classificacao, #categoria", function () {
  setTimeout(function () {
    if (typeof aplicarRegrasCadastroAssertivo === "function") aplicarRegrasCadastroAssertivo();
  }, 0);
});

// ATUALIZA A NATUREZA DE RENDIMENTO CONFORME ALTERAÇÃO DOS GRUPOS DE MERCADORIA SELECIONADOS
$(document).on("change", ".grupo-mercadoria", function () {
  setTimeout(function () {
    if (typeof _forcarNaturezaAluguel === "function") _forcarNaturezaAluguel();
  }, 0);
});

// NA ABERTURA DE UM NOVO PROCESSO, EXIBE A TELA DE SELEÇÃO CADASTRAR/EDITAR E CONFIGURA SEUS BOTÕES
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

// OCULTA OS BOTÕES DE "IMPRIMIR" NO FORMULÁRIO E NO PARENT QUANDO O PROCESSO NÃO ESTIVER EM MODO DE VISUALIZAÇÃO
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

// CONFIGURA O ESTADO INICIAL DA TELA, EXIBINDO SEÇÕES, POSICIONANDO NA ETAPA 1, BLOQUEANDO ENDEREÇO E DEFININDO PAÍS COMO BRASIL
function inicializarTela() {
  $(".section-body").show();
  
  goToStep(1, false);
  
  $("#divDadosFornecedor .section-body").show();

  if ($("#categoria").val()) {
    abrirDadosComerciais();
  } else {
    fecharDadosComerciais();
  }
  
  $("#divCpf, #divCnpj, #divNomeFantasia, #divRg, #divInscricaoEstadual").hide();
  // Endereço livre para digitação: o CEP apenas sugere o preenchimento, não trava os campos.
  if (!($("#pais").val() || "").trim()) {
    $("#pais").val("Brasil");
  }
  $("#divSelectPaisEstrangeiro").hide();
}

// OCULTA AS SEÇÕES DE DADOS COMERCIAIS E ENDEREÇO
function fecharDadosComerciais() {
  $("#divDadosComerciais, #divEndereco").hide();
}

// EXIBE AS SEÇÕES DE DADOS COMERCIAIS E ENDEREÇO
function abrirDadosComerciais() {
  var $secoes = $("#divDadosComerciais, #divEndereco");
  $secoes.find(".section-body").show();
  $secoes.show();
}

// EXECUTA AS ROTINAS DE SINCRONIZAÇÃO INICIAL DO FORMULÁRIO, ATUALIZANDO CLASSIFICAÇÃO, CATEGORIA, RETENÇÕES, RESTAURAÇÕES E STEPPER
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
    atualizarSetas
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
    
    restaurarRegimeFiscal();
    
    if (typeof aplicarRegrasCadastroAssertivo === "function") {
      aplicarRegrasCadastroAssertivo();
    }
    
  }, 1200);
}

// RESTAURA OS CHECKBOXES SALVOS APÓS O CARREGAMENTO DA PÁGINA, AGUARDANDO A INICIALIZAÇÃO DOS COMPONENTES DO FORMULÁRIO
$(globalThis).on("load", function () {
  setTimeout(restaurarCheckboxesSalvos, 400);
});

// VERIFICA SE UM CHECKBOX OU TOGGLE ESTÁ ATIVO, CONSIDERANDO O VALOR DO CAMPO HIDDEN E OS ATRIBUTOS CHECKED/VALUE
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

// RESTAURA O ESTADO DOS TOGGLES SALVOS, INCLUINDO RETENÇÃO, IMPOSTOS, ESTRANGEIRO, SIMPLES NACIONAL E DEPENDENTES
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
  
  reposicionarBotaoAdicionarGrupo();
}

// RESTAURA O REGIME FISCAL SALVO, FORÇANDO "04"/SIMPLES E BLOQUEANDO O CAMPO QUANDO O SIMPLES NACIONAL ESTIVER ATIVO
function restaurarRegimeFiscal() {
  const $sel = $("#regimeFiscal");
  if (!$sel.length) return;
  
  const simples = $("#toggleSimplesNacional").is(":checked");
  
  if (simples) {
    $sel.val("04")
      .prop("disabled", false)
      .addClass("campo-bloqueado")
      .attr("data-bloqueado", "1");
    $("#regimeFiscalHidden").val("04");
    return;
  }
  
  const salvo = ($sel.attr("value") || $sel.val() || $("#regimeFiscalHidden").val() || "").trim();
  if (salvo) {
    $sel.val(salvo);
  }
}

// RECRIA OS CAMPOS DE CNAE SECUNDÁRIO A PARTIR DOS VALORES SALVOS NOS CAMPOS HIDDEN E APLICA A MÁSCARA DE FORMATAÇÃO
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

// APLICA A BARRA DE PROGRESSO COMPARTILHADA (castilhoWizard.js) E, EM MODO VIEW, FORÇA A ETAPA "VALIDAÇÃO" (REGRA PRÓPRIA DO CADASTRO)
function aplicarBarraProcessoCadastro() {
  aplicarBarraProcesso();

  const formMode = ($("#formMode").val() || "").toUpperCase();
  if (formMode === "VIEW") {
    const $steps = $(".castilhoWizard-progress .step");
    $steps.removeClass("active completed");
    $steps.eq(0).addClass("completed");
    $steps.eq(1).addClass("active");
  }
}

// LIGA OS EVENTOS DO RODAPÉ (SETAS E CARDS DE ETAPA) — o clique nos cards e no "Próximo" passa pela
// validação da etapa atual (regra própria do Cadastro, ausente no motor compartilhado castilhoFooter.js).
function initFooterCadastro() {
  $(".castilho-footer .step-item").on("click", function () {
    var destino = getStepPorDataTab($(this).data("tab"));
    if (destino) navegarParaStep(destino);
  });
  $("#btnTabAnt").on("click", goToPrevVisibleStep);
  $("#btnTabNext").on("click", avancarComValidacao);
}

// CONVERTE O DATA-TAB NO NÚMERO DO STEP CORRESPONDENTE.
function getStepPorDataTab(dataTab) {
  for (var i = 0; i < ABAS.length; i++) {
    if (ABAS[i].dataTab === dataTab) return i + 1;
  }
  return 0;
}

// AVANÇA PARA A PRÓXIMA ETAPA VISÍVEL, VALIDANDO A ETAPA ATUAL ANTES DE PROSSEGUIR (regra própria do Cadastro)
function avancarComValidacao() {
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

// DESTACA O BOTÃO DE DECISÃO SELECIONADO (APROVAR/REPROVAR) COMO PRIMARY E RESTAURA O ESTADO DO BOTÃO OPOSTO
function destacarBotao(botaoSelecionado) {
  $("#btnAprovar").removeClass("btn-primary").addClass("btn-success");
  $("#btnReprovar").removeClass("btn-primary").addClass("btn-danger");
  
  $(botaoSelecionado).removeClass("btn-success btn-danger").addClass("btn-primary");
}

// EXECUTA NOVA TENTATIVA DAS AÇÕES DA BARRA APÓS 1 SEGUNDO, OCULTANDO O ENVIO NATIVO E RECONFIGURANDO OS BOTÕES DE VALIDAÇÃO/INÍCIO
setTimeout(function () {
  ocultarEnviarNativoFluig();
  prepararAcoesValidacao();
  prepararEnvioInicio();
}, 1000);