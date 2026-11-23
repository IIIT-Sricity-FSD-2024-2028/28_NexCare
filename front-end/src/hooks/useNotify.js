import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { addToast } from '../store/toastSlice';

export function useNotify() {
  const dispatch = useAppDispatch();
  return useCallback((messageOrOptions, type = 'info', duration = 3500) => {
    const options = typeof messageOrOptions === 'object' && messageOrOptions !== null
      ? messageOrOptions
      : { message: messageOrOptions, type, duration };
    dispatch(addToast(options));
  }, [dispatch]);
}
