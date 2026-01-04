// 收藏项接口
export interface FavoriteItem {
  id: string;
  isFavorite: boolean;
  tags: string[];
  category: string;
  createdAt: number;
  updatedAt: number;
}

// AI 标签响应接口
export interface AITagResponse {
  tags: string[];
  category: string;
}

// 预定义分类
export type ContentCategory = 
  | 'AI' 
  | 'Development' 
  | 'News' 
  | 'Research' 
  | 'Product' 
  | 'Tutorial' 
  | 'Other';

// 分类标签映射
export const categoryLabels: Record<ContentCategory, string> = {
  AI: 'AI',
  Development: '开发',
  News: '新闻',
  Research: '研究',
  Product: '产品',
  Tutorial: '教程',
  Other: '其他',
};
