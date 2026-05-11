function inicializarUploadsFluig() {
   $(".upload-area").each(function () {
      const $area = $(this);
      const inputId = $area.data("upload-id");
      const $input = $("#" + inputId);

      if (!$input.length) {
         return;
      }

      $area.off("click").on("click", function (e) {
         e.preventDefault();
         e.stopPropagation();

         if ($area.hasClass("disabled-upload")) {
            return;
         }

         uploadAtualFluig = {
            inputId: inputId,
            areaId: $area.attr("id"),
            sufixoCampo: obterSufixoUpload(inputId, $area)
         };

         abrirAnexoNativoFluig();
      });
   });

   monitorarInputNativoFluig();
}

function abrirAnexoNativoFluig() {
   const $inputFluig = parent.$("#ecm-navigation-inputFile-clone");

   if (!$inputFluig.length) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Input nativo de anexos do Fluig não encontrado.",
         type: "warning"
      });
      return;
   }

   $inputFluig.val("");
   $inputFluig.click();
}
// Flag: indica que o próximo <tr> inserido é inválido e deve ser removido
let _removerProximoAnexo = false;

function monitorarInputNativoFluig() {
   const $inputFluig = parent.$("#ecm-navigation-inputFile-clone");

   if (!$inputFluig.length) {
      return;
   }

   _iniciarObservadorAnexosInvalidos();

   $inputFluig.off("change.uploadCustomForm").on("change.uploadCustomForm", function () {
      if (!uploadAtualFluig) {
         return;
      }

      const arquivo = this.files && this.files.length ? this.files[0] : null;

      if (!arquivo) {
         return;
      }

      if (!validarArquivoPermitido(arquivo)) {
         _removerProximoAnexo = true;
         this.value = "";
         uploadAtualFluig = null;
         return;
      }

      finalizarUploadVisualFluig(uploadAtualFluig, arquivo.name);
      uploadAtualFluig = null;
   });
}

/**
 * Observa o tbody da tabela de anexos do Fluig.
 * Quando _removerProximoAnexo === true e uma linha real é inserida,
 * clica no botão de remoção e confirma automaticamente o modal.
 */
function _iniciarObservadorAnexosInvalidos() {
   try {
      const tbody = parent.document.querySelector("#attachmentsTable tbody");

      if (!tbody || tbody._observandoAnexosInvalidos) {
         return;
      }

      tbody._observandoAnexosInvalidos = true;

      const observer = new MutationObserver(function (mutations) {
         if (!_removerProximoAnexo) {
            return;
         }

         mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
               if (node.nodeType !== 1) {
                  return;
               }

               // Ignora a linha vazia que o Fluig insere quando a tabela fica sem itens
               if (node.hasAttribute("data-empty-message")) {
                  return;
               }

               _removerProximoAnexo = false;
               _clicarBotaoRemoverFluig(node);
            });
         });
      });

      observer.observe(tbody, {
         childList: true
      });
   } catch (e) {
      console.warn("[Upload] Não foi possível iniciar observer:", e);
   }
}

/**
 * Clica no botão de remoção da linha e confirma automaticamente o modal do Fluig.
 * Seletor [data-attachment-remove] confirmado via diagnóstico de produção.
 */
function _clicarBotaoRemoverFluig(trNode) {
   const $p = parent.$;
   const $linha = $p(trNode);

   parent.__remocaoAutomaticaAnexoInvalido = true;
   ocultarModalRemocaoAutomaticaAtivo();

   const $btn = $linha
      .find("[data-attachment-remove], [title='Excluir'], .flaticon-trash, .fluigicon-trash")
      .first();

   if ($btn.length) {
      $btn[0].click();

      setTimeout(function () {
         const $modal = $p(".modal:visible, .fluig-modal:visible").last();

         $modal
            .find(".btn-primary, button:contains('Sim'), button:contains('Confirmar')")
            .filter(":visible")
            .first()
            .click();

         ocultarToastRemocaoAutomatica();

         setTimeout(function () {
            ocultarToastRemocaoAutomatica();
            removerOcultacaoModalRemocaoAutomatica();
            parent.__remocaoAutomaticaAnexoInvalido = false;
         }, 1000);
      }, 80);
   }
}
/**
 * Aguarda o modal de confirmação do Fluig ("Deseja remover o anexo?")
 * e clica automaticamente em "Sim".
 */


