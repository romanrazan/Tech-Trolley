import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);
const optionalText = z.string().trim().optional();
const uuid = (label: string) =>
  z.string().uuid(`Select a valid ${label.toLowerCase()}.`);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");

export const userSchema = z.object({
  name: requiredText("Full name"),
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["OWNER", "MANAGER", "SALESPERSON"]),
  isActive: z.boolean(),
});

export const registrationSchema = userSchema
  .extend({
    confirmPassword: z.string().min(6, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const userUpdateSchema = userSchema.omit({
  password: true,
  isActive: true,
});
export const userStatusSchema = z.object({ isActive: z.boolean() });
export const shopSchema = z.object({
  name: requiredText("Shop name"),
  address: requiredText("Address"),
  phone: requiredText("Phone"),
  currency: requiredText("Currency"),
});
export const namedStatusSchema = z.object({
  name: requiredText("Name"),
  isActive: z.boolean(),
});
export const brandSchema = namedStatusSchema;
export const categorySchema = namedStatusSchema;
const initialQuantitySchema = z
  .union([
    z.literal(""),
    z.number().int("Initial quantity must be a whole number.").min(0, {
      message: "Initial quantity cannot be negative.",
    }),
  ])
  .transform((value, context) => {
    if (value === "") {
      context.addIssue({
        code: "custom",
        message: "Initial quantity is required.",
      });
      return z.NEVER;
    }
    return value;
  });

export const productSchema = z
  .object({
    name: requiredText("Product name"),
    brandId: uuid("Brand"),
    categoryId: uuid("Category"),
    trackingType: z.enum(["SERIALIZED", "QUANTITY"]),
    quantity: initialQuantitySchema,
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.trackingType === "SERIALIZED" && values.quantity !== 0) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message:
          "Serialized products must start at 0. Add stock through a purchase with IMEIs.",
      });
    }
  });
export const productUpdateSchema = z.object({
  name: requiredText("Product name"),
  brandId: uuid("Brand"),
  categoryId: uuid("Category"),
  isActive: z.boolean(),
});
export const customerSchema = z.object({
  name: requiredText("Name"),
  phone: requiredText("Phone"),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address.")])
    .optional(),
  address: optionalText,
});
export const supplierSchema = z.object({
  name: requiredText("Name"),
  phone: requiredText("Phone"),
  email: z.email("Enter a valid email address."),
  address: requiredText("Address"),
});
export const accountSchema = z.object({
  name: requiredText("Account name"),
  type: requiredText("Account type"),
  accountNumber: optionalText,
  balance: z.number().optional(),
});
export const accountUpdateSchema = z.object({
  name: requiredText("Account name"),
  type: requiredText("Account type"),
  accountNumber: optionalText,
  isActive: z.boolean(),
});
export const expenseSchema = z.object({
  category: requiredText("Category"),
  amount: z.number().positive("Amount must be positive."),
  accountId: uuid("Account"),
  date,
  remarks: optionalText,
});
export const transactionItemSchema = z.object({
  productId: uuid("Product"),
  quantity: z.number().int().positive("Quantity must be at least 1."),
  unitPrice: z.number().positive("Unit price must be positive."),
  imeis: z.array(z.string().trim().min(1)).optional(),
});
const purchaseQuantitySchema = z
  .number()
  .int("Quantity must be a whole number.")
  .positive("Quantity must be at least 1.");
const purchaseUnitPriceSchema = z
  .number()
  .positive("Unit price must be greater than 0.")
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "Unit price cannot have more than 2 decimal places.",
  );
export const newPurchaseProductSchema = z.object({
  name: requiredText("Product name"),
  brandId: uuid("Brand"),
  categoryId: uuid("Category"),
  trackingType: z.enum(["SERIALIZED", "QUANTITY"]),
  isActive: z.boolean(),
});
const purchaseItemBase = z.object({
  quantity: purchaseQuantitySchema,
  unitPrice: purchaseUnitPriceSchema,
  imeis: z.array(z.string().trim().min(1, "IMEI cannot be empty.")).optional(),
});
const omittedProductId = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.undefined(),
);
export const purchaseItemSchema = z
  .union([
    purchaseItemBase.extend({
      productId: uuid("Product"),
      newProduct: z.never().optional(),
    }),
    purchaseItemBase.extend({
      productId: omittedProductId.optional(),
      newProduct: newPurchaseProductSchema,
    }),
  ])
  .superRefine((item, context) => {
    if (!("newProduct" in item) || !item.newProduct) return;
    const imeis = item.imeis ?? [];
    if (
      item.newProduct.trackingType === "SERIALIZED" &&
      imeis.length !== item.quantity
    ) {
      context.addIssue({
        code: "custom",
        path: ["imeis"],
        message: `Serialized Products require exactly ${item.quantity} IMEI number${item.quantity === 1 ? "" : "s"}.`,
      });
    }
    if (item.newProduct.trackingType === "QUANTITY" && imeis.length) {
      context.addIssue({
        code: "custom",
        path: ["imeis"],
        message: "Quantity-tracked Products cannot have IMEIs.",
      });
    }
    if (new Set(imeis).size !== imeis.length) {
      context.addIssue({
        code: "custom",
        path: ["imeis"],
        message: "Duplicate IMEIs are not allowed.",
      });
    }
  });
const purchaseBaseSchema = z.object({
  invoiceNumber: requiredText("Invoice number"),
  date,
  items: z.array(purchaseItemSchema).min(1, "Add at least one item."),
  remarks: optionalText,
});
export const purchaseSchema = z.union([
  purchaseBaseSchema.extend({
    supplierId: uuid("Supplier"),
    newSupplier: z.never().optional(),
  }),
  purchaseBaseSchema.extend({
    supplierId: z.never().optional(),
    newSupplier: supplierSchema,
  }),
]);
const saleBaseSchema = z.object({
  invoiceNumber: requiredText("Invoice number"),
  date,
  discount: z.number().min(0, "Discount cannot be negative."),
  vat: z.number().min(0, "VAT cannot be negative."),
  items: z.array(transactionItemSchema).min(1, "Add at least one item."),
});
export const saleSchema = z
  .union([
    saleBaseSchema.extend({
      customerId: uuid("Customer"),
      newCustomer: z.never().optional(),
    }),
    saleBaseSchema.extend({
      customerId: z.never().optional(),
      newCustomer: customerSchema,
    }),
  ])
  .refine(
    (values) =>
      values.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ) -
        values.discount +
        values.vat >=
      0,
    {
      message: "The final total cannot be negative.",
      path: ["discount"],
    },
  );
export const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive.")
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      "Amount cannot have more than 2 decimal places.",
    ),
  paymentMethod: requiredText("Payment method"),
  accountId: uuid("Account"),
  transactionId: optionalText,
  date,
});

export type UserFormValues = z.infer<typeof userSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
export type ShopFormValues = z.infer<typeof shopSchema>;
export type NamedStatusFormValues = z.infer<typeof namedStatusSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductUpdateFormValues = z.infer<typeof productUpdateSchema>;
export type CustomerFormValues = z.infer<typeof customerSchema>;
export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type AccountFormValues = z.infer<typeof accountSchema>;
export type AccountUpdateFormValues = z.infer<typeof accountUpdateSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
export type SaleFormValues = z.infer<typeof saleSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
