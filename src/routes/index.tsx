import { createFileRoute } from '@tanstack/react-router';
import { siteQuery } from '@/features/site-query';
import { pageHead } from '@/features/content';
import { HomePage } from '@/components/home-page';
export const Route = createFileRoute('/')({loader:({context})=>context.queryClient.ensureQueryData(siteQuery),head:()=>pageHead('As tuas ideias ganham forma','SDS3D — Modelação 3D, criatividade e soluções personalizadas. Explora o catálogo e fala-nos do teu projeto.'),component:HomePage});
