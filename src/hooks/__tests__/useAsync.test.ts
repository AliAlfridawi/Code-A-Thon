import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
  it('should initialize with idle status', () => {
    const asyncFn = vi.fn();
    const { result } = renderHook(() => useAsync(asyncFn, false));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should execute async function immediately when immediate=true', async () => {
    const asyncFn = vi.fn().mockResolvedValue('test-data');
    const { result } = renderHook(() => useAsync(asyncFn, true));

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toBe('test-data');
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const testError = new Error('Test error');
    const asyncFn = vi.fn().mockRejectedValue(testError);
    const { result } = renderHook(() => useAsync(asyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toEqual(testError);
    expect(result.current.data).toBeNull();
  });

  it('should not execute when immediate=false', () => {
    const asyncFn = vi.fn();
    const { result } = renderHook(() => useAsync(asyncFn, false));

    expect(result.current.status).toBe('idle');
    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('should retry on failure', async () => {
    const asyncFn = vi.fn()
      .mockRejectedValueOnce(new Error('First attempt'))
      .mockResolvedValueOnce('success-data');

    const { result } = renderHook(() => useAsync(asyncFn, true, { maxRetries: 1, retryDelayMs: 10 }));

    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      { timeout: 2000 }
    );

    expect(result.current.data).toBe('success-data');
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('should provide isLoading, isError, isSuccess helpers', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn, true));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
