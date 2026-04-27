function displayFields(form, customHTML) {
    var atividade = getValue("WKNumState");

    form.setValue("atividade", atividade);
    customHTML.append("<script>");
    customHTML.append("$(document).ready(function(){");
    customHTML.append("  $('#atividade').val('" + atividade + "');");
    customHTML.append("  if (typeof aplicarBarraProcesso === 'function') {");
    customHTML.append("    aplicarBarraProcesso();");
    customHTML.append("  }");
    customHTML.append("});");
    customHTML.append("</script>");
}