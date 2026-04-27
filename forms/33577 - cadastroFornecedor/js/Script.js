// constantes e variáveis globais
const LIMITE_CNAE_SECUNDARIO = 5;
const LIMITE_GRUPO_MERCADORIA = 5;

const PANEL_MAP = {
  1: "#divPreCadastro",
  2: "#divDadosCadastrais",
  3: "#divDocumentacao",
  4: "#divHistoricoDecisao"
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



$(document).ready(function () {
  inicializarTela();
  inicializarMascaras();
  inicializarUploadsFluig();
  bindEventos();
  sincronizarEstadoInicial();
});

