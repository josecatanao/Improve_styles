// Central de copy comercial da loja — textos padronizados para toda a aplicação

export const STORE_COPY = {
  // ── Carrinho ──────────────────────────────────────────────
  cartEmptyTitle: 'Seu carrinho está vazio',
  cartEmptyHelper: 'Adicione produtos para continuar a compra.',
  continueShopping: 'Continuar comprando',
  finalizePurchase: 'Finalizar compra',
  backToStore: 'Voltar para a loja',
  viewCart: 'Ver carrinho completo',
  editCart: 'Editar carrinho',

  // ── Checkout ──────────────────────────────────────────────
  checkoutTitle: 'Finalizar compra',
  checkoutSubtitle: 'Revise os itens e informe os dados do pedido.',
  checkoutStepForm: 'Dados do pedido',
  checkoutStepReview: 'Revisar pedido',
  checkoutFillData: 'Preencha seus dados para continuar com a compra.',
  continueToReview: 'Continuar para revisão',
  goBack: 'Voltar',
  confirmOrder: 'Confirmar pedido',
  confirmOrderBody:
    'Deseja realmente finalizar este pedido? Após a confirmação, o pedido será registrado e o carrinho liberado para uma nova compra.',
  finalizeOrder: 'Finalizar pedido',
  reviewBeforeConfirm: 'Confira os dados antes de finalizar.',
  orderConfirmed: 'Compra realizada com sucesso!',
  orderConfirmedDesc:
    'Sua solicitação já foi enviada para a loja. Em breve você poderá acompanhar o status do pedido.',
  orderIdLabel: 'Pedido',
  viewMyOrder: 'Ver meu pedido',
  noItemsToCheckout: 'Não há itens para finalizar.',
  pickupLocation: 'Local de retirada',
  saving: 'Salvando...',
  confirm: 'Confirmar',
  cancel: 'Cancelar',

  // ── Entrega ───────────────────────────────────────────────
  deliveryMethod: 'Método de entrega',
  deliveryLabel: 'Entrega',
  pickupLabel: 'Retirada na loja',
  deliveryAddress: 'Endereço de entrega',
  selectedAddress: 'Endereço selecionado',
  useSelectedAddress: 'Usar endereço selecionado',
  useMyAddress: 'Usar meu endereço',
  otherCep: 'Outro CEP',
  enterDeliveryCep: 'Informe o CEP de entrega',
  noAddressRegistered: 'Nenhum endereço cadastrado',
  noAddressToDeliver: 'Para calcular o frete e concluir a entrega, cadastre um endereço.',
  registerAddress: 'Cadastrar endereço',
  deliverTo: 'Entregar em',
  deliveryZipNotFound:
    'CEP não encontrado nas zonas de entrega disponíveis.',
  deliveryZipNotFoundCalc:
    'CEP não encontrado para cálculo de frete.',
  shippingFree: 'Frete grátis',
  shippingCalculating: 'Calculando frete...',
  shippingLabel: 'Frete',
  shippingNotCalculated: 'Não calculado',
  estimatedDays: (days: number) => `Até ${days} dias úteis`,

  // ── Cupom ─────────────────────────────────────────────────
  couponLabel: 'Cupom de desconto (Opcional)',
  couponPlaceholder: 'Ex.: BOASVINDAS20',
  applyCoupon: 'Aplicar cupom',
  removeCoupon: 'Remover cupom',
  couponInvalid: 'Cupom inválido.',
  couponNotEligible: 'Nenhum produto no carrinho é elegível para este cupom.',
  couponMinOrderNotMet:
    'O carrinho ainda não atende ao valor mínimo para este cupom.',
  couponValidateError: 'Erro ao validar cupom.',
  couponApplied: 'Cupom aplicado',
  couponAppliedDesc: (code: string) => `Desconto de ${code} aplicado.`,
  couponNotEligibleProduct: 'Este cupom não se aplica a este produto.',
  couponMinOrderNotMetProduct:
    'Este cupom ainda não atende ao valor mínimo para este produto.',

  // ── Pagamento ─────────────────────────────────────────────
  paymentMethod: 'Forma de pagamento',
  paymentPix: 'Pix',
  paymentCreditCard: 'Cartão de Crédito',
  paymentCash: 'Dinheiro',
  paymentCardOnDelivery: 'Cartão na Entrega',
  installmentsLabel: 'Parcelamento',
  installmentOption: (num: number, value: string) =>
    `${num}x de ${value}${num === 1 ? ' sem juros' : ''}`,

  // ── Dados do cliente ──────────────────────────────────────
  nameLabel: 'Nome (Associado à conta)',
  phoneLabel: 'Telefone / WhatsApp',
  nameNotInformed: 'Nome ainda não informado',
  phoneNotInformed: 'Telefone ainda não informado',
  editProfile: 'editar',
  observation: 'Observação (Opcional)',
  fieldRequiredName: 'Informe seu nome para continuar.',
  fieldRequiredPhone: 'Informe seu telefone/WhatsApp para continuar.',
  fieldCepDigits: 'CEP deve ter 8 dígitos.',
  noAddressForDelivery:
    'Nenhum endereço cadastrado. Cadastre um endereço para continuar com a entrega.',

  // ── Produto ───────────────────────────────────────────────
  addToCart: 'Adicionar ao carrinho',
  buyNow: 'Comprar agora',
  loginToBuy: 'Entrar para comprar',
  addedToCart: 'Adicionado!',
  login: 'Fazer login',
  share: 'Compartilhar',
  shared: 'Compartilhado',
  linkCopied: 'Link copiado',
  productUnavailable: 'Produto indisponível',
  productDescription: 'Descrição do produto',
  productSpecs: 'Especificações técnicas',
  relatedProducts: 'Produtos relacionados',
  relatedProductsDesc: 'Mais opções da mesma categoria ou marca.',
  noRelatedProducts: 'Ainda não há produtos relacionados publicados.',
  selectColor: 'Cor do produto:',
  selectSize: 'Tamanho do produto:',
  defaultOption: 'Padrão',
  quantity: 'Quantidade',
  calculateShipping: 'Calcular frete',
  cepPlaceholder: 'Digite seu CEP',
  couponInputPlaceholder: 'Digite o código',
  discountLabel: (pct: number) => `-${pct}%`,
  fromPrice: 'De:',
  priceWithCoupon: (code: string) => `Preço com cupom ${code}`,
  lowStockAlert: (n: number) =>
    n === 1
      ? 'Apenas 1 unidade em estoque! Garanta a sua.'
      : `Apenas ${n} unidades em estoque! Garanta o seu.`,

  // ── Badges / Selos comerciais ─────────────────────────────
  badgePromo: '🔥 Oferta',
  badgeDiscount: (pct: number) => `🔥 -${pct}%`,
  badgeNew: '✨ Novo',
  badgeBestSeller: '⭐ Mais vendido',
  badgeLastUnits: '🔥 Últimas unidades',
  badgeUnavailable: 'Indisponível',

  // ── Estoque ───────────────────────────────────────────────
  stockInStock: 'Em estoque',
  stockOutOfStock: 'Indisponível',
  stockLastUnits: (n: number) => `🔥 Últimas ${n} unidades`,
  stockAvailable: (n: number) => `${n} unidade(s) disponíveis`,
  stockUnavailable: 'Indisponível',

  // ── Busca ─────────────────────────────────────────────────
  searchPlaceholder: 'O que você está procurando?',
  searchNoResults: 'Nenhum produto encontrado.',
  searchNoResultsHelper:
    'Tente buscar por outro termo ou navegue pelas categorias.',
  searchRecentSearches: 'Pesquisas recentes',
  searchButtonLabel: 'Buscar produtos',

  // ── Seções da home ────────────────────────────────────────
  sectionOffers: '🔥 Ofertas Especiais',
  sectionFeatured: '⭐ Produtos em Destaque',
  sectionNewArrivals: '✨ Novidades',
  sectionBestSellers: '⭐ Mais vendidos',
  sectionCategories: '🛍️ Categorias',
  sectionPromotions: '🔥 Promoções',
  sectionCatalog: 'Catálogo',
  sectionSearching: 'Buscar na loja',

  // ── Navegação ─────────────────────────────────────────────
  navHome: 'Início',
  navPromotions: '🔥 Promoções',
  navNewArrivals: 'Novidades',
  navBestSellers: 'Mais vendidos',
  navAllCategories: 'Todas as categorias',
  navCategories: 'Categorias',
  navQuickNav: 'Navegação rápida',
  navSeeAll: 'Ver todas as categorias',

  // ── WhatsApp ──────────────────────────────────────────────
  whatsappLabel: 'WhatsApp da loja',
  whatsappBuy: 'Comprar pelo WhatsApp',
  whatsappContact: 'Falar com a loja no WhatsApp',
  whatsappSupport: 'Atendimento',

  // ── Favoritos ─────────────────────────────────────────────
  wishlistEmpty: 'Nenhum favorito ainda',
  wishlistEmptyDesc:
    'Salve produtos que você gostou para encontrá-los depois.',
  exploreProducts: 'Explorar produtos',
  productSaved: 'produto salvo',
  productsSaved: 'produtos salvos',
  addToWishlist: 'Adicionar aos favoritos',
  removeFromWishlist: 'Remover dos favoritos',
  wishlistLoading: 'Carregando favoritos...',

  // ── Avaliações ────────────────────────────────────────────
  reviewsTitle: 'Avaliações de Clientes',
  reviewsSubtitle: 'O que as pessoas estão achando deste produto.',
  reviewsEmpty: 'Ainda não há avaliações para este produto.',
  reviewsBeFirst: 'Seja o primeiro a avaliar!',
  leaveReview: 'Deixe sua avaliação',
  yourRating: 'Sua nota',
  yourComment: 'Seu comentário (opcional)',
  commentPlaceholder: 'Conte para outros clientes o que achou do produto...',
  submitReview: 'Enviar Avaliação',
  reviewSuccess: 'Avaliação enviada com sucesso! Obrigado.',
  reviewError: 'Falha ao enviar avaliação.',
  reviewMustLogin:
    'Você precisa estar logado para avaliar nossos produtos.',
  reviewSelectStars: 'Selecione uma nota de 1 a 5 estrelas.',
  anonymousCustomer: 'Cliente Anônimo',
  reviewCount: (n: number) => (n === 1 ? 'avaliação' : 'avaliações'),

  // ── Endereços ─────────────────────────────────────────────
  addressesTitle: 'Meus endereços',
  addressesDesc:
    'Gerencie seus endereços para facilitar o checkout e a entrega dos seus pedidos.',
  addNewAddress: 'Adicionar novo endereço',
  newAddress: 'Novo endereço',
  newAddressDesc: 'Preencha as informações do novo endereço.',
  saveAddress: 'Salvar endereço',
  addressSaved: 'Endereço salvo com sucesso.',
  addressDeleted: 'Endereço excluído com sucesso.',
  addressSaveError: 'Não foi possível salvar o endereço.',
  addressDeleteError: 'Não foi possível excluir o endereço.',
  addressPrimaryError:
    'Não foi possível definir endereço principal.',
  addressPrimary: 'Principal',
  setAsPrimary: 'Definir como principal',
  delete: 'Excluir',
  gpsLocation: 'Localização GPS (opcional)',
  gpsLocationCaptured: 'Localização capturada',
  gpsLocationHint: 'Use o GPS para marcar o ponto exato da entrega.',
  gpsLocationSuccess:
    'Localização capturada com sucesso. Agora revise os dados e salve.',
  gpsLocationError: 'Não foi possível capturar sua localização.',
  gpsNotSupported:
    'Geolocalização não suportada neste navegador.',
  gpsNotCaptured: 'Sem localização GPS',
  gpsNotCapturedYet: 'Ainda não capturada',
  sessionExpired: 'Sessão expirada. Entre novamente.',
  cepLookingUp: 'Buscando...',
  cepFound: 'Endereço encontrado',

  // ── CEP / endereço (campos) ───────────────────────────────
  fieldCep: 'CEP',
  fieldStreet: 'Rua / Avenida',
  fieldNumber: 'Número',
  fieldComplement: 'Complemento',
  fieldNeighborhood: 'Bairro',
  fieldCity: 'Cidade',
  fieldState: 'Estado',
  fieldReference: 'Referência (opcional)',

  // ── Catálogo / setup ──────────────────────────────────────
  catalogReady: 'A loja está pronta para receber o catálogo.',
  catalogConfigure:
    'Configure os produtos no painel para publicar a vitrine.',
  publishToFillCategories:
    'Publique produtos para preencher as categorias da loja.',
  associateProductsCategory:
    'Associe produtos a esta categoria para preencher a seção na home.',
  searchResultsFor: (query: string) => `Resultados para "${query}"`,
  productCountFound: (n: number) =>
    `${n} produto${n === 1 ? '' : 's'} encontrado${n === 1 ? '' : 's'}.`,
  productCountListed: (n: number) =>
    `${n} produto${n === 1 ? '' : 's'} listado${n === 1 ? '' : 's'}.`,

  // ── Footer ────────────────────────────────────────────────
  footerTagline: 'Vitrine oficial',
  footerSupport: 'Atendimento',
  footerAdminAccess: 'Acesso administrativo',

  // ── Perks (selos de produto) ──────────────────────────────
  perkFreeShipping: 'Frete grátis',
  perkInstallments: 'Até 12x sem juros',
  perkFreeExchange: 'Troca grátis',
  perkWarranty: 'Garantia',

  // ── Geral ─────────────────────────────────────────────────
  accountMyAccount: 'Minha conta',
  accountStoreAccount: 'Conta da loja',
  accountLogout: 'Sair da conta',
  greeting: (name: string) => `Olá, ${name}`,
  accountSubtitle:
    'Gerencie seus dados, endereços e acompanhe seus pedidos.',
  loading: 'Carregando...',
  loadingCheckout: 'Carregando checkout...',
  loadingCart: 'Carregando carrinho...',
  apply: 'Aplicar',
  remove: 'Remover',
  save: 'Salvar',
  secondaryDefault: 'Coleção da loja',

  // ── Compra direta ─────────────────────────────────────────
  directPurchaseNotice:
    'Compra direta. Ao confirmar, apenas este produto será incluído no pedido.',
  reviewNotice:
    'Revise os dados ao lado. Ao confirmar, o pedido será salvo neste navegador e o carrinho será esvaziado.',
} as const
