export type RegistrationLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export interface FaceBiometryStatus {
  hasIdentity: boolean;
  confirmed: boolean;
  approvedEnrollments: number;
  pendingEnrollments: number;
  rejectedEnrollments: number;
  totalEmbeddings: number;
  latestEnrollmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  latestCapturedAt: string | null;
}

export interface CitizenAccessLevelSummary {
  currentStatus: 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED';
  currentLevel: RegistrationLevel;
  nextLevel: RegistrationLevel | null;
  profileComplete: boolean;
  missingProfileFields: string[];
  silverCriteria: {
    profileComplete: boolean;
    missingProfileFields: string[];
    adminReviewRequired: boolean;
  };
  goldCriteria: {
    eligible: boolean;
    approvedDocsCount: number;
    requiredDocCount: number;
    missingDocumentTypes: string[];
    profileComplete: boolean;
    missingProfileFields: string[];
    biometricConfirmed: boolean;
    biometric: FaceBiometryStatus;
    reason?: string;
  };
}
