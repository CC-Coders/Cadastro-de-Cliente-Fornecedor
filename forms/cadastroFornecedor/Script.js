// ─── SELECTIZE — utilitário central ─────────────────────────────────────────
// Inicializa (ou reinicializa) Selectize em um ou mais seletores.
// Preserva o valor atual antes de destruir a instância antiga.
function inicializarSelectize(seletor, opcoesExtras) {
   $(seletor).each(function () {
      var $el = $(this);

      // Destrói instância anterior se existir
      if (this.selectize) {
         var valorAnterior = this.selectize.getValue();
         this.selectize.destroy();
         $el.val(valorAnterior);   // restaura no <select> nativo
      }

      var valorAtual = $el.val();

      $el.selectize($.extend({
         maxItems: 1,
         create: false,
         allowEmptyOption: true,
         searchField: ["text", "value"],
         closeAfterSelect: true,
         highlight: true,
         onInitialize: function () {
            if (valorAtual) {
               this.setValue(valorAtual, true); // silent = não dispara onChange
            }
         }
      }, opcoesExtras || {}));

      // Marca o .select-wrap pai para esconder a seta CSS nativa
      $el.closest(".select-wrap").addClass("has-selectize");
   });
}

// Aplica Selectize em todos os selects estáticos e dinâmicos presentes no DOM.
// Chamado no $(document).ready após todos os carregamentos de dados.
function aplicarSelectizeGeral() {
   // Selects estáticos
   [
      "#classificacao", "#categoria", "#classificacaoOperacional",
      "#icms", "#simplesNacional", "#regimeFiscal", "#selectDecisao"
   ].forEach(function (s) { inicializarSelectize(s); });

   // Selects populados por dataset (já carregados antes desta chamada)
   inicializarSelectize("#tipo");
   inicializarSelectize("#naturezaRendimento");
   inicializarSelectize("#selectDescricaoIrrf");
   inicializarSelectize(".grupo-mercadoria");   // grupoMercadoria1 + extras
   inicializarSelectize(".banco-select");        // selectBancoNome + extras
   inicializarSelectize("#selectPaisEstrangeiro");
}

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
   popularSelectsGrupoMercadoria();   // popula grupoMercadoria1 (e extras) via ds_grupoMercadoriaRM
   bindEventos();
   aplicarLayoutMobile();
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

   // Aguarda o Fluig injetar os botões de impressão antes de escondê-los
   setTimeout(controlarBotoesImprimir, 600);

   // Aplica Selectize em todos os selects após todos os dados estarem carregados
   aplicarSelectizeGeral();
});


// BOTÕES DE IMPRESSÃO (injetados pelo Fluig)
// Só devem aparecer no modo de visualização (sem atividade ativa).
// Em etapas do processo (início, validação, correção, etc.) ficam ocultos.
function controlarBotoesImprimir() {
   const atividade = Number($("#atividade").val() || 0);

   // atividade = 0 → modo visualização (histórico) → exibe os botões
   // atividade > 0 → etapa ativa → esconde os botões
   if (atividade === 0) return;

   // Esconde qualquer botão cujo texto contenha "imprimir" (gerado pelo Fluig)
   $("button, .btn, input[type='button']").filter(function () {
      return /imprimir/i.test($(this).text().trim() + ($(this).val() || ""));
   }).hide();

   // Tenta também no frame pai (alguns portais Fluig injetam fora do iframe)
   try {
      if (parent && parent.$ && parent.document !== document) {
         parent.$("button, .btn").filter(function () {
            return /imprimir/i.test(parent.$(this).text().trim());
         }).hide();
      }
   } catch (_) { /* cross-origin — ignora silenciosamente */ }
}

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
      controlarCamposClassificacao,       // aplica restrições de Cliente (sem CNAE, sem bancos, sem PF)
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

   // Aguarda 2000ms para o Fluig terminar de injetar os valores do processo no DOM
   // e para que todos os selects dinâmicos (codIrrf, codNaturezaRendimento, etc.)
   // sejam populados pelas chamadas assíncronas de dataset antes de tirar o snapshot.
   // 300ms era insuficiente: o Fluig popula campos dinâmicos entre 500ms e 1500ms,
   // causando falsos "de '' para 'X'" no histórico de alterações.
   setTimeout(function () {
      inicializarSnapshotEdicaoValidacao();
   }, 2000);

   // Aguarda 500ms para o Fluig terminar de injetar os valores de selects dinâmicos.
   // ATENÇÃO: não restaurar checkboxes aqui — document.ready + 500ms é muito cedo.
   // Os checkboxes (toggleRetencao, toggleEstrangeiro) são restaurados no window.load.
   setTimeout(function () {
      // Restaura #tipo (select populado dinamicamente via dataset).
      // Usamos val() SEM trigger("change") para evitar que controlarRetencaoPorTipo
      // chame resetarRetencao() e zere o toggle de retenção antes do window.load restaurá-lo.
      const valorTipo = ($("#tipo").attr("value") || $("#tipo").val() || "").trim();
      if (valorTipo) {
         $("#tipo").val(valorTipo);
         // Sincroniza os hidden fields manualmente (sem disparar o evento change completo)
         const textoTipo = $("#tipo option:selected").text();
         $("#tipoSelecionado").val(valorTipo);
         $("#tipoDescricao").val(textoTipo);
      }
   }, 500);
}


