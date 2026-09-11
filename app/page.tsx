'use client';

import {
  AlertTriangle, AppWindow, Bell, Bot, Building2, CalendarDays, ChevronDown, ChevronRight,
  CircleHelp, Cloud, CreditCard, Database, FileBarChart, Globe2,
  Grid3X3, Info, KeyRound, Laptop, LifeBuoy, Mail, Menu, MonitorSmartphone,
  Plus, Search, Settings, ShieldCheck, Sparkles, Users, Video, Wrench, X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { chromePoliciesByTab, type ChromePolicyItem } from '@/lib/chrome-user-policies';
import { chromeDevicePolicyCategories } from '@/lib/chrome-device-policies';
import { chromeAppsExtensionSettingsCategories } from '@/lib/chrome-apps-extension-settings';

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
    } } };
  }
}

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type Section = { id: string; title: string; subtitle: string; icon: IconType; links: string[]; blueDot?: boolean };
type Org = { id: string; name: string; parent: string; description: string };
type PracticeUser = { id: string; firstName: string; lastName: string; email: string; org: string; status: string };
type PracticeGroup = { id: string; name: string; email: string; description: string; members: string[] };
type Profile = { name: string; email: string; picture: string };
type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };

const OU_TREE = [
  { name: '연습학교', description: '연습학교', children: true },
  { name: '1.관리자', description: '-', children: false },
  { name: '2.교원', description: '-', children: false },
  { name: '3.학생', description: '-', children: true },
  { name: '4.태블릿기기', description: '-', children: true },
  { name: '5.크롬북(삭제금지)', description: '-', children: true },
] as const;

const sections: Section[] = [
  { id:'directory', title:'디렉터리', subtitle:'사용자, 그룹, 조직 단위 관리', icon:Users, links:['사용자','그룹','공유 대상 그룹','조직 단위','건물 및 리소스','디렉터리 설정','외부 디렉터리'] },
  { id:'chrome', title:'Chrome 브라우저', subtitle:'브라우저 정책과 확장 프로그램 관리', icon:Globe2, blueDot:true, links:['개요','설정 가이드','관리 브라우저','관리 프로필','설정','커스텀 구성','토큰','앱 및 확장 프로그램','커넥터','보고서'] },
  { id:'devices', title:'기기', subtitle:'모바일·엔드포인트·ChromeOS 기기 관리', icon:MonitorSmartphone, links:['개요','모바일 및 엔드포인트','ChromeOS','Chrome','네트워크'] },
  { id:'agents', title:'에이전트', subtitle:'교육용 자동화 기능 둘러보기', icon:Bot, links:['에이전트 개요','활동','설정'] },
  { id:'apps', title:'앱', subtitle:'Google Workspace 및 웹 앱 설정', icon:AppWindow, links:['개요','Google Workspace','추가 Google 서비스','웹 및 모바일 앱','Google Workspace Marketplace 앱','LDAP'] },
  { id:'ai', title:'생성형 AI', subtitle:'AI 기능의 접근 및 데이터 설정', icon:Sparkles, links:['Gemini 앱','Gemini Enterprise','Workspace의 Gemini','Gemini Notebook','Gemini 보고서'] },
  { id:'security', title:'보안', subtitle:'인증, 알림, 조사 도구', icon:ShieldCheck, links:['보안 센터','인증','액세스 및 데이터 제어','경고 센터'] },
  { id:'data', title:'데이터', subtitle:'이전, 가져오기, 내보내기 설정', icon:Database, links:['데이터 이전','가져오기 및 내보내기','데이터 리전'] },
  { id:'reports', title:'보고', subtitle:'사용자 및 관리자 활동 모니터링', icon:FileBarChart, links:['보고서','감사 및 조사','앱 보고서'] },
  { id:'billing', title:'결제', subtitle:'구독 및 결제 계정 살펴보기', icon:CreditCard, links:['구독','결제 계정','라이선스'] },
  { id:'account', title:'계정', subtitle:'조직 프로필과 환경설정 관리', icon:Settings, links:['계정 설정','프로필','맞춤 URL','법률 및 규정 준수'] },
  { id:'rules', title:'규칙', subtitle:'알림 및 자동 작업 규칙 설정', icon:KeyRound, links:['규칙 목록','활동 규칙','보고 규칙'] },
  { id:'storage', title:'저장용량', subtitle:'조직의 공유 저장용량 관리', icon:Cloud, links:['개요','저장용량 관리 도구','사용자별 저장용량'] },
];

const starterOrgs: Org[] = [
  { id:'org-root', name:'연습학교', parent:'', description:'연습학교' },
  { id:'org-admin', name:'1.관리자', parent:'연습학교', description:'-' },
  { id:'org-teachers', name:'2.교원', parent:'연습학교', description:'-' },
  { id:'org-students', name:'3.학생', parent:'연습학교', description:'-' },
  { id:'org-tablets', name:'4.태블릿기기', parent:'연습학교', description:'-' },
  { id:'org-chromebooks', name:'5.크롬북(삭제금지)', parent:'연습학교', description:'-' },
];
const starterUsers: PracticeUser[] = [
  { id:'admin-locked', firstName:'관리자', lastName:'최고', email:'admin@school.sen.ms.kr', org:'1.관리자', status:'보호됨' },
];
const starterGroups: PracticeGroup[] = [
  { id:'g-all', name:'연습학교', email:'all@school.sen.ms.kr', description:'Default audience with all users in your organization (updated automatically)', members:Array.from({length:1372},(_,i)=>`u${i}`) },
  { id:'g-teachers', name:'연습 교사그룹', email:'teachers@school.sen.ms.kr', description:'', members:['admin-locked'] },
];

const SAMPLE_APPS = [
  { name:'Padlet', id:'com.wallwisher.Padlet', policy:'설치 허용', pinned:'warn' },
  { name:'kr.smobile.app.t3', id:'kr.smobile.app.t3', policy:'설치 허용', pinned:'' },
  { name:'Kami for Google Chrome™', id:'kami', policy:'강제 설치', pinned:'고정되지 않음' },
  { name:'Canva', id:'canva', policy:'설치 허용', pinned:'warn' },
  { name:'Sketchbook', id:'sketchbook', policy:'설치 허용', pinned:'warn' },
  { name:'Zoom Workplace for Chromebook', id:'zoom', policy:'설치 허용', pinned:'' },
  { name:'이비스 페인트 X (ibis Paint X)', id:'ibis', policy:'설치 허용', pinned:'warn' },
  { name:'Chrome Remote Desktop', id:'crd', policy:'강제 설치', pinned:'고정되지 않음' },
  { name:'Google 렌즈 (Google Lens)', id:'lens', policy:'설치 허용', pinned:'warn' },
  { name:'핑커벨(학생용)', id:'pinkerbell', policy:'설치 허용', pinned:'' },
];

const WORKSPACE_NESTED = [
  '서비스 상태','검토','AppSheet','Calendar','Chrome 동기화','Classroom','Drive 및 Docs','Gmail',
  'Google Meet','Google Vault','Google Voice','Google Workspace LTI™','Google Chat','Groups for Business',
  'Keep','Read Along','Sites','Workspace Studio','Tasks',
] as const;

const EXTRA_GOOGLE_SERVICES = [
  { name:'AI Studio', status:'사용', needConfirm:true },
  { name:'Colab', status:'사용', needConfirm:true },
  { name:'Chrome 웹 스토어', status:'사용', needConfirm:false },
  { name:'Blogger', status:'사용', needConfirm:false },
  { name:'Google Ads', status:'사용 안함', needConfirm:true },
  { name:'Google Analytics', status:'사용', needConfirm:false },
  { name:'Google Cloud Platform', status:'사용', needConfirm:true },
  { name:'Google Pay', status:'사용 안함', needConfirm:false },
  { name:'Google 검색 콘솔', status:'사용', needConfirm:false },
  { name:'Looker Studio', status:'사용', needConfirm:true },
  { name:'Managed Google Play', status:'사용', needConfirm:false },
  { name:'YouTube', status:'사용', needConfirm:false },
] as const;

const MARKETPLACE_APPS = [
  { name:'Canva', publisher:'Canva Pty Ltd', status:'배포됨', users:'전체' },
  { name:'DocHub', publisher:'DocHub', status:'배포됨', users:'교원' },
  { name:'Kahoot!', publisher:'Kahoot!', status:'허용', users:'전체' },
  { name:'Kami', publisher:'Amazing Widgets', status:'배포됨', users:'전체' },
  { name:'Nearpod', publisher:'Nearpod Inc.', status:'허용', users:'교원' },
  { name:'두클래스', publisher:'두클래스', status:'배포됨', users:'전체' },
  { name:'Pear Deck', publisher:'Pear Deck', status:'허용', users:'교원' },
  { name:'Quizizz', publisher:'Quizizz Inc.', status:'허용', users:'전체' },
] as const;


