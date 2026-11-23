# Fase 6 — Biblioteca local: contrato de implementação segura

## Estado (2026-11-22)

**Parte 6A implementada na branch dev:** resolução de referências de coleções para um futuro nó nativo. O novo tipo de nó **ainda não foi registrado ou exposto no canvas**: apresentar esse card apenas no React sem suporte dos contratos Python quebraria a persistência ao reabrir o projeto.

## Implementado

- `LibraryCollections.resolve`: snapshot apenas para leitura, por identificadores estáveis; mantém a ordem e relata IDs indisponíveis sem substituir arquivos.
- `GET /api/library/collections/{collection_id}/resolve`: referência dinâmica de todos os itens associados.
- `POST /api/library/collections/{collection_id}/resolve` com `{ "itemIds": [...] }`: subconjunto fixo; rejeita IDs que não pertencem à coleção.
- Cliente TypeScript tipado `resolveCollection(id, fixedItemIds?)`.
- Testes em `tests/test_library.py`: coleção válida, arquivos removidos, seleção fixa, IDs estranhos e ausência de efeito colateral.

## Pendências para concluir a Fase 6

1. **Contrato persistente:** criar `LibraryCanvasItem` (com `collectionId`, modo `fixed|dynamic`, `itemIds`) na camada Python `domain/creation/canvas.py`, e atualizar em conjunto criação, comandos, projeção e schemas gerados. Não apenas adicionar o tipo no React.
2. **Modelo do canvas:** introduzir o tipo correspondente em `CanvasNodeKind`, `dataBoundary`, operações, cópia, undo/redo, importação/exportação, numeração de títulos e layout, mantendo os nós antigos intactos.
3. **Nó nativo:** novo componente sob `NodeFrame`; seleção de coleção, escolha de mídia, filtros, prévias, modos fixo/dinâmico e avisos sobre itens indisponíveis.
4. **Conexões seguras:** referências devem ser resolvidas em ativos **individuais** e compatíveis (imagem/vídeo/áudio/texto). Uma coleção nunca deve ser reinterpretada como uma única imagem ou um link de mídia; respeitar `connectionPolicy`, capacidade do destino e autorização de acesso. Fase 7 controlará fornecimento ao Gemini.
5. **Proteções:** bloqueio, duplicação, remoção do nó sem remover mídia, permissões, tamanho máximo, coleção excluída e alterações concorrentes.

## Portões de regressão antes de atualizar o Windows

- `npm run check:i18n`, `npm test`, `npm run build`
- `python -m pytest -q tests/test_library.py tests/test_creation_canvas_service.py`
- Testes de round-trip de criação/salvamento/reabertura do nó, cópia, exclusão, restauração, conexões e importação/exportação de canvas.
- Validar o Gemini e seus modelos/credenciais existentes **sem alterar valores ou imprimir segredos**.
- Somente mesclar/atualizar local após testes satisfatórios e autorização do usuário para atualização local.

**Dados:** preservar `D:\\OpenDirector1-Dados`, biblioteca original e .venv. Branch de desenvolvimento `dev`; não modificar `main`.
