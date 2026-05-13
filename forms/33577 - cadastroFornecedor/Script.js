// Limites de itens dinâmicos adicionáveis pelo usuário
globalThis.LIMITE_CNAE_SECUNDARIO = globalThis.LIMITE_CNAE_SECUNDARIO || 5;
globalThis.LIMITE_GRUPO_MERCADORIA = 9;

// Mapeamento step-number → ID do painel de conteúdo correspondente
const PANEL_MAP = {
   1: "#divPreCadastro",
   2: "#divDadosCadastrais",
   3: "#divDocumentacao",
   4: "#paginaHistorico"
};

// Mapeamento step-number → ID do botão de navegação no stepper inferior
const NAV_MAP = {
   1: "#nav-step-PreCad",
   2: "#nav-step-DadosCadastrais",
   3: "#nav-step-Documentacao",
   4: "#nav-step-HistoricoDecisao"
};

// Tipos de fornecedor que exibem automaticamente o painel de retenções.
const TIPOS_COM_RETENCAO = [
   // "Serviços Gerais",
   // "Serviços de Engenharia"
];

// Opções disponíveis para os selects de Grupo de Mercadoria
const OPCOES_GRUPO_MERCADORIA = [
   "Materiais de Construção",
   "Equipamentos e Máquinas",
   "Serviços de Engenharia",
   "Combustíveis e Lubrificantes",
   "Serviços Administrativos",
   "Tecnologia e TI",
   "Seguro e Apólices"
];

// IDs numéricos das atividades do processo BPM — usados em toda a lógica condicional
const ATIVIDADES = {
   INICIO_0: 0,   // abertura do formulário antes de enviar (modo rascunho)
   INICIO: 4,     // atividade de Início / Solicitação
   VALIDACAO: 11, // atividade de Validação pelo aprovador
   INTEGRACAO: 16,// atividade de Integração com RM
   FIM: [22]      // array para suportar múltiplos IDs de atividade fim futuramente
};


// INICIALIZAÇÃO DO FORMULÁRIO
// A ordem das chamadas abaixo é intencional:
$(document).ready(function () {
   inicializarTela();
   inicializarMascaras();
   carregarTiposClienteFornecedor();
   carregarNaturezaRendimento();
   carregarOpcoesIrrf(true);
   bindEventos();
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

   // Controla a visibilidade da seção "Dados Comerciais" com base na categoria já selecionada
   if ($("#categoria").val()) {
      abrirDadosComerciais();
   } else {
      fecharDadosComerciais();
   }

   // Reabre/fecha "Dados Comerciais" quando o usuário troca a categoria
   $("#categoria").off("change.abrirDadosComerciais").on("change.abrirDadosComerciais", function () {
      if ($(this).val()) {
         abrirDadosComerciais();
      } else {
         fecharDadosComerciais();
      }
   });

   // Mantém os hidden #tipoSelecionado e #tipoDescricao sincronizados com o select #tipo.
   // Necessário porque o select é populado dinamicamente; o Fluig só persiste o value, não o text.
   $("#tipo").on("change", function () {
      let texto = $("#tipo option:selected").text();
      $("#tipoSelecionado").val($(this).val());
      $("#tipoDescricao").val(texto);
   });

   // Override do toggleSection padrão para a seção "Dados Comerciais",
   // usando slideToggle animado em vez do comportamento estático default
   $("#divDadosComerciais .section-head")
      .off("click.toggleDadosComerciais")
      .on("click.toggleDadosComerciais", function () {
         const body = $("#divDadosComerciais .section-body");
         const seta = $("#divDadosComerciais .section-arrow");

         body.stop(true, true).slideToggle(500);
         seta.toggleClass("open");
         seta.text(seta.hasClass("open") ? "▲" : "▼");
      });

   // Aciona busca automática na API de CNPJ quando 14 dígitos são digitados.
   // cnpjJaConsultado evita chamadas duplicadas ao mesmo CNPJ sem limpar o campo.
   let cnpjJaConsultado = "";
   $(document).on("input", "#docCnpj", function () {
      let cnpj = $(this).val().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

      if (cnpj.length === 14 && cnpj !== cnpjJaConsultado) {
         cnpjJaConsultado = cnpj;
         buscarCnpj(cnpj);
      }
   });

   // Delay para garantir que o DOM do Fluig esteja completamente renderizado
   // antes de aplicar o bloqueio/edição de campos da atividade de Validação
   setTimeout(controlarEdicaoInicioValidacao, 300);
});


