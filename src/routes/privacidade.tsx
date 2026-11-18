import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {siteQuery} from '@/features/site-query';
import {pageHead} from '@/features/content';
import {SiteLayout} from '@/components/site-layout';
import {defaultPrivacyContent} from '@/features/privacy-content';
import {Link} from '@tanstack/react-router';
import {Button} from '@/components/ui/button';
import {ArrowLeft} from 'lucide-react';
export const Route=createFileRoute('/privacidade')({loader:({context})=>context.queryClient.ensureQueryData(siteQuery),head:()=>pageHead('Privacidade e cookies','Como a SDS3D trata os pedidos de contacto, o acesso administrativo e as estatísticas de visitas.'),component:Privacy});
function Privacy(){
  const {data}=useSuspenseQuery(siteQuery);
  const content=data.settings['privacy'] || defaultPrivacyContent;
  return <SiteLayout><div className="page-heading"><Button asChild variant="text"><Link to="/"><ArrowLeft/> Voltar ao catálogo</Link></Button><span className="eyebrow">OS TEUS DADOS</span><h1>Privacidade e cookies.</h1></div><section className="section long-copy">{content.split(/\n\s*\n/).map((block,index)=>{
    const [title,...lines]=block.split('\n');
    return <div key={index} className="mb-8">{lines.length>0&&<h2>{title}</h2>}<p className="whitespace-pre-line">{(lines.length>0?lines.join('\n'):title)?.split(/(https:\/\/[^\s]+)/g).map((part,i)=>part.startsWith('https://')?<a key={i} className="underline break-words" href={part} target="_blank" rel="noreferrer">{part}</a>:part)}</p></div>;
  })}</section></SiteLayout>;
}
