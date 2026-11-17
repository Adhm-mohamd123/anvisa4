import React, { useState } from 'react';
import { X, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { createCosmeticProduct } from '../services/cosmeticsService';
import {
  normalizeDateInput,
  validateCosmeticInput,
  type CosmeticProductInput,
  type RegistrationStatus,
} from '../types/cosmetic';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeStatus(raw: string): RegistrationStatus {
  const val = raw.trim().toLowerCase();
  if (val === 'valid' || val.includes('válido') || val.includes('valido')) return 'valid';
  if (val === 'expired' || val.includes('expirado')) return 'expired';
  if (val === 'suspended' || val.includes('suspenso')) return 'suspended';
  return 'valid';
}

export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onClose,
  onImported,
}) => {
  const [parsedItems, setParsedItems] = useState<CosmeticProductInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleDownloadCsvTemplate = () => {
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
    ].join(',');
    const example = [
      '"Creme Hidratante Exemplo"',
      '"25351.000001/2026-00"',
      '"SNB-000100-BR"',
      '"25351.100200/2025-10"',
      '"2026-01-15"',
      '"2031-01-15"',
      '"Laboratório Cosmético Exemplo Ltda"',
      '"Brasil"',
      '"valid"',
      '"Descrição técnica do produto cosmético."',
      '""',
    ].join(',');

    const blob = new Blob([`${headers}\n${example}\n`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_cosmeticos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setResultMessage(null);

    const reader = new FileReader();
    reader.onerror = () => setParseError('Falha ao ler o arquivo selecionado.');
    reader.onload = () => {
      try {
        const text = String(reader.result || '').trim();
        if (!text) {
          setParseError('O arquivo está vazio.');
          return;
        }

        let candidates: CosmeticProductInput[] = [];

        if (file.name.toLowerCase().endsWith('.json') || text.startsWith('[') || text.startsWith('{')) {
          const json = JSON.parse(text);
          const arr = Array.isArray(json) ? json : [json];
          candidates = arr.map((item) => ({
            productName: String(item.productName ?? ''),
            registrationNumber: String(item.registrationNumber ?? ''),
            snbNumber: String(item.snbNumber ?? ''),
            processNumber: String(item.processNumber ?? ''),
            registrationDate: normalizeDateInput(String(item.registrationDate ?? '')),
            expirationDate: normalizeDateInput(String(item.expirationDate ?? '')),
            manufacturerName: String(item.manufacturerName ?? ''),
            originCountry: String(item.originCountry ?? ''),
            status: normalizeStatus(String(item.status ?? 'valid')),
            description: String(item.description ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
          }));
        } else {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            setParseError('O arquivo CSV precisa conter cabeçalho e ao menos uma linha de dados.');
            return;
          }
          const headers = parseCsvLine(lines[0]).map((h) => h.trim());
          candidates = lines.slice(1).map((line) => {
            const cols = parseCsvLine(line);
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => {
              row[h] = cols[idx] ?? '';
            });
            return {
              productName: row.productName || '',
              registrationNumber: row.registrationNumber || '',
              snbNumber: row.snbNumber || '',
              processNumber: row.processNumber || '',
              registrationDate: normalizeDateInput(row.registrationDate || ''),
              expirationDate: normalizeDateInput(row.expirationDate || ''),
              manufacturerName: row.manufacturerName || '',
              originCountry: row.originCountry || '',
              status: normalizeStatus(row.status || 'valid'),
              description: row.description || '',
              imageUrl: row.imageUrl || '',
            };
          });
        }

        const validItems: CosmeticProductInput[] = [];
        let invalidCount = 0;
        for (const item of candidates) {
          const errs = validateCosmeticInput(item);
          if (Object.keys(errs).length === 0) {
            validItems.push(item);
          } else {
            invalidCount++;
          }
        }

        if (validItems.length === 0) {
          setParseError(
            `Nenhum registro válido encontrado no arquivo (${invalidCount} linha(s) inválida(s)). Verifique o formato das datas (AAAA-MM-DD) e os campos obrigatórios.`
          );
          setParsedItems([]);
          return;
        }

        if (invalidCount > 0) {
          setParseError(
            `${invalidCount} registro(s) ignorado(s) por campos inválidos. ${validItems.length} registro(s) pronto(s) para importação.`
          );
        }

        setParsedItems(validItems);
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : 'Formato de arquivo JSON ou CSV inválido.'
        );
        setParsedItems([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);
    setParseError(null);
    let successCount = 0;

    try {
      for (const item of parsedItems) {
        await createCosmeticProduct(item);
        successCount++;
      }
      setResultMessage(`${successCount} registro(s) importado(s) com sucesso para a base.`);
      setParsedItems([]);
      onImported();
    } catch (err) {
      setParseError(
        err instanceof Error
          ? `Importação interrompida após ${successCount} registro(s): ${err.message}`
          : 'Erro durante a importação em lote.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="bg-white border border-[#d8dde3] rounded-[3px] w-full max-w-xl overflow-hidden shadow-lg hc-surface">
        <div className="bg-[#eef1f4] border-b border-[#d8dde3] px-5 py-3 flex items-center justify-between hc-header-bar">
          <h2 id="import-modal-title" className="text-[15px] font-bold text-[#333333]">
            Importar Registros (JSON ou CSV)
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

        <div className="p-5 space-y-4 text-[13px]">
          <p className="text-[#444444] leading-relaxed">
            Envie um arquivo <strong>.json</strong> ou <strong>.csv</strong> contendo os campos de
            registro de cosméticos. Todos os registros serão validados antes da gravação na base.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] rounded-[3px] cursor-pointer">
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Selecionar Arquivo (.json / .csv)</span>
              <input
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Baixar Modelo CSV</span>
            </button>
          </div>

          {parseError && (
            <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-[3px] text-[#92400e] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{parseError}</span>
            </div>
          )}

          {resultMessage && (
            <div className="p-3 bg-[#ecfdf3] border border-[#a6f4c5] rounded-[3px] text-[#116329] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{resultMessage}</span>
            </div>
          )}

          {parsedItems.length > 0 && (
            <div className="p-3 bg-[#f8f9fa] border border-[#dee2e6] rounded-[3px]">
              <p className="font-semibold text-[#222222]">
                {parsedItems.length} registro(s) válido(s) prontos para gravação:
              </p>
              <ul className="mt-1.5 space-y-1 max-h-36 overflow-y-auto text-[12px] text-[#444444]">
                {parsedItems.slice(0, 10).map((item, idx) => (
                  <li key={idx} className="truncate">
                    • {item.productName} ({item.registrationNumber})
                  </li>
                ))}
                {parsedItems.length > 10 && (
                  <li className="text-[#666666]">
                    ... e mais {parsedItems.length - 10} registro(s).
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t border-[#d8dde3] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={parsedItems.length === 0 || importing}
              onClick={handleImport}
              className="px-5 py-1.5 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] disabled:opacity-50 rounded-[3px] cursor-pointer"
            >
              {importing ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
