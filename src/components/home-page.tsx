import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SiteLayout, Logo } from "./site-layout";
import { siteQuery, type Work } from "@/features/site-query";
import { imageUrl } from "@/features/content";
const DEFAULT_BIO =
  "🫟 Impressão 3D\n🧩 Peças personalizadas , porta-chaves e colecionáveis\n📍 Portugal, Coimbra, Cantanhede\n📦 Enviar DM\n📨 contactoSDS3D@gmail.com";
const DEFAULT_WA = "351911151840";
export function HomePage() {
  const { data } = useSuspenseQuery(siteQuery);
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState<Work | null>(null);
  const [idx, setIdx] = useState(0);
  const [base, setBase] = useState("");
  const cats = data.categories as ((typeof data.categories)[number] & {
    parent_id?: string | null;
  })[];
  const current = cats.find((c) => c.id === category);
  const childrenOf = (id: string) => cats.filter((c) => c.parent_id === id);
  const ids = (id: string): string[] => [id, ...childrenOf(id).flatMap((c) => ids(c.id))];
  const worksIn = (id: string) => {
    const all = ids(id);
    return data.works.filter((w) => w.categories.some((id) => all.includes(id)));
  };
  const shown = category
    ? cats.filter((c) => c.parent_id === category)
    : cats.filter((c) => !c.parent_id || !cats.some((p) => p.id === c.parent_id));
  const works = category ? data.works.filter((w) => w.categories.includes(category)) : [];
  const wa = (data.settings["whatsapp"] ?? "").replace(/\D/g, "") || DEFAULT_WA;
  const bio = (data.settings["bio"] || DEFAULT_BIO).replace(
    /contactoSDS3D@gmail\.com/,
    "contactoSDS3D@gmail.com",
  );
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "";
  const link = (slug: string) => (base ? `${base}?peca=${encodeURIComponent(slug)}` : "");
  const waText = (w: Work) => {
    const l = link(w.slug);
    return `${l ? `${l}\n\n` : ""}Olá SDS3D! Tenho interesse nesta peça: ${w.name}. Podem dar-me mais informações?`;
  };
  const waHref = (w: Work) => `https://wa.me/${wa}?text=${encodeURIComponent(waText(w))}`;
  const sync = (slug: string | null) => {
    try {
      const u = new URL(window.location.href);
      if (slug) u.searchParams.set("peca", slug);
      else u.searchParams.delete("peca");
      history.replaceState({}, "", u);
    } catch {
      void 0;
    }
  };
  const openWork = (w: Work) => {
    setOpen(w);
    setIdx(0);
    sync(w.slug);
  };
  const closeWork = () => {
    setOpen(null);
    sync(null);
  };
  useEffect(() => {
    setBase(window.location.origin + window.location.pathname);
  }, []);
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("peca");
    if (!slug) return;
    const w = data.works.find((x) => x.slug === slug);
    if (w) {
      setOpen(w);
      setIdx(0);
      if (w.categories.length > 0) {
        setCategory(w.categories[0]!);
      }
    }
  }, [data.works]);
  const tile = (c: (typeof cats)[number]) => {
    // A category cover must come from the category's own image field. Work
    // photos are shown after entering the category and must not be promoted
    // into its cover automatically.
    const img = c.image ? imageUrl(c.image) : "";
    return (
      <button key={c.id} className="ig-cat-tile" onClick={() => setCategory(c.id)}>
        <span className="ig-cat-img">{img && <img src={img} alt="" loading="lazy" />}</span>
        <b>{c.name}</b>
        <small>{worksIn(c.id).length} peças</small>
      </button>
    );
  };
  return (
    <SiteLayout>
      <div className="ig">
        <header className="ig-profile">
          <div className="ig-avatar">
            <Logo />
          </div>
          <div className="ig-info">
            <h1 className="ig-welcome">{data.settings["welcome_title"] || "Bem-vindo"}</h1>
            <p className="ig-bio">
              {bio.split("\n").map((l, i) => (
                <span key={i}>
                  {l.includes("@") ? (
                    <a href={`mailto:${l.replace(/^[^\w]*/, "").trim()}`}>{l}</a>
                  ) : (
                    l
                  )}
                  <br />
                </span>
              ))}
            </p>
            <a
              className="ig-wa"
              href={`https://wa.me/${wa}?text=${encodeURIComponent("Olá SDS3D! Gostaria de pedir um orçamento.")}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Pedir orçamento
            </a>
          </div>
        </header>
        {current && (
          <div className="ig-back">
            <button onClick={() => setCategory(current.parent_id ?? "")}>
              <ArrowLeft size={18} /> Voltar
            </button>
            <h2>{current.name}</h2>
          </div>
        )}
        {shown.length > 0 && <div className="ig-cats">{shown.map(tile)}</div>}
        {category && works.length > 0 && (
          <div className="ig-grid">
            {works.map((w) => (
              <div key={w.id} className="ig-tile">
                <button className="ig-tile-open" onClick={() => openWork(w)} aria-label={w.name}>
                  <img src={imageUrl(w.images[0])} alt={w.name} loading="lazy" />
                  {w.images.length > 1 && <Copy className="ig-multi" size={18} />}
                  <span className="ig-hover">
                    <strong>{w.name}</strong>

                    {w.price != null && (
                      <span className="ig-hover-price">
                        {Number(w.price).toLocaleString("pt-PT", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                    )}

                    {w.stock != null && (
                      <small className="ig-hover-stock">
                        {w.stock > 0 ? `Stock: ${w.stock}` : "Esgotado"}
                      </small>
                    )}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
        {category && !works.length && !shown.length && (
          <p className="ig-empty">Ainda não há peças nesta categoria.</p>
        )}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && closeWork()}>
        <DialogContent className="ig-modal">
          {open && (
            <>
              <div className="ig-modal-img">
                <img src={imageUrl(open.images[idx])} alt={open.name} />
                {open.images.length > 1 && (
                  <>
                    <button
                      className="ig-nav l"
                      aria-label="Anterior"
                      onClick={() => setIdx((idx - 1 + open.images.length) % open.images.length)}
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      className="ig-nav r"
                      aria-label="Seguinte"
                      onClick={() => setIdx((idx + 1) % open.images.length)}
                    >
                      <ChevronRight />
                    </button>
                  </>
                )}
              </div>
              <div className="ig-modal-side">
                <button className="ig-back-btn" onClick={closeWork}>
                  <ArrowLeft size={18} /> Voltar
                </button>
                <DialogTitle>{open.name}</DialogTitle>
                <span className="ig-cat">{open.categories.map(catName).join(" • ")}</span>
                {open.description && <p>{open.description}</p>}
                {(() => {
                  const o = open as unknown as { price?: number | null; stock?: number | null };
                  return (
                    <div className="ig-price">
                      {o.price != null && (
                        <p className="ig-price-v">
                          {Number(o.price).toLocaleString("pt-PT", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      )}
                      {o.stock != null && (
                        <p className="ig-stock">
                          {o.stock > 0 ? `Em stock: ${o.stock}` : "Esgotado"}
                        </p>
                      )}
                    </div>
                  );
                })()}
                {open.material && (
                  <p>
                    <b>Material:</b> {open.material}
                  </p>
                )}
                <a className="ig-wa" href={waHref(open)} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> Enviar mensagem no WhatsApp
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
