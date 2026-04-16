export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

export interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  html_content: string;
  is_default: boolean;
  created_at: string;
}

export interface Rule {
  id: string;
  priority: number;
  condition_type: string | null;
  condition_value: string | null;
  template_id: string;
  template_name: string | null;
  enabled: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  job_title: string | null;
  mobile_phone: string | null;
  department: string | null;
  extra_fields: Record<string, string>;
  created_at: string;
}

export interface AdminSession {
  token: string;
  email: string;
  role: string;
}

export interface Disclaimer {
  id: string;
  name: string;
  html_content: string;
  applies_to: "all" | "external" | "internal";
  enabled: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  status: "trial" | "active" | "suspended" | "cancelled";
  seats: number;
  used_seats: number;
  trial_ends_at: string | null;
  period_end: string | null;
  created_at: string;
}

export interface Banner {
  id: string;
  name: string;
  html_content: string;
  position: "header" | "footer";
  applies_to: "all" | "external" | "internal";
  enabled: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  emails_sent_30d: number;
  emails_opened_30d: number;
  open_rate_30d: number;
  trial_tenants: number;
  active_subscriptions: number;
}

export interface Analytics {
  period_days: number;
  total_sent: number;
  total_opened: number;
  open_rate: number;
  total_csat_responses: number;
  avg_csat_score: number | null;
  csat_distribution: Record<string, number>;
}
