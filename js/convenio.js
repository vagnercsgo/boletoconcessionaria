const segmentosConvenio = {
  "1": "Prefeituras",
  "2": "Saneamento",
  "3": "Energia Elétrica e Gás",
  "4": "Telecomunicações",
  "5": "Órgãos Governamentais",
  "6": "Carnês e Assemelhados ou Empresas/Órgãos identificados por CNPJ",
  "7": "Multas de trânsito",
  "9": "Uso exclusivo do banco"
};

function algoritmoConvenio(barra) {
  const identificador = barra.charAt(2);

  if (identificador === "6" || identificador === "7") return "Módulo 10";
  if (identificador === "8" || identificador === "9") return "Módulo 11";

  return "Não identificado";
}

function calcularDVCampoConvenio(dados, barra) {
  const identificador = barra.charAt(2);

  if (identificador === "6" || identificador === "7") {
    return modulo10(dados);
  }

  if (identificador === "8" || identificador === "9") {
    return modulo11Arrecadacao(dados);
  }

  return null;
}

function convenioBarraParaLinha(barra) {
  let linha = "";

  for (let i = 0; i < 44; i += 11) {
    const bloco = barra.substring(i, i + 11);
    linha += bloco + calcularDVCampoConvenio(bloco, barra);
  }

  return linha;
}

function convenioLinhaParaBarra(linha) {
  let barra = "";

  for (let i = 0; i < 48; i += 12) {
    barra += linha.substring(i, i + 11);
  }

  return barra;
}

function validarCamposConvenio(linha, barra) {
  const resultados = [];

  for (let i = 0; i < 48; i += 12) {
    const dados = linha.substring(i, i + 11);
    const informado = Number(linha.charAt(i + 11));
    const calculado = calcularDVCampoConvenio(dados, barra);

    resultados.push({
      campo: `Campo ${(i / 12) + 1}`,
      informado,
      calculado,
      valido: informado === calculado
    });
  }

  return resultados;
}

function validarDVGeralConvenio(barra) {
  const dados = barra.substring(0, 3) + barra.substring(4);
  const informado = Number(barra.charAt(3));
  const calculado = calcularDVCampoConvenio(dados, barra);

  return {
    informado,
    calculado,
    valido: informado === calculado
  };
}

