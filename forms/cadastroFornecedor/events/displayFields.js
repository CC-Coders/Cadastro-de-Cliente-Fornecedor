function displayFields(form, customHTML) {
   var numActivity = getValue("WKNumState");
   form.setValue("atividade", numActivity);
   var formMode = "";
   try {
      formMode = String(form.getFormMode() || "");
   } catch (e) {
   }

   form.setValue("formMode", formMode);

   if ((numActivity == 0 || numActivity == 4) && formMode == "ADD") { 
      form.setValue("solicitante", getValue("WKUser"));
   }

   var ehView = (formMode == "VIEW");
   var acao = "";

   if (ehView) {
      acao = "view";
   } else if (numActivity == 0 || numActivity == 4) {
      acao = "inicio";
   } else if (numActivity == 11) {
      acao = "validacao";
   } else if (numActivity == 19) {
      acao = "erroIntegracao";
   } else if (numActivity == 27) {
      acao = "correcao";
   } else if (numActivity == 16) {
      acao = "integracao";
   }

   customHTML.append(
      "<script>" +
      "$(document).ready(function(){ " +
      "$('#atividade').val('" + numActivity + "');" +
      "$('#formMode').val('"  + formMode    + "');" +
      "if (typeof aplicarBarraProcesso === 'function') {" +
      "aplicarBarraProcesso();" +
      "}" +
      "});" +
      "</script>"
   );
   if (acao == "validacao") {

      customHTML.append(
         "<script>" +
         "$(document).ready(function(){ " +

         "$('#alertCnpj').hide();" +
         "$('#alertCPF').hide();" +


         "});" +
         "</script>"
      );

   }
   if (acao == "correcao") {
      customHTML.append(
         "<script>" +
         "$(document).ready(function(){ " +
         "$('#divSelectDecisao').hide();" +
         "});" +
         "</script>"
      );
   }
   if (acao == "view") {
      customHTML.append(
         "<script>" +
         "$(document).ready(function(){ " +
         "setTimeout(function(){ " +
         "if (typeof configurarModoView === 'function') { configurarModoView(); }" +
         "}, 300);" +
         "});" +
         "</script>"
      );
   }
}