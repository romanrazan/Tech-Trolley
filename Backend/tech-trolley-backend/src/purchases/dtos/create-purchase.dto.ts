import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsPositive,
  Matches,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { CreateSupplierDto } from '../../suppliers/dtos/create-supplier.dto';
import { TrackingType } from '../../products/dtos/create-product.dto';

@ValidatorConstraint({ name: 'exactlyOneSupplierSelection', async: false })
class ExactlyOneSupplierSelection implements ValidatorConstraintInterface {
  validate(_value: string | undefined, args: ValidationArguments): boolean {
    const dto = args.object as CreatePurchaseDto;
    return Boolean(dto.supplierId) !== Boolean(dto.newSupplier);
  }

  defaultMessage(): string {
    return 'Provide either supplierId or newSupplier, but not both';
  }
}

export class NewPurchaseProductDto {
  @ApiProperty({ example: 'Samsung Galaxy S25' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Product name is required.' })
  @IsNotEmpty({ message: 'Product name is required.' })
  name: string;

  @ApiProperty({ example: 'brand-uuid' })
  @IsUUID('4', { message: 'Select a valid brand.' })
  brandId: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID('4', { message: 'Select a valid category.' })
  categoryId: string;

  @ApiProperty({ enum: TrackingType })
  @IsEnum(TrackingType, { message: 'Select a valid tracking type.' })
  trackingType: TrackingType;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

@ValidatorConstraint({ name: 'exactlyOneProductSelection', async: false })
class ExactlyOneProductSelection implements ValidatorConstraintInterface {
  validate(_value: string | undefined, args: ValidationArguments): boolean {
    const dto = args.object as PurchaseItemDto;
    return Boolean(dto.productId) !== Boolean(dto.newProduct);
  }

  defaultMessage(): string {
    return 'Provide either productId or newProduct, but not both';
  }
}

export class PurchaseItemDto {
  @ApiPropertyOptional({ example: 'product-uuid' })
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @ValidateIf((dto: PurchaseItemDto) => dto.productId !== undefined)
  @IsUUID('4', { message: 'Select a valid product.' })
  productId?: string;

  @ApiPropertyOptional({ type: NewPurchaseProductDto })
  @ValidateIf((dto: PurchaseItemDto) => dto.newProduct !== undefined)
  @ValidateNested()
  @Type(() => NewPurchaseProductDto)
  newProduct?: NewPurchaseProductDto;

  @ApiHideProperty()
  @Validate(ExactlyOneProductSelection)
  private readonly productSelection?: never;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Quantity must be a whole number.' })
  @Min(1, { message: 'Quantity must be at least 1.' })
  quantity: number;

  @ApiProperty({ example: 85000 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Unit price must be a valid number with at most 2 decimals.' },
  )
  @IsPositive({ message: 'Unit price must be greater than 0.' })
  unitPrice: number;

  @ApiPropertyOptional({ example: ['IMEI12345', 'IMEI67890'] })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((imei: unknown) =>
          typeof imei === 'string' ? imei.trim() : imei,
        )
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imeis?: string[];
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 'INV-2023-001' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Invoice number is required.' })
  @IsNotEmpty({ message: 'Invoice number is required.' })
  invoiceNumber: string;

  @ApiPropertyOptional({ example: 'supplier-uuid' })
  @ValidateIf((dto: CreatePurchaseDto) => dto.supplierId !== undefined)
  @IsUUID('4', { message: 'Select a valid supplier.' })
  supplierId?: string;

  @ApiPropertyOptional({ type: CreateSupplierDto })
  @ValidateIf((dto: CreatePurchaseDto) => dto.newSupplier !== undefined)
  @ValidateNested()
  @Type(() => CreateSupplierDto)
  newSupplier?: CreateSupplierDto;

  @ApiHideProperty()
  @Validate(ExactlyOneSupplierSelection)
  private readonly supplierSelection?: never;

  @ApiProperty({ example: '2023-10-25' })
  @IsString({ message: 'Use a valid date.' })
  @IsNotEmpty({ message: 'Use a valid date.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use a valid date.' })
  date: string;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray({ message: 'Add at least one item.' })
  @ArrayMinSize(1, { message: 'Add at least one item.' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiPropertyOptional({ example: 'First batch of S25' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
