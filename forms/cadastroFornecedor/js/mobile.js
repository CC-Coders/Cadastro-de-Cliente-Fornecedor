
// DETECTA O AMBIENTE MOBILE DO FLUIG UTILIZANDO INFORMAÇÕES DO FORMCONTROLLER, USERAGENT OU DIMENSÃO DA TELA
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

// APLICA O IDENTIFICADOR DE DISPOSITIVO NO HTML E ADICIONA A CLASSE MOBILE QUANDO O ACESSO FOR REALIZADO POR DISPOSITIVO MÓVEL
function aplicarLayoutMobile() {
   const mobile = isMobileFluig();
   document.documentElement.setAttribute("data-device", mobile ? "mobile" : "desktop");

   if (!mobile) return;

   $("body").addClass("fluig-mobile");
}

// APLICA O IDENTIFICADOR DE DISPOSITIVO NO HTML E ADICIONA A CLASSE MOBILE QUANDO O ACESSO FOR REALIZADO POR DISPOSITIVO MÓVEL
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

   var _mobileFiles = {};

   // LOCALIZA O INPUT DE ARQUIVO NATIVO DO FLUIG PARA UTILIZAR O MECANISMO PADRÃO DE UPLOAD DO SISTEMA
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
         } catch (_) {}
      }
      return null;
   }

   // INSERE O ARQUIVO SELECIONADO NO INPUT NATIVO DO FLUIG UTILIZANDO DATATRANSFER E DISPARA O EVENTO DE ALTERAÇÃO DO CAMPO
   function _injetarViaDataTransfer($inputFluig, arquivo, sufixoCampo, $area) {
      try {

         uploadAtualFluig = {
            inputId:     "file" + sufixoCampo,
            areaId:      $area.attr("id") || "",
            sufixoCampo: sufixoCampo
         };

         var dt = new DataTransfer();
         dt.items.add(arquivo);
         $inputFluig[0].files = dt.files;
         $inputFluig.trigger("change"); 

         return true;
      } catch (err) {
         console.warn("[Mobile Upload] DataTransfer falhou:", err.message);
         uploadAtualFluig = null;
         return false;
      }
   }

   // REALIZA O TRATAMENTO ALTERNATIVO DE UPLOAD QUANDO O INPUT NATIVO DO FLUIG NÃO ESTIVER DISPONÍVEL, MANTENDO A VISUALIZAÇÃO LOCAL DO ARQUIVO
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

      setTimeout(function () {
         var sid = "#statusFile" + sufixoCampo;

         $(sid + " .btn-visualizar-anexo")
            .removeAttr("onclick") 
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
              
            });
      }, 300); 
   }
   // CONFIGURA OS CAMPOS DE UPLOAD MOBILE, CRIANDO OVERLAYS DE SELEÇÃO DE ARQUIVOS E INTEGRANDO COM O UPLOAD PADRÃO DO FLUIG 
   setTimeout(function () {

      $(".upload-area").each(function () {
         var $area       = $(this);
         var inputId     = $area.data("upload-id") || "";
         var $fileInput  = $("#" + inputId);
         if (!$fileInput.length) return;

         var accept      = $fileInput.attr("accept") || "";
         var sufixoCampo = typeof obterSufixoUpload === "function"
                             ? obterSufixoUpload(inputId, $area)
                             : inputId.replace(/^file/, "");

         $area.find(".mobile-file-overlay").remove();
         $area.off("click");

         if (window.getComputedStyle($area[0]).position === "static") {
            $area.css("position", "relative");
         }

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

         // PROCESSA A SELEÇÃO DE ARQUIVO NO DISPOSITIVO MOBILE, VALIDANDO O ARQUIVO E REALIZANDO O ENVIO PELO FLUIG OU FALLBACK LOCAL
         $overlay.on("change", function () {
            if ($area.hasClass("disabled-upload")) return;

            var arquivo = this.files && this.files[0];
            this.value = ""; 

            try {
               FLUIGC.toast({
                  title   : "📎 Upload",
                  message : arquivo ? arquivo.name : "nenhum arquivo selecionado",
                  type    : "info",
                  timeout : 4000
               });
            } catch (_) {}

            if (!arquivo) return;

            if (typeof validarArquivoPermitido === "function" &&
                !validarArquivoPermitido(arquivo)) {
               return;
            }

            var $inputFluig = _encontrarInputFluig();
            var ok = $inputFluig
                       ? _injetarViaDataTransfer($inputFluig, arquivo, sufixoCampo, $area)
                       : false;

            if (!ok) _fallbackVisualLocal(arquivo, sufixoCampo, $area);
         });
      });

   }, 600); 
});
