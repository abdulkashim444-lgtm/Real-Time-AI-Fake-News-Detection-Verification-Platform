import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteAnalysisFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => DeleteSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error("Unable to delete analysis");
    return { ok: true };
  });