function atualizarContadorAnexosFluig() {
   const $p = parent.$;

   const total = $p("#attachmentsTable tbody tr").filter(function () {
      return !$p(this).is("[data-empty-message]");
   }).length;

   $p(".badge")
      .filter(function () {
         return $p(this).closest("a, li, div").text().includes("Anexos");
      })
      .text(total);
}

function aguardarRemocaoAnexo(nomeArquivo) {
   let tentativas = 0;
   const maxTentativas = 20;

   const intervalo = setInterval(function () {
      tentativas++;

      const removeu = removerAnexoFluig({
         nomeArquivo: nomeArquivo,
         documentId: ""
      });

      if (removeu || tentativas >= maxTentativas) {
         clearInterval(intervalo);
      }
   }, 300);
}

function finalizarUploadVisualFluig(config, nomeArquivo) {
   const $area = $("#" + config.areaId);

   const hiddenNome = getHiddenAnexoId(config.sufixoCampo);
   const hiddenId = hiddenNome + "Id";

   $("#" + hiddenNome).val(nomeArquivo);

   const docId = buscarIdAnexoPorNome(nomeArquivo);

   if (docId) {
      $("#" + hiddenId).val(docId);
   }

   $area.addClass("uploaded").removeClass("upload-error");

   montarStatusAnexo(config.sufixoCampo, nomeArquivo);
}

function buscarIdAnexoPorNome(nomeArquivo) {
   const $p = parent.$;

   const nome = String(nomeArquivo || "").trim();

   const $linha = $p("#attachmentsTable tbody tr").filter(function () {
      return $p(this).text().indexOf(nome) !== -1;
   }).first();

   if (!$linha.length) {
      console.warn("Documento não encontrado na tabela:", nomeArquivo);
      return "";
   }

   // Colunas visíveis:
   // 0 = checkbox
   // 1 = título
   // 2 = código/documentId
   const codigo = $linha.find("td").eq(2).text().trim();

   return codigo;
}
function montarStatusAnexo(sufixoCampo, nomeArquivo) {
   const $status = $("#statusFile" + sufixoCampo);

   if (!$status.length) return;

   $status
      .html(
         '<div class="file-name">' +
         '<span id="nomeFile' + sufixoCampo + '">' + nomeArquivo + '</span>' +
         '</div>' +
         '<div class="file-actions">' +
         '<span class="upload-file-remove" ' +
         'data-input-id="file' + sufixoCampo + '" ' +
         'data-area-id="upload' + sufixoCampo + '" ' +
         'data-sufixo="' + sufixoCampo + '">' +
         '<i class="flaticon flaticon-trash icon-sm"></i> Remover' +
         '</span>' +
         '</div>'
      )
      .show();
   adicionarBotaoVisualizarAnexo(sufixoCampo, nomeArquivo);
}

function restaurarUploadsSalvos() {
   $(".upload-area").each(function () {
      const $area = $(this);
      const inputId = $area.data("upload-id");
      const sufixoCampo = obterSufixoUpload(inputId, $area);
      const hiddenId = getHiddenAnexoId(sufixoCampo);
      const nomeArquivo = hiddenId ? ($("#" + hiddenId).val() || "").trim() : "";

      if (!nomeArquivo || nomeArquivo === "✓" || nomeArquivo === "undefined") {
         $area.removeClass("uploaded upload-error");
         $("#statusFile" + sufixoCampo).hide().empty();
         return;
      }

      $area.addClass("uploaded").removeClass("upload-error");
      montarStatusAnexo(sufixoCampo, nomeArquivo);
   });
}

