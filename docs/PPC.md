# PPC 3.0 — Protocolo de Preservação de Código

> Aplicação: fork `cairobernardescosta-crypto/OpenDirector1`. Este protocolo complementa o `AGENTS.md` original e não revoga requisitos funcionais, segurança, licença ou arquitetura do OpenDirector.

## 1. Objetivo
Preservar código, funcionalidades e dados enquanto o fork evolui, evitando regressões, mudanças desnecessárias, commits ruidosos e publicação sem autorização.

## 2. Branches e autorização
- `main`: versão principal estável e base de releases. **Não integrar `dev` em `main` sem autorização explícita do proprietário.**
- `dev`: desenvolvimento contínuo via GitHub API, podendo acumular melhorias e correções.
- Branches temporárias são opcionais quando facilitarem mudanças isoladas. Evitar criação excessiva.
- A existência deste documento é uma regra de atuação dos agentes; **não é uma proteção técnica de branch configurada no GitHub**.

## 3. Processo de mudança
1. Identificar o pedido e localizar os arquivos estritamente relevantes antes de editar.
2. Consultar orientações preexistentes do `AGENTS.md`, contratos e serviços nativos.
3. Identificar dependências, riscos de regressão, persistência e comportamento da interface.
4. Alterar o mínimo necessário; preservar funções antigas e compatibilidade. Não substituir subsistemas inteiros por conveniência.
5. Agrupar modificações relacionadas em commits de mensagem objetiva; não criar commits artificiais por pequenas correções sucessivas.
6. Relatar alterações e evidências de validação, inclusive o que não foi verificado. Não declarar sucesso funcional sem evidência.
7. Manter alterações em `dev` até autorização expressa para release/merge na `main`.

## 4. Validação livre — regra permanente
- Testes automatizados, lint, build e validação local **não são obrigatórios após cada correção**.
- Executar testes e validação local quando o proprietário decidir ou solicitar, com escopo proporcional à mudança.
- Não implantar CI, GitHub Actions, checks obrigatórios ou bloqueios que anulem esta regra.
- Quando não testado, registrar `não executado` em vez de `aprovado`.
- Em alterações sensíveis, apontar riscos e verificações recomendadas sem impor sua execução.

## 5. Preservação do OpenDirector
- Preservar interface, canvas, nós/conexões, timeline, criação de conteúdo e mídia, assistentes/agentes, modelos, configurações, exportações e arquitetura de serviços nativos.
- Recursos existentes não podem ser removidos, ocultados ou substituídos sem pedido explícito.
- Utilizar contratos, componentes, estilos, rotas, APIs, persistência e mecanismos de autorização existentes antes de introduzir alternativas.
- Proteger os projetos locais, arquivos de usuário, credenciais, bancos e histórico contra sobrescrita ou migração destrutiva.
- Revisar impactos de compatibilidade caso seja necessário modificar contratos públicos ou estruturas de dados.

## 5.1. Regra obrigatória — reutilização nativa e padrão do código

**Tudo que for criado ou modificado deve seguir o sistema, a arquitetura e os padrões de código já existentes no OpenDirector1.** Antes de implementar, localizar os recursos equivalentes no repositório, reutilizá-los e estendê-los quando necessário.

- **Interface:** aproveitar botões, cards, campos, menus, sidebar, modais, painéis, nós, conectores, ícones, layouts, espaçamentos, cores, bordas, sombras, estados e componentes existentes.
- **Identidade visual:** utilizar fontes, escalas tipográficas, temas, tokens de design, estilos, responsividade, estados de foco/hover/ativo e regras de acessibilidade nativas.
- **Efeitos e movimento:** reutilizar animações, transições, motions, durações, easing, feedback visual e padrões de interação existentes; respeitar preferências de movimento reduzido.
- **Funções e integrações:** reutilizar hooks, serviços, contratos, comandos, APIs, providers, validações, autenticação, persistência, eventos, mecanismos de execução e funções de negócio existentes.
- **Funções adicionais:** quando uma nova função depender de outra já implementada, compor ou estender a função nativa, sem recriar lógica em paralelo nem criar estados inconsistentes entre UI, agentes e backend.
- **Novas páginas e recursos:** integrar ao roteamento, navegação, estado, permissões, internacionalização, configuração e ciclo de vida nativos; não criar aplicações isoladas ou interfaces desconectadas.
- **Ausência de componente compatível:** somente criar um novo componente, serviço ou padrão quando realmente não existir alternativa adequada; inseri-lo na camada nativa correta, documentar brevemente a justificativa e torná-lo reutilizável.
- **Proibições:** não duplicar botões/cards, bibliotecas de design, animações, endpoints ou regras de negócio por conveniência; não introduzir outro framework visual ou serviço paralelo sem necessidade e autorização; não usar mocks, botões inertes ou funções simuladas como entrega funcional.
- **Compatibilidade:** preservar comportamento, estrutura dos projetos, contratos e dados existentes. Mudanças devem respeitar segurança, acessibilidade, suporte bilíngue e desempenho previstos no projeto.

