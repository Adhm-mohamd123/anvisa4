import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import {
  compressImageFile,
  createCosmeticProduct,
  fetchCosmeticImage,
  updateCosmeticProduct,
} from '../services/cosmeticsService';
import {
  normalizeDateInput,
  validateCosmeticInput,
  type CosmeticProduct,
  type CosmeticProductInput,
  type RegistrationStatus,
} from '../types/cosmetic';

interface ProductFormModalProps {
  open: boolean;
  editingProduct: CosmeticProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM: CosmeticProductInput = {
  productName: '',
  registrationNumber: '',
  snbNumber: '',
  processNumber: '',
  registrationDate: '',
  expirationDate: '',
  manufacturerName: '',
  originCountry: 'Brasil',
  status: 'valid',
  description: '',
  imageUrl: '',
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  editingProduct,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<CosmeticProductInput>(EMPTY_FORM);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [existingUploadedDataUrl, setExistingUploadedDataUrl] = useState<string | null>(null);
  const [removeUploadedImage, setRemoveUploadedImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitError(null);
    setUploadedDataUrl(null);
    setExistingUploadedDataUrl(null);
    setRemoveUploadedImage(false);

    if (editingProduct) {
      setForm({
        productName: editingProduct.productName,
        registrationNumber: editingProduct.registrationNumber,
        snbNumber: editingProduct.snbNumber,
        processNumber: editingProduct.processNumber,
        registrationDate: editingProduct.registrationDate,
        expirationDate: editingProduct.expirationDate,
        manufacturerName: editingProduct.manufacturerName,
        originCountry: editingProduct.originCountry,
        status: editingProduct.status,
        description: editingProduct.description,
        imageUrl: editingProduct.imageUrl,
      });

      if (editingProduct.hasUploadedImage) {
        fetchCosmeticImage(editingProduct.id)
          .then((url) => setExistingUploadedDataUrl(url))
          .catch(() => setExistingUploadedDataUrl(null));
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setForm({
        ...EMPTY_FORM,
        registrationDate: today,
      });
    }
  }, [open, editingProduct]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setSubmitError(null);
    try {
      const compressed = await compressImageFile(file);
      setUploadedDataUrl(compressed);
      setRemoveUploadedImage(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Erro ao processar imagem enviada.'
      );
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCosmeticInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSaving(true);

    try {
      if (editingProduct) {
        await updateCosmeticProduct(
          editingProduct.id,
          form,
          editingProduct.createdAt,
          {
            newImageDataUrl: uploadedDataUrl,
            removeUploadedImage,
            currentlyHasUploadedImage: editingProduct.hasUploadedImage,
          }
        );
      } else {
        await createCosmeticProduct(form, uploadedDataUrl);
      }
      onSaved();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar produto na base de dados.'
      );
    } finally {
      setSaving(false);
    }
  };

  const previewSrc =
    uploadedDataUrl ||
    (!removeUploadedImage ? existingUploadedDataUrl : null) ||
    (form.imageUrl.trim() ? form.imageUrl.trim() : null);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="bg-white border border-[#d8dde3] rounded-[3px] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-lg hc-surface">
        <div className="bg-[#eef1f4] border-b border-[#d8dde3] px-5 py-3 flex items-center justify-between hc-header-bar">
          <h2 id="product-modal-title" className="text-[15px] font-bold text-[#333333]">
            {editingProduct ? 'Editar Registro de Cosmético' : 'Cadastrar Novo Produto Cosmético'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-1 text-[#555555] hover:text-[#111111] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto p-5 space-y-4">
          {submitError && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[3px] text-[13px] text-[#991b1b]">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className="w-full h-[36px] px-3 text-[13px] border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.productName && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Número do Registro *
              </label>
              <input
                type="text"
                required
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm({ ...form, registrationNumber: e.target.value })
                }
                placeholder="Ex.: 25351.000123/2026-45"
                className="w-full h-[36px] px-3 text-[13px] font-mono tabular-nums border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.registrationNumber && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.registrationNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Número SNB / CNPJ da Empresa *
              </label>
              <input
                type="text"
                required
                value={form.snbNumber}
                onChange={(e) => setForm({ ...form, snbNumber: e.target.value })}
                placeholder="Ex.: 00.000.000/0000-00 ou SNB-049182-BR"
                className="w-full h-[36px] px-3 text-[13px] font-mono tabular-nums border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.snbNumber && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.snbNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Número do Processo *
              </label>
              <input
                type="text"
                required
                value={form.processNumber}
                onChange={(e) => setForm({ ...form, processNumber: e.target.value })}
                placeholder="Ex.: 25351.492810/2025-11"
                className="w-full h-[36px] px-3 text-[13px] font-mono tabular-nums border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.processNumber && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.processNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Situação do Registro *
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RegistrationStatus })
                }
                className="w-full h-[36px] px-3 text-[13px] border border-[#ced4da] rounded-[3px] bg-white focus:outline-none focus:border-[#1351b4]"
              >
                <option value="valid">Registro válido</option>
                <option value="expired">Registro expirado</option>
                <option value="suspended">Registro suspenso</option>
              </select>
              {errors.status && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.status}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Data de Registro *
              </label>
              <input
                type="date"
                required
                value={form.registrationDate}
                onChange={(e) =>
                  setForm({ ...form, registrationDate: e.target.value })
                }
                className="w-full h-[36px] px-3 text-[13px] tabular-nums border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.registrationDate && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.registrationDate}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[13px] font-semibold text-[#333333]">
                  Data de Vencimento *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const base = normalizeDateInput(form.registrationDate) || new Date().toISOString().slice(0, 10);
                    const [y, m, d] = base.split('-').map(Number);
                    if (y && m && d) {
                      const nextDate = `${y + 5}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      setForm({ ...form, registrationDate: base, expirationDate: nextDate });
                    }
                  }}
                  className="text-[11px] text-[#1351b4] hover:underline font-medium cursor-pointer"
                >
                  +5 anos do registro
                </button>
              </div>
              <input
                type="date"
                required
                value={form.expirationDate}
                onChange={(e) =>
                  setForm({ ...form, expirationDate: e.target.value })
                }
                className="w-full h-[36px] px-3 text-[13px] tabular-nums border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.expirationDate && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.expirationDate}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Empresa Fabricante *
              </label>
              <input
                type="text"
                required
                value={form.manufacturerName}
                onChange={(e) =>
                  setForm({ ...form, manufacturerName: e.target.value })
                }
                className="w-full h-[36px] px-3 text-[13px] border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.manufacturerName && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.manufacturerName}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                País de Origem *
              </label>
              <input
                type="text"
                required
                value={form.originCountry}
                onChange={(e) =>
                  setForm({ ...form, originCountry: e.target.value })
                }
                className="w-full h-[36px] px-3 text-[13px] border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.originCountry && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.originCountry}</p>
              )}
            </div>

            {/* Image Upload & Optional URL */}
            <div className="md:col-span-2 border border-[#dee2e6] rounded-[3px] p-3.5 bg-[#f8f9fa]">
              <span className="block text-[13px] font-semibold text-[#333333] mb-2">
                Imagem do Produto
              </span>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-24 h-24 rounded-[3px] border border-[#ced4da] bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt="Pré-visualização do produto"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-[#777777] text-center px-2">
                      Sem imagem
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#1351b4] bg-white hover:bg-[#eef3fb] border border-[#1351b4] rounded-[3px] cursor-pointer">
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {compressing ? 'Processando...' : 'Enviar Arquivo de Imagem'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>

                    {previewSrc && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedDataUrl(null);
                          setRemoveUploadedImage(true);
                          setForm({ ...form, imageUrl: '' });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-[#b91c1c] bg-white hover:bg-[#fef2f2] border border-[#fecaca] rounded-[3px] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Remover Imagem</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#555555] mb-1">
                      Ou informe uma URL externa (opcional):
                    </label>
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full h-[32px] px-2.5 text-[12px] border border-[#ced4da] rounded-[3px] bg-white focus:outline-none focus:border-[#1351b4]"
                    />
                    {errors.imageUrl && (
                      <p className="text-[11px] text-[#b91c1c] mt-1">{errors.imageUrl}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                Descrição do Produto
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes da formulação, apresentação, categoria cosmética e observações..."
                className="w-full p-2.5 text-[13px] border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1351b4]"
              />
              {errors.description && (
                <p className="text-[11px] text-[#b91c1c] mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#d8dde3] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || compressing}
              className="px-5 py-1.5 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] disabled:opacity-60 rounded-[3px] cursor-pointer"
            >
              {saving
                ? 'Salvando...'
                : editingProduct
                  ? 'Salvar Alterações'
                  : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
