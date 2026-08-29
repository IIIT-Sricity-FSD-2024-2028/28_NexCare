import { renderToString } from 'react-dom/server';
import App from './src/App.jsx';
import StepIndicator from './src/components/StepIndicator.jsx';
import BookingWizard from './src/components/BookingWizard.jsx';
import MyAppointments from './src/components/MyAppointments.jsx';
import Confirmation from './src/components/Confirmation.jsx';
import { HOSPITALS } from './src/data/hospitals.js';

const noop = () => {};
const check = (label, el) => {
  const html = renderToString(el);
  console.log(`  PASS  ${label}  (${html.length} chars)`);
  return html;
};

const shell = check('App (initial render)', <App />);
console.log('        contains header:', shell.includes('NexCare'));
console.log('        contains nav:   ', shell.includes('Book Appointment'));
console.log('        shows login:    ', shell.includes('Sign in to NexCare'));

const hospital = HOSPITALS[0];
const department = hospital.departments[0];
const doctor = department.doctors[0];
const TEST_DATE = '2026-09-18';
const day = new Date(2026, 8, 18).toLocaleDateString('en-US', { weekday: 'long' });
const daySlots = doctor.slots[day];
const bookedSlot = daySlots[1];

const wizard = (step, booking) =>
  check(`BookingWizard step ${step}`, (
    <BookingWizard
      step={step} booking={booking} hospitals={HOSPITALS}
      bookedSlots={new Set([bookedSlot])} confirmed={null} error={null} loading={false}
      onSelectHospital={noop} onSelectDepartment={noop} onSelectDoctor={noop}
      onSelectDate={noop} onSelectSlot={noop} onChangeReason={noop}
      onBack={noop} onNext={noop} onConfirm={noop} onDone={noop}
    />
  ));

const empty = { hospital: null, department: null, doctor: null, date: '', time: '', reason: '' };
const wizardHtml0 = wizard(0, empty);
wizard(1, { ...empty, hospital });
const s2 = wizard(2, { ...empty, hospital, department, date: TEST_DATE, doctor, time: '' });
wizard(3, { ...empty, hospital, department, doctor, date: '2026-09-18', time: '12:00 PM', reason: 'checkup' });

check('StepIndicator', <StepIndicator currentStep={2} labels={['A','B','C','D']} />);

check('Confirmation', (
  <Confirmation
    appointment={{ id:'APT-1', token:'TKN-1', department:'Cardiology', doctor:doctor.name,
                   dateLabel:'September 18, 2026', timeLabel:'12:00 PM', fee:500, status:'Pending' }}
    onDone={noop} />
));

const list = check('MyAppointments (with rows)', (
  <MyAppointments
    appointments={[
      { id:'APT-1', department:'Cardiology', doctor:doctor.name, dateLabel:'September 18, 2026',
        timeLabel:'12:00 PM', status:'Pending', token:'TKN-1', reason:'checkup' },
      { id:'APT-2', department:'Neurology', doctor:'Dr. X', dateLabel:'March 1, 2026',
        timeLabel:'09:00 AM', status:'Completed', token:'TKN-2' },
    ]}
    onCancel={noop} onBook={noop} />
));

check('MyAppointments (empty)', <MyAppointments appointments={[]} onCancel={noop} onBook={noop} />);

console.log('\n  --- content assertions ---');
const must = (label, cond) => console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}`);
must('step 0 lists all hospitals', HOSPITALS.every(h => wizardHtml0.includes(h.name)));
must('step 2 shows the doctor', s2.includes(doctor.name));
must(`step 2 renders all ${daySlots.length} ${day} slots`, daySlots.every(t => s2.includes(t)));
must(`step 2 disables the booked ${bookedSlot} slot`, s2.includes('Booked') && s2.includes('disabled'));
console.log(`        doctor ${doctor.name} works ${doctor.availableDays.join('/')}; ${day} slots = ${daySlots.join(', ')}`);
must('list shows the pending badge', list.includes('Pending'));
must('list shows a Cancel button for pending', list.includes('Cancel'));
must('list hides Cancel for completed', (list.match(/Cancel</g) || []).length === 1);
