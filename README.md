# Improve Styles — Loja Online

Plataforma de e-commerce moderna construída com Next.js, Supabase e Tailwind CSS. Oferece vitrine de produtos, carrinho, checkout com cálculo de frete, cupons, wishlist, área do cliente e painel administrativo completo.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Banco de dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Ícones:** Lucide React
- **Mapas:** Leaflet / React Leaflet
- **Carrossel:** Embla Carousel
- **Drag & Drop:** dnd-kit
- **Componentes:** shadcn/ui

## Funcionalidades

### Vitrine (Loja Online)
- Página inicial com banners, categorias, ofertas e produtos em destaque
- Busca inteligente com sugestões (produtos, categorias, marcas)
- Filtros por categoria e ordenação (mais vendidos, novidades, menor/maior preço)
- Página de produto com galeria de imagens, variantes (cores e tamanhos), cálculo de frete e cupons
- Avaliações de clientes com estrelas e comentários
- Carrinho lateral (drawer) e página dedicada
- Checkout com endereço, escolha de entrega/retirada, cupom, parcelamento e revisão
- Compra direta (buy now)
- Wishlist (favoritos)

### Área do Cliente
- Dados pessoais e segurança
- Endereços com CEP automático e GPS
- Histórico de pedidos
- Favoritos

### Painel Administrativo
- Dashboard com métricas de vendas, pedidos, clientes e catálogo
- Gestão completa de produtos (CRUD, variantes, imagens, SEO)
- Categorias da loja
- Configurações da loja (aparência, navegação, tema)
- Configurações de entrega (zonas, valores, métodos)
- Cupons de desconto
- Gerenciamento de pedidos
- Base de clientes
- Equipe (staff)
- Marketing e banners
- Google Analytics

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Projeto Next.js configurado com Supabase

## Instalação

```bash
git clone https://github.com/seu-usuario/improve-styles.git
cd improve-styles
npm install
```

## Configuração do Supabase

1. Crie um projeto no Supabase
2. Execute as migrações SQL disponíveis em `supabase/`
3. Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service
```

## Rodando localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o linter |

## Estrutura do Projeto

```
src/
├── app/                    # Rotas (App Router)
│   ├── page.tsx            # Home / Catálogo
│   ├── checkout/           # Finalizar compra
│   ├── carrinho/           # Carrinho
│   ├── produto/[id]/       # Detalhe do produto
│   ├── loja/[slug]/        # Categoria
│   ├── login/              # Autenticação
│   ├── conta/              # Área do cliente
│   └── dashboard/          # Painel administrativo
├── components/
│   ├── store/              # Componentes da loja
│   ├── products/           # Gestão de produtos
│   ├── orders/             # Pedidos
│   ├── customers/          # Clientes
│   ├── custom/             # Cupons
│   ├── settings/           # Configurações
│   ├── shipping/           # Entrega
│   ├── auth/               # Autenticação
│   ├── layout/             # Layout
│   └── ui/                 # Componentes base (shadcn)
├── lib/                    # Lógica e utilitários
│   ├── store-copy.ts       # Central de copy comercial
│   ├── store-badges.ts     # Helpers de badges/selos
│   ├── storefront.ts       # Funções da vitrine
│   ├── products.ts         # Dados de produtos
│   ├── store-categories.ts # Categorias
│   ├── store-coupons.ts    # Cupons
│   ├── store-orders.ts     # Pedidos locais
│   ├── shipping.ts         # Cálculo de frete
│   └── store-settings.ts   # Configurações da loja
├── hooks/                  # Hooks customizados
└── utils/                  # Utilitários (Supabase clients)
```

## Observações

- O carrinho e wishlist são persistidos no `localStorage` do navegador e sincronizados com o perfil do cliente no Supabase quando autenticado.
- O checkout gera um pedido local (`store-orders`) acessível pelo navegador, além de enviar os dados ao Supabase.
- Os cupons podem ser do tipo percentual, valor fixo ou frete grátis, com regras de produto, categoria e valor mínimo.
- Os banners suportam imagem, link, título e ordenação.
- As categorias da loja são gerenciáveis pelo painel e aparecem na home e navegação.
- O cálculo de frete é baseado em zonas de CEP configuráveis no painel administrativo.
