"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Edit3, Package, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { productsService } from "@/services/products";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { productUpdateSchema, type ProductUpdateFormValues } from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Brand, Category, Product } from "@/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Pagination,
  SearchBox,
  Select,
} from "@/components/ui";
import {
  DataTable,
  PageHeader,
  StatCard,
  TableCell,
} from "@/components/page-kit";

interface ProductData {
  products: Product[];
  brands: Brand[];
  categories: Category[];
}

export function ProductsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === "OWNER" || user?.role === "MANAGER";
  const resource = useApiData<ProductData>(
    async () => {
      const [products, brands, categories] = await Promise.all([
        productsService.list(),
        brandsService.list(),
        categoriesService.list(),
      ]);
      return {
        products,
        brands,
        categories,
      };
    },
    { products: [], brands: [], categories: [] },
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [productModal, setProductModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const deleteLock = useRef(false);
  const updateForm = useForm<ProductUpdateFormValues>({
    resolver: zodResolver(productUpdateSchema),
    defaultValues: { name: "", brandId: "", categoryId: "", isActive: true },
  });
  const brandNames = useMemo(
    () => new Map(resource.data.brands.map((brand) => [brand.id, brand.name])),
    [resource.data.brands],
  );
  const categoryNames = useMemo(
    () =>
      new Map(
        resource.data.categories.map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [resource.data.categories],
  );
  const filtered = useMemo(
    () =>
      resource.data.products.filter((product) =>
        `${product.name} ${brandNames.get(product.brandId)} ${categoryNames.get(product.categoryId)} ${product.trackingType}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data.products, search, brandNames, categoryNames],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const shown = filtered.slice((page - 1) * 10, page * 10);
  function openEdit(product: Product) {
    setEditing(product);
    updateForm.reset({
      name: product.name,
      brandId: product.brandId,
      categoryId: product.categoryId,
      isActive: product.isActive,
    });
    setProductModal(true);
  }
  async function update(values: ProductUpdateFormValues) {
    if (!editing) return;
    try {
      await productsService.update(editing.id, values);
      toast.success("Product updated.");
      setProductModal(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function toggle(product: Product) {
    try {
      await productsService.setStatus(product.id, !product.isActive);
      toast.success(
        `Product ${product.isActive ? "deactivated" : "activated"}.`,
      );
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function remove() {
    if (!deleting || deleteLock.current) return;
    deleteLock.current = true;
    setDeleteBusy(true);
    try {
      await productsService.remove(deleting.id);
      toast.success("Product deleted successfully.");
      setDeleting(null);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      deleteLock.current = false;
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage products, track inventory, and monitor availability in one place."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total products"
          value={resource.data.products.length}
          icon={Package}
        />
        <StatCard
          label="Active"
          value={resource.data.products.filter((p) => p.isActive).length}
          icon={Power}
          tone="green"
        />
        <StatCard
          label="Serialized"
          value={
            resource.data.products.filter(
              (p) => p.trackingType === "SERIALIZED",
            ).length
          }
          icon={Boxes}
          tone="cyan"
        />
        <StatCard
          label="Quantity tracked"
          value={
            resource.data.products.filter((p) => p.trackingType === "QUANTITY")
              .length
          }
          icon={Package}
          tone="orange"
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search products, brands or categories"
          />
          <span className="text-sm text-slate-500">
            {filtered.length} products
          </span>
        </div>
        <DataTable
          headers={[
            "Product",
            "Brand",
            "Category",
            "Tracking",
            "Quantity",
            "Status",
            "Actions",
          ]}
          loading={resource.loading}
          error={resource.error}
          empty={!shown.length}
          onRetry={resource.reload}
        >
          {shown.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50/70">
              <TableCell className="font-semibold text-slate-900">
                <Link
                  href={`/products/${product.id}`}
                  className="transition hover:text-blue-600 hover:underline"
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell>
                {brandNames.get(product.brandId) ?? product.brandId.slice(0, 8)}
              </TableCell>
              <TableCell>
                {categoryNames.get(product.categoryId) ??
                  product.categoryId.slice(0, 8)}
              </TableCell>
              <TableCell>
                <Badge
                  tone={
                    product.trackingType === "SERIALIZED" ? "info" : "warning"
                  }
                >
                  {product.trackingType}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {product.quantity}
              </TableCell>
              <TableCell>
                <Badge tone={product.isActive ? "success" : "neutral"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {canWrite && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(product)}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void toggle(product)}
                        title="Change status"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleting(product)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </tr>
          ))}
        </DataTable>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </Card>

      <Modal
        open={productModal}
        title="Edit product"
        onClose={() => setProductModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProductModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void updateForm.handleSubmit(update)()}
              disabled={updateForm.formState.isSubmitting}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editing && (
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={updateForm.handleSubmit(update)}
          >
            <div className="sm:col-span-2">
              <Field
                label="Product name"
                error={updateForm.formState.errors.name?.message}
              >
                <Input {...updateForm.register("name")} />
              </Field>
            </div>
            <Field
              label="Brand"
              error={updateForm.formState.errors.brandId?.message}
            >
              <Select {...updateForm.register("brandId")}>
                <option value="">Select brand</option>
                {resource.data.brands
                  .filter((b) => b.isActive || b.id === editing.brandId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field
              label="Category"
              error={updateForm.formState.errors.categoryId?.message}
            >
              <Select {...updateForm.register("categoryId")}>
                <option value="">Select category</option>
                {resource.data.categories
                  .filter((c) => c.isActive || c.id === editing.categoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <label className="sm:col-span-2 flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span className="text-sm font-medium">Active product</span>
              <input
                {...updateForm.register("isActive")}
                type="checkbox"
                className="h-5 w-5 accent-blue-600"
              />
            </label>
          </form>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product?"
        message={`This archives ${deleting?.name ?? "this product"} when no stock or active transaction remains. Historical transactions are preserved.`}
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
