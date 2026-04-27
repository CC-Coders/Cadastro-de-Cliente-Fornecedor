// function validateForm(form) {
//     log.info(">>> ENTROU NO validateForm <<<");

//     var numActivity = getValue("WKNumState");
//     var acao = "";

//     if (numActivity == 0 || numActivity == 4) {
//         acao = "inicio";
//     } else if (numActivity == 11) {
//         acao = "validacao";
//     } else if (numActivity == 27) {
//         acao = "correcao";
//     } else if (numActivity == 16) {
//         acao = "integracao";
//     } else if (numActivity == 19) {
//         acao = "erro";
//     } else if (numActivity == 22) {
//         acao = "fim";
//     }

//     log.info(">>> numActivity: " + numActivity);
//     log.info(">>> acao: " + acao);

//     if (acao == "inicio") {
//         var classificacao = form.getValue("classificacao");

//         log.info(">>> classificacao: [" + classificacao + "]");

//         if (classificacao == null || classificacao == "") {
//             throw "Campo 'Classificação' é obrigatório.";
//         }
//     }
// }