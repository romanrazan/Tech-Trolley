export declare enum TrackingType {
    SERIALIZED = "SERIALIZED",
    QUANTITY = "QUANTITY"
}
export declare class CreateProductDto {
    name: string;
    brandId: string;
    categoryId: string;
    trackingType: TrackingType;
    quantity: number;
    isActive?: boolean;
}
