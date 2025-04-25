"use client";

import { v4 as uuidv4, validate } from "uuid";
import {
  AgentInbox,
  HumanInterrupt,
  HumanResponse,
  ThreadData,
  ThreadStatusWithAll,
} from "@/components/agent-inbox/types";
import { useToast, type ToastInput } from "@/hooks/use-toast";
import { createClient } from "@/lib/client";
import {
  Run,
  Thread,
  ThreadState,
  ThreadStatus,
} from "@langchain/langgraph-sdk";
import { END } from "@langchain/langgraph/web";
import React from "react";
import { useQueryParams } from "../hooks/use-query-params";
import {
  INBOX_PARAM,
  LIMIT_PARAM,
  OFFSET_PARAM,
  AGENT_INBOX_PARAM,
  AGENT_INBOXES_LOCAL_STORAGE_KEY,
  LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY,
  NO_INBOXES_FOUND_PARAM,
} from "../constants";
import {
  getInterruptFromThread,
  getThreadFilterMetadata,
  processInterruptedThread,
  processThreadWithoutInterrupts,
} from "./utils";
import { useLocalStorage } from "../hooks/use-local-storage";

// Define the InputSchemaField type for form generation
export interface InputSchemaField {
  name: string;
  label?: string;
  description?: string;
  type: 'string' | 'textarea' | 'number' | 'boolean' | 'array';
  required?: boolean;
  placeholder?: string;
  rows?: number;
  // For array fields
  itemType?: 'string' | 'number' | 'boolean';
  minItems?: number;
  maxItems?: number;
  prefixItems?: any[];
}

type ThreadContentType<
  ThreadValues extends Record<string, any> = Record<string, any>,
> = {
  loading: boolean;
  threadData: ThreadData<ThreadValues>[];
  hasMoreThreads: boolean;
  agentInboxes: AgentInbox[];
  deleteAgentInbox: (id: string) => void;
  changeAgentInbox: (graphId: string, replaceAll?: boolean) => void;
  addAgentInbox: (agentInbox: AgentInbox) => void;
  ignoreThread: (threadId: string) => Promise<void>;
  fetchThreads: (inbox: ThreadStatusWithAll) => Promise<void>;
  fetchSchema: (graphId: string) => Promise<InputSchemaField[]>;
  triggerNewRun: (graphId: string, input: Record<string, any>) => Promise<{ thread_id: string }>;
  sendHumanResponse: <TStream extends boolean = false>(
    threadId: string,
    response: HumanResponse[],
    options?: {
      stream?: TStream;
    }
  ) => TStream extends true
    ?
        | AsyncGenerator<{
            event: Record<string, any>;
            data: any;
          }>
        | undefined
    : Promise<Run> | undefined;
  fetchSingleThread: (threadId: string) => Promise<
    | {
        thread: Thread<ThreadValues>;
        status: ThreadStatus;
        interrupts: HumanInterrupt[] | undefined;
      }
    | undefined
  >;
};

const ThreadsContext = React.createContext<ThreadContentType | undefined>(
  undefined
);

interface GetClientArgs {
  agentInboxes: AgentInbox[];
  getItem: (key: string) => string | null | undefined;
  toast: (input: ToastInput) => void;
}

const getClient = ({ agentInboxes, getItem, toast }: GetClientArgs) => {
  if (agentInboxes.length === 0) {
    toast({
      title: "Error",
      description: "Agent inbox not found. Please add an inbox in settings. (",
      variant: "destructive",
      duration: 3000,
    });
    return;
  }
  const deploymentUrl = agentInboxes.find((i) => i.selected)?.deploymentUrl;
  if (!deploymentUrl) {
    toast({
      title: "Error",
      description:
        "Please ensure your selected agent inbox has a deployment URL.",
      variant: "destructive",
      duration: 5000,
    });
    return;
  }

  const langchainApiKeyLS =
    getItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY) || undefined;
  // Only show this error if the deployment URL is for a deployed LangGraph instance.
  // Local graphs do NOT require an API key.
  if (!langchainApiKeyLS && deploymentUrl.includes("us.langgraph.app")) {
    toast({
      title: "Error",
      description: "Please add your LangSmith API key in settings.",
      variant: "destructive",
      duration: 5000,
    });
    return;
  }

  return createClient({ deploymentUrl, langchainApiKey: langchainApiKeyLS });
};

