import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDoctorDirectory, selectDoctorDirectory } from '../../store/patientSlice';

// The booking catalogue, held in the patient slice. One fetch per mount
// (doctor-directory.js hydrated once per page load). `catalogue` is [] until
// it resolves; `error` is set when the API is down. `loading` is also true
// before the first fetch has started, so a caller waiting for the directory
// never reads the empty initial state as "loaded".
export default function useDoctorDirectory() {
  const dispatch = useAppDispatch();
  const { catalogue, status, error } = useAppSelector(selectDoctorDirectory);

  useEffect(() => {
    dispatch(fetchDoctorDirectory());
  }, [dispatch]);

  return { catalogue, loading: status === 'idle' || status === 'loading', error: error || '' };
}
