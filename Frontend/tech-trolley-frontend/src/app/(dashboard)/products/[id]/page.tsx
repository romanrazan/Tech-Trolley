import { ProductDetailsPage } from "@/features/products/product-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailsPage productId={id} />;
}
