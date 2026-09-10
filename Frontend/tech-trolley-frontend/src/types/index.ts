export type UserRole = "OWNER" | "MANAGER" | "SALESPERSON";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  user: User;
}
export interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export type Money = number | string;
export type TrackingType = "SERIALIZED" | "QUANTITY";
export type InventoryStatus = "IN_STOCK" | "SOLD" | "DAMAGED";

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  currency: string;
}

export interface Brand {
  id: string;
  name: string;
  isActive: boolean;
}
export interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  trackingType: TrackingType;
  quantity: number;
  isActive: boolean;
  deletedAt?: string | null;
  brand?: Brand;
  category?: Category;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  totalSales?: number;
  totalPaid?: number;
  due?: number;
  deletedAt?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  totalPurchases?: number;
  totalPaid?: number;
  due?: number;
  deletedAt?: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  accountNumber?: string | null;
  balance: Money;
  isActive: boolean;
  deletedAt?: string | null;
}

export type PaymentAccountOption = Pick<Account, "id" | "name" | "type">;

export interface Expense {
  id: string;
  category: string;
  amount: Money;
  accountId: string;
  account?: Account;
  date: string;
  remarks?: string | null;
  createdAt: string;
}

export interface TransactionItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  imeis?: string[];
}

export interface NewPurchaseProductInput {
  name: string;
  brandId: string;
  categoryId: string;
  trackingType: TrackingType;
  isActive: boolean;
}

interface PurchaseItemInputBase {
  quantity: number;
  unitPrice: number;
  imeis?: string[];
}

export type PurchaseItemInput = PurchaseItemInputBase &
  (
    | { productId: string; newProduct?: never }
    | { productId?: never; newProduct: NewPurchaseProductInput }
  );

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  date: string;
  total: Money;
  status: "IN_PROGRESS" | "INCOMPLETE" | "COMPLETED" | "CANCELLED";
  remarks?: string | null;
  createdAt: string;
  supplier?: Supplier;
  payments?: Payment[];
  totalPaid?: number;
  currentDue?: number;
}

export interface PurchaseItem extends TransactionItemInput {
  id: string;
  purchaseId: string;
  product?: Product;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  salespersonId: string;
  date: string;
  subTotal: Money;
  discount: Money;
  vat: Money;
  total: Money;
  status: "IN_PROGRESS" | "INCOMPLETE" | "COMPLETED" | "RETURNED" | "CANCELLED";
  createdAt: string;
  customer?: Customer;
  payments?: Payment[];
  totalPaid?: number;
  currentDue?: number;
}

export interface SaleItem extends TransactionItemInput {
  id: string;
  saleId: string;
  product?: Product;
}

export interface Payment {
  id: string;
  amount: Money;
  paymentMethod: string;
  accountId: string;
  transactionId?: string | null;
  date: string;
  createdAt: string;
  purchaseId?: string;
  saleId?: string;
  account?: Account;
}

export interface PurchaseDetail {
  purchase: Purchase;
  items: PurchaseItem[];
  payments: Payment[];
}
export interface SaleDetail {
  sale: Sale;
  items: SaleItem[];
  payments: Payment[];
}

export interface InventorySummary {
  serializedInStock: number;
  quantityInStock: number;
  soldUnits: number;
  damagedUnits: number;
}

export interface InventoryUnit {
  id: string;
  productId: string;
  product?: Product;
  imei?: string | null;
  quantity: number;
  status: InventoryStatus;
  purchaseId?: string | null;
  saleId?: string | null;
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalCustomers: number;
  totalProducts: number;
}

export interface SalesChartPoint {
  date: string;
  total: Money;
}
export interface DueSummary {
  due: number;
  total?: number;
  paid?: number;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserUpdateInput {
  name: string;
  email: string;
  role: UserRole;
}
export interface NamedStatusInput {
  name: string;
  isActive: boolean;
}
export interface ContactInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}
export interface SupplierInput {
  name: string;
  phone: string;
  email: string;
  address: string;
}
export interface ProductInput {
  name: string;
  brandId: string;
  categoryId: string;
  trackingType: TrackingType;
  quantity: number;
  isActive?: boolean;
}
export interface ProductUpdateInput {
  name: string;
  brandId: string;
  categoryId: string;
  isActive: boolean;
}
export interface AccountInput {
  name: string;
  type: string;
  accountNumber?: string;
  balance?: number;
}
export interface AccountUpdateInput {
  name: string;
  type: string;
  accountNumber?: string;
  isActive?: boolean;
}
export interface ExpenseInput {
  category: string;
  amount: number;
  accountId: string;
  date: string;
  remarks?: string;
}
interface PurchaseInputBase {
  invoiceNumber: string;
  date: string;
  items: PurchaseItemInput[];
  remarks?: string;
}
export type PurchaseInput = PurchaseInputBase &
  (
    | { supplierId: string; newSupplier?: never }
    | { supplierId?: never; newSupplier: SupplierInput }
  );
interface SaleInputBase {
  invoiceNumber: string;
  date: string;
  discount: number;
  vat: number;
  items: TransactionItemInput[];
}
export type SaleInput = SaleInputBase &
  (
    | { customerId: string; newCustomer?: never }
    | { customerId?: never; newCustomer: ContactInput }
  );

export interface CustomerSaleHistory {
  id: string;
  date: string;
  invoiceNumber: string;
  status: Sale["status"];
  total: number;
  paidAmount: number;
  remainingDue: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imeis: string[];
  }>;
}

export interface CustomerDetails {
  customer: Customer;
  summary: {
    totalSales: number;
    totalPaid: number;
    totalDue: number;
  };
  sales: CustomerSaleHistory[];
}
export interface SupplierPurchaseHistory {
  id: string;
  date: string;
  invoiceNumber: string;
  status: Purchase["status"];
  total: number;
  paidAmount: number;
  remainingDue: number;
  remarks?: string | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imeis: string[];
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string | null;
    date: string;
  }>;
}
export interface SupplierDetails {
  supplier: Supplier;
  summary: {
    totalPurchases: number;
    totalPaid: number;
    totalDue: number;
  };
  purchases: SupplierPurchaseHistory[];
}
export interface PaymentInput {
  amount: number;
  paymentMethod: string;
  accountId: string;
  transactionId?: string;
  date: string;
}