function decodeCredential(credential: string): Partial<Profile> {
  try {
    const raw = credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const data = JSON.parse(decodeURIComponent(Array.from(atob(raw), c => `%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join('')));
    return { name:data.name, email:data.email, picture:data.picture };
  } catch { return {}; }
}

export default function HomePage() {
  const [signedIn,setSignedIn] = useState(false);
  const [profile,setProfile] = useState<Profile>({ name:'연수 참여 교사', email:'teacher.practice@gmail.com', picture:'' });
  const [active,setActive] = useState('home');
  const [activeLink,setActiveLink] = useState('개요');
  const [sidebarOpen,setSidebarOpen] = useState(true);
  const [query,setQuery] = useState('');
  const [toast,setToast] = useState('');
  const [googleReady,setGoogleReady] = useState(false);
  const [orgs,setOrgs] = useState<Org[]>(starterOrgs);
  const [users,setUsers] = useState<PracticeUser[]>(starterUsers);
  const [groups,setGroups] = useState<PracticeGroup[]>(starterGroups);
  const [modal,setModal] = useState<'org'|'user'|'group'|null>(null);
  const current = sections.find(s => s.id === active);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return;
    const setup = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({ client_id:googleClientId, callback:({credential}) => {
        const data = decodeCredential(credential);
        setProfile({ name:data.name || 'Google 사용자', email:data.email || '', picture:data.picture || '' });
        setSignedIn(true);
      }});
      const target = document.getElementById('google-signin');
      if (target) {
        target.innerHTML='';
        window.google.accounts.id.renderButton(target,{theme:'outline',size:'large',shape:'pill',text:'continue_with',locale:'ko',width:280});
        setGoogleReady(true);
      }
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) { if (window.google) setup(); else existing.addEventListener('load',setup,{once:true}); return; }
    const script=document.createElement('script'); script.src='https://accounts.google.com/gsi/client'; script.async=true; script.defer=true; script.dataset.googleIdentity='true'; script.onload=setup; document.head.appendChild(script);
  },[googleClientId]);

  useEffect(() => {
    if (!signedIn) return;
    const key=`admin-practice-v4:${profile.email || 'guest'}`;
    try { const saved=localStorage.getItem(key); if (saved) { const data=JSON.parse(saved); setOrgs(data.orgs || starterOrgs); setUsers(data.users || starterUsers); setGroups(data.groups || starterGroups); } } catch {}
  },[signedIn,profile.email]);
  useEffect(() => {
    if (!signedIn) return;
    localStorage.setItem(`admin-practice-v4:${profile.email || 'guest'}`,JSON.stringify({orgs,users,groups}));
  },[signedIn,profile.email,orgs,users,groups]);
  useEffect(() => { if (!toast) return; const timer=setTimeout(()=>setToast(''),2800); return()=>clearTimeout(timer); },[toast]);

  const filtered = useMemo(() => { const q=query.trim().toLowerCase(); return q ? sections.filter(s => `${s.title} ${s.subtitle} ${s.links.join(' ')}`.toLowerCase().includes(q)) : sections; },[query]);
  const openSection=(id:string,link?:string)=>{ const sec=sections.find(s=>s.id===id); setActive(id); setActiveLink(link || sec?.links[0] || '개요'); setQuery(''); if(typeof innerWidth!=='undefined' && innerWidth<800) setSidebarOpen(false); };
  const notify=(label:string)=>setToast(`연습 모드: “${label}” — 실제 관리 콘솔에는 반영되지 않습니다.`);
  const addOrg=(org:Omit<Org,'id'>)=>{ setOrgs(v=>[...v,{...org,id:crypto.randomUUID()}]); setModal(null); setToast(`조직 단위 “${org.name}”을 만들었습니다.`); };
  const addUser=(user:Omit<PracticeUser,'id'|'status'>)=>{ setUsers(v=>[...v,{...user,id:crypto.randomUUID(),status:'활성'}]); setModal(null); setToast(`사용자 “${user.email}”을 만들었습니다.`); };
  const addGroup=(group:Omit<PracticeGroup,'id'>)=>{ setGroups(v=>[...v,{...group,id:crypto.randomUUID()}]); setModal(null); setToast(`그룹 “${group.email}”을 만들었습니다.`); };
  const deleteOrg=(id:string)=>{ if(starterOrgs.some(o=>o.id===id)){setToast('기본 조직 단위는 삭제할 수 없습니다.');return;} setOrgs(v=>v.filter(x=>x.id!==id)); setToast('조직 단위를 삭제했습니다.'); };
  const deleteUser=(id:string)=>{ if(id==='admin-locked'){setToast('초기 관리자 계정은 보호됩니다.');return;} setUsers(v=>v.filter(x=>x.id!==id)); setToast('사용자 계정을 삭제했습니다.'); };
  const deleteGroup=(id:string)=>{ if(id==='g-all'||id==='g-teachers'){setToast('기본 공유 대상 그룹은 보호됩니다.');return;} setGroups(v=>v.filter(x=>x.id!==id)); setToast('그룹을 삭제했습니다.'); };

  useEffect(() => {
    const context=(document as Document & { modelContext?:ModelContext }).modelContext;
    if(!context?.registerTool || !signedIn) return;
    const lifecycle=new AbortController();
    const register=(tool:Record<string,unknown>)=>void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});
    register({name:'create_practice_organization',title:'연습용 조직 단위 만들기',description:'브라우저 내 연습용 조직 단위를 생성합니다.',inputSchema:{type:'object',properties:{name:{type:'string'},parent:{type:'string'},description:{type:'string'}},required:['name'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const v=input as {name?:string;parent?:string;description?:string};if(!v.name?.trim())throw new Error('name is required');const item={id:crypto.randomUUID(),name:v.name.trim(),parent:v.parent||'연습학교',description:v.description||''};setOrgs(old=>[...old,item]);return {created:true,id:item.id,name:item.name,practiceOnly:true}}});
    register({name:'create_practice_user',title:'연습용 사용자 만들기',description:'연습용 가짜 사용자 계정을 생성합니다.',inputSchema:{type:'object',properties:{firstName:{type:'string'},lastName:{type:'string'},username:{type:'string'},organization:{type:'string'}},required:['firstName','lastName','username'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const v=input as {firstName?:string;lastName?:string;username?:string;organization?:string};if(!v.firstName||!v.lastName||!v.username)throw new Error('required');const item={id:crypto.randomUUID(),firstName:v.firstName,lastName:v.lastName,email:`${v.username.replace(/@.*/,'')}@school.sen.ms.kr`,org:v.organization||'3.학생',status:'활성'};setUsers(old=>[...old,item]);return {created:true,id:item.id,email:item.email,practiceOnly:true}}});
    register({name:'create_practice_group',title:'연습용 그룹 만들기',description:'브라우저 내 가짜 그룹을 생성합니다.',inputSchema:{type:'object',properties:{name:{type:'string'},address:{type:'string'},memberIds:{type:'array',items:{type:'string'}}},required:['name','address'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const v=input as {name?:string;address?:string;memberIds?:string[]};if(!v.name||!v.address)throw new Error('required');const valid=new Set(users.map(user=>user.id));const item={id:crypto.randomUUID(),name:v.name,email:`${v.address.replace(/@.*/,'')}@school.sen.ms.kr`,description:'',members:(v.memberIds||[]).filter(id=>valid.has(id))};setGroups(old=>[...old,item]);return {created:true,id:item.id,email:item.email,memberCount:item.members.length,practiceOnly:true}}});
    return ()=>lifecycle.abort();
  },[signedIn,users]);

  if(!signedIn) return <main className="login-shell"><section className="login-card"><div className="brand-mark large">A</div><p className="eyebrow">ADMIN · PRACTICE</p><h1>관리 콘솔 실습</h1><p className="login-description">실제 조직 설정을 바꾸지 않고 사용자·그룹·조직 단위·Chrome 메뉴를 자유롭게 눌러보세요.</p><div id="google-signin" className="google-signin"/>{!googleReady&&<button className="demo-login" onClick={()=>setSignedIn(true)}><span>G</span> 체험 계정으로 시작</button>}<p className="login-note">연습 데이터는 이 브라우저에만 저장됩니다.</p><div className="domain-chip"><Globe2 size={16}/> 연습학교 · school.sen.ms.kr</div></section><Footer/></main>;

  return <div className="app-shell">
    <header className="topbar"><button className="icon-button" onClick={()=>setSidebarOpen(v=>!v)} aria-label="메뉴"><Menu/></button><button className="brand" onClick={()=>setActive('home')}><div className="brand-mark">A</div><span>Admin</span><small className="practice-chip">연습용</small></button><label className="searchbox"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="사용자, 그룹, 설정 또는 기기 검색"/></label><div className="top-actions"><button className="icon-button" onClick={()=>notify('알림')}><Bell size={20}/></button><button className="icon-button" onClick={()=>notify('도움말')}><CircleHelp size={20}/></button><button className="icon-button desktop-only" onClick={()=>openSection('apps')}><Grid3X3 size={20}/></button><button className="profile-button" onClick={()=>notify('계정')}>{profile.picture?<img src={profile.picture} alt=""/>:profile.name.slice(0,1)}</button></div></header>
    <div className={`workspace ${sidebarOpen?'':'sidebar-collapsed'}`}><aside className="sidebar">{sections.map((s,index)=><SidebarItem key={s.id} section={s} expanded={active===s.id} activeLink={activeLink} onOpen={openSection} showBadge={s.id==='agents'} defaultExpanded={index===0}/>)}<div className="sidebar-spacer"/><button className="nav-item" onClick={()=>notify('의견 보내기')}><LifeBuoy size={19}/><span>의견 보내기</span></button></aside>
      <main className="content">{query?<SearchResults sections={filtered} onOpen={openSection}/>:active==='home'?<Dashboard onOpen={openSection} onModal={setModal} onAction={notify} userCount={users.length} orgCount={orgs.length} groupCount={groups.length}/>:current?<SectionView section={current} activeLink={activeLink} setActiveLink={setActiveLink} users={users} orgs={orgs} groups={groups} onModal={setModal} onDeleteOrg={deleteOrg} onDeleteUser={deleteUser} onDeleteGroup={deleteGroup} onAction={notify} onHome={()=>setActive('home')}/>:null}<Footer/></main>
    </div>
    {modal==='org'&&<OrgModal orgs={orgs} onClose={()=>setModal(null)} onSave={addOrg}/>} {modal==='user'&&<UserModal orgs={orgs} onClose={()=>setModal(null)} onSave={addUser}/>} {modal==='group'&&<GroupModal users={users} onClose={()=>setModal(null)} onSave={addGroup}/>} {toast&&<div className="toast" role="status"><ShieldCheck size={19}/>{toast}<button onClick={()=>setToast('')}><X size={16}/></button></div>}
  </div>;
}

function SidebarItem({section,expanded,activeLink,onOpen,showBadge,defaultExpanded}:{section:Section;expanded:boolean;activeLink:string;onOpen:(id:string,link?:string)=>void;showBadge?:boolean;defaultExpanded?:boolean}){
  const [open,setOpen]=useState(defaultExpanded||false);
  const [reportsOpen,setReportsOpen]=useState(activeLink==='조직 수준 사용량'||activeLink==='사용자 수준 사용량'||activeLink==='Gemini 보고서');
  const workspaceActive = WORKSPACE_NESTED.includes(activeLink as typeof WORKSPACE_NESTED[number]) || activeLink==='Google Workspace';
  const [gwOpen,setGwOpen]=useState(workspaceActive);
  const Icon=section.icon; const isOpen=open||expanded;
  return <div className="nav-group"><button className={`nav-item ${expanded?'active-parent':''}`} onClick={()=>{setOpen(v=>!v);onOpen(section.id,section.links[0]);}}><span className="nav-chevron">{isOpen?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</span><Icon size={19}/><span>{section.title}</span>{section.blueDot&&<i className="blue-dot" aria-hidden/>}{showBadge&&<em>새로운 기능</em>}</button>{isOpen&&<div className="subitems">{section.links.map(link=>{
    if(section.id==='ai' && link==='Gemini 보고서'){
      const reportActive=activeLink==='Gemini 보고서'||activeLink==='조직 수준 사용량'||activeLink==='사용자 수준 사용량';
      return <div key={link} className="sub-nested"><button className={expanded&&reportActive?'active':''} onClick={()=>{setReportsOpen(true);onOpen(section.id,'조직 수준 사용량');}}>{link}<ChevronRight size={14}/></button>{(reportsOpen||reportActive)&&<div className="sub-subitems"><button className={activeLink==='조직 수준 사용량'?'active':''} onClick={()=>onOpen(section.id,'조직 수준 사용량')}>조직 수준 사용량</button><button className={activeLink==='사용자 수준 사용량'?'active':''} onClick={()=>onOpen(section.id,'사용자 수준 사용량')}>사용자 수준 사용량</button></div>}</div>;
    }
    if(section.id==='apps' && link==='Google Workspace'){
      return <div key={link} className="sub-nested"><button className={expanded&&workspaceActive?'active':''} onClick={()=>{setGwOpen(true);onOpen(section.id,'Google Workspace');}}>{link}<ChevronRight size={14}/></button>{(gwOpen||workspaceActive)&&<div className="sub-subitems">{WORKSPACE_NESTED.map(app=><button key={app} className={activeLink===app?'active':''} onClick={()=>onOpen(section.id,app)}>{app}</button>)}</div>}</div>;
    }
    return <button key={link} className={expanded&&activeLink===link?'active':''} onClick={()=>onOpen(section.id,link)}>{link}</button>;
  })}</div>}</div>;
}
function Dashboard({onOpen,onModal,onAction,userCount,orgCount,groupCount}:{onOpen:(id:string,link?:string)=>void;onModal:(v:'org'|'user'|'group')=>void;onAction:(v:string)=>void;userCount:number;orgCount:number;groupCount:number}){
  const cards=[
    {id:'directory',title:'사용자',subtitle:`계정 ${userCount}개`,links:['사용자 추가','사용자 삭제','사용자 이름 또는 이메일 업데이트'],linkTarget:'사용자'},
    {id:'chrome',title:'Chrome 브라우저',subtitle:'정책 · 확장 프로그램',links:['개요','설정','앱 및 확장 프로그램','설정 가이드']},
    {id:'ai',title:'생성형 AI',subtitle:'Gemini 앱 및 보고서',links:['Gemini 앱','Workspace의 Gemini','Gemini 보고서']},
    {id:'devices',title:'기기',subtitle:'ChromeOS · 모바일',links:['Chrome','ChromeOS','개요']},
    {id:'apps',title:'앱',subtitle:'Workspace 및 웹 앱',links:['개요','Google Workspace','추가 Google 서비스','Google Workspace Marketplace 앱']},
    {id:'security',title:'보안',subtitle:'인증 및 경고',links:['보안 센터','인증']},
  ];
  return <div className="dashboard-wrap"><div className="welcome-row"><div><p className="eyebrow">연습학교 · SCHOOL.SEN.MS.KR</p><h1>관리 콘솔 홈</h1><p>디렉터리, Chrome, 생성형 AI 메뉴를 탐색하세요. 변경은 이 브라우저에만 저장됩니다.</p></div></div><div className="quick-practice"><button onClick={()=>onModal('org')}><Building2/><span><strong>조직 단위 만들기</strong><small>현재 {orgCount}개</small></span><Plus/></button><button onClick={()=>onModal('user')}><Users/><span><strong>사용자 계정 만들기</strong><small>현재 {userCount}개</small></span><Plus/></button><button onClick={()=>onModal('group')}><Grid3X3/><span><strong>그룹 만들기</strong><small>현재 {groupCount}개</small></span><Plus/></button></div><section className="card-grid">{cards.map(card=><article className="dashboard-card" key={card.title} onClick={()=>onOpen(card.id)}><header><div><h2>{card.title}</h2><p>{card.subtitle}</p></div><button onClick={e=>{e.stopPropagation();onOpen(card.id)}}>모두 보기</button></header><div className="card-links">{card.links.map(link=><button key={link} onClick={e=>{e.stopPropagation(); if(link==='사용자 추가')onModal('user'); else onOpen(card.id,link)}}>{link}<ChevronRight size={15}/></button>)}</div></article>)}</section></div>;
}

function SectionView({section,activeLink,setActiveLink,users,orgs,groups,onModal,onDeleteOrg,onDeleteUser,onDeleteGroup,onAction,onHome}:{section:Section;activeLink:string;setActiveLink:(v:string)=>void;users:PracticeUser[];orgs:Org[];groups:PracticeGroup[];onModal:(v:'org'|'user'|'group')=>void;onDeleteOrg:(id:string)=>void;onDeleteUser:(id:string)=>void;onDeleteGroup:(id:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  if(section.id==='directory' && activeLink==='조직 단위') return <OrgUnitsView orgs={orgs} onModal={onModal} onAction={onAction} onHome={onHome}/>;
  if(section.id==='directory' && activeLink==='공유 대상 그룹') return <TargetAudiencesView groups={groups} onAction={onAction} onHome={onHome}/>;
  if(section.id==='directory' && activeLink==='디렉터리 설정') return <DirectorySettingsView onAction={onAction} onHome={onHome}/>;
  if(section.id==='directory' && activeLink==='외부 디렉터리') return <ExternalDirectoryView onAction={onAction} onHome={onHome}/>;
  if(section.id==='directory' && activeLink==='사용자') return <UsersListView users={users} orgs={orgs} onModal={onModal} onDeleteUser={onDeleteUser} onAction={onAction} onHome={onHome}/>;
  if(section.id==='directory' && activeLink==='그룹') return <GroupsListView groups={groups} users={users} onModal={onModal} onDeleteGroup={onDeleteGroup} onAction={onAction} onHome={onHome}/>;
  if(section.id==='directory' && activeLink==='건물 및 리소스') return <AdminListPage title="건물 및 리소스" breadcrumb="디렉터리" description="회의실, 건물, 캘린더 리소스를 관리합니다." columns={['이름','유형','층','용량']} rows={[['본관','건물','—','—'],['과학실','회의실','2층','30'],['도서관','회의실','1층','40']]} actionLabel="리소스 추가" onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='개요') return <ChromeOverviewView onAction={onAction} onHome={onHome} onOpenLink={(l)=>setActiveLink(l)}/>;
  if(section.id==='chrome' && activeLink==='설정 가이드') return <ChromeSetupGuideView onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='앱 및 확장 프로그램') return <ChromeAppsView onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='설정') return <SettingsView section={section} activeLink={activeLink} setActiveLink={setActiveLink} onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='관리 브라우저') return <AdminListPage title="관리 브라우저" breadcrumb="Chrome 브라우저" description="클라우드에 등록된 브라우저를 확인합니다." columns={['기기 이름','버전','마지막 활동','상태']} rows={[['—','—','—','활성 브라우저 없음']]} actionLabel="브라우저 등록" onAction={onAction} onHome={onHome} emptyHint="아직 등록된 관리 브라우저가 없습니다."/>;
  if(section.id==='chrome' && activeLink==='관리 프로필') return <AdminListPage title="관리 프로필" breadcrumb="Chrome 브라우저" description="관리되는 사용자 프로필을 확인합니다." columns={['사용자','브라우저','마지막 동기화','상태']} rows={[['—','—','—','활성 프로필 없음']]} actionLabel="프로필 보기" onAction={onAction} onHome={onHome} emptyHint="관리 프로필이 아직 없습니다."/>;
  if(section.id==='chrome' && activeLink==='커스텀 구성') return <AdminListPage title="커스텀 구성" breadcrumb="Chrome 브라우저" description="JSON 기반 맞춤 정책을 관리합니다." columns={['이름','적용 대상','수정일','상태']} rows={[['학교 기본 정책','연습학교','2026-03-01','초안']]} actionLabel="구성 만들기" onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='토큰') return <AdminListPage title="토큰" breadcrumb="Chrome 브라우저" description="브라우저 등록 토큰을 발급·관리합니다." columns={['토큰 이름','생성일','만료','사용']} rows={[['연습-등록-토큰','2026-01-12','—','0']]} actionLabel="토큰 만들기" onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='커넥터') return <AdminListPage title="커넥터" breadcrumb="Chrome 브라우저" description="보안·보고 커넥터를 연결합니다." columns={['커넥터','상태','마지막 동기화','설명']} rows={[['Chrome Enterprise 커넥터','사용 안 함','—','데이터 손실 방지']]} actionLabel="커넥터 추가" onAction={onAction} onHome={onHome}/>;
  if(section.id==='chrome' && activeLink==='보고서') return <AdminListPage title="보고서" breadcrumb="Chrome 브라우저" description="브라우저 버전·확장 프로그램·정책을 보고합니다." columns={['보고서','기간','상태','작업']} rows={[['버전 보고서','지난 7일','준비됨','보기'],['확장 프로그램 보고서','지난 30일','준비됨','보기']]} actionLabel="보고서 새로고침" onAction={onAction} onHome={onHome}/>;
  if(section.id==='devices' && (activeLink==='Chrome' || activeLink==='설정')) return <SettingsView section={section} activeLink={activeLink} setActiveLink={setActiveLink} onAction={onAction} onHome={onHome}/>;
  if(section.id==='apps') return <AppsSectionView activeLink={activeLink} setActiveLink={setActiveLink} onAction={onAction} onHome={onHome}/>;
  if(section.id==='ai') return <GenerativeAiView activeLink={activeLink} setActiveLink={setActiveLink} onAction={onAction} onHome={onHome}/>;
  return <AdminListPage title={activeLink} breadcrumb={section.title} description={section.subtitle} columns={['이름','상태','적용','비고']} rows={section.links.map((l,i)=>[l, i%2?'사용 중':'준비됨', '연습학교', '예시'])} actionLabel="항목 추가" onAction={onAction} onHome={onHome}/>;
}

function OrgUnitsView({orgs,onModal,onAction,onHome}:{orgs:Org[];onModal:(v:'org'|'user'|'group')=>void;onAction:(v:string)=>void;onHome:()=>void}){
  const root = orgs.find(o=>!o.parent) || orgs[0];
  const children = orgs.filter(o=>o.parent===(root?.name||'연습학교'));
  return <div className="section-page wide admin-page">
    <div className="page-crumb">조직 단위</div>
    <div className="ou-toolbar"><strong>조직 단위 관리 | 조직 단위 {orgs.length} 표시</strong><button className="link-btn" onClick={()=>onModal('org')}>조직 단위 만들기</button></div>
    <label className="ou-search"><Search size={18}/><input placeholder="조직 단위 검색"/></label>
    <div className="ou-table-wrap"><table className="admin-table"><thead><tr><th>이름</th><th>설명</th></tr></thead><tbody>
      <tr className="ou-root"><td><ChevronDown size={16}/><b>{root?.name||'연습학교'}</b></td><td>{root?.description||'연습학교'}</td></tr>
      {children.map(o=><tr key={o.id}><td className="ou-child">{(o.name.includes('학생')||o.name.includes('태블릿')||o.name.includes('크롬북'))?<ChevronRight size={14}/>:<span className="ou-spacer"/>}{o.name}</td><td>{o.description||'-'}</td></tr>)}
    </tbody></table></div>
  </div>;
}

function TargetAudiencesView({groups,onAction,onHome}:{groups:PracticeGroup[];onAction:(v:string)=>void;onHome:()=>void}){
  const rows = [
    {name:'연습학교', members:1372, desc:'Default audience with all users in your organization (updated automatically)'},
    {name:'연습 교사그룹', members:1, desc:''},
  ];
  return <div className="section-page wide admin-page">
    <div className="page-crumb">공유 대상 그룹</div>
    <div className="page-title-row"><div><h1>공유 대상 그룹 <CircleHelp size={18}/></h1><p>모든 공유 대상 그룹 표시</p></div><button className="primary-button" onClick={()=>onAction('대상 만들기')}>대상 만들기</button></div>
    <div className="data-panel flat"><table className="admin-table"><thead><tr><th></th><th>이름</th><th>회원</th><th>설명</th><th></th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.name}><td><input type="checkbox"/></td><td><b className="blue-text">{r.name}</b></td><td>{r.members}</td><td>{r.desc||'—'}</td><td>{r.name==='연습 교사그룹'?<button className="link-btn" onClick={()=>onAction('작업')}>작업 <ChevronDown size={14}/></button>:null}</td></tr>)}</tbody>
    </table></div>
  </div>;
}

function DirectorySettingsView({onAction,onHome}:{onAction:(v:string)=>void;onHome:()=>void}){
  const cards=[
    {title:'공유 설정', desc:'사용자가 조직 외부에서 연락처를 공유할 수 있는 방법을 결정합니다.', fields:[['연락처 공유',"사용 설정됨: '연락처 공유 사용 설정'"],['외부 디렉터리 공유','조직 데이터 및 인증된 사용자 기본 프로필 필드']]},
    {title:'프로필 수정', desc:'사용자가 자신의 프로필을 수정할 수 있는지를 결정합니다.', fields:[]},
    {title:'공개 상태 설정', desc:'조직 단위에 공개할 사용자를 결정합니다.', fields:[]},
    {title:'Workspace 리소스 유형 공개 상태', desc:'디렉터리에 표시할 Workspace 리소스 유형을 선택하세요.', fields:[['공개 상태',"사용 설정됨: 'Google 그룹스', 사용 설정됨: '도메인 공유 연락처'"]], footer:"'연습학교'에 적용됨"},
  ];
  return <div className="section-page wide admin-page">
    <div className="page-crumb">디렉터리 설정</div>
    <div className="dir-settings-layout"><div className="dir-settings-hero"><div className="section-icon"><Users size={26}/></div><h1>디렉터리 설정</h1></div>
      <div className="settings-cards">{cards.map(c=><article className="settings-card" key={c.title} onClick={()=>onAction(c.title)}><header><h2>{c.title}</h2><ChevronDown size={18}/></header><p>{c.desc}</p>{c.fields.length>0&&<div className="settings-card-grid">{c.fields.map(([k,v])=><div key={k}><strong>{k}</strong><span>{v}</span></div>)}</div>}{c.footer&&<small className="applied-ou">{c.footer}</small>}</article>)}</div>
    </div>
  </div>;
}

function ExternalDirectoryView({onAction,onHome}:{onAction:(v:string)=>void;onHome:()=>void}){
  return <div className="section-page wide admin-page">
    <div className="page-crumb">외부 디렉터리</div>
    <h1>외부 디렉터리 관리</h1>
    <p className="page-desc">환경 전반에서 인력을 동기화하는 방법을 선택하세요. 디렉터리 동기화, 인바운드 SCIM 또는 둘 다를 사용하세요. <button className="link-btn" onClick={()=>onAction('자세히')}>자세히 알아보기</button></p>
    <div className="ext-dir-cards">
      <article className="ext-card" onClick={()=>onAction('디렉터리 동기화')}><div className="ext-illu sync"/><h2>디렉터리 동기화 <em className="badge-beta">베타</em></h2><ul><li>Microsoft Graph API를 사용해 디렉터리를 동기화합니다.</li><li>Google이 디렉터리의 데이터를 가져옵니다.</li><li>Azure AD 및 온프레미스 AD와 호환됩니다.</li></ul></article>
      <article className="ext-card" onClick={()=>onAction('인바운드 SCIM')}><div className="ext-illu scim"/><h2>인바운드 SCIM <em className="badge-new">새 옵션</em></h2><ul><li>환경 전반에서 실시간 업데이트됩니다.</li><li>외부 디렉터리에서 Google로 데이터를 푸시합니다.</li><li>SCIM 2.0 표준을 준수하는 모든 ID 공급업체(IdP)와 호환됩니다.</li></ul></article>
    </div>
  </div>;
}

function UsersListView({users,orgs,onModal,onDeleteUser,onAction,onHome}:{users:PracticeUser[];orgs:Org[];onModal:(v:'org'|'user'|'group')=>void;onDeleteUser:(id:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  return <div className="section-page wide admin-page">
    <div className="page-crumb">사용자</div>
    <div className="page-title-row"><div><h1>사용자</h1><p>연습학교의 사용자 계정을 관리합니다.</p></div><button className="primary-button" onClick={()=>onModal('user')}><Plus size={16}/> 새 사용자 추가</button></div>
    <div className="directory-layout"><OuPicker selected="연습학교"/><section className="data-panel"><div className="action-strip"><strong>사용자 | 모든 사용자 표시</strong><button onClick={()=>onModal('user')}>새 사용자 추가</button><button onClick={()=>onAction('다운로드')}>다운로드</button></div>
      <div className="filter-strip"><button><Plus size={17}/> 필터 추가</button></div>
      <div className="table-wrap detailed"><table><thead><tr><th></th><th>이름</th><th>이메일</th><th>조직 단위</th><th>상태</th><th></th></tr></thead>
        <tbody>{users.map(u=><tr key={u.id}><td><input type="checkbox"/></td><td><span className="avatar-dot">{u.lastName.slice(0,1)}</span><b className="blue-text">{u.lastName}{u.firstName}</b></td><td>{u.email}</td><td>{u.org}</td><td>{u.status}</td><td><button className="delete-button" onClick={()=>onDeleteUser(u.id)}>삭제</button></td></tr>)}</tbody>
      </table></div></section></div>
  </div>;
}

function GroupsListView({groups,users,onModal,onDeleteGroup,onAction,onHome}:{groups:PracticeGroup[];users:PracticeUser[];onModal:(v:'org'|'user'|'group')=>void;onDeleteGroup:(id:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  const list = groups.filter(g=>g.id!=='g-all'&&g.id!=='g-teachers').concat(groups.filter(g=>g.id==='g-all'||g.id==='g-teachers'));
  return <div className="section-page wide admin-page">
    <div className="page-crumb">그룹</div>
    <div className="page-title-row"><div><h1>그룹</h1><p>메일링 리스트와 협업 그룹을 관리합니다.</p></div><button className="primary-button" onClick={()=>onModal('group')}><Plus size={16}/> 그룹 만들기</button></div>
    <div className="data-panel flat"><div className="action-strip"><strong>그룹 | {groups.length}개 표시</strong><button onClick={()=>onModal('group')}>그룹 만들기</button></div>
      <table className="admin-table"><thead><tr><th>이름</th><th>이메일</th><th>구성원</th><th>설명</th><th></th></tr></thead>
        <tbody>{groups.map(g=><tr key={g.id}><td><b className="blue-text">{g.name}</b></td><td>{g.email}</td><td>{g.members.length}</td><td>{g.description||'—'}</td><td><button className="delete-button" onClick={()=>onDeleteGroup(g.id)}>삭제</button></td></tr>)}</tbody>
      </table></div>
  </div>;
}

function OuPicker({selected}:{selected:string}){
  return <aside className="org-tree compact"><div className="ou-picker-tabs"><button>브라우저</button><button>사용자</button><button>그룹</button><button className="active">조직 단위</button></div>
    <label className="ou-search tight"><Search size={16}/><input placeholder="조직 단위 검색"/></label>
    <button className="tree-root selected"><ChevronDown size={16}/> 연습학교</button>
    {['1.관리자','2.교원','3.학생','4.태블릿기기','5.크롬북(삭제금지)'].map(n=><button className={`tree-child ${n===selected?'selected':''}`} key={n}>{n}</button>)}
  </aside>;
}

function ChromeOverviewView({onAction,onHome,onOpenLink}:{onAction:(v:string)=>void;onHome:()=>void;onOpenLink:(l:string)=>void}){
  return <div className="section-page wide admin-page chrome-overview">
    <div className="page-crumb">Chrome 브라우저 &gt; 개요</div>
    <article className="reco-card">
      <header><h2>권장사항 <Info size={16}/></h2><span>작업 5개 중 0개 완료</span></header>
      <div className="ai-note-box"><div className="ai-note-head"><Sparkles size={16}/><strong>AI가 합성한 Chrome 154 출시 노트 내용 검토</strong><em>Gemini로 생성됨</em></div>
        <div className="ai-filters">{['정책','확장 프로그램','최종 사용자 생산성','관리','보안'].map((t,i)=><button key={t} className={i===0?'active':''}>{i===0?'✓ ':''}{t}</button>)}</div>
        <div className="ai-items"><div><strong>자동 완성 데이터 관리</strong><p>AutofillSettings policy in Chrome 154</p><button className="link-btn" onClick={()=>onAction('JSON')}>JSON으로 구성</button></div>
          <div><strong>개발자 도구 제어</strong><p>DeveloperToolsAvailability policy for Android in Chrome 154</p><button className="link-btn" onClick={()=>onOpenLink('설정')}>설정 업데이트</button></div></div>
      </div>
      <ul className="reco-list">
        <li><div><strong>최근에 추가된 설정 구성하기</strong><small>사용자 및 브라우저에 대한 새로운 설정을 검토합니다.</small></div><button className="link-btn" onClick={()=>onOpenLink('설정')}>구성</button></li>
        <li><div><strong>클라우드 보고서 사용 설정하기</strong><small>기기에 대한 보고를 사용 설정하고 24시간 내에 결과를 확인합니다.</small></div><button className="link-btn" onClick={()=>onAction('사용 설정')}>사용 설정</button></li>
        <li><div><strong>민감한 파일 전송 모니터링</strong><small>내부자 위험 및 잠재적인 데이터 손실로부터 보호</small></div><button className="link-btn" onClick={()=>onAction('사용 설정')}>사용 설정</button></li>
        <li><div><strong>iOS에서 사용자 관리 사용 설정</strong><small>iPhone, iPad 등 더 많은 기기에서 업무 데이터를 보호하세요</small></div><button className="link-btn" onClick={()=>onAction('사용 설정')}>사용 설정</button></li>
      </ul>
    </article>
    <div className="chrome-widgets"><article><h3>관리 브라우저</h3><div className="stat-row"><span>활성<br/><b>0</b></span><span>활동 안함<br/><b>0</b></span><span>새로운 기능<br/><b>0</b></span></div></article>
      <article><h3>관리 프로필</h3><div className="stat-row"><span>활성<br/><b>0</b></span><span>활동 안함<br/><b>0</b></span><span>새로운 기능<br/><b>0</b></span></div></article></div>
  </div>;
}

function ChromeSetupGuideView({onAction,onHome}:{onAction:(v:string)=>void;onHome:()=>void}){
  const [tab,setTab]=useState('ChromeOS');
  const steps=['조직 설정하기','기기 제품군 등록하기','사용자 및 기기 정책 설정하기','앱 및 확장 프로그램 구성','보고서 분석하기'];
  return <div className="section-page wide admin-page">
    <div className="page-crumb">Chrome 브라우저 &gt; 설정 가이드</div>
    <h1>Chrome 관리에 오신 것을 환영합니다</h1>
    <div className="setup-tabs"><button className={tab==='ChromeOS'?'active':''} onClick={()=>setTab('ChromeOS')}><Laptop size={16}/> ChromeOS</button><button className={tab==='Chrome 브라우저'?'active':''} onClick={()=>setTab('Chrome 브라우저')}><Globe2 size={16}/> Chrome 브라우저</button></div>
    <h3 className="setup-section">기본사항으로 시작하기</h3>
    <article className="tour-card"><div><h2>ChromeOS 관리 소개</h2><p>대화형 둘러보기를 사용하여 테스트 기기를 등록하고 몇 가지 정책을 설정하는 등의 작업을 합니다. ChromeOS 관리를 살펴보고 테스트할 수 있는 안전한 공간입니다.</p><button className="link-btn">작업 8개 <ChevronDown size={14}/></button><div><button className="primary-button" onClick={()=>onAction('둘러보기')}>둘러보기 시작</button></div></div><div className="tour-art"/></article>
    <h3 className="setup-section">전체 설정 및 배포 시작하기</h3>
    <p className="page-desc">준비가 완료되면 다음 단계에 따라 배포하세요.</p>
    <div className="setup-accordion">{steps.map(s=><button key={s} onClick={()=>onAction(s)}>{s}<ChevronRight size={18}/></button>)}</div>
  </div>;
}

function ChromeAppsView({onAction,onHome}:{onAction:(v:string)=>void;onHome:()=>void}){
  const [tab,setTab]=useState('사용자 및 브라우저');
  const [editing,setEditing]=useState<string|null>(null);
  const [saved,setSaved]=useState<Record<string,string>>({});
  const [selectedOu,setSelectedOu]=useState('연습학교');
  useEffect(()=>{try{const value=localStorage.getItem('admin-settings:chrome-apps-ext');if(value)setSaved(JSON.parse(value)); else setSaved({})}catch{setSaved({})}},[]);
  const savePolicy=(name:string,value:string)=>{const next={...saved,[name]:value};setSaved(next);localStorage.setItem('admin-settings:chrome-apps-ext',JSON.stringify(next));setEditing(null);onAction(`${name} 저장`)};
  const categories = chromeAppsExtensionSettingsCategories;
  const editingPolicy = editing ? categories.flatMap(c=>c.items).find(p=>p.name===editing) : undefined;
  const editingCurrent = editing ? (saved[editing] ?? (editingPolicy?.value || editingPolicy?.inheritance || 'Google 기본값')) : undefined;
  const editingOptions = editingPolicy?.options?.length ? editingPolicy.options : ['Google 기본값 사용', `${editing || '정책'} 사용 설정`, `${editing || '정책'} 사용 중지`];

  return <div className="section-page wide admin-page apps-ext-page">
    <div className="page-crumb">Chrome 브라우저 &gt; 앱 및 확장 프로그램</div>
    <h1>앱 및 확장 프로그램</h1>
    <div className="apps-layout"><OuPicker selected={selectedOu}/>
      <section className="data-panel apps-panel">
        <div className="apps-tabs">{['개요','사용자 및 브라우저','설정','요청'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
        {tab==='설정' ? (
          <div className="chrome-ext-settings">
            <div className="settings-tools"><span>표시: 지원됨 · {selectedOu}에 적용</span><button onClick={()=>onAction('필터')}><Plus size={18}/> 필터 검색 또는 추가</button></div>
            <div className="settings-table">
              <div className="settings-row header"><b>설정</b><b>구성</b><b>상속</b><b>지원 플랫폼</b></div>
              {categories.map(category=>(
                <div className="settings-category" key={category.title}>
                  <div className="settings-row category-header" role="presentation"><b>{category.title}</b><span/><span/><span/></div>
                  {category.items.map(policy=>{
                    const value = saved[policy.name] ?? (policy.value || (policy.inheritance === '로컬 단위로 적용됨' ? '로컬로 구성됨' : 'Google 기본값'));
                    const inheritance = saved[policy.name] ? '로컬 단위로 적용됨' : policy.inheritance;
                    return <button className="settings-row" key={policy.name} onClick={()=>setEditing(policy.name)}><span>{policy.name}</span><span className={saved[policy.name]||policy.inheritance==='로컬 단위로 적용됨'?'saved-value':''}>{value}</span><span>{inheritance}</span><span className="platforms">▣ ◉ ▲</span></button>;
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="apps-banner"><strong>Chrome 웹 스토어</strong><span>관리자가 차단하지 않은 모든 앱 설치 허용</span></div>
            <div className="filter-strip"><button><Plus size={17}/> 필터 검색 또는 추가</button></div>
            <div className="table-wrap"><table className="admin-table"><thead><tr><th>이름</th><th>설치 정책</th><th>고정 승인 버전</th></tr></thead>
              <tbody>{SAMPLE_APPS.map(a=><tr key={a.name}><td><b>{a.name}</b><small className="muted-id">{a.id}</small></td><td>{a.policy}</td><td>{a.pinned==='warn'?<AlertTriangle size={14} className="warn-icon"/>:a.pinned||'—'}</td></tr>)}</tbody>
            </table></div>
            <div className="table-footer"><span>페이지당 행 수: 10</span><span>2페이지 중 1</span></div>
            <button className="fab-yellow" onClick={()=>onAction('앱 추가')} aria-label="추가"><Plus/></button>
          </>
        )}
      </section>
    </div>
    {editing&&<PolicyEditor name={editing} section="앱 및 확장 프로그램 설정" current={editingCurrent} options={editingOptions} onClose={()=>setEditing(null)} onSave={value=>savePolicy(editing,value)}/>}
  </div>;
}

function GenerativeAiView({activeLink,setActiveLink,onAction,onHome}:{activeLink:string;setActiveLink:(v:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  const reportMode = activeLink==='조직 수준 사용량' || activeLink==='사용자 수준 사용량' || activeLink==='Gemini 보고서';
  if(activeLink==='Gemini 앱') return <GeminiAppView onAction={onAction}/>;
  if(activeLink==='Gemini Enterprise') return <GeminiEnterpriseView onAction={onAction}/>;
  if(activeLink==='Workspace의 Gemini') return <GeminiWorkspaceView onAction={onAction}/>;
  if(activeLink==='Gemini Notebook') return <GeminiNotebookView onAction={onAction}/>;
  if(reportMode) return <GeminiReportsView activeLink={activeLink==='Gemini 보고서'?'조직 수준 사용량':activeLink} setActiveLink={setActiveLink} onAction={onAction}/>;
  return <GeminiAppView onAction={onAction}/>;
}

function GeminiAppView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page genai-page">
    <div className="page-crumb">생성형 AI &gt; Gemini 앱</div>
    <div className="genai-hero"><div className="gemini-logo"/><div><h1>Gemini 앱</h1><p className="status-on">상태 모든 사용자에 사용</p></div></div>
    <div className="privacy-box"><strong>개인 정보 보호</strong><p>Gemini 앱의 채팅과 업로드된 파일은 사람 검토자에게 제공되지 않으며 생성형 AI 모델 개선에 사용되지 않습니다.</p></div>
    <article className="settings-card" onClick={()=>onAction('서비스 상태')}><header><h2>서비스 상태</h2><ChevronDown size={18}/></header><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에 사용</span></div><small className="applied-ou">&apos;연습학교&apos;에 적용됨</small></article>
    <article className="settings-card" onClick={()=>onAction('공유')}><header><div><h2>공유</h2><p>공유 설정</p></div><ChevronDown size={18}/></header>
      <div className="settings-card-grid">
        <div><strong>대화 공유</strong><span>링크를 통해 대화를 공유하도록 허용</span></div>
        <div><strong>Gem 공유</strong><span>사용 설정됨: &apos;사용자가 Gemini 앱에서 Gem을 공유하도록 허용&apos;</span></div>
      </div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
  </div>;
}

function GeminiEnterpriseView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page genai-page">
    <div className="page-crumb">생성형 AI &gt; Gemini Enterprise</div>
    <div className="genai-hero"><div className="gemini-logo"/><div><h1>Gemini Enterprise</h1><p className="status-on">상태 모든 사용자에 사용</p></div></div>
    <div className="privacy-box">
      <p><strong>추가 서비스</strong> — Gemini Enterprise는 엔터프라이즈급 데이터 보호가 적용되는 추가 서비스입니다.</p>
      <p><strong>서비스 약관</strong> — 에디션별 데이터 액세스 약관을 확인하세요.</p>
      <p><strong>개인 정보 보호 보장</strong> — Gemini Enterprise 채팅과 업로드된 파일은 사람 검토자에게 제공되지 않으며 생성형 AI 모델 개선에 사용되지 않습니다.</p>
    </div>
    <article className="settings-card" onClick={()=>onAction('서비스 상태')}><header><h2>서비스 상태</h2><span className="status-on">모든 사용자에 사용</span></header></article>
    <article className="settings-card" onClick={()=>onAction('Business')}><header><div><h2>Business 에디션</h2><p>Gemini Enterprise - Business 에디션과 Google Workspace 간의 데이터 액세스 관리</p></div><ChevronDown size={18}/></header>
      <div className="card-kv"><strong>Workspace 데이터 액세스</strong><span>사용 설정됨: &apos;Gemini Enterprise&apos;가 Google Workspace 데이터에 액세스하도록 허용</span></div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
    <article className="settings-card" onClick={()=>onAction('Standard')}><header><div><h2>Standard, Plus, Frontline 버전</h2><p>Gemini Enterprise - Standard, Plus, Frontline 버전과 Google Workspace 간의 데이터 액세스 관리</p></div><ChevronDown size={18}/></header>
      <div className="card-kv"><strong>Workspace 데이터 액세스</strong><span>사용 설정됨: &apos;Gemini Enterprise&apos;가 Google Workspace 데이터에 액세스하도록 허용</span></div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
  </div>;
}

function GeminiWorkspaceView({onAction}:{onAction:(v:string)=>void}){
  const features=[['Calendar','사용'],['Drive 및 Docs','사용'],['Gmail','사용'],['Google Chat','사용'],['Google Meet','사용'],['Workspace Studio','사용']];
  const intel=[['Calendar','사용'],['Drive 및 Docs','사용'],['Gmail','사용'],['Google Chat','사용']];
  return <div className="section-page wide admin-page genai-page">
    <div className="page-crumb">생성형 AI &gt; Workspace의 Gemini</div>
    <h1>Workspace의 Gemini 설정</h1>
    <p className="page-desc">Workspace의 Gemini와 관련된 설정을 관리합니다. <button className="link-btn" onClick={()=>onAction('자세히')}>자세히 알아보기</button></p>
    <div className="genai-hero compact"><div className="gemini-logo"/><strong>Workspace의 Gemini</strong></div>
    <div className="privacy-box"><p>Gemini는 Workspace 데이터를 모델 학습에 사용하지 않습니다. <button className="link-btn" onClick={()=>onAction('개인정보')}>개인 정보 보호를 위한 노력 및 제어에 관해 알아보기</button></p></div>
    <article className="settings-card"><header><div><h2>기능 액세스</h2><p>Workspace 서비스 기능에 대한 액세스 관리</p></div><ChevronDown size={18}/></header>
      <div className="feature-list">{features.map(([n,v])=><div key={n}><span>{n}</span><b className="status-on">{v}</b></div>)}</div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
    <article className="settings-card"><header><div><h2>Workspace Intelligence 소스</h2><p>Workspace Intelligence가 Gemini에 컨텍스트를 제공하여 더 나은 AI 환경을 만듭니다. <button className="link-btn" onClick={()=>onAction('자세히')}>자세히 알아보기</button></p></div><ChevronDown size={18}/></header>
      <div className="feature-list">{intel.map(([n,v])=><div key={n}><span>{n}</span><b className="status-on">{v}</b></div>)}</div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
    <article className="settings-card"><header><div><h2>클래스룸의 기능 액세스</h2><p>사용자가 클래스룸의 Gemini에 액세스할 수 있는지 선택합니다.</p></div><ChevronDown size={18}/></header>
      <div className="feature-list"><div><span>클래스룸</span><b className="status-on">사용</b></div></div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
  </div>;
}

function GeminiNotebookView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page genai-page">
    <div className="page-crumb">생성형 AI &gt; Gemini Notebook</div>
    <div className="genai-hero"><div className="gemini-logo"/><div><h1>Gemini Notebook</h1><p className="status-on">상태 모든 사용자에 사용</p></div></div>
    <div className="privacy-box"><p>NotebookLM / Gemini Notebook 자료는 조직 데이터 보호 정책에 따라 관리됩니다.</p></div>
    <article className="settings-card" onClick={()=>onAction('서비스 상태')}><header><h2>서비스 상태</h2><span className="status-on">모든 사용자에 사용</span></header><small className="applied-ou">&apos;연습학교&apos;에 적용됨</small></article>
    <article className="settings-card"><header><div><h2>노트북 공유</h2><p>사용자가 노트북을 조직 내부와 공유하는 방법을 관리합니다.</p></div><ChevronDown size={18}/></header>
      <div className="card-kv"><strong>내부 공유</strong><span>연습학교 사용자와 공유 허용</span></div>
      <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>
    </article>
    <article className="settings-card"><header><div><h2>데이터 보관</h2><p>노트북 소스와 생성 콘텐츠의 보관 기간</p></div><ChevronDown size={18}/></header>
      <div className="card-kv"><strong>보관</strong><span>Workspace 기본 보관 정책 따름</span></div>
    </article>
  </div>;
}

function GeminiReportsView({activeLink,setActiveLink,onAction}:{activeLink:string;setActiveLink:(v:string)=>void;onAction:(v:string)=>void}){
  const orgRows=[['전체 프롬프트','12,480','지난 28일','+8%'],['활성 사용자','842','지난 28일','+3%'],['Gemini 앱','6,210','지난 28일','+5%'],['Workspace의 Gemini','4,980','지난 28일','+11%'],['Gemini Enterprise','1,290','지난 28일','+2%']];
  const userRows=[['김하늘','haneul@school.sen.ms.kr','2.교원','186'],['이준서','junseo@school.sen.ms.kr','3.학생','142'],['박서연','seoyeon@school.sen.ms.kr','2.교원','128'],['최민재','minjae@school.sen.ms.kr','3.학생','97'],['정도윤','doyoon@school.sen.ms.kr','1.관리자','64']];
  const isOrg = activeLink!=='사용자 수준 사용량';
  return <div className="section-page wide admin-page genai-page">
    <div className="page-crumb">생성형 AI &gt; Gemini 보고서</div>
    <div className="page-title-row"><div><h1>Gemini 보고서</h1><p>조직과 사용자 수준의 Gemini 사용량을 확인합니다.</p></div>
      <div className="report-dropdown"><button className="outline-button" onClick={()=>onAction('기간')}>지난 28일 <ChevronDown size={14}/></button></div>
    </div>
    <div className="report-subnav">
      <button className={isOrg?'active':''} onClick={()=>setActiveLink('조직 수준 사용량')}>조직 수준 사용량</button>
      <button className={!isOrg?'active':''} onClick={()=>setActiveLink('사용자 수준 사용량')}>사용자 수준 사용량</button>
    </div>
    {isOrg ? (
      <>
        <div className="report-cards">{orgRows.slice(0,3).map(([t,v,p,d])=><article key={t}><small>{p}</small><h3>{t}</h3><strong>{v}</strong><span className="delta">{d}</span></article>)}</div>
        <div className="data-panel flat"><table className="admin-table"><thead><tr><th>측정항목</th><th>값</th><th>기간</th><th>변화</th></tr></thead>
          <tbody>{orgRows.map(r=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>
      </>
    ) : (
      <div className="data-panel flat"><div className="action-strip"><strong>사용자 수준 사용량 | 상위 사용자</strong><button onClick={()=>onAction('다운로드')}>다운로드</button></div>
        <table className="admin-table"><thead><tr><th>사용자</th><th>이메일</th><th>조직 단위</th><th>프롬프트 수</th></tr></thead>
          <tbody>{userRows.map(r=><tr key={r[1]}><td><b className="blue-text">{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>
    )}
  </div>;
}

function AdminListPage({title,breadcrumb,description,columns,rows,actionLabel,onAction,onHome,emptyHint}:{title:string;breadcrumb:string;description:string;columns:string[];rows:string[][];actionLabel:string;onAction:(v:string)=>void;onHome:()=>void;emptyHint?:string}){
  return <div className="section-page wide admin-page">
    <div className="page-crumb">{breadcrumb} &gt; {title}</div>
    <div className="page-title-row"><div><h1>{title}</h1><p>{description}</p></div><button className="primary-button" onClick={()=>onAction(actionLabel)}>{actionLabel}</button></div>
    <div className="data-panel flat">{emptyHint&&rows.length<=1?<div className="empty-hint">{emptyHint}</div>:null}
      <table className="admin-table"><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{j===0?<b className="blue-text">{c}</b>:c}</td>)}</tr>)}</tbody>
      </table></div>
  </div>;
}

function SettingsView({section,activeLink,setActiveLink,onAction,onHome}:{section:Section;activeLink:string;setActiveLink:(v:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  const Icon=section.icon;
  const [tab,setTab]=useState(section.id==='devices'?'기기 설정':'사용자 및 브라우저 설정');
  const [editing,setEditing]=useState<string|null>(null);
  const [saved,setSaved]=useState<Record<string,string>>({});
  const [selectedOu,setSelectedOu]=useState('연습학교');
  const isChromeCatalog = (section.id==='chrome' && activeLink==='설정')
    || (section.id==='devices' && (activeLink==='Chrome' || activeLink==='설정'));
  const storageKey = `chrome:${tab}`;
  useEffect(()=>{try{const value=localStorage.getItem(`admin-settings:${storageKey}`);if(value)setSaved(JSON.parse(value)); else setSaved({})}catch{setSaved({})}},[storageKey]);
  const savePolicy=(name:string,value:string)=>{const next={...saved,[name]:value};setSaved(next);localStorage.setItem(`admin-settings:${storageKey}`,JSON.stringify(next));setEditing(null);onAction(`${name} 저장`)};
  const chromeCategories = !isChromeCatalog ? [] : (tab==='기기 설정' ? chromeDevicePolicyCategories : (chromePoliciesByTab[tab] || []));
  const policyCount = chromeCategories.reduce((n,c)=>n+c.items.length,0);
  const editingPolicy: ChromePolicyItem | undefined = editing
    ? chromeCategories.flatMap(c=>c.items).find(p=>p.name===editing)
    : undefined;
  const editingCurrent = editing
    ? (saved[editing] ?? (editingPolicy?.value || editingPolicy?.inheritance || 'Google 기본값'))
    : undefined;
  const editingOptions = editingPolicy?.options?.length
    ? editingPolicy.options
    : ['Google 기본값 사용', `${editing || '정책'} 사용 설정`, `${editing || '정책'} 사용 중지`];
  const crumbParent = section.id==='devices' ? '기기' : 'Chrome 브라우저';

  return <div className="section-page wide admin-page settings-page">
    <div className="page-crumb">{crumbParent}{section.id==='devices'?' &gt; Chrome':''} &gt; 설정</div>
    <h1>설정</h1>
    <div className="settings-tabs top">{['사용자 및 브라우저 설정','기기 설정','관리 게스트 세션 설정'].map(name=><button key={name} className={tab===name?'active':''} onClick={()=>setTab(name)}>{name}</button>)}</div>
    <div className="chrome-settings-layout">
      <aside className="settings-ou-pane">
        <div className="ou-picker-tabs vertical"><button>기기</button><button>그룹</button><button className="active">조직 단위</button></div>
        <label className="ou-search tight"><Search size={16}/><input placeholder="조직 단위 검색"/></label>
        <button className={`tree-root ${selectedOu==='연습학교'?'selected':''}`} onClick={()=>setSelectedOu('연습학교')}><ChevronDown size={16}/> 연습학교</button>
        {['1.관리자','2.교원','3.학생','4.태블릿기기','5.크롬북(삭제금지)'].map(n=><button className={`tree-child ${selectedOu===n?'selected':''}`} key={n} onClick={()=>setSelectedOu(n)}>{n}</button>)}
      </aside>
      <section className="settings-main panel">
        <div className="settings-tools"><span>표시: 지원됨</span><button onClick={()=>onAction('필터')}><Plus size={18}/> 필터 검색 또는 추가</button><button onClick={()=>onAction('최근 변경사항')}>최근 변경사항</button></div>
        <div className="settings-title"><span className="section-icon"><Icon size={22}/></span><div><strong>{tab}</strong><small>{policyCount}개 정책 · {selectedOu}에 적용 · 항목을 눌러 변경</small></div></div>
        <div className="settings-table">
          <div className="settings-row header"><b>설정</b><b>구성</b><b>상속</b><b>지원 플랫폼</b></div>
          {tab==='관리 게스트 세션 설정' ? (
            ['게스트 세션 최대 길이','시크릿 모드','URL 차단','확장 프로그램','프린터'].map(name=>(
              <button className="settings-row" key={name} onClick={()=>setEditing(name)}><span>{name}</span><span>{saved[name]||'Google 기본값'}</span><span>{saved[name]?'로컬 단위로 적용됨':'상속됨'}</span><span className="platforms">▣</span></button>
            ))
          ) : chromeCategories.map(category => (
            <div className="settings-category" key={`${tab}:${category.title}`}>
              <div className="settings-row category-header" role="presentation"><b>{category.title}</b><span/><span/><span/></div>
              {category.items.map(policy => {
                const value = saved[policy.name] ?? (policy.value || (policy.inheritance === '로컬 단위로 적용됨' ? '로컬로 구성됨' : 'Google 기본값'));
                const inheritance = saved[policy.name] ? '로컬 단위로 적용됨' : policy.inheritance;
                return <button className="settings-row" key={`${tab}:${category.title}:${policy.name}`} onClick={()=>setEditing(policy.name)}><span>{policy.name}</span><span className={saved[policy.name]||policy.inheritance==='로컬 단위로 적용됨'?'saved-value':''}>{value}</span><span>{inheritance}</span><span className="platforms">▣ ◉ ▲</span></button>;
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
    {editing&&<PolicyEditor name={editing} section={tab} current={editingCurrent} options={editingOptions} onClose={()=>setEditing(null)} onSave={value=>savePolicy(editing,value)}/>}
  </div>;
}

function needsDetailInput(option: string) {
  if (!option) return false;
  if (option === 'Google 기본값 사용' || option === 'Google 기본값') return false;
  if (/하위 설정 \d+개/.test(option)) return true;
  if (/목록|URL|업로드|구성됨|구성$|패턴|주소|nncke|반납|Korean/.test(option) && !/허용 안함|사용 중지|사용 안함/.test(option)) return true;
  return false;
}

function PolicyEditor({name,section,current,options,onClose,onSave}:{name:string;section:string;current?:string;options:string[];onClose:()=>void;onSave:(v:string)=>void}){
  const initial = (() => {
    if (current && options.includes(current)) return current;
    if (current === 'Google 기본값' && options.includes('Google 기본값 사용')) return 'Google 기본값 사용';
    const match = options.find(o => o === current || (current && o.includes(current)));
    return match || options[0] || 'Google 기본값 사용';
  })();
  const [mode,setMode]=useState(initial);
  const [scope,setScope]=useState('연습학교');
  const [detail,setDetail]=useState('');
  const [force,setForce]=useState(false);
  const showDetail = needsDetailInput(mode);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><section className="modal policy-editor"><header><div><p className="eyebrow">{section} · 정책 편집</p><h2>{name}</h2><p>연습용 설정입니다. 실제 기기에는 적용되지 않습니다.</p></div><button className="icon-button" onClick={onClose}><X/></button></header><div className="policy-body"><fieldset className="policy-options"><legend>구성</legend>{options.map(value=><label key={value}><input type="radio" name="policy-value" checked={mode===value} onChange={()=>setMode(value)}/><span>{value}</span></label>)}</fieldset><label><span>적용 범위</span><select value={scope} onChange={e=>setScope(e.target.value)}><option>연습학교</option><option>1.관리자</option><option>2.교원</option><option>3.학생</option><option>4.태블릿기기</option><option>5.크롬북(삭제금지)</option></select></label>{showDetail && <label><span>세부 값 / URL / 텍스트 (선택)</span><textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="세부 구성 값"/></label>}<label className="switch-line"><input type="checkbox" checked={force} onChange={e=>setForce(e.target.checked)}/><span><strong>하위 조직 단위에 강제 적용</strong><small>상속 표시가 재정의로 바뀝니다.</small></span></label><div className="policy-preview"><strong>미리보기</strong><span>{mode}{showDetail&&detail?` · ${detail}`:''}{force?' · 강제':''}</span></div><div className="form-actions"><button onClick={onClose}>취소</button><button onClick={()=>onSave(showDetail&&detail?`${mode} · ${detail}`:mode)}>저장</button></div></div></section></div>;
}

function ModalShell({title,description,onClose,children}:{title:string;description:string;onClose:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><section className="modal" role="dialog" aria-modal="true"><header><div><p className="eyebrow">연습 모드</p><h2>{title}</h2><p>{description}</p></div><button className="icon-button" onClick={onClose}><X/></button></header>{children}</section></div>}
function OrgModal({orgs,onClose,onSave}:{orgs:Org[];onClose:()=>void;onSave:(v:Omit<Org,'id'>)=>void}){const [name,setName]=useState('');const [parent,setParent]=useState('연습학교');const [description,setDescription]=useState('');const submit=(e:FormEvent)=>{e.preventDefault();if(name.trim())onSave({name:name.trim(),parent,description:description.trim()||'-'})};return <ModalShell title="조직 단위 만들기" description="조직 구조를 구성합니다." onClose={onClose}><form className="practice-form" onSubmit={submit}><label><span>조직 단위 이름 *</span><input autoFocus required value={name} onChange={e=>setName(e.target.value)}/></label><label><span>상위 조직 단위</span><select value={parent} onChange={e=>setParent(e.target.value)}><option>연습학교</option>{orgs.filter(o=>o.parent).map(o=><option key={o.id}>{o.name}</option>)}</select></label><label><span>설명</span><textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><div className="form-actions"><button type="button" onClick={onClose}>취소</button><button type="submit">조직 단위 만들기</button></div></form></ModalShell>}
function UserModal({orgs,onClose,onSave}:{orgs:Org[];onClose:()=>void;onSave:(v:Omit<PracticeUser,'id'|'status'>)=>void}){const [firstName,setFirstName]=useState('');const [lastName,setLastName]=useState('');const [username,setUsername]=useState('');const [org,setOrg]=useState(orgs.find(o=>o.name==='3.학생')?.name||'연습학교');const submit=(e:FormEvent)=>{e.preventDefault();if(firstName&&lastName&&username)onSave({firstName,lastName,email:`${username.replace(/@.*/,'')}@school.sen.ms.kr`,org})};return <ModalShell title="새 사용자 계정 만들기" description="이름, 계정 주소, 조직 단위를 지정합니다." onClose={onClose}><form className="practice-form" onSubmit={submit}><div className="form-row"><label><span>성 *</span><input required value={lastName} onChange={e=>setLastName(e.target.value)}/></label><label><span>이름 *</span><input autoFocus required value={firstName} onChange={e=>setFirstName(e.target.value)}/></label></div><label><span>기본 이메일 *</span><div className="email-input"><input required pattern="[a-zA-Z0-9._-]+" value={username} onChange={e=>setUsername(e.target.value)}/><b>@school.sen.ms.kr</b></div></label><label><span>조직 단위</span><select value={org} onChange={e=>setOrg(e.target.value)}>{orgs.map(o=><option key={o.id}>{o.name}</option>)}</select></label><div className="form-actions"><button type="button" onClick={onClose}>취소</button><button type="submit">사용자 추가</button></div></form></ModalShell>}
function GroupModal({users,onClose,onSave}:{users:PracticeUser[];onClose:()=>void;onSave:(v:Omit<PracticeGroup,'id'>)=>void}){const [name,setName]=useState('');const [address,setAddress]=useState('');const [description,setDescription]=useState('');const [members,setMembers]=useState<string[]>([]);const submit=(e:FormEvent)=>{e.preventDefault();if(name&&address)onSave({name,email:`${address.replace(/@.*/,'')}@school.sen.ms.kr`,description,members})};const toggle=(id:string)=>setMembers(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);return <ModalShell title="새 그룹 만들기" description="그룹 주소와 구성원을 지정합니다." onClose={onClose}><form className="practice-form" onSubmit={submit}><label><span>그룹 이름 *</span><input autoFocus required value={name} onChange={e=>setName(e.target.value)}/></label><label><span>그룹 이메일 *</span><div className="email-input"><input required pattern="[a-zA-Z0-9._-]+" value={address} onChange={e=>setAddress(e.target.value)}/><b>@school.sen.ms.kr</b></div></label><label><span>그룹 설명</span><textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><fieldset className="member-picker"><legend>구성원 선택</legend>{users.map(user=><label key={user.id}><input type="checkbox" checked={members.includes(user.id)} onChange={()=>toggle(user.id)}/><span><strong>{user.lastName}{user.firstName}</strong><small>{user.email}</small></span></label>)}</fieldset><div className="form-actions"><button type="button" onClick={onClose}>취소</button><button type="submit">그룹 만들기</button></div></form></ModalShell>}


function AppsSectionView({activeLink,setActiveLink,onAction,onHome}:{activeLink:string;setActiveLink:(v:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  if(activeLink==='개요' || activeLink==='Google Workspace') return <AppsOverviewView onOpen={setActiveLink} onAction={onAction}/>;
  if(activeLink==='추가 Google 서비스') return <AdditionalGoogleServicesView onAction={onAction}/>;
  if(activeLink==='웹 및 모바일 앱') return <WebMobileAppsView onAction={onAction}/>;
  if(activeLink==='Google Workspace Marketplace 앱') return <MarketplaceAppsView onAction={onAction}/>;
  if(activeLink==='LDAP') return <LdapView onAction={onAction}/>;
  if(activeLink==='Calendar') return <CalendarSettingsView onAction={onAction}/>;
  if(activeLink==='Workspace Studio') return <WorkspaceStudioSettingsView onAction={onAction}/>;
  if(activeLink==='Gmail') return <GmailSettingsView onAction={onAction}/>;
  if(activeLink==='Google Meet') return <MeetSettingsView onAction={onAction}/>;
  if(activeLink==='Google Workspace LTI™') return <LtiSettingsView onAction={onAction}/>;
  if(activeLink==='Classroom') return <ClassroomSettingsView onAction={onAction}/>;
  if(activeLink==='Drive 및 Docs') return <DriveDocsSettingsView onAction={onAction}/>;
  if(activeLink==='서비스 상태') return <WorkspaceServiceStatusView onAction={onAction}/>;
  if(activeLink==='검토') return <WorkspaceReviewView onAction={onAction}/>;
  const emptyApps = ['AppSheet','Keep','Google Voice','Google Vault','Read Along','Chrome 동기화','Sites','Tasks','Groups for Business','Google Chat'] as const;
  if((emptyApps as readonly string[]).includes(activeLink)) return <WorkspaceEmptySettingsView appName={activeLink} onAction={onAction}/>;
  return <WorkspaceEmptySettingsView appName={activeLink} onAction={onAction}/>;
}

function AppsOverviewView({onOpen,onAction}:{onOpen:(v:string)=>void;onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; 개요</div>
    <div className="page-title-row"><div><h1>앱</h1><p>연습학교(school.sen.ms.kr)의 Google Workspace 및 웹 앱을 관리합니다.</p></div></div>
    <div className="apps-overview-grid">
      <article className="dashboard-card" onClick={()=>onOpen('Google Workspace')}><header><div><h2>Google Workspace</h2><p>{WORKSPACE_NESTED.length}개 서비스</p></div><button onClick={e=>{e.stopPropagation();onOpen('Calendar')}}>Calendar</button></header>
        <div className="card-links">{['Gmail','Google Meet','Classroom','Drive 및 Docs','Workspace Studio'].map(n=><button key={n} onClick={e=>{e.stopPropagation();onOpen(n)}}>{n}<ChevronRight size={15}/></button>)}</div>
      </article>
      <article className="dashboard-card" onClick={()=>onOpen('추가 Google 서비스')}><header><div><h2>추가 Google 서비스</h2><p>AI Studio, Colab 등</p></div></header><div className="card-links"><button onClick={e=>{e.stopPropagation();onOpen('추가 Google 서비스')}}>서비스 관리<ChevronRight size={15}/></button></div></article>
      <article className="dashboard-card" onClick={()=>onOpen('Google Workspace Marketplace 앱')}><header><div><h2>Marketplace 앱</h2><p>{MARKETPLACE_APPS.length}개 앱</p></div></header><div className="card-links"><button onClick={e=>{e.stopPropagation();onOpen('Google Workspace Marketplace 앱')}}>앱 목록<ChevronRight size={15}/></button></div></article>
      <article className="dashboard-card" onClick={()=>onOpen('웹 및 모바일 앱')}><header><div><h2>웹 및 모바일 앱</h2><p>SAML · OIDC</p></div></header><div className="card-links"><button onClick={()=>onAction('앱 추가')}>앱 추가<ChevronRight size={15}/></button></div></article>
    </div>
  </div>;
}

function AppliedOu(){return <small className="applied-ou">&apos;연습학교&apos;에 적용됨</small>}

function WorkspaceEmptySettingsView({appName,onAction}:{appName:string;onAction:(v:string)=>void}){
  const title = `${appName} 설정`;
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; {title}</div>
    <div className="ws-app-hero">
      <div className="ws-app-icon"><AppWindow size={28}/></div>
      <div><h1>{title}</h1><p className="status-on">상태 모든 사용자에게 사용</p></div>
    </div>
    <div className="info-banner soft"><Info size={18}/><div><strong>추가 설정은 각 서비스 관리 콘솔에서 관리할 수 있습니다.</strong><span>Gemini 등 일부 기능은 서비스별 Admin Console에서 구성합니다.</span></div><button className="link-btn" onClick={()=>onAction('서비스 상태 알아보기')}>서비스 상태 알아보기</button></div>
    <article className="settings-card" onClick={()=>onAction('서비스 상태')}><header><h2>서비스 상태</h2><ChevronDown size={18}/></header><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div><AppliedOu/></article>
    <div className="ws-empty-state"><Wrench size={40}/><strong>표시할 추가 설정 없음</strong><p>이 서비스에는 다른 설정이 없습니다.</p></div>
  </div>;
}

function AccordionCard({title,desc,children,onAction,defaultOpen=false}:{title:string;desc?:string;children?:React.ReactNode;onAction:(v:string)=>void;defaultOpen?:boolean}){
  const [open,setOpen]=useState(defaultOpen);
  return <article className={`settings-card accordion-card ${open?'open':''}`}><header onClick={()=>{setOpen(v=>!v);onAction(title)}}><div><h2>{title}</h2>{desc&&<p>{desc}</p>}</div>{open?<ChevronDown size={18}/>:<ChevronRight size={18}/>}</header>{open&&<div className="accordion-body">{children}<AppliedOu/></div>}</article>;
}

function CalendarSettingsView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Calendar 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon cal"><CalendarDays size={28}/></div><div><h1>Calendar 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    <AccordionCard title="서비스 상태" defaultOpen onAction={onAction}><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div></AccordionCard>
    <AccordionCard title="공유 설정" desc="사용자가 캘린더를 공유하는 방법을 관리합니다." onAction={onAction}>
      <div className="settings-card-grid">
        <div><strong>외부 공유 옵션</strong><span>무료/예약됨 정보만 공유 가능</span></div>
        <div><strong>내부 공유 옵션</strong><span>모든 정보 공유 가능</span></div>
        <div><strong>기본 외부 공유</span><span>공유하지 않음</span></div>
        <div><strong>외부 초대 경고</span><span>사용</span></div>
      </div>
    </AccordionCard>
    <AccordionCard title="일반 설정" desc="캘린더 기본 동작" onAction={onAction}>
      <div className="settings-card-grid">
        <div><strong>캘린더 생성</strong><span>허용</span></div>
        <div><strong>예약 일정</strong><span>사용</span></div>
        <div><strong>근무 시간</strong><span>사용자가 설정하도록 허용</span></div>
        <div><strong>자동 수락</strong><span>사용 안함</span></div>
      </div>
    </AccordionCard>
    <AccordionCard title="리소스 관리" desc="회의실 및 리소스 예약" onAction={onAction}>
      <div className="settings-card-grid">
        <div><strong>리소스 예약</strong><span>허용</span></div>
        <div><strong>리소스 자동 수락</strong><span>사용</span></div>
        <div><strong>건물 계층</strong><span>연습학교 본관</span></div>
      </div>
    </AccordionCard>
    <AccordionCard title="고급 설정" onAction={onAction}>
      <div className="settings-card-grid">
        <div><strong>Calendar Interop</strong><span>사용 안함</span></div>
        <div><strong>스마트 기능</strong><span>사용</span></div>
      </div>
    </AccordionCard>
  </div>;
}

function WorkspaceStudioSettingsView({onAction}:{onAction:(v:string)=>void}){
  const steps=[['트리거','사용'],['조건','사용'],['작업','사용'],['변수','사용'],['커넥터','사용']];
  const features=[['단계 및 기능','사용'],['공유','조직 내 공유 허용'],['웹훅','사용'],['실행 기록','보관 30일'],['관리자 승인','필요 없음']];
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Workspace Studio 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon studio"><Sparkles size={28}/></div><div><h1>Workspace Studio 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    <AccordionCard title="서비스 상태" defaultOpen onAction={onAction}><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div></AccordionCard>
    <AccordionCard title="단계 및 기능" desc="플로우 구성 요소 액세스" defaultOpen onAction={onAction}>
      <div className="feature-grid">{steps.map(([n,v])=><div key={n}><span>{n}</span><b className="status-on">{v}</b></div>)}</div>
    </AccordionCard>
    <AccordionCard title="공유 및 웹훅" onAction={onAction}>
      <div className="settings-card-grid">{features.map(([n,v])=><div key={n}><strong>{n}</strong><span>{v}</span></div>)}</div>
    </AccordionCard>
  </div>;
}

function GmailSettingsView({onAction}:{onAction:(v:string)=>void}){
  const sections=[
    ['서비스 상태','모든 사용자에게 사용'],
    ['사용자 설정','테마, 서명, 스마트 작성, 기밀 모드'],
    ['호스트','school.sen.ms.kr 메일 라우팅 호스트'],
    ['기본 라우팅','수신/발신 규칙'],
    ['이메일 인증(DKIM)','DKIM 키 관리'],
    ['스팸 격리 저장소 관리','관리자 격리함'],
    ['보안','첨부파일, 피싱, 스푸핑 보호'],
  ] as const;
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Gmail 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon gmail"><Mail size={28}/></div><div><h1>Gmail 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    {sections.map(([title,desc],i)=>
      <AccordionCard key={title} title={title} desc={desc} defaultOpen={i===0} onAction={onAction}>
        {title==='서비스 상태' && <div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div>}
        {title==='사용자 설정' && <div className="settings-card-grid"><div><strong>스마트 작성</strong><span>사용</span></div><div><strong>기밀 모드</strong><span>사용</span></div><div><strong>자동 읽음 확인</strong><span>사용 안함</span></div><div><strong>외부 수신 경고</strong><span>사용</span></div></div>}
        {title==='호스트' && <div className="card-kv"><strong>호스트 이름</strong><span>mail.school.sen.ms.kr</span></div>}
        {title==='기본 라우팅' && <div className="card-kv"><strong>규칙</strong><span>기본 경로 · 연습학교</span></div>}
        {title==='이메일 인증(DKIM)' && <div className="card-kv"><strong>DKIM</strong><span>인증됨 · school.sen.ms.kr</span></div>}
        {title==='스팸 격리 저장소 관리' && <div className="card-kv"><strong>격리함</strong><span>관리자 검토 · 14일 보관</span></div>}
        {title==='보안' && <div className="settings-card-grid"><div><strong>첨부파일 보안</strong><span>강화됨</span></div><div><strong>스푸핑 보호</strong><span>사용</span></div><div><strong>향상된 피싱 및 멀웨어 보호</strong><span>사용</span></div></div>}
      </AccordionCard>
    )}
  </div>;
}

function MeetSettingsView({onAction}:{onAction:(v:string)=>void}){
  const rows:[string,string,boolean?][]=[
    ['반응','사용',false],
    ['녹화','사용 [P]',true],
    ['스트림','조직 내 사용 / YouTube 사용 안함 [P]',true],
    ['시각 효과','배경 사용 / 특수 효과 사용 안함',false],
    ['자동 스크립트','사용 안함',false],
    ['추가 부가기능','사용 안함',false],
    ['오디오','전화 참가 사용 / 유료 통화 사용 안함',false],
    ['기본 동영상 녹화 화질','최고 [P]',true],
    ['기본 동영상 화질','자동',false],
    ['통합','사용',false],
    ['통화 생성','사용',false],
    ['타일 페어링','사용',false],
    ['클라이언트 로그 업로드','사용',false],
    ['자동 녹화','사용 안함 [P]',true],
    ['게이트웨이 상호 운용성','사용 안함',false],
    ['회의 스크립트','사용 [P]',true],
    ['참석 보고','사용 [P]',true],
  ];
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Google Meet 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon meet"><Video size={28}/></div><div><h1>Google Meet 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    <AccordionCard title="서비스 상태" defaultOpen onAction={onAction}><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div></AccordionCard>
    <AccordionCard title="Meet 동영상 설정" desc="회의 기능 및 품질 옵션" defaultOpen onAction={onAction}>
      <div className="meet-feature-grid">{rows.map(([n,v,p])=><div key={n} className="meet-feature"><div><strong>{n}{p?<em className="badge-p">P</em>:null}</strong><span>{v}</span></div><b className={v.includes('사용 안함')&&!v.includes('조직')?'status-off':'status-on'}>{v.includes('사용 안함')&&!v.includes('/')?'OFF':'ON'}</b></div>)}</div>
    </AccordionCard>
  </div>;
}

function LtiSettingsView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Google Workspace LTI™ 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon"><AppWindow size={28}/></div><div><h1>Google Workspace LTI™ 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    <AccordionCard title="서비스 상태" defaultOpen onAction={onAction}><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div></AccordionCard>
    <AccordionCard title="수업 설정" desc="LTI memberships" defaultOpen onAction={onAction}>
      <div className="settings-card-grid">
        <div><strong>멤버십 동기화</strong><span>사용</span></div>
        <div><strong>역할 매핑</strong><span>교사 · 학생</span></div>
        <div><strong>수업 생성</strong><span>교원 OU 허용</span></div>
      </div>
    </AccordionCard>
    <AccordionCard title="원본성 보고서" onAction={onAction}>
      <div className="card-kv"><strong>교내 일치</strong><span className="status-off">사용 중지</span></div>
    </AccordionCard>
  </div>;
}

function ClassroomSettingsView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Classroom 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon"><AppWindow size={28}/></div><div><h1>Classroom 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    <AccordionCard title="서비스 상태" defaultOpen onAction={onAction}><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div></AccordionCard>
    <AccordionCard title="일반 설정" onAction={onAction}><div className="settings-card-grid"><div><strong>수업 만들기</strong><span>교원만 허용</span></div><div><strong>수업 등록</strong><span>도메인 사용자</span></div><div><strong>가디언 요약</strong><span>사용</span></div></div></AccordionCard>
    <AccordionCard title="수업 참여 설정" onAction={onAction}><div className="settings-card-grid"><div><strong>외부 교사 초대</strong><span>허용 안함</span></div><div><strong>수업 코드</strong><span>사용</span></div></div></AccordionCard>
    <AccordionCard title="원본성 보고서" onAction={onAction}><div className="card-kv"><strong>교내 일치</strong><span>사용 안함</span></div></AccordionCard>
  </div>;
}

function DriveDocsSettingsView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page workspace-app-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; Drive 및 Docs 설정</div>
    <div className="ws-app-hero"><div className="ws-app-icon"><Cloud size={28}/></div><div><h1>Drive 및 Docs 설정</h1><p className="status-on">상태 모든 사용자에게 사용</p></div></div>
    <AccordionCard title="서비스 상태" defaultOpen onAction={onAction}><div className="card-kv"><strong>상태</strong><span className="status-on">모든 사용자에게 사용</span></div></AccordionCard>
    <AccordionCard title="공유 설정" onAction={onAction}><div className="settings-card-grid"><div><strong>외부 공유</strong><span>허용(경고 표시)</span></div><div><strong>링크 공유 기본값</strong><span>제한됨 · 연습학교</span></div><div><strong>방문 사용자 액세스</strong><span>사용 안함</span></div></div></AccordionCard>
    <AccordionCard title="기능 및 애플리케이션" onAction={onAction}><div className="settings-card-grid"><div><strong>오프라인</strong><span>사용</span></div><div><strong>Drive for desktop</strong><span>사용</span></div><div><strong>스마트 칩</strong><span>사용</span></div></div></AccordionCard>
    <AccordionCard title="데이터 액세스" onAction={onAction}><div className="card-kv"><strong>Drive SDK</strong><span>신뢰할 수 있는 앱만</span></div></AccordionCard>
  </div>;
}

function WorkspaceServiceStatusView({onAction}:{onAction:(v:string)=>void}){
  const rows = WORKSPACE_NESTED.filter(n=>n!=='서비스 상태'&&n!=='검토').map(n=>[n,'모든 사용자에게 사용']);
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; 서비스 상태</div>
    <h1>서비스 상태</h1>
    <p className="page-desc">연습학교 Google Workspace 서비스 상태를 확인합니다.</p>
    <div className="data-panel flat"><table className="admin-table"><thead><tr><th>서비스</th><th>상태</th><th>적용</th></tr></thead>
      <tbody>{rows.map(([n,s])=><tr key={n}><td><b className="blue-text">{n}</b></td><td className="status-on">{s}</td><td>연습학교</td></tr>)}</tbody></table></div>
  </div>;
}

function WorkspaceReviewView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; Google Workspace &gt; 검토</div>
    <h1>검토</h1>
    <p className="page-desc">추가 검토가 필요한 Workspace 설정을 확인합니다.</p>
    <div className="info-banner soft"><AlertTriangle size={18}/><div><strong>확인 필요 항목 2개</strong><span>추가 Google 서비스와 Marketplace 배포 상태를 검토하세요.</span></div><button className="link-btn" onClick={()=>onAction('검토 시작')}>검토</button></div>
    <div className="data-panel flat"><table className="admin-table"><thead><tr><th>항목</th><th>유형</th><th>상태</th></tr></thead>
      <tbody>
        <tr><td><b>AI Studio</b></td><td>추가 Google 서비스</td><td><em className="badge-need">확인 필요</em></td></tr>
        <tr><td><b>Colab</b></td><td>추가 Google 서비스</td><td><em className="badge-need">확인 필요</em></td></tr>
      </tbody></table></div>
  </div>;
}

function AdditionalGoogleServicesView({onAction}:{onAction:(v:string)=>void}){
  const [selectedOu,setSelectedOu]=useState('연습학교');
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; 추가 Google 서비스</div>
    <div className="page-title-row"><div><h1>추가 Google 서비스</h1><p>연습학교 OU별로 추가 Google 서비스 사용 여부를 관리합니다.</p></div>
      <button className="primary-button" onClick={()=>onAction('서비스 추가')}>서비스 추가</button></div>
    <div className="apps-layout">
      <aside className="org-tree compact"><div className="ou-picker-tabs"><button className="active">조직 단위</button></div>
        <label className="ou-search tight"><Search size={16}/><input placeholder="조직 단위 검색"/></label>
        <button className={`tree-root ${selectedOu==='연습학교'?'selected':''}`} onClick={()=>setSelectedOu('연습학교')}><ChevronDown size={16}/> 연습학교</button>
        {['1.관리자','2.교원','3.학생','4.태블릿기기','5.크롬북(삭제금지)'].map(n=><button className={`tree-child ${selectedOu===n?'selected':''}`} key={n} onClick={()=>setSelectedOu(n)}>{n}</button>)}
      </aside>
      <section className="data-panel apps-panel">
        <div className="action-strip"><strong>서비스 | {EXTRA_GOOGLE_SERVICES.length}개 · {selectedOu}</strong><button onClick={()=>onAction('서비스 추가')}>서비스 추가</button></div>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>서비스</th><th>상태</th><th>검토</th><th></th></tr></thead>
          <tbody>{EXTRA_GOOGLE_SERVICES.map(s=><tr key={s.name}><td><b className="blue-text">{s.name}</b></td><td className={s.status==='사용'?'status-on':'status-off'}>{s.status}</td><td>{s.needConfirm?<em className="badge-need">확인 필요</em>:'—'}</td><td><button className="link-btn" onClick={()=>onAction(s.name)}>세부정보</button></td></tr>)}</tbody>
        </table></div>
      </section>
    </div>
  </div>;
}

function MarketplaceAppsView({onAction}:{onAction:(v:string)=>void}){
  const [selectedOu,setSelectedOu]=useState('연습학교');
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; Google Workspace Marketplace 앱 &gt; 앱 목록</div>
    <div className="page-title-row"><div><h1>Google Workspace Marketplace 앱</h1><p>Marketplace 앱 배포와 허용 목록을 관리합니다.</p></div>
      <div className="btn-row"><button className="outline-button" onClick={()=>onAction('앱 설치')}>앱 설치</button><button className="outline-button" onClick={()=>onAction('허용 목록')}>허용 목록</button><button className="primary-button" onClick={()=>onAction('사용자 설치 설정')}>사용자 설치 설정</button></div></div>
    <div className="apps-layout">
      <aside className="org-tree compact"><div className="ou-picker-tabs"><button className="active">조직 단위</button></div>
        <label className="ou-search tight"><Search size={16}/><input placeholder="조직 단위 검색"/></label>
        <button className={`tree-root ${selectedOu==='연습학교'?'selected':''}`} onClick={()=>setSelectedOu('연습학교')}><ChevronDown size={16}/> 연습학교</button>
        {['1.관리자','2.교원','3.학생','4.태블릿기기','5.크롬북(삭제금지)'].map(n=><button className={`tree-child ${selectedOu===n?'selected':''}`} key={n} onClick={()=>setSelectedOu(n)}>{n}</button>)}
      </aside>
      <section className="data-panel apps-panel">
        <div className="action-strip"><strong>앱 목록 | {MARKETPLACE_APPS.length}개 · {selectedOu}</strong></div>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>앱</th><th>게시자</th><th>배포</th><th>사용자</th><th></th></tr></thead>
          <tbody>{MARKETPLACE_APPS.map(a=><tr key={a.name}><td><b className="blue-text">{a.name}</b></td><td>{a.publisher}</td><td>{a.status}</td><td>{a.users}</td><td><button className="link-btn" onClick={()=>onAction(`${a.name} 배포`)}>배포</button> <button className="link-btn" onClick={()=>onAction(`${a.name} 세부정보`)}>세부정보</button></td></tr>)}</tbody>
        </table></div>
      </section>
    </div>
  </div>;
}

function WebMobileAppsView({onAction}:{onAction:(v:string)=>void}){
  const rows=[['연습학교 LMS','SAML','사용','전체'],['도서관 검색','OIDC','사용','교원·학생'],['학부모 알림','SAML','사용 안함','—']];
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; 웹 및 모바일 앱</div>
    <div className="page-title-row"><div><h1>웹 및 모바일 앱</h1><p>SAML/OIDC 웹 앱을 관리합니다.</p></div><button className="primary-button" onClick={()=>onAction('앱 추가')}>앱 추가</button></div>
    <div className="data-panel flat"><table className="admin-table"><thead><tr><th>앱</th><th>유형</th><th>상태</th><th>사용자</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r[0]}><td><b className="blue-text">{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>
  </div>;
}

function LdapView({onAction}:{onAction:(v:string)=>void}){
  return <div className="section-page wide admin-page apps-section-page">
    <div className="page-crumb">앱 &gt; LDAP</div>
    <div className="page-title-row"><div><h1>LDAP</h1><p>Secure LDAP 클라이언트를 관리합니다.</p></div><button className="primary-button" onClick={()=>onAction('LDAP 클라이언트 추가')}>클라이언트 추가</button></div>
    <div className="data-panel flat"><table className="admin-table"><thead><tr><th>클라이언트</th><th>상태</th><th>인증서</th><th>적용</th></tr></thead>
      <tbody><tr><td><b className="blue-text">연습학교 LDAP</b></td><td className="status-on">사용</td><td>유효</td><td>연습학교</td></tr></tbody></table></div>
  </div>;
}

function SearchResults({sections,onOpen}:{sections:Section[];onOpen:(id:string,link?:string)=>void}){return <div className="search-results"><p className="eyebrow">통합 검색</p><h1>검색 결과</h1><p>{sections.length}개의 메뉴를 찾았습니다.</p><div>{sections.map(s=>{const Icon=s.icon;return <button key={s.id} onClick={()=>onOpen(s.id,s.links[0])}><span className="section-icon"><Icon size={21}/></span><span><strong>{s.title}</strong><small>{s.subtitle}</small></span><ChevronRight/></button>})}</div>{!sections.length&&<div className="empty-state"><Search/><strong>일치하는 메뉴가 없습니다</strong></div>}</div>}
function Footer(){return <footer className="site-footer"><span>Admin · 교육용 시뮬레이터</span><span>Google Certified Trainer &amp; Innovator Sujin Lee</span><a href="mailto:gajungssamzzang@gmail.com">문의: gajungssamzzang@gmail.com</a><small>비공식 교육용 · Google LLC와 제휴하거나 Google이 승인한 서비스가 아닙니다.</small></footer>}
