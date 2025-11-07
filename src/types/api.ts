// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// User types
export enum UserRole {
  TEACHER = "teacher",
  STUDENT = "student",
}

// Helper to convert role to API format (uppercase for query params)
export const roleToApiFormat = (role: UserRole | string): string => {
  return role.toUpperCase();
};

// Helper to normalize role from API (lowercase)
export const normalizeRole = (role: string): UserRole => {
  const lowercaseRole = role.toLowerCase();
  return lowercaseRole === "teacher" ? UserRole.TEACHER : UserRole.STUDENT;
};

export interface User {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  authUserId: string;
  fullName: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, any>;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  metadata?: Record<string, any>;
}

// Subject types
export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateSubjectDto {
  name?: string;
  description?: string;
}

// Class types
export enum Semester {
  SPRING = "SPRING",
  SUMMER = "SUMMER",
  FALL = "FALL",
  WINTER = "WINTER",
}

export interface Class {
  id: string;
  subject: Subject;
  teacher: User;
  year: number;
  semester: Semester;
  groupCode: string;
  schedule?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Flattened class response from API (without nested objects)
export interface ClassResponse {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  year: number;
  semester: Semester;
  groupCode: string;
  schedule?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassDto {
  subjectId: string;
  teacherId: string;
  year: number;
  semester: Semester;
  groupCode: string;
  schedule?: string;
  metadata?: Record<string, any>;
}

export interface UpdateClassDto {
  subjectId?: string;
  year?: number;
  semester?: Semester;
  groupCode?: string;
  schedule?: string;
  metadata?: Record<string, any>;
}

// Enrollment types
export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  DROPPED = "DROPPED",
  COMPLETED = "COMPLETED",
}

export interface Enrollment {
  id: string;
  classEntity: Class;
  student: User;
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

// Flattened enrollment response from API
export interface EnrollmentResponse {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentDto {
  classId: string;
  studentId: string;
  enrollmentStatus: EnrollmentStatus;
}

export interface UpdateEnrollmentDto {
  enrollmentStatus: EnrollmentStatus;
}

// Grade types
export enum AssessmentKind {
  EXAM = "EXAM",
  HOMEWORK = "HOMEWORK",
  PROJECT = "PROJECT",
  QUIZ = "QUIZ",
}

export interface Grade {
  id: string;
  classEntity: Class;
  student: User;
  assessmentKind: AssessmentKind;
  assessmentName: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Flattened grade response from API
export interface GradeResponse {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  assessmentKind: AssessmentKind;
  assessmentName: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeDto {
  classId: string;
  studentId: string;
  assessmentKind: AssessmentKind;
  assessmentName: string;
  score: number;
  maxScore: number;
  gradedAt: string;
}

export interface UpdateGradeDto {
  assessmentKind?: AssessmentKind;
  assessmentName?: string;
  score?: number;
  maxScore?: number;
  gradedAt?: string;
}

// AI Recommendation types
export enum RecommendationAudience {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  INDIVIDUAL = "INDIVIDUAL",
}

export interface AiRecommendation {
  id: string;
  recipient: User;
  classEntity?: Class;
  audience: RecommendationAudience;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Flattened AI recommendation response from API
export interface AiRecommendationResponse {
  id: string;
  recipientId: string;
  recipientName: string;
  classId?: string;
  subjectCode?: string;
  subjectName?: string;
  audience: RecommendationAudience;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateRecommendationDto {
  recipientId: string;
  classId?: string;
  audience: RecommendationAudience;
  message: string;
  metadata?: Record<string, any>;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface ClassFilters extends PaginationParams {
  teacherId?: string;
  subjectId?: string;
  year?: number;
  semester?: Semester;
}

export interface EnrollmentFilters extends PaginationParams {
  classId?: string;
  studentId?: string;
  status?: EnrollmentStatus;
}

export interface GradeFilters extends PaginationParams {
  classId?: string;
  studentId?: string;
}

export interface RecommendationFilters extends PaginationParams {
  recipientId?: string;
  classId?: string;
  audience?: RecommendationAudience;
}
