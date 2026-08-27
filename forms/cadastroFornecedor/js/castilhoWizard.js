// ATUALIZA A BARRA DE PROGRESSO CONFORME A ATIVIDADE ATUAL DO PROCESSO.
function aplicarBarraProcesso() {
    var atividade = Number($("#atividade").val() || 0);


    desenharEtapasWizard();

    var indiceAtual = indiceEtapaPorEstado(atividade);
    var $steps = $(".castilhoWizard-progress .step");

    $steps.removeClass("active completed");
    $steps.each(function (index) {
        if (index < indiceAtual) $(this).addClass("completed");
        if (index === indiceAtual) $(this).addClass("active");
    });

    return indiceAtual;
}

// CRIA AS ETAPAS DA BARRA DE PROGRESSO COM BASE NA CONFIGURAÇÃO DE ETAPAS.
function desenharEtapasWizard() {
    var $barra = $(".castilhoWizard-progress");
    if (!$barra.length || $barra.children(".step").length) return;

    var html = "";
    for (var indice = 0; indice < ETAPAS.length; indice++) {
        html += '<div class="step" data-etapa="' + indice + '">' + ETAPAS[indice].rotulo + '</div>';
    }
    $barra.html(html);
}
