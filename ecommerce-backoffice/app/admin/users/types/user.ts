// types/user.ts
export interface User {
  id: number;
  full_name: string;
  phone: string;
  password?: string;
  role: "director" | "general_manager" | "supervisor" | "worker";
  supervisor_id?: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}