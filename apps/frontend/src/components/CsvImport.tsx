import React, { useState } from 'react';
import { Button } from '@/components/elements/button';
import { Input } from '@/components/elements/input';
import { Label } from '@/components/elements/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/elements/select';
import axios from 'axios';
import { Loader2 } from 'lucide-react'; // Import loading spinner icon

interface CsvImportProps {
  agents: { id: number; name: string }[];
  onImportSuccess: () => void;
}

const CsvImport: React.FC<CsvImportProps> = ({ agents, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !selectedAgent) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', selectedAgent);

    try {
      await axios.post('/api/call-log/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onImportSuccess();
      setFile(null);
      setSelectedAgent('');
    } catch (error) {
      console.error('Error importing CSV:', error);
      setError('Failed to import CSV. Please check the file and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="csv-file">CSV File</Label>
        <Input 
          id="csv-file" 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          disabled={isLoading}
          required
        />
      </div>
      <div>
        <Label htmlFor="agent-select">Select Agent</Label>
        <Select 
          value={selectedAgent} 
          onValueChange={setSelectedAgent}
          name="agent-select"
          disabled={isLoading}
          required
        >
          <SelectTrigger id="agent-select">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={String(agent.id)}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && (
        <div className="text-red-500 text-sm font-medium">{error}</div>
      )}
      <Button 
        type="submit" 
        disabled={!file || !selectedAgent || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          'Import CSV'
        )}
      </Button>
    </form>
  );
};

export default CsvImport;