export type AccountRole = "PROFESSIONAL" | "COMPANY" | "ADMIN";

export interface AuthResponse {
  accessToken: string;
}

export interface AccountResponse {
  id: string;
  email: string;
}

export interface RegisterAccountRequest {
  name: string;
  email: string;
  password: string;
  role: AccountRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfessionalProfileResponse {
  id: string;
  headline: string | null;
  description: string | null;
  contactEmail: string | null;
  profileCompleted: boolean;
  skills: string[];
  createdAt: string;
}

export interface CompanyProfileResponse {
  id: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  location: string | null;
  profileCompleted: boolean;
  createdAt: string;
}

export interface SkillResponse {
  id: string;
  name: string;
}

export interface ProposalResponse {
  id: string;
  companyId: string;
  professionalId: string;
  message: string;
  price: number;
  status: string;
  contractId: string | null;
}

export interface ConversationResponse {
  id: string;
  proposalId: string;
  otherPartyName: string;
  proposalPrice: number;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface ServiceContractResponse {
  id: string;
  proposalId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  validatedAt: string | null;
}

export interface PaymentResponse {
  id: string;
  serviceContractId: string;
  amount: number;
  platformFee: number;
  professionalAmount: number;
  status: string;
  createdAt: string;
  releasedAt: string | null;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  timestamp?: string;
}
