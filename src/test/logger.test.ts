import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../utils/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.error for error level', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    expect(spy).toHaveBeenCalledWith('[ERROR]', 'test error');
  });

  it('calls console.warn for warn level', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warning');
    expect(spy).toHaveBeenCalledWith('[WARN]', 'test warning');
  });

  it('handles multiple arguments', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('arg1', 'arg2', 123);
    expect(spy).toHaveBeenCalledWith('[ERROR]', 'arg1', 'arg2', 123);
  });
});
