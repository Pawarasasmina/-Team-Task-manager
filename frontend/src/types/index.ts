export interface User {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  role: 'admin' | 'user';
  isPasswordChanged: boolean;
  team?: Team | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  _id: string;
  name: string;
  description: string;
  members: string[] | User[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string | User;
  createdBy: string | User;
  isAssignedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}
