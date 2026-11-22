# OpenDirector1 — biblioteca nativa com coleções (plano seguro)

## Escopo e princípio

Ampliar a biblioteca global existente para organizar fotos, vídeos e áudio/músicas por coleções. **Não criar uma segunda biblioteca, não mover/copiar blobs por coleção e não modificar o formato de `LibraryItem` ou `LibraryIndex`.** Manter projetos, backup de canvas, personagens, lixeira e importação funcionando.

Coleções são **pastas lógicas** (metadados de associação por ID), e não pastas físicas. Uma coleção pode ser removida sem eliminar nenhum arquivo. A biblioteca continua servindo os próprios bytes e validações. Não presumir que o sistema agora permite acesso irrestrito da IA a pastas do Windows.

## Fases de implementação

1. **Auditoria de dependências:** mapear consumidores da biblioteca, contratos de mídia, global index, lixeira, imports, ACL e testes.
2. **Coleções não destrutivas:** registrar nomes/IDs e associações num índice independente, compatível com biblioteca pré-existente. Impedir referências a arquivos ausentes ou na lixeira nas novas associações.
3. **Músicas na biblioteca:** reutilizar mídia `audio` e upload nativo, com inclusão nas coleções e sem nova cópia física. Separar arquivos licenciados de links de referência externa.
4. **Interface nativa:** expandir a aba Arquivos com seletor e operações de coleções usando os componentes existentes; manter Todos os arquivos, filtros, importação e lixeira.
5. **Novo nó Biblioteca local:** configurar acesso a coleção/itens com IDs estáveis. Não alterar a matriz de tipos/linhas existentes sem contrato e validação específicos.
6. **IA e seleção:** adicionar ferramenta nativa de consulta somente leitura por coleção; depois busca semântica por imagens/quadros de vídeo, com limites, autorização e evidência de visualização real.
7. **Integração e regressões:** preservar projetos antigos, consumo de referências, seleção, undo, importação, recuperação, permissões e semântica das linhas. Execução encadeada fica para fase separada com grafo de tarefas próprio.

## Pontos de integração

- API: `apps/api/src/opendirector_api/library.py`
- Regras atuais: `packages/core/src/opendirector/application/library.py`
- Índice original e blobs: `packages/core/src/opendirector/infrastructure/library_store.py`
- Coleções: `packages/core/src/opendirector/application/library_collections.py` — metadados independentes
- Cliente: `src/canvas/library/libraryClient.ts`
- Interface: `src/canvas/library/AssetsPanel.tsx`, `AssetLibraryDialog.tsx`
- Testes: `tests/test_library.py`

## Proteções e limites

- `/api/library/items`, uploads, trash, restores, imports, bytes e blobs **não devem mudar de contrato**.
- `GET/POST/PATCH/PUT/DELETE /api/library/collections` é uma adição; nenhuma rota antiga removida.
- `collections.json` é metadado separado. Exclusão de coleção não chama `Library.trash` nem `Library.purge`.
- Uma coleção pode guardar IDs de itens que mais tarde forem excluídos da biblioteca; consumidores devem ignorar IDs ausentes e não tentar restaurar bytes automaticamente.
- A inclusão de mídia já na lixeira deve ser recusada. A escolha de apagar arquivos por comandos da biblioteca **continua distinta** de remover o item de uma coleção.
- Não implementar busca por perfis do Instagram/TikTok, licenciamento de áudio, sincronização de batidas ou execução automática dos cards nesta etapa.
- Testes e validação local seguem a política PPC 3.0: **livres e mediante decisão do proprietário**; a presença do código/testes não equivale à confirmação de execução.

## Riscos em aberto

- Testar interface responsiva e acessibilidade das ações adicionais.
- Validar concorrência entre alterações de coleções e lixeira/remoção de arquivos.
- Avaliar eventual limitação de inclusão em lote, revisão otimista dos metadados e paginação para grandes bibliotecas.
- Acrescentar confirmação antes de apagar coleções e conveniência de renomear pela interface.
- Fazer verificação de execução de API e build antes da instalação Windows, quando autorizado.
