// src/services/call-log/index.ts
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../axios';
import { queryClient } from '../query-client';

interface ApiError {
    message: string;
}

const moduleApi = {
    makeOutboundCall: (moduleName: string, id: number) =>
        api.post<{ data: string }>(`${moduleName}/make-outbound-call/${id}`),
    makeBatchOutboundCalls: (moduleName: string, ids: number[]) =>
        api.post<{ data: string[] }>(`${moduleName}/make-batch-outbound-calls`, { ids }),
};

export const useMakeOutboundCall = (moduleName: string) => {
    return useMutation({
        mutationFn: (id: number) => moduleApi.makeOutboundCall(moduleName, id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: [moduleName, id] });
        },
    });
};

export interface BatchCallProgress {
    isProcessing: boolean;
    currentCallIndex: number;
    totalCalls: number;
    errors: Array<{ id: number; error: string }>;
}

export const useBatchOutboundCall = (moduleName: string) => {
    const [progress, setProgress] = useState<BatchCallProgress>({
        isProcessing: false,
        currentCallIndex: 0,
        totalCalls: 0,
        errors: [],
    });

    const makeCall = useMakeOutboundCall(moduleName);

    const processCallQueue = async (callIds: number[]) => {
        setProgress({
            isProcessing: true,
            currentCallIndex: 0,
            totalCalls: callIds.length,
            errors: [],
        });

        for (let i = 0; i < callIds.length; i++) {
            try {
                // Make the call
                await makeCall.mutateAsync(callIds[i]);
                
                // Wait for current call to establish properly (5 seconds)
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                setProgress(prev => ({
                    ...prev,
                    currentCallIndex: i + 1,
                }));

                // Wait between calls to ensure WebSocket connections don't overlap
                if (i < callIds.length - 1) {
                    // 2 second delay between calls
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 
                    (error as ApiError)?.message || 'Unknown error occurred';
                
                setProgress(prev => ({
                    ...prev,
                    errors: [...prev.errors, { id: callIds[i], error: errorMessage }],
                }));
            }
        }

        setProgress(prev => ({
            ...prev,
            isProcessing: false,
        }));

        // Refresh the call logs data
        queryClient.invalidateQueries({ queryKey: [moduleName] });
    };

    return {
        processCallQueue,
        progress,
    };
};