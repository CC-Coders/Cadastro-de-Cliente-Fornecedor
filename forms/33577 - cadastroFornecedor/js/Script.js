
const LIMITE_CNAE_SECUNDARIO = 4;
const LIMITE_GRUPO_MERCADORIA = 4;
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
const TIPOS_COM_RETENCAO = [
  "Serviços Gerais",
  "Serviços de Engenharia"
];
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
  FIM: [22]
};

$(document).ready(function () {
  inicializarTela();
  inicializarMascaras();
  
  bindEventos();
  inicializarUploadsFluig();

  try {
    sincronizarEstadoInicial();
  } catch (erro) {
    console.error("Erro em sincronizarEstadoInicial:", erro);
  }
  inicializarSnapshotEdicaoValidacao();
  
  restaurarUploadsSalvos();
  aplicarAsteriscoObrigatorio();
  aplicarBarraProcesso();
  controlarStepperHistorico();

  setTimeout(controlarEdicaoInicioValidacao, 300);
});

// INICIALIZAÇÃO DA TELA
function inicializarTela() {
    $(".section-body").show();
    goToStep(1, false);

    $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual").hide();
    $("#endereco, #bairro, #cidade, #estado").prop("readonly", true);
}
function sincronizarEstadoInicial() {
    const funcoesIniciais = [
        function () { $("#toggleRetencao").trigger("change"); },
        controlarCamposCategoria,
        controlarAlertaCnpj,
        controlarRetencaoPorTipo,
        controlarDocumentacaoPorCategoria,
        controlarBotaoAdicionarCnae,
        controlarBotaoAdicionarGrupoMercadoria,
        atualizarSetas,
        atualizarLayoutStepper
    ];

    funcoesIniciais.forEach(function (funcao) {
        try {
            funcao();
        } catch (erro) {
            console.error("Erro ao sincronizar estado inicial:", erro);
        }
    });
}
function aplicarBarraProcesso() {
  const atividade = Number($("#atividade").val() || 0);
  const $steps = $(".wizard-progress .step");

  let indiceAtual = 0;

  if (atividade === ATIVIDADES.INICIO_0 || atividade === ATIVIDADES.INICIO) {
    indiceAtual = 0;
  } else if (atividade === ATIVIDADES.VALIDACAO) {
    indiceAtual = 1;
  } else if (atividade === ATIVIDADES.INTEGRACAO) {
    indiceAtual = 2;
  } else if (ATIVIDADES.FIM.includes(atividade)) {
    indiceAtual = 3;
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
