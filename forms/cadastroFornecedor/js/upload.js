// UPLOAD DO FLUIG
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

         const sufixoCampo = obterSufixoUpload(inputId, $area);

         // 1 anexo por card: se já houver um arquivo, exige remover antes.
         if (cardJaTemAnexo(sufixoCampo)) {
            FLUIGC.toast({
               title: "Anexo já incluído",
               message: "Este documento já possui um anexo. Remova o atual antes de anexar outro.",
               type: "warning",
               timeout: 4500
            });
            return;
         }

         uploadAtualFluig = {
            inputId: inputId,
            areaId: $area.attr("id"),
            sufixoCampo: sufixoCampo
         };

         abrirAnexoNativoFluig();
      });
   });

   monitorarInputNativoFluig();
   iniciarMonitorPainelUploadFluig();
}

//ABRIR O INPUT NATIVO DE ANEXOS DO FLUIG 
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

//MONITORA O INPUT NATIVO DE ANEXOS DO FLUIG  PARA VALIDAR E FINALIZAR O UPLOAD
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

      const arquivo = this.files?.length ? this.files[0] : null;

      if (!arquivo) {
         return;
      }

      if (!validarArquivoPermitido(arquivo)) {
         _removerProximoAnexo = true;
         this.value = "";
         uploadAtualFluig = null;
         return;
      }

      // Backstop de "1 anexo por card" (caso o arquivo entre por outro caminho).
      if (cardJaTemAnexo(uploadAtualFluig.sufixoCampo)) {
         _removerProximoAnexo = true;
         this.value = "";
         FLUIGC.toast({
            title: "Anexo já incluído",
            message: "Este documento já possui um anexo. Remova o atual antes de anexar outro.",
            type: "warning",
            timeout: 4500
         });
         uploadAtualFluig = null;
         return;
      }

      // Não permitir o MESMO arquivo (mesmo nome) em cards diferentes.
      if (nomeJaAnexadoEmOutroCard(arquivo.name, uploadAtualFluig.sufixoCampo)) {
         _removerProximoAnexo = true;
         this.value = "";
         FLUIGC.toast({
            title: "Anexo duplicado",
            message: 'O arquivo "' + arquivo.name + '" já foi anexado em outro documento.',
            type: "warning",
            timeout: 4500
         });
         uploadAtualFluig = null;
         return;
      }

      finalizarUploadVisualFluig(uploadAtualFluig, arquivo.name);
      uploadAtualFluig = null;
   });
}

// HÁ ALGUM ANEXO NO CARD (hidden do anexo preenchido)
function cardJaTemAnexo(sufixoCampo) {
   const hiddenNome = getHiddenAnexoId(sufixoCampo);
   if (!hiddenNome) {
      return false;
   }
   return ($("#" + hiddenNome).val() || "").trim() !== "";
}

// VERIFICA SE O NOME DO ARQUIVO JÁ FOI ANEXADO EM OUTRO CARD (hidden diferente)
function nomeJaAnexadoEmOutroCard(nomeArquivo, sufixoAtual) {
   const alvo = String(nomeArquivo || "").trim().toLowerCase();
   if (!alvo) {
      return false;
   }

   const hiddenAtual = getHiddenAnexoId(sufixoAtual);
   let duplicado = false;

   Object.keys(MAPA_HIDDEN_ANEXOS).forEach(function (suf) {
      const hiddenId = MAPA_HIDDEN_ANEXOS[suf];
      if (hiddenId === hiddenAtual) {
         return;
      }
      const v = ($("#" + hiddenId).val() || "").trim().toLowerCase();
      if (v && v === alvo) {
         duplicado = true;
      }
   });

   return duplicado;
}

