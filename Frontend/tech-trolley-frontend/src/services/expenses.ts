import { createCrudService } from "./crud";
import type { Expense, ExpenseInput } from "@/types";
export const expensesService = createCrudService<Expense, ExpenseInput>(
  "/expenses",
);
