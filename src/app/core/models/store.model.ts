export interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StoreOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface StoreWritePayload {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export interface StoreFormValue {
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}
