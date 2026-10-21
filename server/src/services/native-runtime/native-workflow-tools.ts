import { createHash } from "node:crypto";
import { z } from "zod";
import { createWorkflowSchema, updateWorkflowSchema, listWorkflowsSchema } from "@paperclipai/shared";
import type { Db } from "@paperclipai/db";
import { forbidden, badRequest } from "../../errors.js";
import { requireCasesEnabled } from "../workflows.js";
import { runnerApiCallSchema, type RunnerApiCall } from "./runner-api-client.js";

const retryKey = z.string().min(1).max(240);
const workflowId = z.string().guid();
const schemas = {
  list_workflows: listWorkflowsSchema,
  read_workflow: z.object({ workflowId, responseText: runnerApiCallSchema.shape.responseText }).strict(),
  create_workflow: createWorkflowSchema.extend({ idempotencyKey: retryKey }),
  update_workflow: updateWorkflowSchema.safeExtend({ workflowId, idempotencyKey: retryKey }),
};

export async function executeNativeWorkflowTool(input: {
  db: Db; binding: { companyId: string; casesEnabled?: boolean }; tool: string; arguments: unknown;
  callApi: (receiptKey: string, request: RunnerApiCall) => Promise<unknown>;
}) {
  if (input.binding.casesEnabled !== true) throw forbidden("Cases are disabled");
  await requireCasesEnabled(input.db);
  const schema = schemas[input.tool as keyof typeof schemas];
  if (!schema) throw badRequest("Unknown workflow operation");
  const parsed = schema.safeParse(input.arguments);
  if (!parsed.success) throw badRequest("Invalid workflow arguments", { issues: parsed.error.issues });
  const { workflowId: id, idempotencyKey, responseText, ...body } = parsed.data as {
    workflowId?: string; idempotencyKey?: string; responseText?: RunnerApiCall["responseText"];
  } & Record<string, unknown>;
  const method = input.tool === "create_workflow" ? "POST" : input.tool === "update_workflow" ? "PATCH" : "GET";
  const request: RunnerApiCall = {
    operationId: `${method} /api/${id ? "workflows/{id}" : "companies/{companyId}/workflows"}`,
    pathParams: id ? { id } : { companyId: input.binding.companyId },
    ...(method === "GET" ? { query: body } : { body }),
    ...(input.tool === "read_workflow" ? { responseText: responseText ?? { offsetBytes: 0 } } : {}),
  };
  const key = idempotencyKey ?? createHash("sha256").update(JSON.stringify(request)).digest("hex");
  const result = await input.callApi(`workflow-tool:${input.tool}:${key}`, request);
  if (input.tool !== "read_workflow" || !result || typeof result !== "object") return result;
  return { ...result, guidance: "Concatenate data JSON text pages using read_workflow with the same workflowId and responseText.offsetBytes=responseText.nextOffsetBytes until null. Restart the read if the shared definition is edited during reading. Adoption captures the latest prompt at handoff acceptance." };
}
