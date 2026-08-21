// CAMPO DE BUSCA NOS SELECTS (Selectize)
//
// O Selectize esconde o <select> nativo e mantém nele apenas a opção selecionada.
// Por isso nenhum dado extra pode ficar guardado em atributos data-* das options:
// tudo o que o formulário precisa saber sobre um item vem das listas de consultas.js.
//
// Em modo view o Fluig já troca os selects por campos de leitura, então a busca não é aplicada.

// SELECTS DO FORMULÁRIO QUE RECEBEM O CAMPO DE BUSCA.
const SELETOR_BUSCA_SELECT = "#formSolicitacao select";

// LIGA O CAMPO DE BUSCA NOS SELECTS INFORMADOS, PRESERVANDO O VALOR ATUAL.
function aplicarBuscaSelect(seletor) {
   if (typeof $.fn.selectize !== "function" || ehModoView()) return;

   $(seletor).filter("select").each(function () {
      if (this.selectize) return;

      const $select = $(this);
      const valor = $select.val();

      $select.selectize({
         dropdownParent: "body",
         placeholder: $select.children('option[value=""]').first().text() || "Selecione...",
         // O Selectize não dispara o change nativo: sem isto todos os handlers do
         // formulário ligados em change deixariam de funcionar.
         onChange: function () { this.$input.trigger("change"); }
      });

      this.selectize.setValue(valor || "", true);
      if ($select.hasClass("campo-bloqueado")) this.selectize.lock();
   });
}

// RESSINCRONIZA O CAMPO DE BUSCA DEPOIS QUE AS OPTIONS DO SELECT FORAM REGERADAS POR CÓDIGO.
function atualizarBuscaSelect(seletor) {
   $(seletor).filter("select").each(function () {
      if (!this.selectize) return;

      const $select = $(this);
      const valor = $select.val();
      // O destroy devolve as options que existiam quando a busca foi ligada,
      // então guardamos as atuais para recolocá-las em seguida.
      const options = $select.html();
      const bloqueado = $select.hasClass("campo-bloqueado");

      this.selectize.destroy();
      $select.html(options).val(valor);
      aplicarBuscaSelect($select);

      if (bloqueado) bloquearCampo($select);
   });
}

// DEFINE O VALOR DE UM SELECT POR CÓDIGO, MANTENDO O CAMPO DE BUSCA SINCRONIZADO.
function definirValorSelect(seletor, valor, dispararChange) {
   $(seletor).each(function () {
      if (this.selectize) this.selectize.setValue(valor || "", true);
      else $(this).val(valor || "");

      if (dispararChange) $(this).trigger("change");
   });
}

// DESLIGA O CAMPO DE BUSCA (usado antes de trocar o select por outro tipo de campo).
function removerBuscaSelect(seletor) {
   $(seletor).filter("select").each(function () {
      if (this.selectize) this.selectize.destroy();
   });
}

// BLOQUEIA UM CAMPO PARA EDIÇÃO, MARCANDO-O VISUALMENTE E TRAVANDO O CAMPO DE BUSCA.
function bloquearCampo(seletor) {
   $(seletor)
      .addClass("campo-bloqueado")
      .attr("data-bloqueado", "1")
      .each(function () { if (this.selectize) this.selectize.lock(); });
}

// LIBERA UM CAMPO PARA EDIÇÃO.
function liberarCampo(seletor) {
   $(seletor)
      .removeClass("campo-bloqueado")
      .removeAttr("data-bloqueado")
      .each(function () { if (this.selectize) this.selectize.unlock(); });
}
