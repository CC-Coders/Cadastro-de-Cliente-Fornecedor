function toggleSection(el) {
  var $head = $(el);
  var $body = $head.next(".section-body, .panel-body");

  $head.toggleClass("open");
  $body.slideToggle(200);

  var $arrow = $head.find(".section-arrow, .glyphicon");
  if ($arrow.hasClass("glyphicon")) {
    $arrow.toggleClass("glyphicon-chevron-down glyphicon-chevron-up");
  } else {
    $arrow.toggleClass("open");
  }
}

function goToStep(step) {
  $(".step-panel").removeClass("active").hide();
  $("#step-" + step).addClass("active").show();

  $(".step-item").removeClass("active done");
  for (var i = 1; i <= 3; i++) {
    if (i < step) {
      $("#nav-step-" + i).addClass("done");
    } else if (i === step) {
      $("#nav-step-" + i).addClass("active");
    }
  }
}

function avancarEtapa() {
  if ($("#step-1").hasClass("active")) {
    goToStep(2);
  } else if ($("#step-2").hasClass("active")) {
    goToStep(3);
  }
}

function voltarEtapa() {
  if ($("#step-3").hasClass("active")) {
    goToStep(2);
  } else if ($("#step-2").hasClass("active")) {
    goToStep(1);
  }
}

$(document).ready(function () {
  $(".section-body").show();
  goToStep(1);
});