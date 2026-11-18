import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
export const adminFiles=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({bucket:z.enum(['portfolio','references']),paths:z.array(z.string()).max(100)})).handler(async({data,context})=>{const {data:allowed}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!allowed)throw new Error('Acesso reservado à administração.');const {data:urls,error}=await context.supabase.storage.from(data.bucket).createSignedUrls(data.paths,3600);if(error)throw error;return urls??[];});
