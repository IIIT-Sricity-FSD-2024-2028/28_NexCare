import { logActivity as logActivityThunk } from '../../store/activitySlice';

export default function logActivity(action, module, details, severity = 'INFO') {
  return logActivityThunk({ action, module, details, severity });
}
