import {queryOptions} from '@tanstack/react-query';
import {getPublicSite} from './site.functions';
export const siteQuery=queryOptions({queryKey:['public-site'],queryFn:()=>getPublicSite(),staleTime:60000});
export type SiteData=Awaited<ReturnType<typeof getPublicSite>>;
export type Work=SiteData['works'][number];
