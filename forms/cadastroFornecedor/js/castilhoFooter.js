// ATUALIZA O ESTADO DOS BOTÕES DE NAVEGAÇÃO CONFORME A ETAPA ATUAL.
function atualizarSetas() {
    var steps = getStepsVisiveis();
    var index = steps.indexOf(getStepAtual());
    $("#btnTabAnt").prop("disabled", index <= 0);
    $("#btnTabNext").prop("disabled", index === steps.length - 1);
}

// RETORNA AS ETAPAS QUE ESTÃO VISÍVEIS NO FORMULÁRIO.
function getStepsVisiveis() {
    var visiveis = [];
    for (var step = 1; step <= TOTAL_STEPS; step++) {
        if ($(NAV_MAP[step]).is(":visible")) visiveis.push(step);
    }
    return visiveis;
}

// IDENTIFICA E RETORNA A ETAPA ATUALMENTE ATIVA.
function getStepAtual() {
    var stepAtual = 1;
    for (var step = 1; step <= TOTAL_STEPS; step++) {
        if ($(NAV_MAP[step]).hasClass("active")) stepAtual = step;
    }
    return stepAtual;
}

// NAVEGA PARA A ETAPA INFORMADA E ATUALIZA O ESTADO DAS ABAS.
function goToStep(step) {
    $(".tab-pane-form").removeClass("active").hide();
    $(PANEL_MAP[step]).addClass("active").show();

    $(".step-item").removeClass("active done");

    var visiveis = getStepsVisiveis();
    for (var i = 0; i < visiveis.length; i++) {
        var itemStep = visiveis[i];
        if (itemStep < step) {
            $(NAV_MAP[itemStep]).addClass("done");   // abas anteriores
        } else if (itemStep === step) {
            $(NAV_MAP[itemStep]).addClass("active");  // aba atual
        }
    }

    atualizarSetas();
    $("html, body").scrollTop(0);
}

// AVANÇA PARA A PRÓXIMA ETAPA VISÍVEL DO FORMULÁRIO.
function goToNextVisibleStep() {
    var steps = getStepsVisiveis();
    var index = steps.indexOf(getStepAtual());
    if (index < steps.length - 1) goToStep(steps[index + 1]);
}

// RETORNA PARA A ETAPA VISÍVEL ANTERIOR DO FORMULÁRIO.
function goToPrevVisibleStep() {
    var steps = getStepsVisiveis();
    var index = steps.indexOf(getStepAtual());
    if (index > 0) goToStep(steps[index - 1]);
}
