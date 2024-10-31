import {
  Body,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BaseCrudService } from '../services/base-crud.service';
import { Insertable, Updateable } from 'kysely';

export class BaseCrudController<TEntity> {
  constructor(private readonly baseCrudService: BaseCrudService<TEntity>) {}

  @Post()
  async create(
    @Body() createDto: Partial<Insertable<TEntity>>,
  ): Promise<TEntity> {
    return this.baseCrudService.create(createDto);
  }

  @Post('bulk')
  async createMany(
    @Body() createDto: Partial<Insertable<TEntity>>[],
  ): Promise<TEntity[]> {
    return this.baseCrudService.createMany(createDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('orderBy', new DefaultValuePipe({ column: 'id', order: 'asc' }))
    orderBy: { column: string; order: 'asc' | 'desc' },
    @Query('where') where: Array<{ key: string; operator: string; value: any }>,
  ): Promise<{
    data: TEntity[];
    meta: {
      page: number;
      limit: number;
    };
  }> {
    const data = await this.baseCrudService.findAll({
      page,
      limit,
      orderBy,
      where,
    });

    return { data, meta: { page, limit } };
  }

  @Get('count')
  async count(@Query('where') where?: string): Promise<number> {
    const parsedWhere = where ? JSON.parse(where) : [];
    return this.baseCrudService.count(parsedWhere);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<TEntity | undefined> {
    return this.baseCrudService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: Partial<Updateable<TEntity>>,
  ): Promise<TEntity | null> {
    return this.baseCrudService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.baseCrudService.remove(id);
  }
}
