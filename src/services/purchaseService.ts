import 'cordova-plugin-purchase';

// 상품 ID (Google Play Console에 등록할 ID와 일치해야 함)
export const PRODUCT_IDS = {
  // 비소비성 상품 (한 번 구매하면 영구)
  AD_REMOVAL: 'ad_removal',           // 광고 제거 ₩3,900
  PERMANENT_BOOSTER: 'permanent_booster', // 영구 부스터 ₩5,900

  // 소비성 상품 (다이아 패키지) - 코드는 ruby, 표시는 다이아
  DIAMOND_100: 'diamond_100',     // 다이아 100개 ₩1,200
  DIAMOND_320: 'diamond_320',     // 다이아 300+20개 ₩3,500
  DIAMOND_550: 'diamond_550',     // 다이아 500+50개 ₩5,900
  DIAMOND_1000: 'diamond_1000',   // 다이아 900+100개 ₩11,000
  DIAMOND_2000: 'diamond_2000',   // 다이아 1800+200개 ₩22,000
};

// 상품 정보 타입
export interface ProductInfo {
  id: string;
  title: string;
  description: string;
  price: string;
  rubyAmount?: number;
}

// 구매 결과 타입
export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
}

// 콜백 타입
type PurchaseCallback = (productId: string) => void;

let store: CdvPurchase.Store | null = null;
let isInitialized = false;
let purchaseApprovedCallback: PurchaseCallback | null = null;

// 스토어 초기화
export async function initializePurchases(onPurchaseApproved: PurchaseCallback): Promise<void> {
  if (isInitialized) return;

  // 웹 환경에서는 스킵
  if (typeof CdvPurchase === 'undefined') {
    console.log('CdvPurchase not available (web environment)');
    return;
  }

  try {
    store = CdvPurchase.store;
    purchaseApprovedCallback = onPurchaseApproved;

    // 상품 등록
    store.register([
      // 비소비성 상품
      {
        id: PRODUCT_IDS.AD_REMOVAL,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.PERMANENT_BOOSTER,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
      // 소비성 상품 (다이아 패키지)
      {
        id: PRODUCT_IDS.DIAMOND_100,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.DIAMOND_320,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.DIAMOND_550,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.DIAMOND_1000,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.DIAMOND_2000,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
    ]);

    // 구매 승인 이벤트 처리
    store.when()
      .approved((transaction: CdvPurchase.Transaction) => {
        console.log('Purchase approved:', transaction.products[0]?.id);

        // 상품 ID로 콜백 호출
        const productId = transaction.products[0]?.id;
        if (productId && purchaseApprovedCallback) {
          purchaseApprovedCallback(productId);
        }

        // 트랜잭션 완료 처리
        transaction.finish();
      })
      .finished((transaction: CdvPurchase.Transaction) => {
        console.log('Transaction finished:', transaction.products[0]?.id);
      })
      .verified((receipt: CdvPurchase.VerifiedReceipt) => {
        console.log('Receipt verified:', receipt);
      });

    // 에러 핸들링
    store.error((error: CdvPurchase.IError) => {
      console.error('Store error:', error.code, error.message);
    });

    // 스토어 초기화
    await store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);

    // 상품 정보 가져오기
    await store.update();

    isInitialized = true;
    console.log('Purchase service initialized');
  } catch (error) {
    console.error('Failed to initialize purchases:', error);
  }
}

// 상품 정보 조회
export function getProduct(productId: string): ProductInfo | null {
  if (!store) return null;

  const product = store.get(productId);
  if (!product) return null;

  // 다이아 수량 매핑 (코드는 ruby, 표시는 다이아)
  const diamondAmounts: Record<string, number> = {
    [PRODUCT_IDS.DIAMOND_100]: 100,
    [PRODUCT_IDS.DIAMOND_320]: 320,   // 300 + 20 보너스
    [PRODUCT_IDS.DIAMOND_550]: 550,   // 500 + 50 보너스
    [PRODUCT_IDS.DIAMOND_1000]: 1000, // 900 + 100 보너스
    [PRODUCT_IDS.DIAMOND_2000]: 2000, // 1800 + 200 보너스
  };

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.pricing?.price || '가격 정보 없음',
    rubyAmount: diamondAmounts[productId], // 코드는 ruby, 표시는 다이아
  };
}

// 모든 상품 정보 조회
export function getAllProducts(): ProductInfo[] {
  const products: ProductInfo[] = [];

  Object.values(PRODUCT_IDS).forEach(id => {
    const product = getProduct(id);
    if (product) {
      products.push(product);
    }
  });

  return products;
}

// 상품 구매
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  if (!store) {
    return { success: false, error: 'Store not initialized' };
  }

  try {
    const product = store.get(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const offer = product.getOffer();
    if (!offer) {
      return { success: false, error: 'No offer available' };
    }

    // 구매 시작
    await offer.order();

    return { success: true, productId };
  } catch (error) {
    console.error('Purchase failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 구매 복원 (비소비성 상품)
export async function restorePurchases(): Promise<string[]> {
  if (!store) {
    console.log('Store not initialized');
    return [];
  }

  try {
    await store.restorePurchases();

    // 복원된 상품 ID 목록
    const restoredProducts: string[] = [];

    // 비소비성 상품 확인
    const adRemoval = store.get(PRODUCT_IDS.AD_REMOVAL);
    if (adRemoval?.owned) {
      restoredProducts.push(PRODUCT_IDS.AD_REMOVAL);
    }

    const permanentBooster = store.get(PRODUCT_IDS.PERMANENT_BOOSTER);
    if (permanentBooster?.owned) {
      restoredProducts.push(PRODUCT_IDS.PERMANENT_BOOSTER);
    }

    console.log('Restored products:', restoredProducts);
    return restoredProducts;
  } catch (error) {
    console.error('Restore failed:', error);
    return [];
  }
}

// 특정 상품 소유 여부 확인
export function isProductOwned(productId: string): boolean {
  if (!store) return false;

  const product = store.get(productId);
  return product?.owned || false;
}

// 상품 가격 조회 (폴백용)
export const FALLBACK_PRICES: Record<string, string> = {
  [PRODUCT_IDS.AD_REMOVAL]: '₩3,900',
  [PRODUCT_IDS.PERMANENT_BOOSTER]: '₩5,900',
  [PRODUCT_IDS.DIAMOND_100]: '₩1,200',
  [PRODUCT_IDS.DIAMOND_320]: '₩3,500',
  [PRODUCT_IDS.DIAMOND_550]: '₩5,900',
  [PRODUCT_IDS.DIAMOND_1000]: '₩11,000',
  [PRODUCT_IDS.DIAMOND_2000]: '₩22,000',
};

// 상품 가격 가져오기 (폴백 포함)
export function getProductPrice(productId: string): string {
  const product = getProduct(productId);
  return product?.price || FALLBACK_PRICES[productId] || '가격 정보 없음';
}
