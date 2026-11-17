import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";

const extensionDir = path.dirname(fileURLToPath(import.meta.url));
const instances = new Map();

const screens = [
  {
    id: "menu",
    group: "Público",
    name: "Cardápio",
    purpose: "Apresentar a lanchonete, destaques, categorias e produtos ativos.",
    states: ["Carregando", "Sem produtos", "Erro ao carregar", "Indisponível"],
  },
  {
    id: "login",
    group: "Acesso",
    name: "Login administrativo",
    purpose: "Acesso por e-mail e senha para a única conta autorizada.",
    states: ["Erro de credenciais", "Enviando"],
  },
  {
    id: "recovery",
    group: "Acesso",
    name: "Recuperação de senha",
    purpose: "Solicitar e concluir a redefinição segura da senha.",
    states: ["Enviando", "Link expirado", "Sucesso"],
  },
  {
    id: "dashboard",
    group: "Administração",
    name: "Início do painel",
    purpose: "Resumo do cardápio e checklist de itens que merecem atenção.",
    states: ["Carregando", "Erro de acesso"],
  },
  {
    id: "products",
    group: "Administração",
    name: "Produtos",
    purpose: "Separar produtos ativos e arquivados em seções, com status à esquerda, ações em ícones à direita e linhas reutilizáveis; a exclusão pede confirmação.",
    states: ["Lista vazia", "Carregando", "Erro", "Disponível", "Indisponível", "Arquivado", "Confirmação de exclusão"],
  },
  {
    id: "product-form",
    group: "Administração",
    name: "Cadastro e edição de produto",
    purpose: "Editar nome, descrição, preço, categoria, destaque, disponibilidade, imagem e ordem.",
    states: ["Validação", "Carregando", "Salvando", "Erro", "Sucesso", "Imagem inválida"],
  },
  {
    id: "categories",
    group: "Administração",
    name: "Categorias",
    purpose: "Listar categorias ativas e arquivadas em seções separadas, reutilizando o mesmo padrão de linha dos produtos.",
    states: ["Lista vazia", "Carregando", "Erro", "Ativa", "Arquivada"],
  },
  {
    id: "category-form",
    group: "Administração",
    name: "Cadastro e edição de categoria",
    purpose: "Usar o mesmo formulário para criar ou editar nome, descrição e ordem da categoria.",
    states: ["Validação", "Carregando", "Salvando", "Erro", "Sucesso"],
  },
  {
    id: "category-delete",
    group: "Administração",
    name: "Confirmação de exclusão de categoria",
    purpose: "Exigir decisão explícita: transferir os produtos ou excluí-los junto.",
    states: ["Carregando", "Confirmação", "Sem exclusão parcial", "Erro"],
  },
  {
    id: "settings",
    group: "Administração",
    name: "Configurações da lanchonete",
    purpose: "Editar nome, descrição, logotipo e endereço.",
    states: ["Carregando", "Salvando", "Erro", "Sucesso", "Imagem inválida"],
  },
];

