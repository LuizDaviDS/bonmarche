const screens = [
  {
    id: "menu",
    group: "Público",
    name: "Cardápio",
    purpose: "Apresentar a lanchonete, destaques, categorias e produtos ativos.",
    states: ["Carregando", "Sem produtos", "Erro ao carregar", "Indisponível"],
    render: menuScreen,
  },
  {
    id: "login",
    group: "Acesso",
    name: "Login administrativo",
    purpose: "Entrar com a única conta autorizada, sem cadastro público.",
    states: ["Enviando", "Credenciais inválidas", "Erro de conexão"],
    render: loginScreen,
  },
  {
    id: "recovery",
    group: "Acesso",
    name: "Recuperação de senha",
    purpose: "Solicitar o link e definir uma nova senha em um fluxo seguro.",
    states: ["Enviando", "Link expirado ou usado", "Senha alterada"],
    render: recoveryScreen,
  },
  {
    id: "dashboard",
    group: "Administração",
    name: "Início do painel",
    purpose: "Resumo do cardápio e checklist de itens que merecem atenção.",
    states: ["Carregando", "Acesso não autorizado"],
    render: dashboardScreen,
  },
  {
    id: "products",
    group: "Administração",
    name: "Produtos",
    purpose: "Separar produtos ativos e arquivados em seções, com status à esquerda, ações em ícones à direita e linhas reutilizáveis; a exclusão pede confirmação.",
    states: ["Lista vazia", "Carregando", "Erro", "Disponível", "Indisponível", "Arquivado", "Confirmação de exclusão"],
    render: productsScreen,
  },
  {
    id: "product-form",
    group: "Administração",
    name: "Cadastro e edição de produto",
    purpose: "Nome, descrição, preço, categoria, destaque, disponibilidade, imagem única e ordem.",
    states: ["Validação", "Carregando", "Salvando", "Erro", "Sucesso", "Formato ou tamanho inválido"],
    render: productFormScreen,
  },
  {
    id: "categories",
    group: "Administração",
    name: "Categorias",
    purpose: "Listar categorias ativas e arquivadas em seções separadas, reutilizando o mesmo padrão de linha dos produtos.",
    states: ["Lista vazia", "Carregando", "Erro", "Ativa", "Arquivada"],
    render: categoriesScreen,
  },
  {
    id: "category-form",
    group: "Administração",
    name: "Cadastro e edição de categoria",
    purpose: "Usar o mesmo formulário para criar ou editar nome, descrição e ordem da categoria.",
    states: ["Validação", "Carregando", "Salvando", "Erro", "Sucesso"],
    render: categoryFormScreen,
  },
  {
    id: "category-delete",
    group: "Administração",
    name: "Excluir categoria",
    purpose: "Confirmar a decisão sobre os produtos associados antes de excluir.",
    states: ["Carregando", "Transferir produtos", "Excluir produtos junto", "Operação atômica"],
    render: categoryDeleteScreen,
  },
  {
    id: "settings",
    group: "Administração",
    name: "Configurações da lanchonete",
    purpose: "Atualizar nome, descrição, logotipo e endereço.",
    states: ["Carregando", "Salvando", "Erro", "Sucesso", "Formato ou tamanho de imagem inválido"],
    render: settingsScreen,
  },
];

const nav = document.querySelector("#screen-list");
const title = document.querySelector("#screen-title");
const group = document.querySelector("#screen-group");
const purpose = document.querySelector("#screen-purpose");
const stateList = document.querySelector("#screen-states");
const mock = document.querySelector("#mock-screen");
const status = document.querySelector("#preview-status");
const previewTests = document.querySelector("#preview-tests");
const storageKey = "bonmarche-screen-planner:v1";
let activeId = "menu";
let viewport = "mobile";
let notificationTimer;
let isLoading = false;
let deleteTrigger;

