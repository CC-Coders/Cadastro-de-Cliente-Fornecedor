
// PONTO DE ENTRADA DO FORMULÁRIO.
// O #preCadastro nasce com visibility:hidden para não piscar enquanto é montado, e é
// revelado aqui no finally: se algum passo falhar, o usuário vê o formulário (ainda que
// incompleto) e o erro no console, em vez de uma tela permanentemente em branco.
$(document).ready(function () {
  try {
    inicializarFormulario();
  } catch (erro) {
    console.error("[Cadastro] Falha ao inicializar o formulário:", erro);
    FLUIGC.toast({
      title: "Erro ao carregar o formulário",
      message: "Parte da tela pode não ter sido montada. Veja o console (F12) para o detalhe.",
      type: "danger"
    });
  } finally {
    $("#preCadastro").css("visibility", "visible");
  }
});

// MONTA A TELA, CARREGA AS LISTAS DO RM, LIGA OS EVENTOS E SÓ ENTÃO APLICA O CAMPO
// DE BUSCA — que precisa das options já no lugar.
function inicializarFormulario() {
  inicializarTela();
  inicializarMascaras();

  carregarTiposClienteFornecedor();
  carregarNaturezaRendimento();
  carregarOpcoesIrrf(true);
  carregarPaisesEstrangeiros();
  popularSelectsGrupoMercadoria();
  popularSelectEstado();

  bindEventos();
  bindEventosCadastro();
  initFooterCadastro();
  aplicarLayoutMobile();
  inicializarUploadsFluig();

  aplicarBuscaSelect(SELETOR_BUSCA_SELECT);

  sincronizarEstadoInicial();

  restaurarUploadsSalvos();
  aplicarAsteriscoObrigatorio();
  aplicarBarraProcessoCadastro();
  controlarStepperHistorico();

  // O Fluig só termina de montar a barra de ações depois do ready.
  setTimeout(aplicarAcoesDaEtapa, 100);

  inicializarTelaSelecao();
}

// LIGA OS EVENTOS QUE SÃO ESPECÍFICOS DESTE FORMULÁRIO.
function bindEventosCadastro() {
  // Dados Comerciais e Endereço só aparecem depois que a categoria é escolhida.
  $(document).on("change", "#categoria", function () {
    if ($(this).val()) abrirDadosComerciais();
    else fecharDadosComerciais();
  });

  // Optar pelo Simples Nacional fixa o Regime Fiscal em "04".
  $(document).on("change", "#toggleSimplesNacional", function () {
    const simples = $(this).is(":checked");

    definirValorSelect("#regimeFiscal", simples ? REGIME_FISCAL_SIMPLES : "", true);
    $("#regimeFiscalHidden").val(simples ? REGIME_FISCAL_SIMPLES : "");

    if (simples) bloquearCampo("#regimeFiscal");
    else liberarCampo("#regimeFiscal");
  });

  _bindConsultaDocumento("#docCnpj", 14, normalizarCnpj, buscarCnpj);
  _bindConsultaDocumento("#docCpf", 11, function (valor) {
    return (valor || "").replace(/\D/g, "");
  }, verificarCpfDuplicado);
}

// CONSULTA UM DOCUMENTO ASSIM QUE ELE FICA COMPLETO, SEM REPETIR A MESMA CONSULTA.
function _bindConsultaDocumento(seletor, tamanho, normalizar, consultar) {
  let ultimoConsultado = "";

  $(document).on("input", seletor, function () {
    const documento = normalizar($(this).val());

    if (documento.length !== tamanho || documento === ultimoConsultado) return;

    ultimoConsultado = documento;
    consultar(documento);
  });
}

// APLICA AS AÇÕES E PERMISSÕES DA ETAPA ATUAL SOBRE A BARRA DO FLUIG E O FORMULÁRIO.
function aplicarAcoesDaEtapa() {
  controlarEdicaoInicioValidacao();
  controlarBotoesImprimir();
  ocultarEnviarNativoFluig();
  prepararAcoesValidacao();
  prepararEnvioInicio();
  aplicarVisibilidadeDocumentacao();

  // Na Validação e na Correção o usuário precisa ver o que mudou desde o cadastro original.
  const atividade = atividadeAtual();
  if (atividade === ATIVIDADES.VALIDACAO || atividade === ATIVIDADES.CORRECAO) {
    realcarCamposAlterados();
  }
}

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

