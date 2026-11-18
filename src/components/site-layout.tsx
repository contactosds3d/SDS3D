import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { GoldSparkles } from './gold-sparkles';
import { ArrowUpRight, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteQuery, type Work } from '@/features/site-query';
import { imageUrl } from '@/features/content';
export function Logo(){const {data}=useSuspenseQuery(siteQuery);return <Link to="/" aria-label="SDS3D — início" className="brand">{data.settings['logo']?<img src={data.settings['logo']} alt="SDS3D"/>:<><span className="brand-symbol"><Box strokeWidth={1.5}/></span><span>SDS<span className="brand-accent">3D</span><span className="brand-dot">.</span></span></>}</Link>}
export function SiteLayout({children}:{children:ReactNode}){
 const {data}=useSuspenseQuery(siteQuery);
 return <div className="site" style={data.settings['primary_color']?{['--primary' as string]:data.settings['primary_color'],['--ring' as string]:data.settings['primary_color'],['--brand-strong' as string]:data.settings['primary_color']}:undefined}>{data.settings['sparkles']!=='off'&&<GoldSparkles snow={data.settings['sparkles']==='snow'} big={data.settings['sparkles']==='big'}/>}<main>{children}</main><footer className="site-footer simple-footer"><span>© {new Date().getFullYear()} SDS3D</span><div><Link to="/privacidade">Privacidade</Link><Link to="/admin">Área administrativa</Link></div></footer></div>
}
export function WorkCard({work}:{work:Work}){const {data}=useSuspenseQuery(siteQuery);return <Link to="/catalogo/$slug" params={{slug:work.slug}} className="work-card"><div className="work-image"><img src={imageUrl(work.images[0])} alt={work.name} width={1024} height={1024} loading="lazy"/>{work.example&&<span className="example-badge">EXEMPLO</span>}<span className="work-open"><ArrowUpRight size={20}/></span></div><div className="work-info"><div><span className="work-category">{data.categories.find(c=>c.id===work.category_id)?.name??'Projeto personalizado'}</span><h3>{work.name}</h3></div><ArrowUpRight size={18}/></div></Link>}
export function ContactBand(){return <section className="contact-band"><div><span className="eyebrow">DA IDEIA À REALIDADE</span><h2>O próximo projeto<br/>pode ser o teu.</h2><p>Conta-nos o que tens em mente. Vamos dar-lhe forma.</p></div><Button asChild size="lg"><Link to="/contactos" search={{referencia:undefined}}>Vamos falar do teu projeto <ArrowUpRight/></Link></Button></section>}
