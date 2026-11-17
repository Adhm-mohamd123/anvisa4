import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface PortalCategoryGridProps {
  onSelectCosmetics: () => void;
  onFilterStatus: (
    status: 'all' | 'valid' | 'expired' | 'suspended' | 'expiring_soon'
  ) => void;
  onFocusSearchField: (
    field: 'productName' | 'registrationNumber' | 'snbNumber' | 'processNumber'
  ) => void;
  onNavigate: (hash: string) => void;
}

interface TileItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const iconColor = 'text-[#1b5ca7]';

/* Crisp SVG icons matching every tile in the reference screenshot */
const Icons = {
  DocumentLines: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="8" y="4" width="20" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="11" x2="24" y2="11" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="21" x2="24" y2="21" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="26" x2="19" y2="26" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  FolderDoc: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M13 5h12l4 4v15H13V5z" fill="#ffffff" stroke="currentColor" strokeWidth="1.7" />
      <line x1="16.5" y1="11" x2="25.5" y2="11" stroke="currentColor" strokeWidth="1.6" />
      <line x1="16.5" y1="15" x2="25.5" y2="15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 13h11l3 3h13l-3.5 14H5V13z" fill="currentColor" />
    </svg>
  ),
  SeiText: () => (
    <span className="text-[22px] font-extrabold tracking-tight text-[#1b5ca7] select-none">
      sei!
    </span>
  ),
  SolidFolder: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M4 9c0-1.1.9-2 2-2h9l3 3h14c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V9z" fill="currentColor" />
    </svg>
  ),
  DocCheck: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M8 5h14l5 5v20H8V5z" stroke="currentColor" strokeWidth="1.8" fill="#ffffff" />
      <line x1="12" y1="13" x2="23" y2="13" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="23" x2="18" y2="23" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="25.5" cy="25.5" r="5.5" fill="#ffffff" stroke="currentColor" strokeWidth="1.8" />
      <path d="M23 25.5l1.7 1.7 3.3-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  WarningTriangle: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M18 5L33 30H3L18 5z" fill="currentColor" />
      <rect x="16.7" y="13.5" width="2.6" height="9" rx="1" fill="#ffffff" />
      <circle cx="18" cy="25.8" r="1.5" fill="#ffffff" />
    </svg>
  ),
  CertOutline: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="8" y="4" width="20" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="#ffffff" />
      <line x1="12" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="14.5" x2="24" y2="14.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="22.5" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 26v4l2-1.2 2 1.2v-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  CertSolid: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M10 5h13l5 5v20H10V5z" fill="currentColor" />
      <line x1="14" y1="13" x2="24" y2="13" stroke="#ffffff" strokeWidth="1.7" />
      <line x1="14" y1="17.5" x2="24" y2="17.5" stroke="#ffffff" strokeWidth="1.7" />
      <circle cx="12.5" cy="23.5" r="4.5" fill="#ffffff" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 27.5v4.5l2-1.2 2 1.2v-4.5" fill="currentColor" />
    </svg>
  ),
  FactoryCompany: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M5 31V15l7 5v-5l7 5V7h6v24H5z" fill="currentColor" />
      <rect x="8" y="22" width="3" height="3" fill="#ffffff" />
      <rect x="13" y="22" width="3" height="3" fill="#ffffff" />
      <circle cx="29.5" cy="14" r="3" fill="currentColor" />
      <path d="M24.5 26c0-3 2.2-5 5-5s5 2 5 5v5h-10v-5z" fill="currentColor" />
    </svg>
  ),
  CameraMonitor: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M6 10h21l5 7H11l-5-7z" fill="currentColor" />
      <rect x="9" y="17" width="14" height="5" rx="1" fill="currentColor" />
      <path d="M12 22v5h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M27 21c2 0 3.5 1.5 3.5 3.5S29 28 27 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  DocQuestion: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M9 5h13l5 5v21H9V5z" stroke="currentColor" strokeWidth="1.8" fill="#ffffff" />
      <path d="M15.2 14.8a3 3 0 115.2 2c0 1.4-2 2-2 3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18.4" cy="24.2" r="1.3" fill="currentColor" />
    </svg>
  ),
  DocMagnifier: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="6" y="5" width="18" height="25" rx="1.5" stroke="currentColor" strokeWidth="1.7" fill="#ffffff" />
      <line x1="10" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.6" />
      <line x1="10" y1="15.5" x2="20" y2="15.5" stroke="currentColor" strokeWidth="1.6" />
      <line x1="10" y1="20" x2="17" y2="20" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="21" r="5" fill="#ffffff" stroke="currentColor" strokeWidth="2" />
      <line x1="27.8" y1="24.8" x2="32.5" y2="29.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  QueueList: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <text x="6" y="13" fill="currentColor" fontSize="8" fontWeight="bold">1</text>
      <text x="6" y="21" fill="currentColor" fontSize="8" fontWeight="bold">2</text>
      <text x="6" y="29" fill="currentColor" fontSize="8" fontWeight="bold">3</text>
      <line x1="14" y1="10" x2="29" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="18" x2="29" y2="18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="26" x2="29" y2="26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  ScaleDoc: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="8" y="5" width="20" height="26" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="#ffffff" />
      <line x1="12" y1="13" x2="24" y2="13" stroke="currentColor" strokeWidth="1.7" />
      <line x1="18" y1="10" x2="18" y2="22" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 18h4l-2-4-2 4zM21 18h4l-2-4-2 4z" fill="currentColor" />
      <line x1="14" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  Checklist: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="7" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="7" y="16" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="7" y="24" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
      <line x1="15" y1="10.5" x2="29" y2="10.5" stroke="currentColor" strokeWidth="2.2" />
      <line x1="15" y1="18.5" x2="29" y2="18.5" stroke="currentColor" strokeWidth="2.2" />
      <line x1="15" y1="26.5" x2="29" y2="26.5" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  ),
  BarcodeUdi: () => (
    <svg width="46" height="34" viewBox="0 0 46 34" fill="none" className={iconColor} aria-hidden="true">
      <rect x="4" y="6" width="2.2" height="17" fill="currentColor" />
      <rect x="7.5" y="6" width="1.2" height="17" fill="currentColor" />
      <rect x="10.5" y="6" width="2.8" height="17" fill="currentColor" />
      <rect x="15" y="6" width="1.2" height="17" fill="currentColor" />
      <rect x="18" y="6" width="2" height="17" fill="currentColor" />
      <rect x="21.5" y="6" width="3" height="17" fill="currentColor" />
      <rect x="26" y="6" width="1.4" height="17" fill="currentColor" />
      <rect x="29" y="6" width="2.4" height="17" fill="currentColor" />
      <rect x="33" y="6" width="1.2" height="17" fill="currentColor" />
      <rect x="36" y="6" width="2.5" height="17" fill="currentColor" />
      <rect x="40" y="6" width="1.8" height="17" fill="currentColor" />
      <text x="5" y="29" fill="currentColor" fontSize="6" fontFamily="monospace">0 0000 00000 0</text>
    </svg>
  ),
  FoodBowl: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M7 19h24c0 6.8-5.4 11-12 11S7 25.8 7 19z" fill="currentColor" />
      <path d="M19 6v11M15 9l4 4 4-4M13 13l6 4 6-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  CosmeticsBottles: () => (
    <svg width="40" height="36" viewBox="0 0 40 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M11 8H15V11H11V8Z" fill="currentColor" />
      <path d="M12.2 5H16.5V7H12.2V5Z" fill="currentColor" />
      <rect x="8.5" y="11.5" width="9" height="18.5" rx="2" fill="currentColor" />
      <rect x="10.2" y="16" width="5.6" height="7.5" rx="0.8" fill="#ffffff" />
      <rect x="20.5" y="20" width="9" height="3" rx="0.8" fill="currentColor" />
      <rect x="20" y="23.5" width="10" height="6.5" rx="1.5" fill="currentColor" />
      <path d="M31.5 10H36.5L35.4 26.5H32.6L31.5 10Z" fill="currentColor" />
      <rect x="32.7" y="27" width="2.6" height="3" rx="0.5" fill="currentColor" />
    </svg>
  ),
  ClinicalFlask: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M14 6h7v6l6 13c.6 1.3-.3 3-1.8 3H9.8c-1.5 0-2.4-1.7-1.8-3l6-13V6z" stroke="currentColor" strokeWidth="2" fill="#ffffff" />
      <path d="M11 22h13l2 4H9l2-4z" fill="currentColor" />
      <circle cx="24" cy="14" r="4" fill="#ffffff" stroke="currentColor" strokeWidth="1.8" />
      <line x1="27" y1="17" x2="31" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  PillCapsule: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <g transform="rotate(-45 18 18)">
        <rect x="12" y="5" width="12" height="26" rx="6" stroke="currentColor" strokeWidth="2" fill="#ffffff" />
        <path d="M12 18h12v7a6 6 0 01-12 0v-7z" fill="currentColor" />
      </g>
    </svg>
  ),
  BotanicalBottle: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="14" y="6" width="8" height="4" rx="1" fill="currentColor" />
      <rect x="11" y="11" width="14" height="19" rx="2" fill="currentColor" />
      <path d="M18 15c3 2.5 3.5 6 0 9-3.5-3-3-6.5 0-9z" fill="#ffffff" />
    </svg>
  ),
  Stethoscope: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M10 7v8a6 6 0 0012 0V7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 21v4a5 5 0 0010 0v-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="26" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="#ffffff" />
    </svg>
  ),
  SprayBottle: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={iconColor} aria-hidden="true">
      <path d="M13 7h8l2 3h-6v3h-4V7z" fill="currentColor" />
      <path d="M13 13h8l2 17H11l2-17z" fill="currentColor" />
      <rect x="13.5" y="18" width="7" height="7" rx="0.8" fill="#ffffff" />
    </svg>
  ),
  CigaretteIcon: () => (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className={iconColor} aria-hidden="true">
      <rect x="6" y="20" width="20" height="5" fill="currentColor" />
      <rect x="27" y="20" width="5" height="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M29 17c0-2.5 2.5-2.5 2.5-5s-2.5-2.5-2.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const TileButton: React.FC<{ tile: TileItem }> = ({ tile }) => (
  <button
    type="button"
    onClick={tile.onClick}
    className="group flex flex-col border border-[#dcdcdc] rounded-[2px] overflow-hidden text-center transition-colors cursor-pointer bg-[#fafafa] hover:border-[#1b5ca7] hc-surface"
  >
    <div className="flex items-center justify-center h-[84px] px-3 bg-[#fafafa] group-hover:bg-[#f2f6fb] transition-colors">
      <div className="scale-[1.28] transition-transform duration-150 group-hover:scale-[1.35]">
        {tile.icon}
      </div>
    </div>
    <div className="w-full min-h-[40px] px-2 py-1.5 bg-[#f0f2f5] group-hover:bg-[#e3ebf7] border-t border-[#e5e7eb] flex items-center justify-center transition-colors">
      <span className="text-[11px] font-medium text-[#444444] leading-[1.25]">
        {tile.label}
      </span>
    </div>
  </button>
);

