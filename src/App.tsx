import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  checkIsAdmin,
  fetchVerifiedCosmetics,
  filterCosmetics,
} from './services/cosmeticsService';
import {
  EMPTY_SEARCH_CRITERIA,
  type CosmeticProduct,
  type SearchCriteria,
} from './types/cosmetic';
import { PortalHeader, type AppRoute } from './components/PortalHeader';
import { PortalFooter } from './components/PortalFooter';
import { CosmeticsSearchPanel } from './components/CosmeticsSearchPanel';
import { PortalCategoryGrid } from './components/PortalCategoryGrid';
import { ProductDetailView } from './components/ProductDetailView';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPortalPage } from './components/AboutPortalPage';

function normalizeRoutePath(raw: string): string {
  const withoutHash = raw.replace(/^#/, '');
  if (!withoutHash) return '/';
  return withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
}

function parseRoute(pathname: string, hash: string): AppRoute {
  const hashTarget = hash.replace(/^#/, '');
  const raw = hashTarget && hashTarget !== '/' ? hashTarget : pathname;
  const cleaned = normalizeRoutePath(raw);

  if (cleaned.startsWith('/cosmeticos/detalhes/')) {
    const id = decodeURIComponent(
      cleaned.replace('/cosmeticos/detalhes/', '').replace(/\/+$/, '')
    );
    if (id) return { name: 'details', id };
  }
  if (cleaned.startsWith('/cosmeticos/registrados')) {
    return { name: 'search' };
  }
  if (cleaned.startsWith('/admin')) {
    return { name: 'admin' };
  }
  if (cleaned.startsWith('/sobre')) {
    return { name: 'about' };
  }
  return { name: 'home' };
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRoute(window.location.pathname, window.location.hash)
  );
  const [highContrast, setHighContrast] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [products, setProducts] = useState<CosmeticProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [draftCriteria, setDraftCriteria] = useState<SearchCriteria>(
    EMPTY_SEARCH_CRITERIA
  );
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [focusField, setFocusField] = useState<
    'productName' | 'registrationNumber' | 'snbNumber' | 'processNumber' | null
  >(null);

  const navigate = useCallback((target: string) => {
    const nextPath = normalizeRoutePath(target);
    if (window.location.pathname !== nextPath || window.location.hash) {
      window.history.pushState(null, '', nextPath);
    }
    setRoute(parseRoute(nextPath, ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(parseRoute(window.location.pathname, window.location.hash));
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const adminFlag = await checkIsAdmin(nextUser);
          setIsAdminUser(adminFlag);
        } catch {
          setIsAdminUser(false);
        }
      } else {
        setIsAdminUser(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchVerifiedCosmetics();
      setProducts(data);
    } catch {
      // ignore load failure on public view
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleSubmitSearch = (override?: SearchCriteria) => {
    const active = override ?? draftCriteria;
    const matches = filterCosmetics(products, active);
    if (matches.length > 0) {
      setSearchNotFound(false);
      navigate(`#/cosmeticos/detalhes/${encodeURIComponent(matches[0].id)}`);
    } else {
      setSearchNotFound(true);
    }
  };

  const handleResetSearch = () => {
    setDraftCriteria(EMPTY_SEARCH_CRITERIA);
    setSearchNotFound(false);
    setFocusField(null);
  };

  const handleFilterStatusFromTile = (
    status: 'all' | 'valid' | 'expired' | 'suspended' | 'expiring_soon'
  ) => {
    const next: SearchCriteria = {
      ...EMPTY_SEARCH_CRITERIA,
      statusFilter: status,
    };
    setDraftCriteria(next);
    setSearchNotFound(false);
    navigate('#/cosmeticos/registrados/');
  };

  const handleFocusSearchField = (
    field: 'productName' | 'registrationNumber' | 'snbNumber' | 'processNumber'
  ) => {
    setFocusField(field);
    setSearchNotFound(false);
    navigate('#/cosmeticos/registrados/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#333333]">
      <PortalHeader
        route={route}
        onNavigate={navigate}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast((prev) => !prev)}
        isAdminUser={isAdminUser}
      />

      <main className="flex-1 w-full max-w-[1140px] mx-auto px-4 py-4">
        {/* Breadcrumb bar matching reference screenshot */}
        <nav
          aria-label="Navegação estrutural"
          className="bg-[#f8f9fa] border border-[#dcdcdc] rounded-[2px] px-3.5 py-2 text-[12px] mb-4 flex flex-wrap items-center gap-1.5 hc-surface no-print"
        >
          <button
            type="button"
            onClick={() => navigate('#/')}
            className={
              route.name === 'home'
                ? 'text-[#555555] font-normal cursor-default'
                : 'text-[#1b5ca7] hover:underline cursor-pointer'
            }
          >
            Consultas
          </button>

          {route.name === 'search' && (
            <>
              <span aria-hidden="true" className="text-[#868e96]">
                /
              </span>
              <span className="text-[#555555] font-medium">
                Cosméticos - Produtos Regularizados
              </span>
            </>
          )}

          {route.name === 'details' && (
            <>
              <span aria-hidden="true" className="text-[#868e96]">
                /
              </span>
              <button
                type="button"
                onClick={() => navigate('#/cosmeticos/registrados/')}
                className="text-[#1b5ca7] hover:underline cursor-pointer"
              >
                Cosméticos - Produtos Regularizados
              </button>
              <span aria-hidden="true" className="text-[#868e96]">
                /
              </span>
              <span className="text-[#555555] font-medium">
                Detalhes do Registro
              </span>
            </>
          )}

          {route.name === 'admin' && (
            <>
              <span aria-hidden="true" className="text-[#868e96]">
                /
              </span>
              <span className="text-[#555555] font-medium">
                Painel Administrativo
              </span>
            </>
          )}

          {route.name === 'about' && (
            <>
              <span aria-hidden="true" className="text-[#868e96]">
                /
              </span>
              <span className="text-[#555555] font-medium">
                Sobre a Base Independente
              </span>
            </>
          )}
        </nav>

        {/* Home View: Exact 4-panel portal matching the reference screenshot */}
        {route.name === 'home' && (
          <PortalCategoryGrid
            onSelectCosmetics={() => navigate('#/cosmeticos/registrados/')}
            onFilterStatus={handleFilterStatusFromTile}
            onFocusSearchField={handleFocusSearchField}
            onNavigate={navigate}
          />
        )}

        {/* Dedicated Cosmetics Search View (/cosmeticos/registrados/) */}
        {route.name === 'search' && (
          <div>
            <CosmeticsSearchPanel
              criteria={draftCriteria}
              onChangeCriteria={(next) => {
                setSearchNotFound(false);
                setDraftCriteria(next);
              }}
              onSubmitSearch={handleSubmitSearch}
              onResetSearch={handleResetSearch}
              onClearResults={() => setSearchNotFound(false)}
              searchNotFound={searchNotFound}
              loadingProducts={loadingProducts}
              allProducts={products}
              focusField={focusField}
            />
          </div>
        )}

        {/* Product Verification Result Detail View */}
        {route.name === 'details' && (
          <ProductDetailView
            productId={route.id}
            onBack={() => navigate('#/cosmeticos/registrados/')}
          />
        )}

        {/* Protected Admin Dashboard */}
        {route.name === 'admin' && (
          <AdminDashboard
            user={user}
            authLoading={authLoading}
            isAdmin={isAdminUser}
            products={products}
            loadingProducts={loadingProducts}
            onRefresh={() => void loadProducts()}
            onViewProduct={(id) =>
              navigate(`#/cosmeticos/detalhes/${encodeURIComponent(id)}`)
            }
          />
        )}

        {/* About & Criteria Page */}
        {route.name === 'about' && (
          <AboutPortalPage onBack={() => navigate('#/')} />
        )}
      </main>

      <PortalFooter onNavigate={navigate} />
    </div>
  );
}
