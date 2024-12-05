import { Button } from '@/components/elements/button';
import { Input } from '@/components/elements/input';
import { Label } from '@/components/elements/label';
import CsvImport from './components/CsvImport';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/elements/select';
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Edit, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from './components/elements/card';
import { Textarea } from './components/elements/textarea';
import DataGrid from './components/fragments/data-grid';
import {
    useCreateFromModule,
    useFindAllFromModule,
    useUpdateByKeyFromModule,
    useUpdateFromModule,
} from './services/modules';
import { useMakeOutboundCall } from './services/call-log';
import Modal from './components/fragments/modal';

import { useBatchOutboundCall } from './services/call-log';
import { Alert, AlertTitle, AlertDescription } from '@/components/elements/alert';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/types/error';


function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if ((error as ApiError)?.message) return (error as ApiError).message;
    return 'An unknown error occurred';
}







const AgentPromptTextarea = ({ defaultPrompt, value, onChange }: { 
    defaultPrompt: string,
    value: string,
    onChange: (value: string) => void 
}) => {
    useEffect(() => {
        onChange(defaultPrompt);
    }, [defaultPrompt, onChange]);

    return (
        <Textarea
            name="agent-prompt"
            id={`agent-prompt`}
            placeholder="Enter agent prompt settings..."
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
};

export default function RealtimeConsole() {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [promptValue, setPromptValue] = useState('');

    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const { processCallQueue, progress } = useBatchOutboundCall('call-log');
    

    const {
        data: callLogsResponse,
        isLoading: callLogsIsLoading,
        error: callLogsError,
        refetch: refetchCallLogs
      } = useFindAllFromModule('call-log', {
        orderBy: { column: 'created_at', order: 'desc' },
      });
      const callLogs = callLogsResponse?.data.data || [];
    
      const { data: agentsResponse } = useFindAllFromModule('agent', {});
      const agents = agentsResponse?.data.data || [];

  

    const { data: systemConfigResponse, isLoading: systemConfigIsLoading } =
        useFindAllFromModule('system-config', {});
    const config =
        (systemConfigResponse?.data.data as {
            id: number;
            key: string;
            value: string;
            created_at: Date;
            updated_at: Date;
        }[]) || [];

    // create log useCreateFromModule
    const {
        mutate: createCallLog,
        error: createCallLogError,
        isPending: createCallLogIsPending,
    } = useCreateFromModule('call-log');

    const {
        mutate: makeOutboundCall,
        error: makeOutboundCallError,
        isPending: makeOutboundCallIsPending,
    } = useMakeOutboundCall('call-log');

    const handleSubmitCall = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const number = formData.get('number') as string;
        const name = formData.get('name') as string; // Get the name from the form
        const agent = formData.get('agent-select') as string;
        createCallLog({ number, name, agent }); // Include name in the call log creation
      };

    const {
        mutate: createAgent,
        error: createAgentError,
        isPending: createAgentIsPending,
        isSuccess: createAgentIsSuccess,
        reset: resetCreateAgent,
    } = useCreateFromModule('agent');
    const {
        mutate: updateAgent,
        error: updateAgentError,
        isPending: updateAgentIsPending,
        isSuccess: updateAgentIsSuccess,
        reset: resetUpdateAgent,
    } = useUpdateFromModule('agent');
    const {
        mutateAsync: updateConfigByKey,
        error: updateConfigByKeyError,
        isPending: updateConfigByKeyIsPending,
    } = useUpdateByKeyFromModule('system-config');

    const handleSubmitAgent = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const agent = formData.get('agent-select') as string;
        const name = formData.get('agent-name') as string;
        const prompt = formData.get('agent-prompt') as string;

        if (agent === 'create') {
            createAgent({ name, prompt });
        } else {
            updateAgent({ id: parseInt(agent), data: { prompt } });
        }
    };

    const columnHelper = createColumnHelper<(typeof callLogs)[0]>();
    

    const columns = [
        columnHelper.accessor('call', {
            header: 'Call',
            cell: (info) => (
                <Button
                    disabled={info.row.original.status === 'called'}
                    variant="ghost"
                    size="sm"
                    className={`${
                        info.row.original.status === 'called'
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600'
                    }`}
                    onClick={() => {
                        makeOutboundCall(info.row.original.id);
                    }}
                >
                    <Phone className="h-4 w-4 text-white" />
                </Button>
            ),
        }),
        columnHelper.accessor('id', {
            header: 'Id'
        }),
        columnHelper.accessor('number', {
            header: 'Number'
        }),
        columnHelper.accessor('name', {
            header: 'Name'
        }),
        columnHelper.accessor('status', {
            header: 'Status'
        }),
        columnHelper.accessor('duration', {
            header: 'Duration'
        }),
        columnHelper.accessor('agent', {
            header: 'Agent',
            cell: (info) => {
                const agentId = info.getValue();
                const agent = agents.find(a => a.id === parseInt(String(agentId)));
                return agent ? agent.name : '';
            }
        }),
        columnHelper.accessor('records', {
            header: 'Records',
            cell: (info) => (
                <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    {info.getValue() as string}
                </div>
            )
        }),
        columnHelper.accessor('created_at', {
            header: 'Created_at'
        }),
        columnHelper.accessor('updated_at', {
            header: 'Updated_at'
        }),
        columnHelper.accessor('call_sid', {
            header: 'Call_sid'
        })
    ];

    const table = useReactTable({
        data: callLogs,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    useEffect(() => {
        if (createCallLogError) {
            alert(createCallLogError?.message);
        }
        if (createAgentError) {
            alert(createAgentError?.message);
        }
        if (updateAgentError) {
            alert(updateAgentError?.message);
        }
        if (updateAgentIsSuccess) {
            alert('Agent updated successfully');
        }
        if (createAgentIsSuccess || updateAgentIsSuccess) {
            const form = document.querySelector('#agent-form');
            if (form instanceof HTMLFormElement) {
                form.reset();
                setPromptValue('');
                setSelectedAgentId(null);
            }
            resetCreateAgent();
            resetUpdateAgent();
            alert('Agent created successfully');
        }
        if (makeOutboundCallError) {
            alert(makeOutboundCallError?.message);
        }
        if (updateConfigByKeyError) {
            alert(updateConfigByKeyError?.message);
        }
    }, [
        createCallLogError,
        createAgentError,
        updateAgentError,
        createAgentIsSuccess,
        updateAgentIsSuccess,
        makeOutboundCallError,
        updateConfigByKeyError,
    ]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Modal
                open={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title="Configuration"
                description="Update your OpenAI API key and other settings"
            >
                <form
                    className="mt-4 space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = [
                            {
                                key: 'openai_api_key',
                                value:
                                    formData
                                        .get('openai_api_key')
                                        ?.toString() || '',
                            },
                            {
                                key: 'twilio_account_sid',
                                value:
                                    formData
                                        .get('twilio_account_sid')
                                        ?.toString() || '',
                            },
                            {
                                key: 'twilio_auth_token',
                                value:
                                    formData
                                        .get('twilio_auth_token')
                                        ?.toString() || '',
                            },
                            {
                                key: 'twilio_phone_number',
                                value:
                                    formData
                                        .get('twilio_phone_number')
                                        ?.toString() || '',
                            },
                            {
                                key: 'server_url',
                                value:
                                    formData.get('server_url')?.toString() ||
                                    '',
                            },
                        ];

                        for (let i = 0; i < data.length; i++) {
                            await updateConfigByKey({
                                key: data[i].key,
                                value: data[i].value,
                            });
                        }

                        // TODO: Call API to save config
                        setIsConfigModalOpen(false);
                    }}
                >
                    <div>
                        <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                        <Input
                            id="openai_api_key"
                            name="openai_api_key"
                            type="text"
                            placeholder="sk-..."
                            defaultValue={
                                config.find((c) => c.key === 'openai_api_key')
                                    ?.value
                            }
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="twilio_account_sid">
                            Twilio Account SID
                        </Label>
                        <Input
                            id="twilio_account_sid"
                            name="twilio_account_sid"
                            type="text"
                            placeholder="AC..."
                            defaultValue={
                                config.find(
                                    (c) => c.key === 'twilio_account_sid'
                                )?.value
                            }
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="twilio_auth_token">
                            Twilio Auth Token
                        </Label>
                        <Input
                            id="twilio_auth_token"
                            name="twilio_auth_token"
                            type="text"
                            placeholder="Enter auth token..."
                            defaultValue={
                                config.find(
                                    (c) => c.key === 'twilio_auth_token'
                                )?.value
                            }
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="twilio_phone_number">
                            Twilio Phone Number
                        </Label>
                        <Input
                            id="twilio_phone_number"
                            name="twilio_phone_number"
                            type="text"
                            placeholder="+1234567890"
                            defaultValue={
                                config.find(
                                    (c) => c.key === 'twilio_phone_number'
                                )?.value
                            }
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="server_url">Server URL</Label>
                        <Input
                            id="server_url"
                            name="server_url"
                            type="text"
                            placeholder="https://example.com"
                            defaultValue={
                                config.find((c) => c.key === 'server_url')
                                    ?.value
                            }
                            className="mt-1"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={updateConfigByKeyIsPending}
                    >
                        {updateConfigByKeyIsPending ? 'Saving...' : 'Save'}
                    </Button>
                </form>
            </Modal>

            {makeOutboundCallIsPending && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <p className="text-lg font-semibold text-gray-700">
                                Making outbound call...
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <header className="bg-white shadow-sm p-2">
                <div className="mx-auto flex justify-between items-center">
                    <h1 className="text-base font-medium text-gray-700">
                        Realtime Call Center
                    </h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                            Api Config
                            {config.length === 0 && !systemConfigIsLoading && (
                                <span className="text-xs text-red-500 ml-1">
                                    (Please set configuration)
                                </span>
                            )}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setIsConfigModalOpen(true);
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-grow ">
                <div className="flex gap-2">
                    {/* Left: DataGrid */}
                    <div className="flex-1 max-w-[100vw-320px] overflow-x-scroll">
                        {callLogsIsLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-sm font-medium text-gray-600">
                                    Loading...
                                </div>
                            </div>
                        ) : callLogsError ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-sm font-medium text-red-600">
                                    Error: {callLogsError.message}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 max-w-[100vw-320px] overflow-x-scroll">
                       

                                {/* Batch Calling Controls */}
                                <div className="p-4 space-y-4">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                const pendingCallsList = callLogs
                                                    .filter(log => log.status === 'pending')
                                                    .map(log => log.id);
                                                if (pendingCallsList.length === 0) {
                                                    alert('No pending calls found');
                                                    return;
                                                }
                                                if (confirm(`Start calling ${pendingCallsList.length} pending numbers?`)) {
                                                    processCallQueue(pendingCallsList);
                                                }
                                            }}
                                            disabled={progress.isProcessing}
                                            variant="secondary"
                                            className="flex items-center gap-2"
                                        >
                                            {progress.isProcessing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Calling {progress.currentCallIndex + 1} of {progress.totalCalls}
                                                </>
                                            ) : (
                                                'Call All Pending'
                                            )}
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                if (selectedRows.length === 0) {
                                                    alert('Please select at least one row');
                                                    return;
                                                }
                                                if (confirm(`Start calling ${selectedRows.length} selected numbers?`)) {
                                                    processCallQueue(selectedRows);
                                                }
                                            }}
                                            disabled={progress.isProcessing || selectedRows.length === 0}
                                            variant="secondary"
                                            className="flex items-center gap-2"
                                        >
                                            {progress.isProcessing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Calling {progress.currentCallIndex + 1} of {progress.totalCalls}
                                                </>
                                            ) : (
                                                `Call Selected (${selectedRows.length})`
                                            )}
                                        </Button>
                                    </div>

                                    {/* Error Display */}
                                    {progress.errors.length > 0 && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Errors occurred during batch calling</AlertTitle>
                                            <AlertDescription>
                                                <ul className="list-disc pl-4 mt-2">
                                                    {progress.errors.map((error, index) => (
                                                        <li key={index}>
                                                            ID {error.id}: {error.error}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                        
                            {/* DataGrid */}
                            {callLogsIsLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-sm font-medium text-gray-600">
                                        Loading...
                                    </div>
                                </div>
                            ) : callLogsError ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-sm font-medium text-red-600">
                                        Error: {getErrorMessage(callLogsError)}
                                    </div>
                                </div>
                            ) : (
                                <DataGrid
                                    table={table}
                                    freezeColumns={1}
                                    onCellEdit={() => {}}
                                    selectedRows={selectedRows}
                                    onRowSelect={setSelectedRows}
                                />
                            )}
                        </div>
                        )}
                    </div>

                    <div className="w-80">
                        <Card className="p-4 my-2 mr-2">
                        <h3 className="text-lg font-medium text-gray-700">
                            Add Call
                        </h3>
                        <form
                            onSubmit={handleSubmitCall}
                            className="space-y-4"
                        >
                            <div className="">
                            <Label className="text-xs" htmlFor="name">
                                Name
                            </Label>
                            <Input
                                name="name"
                                id="name"
                                placeholder="Enter name"
                                required
                            />
                            </div>
                            <div className="">
                            <Label className="text-xs" htmlFor="number">
                                Phone Number
                            </Label>
                            <Input
                                name="number"
                                id="number"
                                placeholder="+1(000)000-0000"
                                required
                            />
                            </div>
                                <div className="">
                                    <Label
                                        className="text-xs"
                                        htmlFor="agent-select"
                                    >
                                        Select Agent
                                    </Label>
                                    <Select required name="agent-select">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an agent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agents.map((agent) => (
                                                <SelectItem
                                                    value={`${agent.id}`}
                                                >
                                                    {`${agent.id} - ${agent.name}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    disabled={createCallLogIsPending}
                                    variant="secondary"
                                    type="submit"
                                    className="w-full"
                                >
                                    {createCallLogIsPending
                                        ? 'Submitting...'
                                        : 'Submit'}
                                </Button>
                            </form>
                        </Card>


                        <Card className="p-4 my-2 mr-2">
                            <h3 className="text-lg font-medium text-gray-700">
                                Agent Prompt
                            </h3>
                            <form
                                id="agent-form"
                                onSubmit={handleSubmitAgent}
                                className="space-y-4"
                            >
                                <div className="">
                                    <Label
                                        className="text-xs"
                                        htmlFor="agent-select"
                                    >
                                        Select Agent
                                    </Label>
                                    <Select
                                        required
                                        value={selectedAgentId || ''}
                                        onValueChange={(value) =>
                                            setSelectedAgentId(value)
                                        }
                                        name="agent-select"
                                    >
                                        <SelectTrigger
                                            id="agent-select"
                                            name="agent-select"
                                        >
                                            <SelectValue placeholder="Select an agent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="create">
                                                Create New Agent
                                            </SelectItem>
                                            {agents.map((agent) => (
                                                <SelectItem
                                                    value={`${agent.id}`}
                                                >
                                                    {`${agent.id} - ${agent.name}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedAgentId === 'create' && (
                                    <>
                                        <div className="">
                                            <Label
                                                className="text-xs"
                                                htmlFor="agent-name"
                                            >
                                                Agent Name
                                            </Label>
                                            <Input
                                                id="agent-name"
                                                name="agent-name"
                                                placeholder="Enter agent name..."
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="">
                                    <Label
                                        className="text-xs"
                                        htmlFor="agent-prompt"
                                    >
                                        Agent Prompt
                                    </Label>
                                    <AgentPromptTextarea
                                        defaultPrompt={
                                            agents.find(
                                                (agent) =>
                                                    `${agent.id}` ===
                                                    selectedAgentId
                                            )?.prompt || ''
                                        }
                                        value={promptValue}
                                        onChange={setPromptValue}
                                    />
                                </div>
                                <Button
                                    disabled={
                                        createAgentIsPending ||
                                        updateAgentIsPending
                                    }
                                    variant="secondary"
                                    type="submit"
                                    className="w-full"
                                >
                                    {createAgentIsPending ||
                                    updateAgentIsPending
                                        ? 'Submitting...'
                                        : 'Save'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-4 my-2 mr-2">
                            <h3 className="text-lg font-medium text-gray-700 mb-4">
                                Import CSV
                            </h3>
                            <CsvImport 
                                agents={agents.map((agent) => ({ id: agent.id, name: agent.name }))} 
                                onImportSuccess={() => {
                                    refetchCallLogs();
                                    alert('CSV imported successfully!');
                                }} 
                            />
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
