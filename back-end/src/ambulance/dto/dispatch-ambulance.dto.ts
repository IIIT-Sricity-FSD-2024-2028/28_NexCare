/**
 * Dispatch Ambulance DTO - Simple data transfer object
 * Transfers ambulance dispatch data between client and server
 */
export class DispatchAmbulanceDto {
  assignedTo: string;
  vehicleNumber?: string;
  driverContact?: string;
  estimatedArrival?: string;
  dispatchedBy: string;
}