//INICIA O OBSERVADOR DE ANEXOS INVÁLIDOS PARA REMOVER AUTOMATICAMENTE
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

               
               if (Object.hasOwn(node.dataset, "emptyMessage")) {
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

// CLICA NO BOTÃO DE REMOVER ANEXO DO FLUIG E CONFIRMA A REMOÇÃO
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

// REMOVE A OCULTAÇÃO DO MODAL DE REMOÇÃO AUTOMÁTICA 
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

//FINALIZA O UPLOAD VISUAL DO FLUIG (ATUALIZA HIDDEN, STATUS E TOAST)
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
   $area.siblings(".erro-validacao").remove();
   $area.closest(".fg").removeClass("has-error has-erro");

   montarStatusAnexo(config.sufixoCampo, nomeArquivo);

   FLUIGC.toast({
      title: "Anexo incluído",
      message: nomeArquivo,
      type: "success",
      timeout: 3000
   });
}

// OCULTA O PAINEL NATIVO DE UPLOAD DO FLUIG (NAVEGAÇÃO E PROGRESSO)
function ocultarPainelUploadNativoFluig() {
   try {
      const $p = parent.$;
      if (!$p) return;

      $p([
         "#ecm-navigation-upload", ".ecm-navigation-upload",
         "#upload-files", ".upload-files",
         "#upload-list", ".upload-list",
         ".upload-progress", ".upload-progress-container",
         ".file-upload-progress", "#divUploadFiles"
      ].join(",")).hide();

      var els = parent.document.getElementsByTagName("*");
      for (var i = 0; i < els.length; i++) {
         var el = els[i];

         // texto DIRETO do elemento (ignora descendentes)
         var direto = "";
         var ns = el.childNodes || [];
         for (var j = 0; j < ns.length; j++) {
            if (ns[j].nodeType === 3) {
               direto += ns[j].nodeValue;
            }
         }
         direto = direto.replace(/\s+/g, " ").trim().toLowerCase();
         if (direto.indexOf("upload de arquivos") !== 0) {
            continue;
         }

         // sobe até o painel: 1º ancestral (até 8 níveis) que também contém o
         // progresso — garante que estamos ocultando o painel, não a página.
         var anc = el.parentNode;
         var nivel = 0;
         while (anc && nivel < 8) {
            var txt = (anc.textContent || "").toLowerCase();
            if (txt.indexOf("conclu") >= 0 || txt.indexOf("ver detalhes") >= 0) {
               $p(anc).hide();
               break;
            }
            anc = anc.parentNode;
            nivel++;
         }
      }
   } catch (e) {
      console.warn("[Upload] não foi possível ocultar painel nativo do Fluig:", e);
   }
}

// OCULTA O PAINEL NATIVO DE UPLOAD DO FLUIG EM INTERVALOS (CASO O FLUIG RE-RENDERIZE)
function agendarOcultarPainelUpload() {
   [100, 400, 900, 1600, 3000, 5000].forEach(function (ms) {
      setTimeout(ocultarPainelUploadNativoFluig, ms);
   });
}

// MANTEM O PAINEL NATIVO DE UPLOAD DO FLUIG OCULTO (CASO O FLUIG RE-RENDERIZE)
function iniciarMonitorPainelUploadFluig() {
   if (globalThis._monitorPainelUploadAtivo) {
      return;
   }
   globalThis._monitorPainelUploadAtivo = true;
   setInterval(function () {
      ocultarPainelUploadNativoFluig(false);
   }, 1500);
}

// BUSCA O ID DO ANEXO NO FLUIG PELO NOME (OU "" SE NÃO ENCONTRAR)
function buscarIdAnexoPorNome(nomeArquivo) {
   const $p = parent.$;

   const nome = String(nomeArquivo || "").trim();

   const $linha = $p("#attachmentsTable tbody tr").filter(function () {
      return $p(this).text().includes(nome);
   }).first();

   if (!$linha.length) {
      console.warn("Documento não encontrado na tabela:", nomeArquivo);
      return "";
   }

   const codigo = $linha.find("td").eq(2).text().trim();

   // Código "0" = anexo ainda não publicado. NÃO é um id confiável: usado para
   // remover, faria match com qualquer linha que contenha "0" (código, versão...)
   // e acabaria removendo o anexo errado. Nesse caso, removemos pelo nome.
   if (!codigo || codigo === "0") {
      return "";
   }

   return codigo;
}

