import {configured} from '../../../lib/runtime';
export function GET(){return Response.json({ok:true,backendConfigured:configured()},{headers:{'Cache-Control':'no-store'}});}
