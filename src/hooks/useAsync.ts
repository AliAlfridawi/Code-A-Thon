import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Async operation state
 */
export interface AsyncState<TData> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: TData | null;
  error: Error | null;
}

/**
 * Custom hook for managing async operations with loading, success, and error states.
 * Handles automatic retries and cleanup on unmount.
 *
 * @template TData The type of data returned by the async function
 * @param asyncFunction The async function to execute
 * @param immediate Whether to execute immediately (default: true)
 * @param options Options for retry behavior and cleanup
 * @returns AsyncState object with status, data, error, and execute function
 *
 * @example
 * const { status, data, error, execute } = useAsync(fetchUsers, true, { maxRetries: 3 });
 */
export function useAsync<TData>(
  asyncFunction: () => Promise<TData>,
  immediate = true,
  options?: {
    maxRetries?: number;
    retryDelayMs?: number;
  }
) {
  const [state, setState] = useState<AsyncState<TData>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const retriesRef = useRef(0);
  const maxRetries = options?.maxRetries ?? 0;
  const retryDelayMs = options?.retryDelayMs ?? 1000;

  const execute = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null });

    try {
      const response = await asyncFunction();
      setState({ status: 'success', data: response, error: null });
      retriesRef.current = 0;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (retriesRef.current < maxRetries) {
        retriesRef.current++;
        console.warn(
          `Retry attempt ${retriesRef.current}/${maxRetries} after ${retryDelayMs}ms`,
          err
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        return execute(); // Recursive retry
      }

      setState({ status: 'error', data: null, error: err });
      console.error('Async operation failed:', err);
    }
  }, [asyncFunction, maxRetries, retryDelayMs]);

  useEffect(() => {
    if (!immediate) return;

    let isMounted = true;

    (async () => {
      if (isMounted) {
        await execute();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
  };
}