function getHiddenAnexoId(sufixoCampo) {
   return MAPA_HIDDEN_ANEXOS[sufixoCampo] || "";
}

function garantirCampoNomeAnexo(sufixoCampo) {
   const hiddenId = "hiddenNomeFile" + sufixoCampo;

   if (!$("#" + hiddenId).length) {
      $("#divDocumentacao").append(
         '<input type="hidden" id="' + hiddenId + '" name="' + hiddenId + '">'
      );
   }
}

function adicionarBotaoVisualizarAnexo(sufixoCampo, nomeArquivo) {
   const statusId = "#statusFile" + sufixoCampo;

   if (!$(statusId).length) {
      console.warn("Container não encontrado:", statusId);
      return;
   }

   const atividade = Number($("#atividade").val() || 0);

   const isDownload =
      atividade === ATIVIDADES.INICIO_0 ||
      atividade === ATIVIDADES.INICIO;

   const $status = $(statusId);
   const nomeSeguro = (nomeArquivo || "").replaceAll("'", "\\'");

   const $removeBtn = $status.find(".upload-file-remove").first();

   if (!$removeBtn.length) {
      console.warn("Botão remover não encontrado em:", statusId);
      return;
   }

   const removeHtml = $removeBtn[0].outerHTML;

   $status.find(".file-actions").remove();
   $removeBtn.remove();

   const html =
      '<div class="file-actions">' +
      removeHtml +
      '<button type="button" ' +
      'class="btn-visualizar-anexo" ' +
      'title="' + (isDownload ? 'Baixar anexo' : 'Visualizar anexo') + '" ' +
      'onclick="visualizarAnexoFluig(\'' + nomeSeguro + '\')">' +
      '<i class="fluigicon ' + (isDownload ? 'fluigicon-download' : 'fluigicon-eye-open') + '" style="font-size:13px;"></i>' +
      '<span>' + (isDownload ? 'Baixar' : 'Visualizar') + '</span>' +
      '</button>' +
      '</div>';

   $status.append(html);
}

function visualizarAnexoFluig(nomeArquivo) {
   const $p = parent.$;

   abrirAbaAnexosFluig();

   const $linha = $p("#attachmentsTable tbody tr").filter(function () {
      return $p(this).text().replace(/\s+/g, " ").trim().indexOf(nomeArquivo) !== -1;
   }).first();

   if (!$linha.length) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Anexo não encontrado: " + nomeArquivo,
         type: "warning"
      });
      return;
   }

   const $linkNome = $linha.find("a").filter(function () {
      return $p(this).text().trim().indexOf(nomeArquivo) !== -1;
   }).first();

   if ($linkNome.length) {
      $linkNome[0].click();
      return;
   }

   const $primeiroLink = $linha.find("a").first();

   if ($primeiroLink.length) {
      $primeiroLink[0].click();
      return;
   }

   $linha.trigger("dblclick");
}

let uploadAtualFluig = null;
const MAPA_HIDDEN_ANEXOS = {
   CartaoCnpj: "anxCartaoCnpj",
   ComprovanteBanco: "anxCompBanco",
   ContratoSocial: "anxContrato",
   RgCpf: "anxRgCpf",
   ComprovanteEndereco: "anxCompEndereco",
   LaudoMedicoPcd: "anxLaudoPcd",
   DeclaracaoDependentesIrrf: "anxDependentes",
   CodigoConduta: "anxCodConduta",
   PoliticaAnticorrupcao: "anxAntiCorrupcao",
   ConflitoInteresses: "anxConflito",
   CienciaLgpd: "anxLgpd"
};

function abrirAbaAnexosFluig() {
   parent.$("#tab-attachments, #attachments-tab, a[href='#attachments']").first().click();
}