**Ordem obrigatória de implementação:** localizar no código → reutilizar → estender/compor → criar nativamente apenas se faltar → registrar mudanças e validação realmente executada (quando solicitada). Esta regra vale para agentes de IA e desenvolvimento manual e não altera a política de validação livre.


## 5.2. Regra permanente — extensões de cards, conexões e funções

Esta seção se aplica **automaticamente a todo pedido futuro** que acrescente ou altere funções de cards, menus `Novo nó`, conectores, referências, agentes, fluxos e execução. Complementa a arquitetura do `AGENTS.md` sem substituir as regras do OpenDirector.

### Contrato nativo a preservar

1. **Distinguir conceitos:** o tipo de nó (`CanvasNodeKind`), a função/ação configurada, o conteúdo e a execução são responsabilidades diferentes. Preferir **compor uma função sobre um nó nativo compatível** a criar novo tipo de nó; criar tipo novo somente quando o domínio exigir e quando toda a cadeia suportar o contrato.
2. **Referência não é automação:** linhas `CanvasEdge` com `generation_input`, `assembly_input` ou `post_edit_result` não significam, por si só, execução em sequência. Orquestração de etapas deve ter **semântica e estado próprios**, reutilizar os serviços nativos e não reinterpretar linhas existentes.
3. **Identidades e dados:** não renomear/remapear IDs públicos, tipos, `intent`, `referenceBinding`, versões, handles, assets, modelos, credenciais nem dados persistidos para facilitar uma UI. Novos metadados devem ser compatíveis com documentos antigos, com leitura segura e sem migração destrutiva.
4. **Menu e conexões:** não liberar uma opção só alterando o menu ou removendo `disabled`. Toda possibilidade nova deve passar pela mesma matriz compartilhada em `connectionPolicy.ts`, `referenceIssue()`, `connectedCreationKinds()` e `planReferenceBatch()`; preservar bloqueios, capacidade, material de origem, duplicidade, direção, referências fixadas e montagem especial.
5. **Operação atômica:** criar nó + conexões em um único comando em lote quando pertinente; se a validação rejeitar uma parte, não publicar cards órfãos, arestas parciais nem duplicar resultados. Manter undo/redo, cópia/cola, seleção, arraste, reconexão, ocultação, grupos e persistência.
6. **Execução legítima:** cards opcionais podem executar isoladamente quando seus pré-requisitos reais permitirem. Ausência de card obrigatório não deve causar falha artificial; ausência de conteúdo, modelo, permissão ou input **de fato necessário** deve produzir explicação adequada. Um card de texto não precisa gerar imagem ou vídeo. Não simular execução, registrar êxito sem recibo nem consumir créditos inesperadamente.
7. **Agente/UI/backend:** a mesma função usa os mesmos contratos de negócio, validação, locks, permissões, identidade da tarefa, falhas, recuperação e resultados; não criar automação exclusiva do frontend nem endpoints paralelos por conveniência.
8. **Experiência original:** preservar visual, portas, geometria, acessibilidade, atalhos, estados de arraste, ícones e cores nativos. Adicionar nomes/textos em `zh-CN`, `en-US` e `pt-BR` (permitir fallback inglês temporário onde o fork ainda não está totalmente traduzido); nunca traduzir IDs.
9. **Preservar sem esconder problemas:** não apagar caminhos de criação existentes, reduzir matriz de compatibilidade, desativar ferramentas atuais ou modificar projetos antigos para acomodar uma função nova. Se houver incompatibilidade real, registrar o risco e propor alternativa sem regressão.

