import React, { useState } from 'react';
import { Crown } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)', // teal/cyan
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

  // High-contrast, sharp vector badge sizing
  const badgeSize = Math.max(18, Math.round(size * 0.44));
  const iconSize = Math.max(11, Math.round(badgeSize * 0.62));

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: '50%',
        padding: 2.5,
        background: 'linear-gradient(135deg, #F59E0B 0%, #FDE68A 50%, #D97706 100%)',
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.55), 0 0 4px rgba(245, 158, 11, 0.3)',
      }}
    >
      {renderContent()}

      {/* Crisp vector VIP crown badge with deep contrast */}
      <div
        style={{
          position: 'absolute',
          bottom: -3,
          right: -3,
          width: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1E152E 0%, #0D0818 100%)',
          border: '1.5px solid #F59E0B',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 0 6px rgba(245, 158, 11, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
          boxSizing: 'border-box',
        }}
        title="VIP Member"
      >
        <Crown
          size={iconSize}
          color="#FDE68A"
          fill="#F59E0B"
          strokeWidth={1.75}
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
          }}
        />
      </div>
    </div>
  );
}