// SETUP VISUAL INICIAL
function inicializarTela() {
   $(".section-body").show(500);

   goToStep(1, false);

   $("#divDadosFornecedor .section-body").show(500);
   $("#divDadosFornecedor .section-arrow").addClass("open").text("▲");

   if ($("#categoria").val()) {
      abrirDadosComerciais();
   } else {
      fecharDadosComerciais();
   }

   $("#divCpf, #divCnpj, #divNomeFantasia, #divRg, #divInscricaoEstadual").hide(500);

   // Endereço preenchido via ViaCEP / API de CNPJ: campos readonly por padrão
   $("#endereco, #bairro, #cidade, #estado").prop("readonly", true);

   // País: readonly (fixado em "Brasil" no modo nacional; trocado por select no estrangeiro)
   $("#pais").prop("readonly", true);
   if (!($("#pais").val() || "").trim()) {
      $("#pais").val("Brasil");
   }

   // Select de país estrangeiro: oculto até o toggle ser ativado
   $("#divSelectPaisEstrangeiro").hide(500);
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
         // Dispara o change do toggle de retenção para exibir/ocultar o painel de impostos
         $("#toggleRetencao").trigger("change");
      },
      controlarCamposCategoria,          // mostra/oculta campos CPF/CNPJ/RG conforme categoria
      controlarAlertaCnpj,               // exibe alerta de instrução sobre documento fiscal
      controlarRetencaoPorTipo,          // mostra/oculta toggle de retenção conforme tipo
      controlarDocumentacaoPorCategoria, // mostra/oculta campos de upload conforme PJ/PF
      restaurarGruposMercadoriaSalvos,   // reconstrói os selects extras de grupo de mercadoria
      restaurarCnaesSecundariosSalvos,   // reconstrói os inputs extras de CNAE secundário
      controlarBotaoAdicionarCnae,       // habilita/desabilita botão "+ CNAE" conforme limite
      controlarBotaoAdicionarGrupoMercadoria,
      inicializarDadosBancarios,         // reconstrói os cards bancários a partir dos hidden fields
      atualizarSetas,                    // habilita/desabilita setas de navegação do stepper
      atualizarLayoutStepper             // alterna entre layout stepper-3 e stepper-4 steps
   ];

   funcoesIniciais.forEach(function (funcao) {
      try {
         funcao();
      } catch (error_) {
         console.error("Erro ao sincronizar estado inicial:", error_);
      }
   });

   // Aguarda 300ms para o Fluig terminar de injetar os valores do processo no DOM
   // antes de tirar o snapshot de auditoria da atividade de Validação
   setTimeout(function () {
      inicializarSnapshotEdicaoValidacao();
   }, 300);

   // Aguarda 500ms para garantir que carregarTiposClienteFornecedor() já populou
   // o select #tipo antes de tentar re-selecionar o valor salvo
   setTimeout(function () {
      const valorTipo = ($("#tipo").attr("value") || $("#tipo").val() || "").trim();

      if (valorTipo) {
         $("#tipo").val(valorTipo).trigger("change");
      }
   }, 500);
}


// RESTAURAÇÃO DE CAMPOS DINÂMICOS
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
   const limite = globalThis.LIMITE_CNAE_SECUNDARIO || 5;

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


// BARRA DE PROGRESSO DO PROCESSO (wizard-progress)
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