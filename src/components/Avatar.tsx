import React, { useState } from 'react';

const GRADIENTS = [
  'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)', // teal/cyan like screenshot
  'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)', // purple/blue
  'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', // pink/purple
  'linear-gradient(135deg, #10B981 0%, #059669 100%)', // emerald
  'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // amber/orange
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', // indigo/violet
  'linear-gradient(135deg, #0284C7 0%, #00B2FE 100%)', // electric sky
  'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)', // purple/fuchsia
];

interface AvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: number;
}

export default function Avatar({ name, avatarUrl, size = 40 }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const gradientIndex = name
    ? Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % GRADIENTS.length
    : 0;

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        style={{ ...baseStyle, objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      aria-label={name}
      style={{
        ...baseStyle,
        background: GRADIENTS[gradientIndex],
        color: '#fff',
        fontSize: size * 0.38,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      {initials}
    </div>
  );
}
