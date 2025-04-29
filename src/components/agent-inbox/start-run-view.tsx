import React from "react";
import { useThreadsContext } from "./contexts/ThreadContext";
import { useQueryParams } from "./hooks/use-query-params";
import { INBOX_PARAM, START_RUN_QUERY_PARAM, VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";
import { InputSchemaField } from "./types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BreadCrumb } from "./components/breadcrumb";
import { LoaderCircle, Copy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function StartRunView() {
  const { agentInboxes, fetchSchema, triggerNewRun } = useThreadsContext();
  const { updateQueryParams, getSearchParam } = useQueryParams();
  const { toast } = useToast();
  
  const [selectedInbox, setSelectedInbox] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [schema, setSchema] = React.useState<InputSchemaField[]>([]);
  const [newThreadId, setNewThreadId] = React.useState<string | null>(null);

  // Initialize selected inbox from the agent_inbox query param
  React.useEffect(() => {
    if (agentInboxes.length > 0) {
      const selected = agentInboxes.find(inbox => inbox.selected);
      if (selected) {
        setSelectedInbox(selected.graphId);
        fetchInputSchema(selected.graphId);
      }
    }
  }, [agentInboxes]);

  // Fetch the input schema for the selected inbox
  const fetchInputSchema = async (graphId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const schema = await fetchSchema(graphId);
      setSchema(schema);
      
      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      schema.forEach(field => {
        if (field.type === 'array') {
          initialData[field.name] = [];
        } else if (field.type === 'boolean') {
          initialData[field.name] = false;
        } else {
          initialData[field.name] = '';
        }
      });
      setFormData(initialData);
    } catch (error: any) {
      setError(`Failed to fetch input schema: ${error.message}`);
      console.error("Error fetching schema:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle array field changes
  const handleArrayItemChange = (fieldName: string, index: number, value: any) => {
    setFormData(prev => {
      const array = [...(prev[fieldName] || [])];
      array[index] = value;
      return {
        ...prev,
        [fieldName]: array
      };
    });
  };

  // Add a new item to an array field
  const handleAddArrayItem = (fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), '']
    }));
  };

  // Remove an item from an array field
  const handleRemoveArrayItem = (fieldName: string, index: number) => {
    setFormData(prev => {
      const array = [...(prev[fieldName] || [])];
      array.splice(index, 1);
      return {
        ...prev,
        [fieldName]: array
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInbox) {
      setError("Please select an agent inbox");
      return;
    }

    // Validate required fields
    const missingFields = schema
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await triggerNewRun(selectedInbox, formData);
      setNewThreadId(result.thread_id);
      toast({
        title: "Run started successfully",
        description: `Thread ID: ${result.thread_id}`,
        duration: 5000,
      });
    } catch (error: any) {
      setError(`Failed to start run: ${error.message}`);
      console.error("Error starting run:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy thread ID to clipboard
  const handleCopyThreadId = () => {
    if (newThreadId) {
      navigator.clipboard.writeText(newThreadId);
      toast({
        title: "Copied to clipboard",
        description: "Thread ID copied to clipboard",
        duration: 3000,
      });
    }
  };

  // Navigate to view the thread progress
  const handleViewProgress = () => {
    if (newThreadId && selectedInbox) {
      updateQueryParams(START_RUN_QUERY_PARAM); // removes start_run param
      updateQueryParams(INBOX_PARAM, "busy");
      updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM, newThreadId);
    }
  };

  // Render a form field based on its type
  const renderField = (field: InputSchemaField) => {
    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="block mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <Textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 5}
              className="w-full"
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div key={field.name} className="mb-4 flex items-start space-x-2">
            <Checkbox
              id={field.name}
              checked={!!formData[field.name]}
              onCheckedChange={(checked) => handleInputChange(field.name, checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              {field.description && (
                <p className="text-sm text-gray-500">{field.description}</p>
              )}
            </div>
          </div>
        );
      
      case 'number':
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="block mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <Input
              id={field.name}
              type="number"
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full"
            />
          </div>
        );
      
      case 'array':
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="block mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            {(formData[field.name] || []).map((item: any, index: number) => (
              <div key={`${field.name}-${index}`} className="flex mb-2">
                <Input
                  value={item}
                  onChange={(e) => handleArrayItemChange(field.name, index, e.target.value)}
                  placeholder={field.items?.placeholder}
                  className="flex-grow"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveArrayItem(field.name, index)}
                  className="ml-2"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddArrayItem(field.name)}
              className="mt-2"
            >
              Add Item
            </Button>
          </div>
        );
      
      default: // 'string' or any other type
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="block mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <Input
              id={field.name}
              type="text"
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-w-[1000px] h-full overflow-y-auto">
      <div className="pl-5 pt-4">
        <BreadCrumb />
      </div>
      
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Start New Run</h1>
        
        {newThreadId ? (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertTitle className="text-xl font-semibold text-green-800">Run Started Successfully</AlertTitle>
            <AlertDescription>
              <p className="mb-4">Your run has been started with the following thread ID:</p>
              
              <div className="flex items-center mb-6">
                <code className="bg-white p-2 rounded border mr-2 flex-grow font-mono">
                  {newThreadId}
                </code>
                <Button variant="outline" onClick={handleCopyThreadId} className="flex items-center">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button variant="brand" onClick={handleViewProgress} className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <LoaderCircle className="h-8 w-8 animate-spin mr-2" />
                <span>Loading input schema...</span>
              </div>
            ) : (
              <>
                {schema.map(renderField)}
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    type="submit" 
                    variant="brand"
                    disabled={isSubmitting}
                    className="flex items-center"
                  >
                    {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                    Start Run
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
