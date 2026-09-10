import { apiClient } from "@/lib/api/client";

export function createCrudService<TEntity, TCreate, TUpdate = TCreate>(
  path: string,
) {
  return {
    async list() {
      const { data } = await apiClient.get<TEntity[]>(path);
      return data;
    },
    async get(id: string) {
      const { data } = await apiClient.get<TEntity>(`${path}/${id}`);
      return data;
    },
    async create(payload: TCreate) {
      const { data } = await apiClient.post<TEntity>(path, payload);
      return data;
    },
    async update(id: string, payload: TUpdate) {
      const { data } = await apiClient.put<TEntity>(`${path}/${id}`, payload);
      return data;
    },
    async remove(id: string) {
      await apiClient.delete(`${path}/${id}`);
    },
  };
}
