import React, { useState } from "react";
import { Button } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { Title } from "@tremor/react";
import { transformRequestCall } from "@/components/networking";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cva.config";

interface TransformRequestPanelProps {
  accessToken: string | null;
}

interface TransformResponse {
  raw_request_api_base: string;
  raw_request_body: Record<string, any>;
  raw_request_headers: Record<string, string>;
}

const TransformRequestPanel: React.FC<TransformRequestPanelProps> = ({ accessToken }) => {
  const [originalRequestJSON, setOriginalRequestJSON] = useState(`{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain quantum computing in simple terms"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "stream": true
}`);

  const [transformedResponse, setTransformedResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to format curl command from API response parts
  const formatCurlCommand = (
    apiBase: string,
    requestBody: Record<string, any>,
    requestHeaders: Record<string, string>,
  ) => {
    // Format the request body as nicely indented JSON with 2 spaces
    const formattedBody = JSON.stringify(requestBody, null, 2)
      // Add additional indentation for the entire body
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");

    // Build headers string with consistent indentation
    const headerString = Object.entries(requestHeaders)
      .map(([key, value]) => `-H '${key}: ${value}'`)
      .join(" \\\n  ");

    // Build the curl command with consistent indentation
    return `curl -X POST \\
  ${apiBase} \\
  ${headerString ? `${headerString} \\\n  ` : ""}-H 'Content-Type: application/json' \\
  -d '{
${formattedBody}
  }'`;
  };

  // Function to handle the transform request
  const handleTransform = async () => {
    setIsLoading(true);

    try {
      // Parse the JSON from the textarea
      let requestBody;
      try {
        requestBody = JSON.parse(originalRequestJSON);
      } catch (e) {
        NotificationsManager.fromBackend("Invalid JSON in request body");
        setIsLoading(false);
        return;
      }

      // Create the request payload
      const payload = {
        call_type: "completion",
        request_body: requestBody,
      };

      // Make the API call using fetch
      if (!accessToken) {
        NotificationsManager.fromBackend("No access token found");
        setIsLoading(false);
        return;
      }

      const data = await transformRequestCall(accessToken, payload);

      // Check if the response has the expected fields
      if (data.raw_request_api_base && data.raw_request_body) {
        // Format the curl command with the separate parts
        const formattedCurl = formatCurlCommand(
          data.raw_request_api_base,
          data.raw_request_body,
          data.raw_request_headers || {},
        );

        // Update state with the formatted curl command
        setTransformedResponse(formattedCurl);
        NotificationsManager.success("Request transformed successfully");
      } else {
        // Handle the case where the API returns a different format
        // Try to extract the parts from a string response if needed
        const rawText = typeof data === "string" ? data : JSON.stringify(data);
        setTransformedResponse(rawText);
        NotificationsManager.info("Transformed request received in unexpected format");
      }
    } catch (err) {
      console.error("Error transforming request:", err);
      NotificationsManager.fromBackend("Failed to transform request");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this handler function near your other handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior
      handleTransform();
    }
  };

  return (
    <div className="m-2 w-full overflow-hidden text-foreground">
      <Title>Playground</Title>
      <p className="text-sm text-muted-foreground">
        See how LiteLLM transforms your request for the specified provider.
      </p>
      <div className="mt-4 flex w-full min-w-0 gap-4 overflow-hidden">
        <Card
          data-testid="original-request-pane"
          className="max-h-[600px] min-w-0 flex-[1_1_50%] gap-0 overflow-hidden rounded-lg p-6"
        >
          <div className="mb-6">
            <h2 className="mb-1 text-2xl font-bold text-foreground">Original Request</h2>
            <p className="m-0 text-muted-foreground">
              The request you would send to LiteLLM /chat/completions endpoint.
            </p>
          </div>

          <textarea
            className={cn(
              "mb-6 min-h-[240px] w-full flex-[1_1_auto] resize-none overflow-auto rounded-md p-4 font-mono text-sm",
              "border border-border bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none",
            )}
            value={originalRequestJSON}
            onChange={(e) => setOriginalRequestJSON(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Press Cmd/Ctrl + Enter to transform"
          />

          <div className="mt-auto flex justify-end">
            <Button type="primary" className="flex items-center gap-2" onClick={handleTransform} loading={isLoading}>
              <span>Transform</span>
              <span>→</span>
            </Button>
          </div>
        </Card>

        <Card
          data-testid="transformed-request-pane"
          className="max-h-[800px] min-w-0 flex-[1_1_50%] gap-0 overflow-hidden rounded-lg p-6"
        >
          <div className="mb-6">
            <h2 className="mb-1 text-2xl font-bold text-foreground">Transformed Request</h2>
            <p className="m-0 text-muted-foreground">How LiteLLM transforms your request for the specified provider.</p>
            <br />
            <p className="m-0 text-xs text-muted-foreground">Note: Sensitive headers are not shown.</p>
          </div>

          <div className="relative flex flex-[1_1_auto] flex-col overflow-hidden rounded-md bg-muted text-foreground">
            <pre className="m-0 flex-[1_1_auto] overflow-auto p-4 font-mono text-sm">
              {transformedResponse ||
                `curl -X POST \\
  https://api.openai.com/v1/chat/completions \\
  -H 'Authorization: Bearer sk-xxx' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    }
  ],
  "temperature": 0.7
  }'`}
            </pre>

            <Button
              type="text"
              icon={<CopyOutlined />}
              className="absolute top-2 right-2"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(transformedResponse || "");
                NotificationsManager.success("Copied to clipboard");
              }}
            />
          </div>
        </Card>
      </div>
      <div className="mt-4 w-full text-right">
        <p className="text-sm text-muted-foreground">
          Found an error? File an issue{" "}
          <a
            href="https://github.com/BerriAI/litellm/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            here
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default TransformRequestPanel;
