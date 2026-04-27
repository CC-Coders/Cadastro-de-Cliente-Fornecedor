// constantes e variáveis globais
const LIMITE_CNAE_SECUNDARIO = 5;
const LIMITE_GRUPO_MERCADORIA = 5;

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
  aplicarAsteriscoObrigatorio();
  inicializarUploadsFluig();
  bindEventos();
  setTimeout(controlarEdicaoInicioValidacao, 300);

  try {
    sincronizarEstadoInicial();
  } catch (erro) {
    console.error("Erro em sincronizarEstadoInicial:", erro);
  }

  aplicarBarraProcesso();
  controlarStepperHistorico();
});

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

  console.log("Atividade atual:", atividade);
  console.log("Índice ativo da barra:", indiceAtual);
}