function readViewState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    if (screens.some((screen) => screen.id === saved.screen)) activeId = saved.screen;
    if (saved.viewport === "mobile" || saved.viewport === "desktop") viewport = saved.viewport;
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function saveViewState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ screen: activeId, viewport }));
  } catch {
    status.textContent = "A prévia está atualizada; o navegador não permitiu guardar a seleção.";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function renderScreen() {
  clearNotification();
  const selected = screens.find((screen) => screen.id === activeId) ?? screens[0];
  title.textContent = selected.name;
  group.textContent = selected.group;
  purpose.textContent = selected.purpose;
  previewTests.hidden = activeId !== "menu" && selected.group !== "Administração";
  previewTests.querySelector("[data-notification='success']").hidden = selected.group !== "Administração";
  previewTests.querySelector("[data-notification='error']").hidden = selected.group !== "Administração";
  stateList.replaceChildren(...selected.states.map((item) => {
    const chip = document.createElement("span");
    chip.className = "state-chip";
    chip.textContent = item;
    return chip;
  }));
  nav.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.screen === selected.id));
  });
  document.querySelectorAll(".viewport-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.viewport === viewport));
  });
  mock.classList.toggle("desktop", viewport === "desktop");
  mock.innerHTML = selected.render();
  updateLoadingControl();
  if (isLoading) {
    applyLoadingState();
  } else {
    status.textContent = `Prévia: ${selected.name}, ${viewport === "mobile" ? "celular" : "desktop"}.`;
  }
  saveViewState();
}

function updateLoadingControl() {
  const button = previewTests.querySelector("[data-loading]");
  button.textContent = isLoading ? "Voltar ao conteúdo" : "Simular carregamento";
  button.setAttribute("aria-pressed", String(isLoading));
}

function skeleton(className) {
  return `<span class="skeleton ${className}" aria-hidden="true"></span>`;
}

function applyLoadingState() {
  if (activeId === "menu") {
    const body = mock.querySelector(".mock-body");
    body.setAttribute("aria-busy", "true");
    body.innerHTML = `<div class="loading-menu" role="status"><span class="sr-only">Carregando cardápio</span><div class="skeleton-hero">${skeleton("skeleton-line wide")}${skeleton("skeleton-line medium")}${skeleton("skeleton-line short")}${skeleton("skeleton-art")}</div><div class="skeleton-section-title">${skeleton("skeleton-line title")}</div><div class="skeleton-product">${skeleton("skeleton-photo")}${skeleton("skeleton-copy")}</div><div class="skeleton-section-title">${skeleton("skeleton-line title")}</div><div class="skeleton-categories">${skeleton("skeleton-pill")}${skeleton("skeleton-pill")}${skeleton("skeleton-pill")}</div><div class="skeleton-product">${skeleton("skeleton-photo")}${skeleton("skeleton-copy")}</div><div class="skeleton-product">${skeleton("skeleton-photo")}${skeleton("skeleton-copy")}</div></div>`;
  } else {
    const content = mock.querySelector(".admin-content");
    content.setAttribute("aria-busy", "true");
    if (activeId === "dashboard") {
      content.innerHTML = `<div class="loading-admin" role="status"><span class="sr-only">Carregando resumo do painel</span>${skeleton("skeleton-line heading")}${skeleton("skeleton-line medium")}<div class="skeleton-metrics">${skeleton("skeleton-card")}${skeleton("skeleton-card")}${skeleton("skeleton-card")}</div>${skeleton("skeleton-line title")}<div class="skeleton-card checklist-skeleton">${skeleton("skeleton-line medium")}${skeleton("skeleton-line short")}</div></div>`;
    } else if (activeId === "product-form" || activeId === "settings") {
      content.innerHTML = `<div class="loading-admin" role="status"><span class="sr-only">Carregando formulário</span>${skeleton("skeleton-line heading")}${skeleton("skeleton-line medium")}<div class="skeleton-form">${skeleton("skeleton-field")}${skeleton("skeleton-field")}${skeleton("skeleton-field")}${skeleton("skeleton-field")}</div></div>`;
    } else {
      content.innerHTML = `<div class="loading-admin" role="status"><span class="sr-only">Carregando lista</span>${skeleton("skeleton-line heading")}${skeleton("skeleton-line medium")}${skeleton("skeleton-card list-skeleton")}${skeleton("skeleton-card list-skeleton")}${skeleton("skeleton-card list-skeleton")}</div>`;
    }
  }
  status.textContent = `Demonstração: carregamento de ${activeId === "menu" ? "cardápio" : "conteúdo administrativo"}. O conteúdo permanece no lugar enquanto os dados são buscados.`;
}

