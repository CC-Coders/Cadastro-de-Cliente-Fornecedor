// API DE CEP — ViaCEP
function buscarCep(cep) {
   $.ajax({
      url: "https://viacep.com.br/ws/" + cep + "/json/",
      method: "GET",
      dataType: "json",
      success: function (data) {
         if (data.erro) {
            FLUIGC.toast({
               message: "CEP não encontrado.",
               type: "danger",
               timeout: 3000
            });

            limpaCamposEndereco();
            return;
         }

         preencherEndereco(data);
      },
      error: function () {
         FLUIGC.toast({
            message: "Erro ao buscar CEP.",
            type: "danger",
            timeout: 3000
         });

         limpaCamposEndereco();
      }
   });
}
function preencherEndereco(data) {
   $("#endereco").val(data.logradouro || "");
   $("#bairro").val(data.bairro || "");
   $("#cidade").val(data.localidade || "");
   $("#estado").val(data.uf || "");
   // ViaCEP não retorna o campo "pais"; garantimos "Brasil" fixo no modo nacional
   $("#pais").val("Brasil");

   limparErroCampo("cep");
   limparErroCampo("endereco");
   limparErroCampo("bairro");
   limparErroCampo("cidade");
   limparErroCampo("estado");
   limparErroCampo("pais");

   $("#numero").focus();
}
function limpaCamposEndereco() {
   $("#endereco").val("");
   $("#bairro").val("");
   $("#cidade").val("");
   $("#estado").val("");
   $("#pais").val("");
   $("#numero").val("");
}


// API DE CNPJ — cnpj-api.com
const TOKEN_CNPJ_API = "504928752084ca6c095f8501397fc9333f77a0ccbc877ea0639cca7735a0dcfd";
function normalizarCnpj(cnpj) {
   return String(cnpj || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
}
function buscarCnpj(cnpj) {

   cnpj = normalizarCnpj(cnpj);

   if (cnpj.length !== 14) {
      return;
   }

   $.ajax({
      url: "https://api.cnpj-api.com/v1/cnpj/" + cnpj,
      method: "GET",
      dataType: "json",
      data: {
         token: TOKEN_CNPJ_API
      },
      success: function (data) {
         preencherDadosCnpj(data);
      },
      error: function (xhr) {

         let mensagem = "Erro ao buscar CNPJ.";

         if (xhr.status === 401) {
            mensagem = "Token da API CNPJ inválido ou ausente.";
         }

         if (xhr.status === 429) {
            mensagem = "Limite de consultas excedido.";
         }

         FLUIGC.toast({
            message: mensagem,
            type: "danger",
            timeout: 3000
         });
      }
   });
}
function preencherDadosCnpj(data) {

   $("#razaoSocial").val(data.razao_social || "");
   $("#nomeFantasia").val(data.nome_fantasia || "");
   $("#endereco").val(data.endereco?.logradouro || "");
   $("#numero").val(data.endereco?.numero || "");
   $("#complemento").val(data.endereco?.complemento || "");
   $("#bairro").val(data.endereco?.bairro || "");
   $("#cidade").val(data.endereco?.municipio || "");
   $("#estado").val(data.endereco?.uf || "");
   $("#cep").val(formatarCep(data.endereco?.cep || ""));
   $("#pais").val("Brasil");

   $("#telefone").val(
      data.telefones?.length ? data.telefones[0].numero : ""
   );
   $("#emailCr").val(
      data.emails?.length ? data.emails[0] : ""
   );
   $("#site").val(
      data.websites?.length ? data.websites[0] : ""
   );

   if (data.atividade_principal) {
      $("#cnaePrincipal").val(
         data.atividade_principal.codigo +
         " — " +
         data.atividade_principal.descricao
      );
   }
   preencherCnaesSecundarios(data);

   [
      "docCnpj",
      "razaoSocial",
      "nomeFantasia",
      "cep",
      "endereco",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "pais"
   ].forEach(function (campo) {
      if (typeof limparErroCampo === "function") {
         limparErroCampo(campo);
      }
   });
}
function preencherCnaesSecundarios(data) {
   let atividades = data.atividades_secundarias || [];
   let limite = globalThis.LIMITE_CNAE_SECUNDARIO || 5;

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

   if (Number($("#atividade").val() || 0) === ATIVIDADES.VALIDACAO) {
      $("#snapshotEdicaoValidacao").val("");
      inicializarSnapshotEdicaoValidacao();
   }
}
function formatarCep(cep) {
   cep = String(cep || "").replace(/\D/g, "");

   if (cep.length !== 8) {
      return cep;
   }

   return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}


// API INTERNA DO FLUIG — Avatar do usuário
function promiseBuscaImagemUsuario(usuario) {
   return fetch("/api/public/social/image/" + usuario)
      .then(res => res.blob())
      .then(blob => {
         const img = new Image();
         img.width = 60;
         img.height = 60;
         img.src = URL.createObjectURL(blob);
         img.classList.add("userImage");
         return img;
      });
}