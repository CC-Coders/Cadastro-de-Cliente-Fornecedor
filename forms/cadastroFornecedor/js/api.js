// API DE CEP — ViaCEP
function buscarCep(cep) {
   $.ajax({
      url: "https://viacep.com.br/ws/" + cep + "/json/",
      method: "GET",
      dataType: "json",
      success: function (data) {
         if (data.erro) {
            // Não limpa o endereço: em áreas remotas o CEP pode não existir na base e o
            // preenchimento é manual.
            FLUIGC.toast({
               message: "CEP não encontrado. Preencha o endereço manualmente.",
               type: "warning",
               timeout: 3000
            });
            return;
         }

         preencherEndereco(data);
      },
      error: function () {
         FLUIGC.toast({
            message: "Erro ao buscar CEP. Preencha o endereço manualmente.",
            type: "warning",
            timeout: 3000
         });
      }
   });
}

// PREENCHE OS CAMPOS DE ENDEREÇO COM OS DADOS VINDOS DO VIACEP
function preencherEndereco(data) {
   $("#endereco").val(data.logradouro || "");
   $("#bairro").val(data.bairro || "");
   $("#pais").val("Brasil");


   preencherEnderecoRM(data.uf || "", data.localidade || "");


   sincronizarCamposDinamicosHidden();

   limparErroCampo("cep");
   limparErroCampo("endereco");
   limparErroCampo("bairro");
   limparErroCampo("pais");

   $("#numero").focus();
}

// LIMPA OS CAMPOS DE ENDEREÇO
function limpaCamposEndereco() {
   $("#endereco").val("");
   $("#bairro").val("");
   $("#numero").val("");
   $("#pais").val("");
   $("#estado").val("");
   $("#cidade").empty().append('<option value="">Selecione a cidade...</option>');
   $("#codMunicipio").val("");
   $("#nomeCidadeSalva").val("");
}

// CHAVE DE ACESSO API SINTEGRA 
const TOKEN_CNPJ_API = "ZnB1ou61tGsZ17GIOZENAO1Ahua03Mrb";

