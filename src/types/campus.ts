import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'faculty' | 'admin';
export type UserStatus = 'active' | 'suspended';

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'Lost' | 'Found' | 'Claimed' | 'Returned';
export type ItemCategory =
  | 'Electronics'
  | 'ID Cards & Keys'
  | 'Bags & Backpacks'
  | 'Books & Notes'
  | 'Clothing & Accessories'
  | 'Sports & Gear'
  | 'Other';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'ID Cards & Keys',
  'Bags & Backpacks',
  'Books & Notes',
  'Clothing & Accessories',
  'Sports & Gear',
  'Other',
];

export const ITEM_STATUSES: ItemStatus[] = ['Lost', 'Found', 'Claimed', 'Returned'];

export const CAMPUS_LOCATIONS: string[] = [
  'Central Library',
  'Engineering & Science Block',
  'Student Union Commons',
  'Main Auditorium',
  'Campus Cafeteria',
  'Sports & Recreation Complex',
  'Administration Building',
  'North Residence Hall',
  'Parking Deck & Transit Stop',
];

export type ClaimStatus = 'Pending' | 'Faculty Verified' | 'Approved' | 'Rejected';

export type NotificationType =
  | 'claim_submitted'
  | 'claim_verified'
  | 'claim_approved'
  | 'claim_rejected'
  | 'item_updated'
  | 'system';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  campusId: string;
  phone?: string;
  status: UserStatus;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export interface ItemReport {
  id: string;
  title: string;
  type: ItemType;
  category: ItemCategory;
  description: string;
  location: string;
  dateReported: string; // YYYY-MM-DD
  status: ItemStatus;
  visibility: 'campus';
  imageUrl: string;
  contactSummary: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  keywords: string[];
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export interface ItemContact {
  itemId: string;
  reporterId: string;
  contactDetails: string;
  pickupLocation: string;
  updatedAt: Timestamp | Date | string;
}

export interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemCategory: string;
  itemReporterId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantRole: UserRole;
  ownershipProof: string;
  identifyingFeatures: string;
  supportingImageUrl: string;
  status: ClaimStatus;
  reviewerId: string;
  reviewerName: string;
  reviewNotes: string;
  history: string[];
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedItemId: string;
  relatedClaimId: string;
  read: boolean;
  createdAt: Timestamp | Date | string;
}

export type AppRoute =
  | 'home'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'report-lost'
  | 'report-found'
  | 'search'
  | 'item-details'
  | 'submit-claim'
  | 'my-reports'
  | 'my-claims'
  | 'admin-dashboard'
  | 'manage-items'
  | 'manage-claims'
  | 'manage-users'
  | 'testing-qa';

export type TestingCategory = 'Unit' | 'Integration' | 'Validation' | 'Functional' | 'System';

export type QATestStatus = 'Passed' | 'Failed' | 'Pending';

export interface QATestCaseResult {
  testCaseId: string;
  testingType: TestingCategory;
  module: string;
  testScenario: string;
  testInput: string;
  expectedOutput: string;
  actualOutput: string;
  status: QATestStatus;
  durationMs: number;
  sourceFile: string;
}

export interface QACategorySummary {
  testingType: TestingCategory;
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passRate: number;
}

export interface QATestExecutionReport {
  generatedAt: string;
  runner: string;
  command: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  pendingCases: number;
  passPercentage: number;
  categories: QACategorySummary[];
  results: QATestCaseResult[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
