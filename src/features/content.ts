import hero from '@/assets/studio-hero.jpg';
import spiral from '@/assets/spiral.png';
import turbine from '@/assets/turbine.jpg';
import architecture from '@/assets/architecture.jpg';
export const exampleImages: Record<string,string> = {'example:spiral':spiral,'example:turbine':turbine,'example:architecture':architecture};
export const heroImage = hero;
export const imageUrl = (value?: string) => value ? exampleImages[value] ?? value : spiral;
export const pageHead = (title:string, description:string) => ({meta:[{title:`${title} | SDS3D`},{name:'description',content:description},{property:'og:title',content:`${title} | SDS3D`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]});