previewTests.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const loadingButton = event.target.closest("[data-loading]");
  if (loadingButton) {
    isLoading = !isLoading;
    renderScreen();
    return;
  }
  const button = event.target.closest("[data-notification]");
  if (!button) return;

  clearNotification();
  const isSuccess = button.dataset.notification === "success";
  const toast = document.createElement("div");
  toast.className = `preview-toast ${isSuccess ? "success" : "error"}`;
  toast.setAttribute("role", isSuccess ? "status" : "alert");

  const icon = document.createElement("span");
  icon.className = "preview-toast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isSuccess ? "✓" : "!";

  const message = document.createElement("p");
  message.textContent = isSuccess
    ? "Alterações salvas com sucesso."
    : "Não foi possível salvar. Verifique os dados e tente novamente.";

  const close = document.createElement("button");
  close.className = "preview-toast-close";
  close.type = "button";
  close.setAttribute("aria-label", "Fechar notificação");
  close.textContent = "×";

  toast.append(icon, message, close);
  mock.append(toast);
  status.textContent = isSuccess
    ? "Demonstração: notificação de sucesso. Ela desaparecerá em alguns segundos."
    : "Demonstração: notificação de erro. Feche-a pelo botão da notificação.";

  if (isSuccess) notificationTimer = window.setTimeout(clearNotification, 4000);
});

function clearNotification() {
  window.clearTimeout(notificationTimer);
  notificationTimer = undefined;
  mock.querySelector(".preview-toast")?.remove();
}