// REMOVE A MASCARA DE CNPJ/CPF
function normalizarCnpj(cnpj) {
   return String(cnpj || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
}

// VERIFICA SE O CNPJ JÁ EXISTE NO RM
function buscarCnpj(cnpj) {

   if (globalThis._preenchendoEdicao || (typeof ehModoEdicao === "function" && ehModoEdicao())) {
      return;
   }

   cnpj = normalizarCnpj(cnpj);

   if (cnpj.length !== 14) {
      return;
   }

   var dadosRM = _verificarCnpjNoRM(cnpj);

   if (dadosRM === undefined) {
      return; 
   }

   if (dadosRM !== null) {

      limparCamposCnpj();
      FLUIGC.toast({
         title: "CNPJ já cadastrado",
         message: "Este CNPJ já está cadastrado no RM. O cadastro não pode ser duplicado.",
         type: "danger",
         timeout: 6000
      });
      return;
   }

   $.ajax({
      url: "https://api.sintegrapi.com.br/consultas/v2/cnpj-receita-federal/" + cnpj,
      method: "GET",
      dataType: "json",
      headers: { "x-api-key": TOKEN_CNPJ_API },
      data:    { cache: 10 },
      success: function (res) {
         if (!res.success || res.error) {
            FLUIGC.toast({
               message: res.error_message || "CNPJ não encontrado.",
               type: "warning",
               timeout: 3000
            });
            return;
         }

         var situacaoCnpj = (res.response.situacao_cadastral || "").toString().trim().toUpperCase();
         if (situacaoCnpj && situacaoCnpj !== "ATIVA") {
            limparCamposCnpj();
            FLUIGC.toast({
               title: "CNPJ inativo ou baixado",
               message: "Este CNPJ não está ativo na Receita Federal (" + situacaoCnpj + "). Não é possível prosseguir com o cadastro.",
               type: "danger",
               timeout: 7000
            });
            return;
         }

         preencherDadosCnpj(res.response);
      },
      error: function (xhr) {
         const msgs = {
            401: "Chave da Sintegrapi inválida ou ausente.",
            404: "CNPJ não encontrado na Receita Federal.",
            429: "Limite de consultas excedido.",
            503: "Serviço da Receita Federal temporariamente indisponível."
         };
         FLUIGC.toast({
            message: msgs[xhr.status] || "CNPJ inválido.",
            type: "danger",
            timeout: 3000
         });
      }
   });
}

// LIMPA OS CAMPOS PREENCHIDOS A PARTIR DO CNPJ E DEVOLVE O FOCO PRO CAMPO DE CNPJ
function limparCamposCnpj() {
   $("#docCnpj").val("");
   $("#razaoSocial").val("");
   $("#nomeFantasia").val("");
   $("#docInscricaoEstadual").val("");
   $("#docInscricaoMunicipal").val("");
   $("#endereco").val("");
   $("#numero").val("");
   $("#complemento").val("");
   $("#bairro").val("");
   $("#cep").val("");
   $("#telefone").val("");
   $("#emailCr").val("");
   $("#cnaePrincipal").val("");

   $("#estado").val("");
   $("#cidade").empty().append('<option value="">Selecione a cidade...</option>');
   $("#codMunicipio").val("");
   $("#nomeCidadeSalva").val("");
   $("#hiddenEstadoValor").val("");

   $("#cnae-secundarios-wrap").empty();

   globalThis._cnpjJaConsultado = "";
   $("#docCnpj").focus();
}

// VERIFICA SE O CPF JÁ EXISTE NO RM
function verificarCpfDuplicado(cpf) {

   if (globalThis._preenchendoEdicao || (typeof ehModoEdicao === "function" && ehModoEdicao())) {
      return;
   }

   cpf = (cpf || "").replace(/\D/g, "");
   if (cpf.length !== 11) {
      return;
   }

  
   var dadosRM = _verificarCnpjNoRM(cpf);

   if (dadosRM === undefined) {
      return;  
   }

   if (dadosRM !== null) {
      limparCamposCpf();
      FLUIGC.toast({
         title: "CPF já cadastrado",
         message: "Este CPF já está cadastrado no RM. O cadastro não pode ser duplicado.",
         type: "danger",
         timeout: 6000
      });
   }
}

// LIMPA OS CAMPOS PREENCHIDOS A PARTIR DO CPF E DEVOLVE O FOCO PRO CAMPO DE CPF
function limparCamposCpf() {
   $("#docCpf").val("");
   $("#docRg").val("");
   $("#docRgOrgao").val("");
   $("#docRgUf").val("");
   $("#dtNascimento").val("");
   $("#estadoCivil").val("");
   $("#razaoSocial").val("");
   $("#nomeFantasia").val("");
   $("#endereco").val("");
   $("#numero").val("");
   $("#complemento").val("");
   $("#bairro").val("");
   $("#cep").val("");
   $("#telefone").val("");
   $("#emailCr").val("");

   $("#estado").val("");
   $("#cidade").empty().append('<option value="">Selecione a cidade...</option>');
   $("#codMunicipio").val("");
   $("#nomeCidadeSalva").val("");
   $("#hiddenEstadoValor").val("");

   globalThis._cpfJaConsultado = "";
   $("#docCpf").focus();
}

// CONSULTA O DATASET DE VERIFICAÇÃO DE CNPJ/CPF NO RM E RETORNA O OBJETO COM OS DADOS (OU NULL SE NÃO EXISTIR)
function _verificarCnpjNoRM(cnpj) {
   try {
      var ds = DatasetFactory.getDataset(
         "ds_verificarCnpjRM",
         null,
         [DatasetFactory.createConstraint("CGCFOR", cnpj, cnpj, ConstraintType.MUST)],
         null
      );


      if (!ds || !ds.values || !ds.values.length) {
         console.error("[ds_verificarCnpjRM] Dataset vazio ou não publicado.");
         FLUIGC.toast({
            title: "Dataset não encontrado",
            message: "Publique o dataset 'ds_verificarCnpjRM' no Fluig Studio.",
            type: "danger",
            timeout: 6000
         });
         return undefined;
      }

      var dsStatus = (ds.values[0].STATUS || "").toString().trim();
      if (dsStatus === "ERRO") {
         var dsMensagem = (ds.values[0].MENSAGEM || "erro desconhecido").toString().trim();
         console.error("[ds_verificarCnpjRM] STATUS=ERRO:", dsMensagem);
         FLUIGC.toast({
            title: "Erro na verificação do RM",
            message: "ds_verificarCnpjRM: " + dsMensagem,
            type: "warning",
            timeout: 6000
         });
         return undefined;
      }
      var itens = _parsearDataset(ds, "ds_verificarCnpjRM");
      return itens.length > 0 ? itens[0] : null;

   } catch (e) {
      console.error("[ds_verificarCnpjRM] Erro ao consultar RM:", e);
      FLUIGC.toast({
         title: "Erro na verificação do RM",
         message: "Não foi possível verificar o CNPJ no RM. Verifique o dataset 'ds_verificarCnpjRM'.",
         type: "warning",
         timeout: 5000
      });
      return undefined;   
   }
}

// PREENCHE O FORMULÁRIO COM OS DADOS DO CNPJ VINDOS DO RM (Sintegra) + CNAEs, e busca a IE
function preencherDadosCnpjRM(data) {
   $("#razaoSocial").val(data.NOME           || "");
   $("#nomeFantasia").val(data.NOMEFANTASIA  || "");
   $("#endereco").val(data.LOGRADOURO        || "");
   $("#numero").val(data.NUMERO              || "");
   $("#complemento").val(data.COMPLEMENTO    || "");
   $("#bairro").val(data.BAIRRO              || "");
   $("#cep").val(formatarCep(data.CEP        || ""));
   $("#pais").val("Brasil");

   preencherEnderecoRM(data.CODUF || "", data.NOMEMUNICIPIO || "");
   sincronizarCamposDinamicosHidden();

   $("#telefone").val(formatarTelefone(data.TELEFONE || ""));
   $("#emailCr").val(data.EMAIL || "");


   if (data.INSCESTADUAL && data.INSCESTADUAL !== "null" && data.INSCESTADUAL !== "") {
      $("#docInscricaoEstadual").val(data.INSCESTADUAL).trigger("input");
      if (typeof limparErroCampo === "function") limparErroCampo("docInscricaoEstadual");
   }
   if (data.INSCMUNICIPAL && data.INSCMUNICIPAL !== "null" && data.INSCMUNICIPAL !== "") {
      $("#docInscricaoMunicipal").val(data.INSCMUNICIPAL).trigger("input");
      if (typeof limparErroCampo === "function") limparErroCampo("docInscricaoMunicipal");
   }

   ["docCnpj", "razaoSocial", "nomeFantasia",
    "cep", "endereco", "numero", "bairro",
    "cidade", "estado", "pais"].forEach(function (campo) {
      if (typeof limparErroCampo === "function") {
         limparErroCampo(campo);
      }
   });
}

// PREENCHE O FORMULÁRIO COM OS DADOS DO CNPJ VINDOS DA RECEITA (Sintegra) + CNAEs, e busca a IE
function preencherDadosCnpj(data) {
   $("#razaoSocial").val(data.nome_empresarial || "");
   $("#nomeFantasia").val(data.nome_fantasia    || "");
   $("#endereco").val(data.logradouro           || "");
   $("#numero").val(data.numero                 || "");
   $("#complemento").val(data.complemento       || "");
   $("#bairro").val(data.bairro                 || "");
   $("#cep").val(formatarCep(data.cep           || ""));
   $("#pais").val("Brasil");

   preencherEnderecoRM(data.uf || "", data.municipio || "");
   sincronizarCamposDinamicosHidden();

   $("#telefone").val(formatarTelefone(data.telefone || ""));
   $("#emailCr").val(data.endereco_eletronico || "");

   const cnaeP = data.atividade_economica_principal;
   if (cnaeP) {
      $("#cnaePrincipal").val(cnaeP.codigo + " — " + cnaeP.descricao);
   }

   preencherCnaesSecundarios(data.atividades_economicas_secundarias || []);

   ["docCnpj", "razaoSocial", "nomeFantasia",
    "cep", "endereco", "numero", "bairro",
    "cidade", "estado", "pais"].forEach(function (campo) {
      if (typeof limparErroCampo === "function") {
         limparErroCampo(campo);
      }
   });


   const cnpjLimpo = normalizarCnpj(data.cnpj || "");
   if (cnpjLimpo.length === 14) {
      _buscarInscricaoEstadualSintegra(cnpjLimpo, data.uf || "");
   }
}

// BUSCA A INSCRIÇÃO ESTADUAL DO CNPJ NA API SINTEGRA (Sintegrapi)
function _buscarInscricaoEstadualSintegra(cnpj, uf) {
   $.ajax({
      url: "https://api.sintegrapi.com.br/consultas/v2/sintegra/" + cnpj,
      method: "GET",
      dataType: "json",
      headers: { "x-api-key": TOKEN_CNPJ_API },
      data: { cache: 25, uf: uf },
      success: function (res) {
         if (!res.success || res.error) return;

         const inscricoes = res.inscricoes_estaduais || [];

       
         const ieDoEstado = inscricoes.find(function (i) { return i.uf === uf; });


         if (!ieDoEstado) {
            $("#docInscricaoEstadual").val("");
            return;
         }

        
      
         if (ieDoEstado.ativa && ieDoEstado.inscricao_estadual) {
            const ieDigitos = (ieDoEstado.inscricao_estadual || "").replace(/\D/g, "");
            $("#docInscricaoEstadual").val(ieDigitos).trigger("input");
            if (typeof limparErroCampo === "function") {
               limparErroCampo("docInscricaoEstadual");
            }
         } else {

            $("#docInscricaoEstadual").val("");


            if (($("#tipo").val() || "").toString().trim() === "001") {
               limparCamposCnpj();
               FLUIGC.toast({
                  title: "Inscrição Estadual",
                  message: "teste erro IE",
                  type: "danger",
                  timeout: 7000
               });
            }
         }
      },
      error: function () {
         console.warn("[Sintegra] Não foi possível obter a Inscrição Estadual.");
      }
   });
}

// RECRIA OS CAMPOS DE CNAEs SECUNDÁRIOS COM BASE NO ARRAY DE ATIVIDADES ECONÔMICAS SECUNDÁRIAS
function preencherCnaesSecundarios(atividades) {
   const limite = globalThis.LIMITE_CNAE_SECUNDARIO || 5;

   $("#cnae-secundarios-wrap .cnae-secundario-item").remove();

   atividades.slice(0, limite).forEach(function (atividade, index) {
      let numero = index + 1;
      let valor = atividade.codigo + " — " + atividade.descricao;

      adicionarCnae();

      $("#cnaeSecundario" + numero)
         .val(valor)
         .trigger("change");

      $("#hiddenCnaeSecundario" + numero).val(valor);
   });

   reordenarCnaesSecundarios();
   controlarBotaoAdicionarCnae();
   sincronizarCamposDinamicosHidden();
}

// FORMATA O CEP
function formatarCep(cep) {
   cep = String(cep || "").replace(/\D/g, "");
   if (cep.length !== 8) return cep;
   return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

// FORMATA O TELEFONE
function formatarTelefone(tel) {
   const d = String(tel || "").replace(/\D/g, "");
   if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
   if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
   return tel || "";
}

// API INTERNA DO FLUIG — Avatar do usuário
async function promiseBuscaImagemUsuario(usuario) {
   const res = await fetch("/api/public/social/image/" + usuario);
   const blob = await res.blob();
   const img = new Image();
   img.width = 60;
   img.height = 60;
   img.src = URL.createObjectURL(blob);
   img.classList.add("userImage");
   return img;
}