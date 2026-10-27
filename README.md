# Food Tech — Aplicativo Mobile (PIM IV · Etapa 5)

Aplicativo de pedidos da hamburgueria, feito com **React Native + Expo (TypeScript)**.
Funcionalidades: login/cadastro, Home com busca e promoções, cardápio com filtros, personalização do
produto, carrinho, checkout (entrega ou retirada), acompanhamento do pedido, histórico, endereços e favoritos.

> Identidade visual em azul e branco, a partir do logotipo em `assets/logo.png`; o amarelo do pão aparece só em
> destaques de promoção. Nome e autor ficam em `NOME_LOJA` e `AUTOR`, em `src/config.ts`.

## Como rodar no seu iPhone (Expo Go)

Pré-requisitos: Node.js instalado e o app **Expo Go** no celular (celular e computador na mesma rede Wi-Fi).

```bash
# 1. crie um projeto Expo em branco com TypeScript
npx create-expo-app@latest food-tech --template blank-typescript
cd food-tech

# 2. instale as dependências (o "expo install" escolhe as versões compatíveis com o seu Expo)
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage expo-secure-store expo-status-bar @expo/vector-icons

# 3. copie para dentro do projeto: App.tsx (substituindo o existente), a pasta src/ e a pasta assets/ (logotipo e imagens dos produtos)

# 4. inicie
npx expo start
```

Leia o QR Code com a câmera do iPhone (abre no Expo Go). Não é preciso instalar nenhuma biblioteca de
animação, de fontes ou de ícones além das listadas: tudo usa recursos que já vêm com o Expo.

## Roteiro de demonstração (modo simulado, sem backend)

1. A tela de login já vem preenchida com a conta de teste (`demo@foodtech.com` / `123456`). Toque em **Entrar**.
2. Na **Home**, use a busca, os banners de oferta, as categorias, **Os mais pedidos** e **Ofertas especiais**. O **+** adiciona direto ao carrinho.
3. No **Cardápio**, filtre por categoria, promoções ou vegetarianos, ordene por preço e abra um item.
4. No **detalhe do produto**, retire ingredientes, escolha tamanho, marque adicionais e escreva observações; o preço do botão muda na hora.
5. No **Carrinho**, edite, remova ou ajuste quantidades. A barra mostra quanto falta para o frete grátis.
6. No **Checkout**, escolha entrega ou retirada, cadastre ou selecione o endereço, escolha o pagamento (simulado) e **Confirmar pedido**.
7. O **Acompanhamento** mostra a linha do tempo em 5 etapas e atualiza sozinho. No modo simulado o pedido avança em segundos: recebido → confirmado (10 s) → em preparação (25 s) → saiu para entrega ou pronto para retirada (55 s) → concluído (100 s). Há um aviso na tela dizendo que é demonstração.
8. **Sincronização offline:** em **Perfil**, ative "Simular sem internet", faça um pedido (ele fica "Aguardando conexão"), desative a simulação e aguarde até 15 s: o app envia o pedido sozinho.

## Conectando à API real (.NET) da Etapa 4

Em `src/config.ts`:

```ts
USAR_MOCK: false,
API_URL: 'http://SEU_IP_NA_REDE:5000',   // não use "localhost": no celular ele aponta para o próprio celular
```