function obterSufixoUpload(inputId, $area) {
   const areaId = $area.attr("id") || "";

   if (areaId.indexOf("upload") === 0) {
      return areaId.replace("upload", "");
   }

   if (inputId.indexOf("file") === 0) {
      return inputId.replace("file", "");
   }

   return "";
}

function limparStatusUpload(config) {
   const sufixoCampo = config?.sufixoCampo || "";
   const areaId = config?.areaId || "";

   if (!sufixoCampo) return;

   const hiddenNome = getHiddenAnexoId(sufixoCampo);
   const hiddenDocId = hiddenNome ? hiddenNome + "Id" : "";

   const nomeArquivo = hiddenNome ? ($("#" + hiddenNome).val() || "").trim() : "";
   const documentId = hiddenDocId ? ($("#" + hiddenDocId).val() || "").trim() : "";

   if (!nomeArquivo && !documentId) return;

   removerAnexoFluig({
      nomeArquivo: nomeArquivo,
      documentId: documentId
   });

   setTimeout(function () {
      const aindaExiste = anexoAindaExisteNoFluig(documentId, nomeArquivo);

      if (aindaExiste) {
         return; // clicou em NÃO, mantém o card
      }

      limparVisualUploadConfirmado({
         sufixoCampo: sufixoCampo,
         areaId: areaId,
         hiddenNome: hiddenNome,
         hiddenDocId: hiddenDocId
      });
   }, 800);
}

function anexoAindaExisteNoFluig(docId, nomeArquivo) {
   const $p = parent.$;
   const id = String(docId || "").trim();

   const $linha = $p("#attachmentsTable tbody tr").filter(function () {
      const codigo = $p(this).find("td").eq(2).text().trim();
      return codigo === id;
   }).first();

   return $linha.length > 0;
}

function limparVisualUploadConfirmado(config) {
   const sufixoCampo = config.sufixoCampo;
   const areaId = config.areaId;
   const hiddenNome = config.hiddenNome;
   const hiddenDocId = config.hiddenDocId;

   if (areaId) {
      $("#" + areaId).removeClass("uploaded upload-error");
   }

   $("#statusFile" + sufixoCampo).hide().empty();

   if (hiddenNome) {
      $("#" + hiddenNome).val("");
   }

   if (hiddenDocId) {
      $("#" + hiddenDocId).val("");
   }
}

function removerAnexoFluig(config) {
   const nomeArquivo = config?.nomeArquivo || "";
   const documentId = config?.documentId || "";
   const $p = parent.$;

   let $linha = $();

   if (documentId) {
      $linha = $p("#attachmentsTable tbody tr").filter(function () {
         return $p(this).text().indexOf(documentId) !== -1;
      }).first();
   }

   if (!$linha.length && nomeArquivo) {
      $linha = $p("#attachmentsTable tbody tr").filter(function () {
         return $p(this).text().replace(/\s+/g, " ").trim().indexOf(nomeArquivo) !== -1;
      }).first();
   }

   if (!$linha.length) {
      return false;
   }

   const $btnRemover = $linha.find(
      ".fluigicon-trash, .flaticon-trash, .ecm-attachment-remove, [title*='Remover'], [title*='Excluir'], [data-remove]"
   ).first();

   if ($btnRemover.length) {
      $btnRemover.click();
      return true;
   }

   const $checkbox = $linha.find("input[type='checkbox']").first();

   if ($checkbox.length) {
      $checkbox.prop("checked", true).trigger("change");

      $p("#ecm-navigation-delete, #ecm-navigation-remove, .ecm-navigation-delete, [title*='Excluir']")
         .first()
         .click();

      return true;
   }

   return false;
}


function validarUploadObrigatorio(campoId, label) {
   const sufixo = campoId.replace("file", "");
   const hiddenId = MAPA_HIDDEN_ANEXOS[sufixo];

   if (!hiddenId) {
      console.warn("Hidden não mapeado para:", campoId);
      return true;
   }

   const valor = ($("#" + hiddenId).val() || "").trim();

   if (!valor) {
      marcarUploadErro(campoId, "Anexo '" + label + "' é obrigatório.");
      return false;
   }

   marcarUploadSucesso(campoId);
   return true;
}

