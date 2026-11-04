import {identity} from '../lib/session';
import {redirect} from 'next/navigation';
export async function getChatGPTUser(){const userId=await identity();return userId?{userId,displayName:'养宠人',email:'',fullName:null}:null;}
export async function requireChatGPTUser(_returnTo:string){const user=await getChatGPTUser();if(!user)redirect('/account');return user;}
export function chatGPTSignInPath(_returnTo='/'){return '/account';}
export function chatGPTSignOutPath(_returnTo='/'){return '/account';}
