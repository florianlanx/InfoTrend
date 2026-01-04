import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  /** 是否显示 toast 通知 */
  showToast?: boolean;
  /** 自定义错误消息 */
  message?: string;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 统一错误处理 Hook
 * 提供一致的错误处理逻辑，包括日志记录和用户通知
 */
export function useErrorHandler() {
  /**
   * 处理错误
   * @param error - 错误对象
   * @param options - 处理选项
   */
  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const { showToast = true, message, onError } = options;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = message || errorObj.message || '操作失败，请重试';
    
    // 记录错误日志
    console.error('[ErrorHandler]', errorObj);
    
    // 显示 toast 通知
    if (showToast) {
      toast({
        variant: 'destructive',
        title: '出错了',
        description: errorMessage,
      });
    }
    
    // 调用自定义回调
    onError?.(errorObj);
  }, []);

  /**
   * 包装异步函数，自动处理错误
   * @param fn - 异步函数
   * @param options - 错误处理选项
   * @returns 包装后的函数
   */
  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: ErrorHandlerOptions = {}
  ): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined>) => {
    return async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, options);
        return undefined;
      }
    };
  }, [handleError]);

  /**
   * 安全执行异步操作
   * @param operation - 异步操作
   * @param fallback - 失败时的回退值
   * @param options - 错误处理选项
   * @returns 操作结果或回退值
   */
  const safeExecute = useCallback(async <T>(
    operation: () => Promise<T>,
    fallback: T,
    options: ErrorHandlerOptions = {}
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, options);
      return fallback;
    }
  }, [handleError]);

  return {
    handleError,
    withErrorHandling,
    safeExecute,
  };
}
