# Biblioteca Local: contrato de referências

## Objetivo

Definir o formato de dados que a Biblioteca Local poderá entregar aos nós conectados, sem converter cada arquivo em um nó independente do Canvas.

## Duas camadas

### Estado persistido do nó

O estado atual em `libraryNodeState.ts` continua sendo a fonte de verdade para:
- `collectionId`: identidade da coleção.
- `mode`: `dynamic` ou `fixed`.
- `itemIds`: IDs selecionados no modo fixo.
- `activeItemId` e `activeMediaKind`: compatibilidade com a ação individual de extração existente.

O marcador v1 permanece inalterado nesta fase para preservar documentos existentes.

### Lote de referências resolvidas

`libraryReferenceContract.ts` define `LibraryReferenceBatch`, uma projeção de execução criada a partir da resposta autoritativa de `resolveCollection()`.

O lote contém:
- versão do contrato;
- ID do nó de origem;
- ID e nome da coleção;
- modo de seleção;
- IDs solicitados, na ordem resolvida;
- referências tipadas, com ID original, revisão, nome, tipo e metadados;
- IDs indisponíveis, sem substituição silenciosa.

Cada referência é metadado e identidade. Não contém bytes, hash do blob, URL de preview ou URL de ativo do Canvas.

## Regras de resolução

1. O ID da coleção resolvida deve corresponder ao ID salvo no nó.
2. O modo fixo deve resolver exatamente os IDs persistidos e na mesma ordem.
3. O modo dinâmico utiliza a composição atual retornada pela coleção.
4. A ordem do lote segue `resolution.itemIds`, não a ordem incidental da resposta `items`.
5. Arquivos ausentes, removidos, em lixeira ou sem tipo de mídia válido são reportados como indisponíveis.
6. O lote não cria nós, não importa bytes e não altera a Biblioteca.
7. O consumidor posterior decide quando precisa apenas de referência e quando precisa importar uma cópia para edição.

## Fora desta fase

Este contrato ainda não conecta a Biblioteca ao Agent nem altera a política de conexões. Isso será feito nas fases seguintes, usando este formato como fronteira estável.
