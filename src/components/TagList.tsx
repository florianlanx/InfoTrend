import React from 'react';
import { Tag, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagListProps {
  tags: string[];
  category?: string;
  onTagClick?: (tag: string) => void;
  onRegenerate?: (e: React.MouseEvent) => void;
  isRegenerating?: boolean;
  maxDisplay?: number;
  className?: string;
  regenerateTitle?: string;
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  category,
  onTagClick,
  onRegenerate,
  isRegenerating = false,
  maxDisplay = 5,
  className,
  regenerateTitle,
}) => {
  const displayTags = tags.slice(0, maxDisplay);
  const hasMore = tags.length > maxDisplay;

  // 只有当标签加载完成时才显示分类
  const showCategory = category && displayTags.length > 0;

  return (
    <div className={cn('flex flex-wrap gap-1.5 items-center animate-fade-in', className)}>
      {/* 分类标签 - 只在有实际标签时显示 */}
      {showCategory && (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border',
            'bg-wechat/10 border-wechat/30 text-wechat font-medium',
            'hover:bg-wechat/20 transition-all duration-300 hover:scale-105 cursor-default',
            'animate-scale-in'
          )}
          style={{ animationDelay: '0ms' }}
        >
          {category}
        </span>
      )}

      {/* 标签列表 */}
      {displayTags.map((tag, index) => (
        <span
          key={index}
          onClick={() => onTagClick?.(tag)}
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border',
            'bg-secondary border-border text-muted-foreground',
            'hover:bg-wechat/10 hover:border-wechat/30 hover:text-wechat',
            'transition-all duration-300 hover:scale-105 active:scale-95',
            'animate-scale-in cursor-pointer',
            onTagClick && 'cursor-pointer'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Tag className="w-2.5 h-2.5 inline-block mr-0.5" />
          {tag}
        </span>
      ))}

      {/* 更多标签指示 */}
      {hasMore && (
        <span 
          className="text-xs px-1 py-0.5 text-muted-foreground animate-fade-in"
          style={{ animationDelay: `${displayTags.length * 50}ms` }}
        >
          +{tags.length - maxDisplay}
        </span>
      )}

      {/* 重新生成按钮 */}
      {onRegenerate && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRegenerate(e);
          }}
          disabled={isRegenerating}
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border flex items-center gap-1',
            'bg-secondary border-border text-muted-foreground',
            'hover:bg-wechat/10 hover:border-wechat/30 hover:text-wechat',
            'transition-all duration-300 hover:scale-105 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
            'animate-scale-in'
          )}
          style={{ animationDelay: `${(displayTags.length + (hasMore ? 1 : 0)) * 50}ms` }}
          title={regenerateTitle}
        >
          {isRegenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};
