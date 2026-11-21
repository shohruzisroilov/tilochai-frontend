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
  isPremium?: boolean;
}

export default function Avatar({ name, avatarUrl, size = 40, isPremium = false }: AvatarProps) {
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

  const innerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const renderContent = () => {
    if (avatarUrl && !imgError) {
      return (
        <img
          src={avatarUrl}
          alt={name || 'Avatar'}
          style={{ ...innerStyle, objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <div
        aria-label={name}
        style={{
          ...innerStyle,
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
  };

  if (!isPremium) {
    return renderContent();
  }

  const crownSize = Math.max(14, Math.round(size * 0.36));
  const crownFont = Math.max(8, Math.round(size * 0.22));

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: '50%',
        padding: 2,
        background: 'linear-gradient(135deg, #F59E0B 0%, #FDE68A 50%, #D97706 100%)',
        boxShadow: '0 0 10px rgba(245, 158, 11, 0.45)',
      }}
    >
      {renderContent()}
      <span
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: crownSize,
          height: crownSize,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: crownFont,
          boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
          border: '1.5px solid var(--surface, #151128)',
          lineHeight: 1,
          zIndex: 2,
        }}
        aria-label="VIP"
      >
        👑
      </span>
    </div>
  );
}