// MONTA O STATUS VISUAL DO ANEXO (NOME + BOTÕES REMOVER/VISUALIZAR)
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
      .show(500);
   adicionarBotaoVisualizarAnexo(sufixoCampo, nomeArquivo);
}

// RESTAURA O STATUS VISUAL DE TODOS OS UPLOADS SALVOS (AO CARREGAR A PÁGINA)
function restaurarUploadsSalvos() {
   $(".upload-area").each(function () {
      const $area = $(this);
      const inputId = $area.data("upload-id");
      const sufixoCampo = obterSufixoUpload(inputId, $area);
      const hiddenId = getHiddenAnexoId(sufixoCampo);
      const nomeArquivo = hiddenId ? ($("#" + hiddenId).val() || "").trim() : "";

      if (!nomeArquivo || nomeArquivo === "✓" || nomeArquivo === "undefined") {
         $area.removeClass("uploaded upload-error");
         $("#statusFile" + sufixoCampo).hide(500).empty();
         return;
      }

      $area.addClass("uploaded").removeClass("upload-error");
      montarStatusAnexo(sufixoCampo, nomeArquivo);
   });
}

// RETORNA O ID DO HIDDEN DO ANEXO (OU "" SE NÃO MAPEADO)
function getHiddenAnexoId(sufixoCampo) {
   return MAPA_HIDDEN_ANEXOS[sufixoCampo] || "";
}

// ADICIONA O BOTÃO DE VISUALIZAR ANEXO (OU BAIXAR, DEPENDENDO DA ATIVIDADE)
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
   const nomeSeguro = (nomeArquivo || "").replaceAll("'", String.raw`\'`);

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

// ABRE O ANEXO NO FLUIG (NOVA ABA OU MODAL)
function visualizarAnexoFluig(nomeArquivo) {
   const $p = parent.$;

   abrirAbaAnexosFluig();

   const $linha = $p("#attachmentsTable tbody tr").filter(function () {
      return $p(this).text().replace(/\s+/g, " ").trim().includes(nomeArquivo);
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
      return $p(this).text().trim().includes(nomeArquivo);
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

// ESTADO E MAPEAMENTO DE UPLOAD
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

// ABRE A ABA DE ANEXOS DO FLUIG (SE ESTIVER OCULTA)
function abrirAbaAnexosFluig() {
   parent.$("#tab-attachments, #attachments-tab, a[href='#attachments']").first().click();
}

// RETORNA O SUFIXO DO CAMPO DE UPLOAD (EX: "CartaoCnpj" PARA "fileCartaoCnpj")
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

// LIMPA O STATUS VISUAL DO UPLOAD (HIDDEN, STATUS, CARD)
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
         return; 
      }

      limparVisualUploadConfirmado({
         sufixoCampo: sufixoCampo,
         areaId: areaId,
         hiddenNome: hiddenNome,
         hiddenDocId: hiddenDocId
      });
   }, 800);
}

// VERIFICA SE O ANEXO AINDA EXISTE NA TABELA DE ANEXOS DO FLUIG (PELO ID OU NOME)
function anexoAindaExisteNoFluig(docId, nomeArquivo) {
   const $p = parent.$;
   const id = String(docId || "").trim();
   const nome = String(nomeArquivo || "").trim();

   const $linha = $p("#attachmentsTable tbody tr").filter(function () {
      if (id && id !== "0") {
         return $p(this).find("td").eq(2).text().trim() === id;
      }
      // Sem código confiável: confere pela presença do nome do arquivo na linha.
      return nome && $p(this).text().replace(/\s+/g, " ").trim().indexOf(nome) >= 0;
   }).first();

   return $linha.length > 0;
}

