import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TrackingType {
  SERIALIZED = 'SERIALIZED',
  QUANTITY = 'QUANTITY',
}

@ValidatorConstraint({ name: 'serializedOpeningQuantity', async: false })
class SerializedOpeningQuantity implements ValidatorConstraintInterface {
  validate(quantity: number, args: ValidationArguments): boolean {
    const dto = args.object as CreateProductDto;
    return dto.trackingType !== TrackingType.SERIALIZED || quantity === 0;
  }

  defaultMessage(): string {
    return 'Serialized products must start with quantity 0; add stock through Purchase with IMEIs';
  }
}

export class CreateProductDto {
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

  @ApiProperty({ enum: TrackingType, example: TrackingType.SERIALIZED })
  @IsEnum(TrackingType)
  trackingType: TrackingType;

  @ApiProperty({ example: 0, minimum: 0, type: Number })
  @IsInt()
  @Min(0)
  @Validate(SerializedOpeningQuantity)
  quantity: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
