function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function modulo10(numero) {
  let soma = 0;
  let peso = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    let produto = Number(numero[i]) * peso;

    if (produto >= 10) {
      produto = Math.floor(produto / 10) + (produto % 10);
    }

    soma += produto;
    peso = peso === 2 ? 1 : 2;
  }

  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

function modulo11Arrecadacao(numero) {
  let soma = 0;
  let peso = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    soma += Number(numero[i]) * peso;
    peso++;
    if (peso > 9) peso = 2;
  }

  const resto = soma % 11;

  if (resto === 0 || resto === 1) return 0;
  if (resto === 10) return 1;
  return 11 - resto;
}

function modulo11Cobranca(numero) {
  let soma = 0;
  let peso = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    soma += Number(numero[i]) * peso;
    peso++;
    if (peso > 9) peso = 2;
  }

  const resto = soma % 11;
  const dv = 11 - resto;

  return (dv === 0 || dv === 10 || dv === 11) ? 1 : dv;
}

async function copiarCodigo(botao) {
  const codigo = somenteNumeros(botao.dataset.codigo || "");

  try {
    await navigator.clipboard.writeText(codigo);
  } catch (e) {
    const area = document.createElement("textarea");
    area.value = codigo;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  const original = botao.textContent;
  botao.textContent = "✓ Copiado";

  setTimeout(() => {
    botao.textContent = original;
  }, 1400);
}

function criarCodigoBox(titulo, codigo) {
  const limpo = somenteNumeros(codigo);

  return `
    <div>
      <strong>${escapeHtml(titulo)}</strong>
      <div class="code-box">
        <span class="code-text">${escapeHtml(codigo)}</span>
        <button class="btn-copy"
          data-codigo="${escapeHtml(limpo)}"
          onclick="copiarCodigo(this)">Copiar</button>
      </div>
    </div>
  `;
}

function formatarMoeda(valorCentavos) {
  return Number(valorCentavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    return "Não identificada";
  }

  const d = String(data.getDate()).padStart(2, "0");
  const m = String(data.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${data.getFullYear()}`;
}

function criarInfoGrid(itens) {
  return `
    <div class="info-grid">
      ${itens.map(item => `
        <div class="info-item">
          <span class="info-label">${escapeHtml(item.label)}</span>
          <span class="info-value">${item.value}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function criarTabelaValidacao(linhas) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>DV informado</th>
            <th>DV calculado</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${linhas.map(item => `
            <tr>
              <td>${escapeHtml(item.campo)}</td>
              <td>${escapeHtml(item.informado)}</td>
              <td>${escapeHtml(item.calculado)}</td>
              <td class="${item.valido ? "valid" : "invalid"}">
                ${item.valido ? "✓ Válido" : "✗ Inválido"}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function criarStatus(valido, textoOk, textoErro) {
  return `
    <div class="status ${valido ? "status-ok" : "status-error"}">
      ${valido ? "✓ " + textoOk : "✗ " + textoErro}
    </div>
  `;
}
