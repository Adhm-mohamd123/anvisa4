import React, { useEffect, useState } from 'react';
import { fetchCosmeticImage } from '../services/cosmeticsService';

interface ProductThumbnailProps {
  productId: string;
  productName: string;
  imageUrl?: string;
  hasUploadedImage?: boolean;
  className?: string;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  productId,
  productName,
  imageUrl,
  hasUploadedImage,
  className = 'w-12 h-12',
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    imageUrl?.trim() ? imageUrl.trim() : null
  );
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErrored(false);

    if (hasUploadedImage) {
      fetchCosmeticImage(productId)
        .then((dataUrl) => {
          if (!cancelled) {
            if (dataUrl) {
              setResolvedSrc(dataUrl);
            } else if (imageUrl?.trim()) {
              setResolvedSrc(imageUrl.trim());
            } else {
              setResolvedSrc(null);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedSrc(imageUrl?.trim() || null);
          }
        });
    } else {
      setResolvedSrc(imageUrl?.trim() || null);
    }

    return () => {
      cancelled = true;
    };
  }, [productId, imageUrl, hasUploadedImage]);

  if (!resolvedSrc || errored) {
    return (
      <div
        className={`${className} rounded-[3px] border border-[#dce1e7] bg-[#f4f6f9] flex flex-col items-center justify-center text-[#1351b4] shrink-0 overflow-hidden`}
        aria-label={`Sem imagem para ${productName}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="opacity-75"
        >
          <rect x="8" y="3" width="8" height="3" rx="1" fill="currentColor" />
          <rect x="6" y="7" width="12" height="14" rx="2" fill="currentColor" />
          <rect x="8.5" y="10.5" width="7" height="6" rx="1" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={productName}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`${className} rounded-[3px] border border-[#dce1e7] object-cover bg-white shrink-0`}
    />
  );
};
