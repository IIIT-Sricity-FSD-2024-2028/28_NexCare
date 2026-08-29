import HospitalStep from './HospitalStep.jsx';
import DepartmentStep from './DepartmentStep.jsx';
import DoctorDateStep from './DoctorDateStep.jsx';
import DetailsStep from './DetailsStep.jsx';
import Confirmation from './Confirmation.jsx';

export default function BookingWizard({
  step,
  booking,
  hospitals,
  bookedSlots,
  confirmed,
  error,
  loading,
  onSelectHospital,
  onSelectDepartment,
  onSelectDoctor,
  onSelectDate,
  onSelectSlot,
  onChangeReason,
  onBack,
  onNext,
  onConfirm,
  onDone,
}) {
  switch (step) {
    case 0:
      return (
        <HospitalStep
          hospitals={hospitals}
          selected={booking.hospital}
          loading={loading}
          onSelect={onSelectHospital}
        />
      );

    case 1:
      return (
        <DepartmentStep
          hospital={booking.hospital}
          selected={booking.department}
          onSelect={onSelectDepartment}
          onBack={onBack}
        />
      );

    case 2:
      return (
        <DoctorDateStep
          hospital={booking.hospital}
          department={booking.department}
          date={booking.date}
          doctor={booking.doctor}
          time={booking.time}
          bookedSlots={bookedSlots}
          onSelectDate={onSelectDate}
          onSelectDoctor={onSelectDoctor}
          onSelectSlot={onSelectSlot}
          onBack={onBack}
          onNext={onNext}
        />
      );

    case 3:
      return (
        <DetailsStep
          booking={booking}
          error={error}
          onChangeReason={onChangeReason}
          onBack={onBack}
          onConfirm={onConfirm}
        />
      );

    case 4:
      return <Confirmation appointment={confirmed} onDone={onDone} />;

    default:
      return null;
  }
}
