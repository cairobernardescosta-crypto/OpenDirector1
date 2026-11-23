# Fase 6 — Biblioteca local: contrato de implementação segura

## Estado (2026-11-22) — 6B em validação

**Parte 6A e interface 6B implementadas na branch dev:** resolução de referências e card visual **Biblioteca local** disponível no menu de novos nós e na barra lateral. Para preservar os contratos Python nativos, o estado versionado da coleção é armazenado por um **nó de texto nativo especializado**, não por um novo `CanvasKind` no backend. A interface o renderiza como card de biblioteca. Essa compatibilidade deve ser mantida até uma futura migração de esquema completa.

As referências de mídia para geração/IA **ainda não são conectáveis diretamente**. O conteúdo serializado é intencionalmente bloqueado nas conexões para que nunca seja enviado como prompt, imagem ou vídeo indevido. A integração executável com outros nós permanece pendente.

## Implementado

- `LibraryCollections.resolve`: snapshot apenas para leitura, por identificadores estáveis; mantém a ordem e relata IDs indisponíveis sem substituir arquivos.
- `GET /api/library/collections/{collection_id}/resolve`: referência dinâmica de todos os itens associados.
- `POST /api/library/collections/{collection_id}/resolve` com `{ "itemIds": [...] }`: subconjunto fixo; rejeita IDs que não pertencem à coleção.
- Cliente TypeScript tipado `resolveCollection(id, fixedItemIds?)`.
- Testes em `tests/test_library.py`: coleção válida, arquivos removidos, seleção fixa, IDs estranhos e ausência de efeito colateral.

## Implementação visual 6B no GitHub

- Card `LocalLibraryNode` no `NodeFrame`, criação pelo menu e barra de ferramentas, coleção selecionável, modo fixo/dinâmico, miniaturas autenticadas, pesquisa, filtro e atualização manual.
- Estado `opendirector:local-library:v1:` com parser rigoroso; salvamento no contrato de texto já suportado pelo backend.
- Restrição de conexões do card enquanto os ativos não puderem ser transmitidos individualmente aos nós nativos.
- Testes de serialização e isolamento em `tests/localLibraryNode.test.ts`.

## Pendências para concluir a Fase 6

1. **Contrato persistente:** criar `LibraryCanvasItem` (com `collectionId`, modo `fixed|dynamic`, `itemIds`) na camada Python `domain/creation/canvas.py`, e atualizar em conjunto criação, comandos, projeção e schemas gerados. Não apenas adicionar o tipo no React.
2. **Modelo do canvas:** introduzir o tipo correspondente em `CanvasNodeKind`, `dataBoundary`, operações, cópia, undo/redo, importação/exportação, numeração de títulos e layout, mantendo os nós antigos intactos.
3. **Validação do nó visual:** compilar, testar e abrir localmente para confirmar seleção de coleção, escolha de mídia, filtros, prévias, modos fixo/dinâmico, reinicialização e avisos sobre itens indisponíveis.
4. **Conexões seguras:** referências devem ser resolvidas em ativos **individuais** e compatíveis (imagem/vídeo/áudio/texto). Uma coleção nunca deve ser reinterpretada como uma única imagem ou um link de mídia; respeitar `connectionPolicy`, capacidade do destino e autorização de acesso. Fase 7 controlará fornecimento ao Gemini.
5. **Proteções:** bloqueio, duplicação, remoção do nó sem remover mídia, permissões, tamanho máximo, coleção excluída e alterações concorrentes.

## Fase 6.1 — correções de interface, gesto e origem de mídia

Na branch `dev`, foram adicionadas as seguintes correções (ainda **não validadas no Windows**):

- Retirado `nodrag nopan` do contêiner inteiro do card. Controles interativos mantêm seus cliques, e o restante da superfície volta a participar do arraste padrão do canvas.
- A origem Biblioteca local participa dos gestos nativos de conexão e mostra a seta de saída; o menu ao puxar para o canvas oferece os tipos de mídia compatíveis com a seleção.
- Arquivos são selecionados explicitamente pelo usuário no card. `activeItemId` e `activeMediaKind` são preservados no manifesto versionado; os ativos reais são sempre verificados novamente pelo backend.
- O botão de extração e o menu de arrastar importam mídias como nós nativos independentes por meio de `insertLibraryItems`, preservando bytes e controle de tipo do projeto.
- Ao arrastar até um nó de geração compatível, um nó de mídia nativo é importado e **a conexão real é criada do nó de mídia para o destino** após validação de `referenceIssue`. Não existe conexão fictícia do manifesto da coleção para um gerador.
- `mergeImportedLibraryMedia` preserva a nova conexão após persistência, sem restaurar conexões para destinos removidos e sem criar arestas para o manifesto.
- Ocultei o indicador de versões do nó de texto que se sobrepunha ao seletor do card de biblioteca, e melhorei largura, miniaturas e rolagem sem alterar os demais tipos de card.
- Novos testes de referência, serialização, extração e merge em `tests/localLibraryNode.test.ts` e `tests/localLibraryImportMerge.test.ts`.

**Limite consciente:** a coleção permanece implementada como um card especializado sobre o contrato nativo de nó de texto, e não como um novo `CanvasKind` Python. O transporte das mídias funciona criando um nó nativo de imagem/vídeo/áudio/arquivo; conectar diretamente vários arquivos da coleção a uma única porta sem nós intermediários permanece pendente de uma migração de esquema mais profunda.

## Fase 6.2 — correções do print de 22/11/2026

- Removido o teto de `max-height: 250px` do conteúdo. O card acompanha a altura redimensionável e permite rolagem vertical de toda a grade, inclusive nomes e controles sob as miniaturas.
- Miniaturas `object-fit: contain` para mostrar a imagem inteira, com grade responsiva e área escura para enquadramento.
- Seleção de arquivo mostra botão para abrir imagem/vídeo/áudio em modal amplo, com leitura autenticada e `Escape` para sair. O modal é renderizado no `document.body`, fora do recorte do canvas.
- Menu nativo de criação através de fio agora oferece **Biblioteca local**, mesmo quando `allowedKinds` restringe o menu. Ela é criada no ponto de soltura como nó de referência, sem forjar uma aresta inválida para/da configuração da coleção.
- O vínculo efetivo com geradores continua pela extração/seleção de um arquivo individual para um nó nativo e conexão validada: a coleção não é mídia e não deve entrar como texto em prompts.

**Verificação pendente:** executar testes, `npm run check:i18n`, `npm run build`, Python e inspeção visual local. Nada foi instalado no Windows por esta alteração.

## Portões de regressão antes de atualizar o Windows

- `npm run check:i18n`, `npm test`, `npm run build`
- `python -m pytest -q tests/test_library.py tests/test_creation_canvas_service.py`
- Testes de round-trip de criação/salvamento/reabertura do nó, cópia, exclusão, restauração, conexões e importação/exportação de canvas.
- Validar o Gemini e seus modelos/credenciais existentes **sem alterar valores ou imprimir segredos**.
- Somente mesclar/atualizar local após testes satisfatórios e autorização do usuário para atualização local.

**Dados:** preservar `D:\\OpenDirector1-Dados`, biblioteca original e .venv. Branch de desenvolvimento `dev`; não modificar `main`.
