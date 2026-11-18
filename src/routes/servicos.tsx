import {createFileRoute,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ArrowUpRight} from 'lucide-react';
import {siteQuery} from '@/features/site-query';
import {pageHead,imageUrl} from '@/features/content';
import {SiteLayout,ContactBand} from '@/components/site-layout';
import {Button} from '@/components/ui/button';
export const Route=createFileRoute('/servicos')({loader:({context})=>context.queryClient.ensureQueryData(siteQuery),head:()=>pageHead('Serviços','Conhece as possibilidades de modelação 3D e os serviços configurados pela SDS3D.'),component:Services});
function Services(){const {data}=useSuspenseQuery(siteQuery);return <SiteLayout><div className="page-heading"><span className="eyebrow">CRIATIVIDADE COM PRECISÃO</span><h1>Da ideia à terceira dimensão<span className="accent-dot">.</span></h1><p>Cada projeto tem um ponto de partida diferente. Encontra a abordagem que faz sentido para a tua ideia.</p></div><section className="section service-list">{data.services.map((s,i)=><article className="service-detail" key={s.id}><span>0{i+1}</span><div><h2>{s.name}</h2><p>{s.description}</p><p>{s.details}</p>{s.example&&<span className="optional">Serviço de exemplo — a confirmar pela SDS3D.</span>}{s.image&&<img className="w-full max-w-md mt-5 rounded" src={imageUrl(s.image)} alt={s.name} loading="lazy"/>}</div><Button variant="outline" asChild><Link to="/contactos" search={{referencia:s.name}}>Pedir orçamento <ArrowUpRight/></Link></Button></article>)}{!data.services.length&&<div className="empty-state">Novas possibilidades em breve.</div>}</section><ContactBand/></SiteLayout>}