Contrato esperado (JSON). Os nomes dos campos seguem `src/types.ts`.

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, senha }` | `{ token, expiraEm, usuario: { id, nome, email } }` |
| POST | `/api/auth/registro` | `{ nome, email, senha }` | igual ao login |
| GET | `/api/produtos` | — | `Produto[]` |
| POST | `/api/pedidos` | `NovoPedido` (abaixo) | `Pedido` |
| GET | `/api/pedidos` | — | `Pedido[]` (só do usuário autenticado) |
| GET | `/api/pedidos/{id}` | — | `Pedido` |

**Produto** — além de `id, nome, descricao, preco, categoria, disponivel`, a API pode enviar (todos opcionais):
`precoPromocional`, `imagemUrl`, `ingredientes: string[]`, `adicionais: [{ id, nome, preco }]`,
`tamanhos: [{ id, nome, acrescimo }]` (o primeiro é o padrão), `maisPedido`, `vegetariano`.
Sem `imagemUrl`, o app usa a imagem embarcada indicada em `imagem`.

**NovoPedido** — `{ chaveIdempotencia, modalidade: "Entrega" | "Retirada", itens: [{ produtoId, quantidade, observacao, tamanhoId?, adicionaisIds[], ingredientesRemovidos[] }], enderecoEntrega, formaPagamento: "Pix" | "Cartao" | "Dinheiro" }`.
Na retirada, `enderecoEntrega` vai vazio.

**Pedido** — `{ id, criadoEm, status, modalidade, itens[], subtotal, desconto, taxaEntrega, total, enderecoEntrega, formaPagamento, previsaoEntregaMin, historico: [{ status, em }] }`.
Cada item traz `produtoId, nome, precoUnitario, quantidade, observacao, tamanhoId, adicionaisIds, ingredientesRemovidos` e `detalhes: string[]` (linhas prontas, como "+ Bacon extra").

Regras que a API precisa seguir:

- Rotas de pedidos exigem o cabeçalho `Authorization: Bearer <token>`; token inválido ou expirado → **401**.
- O servidor **recalcula preços, promoções, adicionais, taxa e total** (o app só exibe uma estimativa). `subtotal` é a soma a preço de tabela e `desconto` a economia das promoções.
- `chaveIdempotencia`: se chegar a mesma chave duas vezes, devolver o pedido já criado em vez de criar outro.
- Erros de validação → **400** com `{ "mensagem": "texto para o usuário" }`.
- Status possíveis: `Recebido`, `Confirmado`, `EmPreparo`, `SaiuParaEntrega` (só entrega), `ProntoParaRetirada` (só retirada), `Entregue`, `Cancelado`.
- Habilitar **CORS** só é necessário se for testar o app no navegador (modo web).

> **Atenção ao grupo:** os campos `modalidade`, `desconto`, os adicionais/tamanhos e os status `Confirmado` e
> `ProntoParaRetirada` são novos em relação à primeira versão do contrato. Combine com quem fez a API da Etapa 4
> antes de desligar o modo simulado. O app aceita respostas antigas (sem esses campos) sem quebrar.

## Estrutura

```
App.tsx                      ponto de entrada (provedores + navegação)
src/config.ts                modo simulado/real, URL da API, intervalos, taxa e frete grátis (só estimativa)
assets/logo.png              logotipo Food Tech (fundo transparente)
assets/produtos/             imagens dos produtos (ilustrações originais; troque por fotos com o mesmo nome)
src/theme.ts                 design system: cores, escala tipográfica, espaçamentos, raios, sombras
src/types.ts                 modelos (Produto, Pedido, Personalizacao, Endereco...)
src/domain/                  regras de negócio puras e testáveis: preço, promoção, frete, "pedir de novo"
src/navigation/              pilhas e abas (Início | Cardápio | Pedidos | Perfil; fluxo sem login x logado)
src/screens/                 Login, Registro, Home, Cardápio, Produto, Carrinho, Checkout, Acompanhamento,
                             Pedidos, Perfil, Endereços, Endereço (formulário), Favoritos
src/components/              Ícone, PressableScale, Skeleton, Toast, AnimacaoSucesso, cards de produto, botões e campos
src/context/                 Auth, Carrinho, Endereços, Favoritos, Sincronização (fila offline)
src/hooks/useCardapio.ts     carrega o cardápio (cache + atualização)
src/services/apiHttp.ts      cliente REST real (fetch + JWT + timeout)
src/services/apiMock.ts      API simulada com a mesma interface
src/services/sincronizacao.ts cache de leitura + fila de envio offline
src/services/armazenamento.ts token no SecureStore; demais dados no AsyncStorage
tests/                       testes de serviços (API simulada, fila offline) e de domínio (preços, frete, carrinho)
```

## Decisões de projeto

- **Uma única fonte de regras de preço** (`src/domain/preco.ts`), usada pelo app e pela API simulada, para o valor do botão, do carrinho e do pedido nunca divergirem.
- **Sem bibliotecas extras de UI:** ícones Ionicons (já incluídos no Expo), animações com `Animated` do React Native e fonte do sistema (SF Pro no iPhone, Roboto no Android).
- **Imagens:** são ilustrações originais, geradas para o projeto (sem direitos de terceiros). Para usar fotos autorizadas do estabelecimento, substitua os arquivos de `assets/produtos/` mantendo os nomes, ou envie `imagemUrl` pela API.
- **Pagamento simulado:** o app não processa cobrança; a forma escolhida é só registrada no pedido, e a tela avisa isso.
- **Acompanhamento:** na API real o status vem do estabelecimento; no modo simulado ele avança sozinho e a tela identifica isso como demonstração. Não há rastreamento em mapa.
- **Pedido sem internet:** vai para uma fila com chave de idempotência e é enviado depois, sem duplicar.
- **Proteção contra clique duplo** no "Confirmar pedido" (trava imediata, antes mesmo da re-renderização).

## O que foi testado

- **Automatizado (Node):** API simulada, cache, fila offline, idempotência, validações 4xx, erro 401, preços com promoção, tamanhos e adicionais, frete grátis, retirada sem taxa, "pedir de novo" e utilitários de formatação.
- **Visual/fluxo (navegador):** o app inteiro foi executado em uma prévia web (mesmo código, com a API simulada) em 390×844, percorrendo login, cadastro, Home, busca, filtros, produto, carrinho (editar/remover/vazio), checkout, acompanhamento, pedidos, perfil, favoritos e o ciclo offline → sincronização, sem erros no console.
- **Ainda precisa ser feito por você:** rodar no **Expo Go** (iPhone/Android) para conferir toque, teclado, área segura, rolagem e desempenho reais. A prévia web é uma aproximação, não substitui o aparelho.
