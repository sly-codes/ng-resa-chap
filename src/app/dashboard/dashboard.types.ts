/**
 * Interface pour la prochaine réservation en attente d'approbation (côté Locateur).
 */
export interface PendingApproval {
  id: string;
  resourceName: string;
  startDate: Date; // Reçu en tant que string, à convertir en Date si nécessaire.
}

/**
 * Interface pour la prochaine réservation faite par l'utilisateur (côté Locataire).
 */
export interface NextReservation {
  id: string;
  resourceName: string;
  startDate: Date; // Reçu en tant que string, à convertir en Date si nécessaire.
  status: 'PENDING' | 'CANCELED' | 'CONFIRMED' | 'REJECTED';
}

/**
 * Interface pour le résumé complet du tableau de bord.
 * Correspond au DashboardSummaryDto du backend.
 */
export interface DashboardSummary {
  myResourceCount: number;
  pendingApprovalCount: number;

  // Ce champ est bien ajouté ici
  myReservationsCount: number;

  nextReservationMade: NextReservation | null;
  nextPendingApproval: PendingApproval | null;
}
