import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  favoriteTitle?: string;
  unfavoriteTitle?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  disabled = false,
  className,
  size = 'sm',
  favoriteTitle,
  unfavoriteTitle,
}) => {
  const sizeConfig = {
    sm: { button: 'w-5 h-5', icon: 'w-3.5 h-3.5' },
    md: { button: 'w-6 h-6', icon: 'w-4 h-4' },
    lg: { button: 'w-7 h-7', icon: 'w-5 h-5' },
  };

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'hover:scale-110 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        isFavorite
          ? 'text-yellow-500 hover:text-yellow-400'
          : 'text-gray-400 hover:text-yellow-500',
        sizeConfig[size].button,
        className
      )}
      title={isFavorite ? (unfavoriteTitle || '取消收藏') : (favoriteTitle || '收藏')}
    >
      <Star
        className={cn(
          'transition-all duration-200',
          sizeConfig[size].icon,
          isFavorite ? 'fill-current' : 'fill-none'
        )}
      />
    </button>
  );
};
