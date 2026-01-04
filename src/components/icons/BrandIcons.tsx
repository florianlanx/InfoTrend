/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
import React from 'react';

interface IconProps {
  className?: string;
}

// GitHub Octocat 图标
export const GitHubIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Hacker News Y 图标
export const HackerNewsIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 0v24h24V0H0zm12.3 13.27l-3.63-7.27H10l2.73 5.73 2.73-5.73h1.33l-3.63 7.27v4.73h-1.33v-4.73z"/>
  </svg>
);

// ArXiv 图标 (简化的论文图标)
export const ArXivIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

// Dev.to 图标
export const DevToIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .65-.08.84-.23.21-.16.31-.44.31-.84v-2.22c0-.4-.1-.68-.31-.84zM0 0v24h24V0H0zm8.56 15.8c-.44.58-1.06.77-1.98.77H4V7.53h2.66c.93 0 1.54.18 1.97.75.43.55.64 1.3.64 2.26v2.98c0 .96-.21 1.72-.64 2.28h-.07zm4.93-9.77h-1.47v1.47h1.47V6.03zm.05 9.77h-1.52v-6.27h1.52v6.27zm6.46-4.69c0 1.08-.22 1.88-.66 2.42-.44.54-1.08.81-1.93.81-.85 0-1.49-.27-1.93-.81-.44-.54-.66-1.34-.66-2.42v-.73c0-1.08.22-1.88.66-2.42.44-.54 1.08-.81 1.93-.81.85 0 1.49.27 1.93.81.44.54.66 1.34.66 2.42v.73zm-1.52-.73c0-.65-.09-1.12-.26-1.41-.17-.29-.44-.44-.81-.44-.37 0-.64.15-.81.44-.17.29-.26.76-.26 1.41v.73c0 .65.09 1.12.26 1.41.17.29.44.44.81.44.37 0 .64-.15.81-.44.17-.29.26-.76.26-1.41v-.73z"/>
  </svg>
);

// Reddit 图标
export const RedditIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

// Product Hunt 图标
export const ProductHuntIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.805-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z"/>
  </svg>
);

// Echo JS 图标
export const EchoJSIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 0h24v24H0V0zm22.034 18.276l-4.108-2.372 4.108-2.372v4.744zm-9.091-5.248l4.1 2.367v-4.734l-4.1 2.367zm-1.886 0l-4.1-2.367v4.734l4.1-2.367zm-9.091 5.248v-4.744l4.108 2.372-4.108 2.372zm10.034-11.552l4.1 2.367V4.357l-4.1 2.367zm-1.886 0L5.014 4.357v4.734l5.1-2.367z"/>
  </svg>
);

// RSS 图标
export const RSSIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
  </svg>
);

// 通用外链图标
export const ExternalLinkIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

// 导出图标映射
import { SourceType } from '@/types/index.ts';

export const BrandIconMap: Record<SourceType, React.FC<IconProps>> = {
  GitHub: GitHubIcon,
  HackerNews: HackerNewsIcon,
  ArXiv: ArXivIcon,
  DevTo: DevToIcon,
  Reddit: RedditIcon,
  ProductHunt: ProductHuntIcon,
  EchoJS: EchoJSIcon,
  RSS: RSSIcon,
  Custom: ExternalLinkIcon,
};

// 获取品牌图标组件
export function getBrandIcon(source: SourceType): React.FC<IconProps> {
  return BrandIconMap[source] || ExternalLinkIcon;
}
