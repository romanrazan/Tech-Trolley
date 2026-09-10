import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brands.entity';
import { CreateBrandDto } from './dtos/create-brand.dto';
import { UpdateBrandDto } from './dtos/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const existing = await this.brandsRepository.findOne({ where: { name: createBrandDto.name } });
    if (existing) throw new ConflictException('Brand already exists');
    const brand = this.brandsRepository.create(createBrandDto);
    return this.brandsRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return this.brandsRepository.find();
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    if (updateBrandDto.name !== brand.name) {
      const existing = await this.brandsRepository.findOne({ where: { name: updateBrandDto.name } });
      if (existing) throw new ConflictException('Brand name already exists');
    }
    Object.assign(brand, updateBrandDto);
    return this.brandsRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    await this.brandsRepository.remove(brand);
  }
}
