import { z } from 'zod';
export const fileTypes = ['image/jpeg','image/png','image/webp','application/pdf','model/stl','application/sla','application/octet-stream'];
export const attachmentSchema = z.object({name:z.string().min(1).max(180),type:z.string(),base64:z.string().max(14000000)}).refine(f=>fileTypes.includes(f.type) && /\.(jpe?g|png|webp|pdf|stl)$/i.test(f.name),'Formato de ficheiro não permitido.');
export const contactSchema = z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(254),phone:z.string().max(30),service:z.string().max(120),message:z.string().trim().min(10).max(5000),reference:z.string().max(200),consent:z.literal(true),website:z.string().max(0),attachments:z.array(attachmentSchema).max(3)});
export const statuses = ['Novo','Em análise','Respondido','Concluído'] as const;
