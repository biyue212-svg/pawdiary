import { page } from '../lib/pawdiary-page';
export async function GET() {return new Response(page,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});}