export const PortalCategoryGrid: React.FC<PortalCategoryGridProps> = ({
  onSelectCosmetics,
  onFilterStatus,
  onFocusSearchField,
  onNavigate,
}) => {
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);

  const documentosTiles: TileItem[] = [
    {
      id: 'bulario',
      label: 'Bulário Eletrônico',
      icon: <Icons.DocumentLines />,
      onClick: onSelectCosmetics,
    },
    {
      id: 'parecer',
      label: 'Parecer de Avaliação de Produtos',
      icon: <Icons.FolderDoc />,
      onClick: () => onFocusSearchField('productName'),
    },
    {
      id: 'sei',
      label: 'Pesquisa Pública',
      icon: <Icons.SeiText />,
      onClick: onSelectCosmetics,
    },
    {
      id: 'situacao-docs',
      label: 'Situação de Documentos',
      icon: <Icons.SolidFolder />,
      onClick: () => onFocusSearchField('processNumber'),
    },
    {
      id: 'validacao-docs',
      label: 'Validação de Documentos',
      icon: <Icons.DocCheck />,
      onClick: () => onFocusSearchField('registrationNumber'),
    },
  ];

  const empresasTiles: TileItem[] = [
    {
      id: 'alertas',
      label: 'Alertas de Validade',
      icon: <Icons.WarningTriangle />,
      onClick: () => onFilterStatus('expiring_soon'),
    },
    {
      id: 'cert-boas',
      label: 'Certificados de Boas Práticas',
      icon: <Icons.CertOutline />,
      onClick: () => onFilterStatus('valid'),
    },
    {
      id: 'cert-cosmeticos',
      label: 'Registros Válidos de Cosméticos',
      icon: <Icons.CertSolid />,
      onClick: () => onFilterStatus('valid'),
    },
    {
      id: 'funcionamento',
      label: 'Funcionamento de Empresa (SNB)',
      icon: <Icons.FactoryCompany />,
      onClick: () => onFocusSearchField('snbNumber'),
    },
    {
      id: 'irregulares',
      label: 'Produtos Suspensos / Expirados',
      icon: <Icons.CameraMonitor />,
      onClick: () => onFilterStatus('suspended'),
    },
  ];

  const infoRegulatoriasTiles: TileItem[] = [
    {
      id: 'assuntos',
      label: 'Consulta de Assuntos',
      icon: <Icons.DocQuestion />,
      onClick: () => onNavigate('#/sobre'),
    },
    {
      id: 'nomes-tecnicos',
      label: 'Consulta de Nomes de Produtos',
      icon: <Icons.DocMagnifier />,
      onClick: () => onFocusSearchField('productName'),
    },
    {
      id: 'fila-analise',
      label: 'Base Completa de Registros',
      icon: <Icons.QueueList />,
      onClick: () => onFilterStatus('all'),
    },
    {
      id: 'criterios-base',
      label: 'Critérios e Regras da Base',
      icon: <Icons.ScaleDoc />,
      onClick: () => onNavigate('#/sobre'),
    },
    {
      id: 'lista-analise',
      label: 'Lista de Registros Ativos',
      icon: <Icons.Checklist />,
      onClick: () => onFilterStatus('valid'),
    },
    {
      id: 'udi-di',
      label: 'Consulta por SNB / Código',
      icon: <Icons.BarcodeUdi />,
      onClick: () => onFocusSearchField('snbNumber'),
    },
  ];

  const produtosTiles: TileItem[] = [
    {
      id: 'alimentos',
      label: 'Alimentos',
      icon: <Icons.FoodBowl />,
      onClick: () => setCategoryNotice('Alimentos'),
    },
    {
      id: 'cosmeticos',
      label: 'Cosméticos',
      icon: <Icons.CosmeticsBottles />,
      onClick: onSelectCosmetics,
    },
    {
      id: 'ensaios',
      label: 'Ensaios Clínicos',
      icon: <Icons.ClinicalFlask />,
      onClick: () => setCategoryNotice('Ensaios Clínicos'),
    },
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      icon: <Icons.PillCapsule />,
      onClick: () => setCategoryNotice('Medicamentos'),
    },
    {
      id: 'naturais',
      label: 'Produtos Naturais',
      icon: <Icons.BotanicalBottle />,
      onClick: () => setCategoryNotice('Produtos Naturais'),
    },
    {
      id: 'saude',
      label: 'Produtos para Saúde',
      icon: <Icons.Stethoscope />,
      onClick: () => setCategoryNotice('Produtos para Saúde'),
    },
    {
      id: 'saneantes',
      label: 'Saneantes',
      icon: <Icons.SprayBottle />,
      onClick: () => setCategoryNotice('Saneantes'),
    },
    {
      id: 'tabaco',
      label: 'Tabaco',
      icon: <Icons.CigaretteIcon />,
      onClick: () => setCategoryNotice('Tabaco'),
    },
  ];

  const sections: { title: string; tiles: TileItem[] }[] = [
    { title: 'Documentos', tiles: documentosTiles },
    {
      title: 'Empresas, Fiscalização e Monitoramento de Produtos',
      tiles: empresasTiles,
    },
    { title: 'Informações Regulatórias', tiles: infoRegulatoriasTiles },
    { title: 'Produtos', tiles: produtosTiles },
  ];

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section
          key={section.title}
          className="border border-[#dcdcdc] rounded-[2px] bg-white overflow-hidden hc-surface"
        >
          <div className="bg-[#eaedf0] border-b border-[#dcdcdc] py-2 px-4 text-center hc-header-bar">
            <h2 className="text-[13px] font-medium text-[#444444]">
              {section.title}
            </h2>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {section.tiles.map((tile) => (
              <TileButton key={tile.id} tile={tile} />
            ))}
          </div>
        </section>
      ))}

      {categoryNotice && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#dcdcdc] rounded-[3px] max-w-md w-full overflow-hidden shadow-lg hc-surface">
            <div className="bg-[#eaedf0] border-b border-[#dcdcdc] px-4 py-2.5 flex items-center justify-between hc-header-bar">
              <h3 className="text-[14px] font-semibold text-[#333333]">
                Categoria: {categoryNotice}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryNotice(null)}
                aria-label="Fechar"
                className="p-1 text-[#555555] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-[13px] text-[#444444]">
              <p className="leading-relaxed">
                Atualmente, esta base independente de verificação está dedicada ao módulo de{' '}
                <strong>Cosméticos — Produtos Registrados</strong>. Todas as consultas de registro,
                código SNB, número do processo e situação de validade estão disponíveis na seção de
                Cosméticos.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryNotice(null)}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryNotice(null);
                    onSelectCosmetics();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] rounded-[3px] cursor-pointer"
                >
                  <span>Consultar Cosméticos</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