### Caminho de implementação (fases de referência, não conclusão declarada)

1. **Mapear contrato existente:** seguir a interação da porta/linha ao menu, política, comando, persistência e execução; levantar entradas e saídas existentes, consumidores UI/agente e testes relevantes.
2. **Catálogo/registro de funções:** definir identificadores estáveis, rótulos, categoria, ícone, parâmetros, capacidades e tipos de entrada/saída; reutilizar registros e componentes nativos antes de adicionar estruturas novas.
3. **Ampliar `Novo nó` sem regressão:** manter opções e ordem nativas; acrescentar funções/categorias de modo progressivo, respeitando a matriz de referência e estados indisponíveis.
4. **Configurar cada função:** reutilizar o modelo de configurações para agente, LLM, prompts, entradas, saídas e validação, sem acoplamento a um único provedor.
5. **Executar isolado ou encadeado:** separar conexão de material de dependência de execução; permitir cards independentes e cadeias explícitas; controlar ordem, cancelamento, repetição, falha e idempotência pelos serviços já existentes.
6. **Persistir e preservar:** confirmar contratos de serialização, projetos antigos, links, assets, undo/redo, cópia/cola, importação/exportação, reabertura e histórico, sem migração destrutiva.
7. **Validar regressões conforme decisão do proprietário:** verificar matriz, ciclos, bloqueios, origem vazia, múltiplas fontes, limites, falha intermediária e execução real pela UI e pelo agente. Testes/build são opcionais sob PPC 3.0; registrar `não executado` até ocorrerem.

### Arquivos nativos de referência

- Exibição da linha/portas: `src/canvas/CanvasConnections.tsx`, `src/canvas/connectionPorts.ts`, `src/canvas/useCanvasReferences.ts`.
- Menu/catálogo: `src/canvas/CanvasCreationMenu.tsx`, `src/canvas/creationTools.ts`, `src/canvas/workspace/WorkspaceView.tsx`.
- Política/validação: `src/canvas/connectionPolicy.ts`, `src/canvas/selectionReferences.ts`.
- Comandos/estado: `src/canvas/model.ts`, `src/canvas/workspace/useWorkspaceInteraction.tsx`, `src/canvas/workspaceInteraction.ts`.
- Testes existentes para consultar quando apropriado: `tests/referenceSystem.test.ts`, `tests/nodeReferencePorts.test.ts`, `tests/browser/node_connections.mjs`, `tests/browser/reference_reconnect.mjs`.

**Aplicação a novos pedidos:** ao receber “adicione uma função/card”, o agente deve partir desta seção, identificar o contrato mínimo, a implementação e o risco de regressão, e somente então editar os pontos necessários. A regra é permanente, mas **não garante por si só ausência de bugs** e não cria testes obrigatórios, automação, release ou atualização local.

## 6. Fluxo GitHub ↔ Windows
- Código alterado diretamente no GitHub por API; GitHub não atualiza automaticamente o Windows.
- **Sem GitHub Actions**, implantação automática, sincronização automática ou acesso implícito à instalação local.
- Atualização local por ZIP/PowerShell somente em operação manual autorizada.
- Manter, quando aplicável, **uma instalação/versão principal e um backup**; não apagar backups automaticamente.
- Criar um ponto de retorno antes de uma atualização local destrutiva; nunca descartar dados do usuário para corrigir instalação.

## 7. Entrega e release
- Relatório mínimo: arquivos alterados, branch, commit(s), riscos e validações executadas/não executadas.
- Merge `dev → main`, tags, publicação, deploy ou atualização local exigem autorização específica.
- O protocolo não afirma que uma mudança está pronta para produção sem revisão e evidências adequadas.

## 8. Documentos relacionados
- [AGENTS.md](../AGENTS.md): regras nativas do repositório e adendo PPC.
- [REGRESSION-PROTECTION.md](REGRESSION-PROTECTION.md): matriz de preservação e checklist opcional.
