"use client";

import Link from "next/link";
import { ArrowLeft, Boxes, Package, Tag } from "lucide-react";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { productsService } from "@/services/products";
import { useApiData } from "@/hooks/use-api-data";
import type { Brand, Category, Product } from "@/types";
import { Badge, Card, ErrorState, LoadingState } from "@/components/ui";
import { PageHeader, StatCard } from "@/components/page-kit";

interface ProductDetailsData {
  product: Product | null;
  brands: Brand[];
  categories: Category[];
}

export function ProductDetailsPage({ productId }: { productId: string }) {
  const resource = useApiData<ProductDetailsData>(
    async () => {
      const [product, brands, categories] = await Promise.all([
        productsService.get(productId),
        brandsService.list(),
        categoriesService.list(),
      ]);
      return { product, brands, categories };
    },
    { product: null, brands: [], categories: [] },
  );

  if (resource.loading) return <LoadingState label="Loading product…" />;
  if (resource.error)
    return <ErrorState message={resource.error} onRetry={resource.reload} />;

  const product = resource.data.product;
  const brand = resource.data.brands.find(
    (item) => item.id === product?.brandId,
  );
  const category = resource.data.categories.find(
    (item) => item.id === product?.categoryId,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Product details"
        title={product?.name ?? "Product details"}
        description="Catalog identity and inventory tracking behavior."
        actions={
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available quantity"
          value={product?.quantity ?? 0}
          icon={Boxes}
          tone="green"
        />
        <StatCard
          label="Tracking"
          value={product?.trackingType === "SERIALIZED" ? "IMEI" : "Quantity"}
          icon={Package}
          tone="cyan"
        />
        <StatCard
          label="Brand"
          value={brand?.name ?? "—"}
          icon={Tag}
          tone="violet"
        />
        <StatCard
          label="Category"
          value={category?.name ?? "—"}
          icon={Tag}
          tone="orange"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Product information</h2>
            <p className="mt-1 text-sm text-slate-500">
              Purchases, sales, and inventory now reference this product
              directly.
            </p>
          </div>
          {product && (
            <Badge tone={product.isActive ? "success" : "neutral"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">Brand</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {brand?.name ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">Category</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {category?.name ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 sm:col-span-2">
            <dt className="text-xs text-slate-500">Tracking method</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {product?.trackingType === "SERIALIZED"
                ? "Serialized inventory with one IMEI per unit"
                : "Quantity-based inventory"}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 sm:col-span-2">
            <dt className="text-xs text-slate-500">Available quantity</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {product?.quantity ?? 0}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