mock.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const categoryFormButton = event.target.closest("[data-open-category-form]");
  if (categoryFormButton) {
    activeId = "category-form";
    isLoading = false;
    renderScreen();
    return;
  }

  const productFormButton = event.target.closest("[data-open-product-form]");
  if (productFormButton) {
    activeId = "product-form";
    isLoading = false;
    renderScreen();
    return;
  }

  if (event.target.closest("[data-open-category-delete]")) {
    activeId = "category-delete";
    isLoading = false;
    renderScreen();
    return;
  }

  const availabilityButton = event.target.closest("[data-product-availability]");
  if (availabilityButton) {
    const available = availabilityButton.getAttribute("aria-pressed") !== "true";
    const updatedButton = availabilityButton.cloneNode(false);
    updatedButton.className = `product-status ${available ? "available" : "unavailable-status"}`;
    updatedButton.setAttribute("aria-pressed", String(available));
    updatedButton.setAttribute("aria-label", `${available ? "Disponível" : "Indisponível"}: alterar disponibilidade`);
    updatedButton.innerHTML = statusIcon(available ? "check" : "close");
    availabilityButton.replaceWith(updatedButton);
    updatedButton.focus();
    const availabilityLabel = updatedButton.closest(".management-row").querySelector(".product-availability-label");
    availabilityLabel.textContent = available ? "Disponível" : "Indisponível";
    status.textContent = `Demonstração: produto marcado como ${available ? "disponível" : "indisponível"}.`;
    return;
  }

  const archiveButton = event.target.closest("[data-product-archive], [data-category-archive]");
  if (archiveButton) {
    status.textContent = "Demonstração: item arquivado; a prévia não altera dados.";
    return;
  }

  const restoreButton = event.target.closest("[data-product-restore], [data-category-restore]");
  if (restoreButton) {
    status.textContent = "Demonstração: item restaurado; a prévia não altera dados.";
    return;
  }

  const deleteProductButton = event.target.closest("[data-delete-product]");
  if (deleteProductButton) {
    deleteTrigger = deleteProductButton;
    const dialog = mock.querySelector("#product-delete-dialog");
    const productName = deleteProductButton.dataset.productName ?? "Este produto";
    dialog.querySelector("#product-delete-description").textContent =
      `“${productName}” será removido permanentemente do cardápio. Esta ação não pode ser desfeita.`;
    dialog.hidden = false;
    dialog.querySelector("[data-cancel-product-delete]").focus();
    status.textContent = "Confirme se deseja excluir o produto selecionado.";
    return;
  }

  if (event.target.closest("[data-cancel-product-delete]")) {
    closeProductDeleteDialog(false);
    return;
  }

  if (event.target.closest("[data-confirm-product-delete]")) {
    closeProductDeleteDialog(true);
    return;
  }

  if (event.target.closest(".preview-toast-close")) {
    clearNotification();
    status.textContent = "Notificação de erro fechada.";
    return;
  }

  const toggle = event.target.closest(".admin-menu-toggle");
  const imageHelp = event.target.closest("[data-image-help]");
  if (imageHelp) {
    const expanded = imageHelp.getAttribute("aria-expanded") !== "true";
    const guidance = mock.querySelector("#image-guidance");
    guidance.hidden = !expanded;
    imageHelp.setAttribute("aria-expanded", String(expanded));
    status.textContent = expanded ? "Dicas de imagem abertas." : "Dicas de imagem fechadas.";
    return;
  }

  const layout = mock.querySelector(".admin-layout");
  const navigation = mock.querySelector("#admin-navigation");
  if (!toggle || !layout || !navigation) return;

  const expanded = toggle.getAttribute("aria-expanded") !== "true";
  layout.classList.toggle("menu-collapsed", !expanded);
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.setAttribute("aria-label", `${expanded ? "Recolher" : "Expandir"} menu do painel`);
  navigation.setAttribute("aria-hidden", String(!expanded));
  status.textContent = `Menu do painel ${expanded ? "expandido" : "recolhido"}.`;
});

mock.addEventListener("keydown", (event) => {
  const dialog = mock.querySelector("#product-delete-dialog");
  if (!dialog || dialog.hidden) return;

  if (event.key === "Escape") {
    closeProductDeleteDialog(false);
    return;
  }

  if (event.key === "Tab") {
    const buttons = [...dialog.querySelectorAll("button:not(:disabled)")];
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0 || buttons.length === 0) return;
    event.preventDefault();
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
  }
});

function closeProductDeleteDialog(confirmed) {
  const dialog = mock.querySelector("#product-delete-dialog");
  if (!dialog) return;
  dialog.hidden = true;
  status.textContent = confirmed
    ? "Demonstração: exclusão confirmada. Nenhum produto foi removido."
    : "Exclusão cancelada; o produto foi mantido.";
  deleteTrigger?.focus();
  deleteTrigger = undefined;
}

