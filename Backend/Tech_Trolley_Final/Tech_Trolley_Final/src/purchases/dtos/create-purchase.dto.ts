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
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'brand-uuid' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ enum: TrackingType })
  @IsEnum(TrackingType)
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
  @IsUUID()
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
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 85000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice: number;

  @ApiPropertyOptional({ example: ['IMEI12345', 'IMEI67890'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imeis?: string[];
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 'INV-2023-001' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiPropertyOptional({ example: 'supplier-uuid' })
  @ValidateIf((dto: CreatePurchaseDto) => dto.supplierId !== undefined)
  @IsUUID()
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
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiPropertyOptional({ example: 'First batch of S25' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
