function displayFields(form, customHTML) {
   var numActivity = getValue("WKNumState");

   form.setValue("atividade", numActivity);

   var acao = "";

   if (numActivity == 0 || numActivity == 4) {
      acao = "inicio";
   } else if (numActivity == 11) {
      acao = "validacao";
   } else if (numActivity == 27) {
      acao = "correcao";
   } else if (numActivity == 16) {
      acao = "integracao";
   } else if (numActivity == 22) {
      acao = "fim";
   }

   customHTML.append(
      "<script>" +
      "$(document).ready(function(){ " +
      "$('#atividade').val('" + numActivity + "');" +

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