function buildNavigation() {
  document.querySelector("#screen-count").textContent = String(screens.length);
  for (const screen of screens) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "screen-option";
    button.dataset.screen = screen.id;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<small>${escapeHtml(screen.group)}</small><span>${escapeHtml(screen.name)}</span>`;
    button.addEventListener("click", () => {
      activeId = screen.id;
      isLoading = false;
      renderScreen();
    });
    nav.append(button);
  }
}

function field(label, value, tall = false) {
  return `<div class="mock-field"><label>${escapeHtml(label)}</label><div class="mock-input${tall ? " tall" : ""}">${escapeHtml(value)}</div></div>`;
}

function iconSvg(name) {
  const paths = {
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    box: '<path d="m3.5 7 8.5-4 8.5 4-8.5 4z"/><path d="M3.5 7v10l8.5 4 8.5-4V7M12 11v10"/>',
    tag: '<path d="M20 13 13 20 4 11V4h7z"/><circle cx="8" cy="8" r="1"/>',
    settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/>',
    restore: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    check: '<path d="m6 12 4 4 8-8"/>',
    close: '<path d="m7 7 10 10M17 7 7 17"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

function iconButton(label, icon, attributes = "") {
  return `<button type="button" class="row-icon-button" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${attributes}>${iconSvg(icon)}</button>`;
}

function managementRow(name, details, status, actions, archived = false, actionLabel = "item") {
  return `<article class="management-row${archived ? " archived-row" : ""}">${status}<div class="management-row-copy"><strong>${escapeHtml(name)}</strong><small>${details}</small></div><div class="row-actions" aria-label="Ações ${actionLabel} ${escapeHtml(name)}">${actions}</div></article>`;
}

function managementSection(title, rows, { archived = false, description = "" } = {}) {
  return `<section class="management-section${archived ? " archived-section" : ""}"><h4>${escapeHtml(title)}</h4>${description ? `<p>${escapeHtml(description)}</p>` : ""}<div class="management-list">${rows}</div></section>`;
}

function productRow(name, category, price, available, archived = false) {
  const status = archived
    ? `<span class="product-status archived-status" aria-label="Produto arquivado">${iconSvg("archive")}</span>`
    : `<button type="button" class="product-status ${available ? "available" : "unavailable-status"}" data-product-availability aria-pressed="${available}" aria-label="${available ? "Disponível" : "Indisponível"}: alterar disponibilidade">${statusIcon(available ? "check" : "close")}</button>`;
  const actions = archived
    ? `${iconButton(`Editar ${name}`, "edit", 'data-open-product-form')}${iconButton(`Restaurar ${name}`, "restore", "data-product-restore")}${iconButton(`Excluir ${name}`, "trash", `data-delete-product data-product-name="${escapeHtml(name)}"`)}`
    : `${iconButton(`Editar ${name}`, "edit", 'data-open-product-form')}${iconButton(`Arquivar ${name}`, "archive", "data-product-archive")}${iconButton(`Excluir ${name}`, "trash", `data-delete-product data-product-name="${escapeHtml(name)}"`)}`;
  const statusLabel = archived ? "Arquivado" : available ? "Disponível" : "Indisponível";
  const details = `${escapeHtml(category)} · ${escapeHtml(price)}${!archived && name === "Produto de exemplo" ? " · Em destaque" : ""} · <span class="product-availability-label">${statusLabel}</span>`;
  return managementRow(name, details, status, actions, archived, "do produto");
}

function categoryRow(name, description, order, archived = false) {
  const actions = archived
    ? `${iconButton(`Editar ${name}`, "edit", 'data-open-category-form')}${iconButton(`Restaurar ${name}`, "restore", "data-category-restore")}${iconButton(`Excluir ${name}`, "trash", "data-open-category-delete")}`
    : `${iconButton(`Editar ${name}`, "edit", 'data-open-category-form')}${iconButton(`Arquivar ${name}`, "archive", "data-category-archive")}${iconButton(`Excluir ${name}`, "trash", "data-open-category-delete")}`;
  const status = `<span class="category-status ${archived ? "archived" : "active"}" aria-label="${archived ? "Categoria arquivada" : "Categoria ativa"}"></span>`;
  const details = `${escapeHtml(description)} · Ordem ${escapeHtml(order)}`;
  return managementRow(name, details, status, actions, archived, "da categoria");
}

function statusIcon(name) {
  return iconSvg(name);
}

function mockHeader(linkLabel = "Cardápio") {
  return `<header class="mock-header"><div class="mock-brand"><img src="/bonmarche-logo.png" alt="" /> Bonmarché</div><span class="mock-link">${escapeHtml(linkLabel)}</span></header>`;
}

function adminShell(section, content) {
  const sections = [
    { label: "Início", icon: "dashboard" },
    { label: "Produtos", icon: "box" },
    { label: "Categorias", icon: "tag" },
    { label: "Configurações", icon: "settings" },
  ];
  return `<div class="admin-shell"><header class="admin-top"><div class="admin-brand"><strong>Bonmarché</strong><span class="admin-brand-label">PAINEL ADMINISTRATIVO</span></div><button type="button" class="admin-menu-toggle" aria-expanded="false" aria-controls="admin-navigation" aria-label="Expandir menu do painel"><span class="admin-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span><span>Menu</span></button></header><div class="admin-layout menu-collapsed"><nav id="admin-navigation" class="admin-side" aria-label="Navegação do painel" aria-hidden="true">${sections.map((item) => `<div class="${item.label === section ? "selected" : ""}"><span class="admin-nav-icon">${iconSvg(item.icon)}</span><span class="admin-nav-label">${escapeHtml(item.label)}</span></div>`).join("")}</nav><section class="admin-content">${content}</section></div></div>`;
}

