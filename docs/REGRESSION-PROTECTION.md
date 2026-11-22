# PPC 3.0 — Proteção contra regressões

## Princípio
Mudanças devem manter as capacidades já existentes do OpenDirector1; verificações são **orientações sob demanda**, não gates ou obrigação a cada correção. Preservar primeiro, modificar apenas o necessário e descrever honestamente o estado final.

## Matriz de riscos
| Área | Preservar | Verificação opcional quando solicitada |
| --- | --- | --- |
| Interface e navegação | Layout nativo, painéis, sidebar, atalhos, preferências, responsividade | Abrir telas afetadas, navegação e interações |
| Canvas, nós e conexões | Identidades, ligações, referências, criação/remoção, histórico | Criar, conectar, editar e reabrir projeto |
| Agentes e IA | Regras, modelos, parâmetros, chamadas reais, permissões, recibos | Executar cenário controlado sem cobranças inesperadas |
| Geração de texto/imagem/vídeo/áudio | Contratos, assets, tarefas e resultados adotados | Simular ou executar casos explicitamente autorizados |
| Timeline e edição | Clipes, camadas, sincronização, operações de edição | Abrir/editar timeline e revisar resultado |
| Persistência e dados | Projetos, versões, backups, migrações, arquivos e configurações | Abrir projeto existente sem perda de dados |
| APIs e integrações | Compatibilidade de payloads, erros, autenticação e provedores | Testar chamadas em ambiente seguro quando autorizado |
| Exportação e empacotamento | Formatos existentes, arquivos e fluxo de exportação | Exportar amostra e conferir integridade |
| Windows / instalação | Instalação principal, caminhos e backup | Validar instalação manualmente após ZIP |

## Antes de editar
- Localizar implementação e dependências reais; ler documentos de arquitetura pertinentes.
- Definir o comportamento que precisa permanecer intacto.
- Evitar remoções, renomeações públicas e mudanças de dados sem plano de compatibilidade.
- Distinguir falhas já existentes das introduzidas pela mudança.

## Regra de consistência e reutilização nativa

Antes de criar qualquer botão, fonte, card, elemento, efeito, motion, layout, hook, serviço, integração ou função adicional, identificar o equivalente existente e reutilizar seu componente, token, contrato ou serviço. Estender e compor recursos nativos antes de criar alternativas. Novos recursos só devem surgir quando não houver opção compatível e devem integrar a arquitetura, a identidade visual, a navegação e a lógica de negócio do OpenDirector1.

Evitar interfaces paralelas, funções duplicadas, estilos divergentes, ações inertes, simulações apresentadas como funcionais e desconexão entre UI, agente e backend. Preservar acessibilidade, internacionalização, dados e comportamento já implementado.

**Registro opcional de revisão:** indicar a origem do componente/serviço reutilizado ou a razão para uma nova implementação; isto não obriga a executar testes por correção nem cria gates automáticos.

## Matriz adicional — função nova de card / nó / conector

| Superfície | Invariantes que uma nova função não pode romper | Verificação opcional orientada por risco |
| --- | --- | --- |
| Catálogo e menu | Não remover nem liberar indevidamente tipos existentes; distinguir função de tipo de nó | Conferir criação no menu livre e após arrastar uma linha |
| Política de conexão | Preservar direção, compatibilidade, capacidade, origem vazia, duplicidade, locks e referência fixada | Matriz origem→destino, tentativa inválida e conexão múltipla |
| Operação atômica | Nenhum nó órfão ou aresta parcial quando lote falha | Criar nó conectado, rejeitar lote e desfazer/refazer |
| Persistência e identidade | Manter `CanvasNode`, `CanvasEdge`, IDs, links e documentos legados | Salvar, fechar, reabrir, copiar, importar e restaurar |
| Agente e execução | Não confundir referência com dependência; não perder resultados, recibos nem limites de gasto | Card isolado e cadeia explícita; recuperação e cancelamento |
| UI existente | Preservar renderização, ferramentas, foco, atalhos, arraste e temas | Navegação original e novas opções sem interferência |
| Idiomas | IDs intactos, nomes traduzidos nas apresentações existentes | `zh-CN`, `en-US`, `pt-BR` e fallback declarado |

**Referência permanente:** [PPC 3.0, § 5.2](PPC.md) contém o contrato e as sete fases de implementação. Novas funcionalidades dos cards devem seguir essa seção, em vez de alterar somente `creationTools.ts` ou contornar `connectionPolicy.ts`.

## Durante a edição
- Usar componentes/serviços nativos; manter alterações restritas ao pedido.
- Evitar duplicar regras de negócio entre interface e agente.
- Proteger histórico, identificadores, dados salvos e operações de longa duração.
- Não desativar funcionalidades para passar em validação ou esconder defeitos.

## Antes de entregar (registro, não bloqueio)
- Informar arquivos alterados, branch e commit.
- Documentar riscos e possíveis impactos.
- Declarar explicitamente quais verificações foram executadas e quais **não foram executadas**.
- Sugerir uma verificação manual quando útil, sem torná-la obrigatória.
- Não realizar merge para `main`, release, deploy ou atualização local sem autorização.

## Recuperação
- Reverter preferencialmente por novo commit que desfaça uma alteração específica, preservando histórico.
- Usar versão principal + backup na instalação local quando houver atualização manual.
- Jamais executar `reset --hard`, push forçado, exclusão de diretórios de usuário, limpeza de backups ou migração destrutiva sem autorização explícita e avaliação do risco.

## Política de testes
**Validação livre**: o proprietário escolhe quando testar. Ausência de teste não implica aprovação ou reprovação; apenas registrar `não executado`. Não instalar GitHub Actions, CI obrigatório ou pré-requisitos automáticos de teste.
