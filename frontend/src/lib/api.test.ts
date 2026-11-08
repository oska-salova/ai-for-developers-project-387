import {
  createHttpHeaders,
  type HttpClient,
  type PipelineRequest,
} from "@typespec/ts-http-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient, resolveApiUrl, unwrap } from "./api";

function fakeHttpClient(body: unknown, status = 200) {
  const requests: PipelineRequest[] = [];
  const httpClient: HttpClient = {
    async sendRequest(request) {
      requests.push(request);

      return {
        request,
        status,
        headers: createHttpHeaders({ "content-type": "application/json" }),
        bodyAsText: JSON.stringify(body),
      };
    },
  };

  return { httpClient, requests };
}

describe("API client configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("defaults to the page origin in the browser", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);

    expect(resolveApiUrl()).toBe(window.location.origin);
  });

  it("defaults to the internal backend during server rendering", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
    vi.stubEnv("API_URL", undefined);
    vi.stubGlobal("window", undefined);

    expect(resolveApiUrl()).toBe("http://127.0.0.1:3001");
  });

  it("reads the base URL from NEXT_PUBLIC_API_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.example.test:4321");

    expect(resolveApiUrl()).toBe("http://api.example.test:4321");
  });

  it("sends SDK requests to the configured base URL over plain HTTP", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.example.test:4321");
    const { httpClient, requests } = fakeHttpClient({ meetingTypes: [] });

    await createApiClient({ httpClient }).meetingTypesClient.list();

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe("http://api.example.test:4321/api/meeting-types");
    expect(requests[0]?.allowInsecureConnection).toBe(true);
  });
});

describe("unwrap", () => {
  it("returns the successful body unchanged", () => {
    const body = { meetingTypes: [] };

    expect(unwrap(body)).toEqual(body);
  });

  it("turns an SDK error value into an ApiError", () => {
    const result = {
      error: {
        code: "validation_error",
        message: "Название обязательно",
        fields: [{ field: "name", message: "Название обязательно" }],
      },
    };

    const call = () => unwrap(result);

    expect(call).toThrow(ApiError);
    expect(call).toThrow("Название обязательно");
    try {
      call();
    } catch (error) {
      expect(error).toMatchObject({
        code: "validation_error",
        fields: [{ field: "name", message: "Название обязательно" }],
      });
    }
  });

  it("keeps an error without fields", () => {
    const result = { error: { code: "not_found", message: "Маршрут не найден" } };

    expect(() => unwrap(result)).toThrow("Маршрут не найден");
    try {
      unwrap(result);
    } catch (error) {
      expect(error).toMatchObject({ code: "not_found", fields: [] });
    }
  });
});