function menuScreen() {
  const sandwich = `<div class="sandwich-art" aria-hidden="true"><span class="bun-top"></span><span class="lettuce"></span><span class="patty"></span><span class="cheese"></span><span class="bun-bottom"></span></div>`;
  const photo = `<div class="mock-food" aria-hidden="true">${sandwich}<span class="photo-label">FOTO DO LANCHE</span></div>`;
  return `<div>${mockHeader("Opções")}<div class="mock-body"><section class="mock-hero"><p class="eyebrow">SABOR DE BAIRRO, FEITO COM CARINHO</p><div class="mock-hero-copy"><h3>Seu lanche favorito, com gostinho de casa.</h3><p>Receitas caprichadas para deixar o dia mais gostoso.</p></div><div class="mock-hero-art">${sandwich}</div></section><section class="mock-featured"><div class="mock-section-title"><h3>Mais pedidos</h3></div><div class="product-list"><article class="mock-product featured-product">${photo}<div><h4>Especial da casa</h4><span class="popular-badge">MAIS PEDIDO</span><p>Pão macio, recheio caprichado e aquele toque caseiro.</p><span class="mock-price">R$ 0,00</span></div></article></div></section><section class="mock-menu-list"><div class="mock-section-title"><h3>Escolha seu momento</h3></div><div class="mock-categories"><span class="mock-category active">Tudo</span><span class="mock-category">Lanches</span><span class="mock-category">Bebidas</span></div><div class="product-list"><article class="mock-product">${photo}<div><h4>Clássico da casa</h4><p>Descrição curta, apetitosa e fácil de ler.</p><span class="mock-price">R$ 0,00</span></div></article><article class="mock-product">${photo}<div><h4>Mais um favorito</h4><p>Continua visível mesmo quando estiver indisponível.</p><span class="mock-price">R$ 0,00</span><br/><span class="unavailable">INDISPONÍVEL</span></div></article></div></section><div class="mock-footer">Endereço e horário do estabelecimento</div></div></div>`;
}

function loginScreen() {
  return `<div>${mockHeader("Entrar")}<div class="mock-body"><div class="mock-hero login-hero"><div class="login-hero-title"><h3>Bem-vindo</h3><p class="eyebrow">ÁREA RESTRITA</p></div><p class="login-hero-description">Acesso somente para a pessoa administradora.</p></div><div class="mock-form">${field("E-mail", "seu@email.com")}${field("Senha", "••••••••")}<span class="mock-action">Entrar no painel</span><span class="mock-link">Esqueci minha senha</span></div><div class="mock-footer">Sem cadastro público. Mensagens de erro aparecem junto ao formulário.</div></div></div>`;
}

