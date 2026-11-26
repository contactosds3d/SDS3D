import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { contactSchema } from "./validation";
export const getPublicSite = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("Faltam as variáveis SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY");
  }

  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);

        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }

        headers.set("apikey", key);

        return fetch(input, {
          ...init,
          headers,
        });
      },
    },
  });

  const [works, categories, services, settings] = await Promise.all([
    client.from("works").select("*, work_categories(category_id)").order("position"),
    client.from("categories").select("*").order("position"),
    client.from("services").select("*").order("position"),
    client.from("site_settings").select("content").eq("id", "main").single(),
  ]);

  if (works.error || categories.error || services.error || settings.error) {
    throw new Error(
      JSON.stringify(
        {
          works: works.error,
          categories: categories.error,
          services: services.error,
          settings: settings.error,
        },
        null,
        2,
      ),
    );
  }

  const config = (settings.data?.content ?? {}) as Record<string, string>;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  async function resolve(path: string) {
    if (!path || path.startsWith("example:") || path.startsWith("https://")) return path;

    const { data } = await supabaseAdmin.storage.from("portfolio").createSignedUrl(path, 3600);

    return data?.signedUrl ?? "";
  }

  const resolvedWorks = await Promise.all(
    (works.data ?? []).map(async ({ work_categories: relations, ...w }) => ({
      ...w,
      categories: relations.map((relation) => relation.category_id),

      images: await Promise.all(
        (Array.isArray(w.images)
          ? w.images.filter((x): x is string => typeof x === "string")
          : []
        ).map(resolve),
      ),
    })),
  );

  const resolvedServices = await Promise.all(
    (services.data ?? []).map(async (s) => ({
      ...s,
      image: await resolve(s.image),
    })),
  );

  const resolvedCategories = await Promise.all(
    (categories.data ?? []).map(async (c) => ({
      ...c,
      image: await resolve(c.image),
    })),
  );

  for (const key of ["hero_image", "hero_video", "about_image", "logo"]) {
    if (config[key]) {
      config[key] = await resolve(config[key]);
    }
  }

  return {
    works: resolvedWorks,
    categories: resolvedCategories,
    services: resolvedServices,
    settings: config,
  };
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(data.email.toLowerCase()),
    );

    const key = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("");

    const { data: allowed, error: limitError } = await supabaseAdmin.rpc("claim_contact_slot", {
      address: key,
    });

    if (limitError || !allowed) {
      throw new Error("Aguarda um minuto antes de enviar outro pedido.");
    }

    const id = crypto.randomUUID();
    const paths: string[] = [];

    try {
      for (const file of data.attachments) {
        const binary = atob(file.base64);

        if (binary.length > 10 * 1024 * 1024) {
          throw new Error("Cada ficheiro pode ter no máximo 10 MB.");
        }

        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const ext = file.name.split(".").at(-1)?.toLowerCase() ?? "";
        const path = `${id}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabaseAdmin.storage.from("references").upload(path, bytes, {
          contentType: file.type,
        });

        if (error) {
          throw new Error("Não foi possível guardar o ficheiro.");
        }

        paths.push(path);
      }

      const { error } = await supabaseAdmin.from("contact_submissions").insert({
        id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service,
        message: data.message,
        reference: data.reference,
        consent: true,
        attachments: paths,
      });

      if (error) {
        throw new Error("Não foi possível guardar o pedido. Tenta novamente.");
      }

      return { id };
    } catch (error) {
      if (paths.length) {
        await supabaseAdmin.storage.from("references").remove(paths);
      }
      throw error;
    }
  });
