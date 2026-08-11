import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runVerification, type VerificationResult } from "./veritas/orchestrator.server";

const InputSchema = z
  .object({
    title: z.string().max(500).optional(),
    content: z.string().max(60_000).optional(),
    url: z.string().url().max(2048).optional().or(z.literal("")),
  })
  .refine((v) => (v.content && v.content.trim().length >= 40) || (v.url && v.url.length > 0), {
    message: "Provide an article URL, or at least 40 characters of article text.",
  });

export type AnalyzeInput = z.infer<typeof InputSchema>;
export type { VerificationResult };

export const analyzeArticle = createServerFn({ method: "POST" })
  .inputValidator((data: AnalyzeInput) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<VerificationResult> => runVerification(data));