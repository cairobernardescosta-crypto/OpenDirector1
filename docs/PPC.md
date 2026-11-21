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
