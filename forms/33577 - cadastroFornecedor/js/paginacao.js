$(document).ready(function(){
    $("#btn-avancar").on("click", avancarPagina);
    $("#btn-voltar").on("click", voltarPagina);
    
    $(".pagination").on("click", function () {
        var index = $(this).attr("data-index");
        mostrarPagina(index, "set");
    });
});
function mostrarPagina(indice, move) {
    if (move == "set") {
        var indiceAtivo = $(".pagination-active").attr("data-index");
        if (indiceAtivo > indice) {
            move = "prev";
        } else {
            move = "next";
        }
    }

    $(".pagination-active").removeClass("pagination-active", 250);
    $(`.pagination[data-index='${indice}']`).addClass("pagination-active", 250);

    $(`.pagina.ativa[data-index!='${indice}']`).removeClass("ativa").addClass(move == "next" ? "escondida-para-esquerda" : "escondida-para-direita").css("position", "absolute");
    $(`.pagina[data-index='${indice}']`).addClass("ativa", 250).removeClass("escondida-para-direita", 250).removeClass("escondida-para-esquerda", 250).css("position", "relative");
    $(window).scrollTop(0)
}
function avancarPagina() {
    var active = $(".pagination-active");
    var index = $(active).next(".pagination").attr("data-index");
    if (index) {
        mostrarPagina(index, "next");
    }
}
function voltarPagina() {
    var active = $(".pagination-active");
    var index = $(active).prev(".pagination").attr("data-index");
    if (index) {
        mostrarPagina(index, "prev");
    }
}
function setAtividadeAtivaProgresso(atividadesConcluidas) {
var $steps = $(".wizard-progress .step");

$steps.removeClass("completed active");

$steps.each(function (i) {
    if (i < atividadesConcluidas) {
     $(this).addClass("completed");
    } else if (i === atividadesConcluidas) {
     $(this).addClass("active");
    }
});
}