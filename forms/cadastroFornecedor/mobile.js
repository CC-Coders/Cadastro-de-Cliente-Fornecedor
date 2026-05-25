
/**
 * @returns {boolean} 
 */
function isMobileFluig() {
   try {
      if (
         typeof formController !== "undefined" &&
         typeof formController.getMobile === "function"
      ) {
         return !!formController.getMobile();
      }
   } catch (_) {

   }

   const ua = (navigator.userAgent || "").toLowerCase();
   if (
      ua.includes("fluig")   ||
      ua.includes("android") ||
      ua.includes("iphone")  ||
      ua.includes("ipad")    ||
      ua.includes("mobile")
   ) {
      return true;
   }

   return window.innerWidth <= 768;
}

function aplicarLayoutMobile() {
   const mobile = isMobileFluig();
   document.documentElement.setAttribute("data-device", mobile ? "mobile" : "desktop");

   if (!mobile) return;

   $("body").addClass("fluig-mobile");
}

$(document).ready(function () {
   if (!isMobileFluig()) return;

   $(document).on("click.mobileNav", ".step-item", function () {
      $(".stepper-nav-wrap").removeClass("menu-open");
      $("body").removeClass("menu-open-mobile");
   });

   $(document).on("click.mobileNav", "#btn-avancar", function () {
      setTimeout(function () {
         var $primeiroErro = $(".fg.has-erro:visible").first();
         if (!$primeiroErro.length) return;
         var offsetTopo = $primeiroErro.offset().top - 140;
         $("html, body").animate({ scrollTop: Math.max(0, offsetTopo) }, 280);
      }, 60);
   });

   // ─────────────────────────────────────────────────────────────────────────
   // UPLOAD MOBILE — estratégia em duas fases
   //
   // Fase 1 — Seleção: abre o seletor nativo via <input type="file"> do form.
   //
   // Fase 2 — Envio para o ECM:
   //   O Fluig Desktop usa parent.#ecm-navigation-inputFile-clone → Fluig faz
   //   o upload para ECM → o arquivo aparece no processo.
   //   No mobile, parent === window e esse elemento não existe.
   //
   //   Tentativa A (DataTransfer):
   //     Procura o input do Fluig testando vários seletores.
   //     Se achar, injeta o File via DataTransfer e dispara "change".
   //     O handler nativo do Fluig faz o upload para ECM normalmente.
   //
   //   Tentativa B (Fallback visual):
   //     Se o input do Fluig não for encontrado, atualiza apenas o visual
   //     e armazena o File em _mobileFiles para visualização via blob URL.
   //     O arquivo fica no <input type="file"> do formulário — o Fluig Mobile
   //     pode processá-lo ao enviar, dependendo da versão do app.
   // ─────────────────────────────────────────────────────────────────────────

   /** File objects por sufixoCampo — usados pelo fallback de visualização */
   var _mobileFiles = {};

   /**
    * Procura o input nativo do Fluig que dispara o upload para o ECM.
    * Testa múltiplos seletores para cobrir diferentes versões do app/portal.
    * @returns {jQuery|null}
    */
   function _encontrarInputFluig() {
      var tentativas = [
         function () { return parent.$("#ecm-navigation-inputFile-clone"); },
         function () { return $("#ecm-navigation-inputFile-clone"); },
         function () { return parent.$("input[id*='inputFile'][type='file']").first(); },
         function () {
            return parent.$("input[type='file']").filter(function () {
               var s = (this.style.cssText || "").replace(/\s/g, "");
               return s.indexOf("display:none") !== -1 ||
                      s.indexOf("position:absolute") !== -1;
            }).first();
         }
      ];
      for (var i = 0; i < tentativas.length; i++) {
         try {
            var $el = tentativas[i]();
            if ($el && $el.length) return $el;
         } catch (_) { /* cross-origin ou parent inacessível */ }
      }
      return null;
   }

   /**
    * Injeta o File no input do Fluig via DataTransfer e dispara "change".
    * O handler do upload.js (monitorarInputNativoFluig) + o handler nativo
    * do Fluig fazem o upload para ECM em seguida.
    * @returns {boolean} true se a injeção foi bem-sucedida
    */
   function _injetarViaDataTransfer($inputFluig, arquivo, sufixoCampo, $area) {
      try {
         // uploadAtualFluig precisa estar definido ANTES do change disparar,
         // pois monitorarInputNativoFluig() o usa para identificar a upload-area.
         uploadAtualFluig = {
            inputId:     "file" + sufixoCampo,
            areaId:      $area.attr("id") || "",
            sufixoCampo: sufixoCampo
         };

         var dt = new DataTransfer();
         dt.items.add(arquivo);
         $inputFluig[0].files = dt.files; // atribui o File ao input do Fluig
         $inputFluig.trigger("change");   // ativa o handler do Fluig → ECM upload

         return true;
      } catch (err) {
         console.warn("[Mobile Upload] DataTransfer falhou:", err.message);
         uploadAtualFluig = null;
         return false;
      }
   }

   /**
    * Fallback quando o input do Fluig não é encontrado ou DataTransfer falha.
    * Atualiza o visual e permite visualização local via blob URL.
    * O arquivo permanece no <input type="file"> do formulário.
    */
   function _fallbackVisualLocal(arquivo, sufixoCampo, $area) {
      if (_mobileFiles[sufixoCampo] && _mobileFiles[sufixoCampo]._blobUrl) {
         URL.revokeObjectURL(_mobileFiles[sufixoCampo]._blobUrl);
      }
      _mobileFiles[sufixoCampo] = arquivo;

      var hiddenNome = typeof getHiddenAnexoId === "function"
                         ? getHiddenAnexoId(sufixoCampo) : "";
      if (hiddenNome) $("#" + hiddenNome).val(arquivo.name);

      $area.addClass("uploaded").removeClass("upload-error");
      $area.siblings(".erro-validacao").remove();
      $area.closest(".fg").removeClass("has-erro has-error");

      if (typeof montarStatusAnexo === "function") {
         montarStatusAnexo(sufixoCampo, arquivo.name);
      }

      // Substitui o botão "Visualizar" para abrir via blob URL local.
      // adicionarBotaoVisualizarAnexo cria o botão com onclick="visualizarAnexoFluig(...)"
      // (atributo inline). ev.stopImmediatePropagation() NÃO para handlers inline —
      // é preciso remover o atributo antes de adicionar o nosso handler.
      setTimeout(function () {
         var sid = "#statusFile" + sufixoCampo;

         $(sid + " .btn-visualizar-anexo")
            .removeAttr("onclick")           // elimina visualizarAnexoFluig (busca parent.ECM)
            .off("click")
            .on("click", function (ev) {
               ev.preventDefault();
               ev.stopImmediatePropagation();
               var f = _mobileFiles[sufixoCampo];
               if (!f) {
                  FLUIGC.toast({ title: "Atenção", message: "Arquivo não encontrado.", type: "warning" });
                  return;
               }
               if (!f._blobUrl) f._blobUrl = URL.createObjectURL(f);
               window.open(f._blobUrl, "_blank");
            });

         $(sid + " .upload-file-remove")
            .off("click.mobileRemove")
            .on("click.mobileRemove", function () {
               var f = _mobileFiles[sufixoCampo];
               if (f && f._blobUrl) URL.revokeObjectURL(f._blobUrl);
               delete _mobileFiles[sufixoCampo];
               // upload.js cuida de limpar os hiddens e o visual
            });
      }, 300); // 300ms: garante que adicionarBotaoVisualizarAnexo já terminou
   }

   // ── Sobrescreve os handlers das .upload-area após inicializarUploadsFluig() ──
   setTimeout(function () {

      // iOS WKWebView: .click() programático em <input type="file"> NÃO é confiável —
      // o evento change pode não disparar mesmo que o picker abra.
      //
      // Solução (overlay direto): em vez de capturar o clique no card e chamar
      // .click() em outro input, sobrepõe um <input type="file" opacity:0> que
      // COBRE toda a .upload-area. Quando o utilizador toca no card, toca
      // DIRETAMENTE no input → o iOS dispara change de forma nativa e confiável.
      $(".upload-area").each(function () {
         var $area       = $(this);
         var inputId     = $area.data("upload-id") || "";
         var $fileInput  = $("#" + inputId);
         if (!$fileInput.length) return;

         var accept      = $fileInput.attr("accept") || "";
         var sufixoCampo = typeof obterSufixoUpload === "function"
                             ? obterSufixoUpload(inputId, $area)
                             : inputId.replace(/^file/, "");

         // Remove overlay anterior e o handler do upload.js (abrirAnexoNativoFluig)
         $area.find(".mobile-file-overlay").remove();
         $area.off("click");

         // .upload-area precisa de position != static para filho absolute funcionar
         if (window.getComputedStyle($area[0]).position === "static") {
            $area.css("position", "relative");
         }

         // opacity:0 ≠ display:none → iOS trata como input real → change confiável
         var $overlay = $('<input type="file" class="mobile-file-overlay">')
            .attr("accept", accept)
            .css({
               position : "absolute",
               top      : "0",
               left     : "0",
               width    : "100%",
               height   : "100%",
               opacity  : "0",
               cursor   : "pointer",
               zIndex   : "5",
               margin   : "0",
               padding  : "0"
            })
            .appendTo($area);

         $overlay.on("change", function () {
            if ($area.hasClass("disabled-upload")) return;

            var arquivo = this.files && this.files[0];
            this.value = ""; // permite re-selecionar o mesmo arquivo

            // ── DEBUG: confirma que o evento disparou no WebView ──────────────
            try {
               FLUIGC.toast({
                  title   : "📎 Upload",
                  message : arquivo ? arquivo.name : "nenhum arquivo selecionado",
                  type    : "info",
                  timeout : 4000
               });
            } catch (_) {}
            // ──────────────────────────────────────────────────────────────────

            if (!arquivo) return;

            // Valida extensão antes de qualquer coisa
            if (typeof validarArquivoPermitido === "function" &&
                !validarArquivoPermitido(arquivo)) {
               return;
            }

            // Tentativa A: injeta no mecanismo nativo do Fluig via DataTransfer
            var $inputFluig = _encontrarInputFluig();
            var ok = $inputFluig
                       ? _injetarViaDataTransfer($inputFluig, arquivo, sufixoCampo, $area)
                       : false;

            // Tentativa B: fallback visual local
            if (!ok) _fallbackVisualLocal(arquivo, sufixoCampo, $area);
         });
      });

   }, 600); // aguarda inicializarUploadsFluig() executar no document.ready
});