function recoveryScreen() {
  return `<div>${mockHeader("Recuperar senha")}<div class="mock-body recovery-body"><div class="mock-section-title"><h3>Redefinir senha</h3></div><p class="mock-label">Solicitar link de recuperação pelo e-mail administrativo; o formulário não revela se um endereço está cadastrado.</p><div class="mock-form">${field("E-mail da conta", "seu@email.com")}<span class="mock-action">Enviar link seguro</span><div class="mock-alert">Etapa seguinte: link válido abre a definição de nova senha. Link expirado ou já usado mostra como solicitar outro.</div>${field("Nova senha", "Pelo menos 8 caracteres")}${field("Confirmar nova senha", "Repita a nova senha")}<span class="mock-action">Salvar nova senha</span></div></div></div>`;
}

function dashboardScreen() {
  return adminShell("Início", `<div class="dashboard-overview"><header class="dashboard-heading"><div><p class="eyebrow">VISÃO GERAL DO CARDÁPIO</p><h3>Resumo do cardápio</h3></div><span class="dashboard-example">EXEMPLO</span></header><div class="dashboard-metrics" aria-label="Indicadores ilustrativos do cardápio"><article class="dashboard-metric"><span>Produtos visíveis</span><strong>12</strong></article><article class="dashboard-metric"><span>Indisponíveis</span><strong>2</strong></article><article class="dashboard-metric"><span>Categorias ativas</span><strong>4</strong></article></div><section class="dashboard-checklist" aria-labelledby="dashboard-checklist-title"><h4 id="dashboard-checklist-title">Checklist do cardápio</h4><div class="dashboard-checklist-list"><div class="dashboard-check"><span class="dashboard-check-icon" aria-hidden="true">!</span><div><strong>2 produtos sem foto</strong><small>Fotos ajudam a apresentar melhor os lanches.</small></div></div><div class="dashboard-check"><span class="dashboard-check-icon" aria-hidden="true">!</span><div><strong>1 categoria sem produtos</strong><small>Confira se ela ainda deve aparecer.</small></div></div></div></section><div class="dashboard-bottom"><p>Números ilustrativos; o painel exibirá os dados reais.</p><span class="mock-action">Ver cardápio público</span></div></div>`);
}

function productsScreen() {
  const activeProducts = `${productRow("Produto de exemplo", "Lanches", "R$ 0,00", true)}${productRow("Produto indisponível", "Lanches", "R$ 0,00", false)}`;
  const archivedProducts = productRow("Produto arquivado", "Bebidas", "R$ 0,00", false, true);
  return adminShell("Produtos", `<div class="management-heading"><div><h3>Produtos</h3><p>Disponibilidade e arquivamento são estados diferentes.</p></div><button type="button" class="row-icon-button add-row-button" aria-label="Adicionar produto" title="Adicionar produto" data-open-product-form>${iconSvg("add")}</button></div>${managementSection("Produtos ativos", activeProducts)}${managementSection("Produtos arquivados", archivedProducts, { archived: true, description: "Não aparecem no cardápio, mas podem ser restaurados." })}<div id="product-delete-dialog" class="product-delete-overlay" hidden><section class="product-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="product-delete-title" aria-describedby="product-delete-description"><h4 id="product-delete-title">Excluir produto?</h4><p id="product-delete-description">O produto selecionado será removido permanentemente do cardápio. Esta ação não pode ser desfeita.</p><div class="mock-actions"><button type="button" class="mock-button" data-cancel-product-delete>Cancelar</button><button type="button" class="mock-button danger" data-confirm-product-delete>Confirmar exclusão</button></div></section></div>`);
}

