// ─────────────────────────────────────────────
// EVENTO WINDOW LOAD
// Executado após o Fluig terminar de injetar os valores salvos no formulário.
// O $(document).ready() do Script.js é muito cedo para ler os campos hidden
// preenchidos pelo servidor — o window.load garante que os valores estão disponíveis.
// ─────────────────────────────────────────────
$(globalThis).on("load", function () {

   // Aguarda 300ms adicionais para o Fluig completar a renderização dos campos
   setTimeout(function () {

      const cnpj = ($("#docCnpj").val() || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const hiddenExiste = $("#hiddenCnaeSecundario1").length > 0;
      const temValor = $("#hiddenCnaeSecundario1").val();

      // 1. Processo já tem CNAEs salvos nos hidden fields → restaura sem chamar a API
      if (hiddenExiste && temValor) {
         restaurarCnaesSecundariosSalvos();
         return;
      }

      // 2. Formulário novo com CNPJ já preenchido → busca CNAEs na API externa
      if (cnpj.length === 14) {
         buscarCnpj(cnpj);
      }

   }, 300);

});

// ─────────────────────────────────────────────
// REGISTRO DE EVENTOS
// ─────────────────────────────────────────────

// Guarda a categoria anterior para detectar troca PJ→PF que exige limpeza de anexos
let categoriaAnterior = "";

// Ponto de entrada central: registra todos os grupos de eventos do formulário.
// Cada bindEventos*() é responsável por um domínio específico, facilitando manutenção.
function bindEventos() {
   bindEventosCamposBasicos();         // campos obrigatórios genéricos + natureza de rendimentos
   bindEventosDocumentos();            // validação inline de CPF/CNPJ + toggle estrangeiro
   bindEventosEndereco();              // busca automática de CEP ao sair do campo
   bindEventosRetencao();              // toggle de retenção + seleção dos impostos
   bindEventosCnaeSecundario();        // adicionar/remover CNAE + máscara inline
   bindEventosGrupoMercadoria();       // adicionar/remover/alterar grupos de mercadoria
   bindEventosCamposDinamicos();       // sincronização dos hidden fields de campos dinâmicos
   bindEventosUpload();                // clique no botão "Remover" de cada anexo
   bindEventoTrocaCategoriaComAnexos();// confirmação ao trocar PJ→PF com anexos já enviados
   bindEventosDecisao();               // botões Aprovar / Reprovar na atividade de Validação
   bindEventosDadosBancarios();        // adicionar/remover contas + sincronização da child table
}

// Registra eventos dos cards de dados bancários:
//   - Adicionar nova conta (até LIMITE_CONTAS_BANCARIAS)
//   - Remover conta existente (o card 1 não tem botão de remover)
//   - Sincronizar a child table #tableDadosBancarios e os hidden fields a cada alteração
//   - Limpar erros de validação ao preencher os campos bancários
function bindEventosDadosBancarios() {
   $(document).on("click", "#btn-add-conta-bancaria", adicionarContaBancaria);

   $(document).on("click", ".btn-remove-bank", function () {
      removerContaBancaria(Number($(this).data("numero")));
   });

   // Select de banco: ao escolher, preenche código (readonly) + hidden fields e sincroniza
   $(document).on("change", ".banco-select", function () {
      let selectId = this.id; // "selectBancoNome" ou "selectBancoNome2", "selectBancoNome3"…
      let s = selectId.replace("selectBancoNome", ""); // "" | "2" | "3" …
      let cpodigo = $(this).val() || "";
      let nome    = $(this).find("option:selected").data("nome") || $(this).find("option:selected").text() || "";
      // Limpa texto das opções padrão sem data-nome
      if (!$(this).find("option:selected").data("nome")) nome = "";

      $("#banco"           + s).val(cpodigo);
      $("#bancoDescricao"  + s).val(nome);
      $("#bancoCodExibicao"+ s).val(cpodigo);

      sincronizarTabelaBancaria();
      if (cpodigo && selectId) limparErroCampo(selectId);
   });

   $(document).on("change", ".banco-agencia, .banco-conta", sincronizarTabelaBancaria);

   $(document).on("input change", ".banco-agencia, .banco-conta", function () {
      if (($(this).val() || "").trim() && this.id) {
         limparErroCampo(this.id);
      }
   });
}

// Mapeia os botões visuais Aprovar/Reprovar para o select oculto #selectDecisao.
// O select é o campo real lido pelo beforeTaskSave.js via hAPI.getCardValue().
// "enviarRm" → aprovação e encaminhamento ao RM; "Correcao" → devolve ao solicitante.
function bindEventosDecisao() {
   $("#btnAprovar").on("click", function () {
      $("#selectDecisao").val("enviarRm").trigger("change");
      destacarBotao(this);
   });

   $("#btnReprovar").on("click", function () {
      $("#selectDecisao").val("Correcao").trigger("change");
      destacarBotao(this);
   });
}

// Verifica se ao menos um dos campos hidden de anexo tem valor preenchido.
// Usado para avisar o usuário antes de trocar a categoria (PJ→PF), pois
// a troca implica exclusão de todos os anexos já enviados.
function existeAnexoIncluido() {
   let anexos = [
      "anxCartaoCnpj",
      "anxCompBanco",
      "anxContrato",
      "anxRgCpf",
      "anxCompEndereco",
      // "anxLaudoPcd",
      // "anxDependentes",
      // "anxCodConduta",
      // "anxAntiCorrupcao",
      // "anxConflito",
      // "anxLgpd"
   ];

   return anexos.some(function (id) {
      return ($("#" + id).val() || "").trim() !== "";
   });
}

// Intercepta a troca do campo #categoria. Se o usuário troca de PJ para PF e já
// existem anexos enviados, exibe confirmação antes de excluir tudo.
// Usa categoriaAnterior (capturado no focus) para detectar a direção da troca.
function bindEventoTrocaCategoriaComAnexos() {
   categoriaAnterior = ($("#categoria").val() || "").trim();
   $("#categoria")
      .off("focus.categoriaAnexos")
      .on("focus.categoriaAnexos", function () {
         categoriaAnterior = ($(this).val() || "").trim();
      });
   $("#categoria")
      .off("change.categoriaAnexos")
      .on("change.categoriaAnexos", function () {
         let novaCategoria = ($(this).val() || "").trim();
         if (
            categoriaAnterior === "J" &&
            novaCategoria === "F" &&
            existeAnexoIncluido()
         ) {
            FLUIGC.message.confirm({
               title: "Atenção",
               message: "Essa ação resultará na exclusão de todos os anexos já inclusos no processo.",
               labelYes: "Sim, excluir",
               labelNo: "Cancelar"
            }, function (confirmou) {
               if (!confirmou) {
                  $("#categoria").val(categoriaAnterior);
                  return;
               }

               excluirTodosAnexosDoProcesso();
               controlarCamposCategoria();
               controlarAlertaCnpj();
               controlarDocumentacaoPorCategoria();
               aplicarAsteriscoObrigatorio();
               carregarOpcoesIrrf(false);

               categoriaAnterior = novaCategoria;
            });

            return;
         }

         controlarCamposCategoria();
         controlarAlertaCnpj();
         controlarDocumentacaoPorCategoria();
         aplicarAsteriscoObrigatorio();
         carregarOpcoesIrrf(false);

         categoriaAnterior = novaCategoria;
      });
}

// Remove todos os anexos da tabela nativa do Fluig (#attachmentsTable no frame pai).
// Tenta primeiro o botão de exclusão em lote; se não encontrado, remove um a um.
// Usa a flag parent.__remocaoEmLoteAnexos para suprimir os toasts de confirmação
// e confirmarModaisRemocaoEmLote() para fechar automaticamente qualquer modal.
function excluirTodosAnexosDoProcesso() {
   const $p = parent.$;

   parent.__remocaoEmLoteAnexos = true;

   const $linhas = $p("#attachmentsTable tbody tr").filter(function () {
      return !$p(this).is("[data-empty-message]");
   });

   $linhas.each(function () {
      const $checkbox = $p(this).find("input[type='checkbox']").first();

      if ($checkbox.length) {
         $checkbox.prop("checked", true).trigger("click").trigger("change");
      }
   });

   const $btnExcluir = $p(
      "#ecm-navigation-delete, #ecm-navigation-remove, .ecm-navigation-delete, [title*='Excluir'], [title*='Remover']"
   ).filter(":visible").first();

   if ($btnExcluir.length) {
      $btnExcluir.click();
   } else {
      removerTodosAnexosUmPorUmSemPerguntar();
   }

   confirmarModaisRemocaoEmLote();

   setTimeout(function () {
      limparTodosUploadsVisuais();
      ocultarToastsRemocaoAnexos();
      parent.__remocaoEmLoteAnexos = false;
   }, 2500);
}

// Polling de 250ms por até 5 segundos para fechar automaticamente qualquer modal
// de confirmação que o Fluig abra durante a remoção em lote de anexos.
function confirmarModaisRemocaoEmLote() {
   const $p = parent.$;
   let tentativas = 0;

   const intervalo = setInterval(function () {
      tentativas++;

      const $modal = $p(".modal:visible, .fluig-modal:visible").last();

      if ($modal.length) {
         $modal
            .find("button:contains('Sim'), .btn-primary, button:contains('Confirmar')")
            .filter(":visible")
            .first()
            .click();
      }

      ocultarToastsRemocaoAnexos();

      if (tentativas >= 20) {
         clearInterval(intervalo);
      }
   }, 250);
}

// Fallback para quando o botão de exclusão em lote não é encontrado.
// Itera linha a linha na #attachmentsTable e clica no botão de remoção individual.
function removerTodosAnexosUmPorUmSemPerguntar() {
   const $p = parent.$;

   const $linhas = $p("#attachmentsTable tbody tr").filter(function () {
      return !$p(this).is("[data-empty-message]");
   });

   $linhas.each(function () {
      const $btn = $p(this)
         .find(".fluigicon-trash, .flaticon-trash, [title*='Excluir'], [title*='Remover'], [data-remove]")
         .first();

      if ($btn.length) {
         $btn.click();
      }
   });
}

// Remove do DOM os toasts do Fluig que informam "Anexo foi removido",
// suprimindo o feedback visual durante a remoção em lote automatizada.
function ocultarToastsRemocaoAnexos() {
   const $p = parent.$;

   $p(".toast, .alert, .fluig-toast, .notification")
      .filter(function () {
         const texto = $p(this).text().toLowerCase();
         return texto.includes("anexo foi removido") ||
            texto.includes("anexo removido");
      })
      .remove();
}

// Reseta o estado visual de todas as upload-areas e limpa os hidden fields
// de nome e ID de todos os anexos. Chamado após confirmação de exclusão em lote.
function limparTodosUploadsVisuais() {
   $(".upload-area").removeClass("uploaded upload-error");
   $(".upload-file-status").hide().empty();

   Object.values(MAPA_HIDDEN_ANEXOS).forEach(function (hiddenId) {
      $("#" + hiddenId).val("");
      $("#" + hiddenId + "Id").val("");
   });
}

// Registra eventos dos campos básicos obrigatórios:
//   - Limpa o erro de validação inline ao preencher qualquer campo required
//   - Sincroniza o hidden #codNaturezaRendimento com o select de natureza de rendimentos
//     (necessário porque o select é populado via dataset e o Fluig não persiste o texto)
//   - Dispara controle de painel de retenções ao trocar o tipo de fornecedor
function bindEventosCamposBasicos() {
   $(document).on("input change", ".form-control[required]", function () {
      limparErroCampoObrigatorioPreenchido(this);
   });

   // #observacaoValidacao e #selectDecisao não têm atributo required no HTML
   // (para não acionar a validação nativa do Fluig), mas são obrigatórios pela
   // validação customizada. O listener abaixo garante que o erro seja limpo ao preencher.
   $(document).on("input", "#observacaoValidacao", function () {
      if (($(this).val() || "").trim()) {
         limparErroCampo("observacaoValidacao");
      }
   });
   $(document).on("change", "#selectDecisao", function () {
      if ($(this).val()) {
         limparErroCampo("selectDecisao");
      }
   });

   $("#naturezaRendimento").on("change", function () {
      $("#codNaturezaRendimento").val($(this).val() || "");
   });
   $("#tipo").on("change", controlarRetencaoPorTipo);

   // Ao trocar a classificação, reavalia CNAE, Dados Bancários e opção PF no #categoria
   $("#classificacao").on("change", controlarCamposClassificacao);
}

function limparErroCampoObrigatorioPreenchido(campo) {
   const id = campo.id;
   if (["docCpf", "docCnpj"].includes(id)) {
      return;
   }
   const valor = ($(campo).val() || "").toString().trim();
   if (valor) {
      limparErroCampo(id);
   }
}

// Registra eventos de validação inline dos documentos fiscais:
//   - CNPJ: valida dígitos verificadores ao digitar (14 dígitos)
//   - CPF: valida dígitos verificadores ao digitar (11 dígitos)
//   - Toggle estrangeiro: reavalia campos obrigatórios e asteriscos quando acionado
//   - Alert de instrução do CNPJ: atualizado ao sair ou teclar no campo
function bindEventosDocumentos() {
   $("#docCnpj").on("input", function () {
      validarDocumentoDigitado({
         campoId: "docCnpj",
         tamanhoMinimo: 14,
         mensagemErro: "CNPJ inválido.",
         validador: validarCNPJ
      });
   });
   $("#docCpf").on("input", function () {
      validarDocumentoDigitado({
         campoId: "docCpf",
         tamanhoMinimo: 11,
         mensagemErro: "CPF inválido.",
         validador: validarCPF
      });
   });
   $("#toggleEstrangeiro")
      .off("change.estrangeiro")
      .on("change.estrangeiro", function () {
         // Sincroniza hidden anchor para Fluig restaurar corretamente
         $("#hiddenToggleEstrangeiro").val(this.checked ? "on" : "");

         // Limpa endereço ao trocar entre modo nacional ↔ estrangeiro,
         // evitando que dados de um modo fiquem preenchidos no outro
         limpaCamposEndereco();
         $("#cep").val("");
         limparErroCampo("cep");
         $("#selectPaisEstrangeiro").val("");

         controlarCamposCategoria();
         controlarAlertaCnpj();
         aplicarAsteriscoObrigatorio();
      });

   // Sincroniza o select de país estrangeiro com o hidden field #pais
   // (o field #pais é o que o Fluig persiste entre atividades)
   $(document).on("change", "#selectPaisEstrangeiro", function () {
      let paisSelecionado = $(this).val() || "";
      $("#pais").val(paisSelecionado);
      if (paisSelecionado) {
         limparErroCampo("selectPaisEstrangeiro");
      }
   });

   // Ao selecionar um Código de Receita IRRF, preenche automaticamente o campo Alíquota.
   // O value armazenado no campo codIrrf (name="codIrrf") é o CODRECEITA.
   // A alíquota correspondente fica em data-aliquota do <option> selecionado.
   // hiddenCodIrrf serve como âncora de restauração (mesmo padrão de codNaturezaRendimento),
   // porque Fluig não consegue restaurar selects dinâmicos antes das opções existirem.
   $(document).on("change", "#selectDescricaoIrrf", function () {
      let selecionado = $(this).find("option:selected");
      let aliq = selecionado.length ? (selecionado.attr("data-aliquota") || "") : "";
      $("#irrf").val(aliq);
      $("#hiddenCodIrrf").val($(this).val() || "");
      if ($(this).val()) {
         limparErroCampo("selectDescricaoIrrf");
      }
   });

   $("#docCnpj").on("blur keyup", controlarAlertaCnpj);
}

// Valida CPF ou CNPJ enquanto o usuário digita.
// Só aplica a validação após atingir o tamanho mínimo esperado;
// limpa o erro se o campo estiver incompleto (evita erro prematuro).
function validarDocumentoDigitado(config) {
   const valor = $("#" + config.campoId).val() || "";
   const numeros = valor.replaceAll(/\D/g, "");

   if (!valor || numeros.length < config.tamanhoMinimo) {
      limparErroCampo(config.campoId);
      aplicarStatusCampo(config.campoId, null);
      return;
   }
   if (config.validador(valor)) {
      limparErroCampo(config.campoId);
      aplicarStatusCampo(config.campoId, true);
      return;
   }
   exibirErroCampo(config.campoId, config.mensagemErro);
   aplicarStatusCampo(config.campoId, false);
}

// Dispara a busca de endereço via ViaCEP ao sair do campo CEP.
// Só consulta quando há exatamente 8 dígitos; limpa os campos se incompleto.
// Os campos endereco/bairro/cidade/estado são readonly e preenchidos pelo retorno da API.
function bindEventosEndereco() {
   $("#cep").on("blur", function () {
      const cep = ($(this).val() || "").replaceAll(/\D/g, "");

      if (cep.length !== 8) {
         limpaCamposEndereco();
         return;
      }
      buscarCep(cep);
   });
}

// Controla o painel de seleção de impostos retidos:
//   - Toggle principal: exibe/oculta o painel e reseta checkboxes ao desativar
//   - Checkboxes individuais (ISS, INSS, etc.): aplica classe "ativo" e
//     valida se pelo menos um está selecionado (obrigatório quando toggle ativo)
function bindEventosRetencao() {
   // Toggle principal — sincroniza hidden anchor para Fluig restaurar corretamente
   // Não chama validarPainelRetencaoVisual() aqui: o border de erro só deve aparecer
   // após uma tentativa de envio, não imediatamente ao ligar o toggle.
   // A limpeza do erro ao desligar é feita dentro de controlarPainelRetencoes().
   $("#toggleRetencao").on("change", function () {
      $("#hiddenToggleRetencao").val(this.checked ? "on" : "");
      controlarPainelRetencoes();
   });

   // Checkboxes individuais — sincronizam seus hidden anchors
   const MAP_HIDDEN_IMPOSTO = {
      iss:       "#hiddenIss",
      inss:      "#hiddenInss",
      inputIrrf: "#hiddenInputIrrf",
      csll:      "#hiddenCsll",
      pis:       "#hiddenPis",
      cofins:    "#hiddenCofins"
   };

   $(".retencao-item input").on("change", function () {
      $(this)
         .closest(".retencao-item")
         .toggleClass("ativo", this.checked);

      const hiddenId = MAP_HIDDEN_IMPOSTO[this.id];
      if (hiddenId) {
         $(hiddenId).val(this.checked ? "on" : "");
      }

      validarPainelRetencaoVisual();
   });
}

// Gerencia a lista dinâmica de CNAEs secundários:
//   - Adicionar: cria novo input via adicionarCnae() respeitando LIMITE_CNAE_SECUNDARIO
//   - Remover: remove o item e reordena os IDs/names para manter sequência contínua
//   - Input: aplica máscara NNNN-N/NN em tempo real (somente se campo não está bloqueado pela validação)
function bindEventosCnaeSecundario() {
   // Binding direto no botão estático (mais confiável no Fluig que event delegation no document)
   $("#btn-add-cnae").off("click.cnae").on("click.cnae", adicionarCnae);
   $(document).on("change", "input[name^='cnaeSecundario']", function () {});
   $(document).on("click", ".btn-remove-cnae", function () {
      $(this).closest(".cnae-secundario-item").remove();

      reordenarCnaesSecundarios();
      controlarBotaoAdicionarCnae();
   });
   $(document).on("input", ".cnae-secundario", function () {
      // só aplica máscara se não estiver bloqueado (validação)
      if (!$(this).hasClass("campo-readonly")) {
         aplicarMascaraCnae($(this));
      }
   });
}

// Gerencia a lista dinâmica de Grupos de Mercadoria:
//   - Adicionar: cria novo select via adicionarGrupoMercadoria() respeitando LIMITE_GRUPO_MERCADORIA
//   - Alterar: sincroniza imediatamente os hidden fields espelho
//   - Remover: remove o item, reordena e atualiza os hidden fields
function bindEventosGrupoMercadoria() {
   // Binding direto no botão estático (mais confiável no Fluig que event delegation no document)
   $("#btn-add-grupo-mercadoria").off("click.grupo").on("click.grupo", function () {
      adicionarGrupoMercadoria();
      sincronizarCamposDinamicosHidden();
   });

   $(document).on("change", ".grupo-mercadoria", function () {
      sincronizarCamposDinamicosHidden();
   });

   $(document).on("click", ".btn-remove-grupo-mercadoria", function () {
      $(this).closest(".grupo-mercadoria-item").remove();

      reordenarGruposMercadoria();
      sincronizarCamposDinamicosHidden();
      controlarBotaoAdicionarGrupoMercadoria();
   });
}
// Gerencia o clique no botão "Remover" de cada anexo:
//   1. Obtém o docId do ECM via hidden field ou buscando pelo nome na tabela do Fluig
//   2. Chama removerAnexoFluig() para acionar o botão de remoção nativo no frame pai
//   3. Inicia polling aguardarRemocaoConfirmada() para limpar o card visual
//      somente após a remoção ser confirmada no DOM do Fluig
// O off() antes do on() evita handlers duplicados em re-inicializações
function bindEventosUpload() {

   $(document).off("click", ".upload-file-remove");

   $(document).on("click", ".upload-file-remove", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const sufixoCampo = $(this).data("sufixo");
      const hiddenNome = getHiddenAnexoId(sufixoCampo);
      const hiddenId = hiddenNome + "Id";

      const nomeArquivo = ($("#" + hiddenNome).val() || "").trim();
      let docId = ($("#" + hiddenId).val() || "").trim();

      if (!docId && nomeArquivo) {
         docId = buscarIdAnexoPorNome(nomeArquivo);
      }

      if (!docId) {
         console.warn("Não foi possível localizar o docId do anexo:", sufixoCampo, nomeArquivo);
         return;
      }

      removerAnexoFluig({
   documentId: docId,
   nomeArquivo: nomeArquivo
});

      aguardarRemocaoConfirmada({
         sufixoCampo: sufixoCampo,
         docId: docId,
         nomeArquivo: nomeArquivo
      });
   });
}
// Polling de 300ms por até 9 segundos (30 tentativas) aguardando a linha do anexo
// desaparecer da #attachmentsTable do Fluig. Quando confirmado:
//   - limpa o card visual do upload
//   - atualiza o contador de anexos no badge do Fluig
//   - ressincroniza os hidden fields dinâmicos
function aguardarRemocaoConfirmada(config) {
   let tentativas = 0;
   const maxTentativas = 30;

   const intervalo = setInterval(function () {
      tentativas++;

      const aindaExiste = anexoAindaExisteNoFluig(config.docId, config.nomeArquivo);

      if (!aindaExiste) {
         clearInterval(intervalo);
         limparCardVisualAnexo(config.sufixoCampo);
         atualizarContadorAnexosFluig();
         sincronizarCamposDinamicosHidden();
         return;
      }

      if (tentativas >= maxTentativas) {
         clearInterval(intervalo);
         console.warn("Remoção cancelada ou não concluída:", config.sufixoCampo);
      }
   }, 300);
}

// Garante que os hidden fields espelho (hiddenGrupoMercadoria*, hiddenCnaeSecundario*)
// sejam atualizados a cada mudança nos campos dinâmicos. A chamada direta ao final
// faz a sincronização inicial caso já existam valores quando o evento é registrado.
function bindEventosCamposDinamicos() {
   $(document).on(
      "change input",
      "select[name^='grupoMercadoria'], input[name^='cnaeSecundario']",
      sincronizarCamposDinamicosHidden
   );
   sincronizarCamposDinamicosHidden();
}