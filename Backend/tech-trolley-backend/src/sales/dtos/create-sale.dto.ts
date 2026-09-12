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
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 92000 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiPropertyOptional({ example: ['IMEI12345'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imeis?: string[];
}

export class CreateSaleDto {
  @ApiProperty({ example: 'INV-S-001' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiPropertyOptional({ example: 'customer-uuid' })
  @ValidateIf((dto: CreateSaleDto) => dto.customerId !== undefined)
  @IsUUID()
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
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  vat: number;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
