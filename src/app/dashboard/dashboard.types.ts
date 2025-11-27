export interface PendingApproval {
  id: string;
  resourceName: string;
  startDate: Date;
}

export interface NextReservation {
  id: string;
  resourceName: string;
  startDate: Date;
  status: 'PENDING' | 'CANCELED' | 'CONFIRMED' | 'REJECTED';
}

export interface DashboardSummary {
  myResourceCount: number;
  pendingApprovalCount: number;
  myReservationsCount: number;
  nextReservationMade: NextReservation | null;
  nextPendingApproval: PendingApproval | null;
}
