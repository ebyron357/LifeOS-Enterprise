export interface Span {
  name: string;
  startedAt: number;
  endedAt?: number;
  attributes?: Record<string, string | number | boolean>;
}

export function startSpan(name: string, attributes?: Span['attributes']): Span {
  return {
    name,
    startedAt: Date.now(),
    ...(attributes ? { attributes } : {}),
  };
}

export function endSpan(span: Span): Span {
  return {
    ...span,
    endedAt: Date.now(),
  };
}
