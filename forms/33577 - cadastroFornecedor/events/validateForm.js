// function validateForm(form) {
//     var numActivity = getValue("WKNumState");
//     var lEnviar = getValue("WKCompletTask") == "true";

//     var acao = "";

//     if (numActivity == 0 || numActivity == 4) {
//         acao = "inicio";
//     } else if (numActivity == 11) {
//         acao = "validacao";
//     } else if (numActivity == 16) {
//         acao = "integracao";
//     } else if (numActivity == 22) {
//         acao = "fim";
//     }

//     if (!lEnviar) {
//         return;
//     }

//     function valor(campo) {
//         return String(form.getValue(campo) || "").trim();
//     }

//     function norm(v) {
//         return String(v || "")
//             .toLowerCase()
//             .trim()
//             .replace(/[áàâãä]/g, "a")
//             .replace(/[éèêë]/g, "e")
//             .replace(/[íìîï]/g, "i")
//             .replace(/[óòôõö]/g, "o")
//             .replace(/[úùûü]/g, "u")
//             .replace(/[ç]/g, "c");
//     }

//     function isChecked(v) {
//         var s = String(v || "").toLowerCase().trim();
//         return s == "on" || s == "true" || s == "1" || s == "checked" || s == "yes" || s == "sim" || s == "s";
//     }

//     function obrigatorio(campo, label) {
//         var v = valor(campo);

//         if (!v || v == "null" || v == "undefined") {
//             throw "<div class='alert alert-danger'>Campo <b>" + label + "</b> é obrigatório.</div>";
//         }
//     }

//     function obrigatorioAnexo(campo, label) {
//         var v = valor(campo);

//         if (!v || v == "null" || v == "undefined" || v == "?") {
//             throw "<div class='alert alert-danger'>Anexo <b>" + label + "</b> é obrigatório.</div>";
//         }
//     }

//     function validarCPFServidor(cpf) {
//         cpf = String(cpf || "").replace(/[^\d]+/g, "");

//         if (cpf.length != 11) return false;
//         if (/^(\d)\1+$/.test(cpf)) return false;

//         var soma = 0;
//         var resto;

//         for (var i = 1; i <= 9; i++) {
//             soma += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
//         }

//         resto = (soma * 10) % 11;
//         if (resto == 10 || resto == 11) resto = 0;
//         if (resto != parseInt(cpf.substring(9, 10), 10)) return false;

//         soma = 0;

//         for (var j = 1; j <= 10; j++) {
//             soma += parseInt(cpf.substring(j - 1, j), 10) * (12 - j);
//         }

//         resto = (soma * 10) % 11;
//         if (resto == 10 || resto == 11) resto = 0;

//         return resto == parseInt(cpf.substring(10, 11), 10);
//     }

//     function validarCNPJServidor(cnpj) {
//         cnpj = String(cnpj || "").replace(/[^\d]+/g, "");

//         if (cnpj.length != 14) return false;
//         if (/^(\d)\1+$/.test(cnpj)) return false;

//         var tamanho = cnpj.length - 2;
//         var numeros = cnpj.substring(0, tamanho);
//         var digitos = cnpj.substring(tamanho);
//         var soma = 0;
//         var pos = tamanho - 7;

//         for (var i = tamanho; i >= 1; i--) {
//             soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
//             if (pos < 2) pos = 9;
//         }

//         var resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
//         if (resultado != parseInt(digitos.charAt(0), 10)) return false;

//         tamanho = tamanho + 1;
//         numeros = cnpj.substring(0, tamanho);
//         soma = 0;
//         pos = tamanho - 7;

//         for (var j = tamanho; j >= 1; j--) {
//             soma += parseInt(numeros.charAt(tamanho - j), 10) * pos--;
//             if (pos < 2) pos = 9;
//         }

//         resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

//         return resultado == parseInt(digitos.charAt(1), 10);
//     }

//     function validarPreCadastro() {
//         obrigatorio("classificacao", "Classificação");
//         obrigatorio("categoria", "Categoria");
//         obrigatorio("tipo", "Tipo");
//         obrigatorio("classificacaoOperacional", "Classificação Operacional");

//         var categoria = valor("categoria");

//         if (categoria == "Pessoa Física") {
//             obrigatorio("docCpf", "CPF");
//             obrigatorio("docRg", "RG");

