// CONSTANTES DE MAPEAMENTO DE ATIVIDADES DO PROCESSO
const ATIVIDADES = {
    INICIO_0:         0,
    INICIO:           4,
    VALIDACAO:        11,
    INTEGRACAO:       16,
    ERRO_INTEGRACAO:  19,
    CORRECAO:         27
};

// LIMITES DOS CAMPOS QUE O USUÁRIO PODE REPETIR
const LIMITE_GRUPO_MERCADORIA  = 9;
const LIMITE_CNAE_SECUNDARIO   = 5;
const LIMITE_CONTAS_BANCARIAS  = 5;
const LIMITE_ENDERECOS         = 5;

// TAMANHOS ACEITOS PELAS COLUNAS DE FDADOSPGTO NO RM. Estourar qualquer um faz o
// DataServer recusar a conta com "String or binary data would be truncated".
const MAX_AGENCIA_RM = 5;
const MAX_CONTA_RM   = 15;
const MAX_DIGITO_RM  = 2;

// ETAPAS EM QUE O SOLICITANTE PREENCHE O CADASTRO
const ETAPAS_PREENCHIMENTO = [ATIVIDADES.INICIO_0, ATIVIDADES.INICIO, ATIVIDADES.CORRECAO];

// ETAPAS EM QUE O SOLICITANTE PODE ENVIAR O PROCESSO (inclui o retorno por erro de integração)
const ETAPAS_ENVIO_SOLICITANTE = ETAPAS_PREENCHIMENTO.concat(ATIVIDADES.ERRO_INTEGRACAO);

// RETORNA A ATIVIDADE ATUAL DO PROCESSO.
function atividadeAtual() {
    return Number($("#atividade").val() || 0);
}

// INDICA SE O FORMULÁRIO ESTÁ ABERTO SOMENTE PARA LEITURA.
function ehModoView() {
    return ($("#formMode").val() || "").toUpperCase() === "VIEW";
}

// INDICA SE O SOLICITANTE ESTÁ PREENCHENDO O CADASTRO (Início ou Correção).
function ehEtapaPreenchimento() {
    return !ehModoView() && ETAPAS_PREENCHIMENTO.indexOf(atividadeAtual()) !== -1;
}

// INDICA SE O SOLICITANTE PODE ENVIAR O PROCESSO NESTA ETAPA.
function ehEnvioSolicitante() {
    return !ehModoView() && ETAPAS_ENVIO_SOLICITANTE.indexOf(atividadeAtual()) !== -1;
}

// INDICA SE O PROCESSO ESTÁ NA ETAPA DE VALIDAÇÃO DO SUPRIMENTOS.
function ehEtapaValidacao() {
    return atividadeAtual() === ATIVIDADES.VALIDACAO;
}

// CONFIGURA OS TOASTS DO FLUIG PARA FECHAREM AUTOMATICAMENTE APÓS 4 SEGUNDOS
(function () {
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

    function _autoDismissToasts(doc) {
        if (!doc) return;

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
    if (typeof $ === "function") { $(configurarToasts); }
})();

// INDICA QUE O FORMULÁRIO ESTÁ EM PROCESSO DE RESTAURAÇÃO DE CAMPOS DINÂMICOS
window._formRestaurando = true;

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
