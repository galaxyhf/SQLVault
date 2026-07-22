# SQLVault

SQLVault e uma aplicacao web para guardar, pesquisar, copiar e favoritar comandos SQL.

O projeto foi construido com Next.js, React, TypeScript, Drizzle ORM e Neon PostgreSQL.

## Funcionalidades

- Dashboard com total de comandos e contagem por tags.
- Biblioteca com busca por titulo ou trecho do SQL, sem diferenciar acentos, filtro por tag e paginacao.
- Cadastro, edicao e exclusao de comandos SQL.
- Visualizacao de SQL com numeracao de linhas e destaque simples de sintaxe.
- Botao para copiar SQL para a area de transferencia.
- Favoritos salvos no `localStorage` do navegador.
- Tema claro/escuro via `next-themes`.
- Identificacao local do criador e do ultimo editor de cada comando.
- Auditoria de criacoes, atualizacoes e exclusoes, protegida por senha administrativa.

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- Drizzle Kit
- Neon Serverless PostgreSQL
- Zod
- Lucide React
- Sonner

## Requisitos

- Node.js 20 ou superior.
- npm.
- Um banco PostgreSQL compativel com Neon para persistir dados.

Sem banco configurado, o app abre com listas vazias, mas criar, editar e excluir comandos nao funciona.

## Instalar o projeto

Clone ou abra a pasta do projeto e instale as dependencias:

```bash
npm install
```

Crie o arquivo de variaveis de ambiente:

```bash
cp .env.example .env
```

Edite `.env` e configure a URL do banco e a senha da auditoria:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
SQLVAULT_ADMIN_PASSWORD="use-uma-senha-forte"
```

`SQLVAULT_ADMIN_PASSWORD` e validada apenas no servidor. A auditoria nao cria sessao nem cookie: toda nova abertura de `/logs` solicita a senha novamente.

Para usar Neon:

1. Crie um projeto no Neon.
2. Copie a connection string do banco.
3. Cole a connection string em `DATABASE_URL`.
4. Mantenha `sslmode=require` na URL.

## Configurar o banco

O schema principal fica em `src/db/schema.ts`. A migration inicial gerada pelo Drizzle fica em `src/db/migrations/0000_needy_zzzax.sql`.

Depois de configurar `DATABASE_URL`, execute as migrations:

```bash
npm run db:migrate
```

O script `db:migrate` executa `src/db/migrate.ts`, que cria o schema de forma idempotente no Neon/PostgreSQL. Isso evita falhas silenciosas do `drizzle-kit migrate` com o driver WebSocket do Neon em alguns ambientes.

## Rodar em desenvolvimento

Inicie o servidor local:

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

A rota `/` redireciona automaticamente para `/dashboard`.

## Usar a aplicacao

### Dashboard

Acesse `/dashboard` para ver:

- total de comandos cadastrados;
- total de comandos com a tag Conferencia;
- total de comandos com a tag Conversao;
- total de comandos com a tag Geral;
- ultimos comandos cadastrados.

### Biblioteca

Acesse `/commands` para navegar pela biblioteca.

Na biblioteca voce pode:

- pesquisar por titulo ou trecho do SQL, sem diferenciar acentos;
- filtrar por `Todos`, `Conferencia`, `Conversao` ou `Geral`;
- abrir um comando;
- copiar o SQL;
- favoritar um comando;
- editar um comando;
- criar um novo comando.

### Criar comando

Acesse `/commands/new`, preencha:

- `Titulo`: minimo de 2 e maximo de 120 caracteres;
- `Tags`: selecione uma ou mais entre Conferencia, Conversao e Geral;
- `SQL`: minimo de 5 caracteres.

Depois clique em `Salvar`.

O campo `Seu nome` fica salvo somente no navegador para facilitar os proximos cadastros. Ao salvar, o nome e registrado no banco junto ao movimento de auditoria.

Importante: salvar exige `DATABASE_URL`. Sem banco configurado, o formulario mostra a mensagem para configurar o banco.

O botao `Importar arquivo` no dashboard aceita `.sql`, `.txt` e `.json`. Em arquivos SQL ou texto, use metadados opcionais no inicio:

```sql
-- title: Conferir pedidos duplicados
-- tags: conferencia, geral

