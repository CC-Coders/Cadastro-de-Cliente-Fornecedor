window.LIMITE_CNAE_SECUNDARIO = window.LIMITE_CNAE_SECUNDARIO || 5;
window.LIMITE_GRUPO_MERCADORIA = 9;
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
carregarTiposClienteFornecedor();
   bindEventos();
   inicializarUploadsFluig();

   try {
      sincronizarEstadoInicial();
   } catch (erro) {
      console.error("Erro em sincronizarEstadoInicial:", erro);
   }


   restaurarUploadsSalvos();
   aplicarAsteriscoObrigatorio();
   aplicarBarraProcesso();
   controlarStepperHistorico();
// Ao carregar
if ($("#categoria").val()) {
  abrirDadosComerciais();
} else {
  fecharDadosComerciais();
}

// Change
$("#categoria").off("change.abrirDadosComerciais").on("change.abrirDadosComerciais", function () {
  if ($(this).val()) {
    abrirDadosComerciais();
  } else {
    fecharDadosComerciais();
  }
});
$("#tipo").on("change", function () {

    var texto = $("#tipo option:selected").text();

    $("#tipoDescricao").val(texto);

});

// Clique manual
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
      let cnpj = $(this).val().replace(/[^a-zA-Z0-9]/g, "")
.toUpperCase();

      if (cnpj.length === 14 && cnpj !== cnpjJaConsultado) {
         cnpjJaConsultado = cnpj;
         buscarCnpj(cnpj);
      }
   });
   setTimeout(controlarEdicaoInicioValidacao, 300);
});

// INICIALIZAÇÃO DA TELA
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
}
function fecharDadosComerciais() {
  $("#divDadosComerciais .section-body").stop(true, true).slideUp(500);
  $("#divDadosComerciais .section-arrow").removeClass("open").text("▼");
}

function abrirDadosComerciais() {
  $("#divDadosComerciais .section-body").stop(true, true).slideDown(500);
  $("#divDadosComerciais .section-arrow").addClass("open").text("▲");
}
function sincronizarEstadoInicial() {
   const funcoesIniciais = [
      function () {
         $("#toggleRetencao").trigger("change");
      },
      controlarCamposCategoria,
      controlarAlertaCnpj,
      controlarRetencaoPorTipo,
      controlarDocumentacaoPorCategoria,
      restaurarGruposMercadoriaSalvos,
      restaurarCnaesSecundariosSalvos,
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
      setTimeout(function () {
      inicializarSnapshotEdicaoValidacao();
   }, 300);
}

function restaurarGruposMercadoriaSalvos() {
   for (let i = 2; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const valor = ($("#hiddenGrupoMercadoria" + i).val() || "").trim();

      if (valor && !$("#grupoMercadoria" + i).length) {
         adicionarGrupoMercadoria();
         $("#grupoMercadoria" + i).val(valor).trigger("change");
      }
   }
}

function restaurarCnaesSecundariosSalvos() {
   const limite = window.LIMITE_CNAE_SECUNDARIO || 5;

   const cnaesSalvos = [];

   for (let i = 1; i <= limite; i++) {
      const valor = ($("#hiddenCnaeSecundario" + i).val() || "").trim();
      if (valor) cnaesSalvos.push(valor);
   }

   // limpa tudo antes
   $("#cnae-secundarios-wrap .cnae-secundario-item").remove();

   // recria corretamente
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
$(document).ready(function () {

   $("#btnAprovar").on("click", function () {
      $("#selectDecisao").val("enviarRM").trigger("change");
      destacarBotao(this);
   });

   $("#btnReprovar").on("click", function () {
      $("#selectDecisao").val("Correcao").trigger("change");

      destacarBotao(this);
   });

});

// função visual (opcional, mas fica top)
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