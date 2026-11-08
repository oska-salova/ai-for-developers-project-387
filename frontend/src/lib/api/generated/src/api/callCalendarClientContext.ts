import {
  type Client,
  type ClientOptions,
  getClient,
} from "@typespec/ts-http-runtime";

export interface CallCalendarClientContext extends Client {

}export interface CallCalendarClientOptions extends ClientOptions {
  endpoint?: string;
}export function createCallCalendarClientContext(
  options?: CallCalendarClientOptions,
): CallCalendarClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "http://localhost:3001"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options
  })
}
