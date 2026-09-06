import React, { useState } from 'react';
import { Box } from '@mui/material';
import { getImageUrl, getPlaceholderImage } from '../imageHelper';

/**
 * Smart Image component with fallback
 */
export default function SmartImage({
  src,
  alt = 'Image',
  type = 'unit',
  sx = {},
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = src ? getImageUrl(src) : null;
  const placeholderUrl = getPlaceholderImage(type);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <Box
      component="img"
      src={hasError || !imageUrl ? placeholderUrl : imageUrl}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.3s ease',
        ...sx,
      }}
      {...props}
    />
  );
}