export function ThreadsProvider<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ children }: { children: React.ReactNode }) {
  const { getSearchParam, searchParams, updateQueryParams } = useQueryParams();
  const { getItem, setItem } = useLocalStorage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [threadData, setThreadData] = React.useState<
    ThreadData<ThreadValues>[]
  >([]);
  const [hasMoreThreads, setHasMoreThreads] = React.useState(true);
  const [agentInboxes, setAgentInboxes] = React.useState<AgentInbox[]>([]);

  const limitParam = searchParams.get(LIMIT_PARAM);
  const offsetParam = searchParams.get(OFFSET_PARAM);
  const inboxParam = searchParams.get(INBOX_PARAM);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!agentInboxes.length) {
      return;
    }
    const inboxSearchParam = getSearchParam(INBOX_PARAM) as ThreadStatusWithAll;
    if (!inboxSearchParam) {
      return;
    }
    try {
      fetchThreads(inboxSearchParam);
    } catch (e) {
      console.error("Error occurred while fetching threads", e);
    }
  }, [limitParam, offsetParam, inboxParam, agentInboxes]);

  const agentInboxParam = searchParams.get(AGENT_INBOX_PARAM);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      getAgentInboxes();
    } catch (e) {
      console.error("Error occurred while fetching agent inboxes", e);
    }
  }, [agentInboxParam]);

  const getAgentInboxes = React.useCallback(async () => {
    const agentInboxSearchParam = getSearchParam(AGENT_INBOX_PARAM);
    const agentInboxes = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    if (!agentInboxes || !agentInboxes.length) {
      updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
      return;
    }
    let parsedAgentInboxes: AgentInbox[] = [];
    try {
      parsedAgentInboxes = JSON.parse(agentInboxes);
    } catch (error) {
      console.error("Error parsing agent inboxes", error);
      toast({
        title: "Error",
        description: "Agent inbox not found. Please add an inbox in settings.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!parsedAgentInboxes.length) {
      const noInboxesFoundParam = searchParams.get(NO_INBOXES_FOUND_PARAM);
      if (noInboxesFoundParam !== "true") {
        updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
      }
      return;
    }

    // Ensure each agent inbox has an ID, and if not, add one
    parsedAgentInboxes = parsedAgentInboxes.map((i) => {
      return {
        ...i,
        id: i.id || uuidv4(),
      };
    });

    // If there is no agent inbox search param, or the search param is not
    // a valid UUID, update search param and local storage
    if (!agentInboxSearchParam || !validate(agentInboxSearchParam)) {
      const selectedInbox = parsedAgentInboxes.find((i) => i.selected);
      if (!selectedInbox) {
        parsedAgentInboxes[0].selected = true;
        updateQueryParams(AGENT_INBOX_PARAM, parsedAgentInboxes[0].id);
        setAgentInboxes(parsedAgentInboxes);
        setItem(
          AGENT_INBOXES_LOCAL_STORAGE_KEY,
          JSON.stringify(parsedAgentInboxes)
        );
      } else {
        updateQueryParams(AGENT_INBOX_PARAM, selectedInbox.id);
        setAgentInboxes(parsedAgentInboxes);
        setItem(
          AGENT_INBOXES_LOCAL_STORAGE_KEY,
          JSON.stringify(parsedAgentInboxes)
        );
      }
      return;
    }

    const selectedInbox = parsedAgentInboxes.find(
      (i) =>
        i.id === agentInboxSearchParam || i.graphId === agentInboxSearchParam
    );
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "Agent inbox not found. Please add an inbox in settings.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    parsedAgentInboxes = parsedAgentInboxes.map((i) => {
      return {
        ...i,
        selected:
          i.id === agentInboxSearchParam || i.graphId === agentInboxSearchParam,
      };
    });
    setAgentInboxes(parsedAgentInboxes);
    setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(parsedAgentInboxes)
    );
  }, []);

  const addAgentInbox = React.useCallback((agentInbox: AgentInbox) => {
    const agentInboxes = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    if (!agentInboxes || !agentInboxes.length) {
      setAgentInboxes([agentInbox]);
      setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify([agentInbox]));
      updateQueryParams(AGENT_INBOX_PARAM, agentInbox.id);
      return;
    }
    const parsedAgentInboxes = JSON.parse(agentInboxes);
    parsedAgentInboxes.push(agentInbox);
    setAgentInboxes(parsedAgentInboxes);
    setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(parsedAgentInboxes)
    );
    updateQueryParams(AGENT_INBOX_PARAM, agentInbox.id);
  }, []);

  const deleteAgentInbox = React.useCallback((id: string) => {
    const agentInboxes = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    if (!agentInboxes || !agentInboxes.length) {
      return;
    }
    const parsedAgentInboxes: AgentInbox[] = JSON.parse(agentInboxes);
    const updatedAgentInboxes = parsedAgentInboxes.filter((i) => i.id !== id);

    if (!updatedAgentInboxes.length) {
      updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
      setAgentInboxes([]);
      setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify([]));
      // Clear all query params
      const url = new URL(window.location.href);
      window.location.href = url.pathname;
      return;
    }

    setAgentInboxes(updatedAgentInboxes);
    setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(updatedAgentInboxes)
    );
    changeAgentInbox(updatedAgentInboxes[0].id, true);
  }, []);

  const changeAgentInbox = (id: string, replaceAll?: boolean) => {
    setAgentInboxes((prev) =>
      prev.map((i) => ({
        ...i,
        selected: i.id === id,
      }))
    );
    if (!replaceAll) {
      updateQueryParams(AGENT_INBOX_PARAM, id);
    } else {
      const url = new URL(window.location.href);
      const newParams = new URLSearchParams({
        [AGENT_INBOX_PARAM]: id,
      });
      const newUrl = url.pathname + "?" + newParams.toString();
      window.location.href = newUrl;
    }
  };

  const fetchThreads = React.useCallback(
    async (inbox: ThreadStatusWithAll) => {
      setLoading(true);
      const client = getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        return;
      }

      try {
        const limitQueryParam = getSearchParam(LIMIT_PARAM);
        if (!limitQueryParam) {
          throw new Error("Limit query param not found");
        }
        const offsetQueryParam = getSearchParam(OFFSET_PARAM);
        if (!offsetQueryParam) {
          throw new Error("Offset query param not found");
        }
        const limit = Number(limitQueryParam);
        const offset = Number(offsetQueryParam);

        if (limit > 100) {
          toast({
            title: "Error",
            description: "Cannot fetch more than 100 threads at a time",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const statusInput = inbox === "all" ? {} : { status: inbox };
        const metadataInput = getThreadFilterMetadata(agentInboxes);

        const threadSearchArgs = {
          offset,
          limit,
          ...statusInput,
          ...(metadataInput ? { metadata: metadataInput } : {}),
        };
        const threads = await client.threads.search(threadSearchArgs);
        const data: ThreadData<ThreadValues>[] = [];

        if (["interrupted", "all"].includes(inbox)) {
          const interruptedThreads = threads.filter(
            (t) => t.status === "interrupted"
          );

          // Process threads with interrupts in their thread object
          const processedThreads = interruptedThreads
            .map((t) => processInterruptedThread(t as Thread<ThreadValues>))
            .filter((t): t is ThreadData<ThreadValues> => !!t);
          data.push(...processedThreads);

          // [LEGACY]: Process threads that need state lookup
          const threadsWithoutInterrupts = interruptedThreads.filter(
            (t) => !getInterruptFromThread(t)?.length
          );

          if (threadsWithoutInterrupts.length > 0) {
            const states = await bulkGetThreadStates(
              threadsWithoutInterrupts.map((t) => t.thread_id)
            );

            const interruptedData = states.map((state) => {
              const thread = threadsWithoutInterrupts.find(
                (t) => t.thread_id === state.thread_id
              );
              if (!thread) {
                throw new Error(`Thread not found: ${state.thread_id}`);
              }
              return processThreadWithoutInterrupts(
                thread as Thread<ThreadValues>,
                state
              );
            });

            data.push(...interruptedData);
          }
        }

        threads.forEach((t) => {
          if (t.status === "interrupted") {
            return;
          }
          data.push({
            status: t.status,
            thread: t as Thread<ThreadValues>,
          });
        });

        // Sort data by created_at in descending order (most recent first)
        const sortedData = data.sort((a, b) => {
          return (
            new Date(b.thread.created_at).getTime() -
            new Date(a.thread.created_at).getTime()
          );
        });

        setThreadData(sortedData);
        setHasMoreThreads(threads.length === limit);
      } catch (e) {
        console.error("Failed to fetch threads", e);
      }
      setLoading(false);
    },
    [agentInboxes]
  );

  const fetchSingleThread = React.useCallback(
    async (
      threadId: string
    ): Promise<
      | {
          thread: Thread<ThreadValues>;
          status: ThreadStatus;
          interrupts: HumanInterrupt[] | undefined;
        }
      | undefined
    > => {
      const client = getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        return;
      }
      const thread = await client.threads.get(threadId);
      let threadInterrupts: HumanInterrupt[] | undefined;
      if (thread.status === "interrupted") {
        threadInterrupts = getInterruptFromThread(thread);
        if (!threadInterrupts || !threadInterrupts.length) {
          const state = await client.threads.getState(threadId);
          const { interrupts } = processThreadWithoutInterrupts(thread, {
            thread_state: state,
            thread_id: threadId,
          });
          threadInterrupts = interrupts;
        }
      }
      return {
        thread: thread as Thread<ThreadValues>,
        status: thread.status,
        interrupts: threadInterrupts,
      };
    },
    [agentInboxes]
  );

  const bulkGetThreadStates = React.useCallback(
    async (
      threadIds: string[]
    ): Promise<
      { thread_id: string; thread_state: ThreadState<ThreadValues> }[]
    > => {
      const client = getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        return [];
      }
      const chunkSize = 25;
      const chunks = [];

      // Split threadIds into chunks of 25
      for (let i = 0; i < threadIds.length; i += chunkSize) {
        chunks.push(threadIds.slice(i, i + chunkSize));
      }

      // Process each chunk sequentially
      const results: {
        thread_id: string;
        thread_state: ThreadState<ThreadValues>;
      }[] = [];
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (id) => ({
            thread_id: id,
            thread_state: await client.threads.getState<ThreadValues>(id),
          }))
        );
        results.push(...chunkResults);
      }

      return results;
    },
    [agentInboxes]
  );

  const ignoreThread = async (threadId: string) => {
    const client = getClient({
      agentInboxes,
      getItem,
      toast,
    });
    if (!client) {
      return;
    }
    try {
      await client.threads.updateState(threadId, {
        values: null,
        asNode: END,
      });

      setThreadData((prev) => {
        return prev.filter((p) => p.thread.thread_id !== threadId);
      });
      toast({
        title: "Success",
        description: "Ignored thread",
        duration: 3000,
      });
    } catch (e) {
      console.error("Error ignoring thread", e);
      toast({
        title: "Error",
        description: "Failed to ignore thread",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const fetchSchema = React.useCallback(
    async (graphId: string): Promise<InputSchemaField[]> => {
      const client = getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        throw new Error("LangGraph client is not available. Check configuration.");
      }
      if (!graphId) {
        throw new Error("Graph ID is required to fetch schema.");
      }

      try {
        console.log(`Fetching schema for graph ${graphId}...`);
        
        // First search for assistants with this graphId
        const assistants = await client.assistants.search({ graphId });
        console.log(`Found ${assistants.length} assistants for graph ${graphId}`);
        
        if (assistants.length === 0) {
          throw new Error(`No assistants found for graph ID: ${graphId}`);
        }

        // Use the first assistant (there might be multiple with same graphId)
        const assistant = assistants[0];
        console.log('Using assistant:', {
          id: assistant.assistant_id,
          name: assistant.name,
          graph_id: assistant.graph_id
        });

        // Get the schema using the assistant ID
        const rawSchema = await client.assistants.getSchemas(assistant.assistant_id);
        console.log('Fetched schema:', rawSchema);
        
        // Parse the schema into the expected format
        const parsedSchema = parseGraphSchemaToInputFields(rawSchema);
        console.log('Parsed schema:', parsedSchema);
        
        return parsedSchema;
      } catch (error: any) {
        console.error("Error fetching schema:", error);
        // Return a default schema as fallback
        console.log("Returning default schema due to error");
        return [
          { 
            name: 'input_prompt', 
            label: 'Input', 
            type: 'textarea', 
            required: true,
            rows: 5,
            placeholder: 'Enter your input for the agent...',
            description: 'Provide instructions or data for the agent to process in this run.'
          }
        ];
      }
    },
    [agentInboxes, getItem, toast]
  );
  
  // Helper function to parse the raw schema into InputSchemaField format
  const parseGraphSchemaToInputFields = (rawSchema: any): InputSchemaField[] => {
    if (!rawSchema) {
      console.warn('Raw schema is null or undefined');
      return [];
    }
    
    // Log the structure to help debug
    console.log('Schema structure keys:', Object.keys(rawSchema));
    
    // Try to find the schema properties from different possible locations
    const properties = 
      (rawSchema.input_schema && rawSchema.input_schema.properties) ||
      (rawSchema.config_schema && rawSchema.config_schema.properties) ||
      (rawSchema.properties) ||
      {};
      
    // Log the properties
    console.log('Found properties:', Object.keys(properties));
    
    if (Object.keys(properties).length === 0) {
      console.warn('No properties found in schema');
      return [];
    }
    
    // Find required fields
    const requiredFields = 
      (rawSchema.input_schema && rawSchema.input_schema.required) ||
      (rawSchema.config_schema && rawSchema.config_schema.required) ||
      (rawSchema.required) ||
      [];
      
    console.log('Required fields:', requiredFields);
    
    // Convert the properties to InputSchemaField format
    return Object.entries(properties).map(([name, propDetails]: [string, any]) => {
      console.log(`Processing field: ${name}`, propDetails);

      // Determine the field type
      let fieldType: 'string' | 'textarea' | 'number' | 'boolean' | 'array' = 'string';
      let itemType: 'string' | 'number' | 'boolean' | undefined = undefined;
      let minItems: number | undefined = undefined;
      let maxItems: number | undefined = undefined;
      let prefixItems: any[] | undefined = undefined;

      if (propDetails.type === 'array') {
        fieldType = 'array';
        // Try to infer the item type
        if (propDetails.items) {
          if (typeof propDetails.items === 'object' && propDetails.items.type) {
            itemType = propDetails.items.type;
          } else if (Array.isArray(propDetails.items)) {
            // Not standard, but handle as needed
            itemType = 'string';
          }
        }
        minItems = propDetails.minItems;
        maxItems = propDetails.maxItems;
        prefixItems = propDetails.prefixItems;
      } else if (propDetails.type === 'number' || propDetails.type === 'integer') {
        fieldType = 'number';
      } else if (propDetails.type === 'boolean') {
        fieldType = 'boolean';
      } else if (
        propDetails.format === 'multi-line' || 
        propDetails.format === 'textarea' ||
        (propDetails.description && propDetails.description.toLowerCase().includes('multi-line')) ||
        name.toLowerCase().includes('description') ||
        name.toLowerCase().includes('content') ||
        name.toLowerCase().includes('text')
      ) {
        fieldType = 'textarea';
      }

      return {
        name,
        label: propDetails.title || name.replace(/_/g, ' '),
        description: propDetails.description,
        type: fieldType,
        required: requiredFields.includes(name),
        placeholder: propDetails.examples?.[0] || propDetails.default || '',
        rows: fieldType === 'textarea' ? 5 : undefined,
        itemType,
        minItems,
        maxItems,
        prefixItems,
      };
    });
  };

  const triggerNewRun = React.useCallback(
    async (graphId: string, input: Record<string, any>): Promise<{ thread_id: string }> => {
      const client = getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        throw new Error("LangGraph client is not available. Check configuration.");
      }
      if (!graphId) {
        throw new Error("Graph ID is required to trigger a run.");
      }

      try {
        // First search for assistants with this graphId
        const assistants = await client.assistants.search({ graphId });
        console.log(`Found ${assistants.length} assistants for graph ${graphId}`);
        
        if (assistants.length === 0) {
          throw new Error(`No assistants found for graph ID: ${graphId}`);
        }

        // Use the first assistant (there might be multiple with same graphId)
        const assistant = assistants[0];
        console.log('Using assistant:', {
          id: assistant.assistant_id,
          name: assistant.name,
          graph_id: assistant.graph_id
        });

        // Create a new thread and run using the assistant ID
        const newThread = await client.threads.create();
        if (!newThread?.thread_id) {
          throw new Error('Thread created successfully, but thread_id was missing.');
        }
        
        console.log(`Triggering run in thread ${newThread.thread_id} with assistant ${assistant.assistant_id} and input:`, input);
        await client.runs.create(newThread.thread_id, assistant.assistant_id, {
          input: input,
        });

        return { thread_id: newThread.thread_id };
      } catch (error: any) {
        console.error("Error triggering new run:", error);
        throw new Error(`Failed to trigger run: ${error.message || 'Unknown error'}`);
      }
    },
    [agentInboxes, getItem, toast]
  );

  const sendHumanResponse = <TStream extends boolean = false>(
    threadId: string,
    response: HumanResponse[],
    options?: {
      stream?: TStream;
    }
  ): TStream extends true
    ?
        | AsyncGenerator<{
            event: Record<string, any>;
            data: any;
          }>
        | undefined
    : Promise<Run> | undefined => {
    const graphId = agentInboxes.find((i) => i.selected)?.graphId;
    if (!graphId) {
      toast({
        title: "No assistant/graph ID found.",
        description:
          "Assistant/graph IDs are required to send responses. Please add an assistant/graph ID in the settings.",
        variant: "destructive",
      });
      return undefined;
    }

    const client = getClient({
      agentInboxes,
      getItem,
      toast,
    });
    if (!client) {
      return;
    }
    try {
      if (options?.stream) {
        return client.runs.stream(threadId, graphId, {
          command: {
            resume: response,
          },
          streamMode: "events",
        }) as any; // Type assertion needed due to conditional return type
      }
      return client.runs.create(threadId, graphId, {
        command: {
          resume: response,
        },
      }) as any; // Type assertion needed due to conditional return type
    } catch (e: any) {
      console.error("Error sending human response", e);
      throw e;
    }
  };

  const contextValue: ThreadContentType = {
    loading,
    threadData,
    hasMoreThreads,
    agentInboxes,
    deleteAgentInbox,
    changeAgentInbox,
    addAgentInbox,
    ignoreThread,
    sendHumanResponse,
    fetchThreads,
    fetchSingleThread,
    fetchSchema,
    triggerNewRun,
  };

  return (
    <ThreadsContext.Provider value={contextValue}>
      {children}
    </ThreadsContext.Provider>
  );
}

export function useThreadsContext<
  T extends Record<string, any> = Record<string, any>,
>() {
  const context = React.useContext(ThreadsContext) as ThreadContentType<T>;
  if (context === undefined) {
    throw new Error("useThreadsContext must be used within a ThreadsProvider");
  }
  return context;
}
