import {
  ArrayMinSize,
  IsArray,
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
import { CreateCustomerDto } from '../../customers/dtos/create-customer.dto';

@ValidatorConstraint({ name: 'exactlyOneCustomerSelection', async: false })
class ExactlyOneCustomerSelection implements ValidatorConstraintInterface {
  validate(_value: string | undefined, args: ValidationArguments): boolean {
    const dto = args.object as CreateSaleDto;
    return Boolean(dto.customerId) !== Boolean(dto.newCustomer);
  }

  defaultMessage(): string {
    return 'Provide either customerId or newCustomer, but not both';
  }
}

class SaleItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID('4', { message: 'Select a valid product.' })
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Quantity must be a whole number.' })
  @Min(1, { message: 'Quantity must be at least 1.' })
  quantity: number;

  @ApiProperty({ example: 92000 })
  @IsNumber({}, { message: 'Unit price must be a valid number.' })
  @IsPositive({ message: 'Unit price must be positive.' })
  unitPrice: number;

  @ApiPropertyOptional({ example: ['IMEI12345'] })
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

export class CreateSaleDto {
  @ApiProperty({ example: 'INV-S-001' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Invoice number is required.' })
  @IsNotEmpty({ message: 'Invoice number is required.' })
  invoiceNumber: string;

  @ApiPropertyOptional({ example: 'customer-uuid' })
  @ValidateIf((dto: CreateSaleDto) => dto.customerId !== undefined)
  @IsUUID('4', { message: 'Select a valid customer.' })
  customerId?: string;

  @ApiPropertyOptional({ type: CreateCustomerDto })
  @ValidateIf((dto: CreateSaleDto) => dto.newCustomer !== undefined)
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  newCustomer?: CreateCustomerDto;

  @ApiHideProperty()
  @Validate(ExactlyOneCustomerSelection)
  private readonly customerSelection?: never;

  @ApiProperty({ example: '2023-10-26' })
  @IsString({ message: 'Use a valid date.' })
  @IsNotEmpty({ message: 'Use a valid date.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use a valid date.' })
  date: string;

  @ApiProperty({ example: 0 })
  @IsNumber({}, { message: 'Discount must be a valid number.' })
  @Min(0, { message: 'Discount cannot be negative.' })
  discount: number;

  @ApiProperty({ example: 1000 })
  @IsNumber({}, { message: 'VAT must be a valid number.' })
  @Min(0, { message: 'VAT cannot be negative.' })
  vat: number;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray({ message: 'Add at least one item.' })
  @ArrayMinSize(1, { message: 'Add at least one item.' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