SELECT * FROM pedidos;
```

No JSON, informe as tags como uma lista:

```json
{
  "title": "Converter datas",
  "tags": ["conversao", "geral"],
  "sqlCode": "SELECT CAST(created_at AS date) FROM pedidos;"
}
```

### Ver comando

Acesse `/commands/:id` para ver o comando completo.

Essa tela mostra:

- titulo;
- tags;
- SQL com numeracao de linhas;
- botao para copiar;
- botao para editar.

### Editar e excluir comando

Acesse `/commands/:id/edit` para atualizar titulo, banco ou SQL.

Nessa tela tambem ha a opcao de excluir o comando.

Para excluir, o SQLVault usa o mesmo nome informado no topo do formulario de edicao e preserva no log uma copia do comando removido.

Assim como a criacao, edicao e exclusao exigem `DATABASE_URL` configurada.

### Favoritos

Acesse `/favorites` para ver comandos favoritados.

Os favoritos sao armazenados apenas no navegador atual, usando `localStorage` com a chave `sqlvault:favorites`. Eles nao sao salvos no banco e nao sincronizam entre navegadores ou dispositivos.

### Auditoria

Acesse `/logs` e informe a senha definida em `SQLVAULT_ADMIN_PASSWORD`.

A tela mostra, do evento mais recente para o mais antigo:

- nome da pessoa que executou a acao;
- data e horario no fuso de Sao Paulo;
- criacao, atualizacao ou exclusao;
- titulo e identificador do comando;
- valores anteriores e novos de cada campo atualizado;
- copia dos dados de comandos criados ou excluidos.

A senha nao fica persistida. Recarregar a pagina, sair da rota ou abrir a auditoria novamente exige uma nova validacao.

Ao ativar a auditoria, os comandos ja existentes sao importados como registros iniciais. Alteracoes ou exclusoes ocorridas antes dessa ativacao nao podem ser reconstruidas retroativamente.

## Scripts disponiveis

```bash
npm run dev
```

Roda o Next.js em desenvolvimento com Turbopack.

```bash
npm run build
```

Gera a build de producao.

```bash
npm run start
```

Inicia a build de producao. Execute `npm run build` antes.

```bash
npm run lint
```

Executa o ESLint.

```bash
npm run db:generate
```

Gera novas migrations do Drizzle a partir de alteracoes em `src/db/schema.ts`.

```bash
npm run db:migrate
```

Cria ou atualiza o schema necessario no banco configurado em `DATABASE_URL`.

## Estrutura do projeto

```text
.
├── src
│   ├── actions
│   │   ├── audit.ts             # Validacao administrativa e leitura da auditoria
│   │   └── commands.ts          # Server Actions de criar, editar e excluir comandos
│   ├── app
│   │   ├── dashboard            # Dashboard
│   │   ├── commands             # Biblioteca, detalhe, criacao e edicao
│   │   ├── favorites            # Favoritos locais
│   │   ├── logs                 # Auditoria protegida por senha
│   │   ├── globals.css          # Estilos globais
│   │   └── layout.tsx           # Layout raiz
│   ├── components               # Componentes de UI e layout
│   ├── db
│   │   ├── index.ts             # Acesso ao banco
│   │   ├── migrate.ts           # Migration idempotente para Neon/PostgreSQL
│   │   ├── schema.ts            # Schema Drizzle
│   │   └── migrations           # Migrations SQL
│   ├── hooks                    # Hooks de cliente
│   └── lib                      # Utilitarios e validadores
├── drizzle.config.ts            # Configuracao do Drizzle Kit
├── package.json                 # Scripts e dependencias
├── tsconfig.json                # Configuracao TypeScript
└── components.json              # Configuracao shadcn/ui
```

## Modelo de dados

A tabela principal e `commands`.

Campos:

- `id`: UUID gerado automaticamente.
- `title`: titulo do comando.
- `tags`: lista com uma ou mais tags do enum `command_tag`.
- `sql_code`: conteudo SQL.
- `created_at`: data de criacao.
- `updated_at`: data da ultima atualizacao.

O enum `command_tag` aceita as classificacoes disponiveis:

```sql
CREATE TYPE "command_tag" AS ENUM ('conferencia', 'conversao', 'geral');
```

## Fluxo recomendado de desenvolvimento

1. Instale as dependencias com `npm install`.
2. Configure `.env` com `DATABASE_URL`.
3. Rode `npm run db:migrate`.
4. Inicie o app com `npm run dev`.
5. Antes de entregar alteracoes, rode:

```bash
npm run lint
npm run build
```

## Criar novas migrations

Quando alterar `src/db/schema.ts`, gere uma migration:

```bash
npm run db:generate
```

Revise o arquivo gerado em `src/db/migrations` e atualize `src/db/migrate.ts` se a mudanca exigir novos objetos no banco. Depois aplique no banco:

```bash
npm run db:migrate
```

## Deploy

Para publicar em uma plataforma como Vercel:

1. Configure o projeto na plataforma.
2. Adicione a variavel de ambiente `DATABASE_URL`.
3. Execute as migrations no banco de producao.
4. Use o comando de build padrao:

```bash
npm run build
```

Depois do deploy, acesse `/dashboard` para validar se a aplicacao consegue ler o banco.

## Solucao de problemas

### `DATABASE_URL is not configured.`

Crie o arquivo `.env` e configure `DATABASE_URL`.

```bash
cp .env.example .env
```

Depois reinicie o servidor de desenvolvimento.

### O app abre, mas nao salva comandos

Isso acontece quando `DATABASE_URL` nao esta configurada. Configure `DATABASE_URL`, aplique as migrations e reinicie o servidor.

### Erro ao executar migrations

Verifique se:

- `DATABASE_URL` esta correta;
- o banco esta acessivel;
- a URL inclui SSL quando necessario, por exemplo `sslmode=require`;
- o usuario tem permissao para criar tipos e tabelas.

### Favoritos sumiram

Favoritos ficam no `localStorage` do navegador. Eles podem sumir ao limpar dados do site, trocar de navegador ou acessar por outro dispositivo.

## Licenca

Este projeto nao declara uma licenca no repositorio.
