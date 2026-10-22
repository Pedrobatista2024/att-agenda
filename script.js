(() => {
  "use strict";

  const CHAVE_COMPROMISSOS = "agendaPedro.compromissos";
  const CHAVE_TEMA = "agendaPedro.tema";
  const categorias = {
    trabalho: { nome: "Trabalho", cor: "#5c7cfa" },
    estudo: { nome: "Estudo", cor: "#8b5cf6" },
    pessoal: { nome: "Pessoal", cor: "#e06c9f" },
    saude: { nome: "Saúde", cor: "#2a9d8f" }
  };

  const elementos = {
    tituloMes: document.querySelector("#titulo-mes"),
    tituloDia: document.querySelector("#titulo-dia"),
    calendario: document.querySelector("#calendario"),
    lista: document.querySelector("#lista-compromissos"),
    mesAnterior: document.querySelector("#mes-anterior"),
    proximoMes: document.querySelector("#proximo-mes"),
    irHoje: document.querySelector("#ir-hoje"),
    alternarTema: document.querySelector("#alternar-tema"),
    novoCompromisso: document.querySelector("#novo-compromisso"),
    modal: document.querySelector("#modal-compromisso"),
    modalConfirmacao: document.querySelector("#modal-confirmacao"),
    formulario: document.querySelector("#formulario-compromisso"),
    tituloFormulario: document.querySelector("#titulo-formulario"),
    confirmarExclusao: document.querySelector("#confirmar-exclusao")
  };

  const hoje = new Date();
  let mesExibido = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let dataSelecionada = formatarDataChave(hoje);
  let compromissos = carregarCompromissos();
  let idParaExcluir = null;

  function formatarDataChave(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function criarDataLocal(dataEmTexto) {
    const [ano, mes, dia] = dataEmTexto.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  function carregarCompromissos() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_COMPROMISSOS));
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function salvarCompromissos() {
    localStorage.setItem(CHAVE_COMPROMISSOS, JSON.stringify(compromissos));
  }

  function compromissosDaData(data) {
    return compromissos
      .filter((compromisso) => compromisso.data === data)
      .sort((a, b) => (a.horaInicio || "23:59").localeCompare(b.horaInicio || "23:59"));
  }

  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  function renderizarCalendario() {
    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();
    const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay();
    const quantidadeDeDias = new Date(ano, mes + 1, 0).getDate();
    const totalDeCelulas = Math.ceil((primeiroDiaDaSemana + quantidadeDeDias) / 7) * 7;

    elementos.tituloMes.textContent = mesExibido.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });
    elementos.calendario.replaceChildren();

    for (let indice = 0; indice < totalDeCelulas; indice += 1) {
      const numeroDia = indice - primeiroDiaDaSemana + 1;
      if (numeroDia < 1 || numeroDia > quantidadeDeDias) {
        const espacoVazio = criarElemento("span", "dia vazio");
        espacoVazio.setAttribute("aria-hidden", "true");
        elementos.calendario.append(espacoVazio);
        continue;
      }

      const data = new Date(ano, mes, numeroDia);
      const dataChave = formatarDataChave(data);
      const eventosDoDia = compromissosDaData(dataChave);
      const botaoDia = criarElemento("button", "dia");
      botaoDia.type = "button";
      botaoDia.dataset.data = dataChave;
      botaoDia.setAttribute("role", "gridcell");
      botaoDia.setAttribute("aria-label", `${numeroDia} de ${elementos.tituloMes.textContent}, ${eventosDoDia.length} compromisso(s)`);
      if (dataChave === formatarDataChave(hoje)) botaoDia.classList.add("hoje");
      if (dataChave === dataSelecionada) botaoDia.classList.add("selecionado");
      botaoDia.append(criarElemento("span", "dia-numero", numeroDia));

      if (eventosDoDia.length) {
        botaoDia.append(criarElemento("span", "quantidade-eventos", eventosDoDia.length));
      }
      elementos.calendario.append(botaoDia);
    }
  }

  function renderizarLista() {
    const data = criarDataLocal(dataSelecionada);
    const eventos = compromissosDaData(dataSelecionada);
    elementos.tituloDia.textContent = data.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long"
    });
    elementos.lista.replaceChildren();

    if (!eventos.length) {
      const vazio = criarElemento("div", "estado-vazio");
      vazio.append(criarElemento("span", "", "○"), criarElemento("p", "", "Nenhum compromisso para este dia."));
      elementos.lista.append(vazio);
      return;
    }

    eventos.forEach((compromisso) => {
      const categoria = categorias[compromisso.categoria] || categorias.pessoal;
      const artigo = criarElemento("article", "compromisso");
      artigo.dataset.id = compromisso.id;
      artigo.style.setProperty("--cor-categoria", categoria.cor);

      const topo = criarElemento("div", "compromisso-topo");
      const informacoes = criarElemento("div");
      informacoes.append(criarElemento("h3", "", compromisso.titulo));
      const horario = compromisso.horaInicio
        ? `${compromisso.horaInicio}${compromisso.horaTermino ? ` – ${compromisso.horaTermino}` : ""}`
        : "Sem horário definido";
      informacoes.append(criarElemento("p", "compromisso-horario", horario));

      const acoes = criarElemento("div", "acoes-item");
      const editar = criarElemento("button", "acao-item", "✎");
      editar.type = "button";
      editar.dataset.acao = "editar";
      editar.setAttribute("aria-label", `Editar ${compromisso.titulo}`);
      const excluir = criarElemento("button", "acao-item", "×");
      excluir.type = "button";
      excluir.dataset.acao = "excluir";
      excluir.setAttribute("aria-label", `Excluir ${compromisso.titulo}`);
      acoes.append(editar, excluir);
      topo.append(informacoes, acoes);
      artigo.append(topo);

      if (compromisso.descricao) artigo.append(criarElemento("p", "compromisso-descricao", compromisso.descricao));
      artigo.append(criarElemento("span", "categoria", categoria.nome));
      elementos.lista.append(artigo);
    });
  }

  function renderizarTudo() {
    renderizarCalendario();
    renderizarLista();
  }

  function mudarMes(deslocamento) {
    mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + deslocamento, 1);
    dataSelecionada = formatarDataChave(mesExibido);
    renderizarTudo();
  }

  elementos.mesAnterior.addEventListener("click", () => mudarMes(-1));
  elementos.proximoMes.addEventListener("click", () => mudarMes(1));
  elementos.irHoje.addEventListener("click", () => {
    mesExibido = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    dataSelecionada = formatarDataChave(hoje);
    renderizarTudo();
  });

  elementos.calendario.addEventListener("click", (evento) => {
    const dia = evento.target.closest("button[data-data]");
    if (!dia) return;
    dataSelecionada = dia.dataset.data;
    renderizarTudo();
  });

  renderizarTudo();
})();
