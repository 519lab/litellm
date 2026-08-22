interface JsonViewerProps {
  data: unknown;
}

export function JsonViewer({ data }: JsonViewerProps) {
  if (!data) return <span className="text-muted-foreground">No data</span>;

  return (
    <pre className="max-h-[400px] overflow-auto overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs tabular-nums text-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
