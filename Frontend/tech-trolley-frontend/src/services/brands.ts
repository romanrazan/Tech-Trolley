import { createCrudService } from "./crud";
import type { Brand, NamedStatusInput } from "@/types";
export const brandsService = createCrudService<Brand, NamedStatusInput>(
  "/brands",
);
