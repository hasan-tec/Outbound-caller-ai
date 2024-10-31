import { Injectable } from '@nestjs/common';
import { Insertable, Updateable } from 'kysely';

@Injectable()
export class BaseCrudService<TEntity> {
  constructor(
    protected readonly db,
    protected readonly tableName: string,
  ) {}

  async create(createDto: Partial<Insertable<TEntity>>): Promise<TEntity> {
    const result = await this.db
      .insertInto(this.tableName)
      .values(createDto)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error('Failed to create entity');
    }

    return result as TEntity;
  }

  async createMany(
    createDto: Partial<Insertable<TEntity>>[],
  ): Promise<TEntity[]> {
    const result: TEntity[] = await this.db
      .insertInto(this.tableName)
      .values(createDto)
      .returningAll()
      .execute();

    if (!result) {
      throw new Error('Failed to create entity');
    }

    return result;
  }

  async findAll({
    page = 1,
    limit = 10,
    orderBy = { column: 'id', order: 'asc' as const },
    where = []
  }: {
    page?: number;
    limit?: number;
    orderBy?: { column: string; order: 'asc' | 'desc' };
    where?: Array<{ key: string; operator: string; value: any }>;
  } = {}): Promise<TEntity[]> {
    const offset = (page - 1) * limit;

    let query = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .limit(limit)
      .orderBy(orderBy.column, orderBy.order)
      .offset(offset);

    // Apply where conditions
    where.forEach(({ key, operator, value }) => {
      query = query.where(key, operator, value);
    });

    const data = (await query.execute()) as Promise<TEntity[]>;

    return data;
  }

  async count(
    where: Array<{ key: string; operator: string; value: any }> = [],
  ): Promise<number> {
    let query = this.db
      .selectFrom(this.tableName)
      .select((b) => b.fn.countAll().as('count'))

    where.forEach(({ key, operator, value }) => {
      query = query.where(key, operator, value);
    });

    const result = await query.executeTakeFirstOrThrow();
    return Number(result.count) || 0;
  }

  async findOne(id: number): Promise<TEntity | undefined> {
    return (await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()) as TEntity | undefined;
  }

  async update(
    id: number,
    updateDto: Partial<Updateable<TEntity>>,
  ): Promise<TEntity | null> {
    return (await this.db
      .updateTable(this.tableName)
      .set(updateDto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()) as TEntity | undefined;
  }

  async remove(id: number): Promise<void> {
    await this.db.deleteFrom(this.tableName).where('id', '=', id).execute();
  }
}