//             if (!validarCPFServidor(valor("docCpf"))) {
//                 throw "<div class='alert alert-danger'>CPF inválido.</div>";
//             }
//         }

//         if (categoria == "Pessoa Jurídica") {
//             obrigatorio("docCnpj", "CNPJ");
//             obrigatorio("docInscricaoEstadual", "Inscrição Estadual");

//             if (!validarCNPJServidor(valor("docCnpj"))) {
//                 throw "<div class='alert alert-danger'>CNPJ inválido.</div>";
//             }
//         }

//         obrigatorio("razaoSocial", "Razão Social / Nome");
//         obrigatorio("cep", "CEP");
//         obrigatorio("endereco", "Endereço");
//         obrigatorio("numero", "Número");
//         obrigatorio("bairro", "Bairro");
//         obrigatorio("cidade", "Cidade");
//         obrigatorio("pais", "País");
//         obrigatorio("estado", "Estado");
//     }

//     function validarDadosCadastrais() {
//         obrigatorio("icms", "Contribuinte ICMS");
//         obrigatorio("irrf", "Alíquota IRRF");
//         obrigatorio("simplesNacional", "Simples Nacional");
//         obrigatorio("naturezaRendimento", "Natureza de Rendimentos");
//         obrigatorio("regimeFiscal", "Regime Fiscal");
//         obrigatorio("tipoDocEmitido", "Tipo de Documento Emitido");

//         obrigatorio("moeda", "Moeda do Pedido");
//         obrigatorio("grupoMercadoria1", "Grupo de Mercadoria");
//         obrigatorio("cnaePrincipal", "CNAE Principal");

//         if (isChecked(form.getValue("toggleRetencao"))) {
//             var temRetencao =
//                 isChecked(form.getValue("iss")) ||
//                 isChecked(form.getValue("inss")) ||
//                 isChecked(form.getValue("inputIrrf")) ||
//                 isChecked(form.getValue("csll")) ||
//                 isChecked(form.getValue("pis")) ||
//                 isChecked(form.getValue("cofins"));

//             if (!temRetencao) {
//                 throw "<div class='alert alert-danger'>Selecione pelo menos um imposto para retenção.</div>";
//             }
//         }

//         obrigatorio("condicaoPagamento", "Condição de Pagamento");
//         obrigatorio("banco", "Banco");
//         obrigatorio("agencia", "Agência");
//         obrigatorio("conta", "Conta");

//         obrigatorio("telefone", "Telefone");


//         obrigatorio("emailAdministrativo", "E-mail Administrativo");
//     }

//     function validarDocumentacao() {
//         var categoria = valor("categoria");

//         if (categoria == "Pessoa Física") {
//             obrigatorioAnexo("anxRgCpf", "RG / CPF");
//             obrigatorioAnexo("anxCompEndereco", "Comprovante de Endereço");
//             obrigatorioAnexo("anxCompBanco", "Comprovante Bancário");
//             obrigatorioAnexo("anxLaudoPcd", "Laudo Médico PCD");
//             obrigatorioAnexo("anxDependentes", "Declaração de Dependentes IRRF");
//         }

//         if (categoria == "Pessoa Jurídica") {
//             obrigatorioAnexo("anxCartaoCnpj", "Cartão CNPJ");
//             obrigatorioAnexo("anxCompBanco", "Comprovante Bancário");
//             obrigatorioAnexo("anxContrato", "Contrato Social");
//             obrigatorioAnexo("anxCodConduta", "Código de Conduta");
//             obrigatorioAnexo("anxAntiCorrupcao", "Política Anticorrupção");
//             obrigatorioAnexo("anxConflito", "Conflito de Interesses");
//             obrigatorioAnexo("anxLgpd", "Ciência LGPD");
//         }
//     }

//     if (acao == "inicio") {
//         validarPreCadastro();
//         validarDadosCadastrais();
//         validarDocumentacao();
//     }

//     if (acao == "validacao") {
//         obrigatorio("observacaoValidacao", "Observações");
//         obrigatorio("selectDecisao", "Ação");
//         validarPreCadastro();
//         validarDadosCadastrais();
//         validarDocumentacao();
//     }

//     if (acao == "integracao") {

//     }
// }