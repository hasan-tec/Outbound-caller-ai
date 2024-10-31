import { useMutation } from '@tanstack/react-query';
import api from '../axios';
import { queryClient } from '../query-client';

const moduleApi = {
    makeOutboundCall: (moduleName: string, id: number) =>
        api.post<{ data: string }>(`${moduleName}/make-outbound-call/${id}`),
};

export const useMakeOutboundCall = (moduleName: string) => {
    return useMutation({
        mutationFn: (id: number) => moduleApi.makeOutboundCall(moduleName, id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: [moduleName, id] });
        },
    });
};