function interpretarDataCampoLivre(campoLivre) {
  if (!/^\d{8}/.test(campoLivre)) return null;

  const texto = campoLivre.substring(0, 8);
  const ano = Number(texto.substring(0, 4));
  const mes = Number(texto.substring(4, 6));
  const dia = Number(texto.substring(6, 8));

  if (ano < 1900 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }

  const data = new Date(ano, mes - 1, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return data;
}

function interpretarConvenio(barra) {
  const produto = barra.charAt(0);
  const segmentoCodigo = barra.charAt(1);
  const identificador = barra.charAt(2);

  const valorReferencia = barra.substring(4, 15);
  const empresaOrgao = barra.substring(15, 19);
  const campoLivre = barra.substring(19, 44);

  const dataCampoLivre = interpretarDataCampoLivre(campoLivre);

  const usaValorEfetivo =
    identificador === "6" || identificador === "8";

  const usaModulo10 =
    identificador === "6" || identificador === "7";

  return {
    produto,
    segmentoCodigo,
    segmentoNome: segmentosConvenio[segmentoCodigo] || "Segmento não identificado",
    identificador,
    identificadorDescricao:
      identificador === "6"
        ? "Valor efetivo em reais"
        : identificador === "7"
          ? "Quantidade de moeda / valor de referência"
          : identificador === "8"
            ? "Valor efetivo em reais"
            : identificador === "9"
              ? "Quantidade de moeda / valor de referência"
              : "Identificador não reconhecido",
    valorReferencia,
    valorEfetivo: usaValorEfetivo
      ? Number(valorReferencia) / 100
      : null,
    empresaOrgao,
    campoLivre,
    dataCampoLivre,
    algoritmo: usaModulo10 ? "Módulo 10" : "Módulo 11"
  };
}

function renderConvenio(linha, barra) {
  const info = interpretarConvenio(barra);
  const campos = validarCamposConvenio(linha, barra);
  const geral = validarDVGeralConvenio(barra);
  const valido = campos.every(x => x.valido) && geral.valido;

  const infoItens = [
    { label: "Produto", value: escapeHtml(`${info.produto} — Arrecadação`) },
    { label: "Segmento", value: escapeHtml(`${info.segmentoCodigo} — ${info.segmentoNome}`) },
    { label: "Identificador", value: escapeHtml(`${info.identificador} — ${info.identificadorDescricao}`) },
    { label: "Algoritmo dos DVs", value: escapeHtml(info.algoritmo) },
    { label: "DV geral", value: escapeHtml(barra.charAt(3)) },
    { label: "Identificação Empresa/Órgão", value: escapeHtml(info.empresaOrgao) }
  ];

  if (info.valorEfetivo !== null) {
    infoItens.push({
      label: "Valor efetivo",
      value: escapeHtml(info.valorEfetivo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      }))
    });
  } else {
    infoItens.push({
      label: "Valor / referência",
      value: `<span class="code-text">${escapeHtml(info.valorReferencia)}</span>`
    });
  }

  if (info.dataCampoLivre) {
    infoItens.push({
      label: "Data encontrada no campo livre",
      value: escapeHtml(formatarData(info.dataCampoLivre))
    });
  }

  return `
    <section class="card">
      ${criarStatus(
        valido,
        "Código de convênio/arrecadação válido estruturalmente.",
        "Foram encontradas inconsistências na validação."
      )}
    </section>

    <section class="card">
      <h2 class="section-title">Códigos</h2>
      ${criarCodigoBox("Código de barras — 44 posições", barra)}
      <br>
      ${criarCodigoBox("Representação numérica — 48 posições", linha)}
    </section>

    <section class="card">
      <h2 class="section-title">Informações do convênio / arrecadação</h2>
      ${criarInfoGrid(infoItens)}
    </section>

    <section class="card">
      <h2 class="section-title">Estrutura do código de barras</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Tamanho</th>
              <th>Conteúdo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>01</td><td>1</td><td>Identificação do Produto</td><td>${escapeHtml(barra.charAt(0))}</td></tr>
            <tr><td>02</td><td>1</td><td>Identificação do Segmento</td><td>${escapeHtml(info.segmentoCodigo)} — ${escapeHtml(info.segmentoNome)}</td></tr>
            <tr><td>03</td><td>1</td><td>Identificação do valor efetivo ou referência</td><td>${escapeHtml(info.identificador)}</td></tr>
            <tr><td>04</td><td>1</td><td>DV geral</td><td>${escapeHtml(barra.charAt(3))}</td></tr>
            <tr><td>05–15</td><td>11</td><td>Valor / referência</td><td>${escapeHtml(info.valorReferencia)}</td></tr>
            <tr><td>16–19</td><td>4</td><td>Identificação da Empresa/Órgão</td><td>${escapeHtml(info.empresaOrgao)}</td></tr>
            <tr><td>20–44</td><td>25</td><td>Campo livre da Empresa/Órgão</td><td>${escapeHtml(info.campoLivre)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="note">
        Conforme o layout FEBRABAN, o campo livre é de utilização da Empresa/Órgão e é devolvido inalterado.
        Se houver data de vencimento nesse campo, ela ocupa as 8 primeiras posições no formato AAAAMMDD.
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Validação dos campos</h2>
      ${criarTabelaValidacao(campos)}
      <br>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>DV geral informado</th><th>DV geral calculado</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${geral.informado}</td>
              <td>${geral.calculado}</td>
              <td class="${geral.valido ? "valid" : "invalid"}">
                ${geral.valido ? "✓ Válido" : "✗ Inválido"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function consultarConvenio() {
  const entrada = somenteNumeros(document.getElementById("entrada").value);
  const resultado = document.getElementById("resultado");

  if (entrada.length !== 44 && entrada.length !== 48) {
    resultado.innerHTML = `
      <section class="card">
        <div class="status status-error">
          Informe um código de convênio com 44 posições (barras)
          ou 48 posições (representação numérica).
        </div>
      </section>
    `;
    return;
  }

  let barra;
  let linha;

  if (entrada.length === 48) {
    linha = entrada;
    barra = convenioLinhaParaBarra(linha);
  } else {
    barra = entrada;

    if (barra.charAt(0) !== "8") {
      resultado.innerHTML = `
        <section class="card">
          <div class="status status-error">
            Este código possui 44 posições, mas não começa com 8.
            A página de convênio/arrecadação espera o identificador de produto 8.
          </div>
        </section>
      `;
      return;
    }

    linha = convenioBarraParaLinha(barra);
  }

  if (barra.charAt(0) !== "8") {
    resultado.innerHTML = `
      <section class="card">
        <div class="status status-error">
          A representação informada não corresponde ao produto de arrecadação
          previsto neste layout: a primeira posição deve ser 8.
        </div>
      </section>
    `;
    return;
  }

  resultado.innerHTML = renderConvenio(linha, barra);
}

function limparConvenio() {
  document.getElementById("entrada").value = "";
  document.getElementById("resultado").innerHTML = "";
}

document.getElementById("entrada").addEventListener("keydown", event => {
  if (event.ctrlKey && event.key === "Enter") {
    consultarConvenio();
  }
});
