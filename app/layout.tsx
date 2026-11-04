import type {Metadata} from 'next';
export const metadata:Metadata={title:'爪爪日记 PawDiary',description:'记录每一种陪伴的成长'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
