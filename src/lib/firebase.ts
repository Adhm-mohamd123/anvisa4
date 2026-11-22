import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
auth.languageCode = 'pt';
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function formatErrorPT(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  if (lower.includes('auth/popup-closed-by-user') || lower.includes('auth/cancelled-popup-request')) {
    return 'A janela de autenticação foi fechada antes da conclusão do acesso.';
  }
  if (lower.includes('auth/popup-blocked')) {
    return 'O navegador bloqueou a janela de autenticação. Permita pop-ups para continuar.';
  }
  if (lower.includes('auth/unauthorized-domain')) {
    return 'Este domínio não está autorizado para autenticação. Adicione-o nas configurações do Firebase.';
  }
  if (lower.includes('auth/network-request-failed') || lower.includes('offline')) {
    return 'Falha de conexão com a rede. Verifique sua internet e tente novamente.';
  }
  if (lower.includes('permission-denied') || lower.includes('missing or insufficient permissions')) {
    return 'Permissão insuficiente para executar esta operação na base de dados.';
  }
  if (lower.includes('quota exceeded')) {
    return 'Limite diário de uso da base de dados excedido. Tente novamente mais tarde.';
  }
  if (raw.trim().startsWith('{') && raw.includes('"operationType"')) {
    return fallback;
  }

  return raw;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Erro no Firestore: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Verifique a configuração do Firebase.');
    }
  }
}

void testConnection();