// RESTAURAÇÃO DE CHECKBOXES (window.load)
// O Fluig só injeta valores de checkboxes após o carregamento completo da página.
// document.ready + 500ms é cedo demais; window.load garante que os valores estão disponíveis.
// Não usar val() como fallback — checkboxes retornam "on" por padrão mesmo desmarcados.
$(globalThis).on("load", function () {
   setTimeout(restaurarCheckboxesSalvos, 400);
});

function _checkboxAtivo($el) {
   // Lê o estado salvo de um checkbox via hidden anchor (novo) ou atributos HTML (fallback legado).
   // NÃO usa val() — retorna "on" por padrão mesmo para checkboxes desmarcados.
   const hiddenId = $el.attr("id") ? "#hidden" + $el.attr("id").charAt(0).toUpperCase() + $el.attr("id").slice(1) : "";
   const hiddenVal = hiddenId ? ($(hiddenId).val() || "") : "";

   if (hiddenVal !== "") {
      // Hidden anchor presente → fonte definitiva
      return hiddenVal === "on";
   }

   // Fallback para processos salvos antes dos hidden anchors existirem:
   // lê os atributos HTML que o Fluig pode ter injetado.
   const attrChecked = ($el.attr("checked") || "").toLowerCase();
   const attrValue   = ($el.attr("value")   || "").toLowerCase();
   const isChecked   = $el.is(":checked");

   console.log("[restaurarCheckboxesSalvos] fallback #" + $el.attr("id"),
      "| is(:checked):", isChecked,
      "| attr(checked):", attrChecked,
      "| attr(value):",   attrValue,
      "| val():",         $el.val()
   );

   return isChecked ||
          attrChecked === "checked" || attrChecked === "on" || attrChecked === "true" ||
          attrValue   === "on"      || attrValue   === "true";
}

function restaurarCheckboxesSalvos() {
   // ── Toggle de Retenção ─────────────────────────────────────────────────────
   // Primary: hidden anchor hiddenToggleRetencao (processos novos)
   // Fallback: leitura de atributos Fluig via _checkboxAtivo (processos legados)
   const $toggleRetencao = $("#toggleRetencao");
   const retencaoAtiva = _checkboxAtivo($toggleRetencao);
   if (retencaoAtiva) {
      $toggleRetencao.prop("checked", true);
      controlarPainelRetencoes();
   }

   // ── Checkboxes individuais de imposto ─────────────────────────────────────
   ["iss", "inss", "inputIrrf", "csll", "pis", "cofins"].forEach(function (id) {
      const $cb = $("#" + id);
      if (_checkboxAtivo($cb)) {
         $cb.prop("checked", true).closest(".retencao-item").addClass("ativo");
      }
   });

   // ── Toggle de Estrangeiro ─────────────────────────────────────────────────
   const $toggleEst = $("#toggleEstrangeiro");
   const estrangeiroAtivo = _checkboxAtivo($toggleEst);
   if (estrangeiroAtivo) {
      $toggleEst.prop("checked", true);
      controlarCamposCategoria();
      controlarAlertaCnpj();
   }

   // ── Revalida o painel de retenções após restaurar todos os checkboxes ─────
   // Garante que o border vermelho e a mensagem de erro sejam limpos quando
   // pelo menos um imposto foi restaurado como selecionado.
   if (typeof validarPainelRetencaoVisual === "function") {
      validarPainelRetencaoVisual();
   }
}


// RESTAURAÇÃO DE CAMPOS DINÂMICOS
function restaurarGruposMercadoriaSalvos() {
   for (let i = 2; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const valor = ($("#hiddenGrupoMercadoria" + i).val() || "").trim();

      if (valor && !$("#grupoMercadoria" + i).length) {
         adicionarGrupoMercadoria();
         const $sel = $("#grupoMercadoria" + i);
         $sel.val(valor);
         // Atualiza Selectize se inicializado
         if ($sel.length && $sel[0].selectize) {
            $sel[0].selectize.setValue(valor, true);
         }
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