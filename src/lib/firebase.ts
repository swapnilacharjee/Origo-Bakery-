import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  setDoc, 
  collection, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ShopSettings, AppsScriptConfig, Product } from '../types';

const sanitizeLog = (val: unknown): string =>
  String(val instanceof Error ? val.message : val).replace(/[\r\n]/g, ' ');

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Anonymous Auth — ensures all writes come from authenticated sessions only
const auth = getAuth(app);
let _authReady = false;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(() => {});
  } else {
    _authReady = true;
  }
});
export const waitForAuth = (): Promise<void> =>
  new Promise((resolve) => {
    if (_authReady) { resolve(); return; }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { _authReady = true; unsub(); resolve(); }
    });
  });

// Get Firestore instance — use default DB if firestoreDatabaseId is (default) or missing
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    experimentalForceLongPolling: true
  }, dbId);
} catch (e) {
  firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreDb;

// Collection & Doc references
const SHOP_SETTINGS_DOC = doc(db, 'shop_settings', 'main');
const APP_CONFIG_DOC = doc(db, 'app_config', 'sheets');
const PRODUCTS_COLL = collection(db, 'products');

/**
 * Realtime listener or fetch for Shop Settings
 */
export const subscribeShopSettings = (onUpdate: (settings: ShopSettings) => void) => {
  let unsub: (() => void) | undefined;
  waitForAuth().then(() => {
    unsub = onSnapshot(SHOP_SETTINGS_DOC, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as ShopSettings);
        }
      },
      error: (err) => {
        console.info('Firestore shop settings operating in offline/fallback mode:', sanitizeLog(err.message));
      }
    });
  });
  return () => unsub?.();
};

export const saveShopSettingsToFirebase = async (settings: ShopSettings): Promise<void> => {
  try {
    await setDoc(SHOP_SETTINGS_DOC, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save shop settings to Firebase (operating offline):', sanitizeLog(err));
  }
};

/**
 * Realtime listener or fetch for Apps Script Config
 */
export const subscribeAppConfig = (onUpdate: (config: AppsScriptConfig) => void) => {
  let unsub: (() => void) | undefined;
  waitForAuth().then(() => {
    unsub = onSnapshot(APP_CONFIG_DOC, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as AppsScriptConfig);
        }
      },
      error: (err) => {
        console.info('Firestore app config operating in offline/fallback mode:', sanitizeLog(err.message));
      }
    });
  });
  return () => unsub?.();
};

export const saveAppConfigToFirebase = async (config: AppsScriptConfig): Promise<void> => {
  try {
    await setDoc(APP_CONFIG_DOC, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save app config to Firebase (operating offline):', sanitizeLog(err));
  }
};

/**
 * Realtime listener or fetch for Products
 */
export const subscribeProducts = (onUpdate: (products: Product[]) => void) => {
  let unsub: (() => void) | undefined;
  waitForAuth().then(() => {
    unsub = onSnapshot(PRODUCTS_COLL, {
      next: (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      error: (err) => {
        console.info('Firestore products operating in offline/fallback mode:', sanitizeLog(err.message));
      }
    });
  });
  return () => unsub?.();
};

export const saveProductToFirebase = async (product: Product): Promise<void> => {
  try {
    const pDoc = doc(db, 'products', product.id);
    await setDoc(pDoc, product, { merge: true });
  } catch (err) {
    console.warn('Could not save product to Firebase (operating offline):', sanitizeLog(err));
  }
};

export const deleteProductFromFirebase = async (productId: string): Promise<void> => {
  try {
    const pDoc = doc(db, 'products', productId);
    await deleteDoc(pDoc);
  } catch (err) {
    console.warn('Could not delete product from Firebase (operating offline):', sanitizeLog(err));
  }
};

export const saveAllProductsToFirebase = async (products: Product[]): Promise<void> => {
  try {
    for (const p of products) {
      const pDoc = doc(db, 'products', p.id);
      await setDoc(pDoc, p, { merge: true });
    }
  } catch (err) {
    console.warn('Could not batch save products to Firebase (operating offline):', sanitizeLog(err));
  }
};

