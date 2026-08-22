interface TokenFlowProps {
  prompt?: number;
  completion?: number;
  total?: number;
}

export function TokenFlow({ prompt = 0, completion = 0, total = 0 }: TokenFlowProps) {
  return (
    <span>
      {total.toLocaleString()} ({prompt.toLocaleString()} prompt tokens + {completion.toLocaleString()} completion
      tokens)
    </span>
  );
}
