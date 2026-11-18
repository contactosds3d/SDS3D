import {describe,it,expect} from 'vitest';
import {contactSchema,statuses} from '@/features/validation';
const valid={name:'Nome Teste',email:'teste@example.com',phone:'',service:'',message:'Quero desenvolver uma peça personalizada.',reference:'',consent:true,website:'',attachments:[]};
describe('Regras dos pedidos SDS3D',()=>{
 it('exige consentimento para guardar um pedido',()=>{expect(contactSchema.safeParse({...valid,consent:false}).success).toBe(false);expect(contactSchema.safeParse(valid).success).toBe(true);});
 it('recusa o campo de spam preenchido',()=>expect(contactSchema.safeParse({...valid,website:'spam'}).success).toBe(false));
 it('recusa ficheiros executáveis',()=>expect(contactSchema.safeParse({...valid,attachments:[{name:'payload.exe',type:'application/octet-stream',base64:'YWJj'}]}).success).toBe(false));
 it('mantém os quatro estados definidos para pedidos',()=>expect(statuses).toEqual(['Novo','Em análise','Respondido','Concluído']));
});