const actionSummary = {
  project: "Bonmarché",
  status: "Proposta de telas para validação; nenhuma interface de produção foi implementada.",
  visualDirection: {
    logo: "Preservar o logotipo enviado.",
    palette: "Roxo como cor principal, amarelo em detalhes e fundos claros e quentes.",
    tone: "Contemporâneo e apetitoso com calor artesanal; tipografia expressiva, fotografia de comida, textura sutil de papel e detalhes feitos à mão.",
    imagery: "Usar fotos reais dos lanches quando disponíveis; ilustrações na prévia são placeholders, não imagens finais.",
    desktopMenu: "Hero e produtos da seção 'Mais pedidos' na coluna esquerda; categorias e outros produtos na coluna direita. Cada produto popular recebe um selo e acabamento próprios, sem alterar sua categoria.",
    adminNavigation: "Menu retrátil em celular e desktop, recolhido por padrão em ambos e controlado por um botão acessível em todas as telas administrativas.",
    adminDashboard: "Resumo curto de produtos visíveis, indisponíveis e categorias ativas, acompanhado de um checklist de qualidade; os números da prévia são ilustrativos.",
    notifications: "Notificações flutuantes na parte inferior, centralizadas no desktop e adaptadas ao celular; sucesso some após alguns segundos e erro permanece até ser fechado. Botões de demonstração ficam disponíveis nas prévias administrativas.",
    loading: "Sem página separada: o layout permanece e placeholders skeleton ocupam o lugar do conteúdo enquanto carrega. No cardápio, simulam hero, categorias e produtos; no painel, resumo, listas ou formulário conforme a tela. A prévia permite alternar entre carregando e conteúdo.",
    productImageHelp: "No formulário do produto, um botão de ajuda abre dicas para a foto: proporção vertical 4:5, resolução mínima recomendada de 800 × 1000 px, lanche centralizado, boa iluminação e evitar imagem tremida ou texto sobreposto.",
    productDeletion: "A exclusão individual de produto abre uma confirmação curta sobre a lista, com cancelar e confirmar; excluir produtos associados permanece na confirmação da exclusão da categoria, onde a administradora escolhe entre transferi-los ou excluí-los junto.",
    listActions: "Nas listas, linhas reutilizam a mesma estrutura, com ações discretas à direita: lápis para editar, mais para adicionar, caixa para arquivar/restaurar e lixeira para excluir, sempre com nomes acessíveis. Produtos mostram à esquerda um botão de status clicável, com o check ou X centralizado no círculo verde ou vermelho.",
    archivedGroups: "Produtos e categorias aparecem em seções de itens ativos seguidas por arquivados, usando o mesmo componente de linha para ambos os estados. Produtos arquivados não aparecem no cardápio e podem ser restaurados; arquivar uma categoria oculta seus produtos sem arquivá-los.",
  },
  breakpoints: ["Móvel", "Desktop"],
  outOfScope: ["Carrinho", "Pedidos online", "Pagamento online"],
  screens,
};

function respond(response, status, contentType, body) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

function createInstance(instanceId) {
  let server;

  const ready = new Promise((resolve, reject) => {
    server = createServer(async (request, response) => {
      if (request.method !== "GET") {
        respond(response, 405, "text/plain; charset=utf-8", "Method not allowed");
        return;
      }

      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const asset = {
        "/": ["canvas.html", "text/html; charset=utf-8"],
        "/canvas.css": ["canvas.css", "text/css; charset=utf-8"],
        "/canvas.js": ["canvas.js", "text/javascript; charset=utf-8"],
        "/bonmarche-logo.png": ["bonmarche-logo.png", "image/png"],
      }[requestUrl.pathname];

      if (!asset) {
        respond(response, 404, "text/plain; charset=utf-8", "Not found");
        return;
      }

      try {
        const body = await readFile(path.join(extensionDir, asset[0]));
        respond(response, 200, asset[1], body);
      } catch {
        respond(response, 500, "text/plain; charset=utf-8", "Canvas asset unavailable");
      }
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Canvas server did not receive a TCP address."));
        return;
      }

      resolve({ server, url: `http://127.0.0.1:${address.port}/` });
    });
  });

  return { instanceId, ready, server };
}

const canvas = createCanvas({
  id: "bonmarche-screen-planner",
  displayName: "Bonmarché — Planejamento de telas",
  description: "Visualize e valide o mapa original das telas do cardápio e do painel Bonmarché.",
  actions: [
    {
      name: "get-screen-plan",
      description: "Retorna o inventário de telas, estados e limites de escopo propostos para o Bonmarché.",
      handler: () => actionSummary,
    },
  ],
  async open({ instanceId }) {
    if (typeof instanceId !== "string" || instanceId.length === 0) {
      throw new CanvasError("invalid_instance", "Canvas instanceId is required.");
    }

    let instance = instances.get(instanceId);
    if (!instance) {
      instance = createInstance(instanceId);
      instances.set(instanceId, instance);
    }

    try {
      const { url } = await instance.ready;
      return { url, status: "Planejamento de telas pronto para validação." };
    } catch (error) {
      instances.delete(instanceId);
      throw new CanvasError(
        "canvas_open_failed",
        error instanceof Error ? error.message : "Could not start the Bonmarché canvas.",
      );
    }
  },
  onClose({ instanceId }) {
    const instance = instances.get(instanceId);
    if (!instance) return;

    instances.delete(instanceId);
    instance.ready.then(({ server }) => server.close()).catch(() => {});
  },
});

await joinSession({ canvases: [canvas] });
