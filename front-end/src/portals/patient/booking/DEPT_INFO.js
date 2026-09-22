// Icon + blurb per department on the wizard's step 1 (appointments.js DEPT_INFO).
export const DEPT_INFO = {
  'Cardiology': { icon: '❤️', desc: 'Heart care, ECG & cardiovascular diagnosis' },
  'Orthopaedics': { icon: '🦴', desc: 'Bone, joint, fracture care & surgery' },
  'Neurology': { icon: '🧠', desc: 'Brain, nerve disorders & stroke care' },
  'General Medicine': { icon: '🩺', desc: 'Primary health, fever & lifestyle care' },
  'Dermatology': { icon: '🧴', desc: 'Skin, hair, allergy & clinical dermatology' },
  'Paediatrics': { icon: '👶', desc: 'Child health, neonatal & adolescent care' },
  'ENT': { icon: '👂', desc: 'Ear, nose, throat diagnostics & treatment' },
  'Ophthalmology': { icon: '👁️', desc: 'Eye examinations & cataract consultations' },
  'Gynaecology & Obstetrics': { icon: '🤰', desc: 'Women’s health & maternal wellness' },
  'Gynaecology': { icon: '🤰', desc: 'Women’s health & maternal wellness' },
  'Pulmonology': { icon: '🫁', desc: 'Respiratory, asthma & lung care' },
  'Gastroenterology': { icon: '🔬', desc: 'Digestive & gastrointestinal evaluation' },
  'Emergency Medicine': { icon: '🚨', desc: '24x7 trauma triage & emergency response' },
};

export function deptInfo(name) {
  return DEPT_INFO[name] || { icon: '🏥', desc: `${name} consultations and specialised medical care` };
}
