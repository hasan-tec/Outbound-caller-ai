import { useState } from 'react';
import { Card } from '@/components/elements/card';
import { Button } from '@/components/elements/button';
import { Input } from '@/components/elements/input';
import { Label } from '@/components/elements/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/elements/select';


interface Agent {
  id: number;
  name: string;
  prompt: string;
}

interface GoogleSheetsImportProps {
  agents: Agent[];
}

const GoogleSheetsImport = ({ agents }: GoogleSheetsImportProps) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!webhookUrl || !selectedAgent) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/call-log/import-from-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          agentId: parseInt(selectedAgent),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import data');
      }

      alert('Data imported successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to import data: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 my-2">
      <h3 className="text-lg font-medium text-gray-700 mb-4">
        Import from Google Sheets
      </h3>
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <Label className="text-xs" htmlFor="webhook-url">
            Google Sheets Webhook URL
          </Label>
          <Input
            id="webhook-url"
            value={webhookUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)}
            placeholder="Enter webhook URL"
            required
          />
        </div>
        <div>
          <Label className="text-xs" htmlFor="agent-select">
            Select Agent
          </Label>
          <Select 
            value={selectedAgent}
            onValueChange={setSelectedAgent}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {`${agent.id} - ${agent.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={loading}
          variant="secondary"
          className="w-full"
        >
          {loading ? 'Loading...' : 'Load from Sheets'}
        </Button>
      </form>
    </Card>
  );
};

export default GoogleSheetsImport;