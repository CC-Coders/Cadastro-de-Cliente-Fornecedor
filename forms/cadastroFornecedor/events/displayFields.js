function displayFields(form, customHTML) {
   var numActivity = getValue("WKNumState");

   // form.setValue("atividade") deve rodar ANTES de qualquer try/catch,
   // garantindo que o campo chegue ao cliente mesmo se getFormMode falhar.
   form.setValue("atividade", numActivity);

   // form.getFormMode() pode não existir em todas as versões do Fluig.
   // O try/catch impede que um eventual NoSuchMethod quebre todo o evento.
   // formMode é injetado via customHTML (client-side) — não via form.setValue,
   // pois assim não persiste no banco nem interfere no processamento do formulário.
   var formMode = "";
   try {
      formMode = String(form.getFormMode() || "");
   } catch (e) {
      // getFormMode indisponível neste contexto — formMode permanece ""
   }

   var acao = "";

   if (numActivity == 0 || numActivity == 4) {
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
}