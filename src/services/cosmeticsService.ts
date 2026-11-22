import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FIELD_BOUNDS,
  normalizeCodeForSearch,
  normalizeDateInput,
  normalizeTextForSearch,
  validateCosmeticInput,
  type CosmeticProduct,
  type CosmeticProductInput,
  type RegistrationStatus,
  type SearchCriteria,
} from '../types/cosmetic';

const COSMETICS_COLLECTION = 'cosmetics';
const IMAGES_COLLECTION = 'cosmetic_images';
const ADMINS_COLLECTION = 'admins';
const BOOTSTRAP_ADMIN_EMAIL = 'myy92115@gmail.com';

function sanitizeProductId(raw?: string): string {
  if (raw && /^[a-zA-Z0-9_\-]+$/.test(raw) && raw.length <= 128) {
    return raw;
  }
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `cos_${Date.now()}_${randomPart}`;
}

function sanitizeInput(input: CosmeticProductInput): CosmeticProductInput {
  return {
    productName: input.productName.trim().slice(0, FIELD_BOUNDS.productName.max),
    registrationNumber: input.registrationNumber.trim().slice(0, FIELD_BOUNDS.registrationNumber.max),
    snbNumber: input.snbNumber.trim().slice(0, FIELD_BOUNDS.snbNumber.max),
    processNumber: input.processNumber.trim().slice(0, FIELD_BOUNDS.processNumber.max),
    registrationDate: normalizeDateInput(input.registrationDate).slice(0, 10),
    expirationDate: normalizeDateInput(input.expirationDate).slice(0, 10),
    manufacturerName: input.manufacturerName.trim().slice(0, FIELD_BOUNDS.manufacturerName.max),
    originCountry: input.originCountry.trim().slice(0, FIELD_BOUNDS.originCountry.max),
    status: input.status,
    description: input.description.trim().slice(0, FIELD_BOUNDS.description.max),
    imageUrl: input.imageUrl.trim().slice(0, FIELD_BOUNDS.imageUrl.max),
  };
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL) return true;
  const path = `${ADMINS_COLLECTION}/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, ADMINS_COLLECTION, user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchVerifiedCosmetics(): Promise<CosmeticProduct[]> {
  try {
    const q = query(
      collection(db, COSMETICS_COLLECTION),
      where('verifiedByAdmin', '==', true)
    );
    const snapshot = await getDocs(q);
    const items: CosmeticProduct[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        productName: String(data.productName ?? ''),
        registrationNumber: String(data.registrationNumber ?? ''),
        snbNumber: String(data.snbNumber ?? ''),
        processNumber: String(data.processNumber ?? ''),
        registrationDate: String(data.registrationDate ?? ''),
        expirationDate: String(data.expirationDate ?? ''),
        manufacturerName: String(data.manufacturerName ?? ''),
        originCountry: String(data.originCountry ?? ''),
        status: (data.status as RegistrationStatus) || 'valid',
        description: String(data.description ?? ''),
        imageUrl: String(data.imageUrl ?? ''),
        hasUploadedImage: Boolean(data.hasUploadedImage),
        verifiedByAdmin: Boolean(data.verifiedByAdmin),
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
    });

    return items.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() ?? 0;
      const bTime = b.updatedAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COSMETICS_COLLECTION);
  }
}

export async function fetchCosmeticById(id: string): Promise<CosmeticProduct | null> {
  const path = `${COSMETICS_COLLECTION}/${id}`;
  try {
    const snap = await getDoc(doc(db, COSMETICS_COLLECTION, id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      productName: String(data.productName ?? ''),
      registrationNumber: String(data.registrationNumber ?? ''),
      snbNumber: String(data.snbNumber ?? ''),
      processNumber: String(data.processNumber ?? ''),
      registrationDate: String(data.registrationDate ?? ''),
      expirationDate: String(data.expirationDate ?? ''),
      manufacturerName: String(data.manufacturerName ?? ''),
      originCountry: String(data.originCountry ?? ''),
      status: (data.status as RegistrationStatus) || 'valid',
      description: String(data.description ?? ''),
      imageUrl: String(data.imageUrl ?? ''),
      hasUploadedImage: Boolean(data.hasUploadedImage),
      verifiedByAdmin: Boolean(data.verifiedByAdmin),
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchCosmeticImage(id: string): Promise<string | null> {
  const path = `${IMAGES_COLLECTION}/${id}`;
  try {
    const snap = await getDoc(doc(db, IMAGES_COLLECTION, id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return typeof data.dataUrl === 'string' ? data.dataUrl : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createCosmeticProduct(
  rawInput: CosmeticProductInput,
  uploadedImageDataUrl?: string | null,
  customId?: string
): Promise<string> {
  const clean = sanitizeInput(rawInput);
  const errors = validateCosmeticInput(clean);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  const id = sanitizeProductId(customId);
  const hasUploadedImage = Boolean(uploadedImageDataUrl && uploadedImageDataUrl.length >= 10);

  if (hasUploadedImage && uploadedImageDataUrl) {
    if (uploadedImageDataUrl.length > 250000) {
      throw new Error('A imagem excede o limite de tamanho permitido após compressão.');
    }
    const imgPath = `${IMAGES_COLLECTION}/${id}`;
    try {
      await setDoc(doc(db, IMAGES_COLLECTION, id), {
        dataUrl: uploadedImageDataUrl,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, imgPath);
    }
  }

  const path = `${COSMETICS_COLLECTION}/${id}`;
  try {
    await setDoc(doc(db, COSMETICS_COLLECTION, id), {
      ...clean,
      hasUploadedImage,
      verifiedByAdmin: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCosmeticProduct(
  id: string,
  rawInput: CosmeticProductInput,
  existingCreatedAt: Timestamp | null | undefined,
  options?: {
    newImageDataUrl?: string | null;
    removeUploadedImage?: boolean;
    currentlyHasUploadedImage?: boolean;
  }
): Promise<void> {
  const clean = sanitizeInput(rawInput);
  const errors = validateCosmeticInput(clean);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  let hasUploadedImage = Boolean(options?.currentlyHasUploadedImage);

  if (options?.newImageDataUrl && options.newImageDataUrl.length >= 10) {
    if (options.newImageDataUrl.length > 250000) {
      throw new Error('A imagem excede o limite de tamanho permitido após compressão.');
    }
    const imgPath = `${IMAGES_COLLECTION}/${id}`;
    try {
      await setDoc(doc(db, IMAGES_COLLECTION, id), {
        dataUrl: options.newImageDataUrl,
        updatedAt: serverTimestamp(),
      });
      hasUploadedImage = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, imgPath);
    }
  } else if (options?.removeUploadedImage) {
    const imgPath = `${IMAGES_COLLECTION}/${id}`;
    try {
      await deleteDoc(doc(db, IMAGES_COLLECTION, id));
      hasUploadedImage = false;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, imgPath);
    }
  }

  const path = `${COSMETICS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, COSMETICS_COLLECTION, id), {
      ...clean,
      hasUploadedImage,
      verifiedByAdmin: true,
      ...(existingCreatedAt ? { createdAt: existingCreatedAt } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function quickUpdateCosmeticStatus(
  id: string,
  product: CosmeticProduct,
  newStatus: RegistrationStatus
): Promise<void> {
  await updateCosmeticProduct(
    id,
    {
      productName: product.productName,
      registrationNumber: product.registrationNumber,
      snbNumber: product.snbNumber,
      processNumber: product.processNumber,
      registrationDate: product.registrationDate,
      expirationDate: product.expirationDate,
      manufacturerName: product.manufacturerName,
      originCountry: product.originCountry,
      status: newStatus,
      description: product.description,
      imageUrl: product.imageUrl,
    },
    product.createdAt,
    { currentlyHasUploadedImage: product.hasUploadedImage }
  );
}

export async function deleteCosmeticProduct(id: string, hasUploadedImage: boolean): Promise<void> {
  const path = `${COSMETICS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COSMETICS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  if (hasUploadedImage) {
    const imgPath = `${IMAGES_COLLECTION}/${id}`;
    try {
      await deleteDoc(doc(db, IMAGES_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, imgPath);
    }
  }
}

export function filterCosmetics(
  products: CosmeticProduct[],
  criteria: SearchCriteria
): CosmeticProduct[] {
  const pName = normalizeTextForSearch(criteria.productName);
  const pNameTokens = pName ? pName.split(' ').filter(Boolean) : [];
  const pNameCode = normalizeCodeForSearch(criteria.productName);
  const regRaw = criteria.registrationNumber.trim().toLowerCase();
  const regNorm = normalizeCodeForSearch(criteria.registrationNumber);
  const snbRaw = criteria.snbNumber.trim().toLowerCase();
  const snbNorm = normalizeCodeForSearch(criteria.snbNumber);
  const mfg = normalizeTextForSearch(criteria.manufacturerName);
  const mfgTokens = mfg ? mfg.split(' ').filter(Boolean) : [];
  const procRaw = criteria.processNumber.trim().toLowerCase();
  const procNorm = normalizeCodeForSearch(criteria.processNumber);
  const expFrom = normalizeDateInput(criteria.expirationFrom);
  const expTo = normalizeDateInput(criteria.expirationTo);

  const filtered = products.filter((item) => {
    if (!item.verifiedByAdmin) return false;

    if (pName) {
      const itemNameNorm = normalizeTextForSearch(item.productName);
      const matchesAllTokens = pNameTokens.every((token) =>
        itemNameNorm.includes(token)
      );
      const matchesCodeFallback =
        Boolean(pNameCode) &&
        (normalizeCodeForSearch(item.registrationNumber).includes(pNameCode) ||
          normalizeCodeForSearch(item.snbNumber).includes(pNameCode) ||
          normalizeCodeForSearch(item.processNumber).includes(pNameCode));

      if (!matchesAllTokens && !matchesCodeFallback) return false;
    }

    if (regRaw) {
      const itemRegRaw = item.registrationNumber.toLowerCase();
      const itemRegNorm = normalizeCodeForSearch(item.registrationNumber);
      if (!itemRegRaw.includes(regRaw) && (!regNorm || !itemRegNorm.includes(regNorm))) {
        return false;
      }
    }

    if (snbRaw) {
      const itemSnbRaw = item.snbNumber.toLowerCase();
      const itemSnbNorm = normalizeCodeForSearch(item.snbNumber);
      if (!itemSnbRaw.includes(snbRaw) && (!snbNorm || !itemSnbNorm.includes(snbNorm))) {
        return false;
      }
    }

    if (mfg) {
      const itemMfgNorm = normalizeTextForSearch(item.manufacturerName);
      if (!mfgTokens.every((token) => itemMfgNorm.includes(token))) return false;
    }

    if (procRaw) {
      const itemProcRaw = item.processNumber.toLowerCase();
      const itemProcNorm = normalizeCodeForSearch(item.processNumber);
      if (!itemProcRaw.includes(procRaw) && (!procNorm || !itemProcNorm.includes(procNorm))) {
        return false;
      }
    }

    const itemExpDate = normalizeDateInput(item.expirationDate);
    if (expFrom && itemExpDate && itemExpDate < expFrom) return false;
    if (expTo && itemExpDate && itemExpDate > expTo) return false;

    if (criteria.statusFilter === 'expiring_soon') {
      if (item.status !== 'valid') return false;
      const target = new Date(`${itemExpDate}T00:00:00`);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 60) return false;
    } else if (criteria.statusFilter !== 'all' && item.status !== criteria.statusFilter) {
      return false;
    }

    return true;
  });

  if (!pName) return filtered;

  return filtered.sort((a, b) => {
    const aName = normalizeTextForSearch(a.productName);
    const bName = normalizeTextForSearch(b.productName);
    const aScore = aName === pName ? 0 : aName.startsWith(pName) ? 1 : 2;
    const bScore = bName === pName ? 0 : bName.startsWith(pName) ? 1 : 2;
    return aScore - bScore;
  });
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem válido (PNG, JPG ou WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada.'));
      img.onload = () => {
        const maxDim = 560;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao inicializar o processador de imagem.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        while (dataUrl.length > 210000 && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > 240000) {
          reject(new Error('A imagem ainda é muito grande após compressão. Escolha uma imagem menor.'));
          return;
        }

        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