function productFormScreen() {
  return adminShell("Produtos", `<h3>Dados do produto</h3><p>Um produto pertence a uma categoria e tem uma imagem principal.</p><div class="mock-form">${field("Nome", "Nome do produto")}${field("Descrição", "Descrição curta", true)}${field("Preço (R$)", "0,00")}${field("Categoria", "Escolher categoria")}<div class="mock-logo-upload"><span class="mock-logo-sample">+</span>Uma imagem · JPG, PNG ou WebP</div><button type="button" class="image-help-button" data-image-help aria-expanded="false" aria-controls="image-guidance"><span aria-hidden="true">?</span> Ajuda com a imagem</button><div id="image-guidance" class="image-guidance" hidden><strong>Dicas para uma boa foto</strong><ul><li>Use proporção vertical <strong>4:5</strong>.</li><li>Resolução mínima recomendada: <strong>800 × 1000 px</strong>.</li><li>Centralize o lanche, use boa iluminação e evite fotos tremidas ou com texto sobreposto.</li></ul></div><div class="mock-checks"><span>☐ Destaque</span><span>☑ Disponível</span></div>${field("Ordem de exibição", "0")}<div class="mock-actions"><button class="mock-button">Cancelar</button><button class="mock-action">Salvar produto</button></div></div>`);
}

function categoriesScreen() {
  const activeCategories = `${categoryRow("Lanches", "Descrição opcional", "1")}${categoryRow("Bebidas", "Descrição opcional", "2")}`;
  const archivedCategories = categoryRow("Categoria arquivada", "Produtos associados preservados", "3", true);
  return adminShell("Categorias", `<div class="management-heading"><div><h3>Categorias</h3><p>Produtos em categoria arquivada ficam ocultos sem serem arquivados.</p></div><button type="button" class="row-icon-button add-row-button" aria-label="Adicionar categoria" title="Adicionar categoria" data-open-category-form>${iconSvg("add")}</button></div>${managementSection("Categorias ativas", activeCategories)}${managementSection("Categorias arquivadas", archivedCategories, { archived: true, description: "Os produtos permanecem preservados, mas não aparecem no cardápio enquanto a categoria estiver arquivada." })}`);
}

function categoryFormScreen() {
  return adminShell("Categorias", `<h3>Dados da categoria</h3><p>Use este formulário para cadastrar uma categoria ou atualizar uma existente.</p><div class="mock-form">${field("Nome", "Nome da categoria")}${field("Descrição (opcional)", "Descrição curta", true)}${field("Ordem de exibição", "0")}<div class="mock-actions"><button type="button" class="mock-button">Cancelar</button><button type="button" class="mock-action category-form-save">Salvar categoria</button></div></div>`);
}

function categoryDeleteScreen() {
  return adminShell("Categorias", `<h3>Excluir categoria?</h3><p>Esta categoria tem produtos associados. Escolha o que fazer antes de continuar.</p><div class="mock-alert"><strong>Esta ação é definitiva.</strong><br/>Produtos indisponíveis ou arquivados também são considerados nesta decisão.</div><div class="mock-form"><label class="mock-row"><span><strong>Transferir produtos</strong><small>Escolher categoria de destino</small></span><span>◯</span></label>${field("Nova categoria para os produtos", "Escolher destino")}<label class="mock-row"><span><strong>Excluir produtos associados</strong><small>Produtos e imagens também serão removidos</small></span><span>◯</span></label><div class="mock-actions"><button class="mock-button">Cancelar</button><button class="mock-button danger">Confirmar exclusão</button></div><div class="mock-footer">Uma única operação consistente evita exclusões parciais.</div></div>`);
}

function settingsScreen() {
  return adminShell("Configurações", `<h3>Estabelecimento</h3><p>Informações exibidas no cardápio público.</p><div class="mock-form">${field("Nome", "Bonmarché")}${field("Descrição", "Conte um pouco sobre a lanchonete.", true)}<div class="mock-logo-upload"><span class="mock-logo-sample">B</span>Substituir logotipo · Imagem validada</div>${field("Endereço", "Rua e número", true)}<div class="mock-actions"><button class="mock-action">Salvar configurações</button></div></div>`);
}

buildNavigation();
readViewState();
document.querySelectorAll(".viewport-button").forEach((button) => {
  button.addEventListener("click", () => {
    viewport = button.dataset.viewport;
    renderScreen();
  });
});
renderScreen();
