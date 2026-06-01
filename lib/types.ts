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
  cpf?: string;
  cnpj?: string;
  personType?: "PF" | "PJ";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfessionalProfileResponse {
  id: string;
  accountId: string;
  name?: string;
  headline: string | null;
  description: string | null;
  contactEmail: string | null;
  avatarUrl?: string | null;
  profileCompleted: boolean;
  skills: string[];
  createdAt: string;
}

export interface CompletedProjectResponse {
  contractId: string;
  proposalId: string;
  otherPartyName: string;
  price: number;
  completedAt: string;
  validatedAt: string;
}

export interface CompanyProfileResponse {
  id: string;
  accountId: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  location: string | null;
  avatarUrl?: string | null;
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
  paymentMethod?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  expiresAt?: string;
  createdAt: string;
  releasedAt: string | null;
  refundedAt?: string | null;
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

export interface ReviewResponse {
  id: string;
  reviewerAccountId: string;
  reviewerName: string;
  reviewedAccountId: string;
  serviceContractId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewSummaryResponse {
  averageRating: number;
  totalReviews: number;
  reviews: ReviewResponse[];
}

export interface ProfileSummaryResponse {
  activeContracts: number;
  activeStatus: string;
  escrowBalance: number;
}

export interface CreateReviewRequest {
  reviewedAccountId: string;
  serviceContractId: string;
  rating: number;
  comment?: string;
}

export interface ProjectResponse {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  paymentType: "FIXED_PRICE" | "HOURLY";
  budgetMin: number | null;
  budgetMax: number | null;
  skills: string[];
  status: "OPEN" | "CLOSED" | "IN_PROGRESS" | "COMPLETED";
  aiJustification: string | null;
  bidCount: number;
  createdAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  paymentType: "FIXED_PRICE" | "HOURLY";
  budgetMin: number | null;
  budgetMax: number | null;
  skills: string[];
  aiJustification: string | null;
}

export interface AiSuggestionRequest {
  briefDescription: string;
}

export interface AiSuggestionResponse {
  title: string;
  description: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  paymentType: "FIXED_PRICE" | "HOURLY";
  paymentTypeJustification: string;
}

export interface BidResponse {
  id: string;
  projectId: string;
  professionalId: string;
  professionalName: string;
  professionalHeadline: string | null;
  professionalAvatarUrl: string | null;
  amount: number;
  deliveryDays: number;
  coverLetter: string;
  portfolioUrl: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  proposalId?: string | null;
  createdAt: string;
}

export interface CreateBidRequest {
  amount: number;
  deliveryDays: number;
  coverLetter: string;
  portfolioUrl?: string;
}

