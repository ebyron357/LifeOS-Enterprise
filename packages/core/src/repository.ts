import { Repository } from '../../shared-types/src';

export abstract class BaseRepository<T, TId> implements Repository<T, TId> {
  abstract findById(id: TId): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}