// APLICA AS REGRAS DE VISIBILIDADE E RESTAURA OS CAMPOS SALVOS NO PROCESSO.
// Cada rotina roda isolada: uma falha (ex.: dataset indisponível) não impede as demais.
function sincronizarEstadoInicial() {
  const rotinas = [
    controlarCamposClassificacao,
    controlarCamposCategoria,
    controlarAlertaCnpj,
    controlarDocumentacaoPorCategoria,
    restaurarGruposMercadoriaSalvos,
    restaurarCnaesSecundariosSalvos,
    restaurarEnderecoRM,
    restaurarRegimeFiscal,
    controlarNaturezaPorTipo,
    controlarBotaoAdicionarCnae,
    controlarBotaoAdicionarGrupoMercadoria,
    inicializarDadosBancarios,
    inicializarEnderecos,
    aplicarRegrasCadastroAssertivo,
    atualizarSetas
  ];

  rotinas.forEach(function (rotina) {
    try {
      rotina();
    } catch (erro) {
      console.error("Erro ao sincronizar estado inicial (" + rotina.name + "):", erro);
    }
  });

  // A partir daqui um campo vazio já significa "o usuário limpou", e não "ainda não restaurou".
  globalThis._formRestaurando = false;

  // Os endereços restaurados foram lidos com a trava ligada, então o JSON que o
  // servicetask16 envia ao RM ainda está vazio: preenche agora que os cards existem.
  try {
    if (typeof sincronizarTabelaEnderecos === "function") sincronizarTabelaEnderecos();
  } catch (erro) {
    console.error("Erro ao sincronizar endereços após a restauração:", erro);
  }
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

// RECRIA OS CAMPOS DE GRUPO DE MERCADORIA A PARTIR DO QUE ESTÁ SALVO NO PROCESSO.
function restaurarGruposMercadoriaSalvos() {
  for (let i = 1; i <= LIMITE_GRUPO_MERCADORIA; i++) {
    const valor = ($("#hiddenGrupoMercadoria" + i).val() || "").trim();
    if (!valor) continue;

    // O primeiro grupo já existe no HTML; os demais são criados sob demanda.
    if (!$("#grupoMercadoria" + i).length) adicionarGrupoMercadoria();
    definirValorSelect("#grupoMercadoria" + i, valor);
  }

  reposicionarBotaoAdicionarGrupo();
}

// RECRIA OS CAMPOS DE CNAE SECUNDÁRIO A PARTIR DO QUE ESTÁ SALVO NO PROCESSO.
function restaurarCnaesSecundariosSalvos() {
  const salvos = [];
  for (let i = 1; i <= LIMITE_CNAE_SECUNDARIO; i++) {
    const valor = ($("#hiddenCnaeSecundario" + i).val() || "").trim();
    if (valor) salvos.push(valor);
  }

  $("#cnae-secundarios-wrap .cnae-secundario-item").remove();

  salvos.forEach(function (valor, index) {
    adicionarCnae();
    const $campo = $("#cnaeSecundario" + (index + 1)).val(valor);
    aplicarMascaraCnae($campo);
  });

  sincronizarCamposDinamicosHidden();
}

// CÓDIGO DO REGIME FISCAL "SIMPLES NACIONAL".
const REGIME_FISCAL_SIMPLES = "04";

// RESTAURA O REGIME FISCAL SALVO — travado em "04" quando a empresa optou pelo Simples.
function restaurarRegimeFiscal() {
  if (!$("#regimeFiscal").length) return;

  if ($("#toggleSimplesNacional").is(":checked")) {
    definirValorSelect("#regimeFiscal", REGIME_FISCAL_SIMPLES);
    $("#regimeFiscalHidden").val(REGIME_FISCAL_SIMPLES);
    bloquearCampo("#regimeFiscal");
    return;
  }

  const salvo = ($("#regimeFiscal").attr("value") || $("#regimeFiscal").val() ||
                 $("#regimeFiscalHidden").val() || "").trim();
  if (salvo) definirValorSelect("#regimeFiscal", salvo);
}

// APLICA A BARRA DE PROGRESSO COMPARTILHADA (castilhoWizard.js).
// Em modo view o processo já passou pela Solicitação, então a barra para na Validação.
function aplicarBarraProcessoCadastro() {
  aplicarBarraProcesso();

  if (!ehModoView()) return;

  const $steps = $(".castilhoWizard-progress .step").removeClass("active completed");
  $steps.eq(0).addClass("completed");
  $steps.eq(1).addClass("active");
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