function marcarUploadErro(campoId, mensagem) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");
   const $area = $container.find(".upload-area").first();
   const mensagemId = "erro-" + campoId;

   limparErroCampo(campoId);

   $container.addClass("has-error");
   $area.addClass("upload-error").removeClass("uploaded");

   $area.after(
      '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
      mensagem +
      "</small>"
   );
}
function limparCardVisualAnexo(sufixoCampo) {
   const hiddenNome = getHiddenAnexoId(sufixoCampo);
   const hiddenId = hiddenNome + "Id";

   $("#statusFile" + sufixoCampo).hide().empty();
   $("#upload" + sufixoCampo).removeClass("uploaded upload-error");

   if (hiddenNome) {
      $("#" + hiddenNome).val("").attr("value", "");
      $("#" + hiddenId).val("").attr("value", "");
   }

   $("#file" + sufixoCampo).val("");
}
function marcarUploadSucesso(campoId) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");
   const $area = $container.find(".upload-area").first();

   limparErroCampo(campoId);

   $container.removeClass("has-error");
   $area.removeClass("upload-error").addClass("uploaded");
}

function validarArquivoPermitido(file) {
   const extensoesPermitidas = [".pdf", ".png", ".jpg", ".jpeg"];
   const nomeArquivo = (file.name || "").toLowerCase();

   const extensaoValida = extensoesPermitidas.some(function (ext) {
      return nomeArquivo.endsWith(ext);
   });

   if (!extensaoValida) {
      FLUIGC.toast({
         title: "Arquivo inválido",
         message: "Somente arquivos PDF, PNG, JPG ou JPEG são permitidos.",
         type: "danger",
         timeout: 5000
      });

      setTimeout(function () {
         $(".toast, .fluig-toast, .alert")
            .filter(function () {
               const texto = $(this).text().toLowerCase();
               return texto.includes("arquivo inválido");
            })
            .fadeOut(300, function () {
               $(this).remove();
            });
      }, 5000);

      return false;
   }

   return true;
}

function ocultarToastRemocaoAutomatica() {
   const $p = parent.$;

   if (!parent.__remocaoAutomaticaAnexoInvalido) {
      return;
   }

   setTimeout(function () {
      $p(".toast, .alert, .fluig-toast, .notification")
         .filter(function () {
            const texto = $p(this).text().toLowerCase();

            return (
               texto.indexOf("anexo foi removido") !== -1 ||
               texto.indexOf("anexo removido") !== -1
            );
         })
         .remove();
   }, 50);

   setTimeout(function () {
      $p(".toast, .alert, .fluig-toast, .notification")
         .filter(function () {
            const texto = $p(this).text().toLowerCase();

            return (
               texto.indexOf("anexo foi removido") !== -1 ||
               texto.indexOf("anexo removido") !== -1
            );
         })
         .remove();
   }, 300);
}

function ocultarModalRemocaoAutomaticaAtivo() {
   const $p = parent.$;

   $p("#cssOcultaModalRemocaoInvalido").remove();

   $p("head").append(
      '<style id="cssOcultaModalRemocaoInvalido">' +
      '.modal, .modal-backdrop, .fluig-modal {' +
      'opacity: 0 !important;' +
      'visibility: hidden !important;' +
      'pointer-events: none !important;' +
      '}' +
      'body.modal-open {' +
      'overflow: auto !important;' +
      '}' +
      '</style>'
   );
}

function removerOcultacaoModalRemocaoAutomatica() {
   parent.$("#cssOcultaModalRemocaoInvalido").remove();
   parent.$(".modal-backdrop").remove();
   parent.$("body").removeClass("modal-open").css("padding-right", "");
}