// LIMPA O STATUS VISUAL DO UPLOAD (HIDDEN, STATUS, CARD) APÓS CONFIRMAÇÃO DE REMOÇÃO
function limparVisualUploadConfirmado(config) {
   const sufixoCampo = config.sufixoCampo;
   const areaId = config.areaId;
   const hiddenNome = config.hiddenNome;
   const hiddenDocId = config.hiddenDocId;

   if (areaId) {
      $("#" + areaId).removeClass("uploaded upload-error");
   }

   $("#statusFile" + sufixoCampo).hide(500).empty();

   if (hiddenNome) {
      $("#" + hiddenNome).val("");
   }

   if (hiddenDocId) {
      $("#" + hiddenDocId).val("");
   }
}

// REMOVE O ANEXO DO FLUIG (CLICA NO BOTÃO DE REMOVER OU MARCA CHECKBOX E CONFIRMA)
function removerAnexoFluig(config) {
   const nomeArquivo = config?.nomeArquivo || "";
   const documentId = config?.documentId || "";
   const $p = parent.$;

   let $linha = $();

   if (documentId) {
      $linha = $p("#attachmentsTable tbody tr").filter(function () {
         return $p(this).text().includes(documentId);
      }).first();
   }

   if (!$linha.length && nomeArquivo) {
      $linha = $p("#attachmentsTable tbody tr").filter(function () {
         return $p(this).text().replace(/\s+/g, " ").trim().includes(nomeArquivo);
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

// VALIDAÇÃO DE UPLOADS
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

// MARCA O CAMPO DE UPLOAD COM ERRO (ADICIONA CLASSES E MENSAGEM)
function marcarUploadErro(campoId, mensagem) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");
   const $area = $container.find(".upload-area").first();
   const mensagemId = "erro-" + campoId;

   limparErroCampo(campoId);

   $container.addClass("has-erro");
   $area.addClass("upload-error").removeClass("uploaded");

   $area.after(
      '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
      mensagem +
      "</small>"
   );
}

// LIMPA O STATUS VISUAL DO UPLOAD (HIDDEN, STATUS, CARD)
function limparCardVisualAnexo(sufixoCampo) {
   const hiddenNome = getHiddenAnexoId(sufixoCampo);
   const hiddenId = hiddenNome + "Id";

   $("#statusFile" + sufixoCampo).hide(500).empty();
   $("#upload" + sufixoCampo).removeClass("uploaded upload-error");

   if (hiddenNome) {
      $("#" + hiddenNome).val("").attr("value", "");
      $("#" + hiddenId).val("").attr("value", "");
   }

   $("#file" + sufixoCampo).val("");
}

// MARCA O CAMPO DE UPLOAD COM SUCESSO (ADICIONA CLASSES E REMOVE ERRO)
function marcarUploadSucesso(campoId) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");
   const $area = $container.find(".upload-area").first();

   limparErroCampo(campoId);

   $container.removeClass("has-erro");
   $area.removeClass("upload-error").addClass("uploaded");
}

// VALIDA SE O ARQUIVO É PERMITIDO (PDF, PNG, JPG, JPEG)
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

// OCULTA O TOAST DE REMOÇÃO AUTOMÁTICA DE ANEXOS INVÁLIDOS (CASO EXISTA)
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
               texto.includes("anexo foi removido") ||
               texto.includes("anexo removido")
            );
         })
         .remove();
   }, 50);

   setTimeout(function () {
      $p(".toast, .alert, .fluig-toast, .notification")
         .filter(function () {
            const texto = $p(this).text().toLowerCase();

            return (
               texto.includes("anexo foi removido") ||
               texto.includes("anexo removido")
            );
         })
         .remove();
   }, 300);
}

// OCULTA O MODAL DE REMOÇÃO AUTOMÁTICA DE ANEXOS INVÁLIDOS (CASO EXISTA)
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

// REMOVE A OCULTAÇÃO DO MODAL DE REMOÇÃO AUTOMÁTICA DE ANEXOS INVÁLIDOS
function removerOcultacaoModalRemocaoAutomatica() {
   parent.$("#cssOcultaModalRemocaoInvalido").remove();
   parent.$(".modal-backdrop").remove();
   parent.$("body").removeClass("modal-open").css("padding-right", "");
}

