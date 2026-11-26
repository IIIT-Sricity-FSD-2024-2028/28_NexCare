import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import { selectUser } from '../../store/authSlice';
import { enrichDoctorSession } from '../../store/directorySlices';

export default function DoctorPortal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (user?.id && !user.dept) dispatch(enrichDoctorSession());
  }, [dispatch, user?.id, user?.dept]);

  return <PortalLayout />;
}
