import { useState, useEffect, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { adminFiles } from "@/features/admin.functions";
import { imageUrl } from "@/features/content";
import { defaultPrivacyContent } from "@/features/privacy-content";
import { mergeSettingsContent } from "@/features/settings-content";
import { statuses } from "@/features/validation";
import { Button } from "@/components/ui/button";
import {
  Box,
  LayoutDashboard,
  Layers,
  Folder,
  Briefcase,
  FileText,
  Image,
  Inbox,
  Settings,
  LogOut,
  Plus,
  Pencil,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  ArrowUpRight,
  Save,
  Eye,
  EyeOff,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
type Tables = Database["public"]["Tables"];
type Work = Tables["works"]["Row"];
type Category = Tables["categories"]["Row"];
type Service = Tables["services"]["Row"];
type Request = Tables["contact_submissions"]["Row"];
type Media = Tables["media"]["Row"];
type Section =
  | "dashboard"
  | "works"
  | "categories"
  | "services"
  | "content"
  | "profile"
  | "privacy"
  | "media"
  | "requests"
  | "settings";
type Editor = {
  kind: "works" | "categories" | "services";
  id?: string | undefined;
  values: Record<string, string | boolean | number>;
  images: string[];
};
const items = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["works", "Trabalhos", Layers],
  ["categories", "Categorias", Folder],
  ["services", "Serviços", Briefcase],
  ["content", "Conteúdos", FileText],
  ["profile", "Descrição da página", FileText],
  ["privacy", "Privacidade", FileText],
  ["media", "Biblioteca de media", Image],
  ["requests", "Pedidos recebidos", Inbox],
  ["settings", "Configurações", Settings],
] as const;
const visibleItems = items
  .filter((x) => ["works", "categories", "profile", "privacy", "settings"].includes(x[0]))
  .map((x) => (x[0] === "works" ? (["works", "Peças", x[2]] as const) : x));
void LayoutDashboard;
void Briefcase;
void Image;
void Inbox;
export function AdminPanel() {
  const cache = useQueryClient();
  const signFiles = useServerFn(adminFiles);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("works");
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<Editor | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewText, setPreviewText] = useState<{ title: string; bio: string } | null>(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ display_name: "", avatar_url: "" });
  const [sortBy, setSortBy] = useState<"name" | "published" | "category" | "stock">("name");

  function changeSort(field: "name" | "published" | "category" | "stock") {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  }

  const [sortAsc, setSortAsc] = useState(true);
  async function refresh() {
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAllowed(false);
      return;
    }
    const { data: role, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !role) {
      setAllowed(false);
      return;
    }
    const [w, c, s, r, m, config, p] = await Promise.all([
      supabase.from("works").select("*").order("position"),
      supabase.from("categories").select("*").order("position"),
      supabase.from("services").select("*").order("position"),
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("media").select("*").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("id", "main").single(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    if (w.error || c.error || s.error || r.error || m.error || config.error) {
      setError("Não foi possível carregar os dados.");
      return;
    }
    setWorks(w.data ?? []);
    setCategories(c.data ?? []);
    setServices(s.data ?? []);
    setRequests(r.data ?? []);
    setMedia(m.data ?? []);
    setSettings((config.data?.content ?? {}) as Record<string, string>);
    setAllowed(true);
    if (p.data) setProfile(p.data);
    const savedSettings = (config.data?.content ?? {}) as Record<string, string>;
    const logoPath = savedSettings["logo"];
    const paths = [
      ...new Set([
        ...(logoPath && !logoPath.startsWith("https://") ? [logoPath] : []),
        ...(m.data ?? []).map((x) => x.path),
      ]),
    ];
    if (paths.length) {
      const signed = await signFiles({ data: { bucket: "portfolio", paths: paths.slice(0, 100) } });
      setUrls(
        Object.fromEntries(
          signed.filter((x) => x.path && x.signedUrl).map((x) => [x.path ?? "", x.signedUrl ?? ""]),
        ),
      );
    }
  }
  useEffect(() => {
    refresh().catch(() => setError("Não foi possível carregar a administração."));
  }, []);
  async function changed() {
    await refresh();
    await cache.invalidateQueries({ queryKey: ["public-site"] });
  }
  function open(kind: Editor["kind"], row?: Work | Category | Service) {
    const values: Record<string, string | boolean | number> = {};
    if (row)
      Object.entries(row).forEach(([k, v]) => {
        if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") values[k] = v;
      });
    setEditor({
      kind,
      id: row?.id,
      values,
      images:
        row && "images" in row && Array.isArray(row.images)
          ? row.images.filter((v): v is string => typeof v === "string")
          : [],
    });
  }
  async function upload(file: File) {
    if (
      file.size > 10 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new Error("Usa uma imagem JPG, PNG ou WEBP até 10 MB.");
    let blob: Blob = file;
    try {
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * ratio);
      canvas.height = Math.round(bitmap.height * ratio);
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Imagem inválida."))),
          "image/webp",
          0.85,
        ),
      );
      bitmap.close();
    } catch {
      blob = file;
    }
    const path = `images/${crypto.randomUUID()}.${blob.type === "image/webp" ? "webp" : file.name.split(".").at(-1)}`;
    const { error } = await supabase.storage
      .from("portfolio")
      .upload(path, blob, { contentType: blob.type });
    if (error) throw error;
    const { error: dbError } = await supabase
      .from("media")
      .insert({ name: file.name, path, alt: file.name });
    if (dbError) {
      await supabase.storage.from("portfolio").remove([path]);
      throw dbError;
    }
    return path;
  }
  async function uploadMany(files: FileList | null, toEditor = false) {
    if (!files) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of Array.from(files)) paths.push(await upload(f));
      if (toEditor) setEditor((e) => (e ? { ...e, images: [...e.images, ...paths] } : e));
      await changed();
      toast.success("Fotografias guardadas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível guardar as fotografias.");
    } finally {
      setBusy(false);
    }
  }
  async function saveEditor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const text = (key: string) => String(f.get(key) || "");
    try {
      const position = Number(f.get("position") || 0);
      let result;
      if (editor.kind === "works") {
        const name = text("name");
        const base = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const existing = editor.id ? String(editor.values["slug"] ?? "") : "";
        let slug = existing || base || `peca-${Date.now().toString(36)}`;
        if (!existing) {
          let n = 2;
          while (works.some((w) => w.slug === slug)) slug = `${base}-${n++}`;
        }
        const values = {
          name,
          slug,
          description: text("description"),
          category_id: text("category_id") || null,
          images: editor.images,
          published: f.get("published") === "on",
          material: text("material"),
          price: text("price") ? Number(text("price").replace(",", ".")) : null,
          stock: text("stock") ? parseInt(text("stock"), 10) : null,
          position,
        };
        result = editor.id
          ? await supabase.from("works").update(values).eq("id", editor.id)
          : await supabase.from("works").insert(values);
      } else if (editor.kind === "categories") {
        const values = {
          name: text("name"),
          description: text("description"),
          image: text("image"),
          parent_id: text("parent_id") || null,
          visible: f.get("visible") === "on",
          position,
        };
        result = editor.id
          ? await supabase.from("categories").update(values).eq("id", editor.id)
          : await supabase.from("categories").insert(values);
      } else {
        const values = {
          name: text("name"),
          description: text("description"),
          details: text("details"),
          image: text("image"),
          published: f.get("published") === "on",
          example: f.get("example") === "on",
          position,
        };
        result = editor.id
          ? await supabase.from("services").update(values).eq("id", editor.id)
          : await supabase.from("services").insert(values);
      }
      if (result.error) throw result.error;
      setEditor(null);
      await changed();
      toast.success("Alterações guardadas.");
    } catch {
      toast.error("Não foi possível guardar. Tenta novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: "works" | "categories" | "services", id: string) {
    if (!window.confirm("Eliminar este conteúdo? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from(kind).delete().eq("id", id);
    if (error) toast.error("Não foi possível eliminar.");
    else {
      setEditor(null);
      await changed();
      toast.success("Conteúdo eliminado.");
    }
  }
  async function duplicate(work: Work) {
    const { id, created_at, ...values } = work;
    const { error } = await supabase.from("works").insert({
      ...values,
      name: work.name + " (cópia)",
      slug: work.slug + "-" + crypto.randomUUID().slice(0, 8),
      published: false,
      featured: false,
    });
    if (error) toast.error("Não foi possível duplicar.");
    else {
      await changed();
      toast.success("Cópia guardada como rascunho.");
    }
  }
  function trackPreview(e: FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget);
    const t = f.get("welcome_title");
    const b = f.get("bio");
    if (typeof t === "string" || typeof b === "string")
      setPreviewText({
        title: typeof t === "string" ? t : "",
        bio: typeof b === "string" ? b : "",
      });
  }
  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const { data: current, error: readError } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", "main")
      .single();
    if (readError || !current) {
      toast.error("Não foi possível carregar as configurações. Tenta novamente.");
      setBusy(false);
      return;
    }
    const updated = mergeSettingsContent(current.content as Record<string, string>, form);
    const { error } = await supabase.from("site_settings").upsert({ id: "main", content: updated });
    if (error) toast.error("Não foi possível guardar as configurações.");
    else {
      await changed();
      toast.success("Configurações guardadas.");
    }
    setBusy(false);
  }
  async function saveRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!request) return;
    const f = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status: String(f.get("status")), notes: String(f.get("notes")) })
      .eq("id", request.id);
    if (error) toast.error("Não foi possível guardar.");
    else {
      setRequest(null);
      await changed();
      toast.success("Pedido atualizado.");
    }
  }
  function csv() {
    const rows = [
      ["Data", "Nome", "Email", "Telefone", "Serviço", "Mensagem", "Referência", "Estado", "Notas"],
      ...requests.map((r) => [
        r.created_at,
        r.name,
        r.email,
        r.phone,
        r.service,
        r.message,
        r.reference,
        r.status,
        r.notes,
      ]),
    ];
    const escape = (v: string) =>
      '"' + (/^[=+@-]/.test(v) ? "'" : "") + v.replace(/"/g, '""') + '"';
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(escape).join(";")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pedidos-sds3d.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const input = (name: string, label: string, type = "text", required = false) => (
    <label className="form-group" key={name}>
      {label}
      <input
        className="field"
        name={name}
        type={type}
        required={required}
        defaultValue={String(editor?.values[name] ?? "")}
      />
    </label>
  );
  const area = (name: string, label: string) => (
    <label className="form-group full" key={name}>
      {label}
      <textarea className="field" name={name} defaultValue={String(editor?.values[name] ?? "")} />
    </label>
  );
  const check = (name: string, label: string, fallback = false) => (
    <label className="consent-row" key={name}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={
          typeof editor?.values[name] === "boolean" ? Boolean(editor.values[name]) : fallback
        }
      />
      {label}
    </label>
  );
  const settingsField = (name: string, label: string, multi = false) => (
    <label className={`form-group ${multi ? "full" : ""}`} key={name}>
      {label}
      {multi ? (
        <textarea className="field" name={name} defaultValue={settings[name] || ""} />
      ) : (
        <input className="field" name={name} defaultValue={settings[name] || ""} />
      )}
    </label>
  );
  const mediaSelect = (name: string, label: string, current = "") => (
    <label className="form-group" key={name}>
      {label}
      <select className="field" name={name} defaultValue={current}>
        <option value="">Sem imagem / usar exemplo</option>
        {current && !media.some((m) => m.path === current) && (
          <option value={current}>Imagem atual</option>
        )}
        {media.map((m) => (
          <option key={m.id} value={m.path}>
            {m.name}
          </option>
        ))}
      </select>
      <span className="field-hint">ou carrega uma nova imagem:</span>
      <input
        className="field"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={`Carregar ${label}`}
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const path = await upload(file);
            await changed();
            const sel = input.form?.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
            if (sel) {
              if (!Array.from(sel.options).some((option) => option.value === path))
                sel.add(new Option(file.name, path));
              sel.value = path;
            }
            toast.success("Imagem carregada. Clica em Guardar para aplicar.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Não foi possível carregar a imagem.");
          } finally {
            setBusy(false);
            input.value = "";
          }
        }}
      />
    </label>
  );
  if (allowed === null)
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <p>A verificar acesso…</p>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    );
  if (!allowed)
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <h1>Acesso reservado.</h1>
          <p>
            A tua conta ainda não tem permissões de administrador. A autorização é atribuída de
            forma segura pelo proprietário.
          </p>
          <Button className="mt-5" onClick={() => supabase.auth.signOut()}>
            Terminar sessão
          </Button>
          <Link to="/" className="auth-back">
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="brand">
          <Box className="text-primary" />
          SDS<span className="brand-accent">3D.</span>
        </Link>
        <nav>
          {visibleItems.map(([key, label, Icon]) => (
            <Button
              key={key}
              variant="ghost"
              data-active={section === key}
              onClick={() => {
                setSection(key);
                setEditor(null);
                setRequest(null);
                setPreviewText(null);
                setSearch("");
              }}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </nav>
        <div className="admin-bottom">
          <Link to="/">
            Ver website <ArrowUpRight size={13} />
          </Link>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut />
            Terminar sessão
          </Button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-title">
          <div>
            <h1>
              {editor
                ? (editor.id ? "Editar" : "Adicionar") +
                  " " +
                  (editor.kind === "works"
                    ? "peça"
                    : editor.kind === "categories"
                      ? "categoria"
                      : "serviço")
                : visibleItems.find((x) => x[0] === section)?.[1]}
            </h1>
            <p>
              {profile.display_name ? `Olá, ${profile.display_name}. ` : ""}O teu estúdio, em cada
              dimensão.
            </p>
          </div>
          {editor ? (
            <Button variant="outline" onClick={() => setEditor(null)}>
              <X />
              Cancelar
            </Button>
          ) : ["works", "categories", "services"].includes(section) ? (
            <Button onClick={() => open(section as Editor["kind"])}>
              <Plus />
              Adicionar
            </Button>
          ) : section === "requests" ? (
            <Button variant="outline" onClick={csv}>
              <Download />
              Exportar CSV
            </Button>
          ) : null}
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {editor ? (
          <form className="editor-form" onSubmit={saveEditor}>
            {input("name", "Nome", "text", true)}
            {editor.kind !== "works" && input("position", "Ordem", "number")}
            {editor.kind === "works" && area("description", "Descrição")}
            {editor.kind === "works" ? (
              <>
                <label className="form-group">
                  Categoria
                  <select
                    name="category_id"
                    className="field"
                    defaultValue={String(editor.values["category_id"] ?? "")}
                  >
                    <option value="">Sem categoria</option>
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((c) => {
                        const subs = categories.filter((x) => x.parent_id === c.id);
                        return subs.length ? (
                          <optgroup label={c.name} key={c.id}>
                            <option value={c.id}>{c.name} (geral)</option>
                            {subs.map((x) => (
                              <option value={x.id} key={x.id}>
                                {"\u00a0\u00a0↳ "}
                                {x.name}
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <option value={c.id} key={c.id}>
                            {c.name}
                          </option>
                        );
                      })}
                  </select>
                </label>
                {input("position", "Ordem", "number")}
                {input("price", "Preço (€)", "text")}
                {input("stock", "Quantidade em stock", "number")}
                {input("material", "Materiais / tecnologia")}
                <div className="full">
                  <label className="upload-zone">
                    <Upload />
                    Adicionar fotografias
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={(e) => uploadMany(e.target.files, true)}
                    />
                  </label>
                  <p className="optional my-3">
                    A primeira fotografia é a capa. Arrasta para reordenar.
                  </p>
                  <div className="editor-media">
                    {editor.images.map((src, i) => (
                      <div
                        key={`${src}${i}`}
                        className="editor-photo"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = Number(e.dataTransfer.getData("text/plain"));
                          if (!Number.isInteger(from) || from < 0 || from >= editor.images.length)
                            return;
                          const images = [...editor.images];
                          const [moved] = images.splice(from, 1);
                          if (moved) {
                            images.splice(i, 0, moved);
                            setEditor({ ...editor, images });
                          }
                        }}
                      >
                        <img src={imageUrl(urls[src] || src)} alt={`Fotografia ${i + 1}`} />
                        <div>
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label="Mover fotografia para cima"
                            disabled={i === 0}
                            onClick={() => {
                              const images = [...editor.images];
                              const a = images[i];
                              const b = images[i - 1];
                              if (a && b) {
                                images[i - 1] = a;
                                images[i] = b;
                                setEditor({ ...editor, images });
                              }
                            }}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label="Remover fotografia"
                            onClick={() =>
                              setEditor({
                                ...editor,
                                images: editor.images.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="form-group mt-4">
                    Adicionar da biblioteca
                    <select
                      className="field"
                      value=""
                      onChange={(e) =>
                        e.target.value &&
                        setEditor({ ...editor, images: [...editor.images, e.target.value] })
                      }
                    >
                      <option value="">Selecionar imagem</option>
                      {media.map((m) => (
                        <option key={m.id} value={m.path}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="full flex flex-wrap gap-6">{check("published", "Publicado")}</div>
              </>
            ) : (
              <>
                {editor.kind === "categories" && (
                  <label className="form-group">
                    Onde fica esta categoria?
                    <select
                      name="parent_id"
                      className="field"
                      defaultValue={String(editor.values["parent_id"] ?? "")}
                    >
                      <option value="">É uma categoria principal</option>
                      {categories
                        .filter((c) => c.id !== editor.id && !c.parent_id)
                        .map((c) => (
                          <option value={c.id} key={c.id}>
                            Subcategoria de: {c.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {editor.kind === "categories" && editor.id && (
                  <div className="full">
                    <label className="upload-zone">
                      <Upload />
                      Adicionar fotos a esta categoria (cada foto cria uma peça)
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        onChange={async (e) => {
                          const input = e.currentTarget;
                          const files = Array.from(input.files ?? []);
                          if (!files.length) return;
                          setBusy(true);
                          try {
                            for (const file of files) {
                              const path = await upload(file);
                              const name =
                                file.name
                                  .replace(/\.[^.]+$/, "")
                                  .replace(/[-_]+/g, " ")
                                  .trim() || "Nova peça";
                              const slug = `${name
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
                              const r = await supabase.from("works").insert({
                                name,
                                slug,
                                category_id: editor.id ?? null,
                                images: [path],
                                published: true,
                                position: works.length,
                              });
                              if (r.error) throw r.error;
                            }
                            await changed();
                            toast.success(
                              `${files.length} foto(s) adicionada(s). Podes editar os nomes em Peças.`,
                            );
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : "Não foi possível carregar.",
                            );
                          } finally {
                            setBusy(false);
                            input.value = "";
                          }
                        }}
                      />
                    </label>
                    <div className="editor-media">
                      {works
                        .filter((w) => w.category_id === editor.id)
                        .map((w) => {
                          const src = (w.images as string[])[0] ?? "";
                          return (
                            <div key={w.id} className="editor-photo">
                              <img src={imageUrl(urls[src] || src)} alt={w.name} />
                              <span className="optional">{w.name}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                {editor.kind === "services" && area("details", "Descrição detalhada / aplicações")}
                {mediaSelect(
                  "image",
                  "Imagem representativa",
                  String(editor.values["image"] ?? ""),
                )}
                <div>
                  {editor.kind === "categories" ? (
                    check("visible", "Visível", true)
                  ) : (
                    <>
                      {check("published", "Publicado")}
                      {check("example", "Conteúdo de exemplo")}
                    </>
                  )}
                </div>
              </>
            )}
            <div className="full editor-actions">
              <Button disabled={busy} type="submit">
                <Save />
                {busy ? "A guardar…" : "Guardar alterações"}
              </Button>
              {editor.kind === "works" && editor.values["id"] ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => remove("works", String(editor.values["id"]))}
                >
                  <Trash2 />
                  Eliminar peça
                </Button>
              ) : null}
            </div>
          </form>
        ) : section === "dashboard" ? (
          <>
            <div className="stats-grid">
              {[
                ["Trabalhos publicados", works.filter((w) => w.published).length],
                ["Categorias", categories.length],
                ["Pedidos recebidos", requests.length],
                [
                  "Por tratar",
                  requests.filter((r) => r.status === "Novo" || r.status === "Em análise").length,
                ],
              ].map(([label, value]) => (
                <div className="stat-item" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="section-heading">
              <h2 className="text-2xl">Trabalhos recentes</h2>
              <Button variant="text" onClick={() => setSection("works")}>
                Gerir catálogo <ArrowUpRight />
              </Button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <tbody>
                  {[...works]
                    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                    .slice(0, 5)
                    .map((w) => (
                      <tr key={w.id}>
                        <td>{w.name}</td>
                        <td>
                          <span className={`state-badge ${w.published ? "published" : ""}`}>
                            {w.published ? "Publicado" : "Rascunho"}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${w.name}`}
                            onClick={() => {
                              setSection("works");
                              open("works", w);
                            }}
                          >
                            <Pencil />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="notice mt-8">As peças que cria aqui aparecem logo no catálogo do site.</p>
          </>
        ) : ["works", "categories", "services"].includes(section) ? (
          <>
            <input
              className="field admin-search"
              aria-label="Pesquisar conteúdos"
              placeholder="Pesquisar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    {section === "works" ? (
                      <>
                        <th onClick={() => changeSort("published")} style={{ cursor: "pointer" }}>
                          Estado {sortBy === "published" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => changeSort("category")} style={{ cursor: "pointer" }}>
                          Categoria {sortBy === "category" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => changeSort("stock")} style={{ cursor: "pointer" }}>
                          Stock {sortBy === "stock" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th className="text-right">Ações</th>
                      </>
                    ) : (
                      <>
                        <th>Estado</th>
                        <th>Ordem</th>
                        <th className="text-right">Ações</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(section === "works"
                    ? [...works]
                        .filter((row) => row.name.toLowerCase().includes(search.toLowerCase()))
                        .sort((a, b) => {
                          switch (sortBy) {
                            case "name":
                              return sortAsc
                                ? a.name.localeCompare(b.name)
                                : b.name.localeCompare(a.name);

                            case "published":
                              return sortAsc
                                ? Number(a.published) - Number(b.published)
                                : Number(b.published) - Number(a.published);

                            case "category": {
                              const ca = categories.find((c) => c.id === a.category_id)?.name ?? "";
                              const cb = categories.find((c) => c.id === b.category_id)?.name ?? "";

                              return sortAsc ? ca.localeCompare(cb) : cb.localeCompare(ca);
                            }

                            case "stock":
                              return sortAsc
                                ? (a.stock ?? 0) - (b.stock ?? 0)
                                : (b.stock ?? 0) - (a.stock ?? 0);

                            default:
                              return 0;
                          }
                        })
                    : section === "categories"
                      ? categories
                          .filter((c) => !c.parent_id)
                          .flatMap((c) => [c, ...categories.filter((x) => x.parent_id === c.id)])
                          .filter((row) => row.name.toLowerCase().includes(search.toLowerCase()))
                      : services.filter((row) =>
                          row.name.toLowerCase().includes(search.toLowerCase()),
                        )
                  ).map((row) => (
                    <tr
                      key={row.id}
                      className={section === "works" ? "admin-row-click" : undefined}
                      title={section === "works" ? "Clica para editar" : undefined}
                      onClick={section === "works" ? () => open("works", row) : undefined}
                    >
                      <td>
                        {"parent_id" in row && row.parent_id ? (
                          <span className="sub-row">
                            ↳ {row.name} <small>subcategoria</small>
                          </span>
                        ) : (
                          <b>{row.name}</b>
                        )}
                        {section === "categories" && "parent_id" in row && !row.parent_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-3"
                            onClick={() =>
                              setEditor({
                                kind: "categories",
                                values: { parent_id: row.id, visible: true },
                                images: [],
                              })
                            }
                          >
                            + Subcategoria
                          </Button>
                        )}
                      </td>
                      <td>
                        <span
                          className={`state-badge ${("published" in row ? row.published : row.visible) ? "published" : ""}`}
                        >
                          {"published" in row
                            ? row.published
                              ? "Publicado"
                              : "Rascunho"
                            : row.visible
                              ? "Visível"
                              : "Oculto"}
                        </span>
                      </td>
                      {section === "works" && "slug" in row ? (
                        <>
                          <td>{categories.find((c) => c.id === row.category_id)?.name ?? "—"}</td>
                          <td>
                            {row.stock == null ? "—" : row.stock > 0 ? row.stock : "Esgotado"}
                          </td>
                        </>
                      ) : null}
                      {section !== "works" && <td>{row.position}</td>}
                      <td className="table-actions">
                        {section === "works" &&
                          (() => {
                            const work = row as Work;
                            return (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={work.published ? "Ocultar" : "Publicar"}
                                  onClick={async (e) => {
                                    e.stopPropagation();

                                    const { error } = await supabase
                                      .from("works")
                                      .update({
                                        published: !work.published,
                                      })
                                      .eq("id", row.id);

                                    if (error) {
                                      toast.error("Erro ao alterar o estado.");
                                      return;
                                    }

                                    await changed();
                                  }}
                                >
                                  {work.published ? (
                                    <Eye className="text-green-500 hover:text-green-700 transition" />
                                  ) : (
                                    <EyeOff className="text-gray-400 hover:text-gray-700 transition" />
                                  )}
                                </Button>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Duplicar"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicate(work);
                                  }}
                                >
                                  <Copy />
                                </Button>
                              </>
                            );
                          })()}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar"
                          onClick={(e) => {
                            e.stopPropagation();
                            open(section as Editor["kind"], row);
                          }}
                        >
                          <Pencil />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600"
                          title="Eliminar"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(section as Editor["kind"], row.id);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : section === "profile" || section === "settings" || section === "privacy" ? (
          <form
            key={section}
            className="editor-form"
            onSubmit={saveSettings}
            onInput={trackPreview}
          >
            {section === "privacy" ? (
              <>
                <label className="form-group full">
                  Texto da página de privacidade
                  <textarea
                    className="field min-h-96"
                    name="privacy"
                    defaultValue={settings["privacy"] || defaultPrivacyContent}
                  />
                </label>
                <div className="full">
                  <Button asChild variant="outline">
                    <Link to="/privacidade" target="_blank">
                      Ver página de privacidade <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
              </>
            ) : section === "profile" ? (
              <>
                {settingsField("welcome_title", "Título de boas-vindas")}
                {settingsField("bio", "Descrição ao lado do logótipo", true)}
                <span className="field-hint">
                  Escreve uma frase por linha. O email passa a ser clicável automaticamente.
                </span>
                <div className="profile-preview">
                  <div className="profile-preview-avatar">
                    {settings["logo"] &&
                    (urls[settings["logo"]] || settings["logo"].startsWith("https://")) ? (
                      <img src={urls[settings["logo"]] || settings["logo"]} alt="Logótipo" />
                    ) : (
                      <span>SDS3D</span>
                    )}
                  </div>
                  <div className="profile-preview-info">
                    <h3>{(previewText?.title ?? settings["welcome_title"]) || "Bem-vindo"}</h3>
                    <p>
                      {(previewText?.bio ?? settings["bio"] ?? "").split("\n").map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="settings-heading full">Contacto e logótipo</h3>
                {settingsField("whatsapp", "Número WhatsApp (indicativo e número)")}
                {mediaSelect("logo", "Logótipo", settings["logo"])}
                <h3 className="settings-heading full">Aspeto do site</h3>
                <label className="form-group">
                  Efeito de fundo do site
                  <select
                    className="field"
                    name="sparkles"
                    defaultValue={
                      ["off", "snow", "big"].includes(settings["sparkles"] ?? "")
                        ? settings["sparkles"]
                        : "on"
                    }
                  >
                    <option value="on">Partículas douradas</option>
                    <option value="big">Partículas douradas maiores</option>
                    <option value="snow">Neve (Natal)</option>
                    <option value="off">Sem efeito</option>
                  </select>
                </label>
                <label className="form-group">
                  Cor de destaque
                  <input
                    className="field"
                    name="primary_color"
                    type="color"
                    defaultValue={settings["primary_color"] || "#d6f36b"}
                  />
                </label>
              </>
            )}
            <div className="full">
              <Button type="submit" disabled={busy}>
                <Save />
                {busy ? "A guardar…" : "Guardar configurações"}
              </Button>
            </div>
          </form>
        ) : section === "media" ? (
          <>
            <label className="upload-zone mb-6">
              <Upload />
              Adicionar fotografias
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy}
                onChange={(e) => uploadMany(e.target.files)}
              />
            </label>
            <input
              className="field admin-search"
              aria-label="Pesquisar media"
              placeholder="Pesquisar por nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="media-grid">
              {media
                .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
                .map((m) => (
                  <div className="media-item" key={m.id}>
                    <img src={urls[m.path]} alt={m.alt} />
                    <p>{m.name}</p>
                    <label className="form-group">
                      Texto alternativo
                      <input
                        className="field"
                        defaultValue={m.alt}
                        onBlur={async (e) => {
                          const { error } = await supabase
                            .from("media")
                            .update({ alt: e.target.value })
                            .eq("id", m.id);
                          if (error) toast.error("Não foi possível guardar.");
                        }}
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={async () => {
                        const used = JSON.stringify([
                          works,
                          services,
                          categories,
                          settings,
                        ]).includes(m.path);
                        if (used) {
                          toast.error(
                            "Esta imagem está em utilização. Remove-a dos conteúdos primeiro.",
                          );
                          return;
                        }
                        if (!confirm("Eliminar permanentemente esta fotografia não utilizada?"))
                          return;
                        const { error } = await supabase.storage.from("portfolio").remove([m.path]);
                        if (error) {
                          toast.error("Não foi possível eliminar.");
                          return;
                        }
                        await supabase.from("media").delete().eq("id", m.id);
                        await changed();
                      }}
                    >
                      <Trash2 />
                      Eliminar
                    </Button>
                  </div>
                ))}
            </div>
            {!media.length && (
              <div className="empty-state">
                A tua biblioteca está pronta para as primeiras fotografias.
              </div>
            )}
          </>
        ) : section === "requests" ? (
          request ? (
            <div className="request-detail">
              <Button variant="text" onClick={() => setRequest(null)}>
                ← Voltar aos pedidos
              </Button>
              <h2 className="mt-5">{request.name}</h2>
              <dl>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${request.email}`}>{request.email}</a>
                </dd>
                <dt>Telefone</dt>
                <dd>{request.phone || "—"}</dd>
                <dt>Serviço</dt>
                <dd>{request.service || "—"}</dd>
                <dt>Referência</dt>
                <dd>{request.reference || "—"}</dd>
                <dt>Data</dt>
                <dd>{new Date(request.created_at).toLocaleString("pt-PT")}</dd>
              </dl>
              <p className="mt-6">{request.message}</p>
              {Array.isArray(request.attachments) &&
                request.attachments
                  .filter((x): x is string => typeof x === "string")
                  .map((path) => (
                    <Button
                      key={path}
                      variant="outline"
                      className="mr-2 mt-3"
                      onClick={async () => {
                        const links = await signFiles({
                          data: { bucket: "references", paths: [path] },
                        });
                        if (links[0]?.signedUrl)
                          window.open(links[0].signedUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <Download />
                      Abrir referência
                    </Button>
                  ))}
              <form onSubmit={saveRequest}>
                <label className="form-group">
                  Estado
                  <select className="field" name="status" defaultValue={request.status}>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="form-group">
                  Notas internas
                  <textarea className="field" name="notes" defaultValue={request.notes} />
                </label>
                <Button type="submit">
                  <Save />
                  Guardar pedido
                </Button>
              </form>
            </div>
          ) : (
            <>
              <div className="catalogue-tools">
                <input
                  className="field admin-search"
                  placeholder="Pesquisar nome, email ou mensagem…"
                  aria-label="Pesquisar pedidos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="field"
                  value={status}
                  aria-label="Filtrar estado"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos os estados</option>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th onClick={() => changeSort("name")} style={{ cursor: "pointer" }}>
                        Nome {sortBy === "name" && (sortAsc ? "▲" : "▼")}
                      </th>
                      <th>Email</th>
                      <th onClick={() => changeSort("published")} style={{ cursor: "pointer" }}>
                        Estado {sortBy === "published" && (sortAsc ? "▲" : "▼")}
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {requests
                      .filter(
                        (r) =>
                          (!status || r.status === status) &&
                          `${r.name} ${r.email} ${r.message}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                      )
                      .map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.created_at).toLocaleDateString("pt-PT")}</td>
                          <td>{r.name}</td>
                          <td>{r.email}</td>
                          <td>
                            <span className="state-badge">{r.status}</span>
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ver pedido de ${r.name}`}
                              onClick={() => setRequest(r)}
                            >
                              <ArrowUpRight />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!requests.length && (
                <div className="empty-state">Ainda não há pedidos de orçamento.</div>
              )}
            </>
          )
        ) : null}
        {section === "settings" && !editor && (
          <>
            <h3 className="settings-heading settings-block">O teu perfil</h3>
            <form
              className="editor-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;
                const { error } = await supabase
                  .from("profiles")
                  .update({
                    display_name: String(f.get("display_name")),
                    avatar_url: String(f.get("avatar_url") || ""),
                  })
                  .eq("id", user.id);
                if (error) toast.error("Não foi possível guardar o perfil.");
                else {
                  await changed();
                  toast.success("Perfil guardado.");
                }
              }}
            >
              <label className="form-group">
                Nome
                <input className="field" name="display_name" defaultValue={profile.display_name} />
              </label>
              <label className="form-group">
                Fotografia (URL HTTPS)
                <input
                  className="field"
                  name="avatar_url"
                  type="url"
                  defaultValue={profile.avatar_url}
                />
              </label>
              <Button type="submit">
                <Save />
                Guardar perfil
              </Button>
            </form>
            <h3 className="settings-heading settings-block">Alterar palavra-passe</h3>
            <form
              className="editor-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const { error } = await supabase.auth.updateUser({
                  password: String(f.get("password")),
                  current_password: String(f.get("current_password")),
                });
                if (error) toast.error("Não foi possível alterar. Confirma a palavra-passe atual.");
                else toast.success("Palavra-passe alterada.");
              }}
            >
              <label className="form-group">
                Palavra-passe atual
                <input className="field" type="password" name="current_password" required />
              </label>
              <label className="form-group">
                Nova palavra-passe
                <input className="field" type="password" name="password" minLength={8} required />
              </label>
              <Button type="submit">
                <Save />
                Alterar palavra-passe
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
