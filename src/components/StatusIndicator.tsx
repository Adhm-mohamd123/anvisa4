import React from 'react';
import { CheckCircle2, XCircle, PauseCircle } from 'lucide-react';
import { getStatusLabel, type RegistrationStatus } from '../types/cosmetic';

interface StatusIndicatorProps {
  status: RegistrationStatus;
  size?: 'sm' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'sm',
}) => {
  const label = getStatusLabel(status);

  if (size === 'lg') {
    const styles: Record<RegistrationStatus, string> = {
      valid: 'bg-[#ecfdf3] border-[#a6f4c5] text-[#116329]',
      expired: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]',
      suspended: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]',
    };
    const Icon =
      status === 'valid'
        ? CheckCircle2
        : status === 'expired'
          ? XCircle
          : PauseCircle;

    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 border rounded-[3px] ${styles[status]}`}
      >
        <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
        <div>
          <div className="text-[15px] font-bold leading-tight">{label}</div>
          <div className="text-[12px] opacity-90 mt-0.5">
            {status === 'valid' &&
              'Produto com registro ativo na base verificada pela administração.'}
            {status === 'expired' &&
              'O prazo de validade deste registro encontra-se expirado.'}
            {status === 'suspended' &&
              'Registro temporariamente suspenso conforme atualização administrativa.'}
          </div>
        </div>
      </div>
    );
  }

  const textColors: Record<RegistrationStatus, string> = {
    valid: 'text-[#166534]',
    expired: 'text-[#b91c1c]',
    suspended: 'text-[#b45309]',
  };
  const Icon =
    status === 'valid'
      ? CheckCircle2
      : status === 'expired'
        ? XCircle
        : PauseCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap ${textColors[status]}`}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
