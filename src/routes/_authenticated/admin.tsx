import {createFileRoute} from '@tanstack/react-router';
import {AdminPanel} from '@/components/admin-panel';
import {pageHead} from '@/features/content';
export const Route=createFileRoute('/_authenticated/admin')({head:()=>({...pageHead('Administração','Gestão privada do catálogo, conteúdos e pedidos SDS3D.'),meta:[...pageHead('Administração','Gestão privada do catálogo, conteúdos e pedidos SDS3D.').meta,{name:'robots',content:'noindex,nofollow'}]}),component:AdminPanel});
