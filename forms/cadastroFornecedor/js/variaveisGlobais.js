// DEFINE AS ETAPAS DO PROCESSO E SEUS RESPECTIVOS ESTADOS (barra de progresso superior)
var ETAPAS = [
    { rotulo: "Solicitação", estados: [0, 4, 27] },
    { rotulo: "Validação",   estados: [11]        },
    { rotulo: "Fim",         estados: [16, 19]     }
];

// DEFINE AS ABAS DISPONÍVEIS E SEUS RESPECTIVOS PAINÉIS (rodapé/stepper).
var ABAS = [
    { dataTab: "pre-cadastro",     painel: "#divPreCadastro"     },
    { dataTab: "dados-cadastrais", painel: "#divDadosCadastrais" },
    { dataTab: "documentacao",     painel: "#divDocumentacao"    },
    { dataTab: "historico",        painel: "#paginaHistorico"    }
];

// DEFINE A QUANTIDADE DE ABAS E MAPEIA CADA STEP AO SEU PAINEL E NAVEGAÇÃO.
var TOTAL_STEPS = ABAS.length;
var PANEL_MAP = {};
var NAV_MAP = {};

// CRIA O MAPEAMENTO ENTRE OS STEPS, PAINÉIS E ELEMENTOS DE NAVEGAÇÃO.
ABAS.forEach(function (aba, i) {
    PANEL_MAP[i + 1] = aba.painel;
    NAV_MAP[i + 1] = '.step-item[data-tab="' + aba.dataTab + '"]';
});

// RETORNA O ÍNDICE DA ETAPA CORRESPONDENTE AO ESTADO INFORMADO.
function indiceEtapaPorEstado(estado) {
    estado = Number(estado);
    for (var i = 0; i < ETAPAS.length; i++) {
        if (ETAPAS[i].estados.indexOf(estado) !== -1) return i;
    }
    return 0;
}
// RETORNA O NOME DA ETAPA CORRESPONDENTE AO ESTADO INFORMADO.
function nomeEtapaPorEstado(estado) {
    var etapa = ETAPAS[indiceEtapaPorEstado(estado)];
    return etapa ? etapa.rotulo : "";
}
