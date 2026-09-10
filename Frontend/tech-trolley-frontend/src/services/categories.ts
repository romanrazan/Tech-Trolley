import { createCrudService } from "./crud";
import type { Category, NamedStatusInput } from "@/types";
export const categoriesService = createCrudService<Category, NamedStatusInput>(
  "/categories",
);
