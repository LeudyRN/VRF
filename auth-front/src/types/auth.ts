export interface UserProfile {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  subscriptionStatus: "inactive" | "trial" | "active" | "canceled" | "past_due";
  subscription?: {
    id: number;
    user_id: number;
    stripe_subscription_id: string;
    plan: string;
    status: string;
    current_period_end?: string | null;
  } | null;
}
