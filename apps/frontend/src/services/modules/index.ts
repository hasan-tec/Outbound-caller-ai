import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../axios';
import { queryClient } from '../query-client';

type Meta = {
  total: number;
  page: number;
  limit: number;
}

interface FindAllParams {
  page?: number;
  limit?: number;
  orderBy?: { column: string; order: 'asc' | 'desc' };
  where?: Array<{ key: string; operator: string; value: any }>;
}

const moduleApi = {
  findAll: (moduleName: string, params: FindAllParams) =>
    api.get<{ data: Record<string, any>[], meta: Meta }>(`${moduleName}`, { params }),
  findOne: (moduleName: string, id: number) =>
    api.get<Record<string, any>>(`${moduleName}/${id}`),
  create: (moduleName: string, data: any) =>
    api.post<Record<string, any>>(`${moduleName}`, data),
  createMany: (moduleName: string, data: any[]) =>
    api.post<Record<string, any>[]>(`${moduleName}/bulk`, data),
  update: (moduleName: string, id: number, data: any) =>
    api.put<Record<string, any>>(`${moduleName}/${id}`, data),
  updateByKey: (moduleName: string, data: { key: string; value: string }) =>
    api.put<Record<string, any>>(`${moduleName}/update-by-key`, data),
  remove: (moduleName: string, id: number) =>
    api.delete(`${moduleName}/${id}`),
  count: (moduleName: string, where?: string) =>
    api.get<number>(`${moduleName}/count`, { params: { where } }),
  downloadCsv: (moduleName: string, params: FindAllParams) =>
    api.get(`${moduleName}/download/csv`, { params }),
  makeOutboundCall: (moduleName: string, id: number) =>
    api.post<{ data: string }>(`${moduleName}/make-outbound-call/${id}`),
};

export const useFindAllFromModule = (
  moduleName: string,
  params: FindAllParams,
) => {
  return useQuery({
    queryKey: [moduleName, params],
    queryFn: () => moduleApi.findAll(moduleName, params),
  });
};

export const useFindOneFromModule = (moduleName: string, id: number) => {
  return useQuery({
    queryKey: [moduleName, id],
    queryFn: () => moduleApi.findOne(moduleName, id),
  });
};

export const useCreateFromModule = (moduleName: string) => {
  return useMutation({
    mutationFn: (data: any) => moduleApi.create(moduleName, data),
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
    },
  });
};

export const useCreateManyFromModule = (moduleName: string) => {
  return useMutation({
    mutationFn: (data: any[]) => moduleApi.createMany(moduleName, data),
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
    },
  });
};

export const useUpdateFromModule = (moduleName: string) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => moduleApi.update(moduleName, id, data),
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
    },
  });
};

export const useUpdateByKeyFromModule = (moduleName: string) => {
  return useMutation({
    mutationFn: (data: { key: string; value: string }) => moduleApi.updateByKey(moduleName, data),
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
    },
  });
};

export const useRemoveFromModule = (moduleName: string) => {
  return useMutation({
    mutationFn: (id: number) => moduleApi.remove(moduleName, id),
  });
};

export const useCountFromModule = (moduleName: string, where?: string) => {
  return useQuery({
    queryKey: [moduleName, 'count', where],
    queryFn: () => moduleApi.count(moduleName, where),
  });
};

export const useDownloadCsvFromModule = (moduleName: string, params: FindAllParams) => {
  return useMutation({
    mutationFn: () => moduleApi.downloadCsv(moduleName, params),
    onSuccess: (data) => {
      const blob = new Blob([data.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moduleName}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
};
