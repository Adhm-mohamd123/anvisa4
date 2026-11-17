import React, { useMemo, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Plus,
  Download,
  Upload,
  Search,
  Edit2,
  Trash2,
  Eye,
  LogOut,
  Lock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import {
  deleteCosmeticProduct,
  quickUpdateCosmeticStatus,
} from '../services/cosmeticsService';
import {
  formatDateBR,
  getDaysUntilExpiration,
  isExpiringSoon,
  normalizeCodeForSearch,
  normalizeTextForSearch,
  type CosmeticProduct,
  type RegistrationStatus,
} from '../types/cosmetic';
import { StatusIndicator } from './StatusIndicator';
import { ProductThumbnail } from './ProductThumbnail';
import { ProductFormModal } from './ProductFormModal';
import { ImportModal } from './ImportModal';

interface AdminDashboardProps {
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  products: CosmeticProduct[];
  loadingProducts: boolean;
  onRefresh: () => void;
  onViewProduct: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  authLoading,
  isAdmin,
  products,
  loadingProducts,
  onRefresh,
  onViewProduct,
}) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [queryText, setQueryText] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | RegistrationStatus | 'expiring_soon'
  >('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CosmeticProduct | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CosmeticProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleLogin = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir o login.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const expiringProducts = useMemo(
    () => products.filter((p) => isExpiringSoon(p, 60)),
    [products]
  );

  const stats = useMemo(() => {
    const valid = products.filter((p) => p.status === 'valid').length;
    const expiredOrSuspended = products.filter(
      (p) => p.status === 'expired' || p.status === 'suspended'
    ).length;
    return {
      total: products.length,
      valid,
      expiringSoon: expiringProducts.length,
      expiredOrSuspended,
    };
  }, [products, expiringProducts]);

  const filteredProducts = useMemo(() => {
    const qText = normalizeTextForSearch(queryText);
    const qCode = normalizeCodeForSearch(queryText);
    return products.filter((p) => {
      if (qText) {
        const matches =
          normalizeTextForSearch(p.productName).includes(qText) ||
          normalizeTextForSearch(p.manufacturerName).includes(qText) ||
          p.registrationNumber.toLowerCase().includes(qText) ||
          (qCode && normalizeCodeForSearch(p.registrationNumber).includes(qCode)) ||
          p.snbNumber.toLowerCase().includes(qText) ||
          (qCode && normalizeCodeForSearch(p.snbNumber).includes(qCode)) ||
          p.processNumber.toLowerCase().includes(qText) ||
          (qCode && normalizeCodeForSearch(p.processNumber).includes(qCode));
        if (!matches) return false;
      }

      if (statusFilter === 'expiring_soon') {
        return isExpiringSoon(p, 60);
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [products, queryText, statusFilter]);

  const handleExportJson = () => {
    const payload = products.map((p) => ({
      productName: p.productName,
      registrationNumber: p.registrationNumber,
      snbNumber: p.snbNumber,
      processNumber: p.processNumber,
      registrationDate: p.registrationDate,
      expirationDate: p.expirationDate,
      manufacturerName: p.manufacturerName,
      originCountry: p.originCountry,
      status: p.status,
      description: p.description,
      imageUrl: p.imageUrl,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmeticos_registros_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = [
      'productName',
      'registrationNumber',
      'snbNumber',
      'processNumber',
      'registrationDate',
      'expirationDate',
      'manufacturerName',
      'originCountry',
      'status',
      'description',
      'imageUrl',
    ];
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = products.map((p) =>
      [
        p.productName,
        p.registrationNumber,
        p.snbNumber,
        p.processNumber,
        p.registrationDate,
        p.expirationDate,
        p.manufacturerName,
        p.originCountry,
        p.status,
        p.description,
        p.imageUrl,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmeticos_registros_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCosmeticProduct(deleteTarget.id, deleteTarget.hasUploadedImage);
      setActionFeedback(`Registro "${deleteTarget.productName}" removido com sucesso.`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      setActionFeedback(
        err instanceof Error ? err.message : 'Erro ao excluir o produto.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (
    product: CosmeticProduct,
    nextStatus: RegistrationStatus
  ) => {
    try {
      await quickUpdateCosmeticStatus(product.id, product, nextStatus);
      setActionFeedback(
        `Situação de "${product.productName}" atualizada com sucesso.`
      );
      onRefresh();
    } catch (err) {
      setActionFeedback(
        err instanceof Error ? err.message : 'Erro ao atualizar situação.'
      );
    }
  };

  if (authLoading) {
    return (
      <div className="border border-[#d8dde3] rounded-[3px] bg-white p-8 text-center text-[13px] text-[#555555]">
        Verificando sessão administrativa...
      </div>
    );
  }

  if (!user) {
    return (
      <section className="max-w-md mx-auto border border-[#d8dde3] rounded-[3px] bg-white overflow-hidden hc-surface">
        <div className="bg-[#eef1f4] border-b border-[#d8dde3] py-3 px-4 text-center hc-header-bar">
          <h2 className="text-[14px] font-bold text-[#333333]">
            Acesso Restrito — Painel Administrativo
          </h2>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-[3px] bg-[#eef3fb] border border-[#c5d6f3] flex items-center justify-center text-[#1351b4]">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-[13px] text-[#444444] leading-relaxed">
            Faça login com a conta de administrador autorizada para cadastrar, editar,
            monitorar vencimentos e importar/exportar registros de cosméticos.
          </p>
          {authError && (
            <div className="p-2.5 bg-[#fef2f2] border border-[#fecaca] rounded-[3px] text-[12px] text-[#991b1b]">
              {authError}
            </div>
          )}
          <button
            type="button"
            disabled={signingIn}
            onClick={handleLogin}
            className="w-full py-2 px-4 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] disabled:opacity-60 rounded-[3px] transition-colors cursor-pointer"
          >
            {signingIn ? 'Autenticando...' : 'Entrar com Conta Google Autorizada'}
          </button>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="max-w-lg mx-auto border border-[#fecaca] rounded-[3px] bg-white overflow-hidden hc-surface">
        <div className="bg-[#fef2f2] border-b border-[#fecaca] py-3 px-4 text-center">
          <h2 className="text-[14px] font-bold text-[#991b1b]">
            Acesso Não Autorizado
          </h2>
        </div>
        <div className="p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-[#b91c1c] mx-auto" aria-hidden="true" />
          <p className="text-[13px] text-[#444444]">
            A conta conectada (<strong>{user.email}</strong>) não possui permissão
            administrativa para alterar a base de dados.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Sair e Trocar de Conta</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Admin Header Bar */}
      <div className="border border-[#d8dde3] rounded-[3px] bg-white p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hc-surface">
        <div>
          <h2 className="text-[17px] font-bold text-[#222222]">
            Painel Administrativo de Registros
          </h2>
          <p className="text-[12px] text-[#555555]">
            Administrador conectado: <strong>{user.email}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] rounded-[3px] cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Novo Produto</span>
          </button>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Importar</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={products.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] disabled:opacity-50 border border-[#cccccc] rounded-[3px] cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Exportar JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={products.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] disabled:opacity-50 border border-[#cccccc] rounded-[3px] cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#b91c1c] bg-white hover:bg-[#fef2f2] border border-[#fecaca] rounded-[3px] cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="px-4 py-2.5 bg-[#eef3fb] border border-[#c5d6f3] rounded-[3px] text-[13px] text-[#1351b4] flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-[12px] underline cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#d8dde3] rounded-[3px] bg-white p-4 hc-surface">
          <div className="text-[12px] font-medium text-[#555555]">
            Total de Produtos
          </div>
          <div className="text-[26px] font-bold text-[#1351b4] tabular-nums mt-1">
            {stats.total}
          </div>
        </div>
        <div className="border border-[#d8dde3] rounded-[3px] bg-white p-4 hc-surface">
          <div className="text-[12px] font-medium text-[#555555]">
            Registros Válidos
          </div>
          <div className="text-[26px] font-bold text-[#166534] tabular-nums mt-1">
            {stats.valid}
          </div>
        </div>
        <div className="border border-[#d8dde3] rounded-[3px] bg-white p-4 hc-surface">
          <div className="text-[12px] font-medium text-[#555555]">
            Vencendo em até 60 dias
          </div>
          <div className="text-[26px] font-bold text-[#b45309] tabular-nums mt-1">
            {stats.expiringSoon}
          </div>
        </div>
        <div className="border border-[#d8dde3] rounded-[3px] bg-white p-4 hc-surface">
          <div className="text-[12px] font-medium text-[#555555]">
            Expirados / Suspensos
          </div>
          <div className="text-[26px] font-bold text-[#b91c1c] tabular-nums mt-1">
            {stats.expiredOrSuspended}
          </div>
        </div>
      </div>

      {/* Expiring Soon Monitoring Box */}
      {expiringProducts.length > 0 && (
        <section className="border border-[#fde68a] rounded-[3px] bg-white overflow-hidden hc-surface">
          <div className="bg-[#fffbeb] border-b border-[#fde68a] px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#b45309]" aria-hidden="true" />
            <h3 className="text-[13px] font-bold text-[#92400e]">
              Monitoramento de Validade — Produtos Próximos do Vencimento (≤ 60 dias)
            </h3>
          </div>
          <div className="divide-y divide-[#fef3c7]">
            {expiringProducts.map((p) => {
              const days = getDaysUntilExpiration(p.expirationDate);
              return (
                <div
                  key={p.id}
                  className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[13px]"
                >
                  <div>
                    <span className="font-semibold text-[#222222]">{p.productName}</span>
                    <span className="text-[#666666] mx-2">·</span>
                    <span className="font-mono text-[12px] tabular-nums text-[#555555]">
                      {p.registrationNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold text-[#b45309] tabular-nums">
                      Vence em {formatDateBR(p.expirationDate)}{' '}
                      {days !== null &&
                        (days < 0
                          ? `(vencido há ${Math.abs(days)} dia(s))`
                          : `(faltam ${days} dia(s))`)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p);
                        setFormOpen(true);
                      }}
                      className="px-2.5 py-1 text-[12px] font-semibold text-[#1351b4] bg-[#eef3fb] hover:bg-[#dce6f7] border border-[#c5d6f3] rounded-[3px] cursor-pointer"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Database Search & Management Table */}
      <section className="border border-[#d8dde3] rounded-[3px] bg-white overflow-hidden hc-surface">
        <div className="bg-[#eef1f4] border-b border-[#d8dde3] px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hc-header-bar">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Buscar por nome, registro, SNB, processo ou fabricante..."
              className="w-full h-[34px] pl-9 pr-3 text-[13px] bg-white border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { value: 'all', label: 'Todos' },
                { value: 'valid', label: 'Válidos' },
                { value: 'expiring_soon', label: 'Vencendo' },
                { value: 'expired', label: 'Expirados' },
                { value: 'suspended', label: 'Suspensos' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`px-2.5 py-1 text-[12px] font-medium rounded-[3px] border cursor-pointer whitespace-nowrap ${
                  statusFilter === opt.value
                    ? 'bg-[#1351b4] text-white border-[#1351b4]'
                    : 'bg-white text-[#333333] border-[#ced4da] hover:bg-[#f0f0f0]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <div className="p-6 text-center text-[13px] text-[#555555]">
            Carregando base de registros...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#555555]">
            {products.length === 0
              ? 'Nenhum produto cadastrado ainda. Clique em "Novo Produto" ou "Importar" para adicionar registros.'
              : 'Nenhum registro corresponde aos filtros atuais.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#333333]">
                  <th className="py-2.5 px-4 font-semibold">Produto</th>
                  <th className="py-2.5 px-3 font-semibold">Nº Registro</th>
                  <th className="py-2.5 px-3 font-semibold">SNB / Processo</th>
                  <th className="py-2.5 px-3 font-semibold">Validade</th>
                  <th className="py-2.5 px-3 font-semibold">Situação</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9ecef]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f5f8fc]">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <ProductThumbnail
                          productId={p.id}
                          productName={p.productName}
                          imageUrl={p.imageUrl}
                          hasUploadedImage={p.hasUploadedImage}
                          className="w-9 h-9"
                        />
                        <div>
                          <div className="font-semibold text-[#222222]">
                            {p.productName}
                          </div>
                          <div className="text-[11px] text-[#666666]">
                            {p.manufacturerName} · {p.originCountry}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[12px] tabular-nums whitespace-nowrap">
                      {p.registrationNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[12px] tabular-nums whitespace-nowrap">
                      <div>SNB: {p.snbNumber}</div>
                      <div className="text-[11px] text-[#666666]">
                        Proc: {p.processNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums whitespace-nowrap text-[12px]">
                      <div>Reg: {formatDateBR(p.registrationDate)}</div>
                      <div>Venc: {formatDateBR(p.expirationDate)}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <StatusIndicator status={p.status} size="sm" />
                        <select
                          aria-label={`Alterar situação de ${p.productName}`}
                          value={p.status}
                          onChange={(e) =>
                            handleStatusChange(p, e.target.value as RegistrationStatus)
                          }
                          className="text-[11px] border border-[#ced4da] rounded-[3px] px-1.5 py-0.5 bg-white"
                        >
                          <option value="valid">Registro válido</option>
                          <option value="expired">Registro expirado</option>
                          <option value="suspended">Registro suspenso</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewProduct(p.id)}
                          title="Visualizar página de verificação"
                          className="p-1.5 text-[#1351b4] hover:bg-[#eef3fb] border border-[#d8dde3] rounded-[3px] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setFormOpen(true);
                          }}
                          title="Editar produto"
                          className="p-1.5 text-[#333333] hover:bg-[#eef1f4] border border-[#d8dde3] rounded-[3px] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          title="Excluir produto"
                          className="p-1.5 text-[#b91c1c] hover:bg-[#fef2f2] border border-[#fecaca] rounded-[3px] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      <ProductFormModal
        open={formOpen}
        editingProduct={editingProduct}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setActionFeedback(
            editingProduct
              ? 'Registro atualizado com sucesso na base.'
              : 'Novo produto cadastrado e publicado na base verificada.'
          );
          onRefresh();
        }}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={onRefresh}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#d8dde3] rounded-[3px] max-w-md w-full p-5 space-y-4 shadow-lg hc-surface">
            <h3 className="text-[15px] font-bold text-[#222222]">
              Confirmar Exclusão
            </h3>
            <p className="text-[13px] text-[#444444]">
              Deseja remover permanentemente o registro{' '}
              <strong>{deleteTarget.productName}</strong> ({deleteTarget.registrationNumber})?
              Esta ação não poderá ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-[13px] font-semibold text-white bg-[#b91c1c] hover:bg-[#991b1b] disabled:opacity-60 rounded-[3px] cursor-pointer"
              >
                {deleting ? 'Excluindo...' : 'Excluir Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
