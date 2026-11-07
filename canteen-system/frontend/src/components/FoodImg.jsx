import { FALLBACK_IMG, imgSrc } from '../utils';

export default function FoodImg({ src, alt, className }) {
  return (
    <img
      className={className}
      src={imgSrc(src) || FALLBACK_IMG}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = FALLBACK_IMG;
      }}
    />
  );
}
