import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, LoaderCircle, Play, Send } from "lucide-react";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { INBOX_PARAM, START_RUN_QUERY_PARAM } from "./constants";
import { useQueryParams } from "./hooks/use-query-params";
import { useThreadsContext, InputSchemaField } from "./contexts/ThreadContext";
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function StartRunView() {
  const [formData, setFormData] = useState<Record<string, string | any[]>>({});
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [newThreadId, setNewThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<InputSchemaField[]>([]);
  
  const { updateQueryParams } = useQueryParams();
  const { agentInboxes, fetchSchema, triggerNewRun } = useThreadsContext();
  const { toast } = useToast();
  
  // Get the selected agent inbox
  const selectedInbox = agentInboxes.find(inbox => inbox.selected);

  // Fetch schema when the component mounts or the selected inbox changes
  useEffect(() => {
    if (selectedInbox?.graphId) {
      setSchemaLoading(true);
      fetchSchema(selectedInbox.graphId)
        .then(schema => {
          setSchema(schema);
        })
        .catch(err => {
          console.error("Error fetching schema:", err);
          toast({ 
            title: "Error", 
            description: `Failed to fetch input schema: ${err.message}`, 
            variant: "destructive" 
          });
          // Fall back to a default schema
          setSchema([
            { 
              name: 'input_prompt', 
              label: 'Input', 
              type: 'textarea', 
              required: true,
              rows: 5,
              placeholder: 'Enter your input for the agent...',
              description: 'Provide instructions or data for the agent to process in this run.'
            }
          ]);
        })
        .finally(() => {
          setSchemaLoading(false);
        });
    }
  }, [selectedInbox?.id, selectedInbox?.graphId, fetchSchema, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInbox?.graphId) {
      toast({ 
        title: "Error", 
        description: "No graph ID available for the selected agent.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    setError(null);
    setNewThreadId(null);

    try {
      const result = await triggerNewRun(selectedInbox.graphId, formData);
      
      setNewThreadId(result.thread_id);
      toast({ 
        title: "Success", 
        description: `Run started (Thread ID: ${result.thread_id})` 
      });
      setFormData({}); // Clear form on success

    } catch (err: any) {
      setError(err.message);
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyThreadId = () => {
    if (newThreadId) {
      navigator.clipboard.writeText(newThreadId);
      toast({ 
        title: "Copied", 
        description: "Thread ID copied to clipboard" 
      });
    }
  };

  const handleViewProgress = () => {
    if (newThreadId && selectedInbox) {
      updateQueryParams(START_RUN_QUERY_PARAM);
      updateQueryParams(INBOX_PARAM, "busy");
      // Navigate to the thread view
      updateQueryParams("view_state_thread_id", newThreadId);
    }
  };

  return (
    <div className="flex flex-col min-h-full w-full p-12 gap-9">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
        <div className="flex items-center justify-start gap-3">
          <TooltipIconButton
            variant="ghost"
            onClick={() => updateQueryParams(START_RUN_QUERY_PARAM)}
            tooltip="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </TooltipIconButton>
          <p className="text-2xl tracking-tighter text-pretty">Start New Run</p>
        </div>
        
        {newThreadId && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{newThreadId}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyThreadId}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-muted-foreground">State:</span>
              <span className="text-blue-600 font-medium">Running</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          {!selectedInbox ? (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500 italic">
                No agent inbox selected. Please select an agent inbox in settings.
              </p>
            </div>
          ) : schemaLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-10 w-[120px]" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Agent</p>
                <p className="text-base font-medium">
                  {selectedInbox.name || selectedInbox.graphId}
                </p>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Graph ID</p>
                <p className="text-base font-medium">{selectedInbox.graphId}</p>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 items-start w-full rounded-xl border-[1px] border-gray-300">
                <div className="flex items-center justify-between w-full">
                  <p className="font-semibold text-black text-base">
                    Start New Run
                  </p>
                </div>
                {schema.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500 italic">
                      No input schema available for this agent. Using the default input form.
                    </p>
                    <div className="mt-4">
                      <Label htmlFor="input_prompt" className="text-sm min-w-fit font-medium capitalize">Input</Label>
                      <Textarea
                        id="input_prompt"
                        name="input_prompt"
                        value={formData["input_prompt"] || ''}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Enter your input for the agent..."
                        disabled={loading}
                        className="mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {schema.map((field) => (
                      <div key={field.name} className="flex flex-col gap-[6px] items-start w-full">
                        <Label htmlFor={field.name} className="text-sm min-w-fit font-medium capitalize">
                          {field.label || field.name.replace(/_/g, ' ')}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
                        )}
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            required={field.required}
                            rows={field.rows || 3}
                            placeholder={field.placeholder || ''}
                            disabled={loading}
                            className="w-full"
                          />
                        ) : field.type === 'boolean' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              id={field.name}
                              name={field.name}
                              type="checkbox"
                              checked={formData[field.name] === 'true'}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [field.name]: e.target.checked ? 'true' : 'false' 
                              })}
                              required={field.required}
                              disabled={loading}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={field.name} className="text-sm">
                              {field.placeholder || 'Enable'}
                            </Label>
                          </div>
                        ) : field.type === 'array' ? (
                          <div className="flex flex-col gap-2 w-full">
                            {Array.isArray(formData[field.name])
                              ? (formData[field.name] as any[]).map((item: string, idx: number) => (
                                  <div key={`${field.name}-item-${idx}`} className="flex items-center gap-2 w-full">
                                    <Input
                                      id={`${field.name}-${idx}`}
                                      name={`${field.name}-${idx}`}
                                      type={field.itemType === 'number' ? 'number' : 'text'}
                                      value={item}
                                      onChange={(e) => {
                                        const arr = Array.isArray(formData[field.name]) ? [...(formData[field.name] as any[])] : [];
                                        arr[idx] = e.target.value;
                                        setFormData({ ...formData, [field.name]: arr });
                                      }}
                                      required={field.required}
                                      placeholder={field.placeholder || ''}
                                      disabled={loading}
                                      className="w-full"
                                    />
                                    {/* Remove button for dynamic arrays (not for prefixItems/fixed length) */}
                                    {(!field.prefixItems || idx >= field.prefixItems.length) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const arr = Array.isArray(formData[field.name]) ? [...(formData[field.name] as any[])] : [];
                                          arr.splice(idx, 1);
                                          setFormData({ ...formData, [field.name]: arr });
                                        }}
                                        disabled={loading}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                ))
                              : Array.isArray(field.prefixItems)
                              ? field.prefixItems.map((_, idx: number) => (
                                  <div key={`${field.name}-item-${idx}`} className="flex items-center gap-2 w-full">
                                    <Input
                                      id={`${field.name}-${idx}`}
                                      name={`${field.name}-${idx}`}
                                      type={field.itemType === 'number' ? 'number' : 'text'}
                                      value={Array.isArray(formData[field.name]) ? (formData[field.name] as any[])[idx] || '' : ''}
                                      onChange={(e) => {
                                        const arr = Array.isArray(formData[field.name]) ? [...(formData[field.name] as any[])] : Array(field.prefixItems.length).fill('');
                                        arr[idx] = e.target.value;
                                        setFormData({ ...formData, [field.name]: arr });
                                      }}
                                      required={field.required}
                                      placeholder={field.placeholder || ''}
                                      disabled={loading}
                                      className="w-full"
                                    />
                                  </div>
                                ))
                              : null}
                            {/* Add button for dynamic arrays (if maxItems not reached) */}
                            {(!field.maxItems ||
                              (Array.isArray(formData[field.name]) ? (formData[field.name] as any[]).length : 0) < field.maxItems) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const arr = Array.isArray(formData[field.name]) ? [...(formData[field.name] as any[])] : [];
                                  arr.push('');
                                  setFormData({ ...formData, [field.name]: arr });
                                }}
                                disabled={loading}
                              >
                                Add {field.label || field.name}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Input
                            id={field.name}
                            name={field.name}
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            required={field.required}
                            placeholder={field.placeholder || ''}
                            disabled={loading}
                            className="w-full"
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}
                
                <div className="flex items-center justify-end w-full gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    variant="brand"
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    {loading ? 'Starting...' : 'Start Run'}
                  </Button>
                </div>
              </form>
              
              {error && (
                <div className="mt-4 p-4 border rounded bg-red-50 border-red-200 text-red-700">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {newThreadId && (
                <div className="mt-4 p-4 border rounded bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 font-medium">Run started successfully!</p>
                      <p className="text-sm text-gray-700">A new thread was created and the run has been initiated.</p>
                    </div>
                    <Button
                      onClick={handleViewProgress}
                      variant="brand"
                      size="sm"
                      className="flex items-center gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" />
                      View Progress
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
