import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Upload, CheckCircle2, Mail, MessageCircle, MapPin } from "lucide-react";
import { siteQuery } from "@/features/site-query";
import { pageHead } from "@/features/content";
import { submitContact } from "@/features/site.functions";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/contactos")({
  validateSearch: (s: Record<string, unknown>): { referencia?: string | undefined } => ({
    referencia: typeof s["referencia"] === "string" ? s["referencia"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQuery),
  head: () =>
    pageHead(
      "Contactos e pedidos de orçamento",
      "Tens uma ideia? Fala com a SDS3D e pede um orçamento para o teu projeto de modelação ou criação 3D.",
    ),
  component: Contact,
});
function Contact() {
  const { data } = useSuspenseQuery(siteQuery);
  const { referencia } = Route.useSearch();
  const send = useServerFn(submitContact);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      if (files.length > 3 || files.some((f) => f.size > 10 * 1024 * 1024))
        throw new Error("Anexa até 3 ficheiros, com no máximo 10 MB cada.");
      const attachments = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192)
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          return {
            name: file.name,
            type: file.type || "application/octet-stream",
            base64: btoa(binary),
          };
        }),
      );
      await send({
        data: {
          name: String(form.get("name")),
          email: String(form.get("email")),
          phone: String(form.get("phone") || ""),
          service: String(form.get("service") || ""),
          message: String(form.get("message")),
          reference: String(form.get("reference") || ""),
          website: String(form.get("website") || ""),
          consent: form.get("consent") === "on",
          attachments,
        },
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar o pedido. Verifica os campos e tenta novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <SiteLayout>
      <div className="page-heading">
        <span className="eyebrow">VAMOS CRIAR ALGO</span>
        <h1>
          Conta-nos a tua ideia<span className="accent-dot">.</span>
        </h1>
        <p>Um esboço, uma referência ou apenas uma possibilidade. O próximo passo começa aqui.</p>
      </div>
      <section className="section contact-grid">
        {sent ? (
          <div className="success-panel" role="status">
            <CheckCircle2 size={35} />
            <h2>A tua ideia já está connosco.</h2>
            <p>
              O pedido ficou guardado e disponível para análise pela SDS3D. Obrigado pelo teu
              contacto.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setSent(false);
                setFiles([]);
              }}
            >
              Enviar outro pedido
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-grid">
              <label className="form-group">
                Nome
                <input
                  className="field"
                  name="name"
                  placeholder="O teu nome"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
              <label className="form-group">
                Email
                <input
                  className="field"
                  name="email"
                  type="email"
                  placeholder="O teu email"
                  maxLength={254}
                  required
                />
              </label>
              <label className="form-group">
                Telefone <span className="optional">Opcional</span>
                <input
                  className="field"
                  name="phone"
                  type="tel"
                  placeholder="Número de contacto"
                  maxLength={30}
                />
              </label>
              <label className="form-group">
                Tipo de serviço
                <select className="field" name="service">
                  <option value="">Selecionar serviço</option>
                  {data.services.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                  <option>Outro / ainda não sei</option>
                </select>
              </label>
              <label className="form-group full">
                Trabalho de referência <span className="optional">Opcional</span>
                <input
                  className="field"
                  name="reference"
                  defaultValue={referencia || ""}
                  maxLength={200}
                  placeholder="Nome de um trabalho ou referência"
                />
              </label>
              <label className="form-group full">
                A tua ideia
                <textarea
                  className="field"
                  name="message"
                  minLength={10}
                  maxLength={5000}
                  placeholder="Descreve o que gostarias de criar, as dimensões ou os detalhes que já tens em mente…"
                  required
                />
              </label>
              <label className="form-group full">
                Ficheiros de referência{" "}
                <span className="optional">
                  Opcional · JPG, PNG, WEBP, PDF ou STL · Até 3 ficheiros de 10 MB
                </span>
                <div className="upload-zone">
                  <Upload size={21} />
                  <input
                    type="file"
                    aria-label="Ficheiros de referência"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.stl"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                </div>
              </label>
            </div>
            <label className="hidden-honeypot" aria-hidden="true">
              Website
              <input tabIndex={-1} autoComplete="off" name="website" />
            </label>
            <label className="consent-row">
              <input type="checkbox" name="consent" required />
              <span>
                Autorizo o tratamento dos meus dados para resposta a este pedido, de acordo com a{" "}
                <Link to="/privacidade">política de privacidade</Link>.
              </span>
            </label>
            {error && (
              <p className="error-message mb-4" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "A guardar pedido…" : "Enviar pedido de orçamento"}
              <ArrowUpRight />
            </Button>
          </form>
        )}
        <aside className="contact-aside">
          <h3>
            Uma conversa.
            <br />
            Novas possibilidades.
          </h3>
          <p>
            Partilha os teus objetivos e referências. Quanto mais detalhes, melhor podemos
            compreender o teu projeto.
          </p>
          <div className="contact-links">
            {data.settings["email"] && (
              <a href={`mailto:${data.settings["email"]}`}>
                <Mail size={17} />
                {data.settings["email"]}
              </a>
            )}
            {data.settings["whatsapp"] && (
              <a
                href={`https://wa.me/${data.settings["whatsapp"].replace(/\D/g, "")}?text=${encodeURIComponent("Olá SDS3D! Gostaria de pedir um orçamento.")}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} />
                Falar pelo WhatsApp <ArrowUpRight size={15} />
              </a>
            )}
            {data.settings["location"] && (
              <p>
                <MapPin size={17} />
                {data.settings["location"]}
              </p>
            )}
            {data.settings["instagram"] && (
              <a href={data.settings["instagram"]} target="_blank" rel="noreferrer">
                Instagram <ArrowUpRight size={15} />
              </a>
            )}
            {data.settings["facebook"] && (
              <a href={data.settings["facebook"]} target="_blank" rel="noreferrer">
                Facebook <ArrowUpRight size={15} />
              </a>
            )}
            {!data.settings["email"] && !data.settings["whatsapp"] && (
              <p>O formulário está disponível para receber o teu pedido.</p>
            )}
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
