'use client';

import {
  AppWindow, Bell, BookOpenCheck, Bot, Building2, ChevronDown, ChevronRight,
  CircleHelp, Cloud, CreditCard, Database, FileBarChart, Globe2,
  GraduationCap, Grid3X3, Home, KeyRound, LifeBuoy, Menu, MonitorSmartphone,
  MoreVertical, Plus, Search, Settings, ShieldCheck, Sparkles, UserCog, Users, X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
    } } };
  }
}

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type Section = { id: string; title: string; subtitle: string; icon: IconType; links: string[] };
type Org = { id: string; name: string; parent: string; description: string };
type PracticeUser = { id: string; firstName: string; lastName: string; email: string; org: string; status: string };
type PracticeGroup = { id: string; name: string; email: string; description: string; members: string[] };
type Profile = { name: string; email: string; picture: string };
type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };

const sections: Section[] = [
  { id:'directory', title:'디렉터리', subtitle:'사용자, 그룹, 조직 단위 관리', icon:Users, links:['사용자','그룹','공유 대상 그룹','조직 단위','건물 및 리소스','디렉터리 설정','외부 디렉터리'] },
  { id:'chrome', title:'Chrome 브라우저', subtitle:'브라우저 정책과 확장 프로그램 관리', icon:Globe2, links:['등록된 브라우저','관리 프로필','브라우저 정책','확장 프로그램'] },
  { id:'devices', title:'기기', subtitle:'모바일·엔드포인트·ChromeOS 기기 관리', icon:MonitorSmartphone, links:['개요','모바일 및 엔드포인트','ChromeOS','네트워크'] },
  { id:'agents', title:'에이전트', subtitle:'교육용 자동화 기능 둘러보기', icon:Bot, links:['에이전트 개요','활동','설정'] },
  { id:'apps', title:'앱', subtitle:'Google Workspace 및 웹 앱 설정', icon:AppWindow, links:['Google Workspace','추가 Google 서비스','웹 및 모바일 앱','앱 액세스 제어'] },
  { id:'ai', title:'생성형 AI', subtitle:'AI 기능의 접근 및 데이터 설정', icon:Sparkles, links:['Gemini 앱','Workspace용 Gemini','사용 현황'] },
  { id:'security', title:'보안', subtitle:'인증, 알림, 조사 도구 실습', icon:ShieldCheck, links:['보안 센터','인증','액세스 및 데이터 제어','경고 센터'] },
  { id:'data', title:'데이터', subtitle:'이전, 가져오기, 내보내기 설정', icon:Database, links:['데이터 이전','가져오기 및 내보내기','데이터 리전'] },
  { id:'reports', title:'보고', subtitle:'사용자 및 관리자 활동 모니터링', icon:FileBarChart, links:['보고서','감사 및 조사','앱 보고서'] },
  { id:'billing', title:'결제', subtitle:'구독 및 결제 계정 살펴보기', icon:CreditCard, links:['구독','결제 계정','라이선스'] },
  { id:'account', title:'계정', subtitle:'조직 프로필과 환경설정 관리', icon:Settings, links:['계정 설정','프로필','맞춤 URL','법률 및 규정 준수'] },
  { id:'rules', title:'규칙', subtitle:'알림 및 자동 작업 규칙 설정', icon:KeyRound, links:['규칙 목록','활동 규칙','보고 규칙'] },
  { id:'storage', title:'저장용량', subtitle:'조직의 공유 저장용량 관리', icon:Cloud, links:['개요','저장용량 관리 도구','사용자별 저장용량'] },
  { id:'roles', title:'관리자 역할', subtitle:'관리 콘솔 접근 권한과 역할 할당', icon:UserCog, links:['관리자 역할','권한','역할 할당'] },
  { id:'support', title:'지원', subtitle:'도움말 어시스턴트와 연결', icon:LifeBuoy, links:['도움말','지원 문의','서비스 상태'] },
];

const starterOrgs: Org[] = [
  { id:'org-staff', name:'교직원', parent:'최상위 조직 단위', description:'교직원 연습용 조직' },
  { id:'org-students', name:'학생', parent:'최상위 조직 단위', description:'학생 연습용 조직' },
  { id:'org-grade1', name:'1학년', parent:'학생', description:'1학년 학생' },
];
const starterUsers: PracticeUser[] = [
  { id:'admin-locked', firstName:'관리자', lastName:'최고', email:'admin@school.sen.ms.kr', org:'최상위 조직 단위', status:'보호됨' },
];
const starterGroups: PracticeGroup[] = [];

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
    const key=`admin-c-practice:${profile.email || 'guest'}`;
    try { const saved=localStorage.getItem(key); if (saved) { const data=JSON.parse(saved); setOrgs(data.orgs || starterOrgs); setUsers(data.users || starterUsers); setGroups(data.groups || starterGroups); } } catch {}
  },[signedIn,profile.email]);
  useEffect(() => {
    if (!signedIn) return;
    localStorage.setItem(`admin-c-practice:${profile.email || 'guest'}`,JSON.stringify({orgs,users,groups}));
  },[signedIn,profile.email,orgs,users,groups]);
  useEffect(() => { if (!toast) return; const timer=setTimeout(()=>setToast(''),2800); return()=>clearTimeout(timer); },[toast]);

  const filtered = useMemo(() => { const q=query.trim().toLowerCase(); return q ? sections.filter(s => `${s.title} ${s.subtitle} ${s.links.join(' ')}`.toLowerCase().includes(q)) : sections; },[query]);
  const openSection=(id:string,link='개요')=>{ setActive(id); setActiveLink(link); setQuery(''); if(innerWidth<800) setSidebarOpen(false); };
  const notify=(label:string)=>setToast(`연습 완료: “${label}” 동작은 실제 관리 콘솔에 반영되지 않습니다.`);
  const addOrg=(org:Omit<Org,'id'>)=>{ setOrgs(v=>[...v,{...org,id:crypto.randomUUID()}]); setModal(null); setToast(`연습용 조직 단위 “${org.name}”을 만들었습니다.`); };
  const addUser=(user:Omit<PracticeUser,'id'|'status'>)=>{ setUsers(v=>[...v,{...user,id:crypto.randomUUID(),status:'활성'}]); setModal(null); setToast(`연습용 사용자 “${user.email}”을 만들었습니다.`); };
  const addGroup=(group:Omit<PracticeGroup,'id'>)=>{ setGroups(v=>[...v,{...group,id:crypto.randomUUID()}]); setModal(null); setToast(`연습용 그룹 “${group.email}”을 만들었습니다.`); };
  const deleteOrg=(id:string)=>{ setOrgs(v=>v.filter(x=>x.id!==id)); setToast('연습용 조직 단위를 삭제했습니다.'); };
  const deleteUser=(id:string)=>{ if(id==='admin-locked'){setToast('초기 관리자 계정은 연습 환경에서 보호됩니다.');return;} setUsers(v=>v.filter(x=>x.id!==id)); setToast('연습용 사용자 계정을 삭제했습니다.'); };
  const deleteGroup=(id:string)=>{ setGroups(v=>v.filter(x=>x.id!==id)); setToast('연습용 그룹을 삭제했습니다.'); };

  useEffect(() => {
    const context=(document as Document & { modelContext?:ModelContext }).modelContext;
    if(!context?.registerTool || !signedIn) return;
    const lifecycle=new AbortController();
    const register=(tool:Record<string,unknown>)=>void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});
    register({name:'create_practice_organization',title:'연습용 조직 단위 만들기',description:'실제 Workspace와 무관한 브라우저 내 연습용 조직 단위를 생성합니다.',inputSchema:{type:'object',properties:{name:{type:'string'},parent:{type:'string'},description:{type:'string'}},required:['name'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const v=input as {name?:string;parent?:string;description?:string};if(!v.name?.trim())throw new Error('name is required');const item={id:crypto.randomUUID(),name:v.name.trim(),parent:v.parent||'최상위 조직 단위',description:v.description||'AI 도구로 만든 연습 조직'};setOrgs(old=>[...old,item]);return {created:true,id:item.id,name:item.name,practiceOnly:true}}});
    register({name:'create_practice_user',title:'연습용 사용자 만들기',description:'연습용 도메인에 브라우저 내 가짜 사용자 계정을 생성합니다.',inputSchema:{type:'object',properties:{firstName:{type:'string'},lastName:{type:'string'},username:{type:'string'},organization:{type:'string'}},required:['firstName','lastName','username'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const v=input as {firstName?:string;lastName?:string;username?:string;organization?:string};if(!v.firstName||!v.lastName||!v.username)throw new Error('firstName, lastName and username are required');const item={id:crypto.randomUUID(),firstName:v.firstName,lastName:v.lastName,email:`${v.username.replace(/@.*/,'')}@school.sen.ms.kr`,org:v.organization||'최상위 조직 단위',status:'활성'};setUsers(old=>[...old,item]);return {created:true,id:item.id,email:item.email,practiceOnly:true}}});
    register({name:'create_practice_group',title:'연습용 그룹 만들기',description:'기존 연습용 사용자를 구성원으로 선택해 브라우저 내 가짜 그룹을 생성합니다.',inputSchema:{type:'object',properties:{name:{type:'string'},address:{type:'string'},memberIds:{type:'array',items:{type:'string'}}},required:['name','address'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const v=input as {name?:string;address?:string;memberIds?:string[]};if(!v.name||!v.address)throw new Error('name and address are required');const valid=new Set(users.map(user=>user.id));const item={id:crypto.randomUUID(),name:v.name,email:`${v.address.replace(/@.*/,'')}@school.sen.ms.kr`,description:'AI 도구로 만든 연습 그룹',members:(v.memberIds||[]).filter(id=>valid.has(id))};setGroups(old=>[...old,item]);return {created:true,id:item.id,email:item.email,memberCount:item.members.length,practiceOnly:true}}});
    return ()=>lifecycle.abort();
  },[signedIn,users]);

  if(!signedIn) return <main className="login-shell"><div className="training-ribbon"><BookOpenCheck size={16}/> 비공식 교육용 시뮬레이터 · 실제 Google 관리 콘솔이 아닙니다</div><section className="login-card"><div className="brand-mark large">A</div><p className="eyebrow">ADMIN C · 2026</p><h1>관리 콘솔 실습을<br/>안전하고 편안하게</h1><p className="login-description">실제 조직 설정을 바꾸지 않고 사용자·그룹·조직 단위·기기·보안 메뉴를 자유롭게 눌러보세요.</p><div id="google-signin" className="google-signin"/>{!googleReady&&<button className="demo-login" onClick={()=>setSignedIn(true)}><span>G</span> 체험 계정으로 시작</button>}<p className="login-note">이 사이트는 Google 비밀번호나 2차 인증 코드를 받지 않습니다.<br/>연습 데이터는 선생님의 이 브라우저 안에만 저장됩니다.</p><div className="domain-chip"><Globe2 size={16}/> 연습용 예시 도메인: school.sen.ms.kr</div></section><Footer/></main>;

  return <div className="app-shell">
    <header className="topbar"><button className="icon-button" onClick={()=>setSidebarOpen(v=>!v)} aria-label="메뉴"><Menu/></button><button className="brand" onClick={()=>setActive('home')}><div className="brand-mark">A</div><span>Admin C</span><small>연습용</small></button><label className="searchbox"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="사용자, 그룹, 설정 또는 기기 검색"/><kbd>/</kbd></label><div className="top-actions"><button className="icon-button" onClick={()=>notify('알림 확인')}><Bell size={20}/></button><button className="icon-button" onClick={()=>openSection('support')}><CircleHelp size={20}/></button><button className="icon-button desktop-only" onClick={()=>openSection('apps')}><Grid3X3 size={20}/></button><button className="profile-button" onClick={()=>notify('계정 메뉴')}>{profile.picture?<img src={profile.picture} alt=""/>:profile.name.slice(0,1)}</button></div></header>
    <div className="safety-banner"><ShieldCheck size={17}/><span><strong>교육용 시뮬레이터</strong> — 생성·변경 사항은 실제 Google Workspace에 반영되지 않습니다.</span><b>school.sen.ms.kr · 예시</b></div>
    <div className={`workspace ${sidebarOpen?'':'sidebar-collapsed'}`}><aside className="sidebar"><button className={`nav-item ${active==='home'?'active':''}`} onClick={()=>setActive('home')}><Home size={19}/><span>홈</span></button>{sections.map((s,index)=><SidebarItem key={s.id} section={s} expanded={active===s.id} activeLink={activeLink} onOpen={openSection} showBadge={s.id==='agents'} defaultExpanded={index===0}/>) }<div className="sidebar-spacer"/><button className="nav-item" onClick={()=>notify('의견 보내기')}><MoreVertical size={19}/><span>의견 보내기</span></button><div className="sidebar-legal">비공식 교육용 · 실제 서비스 아님</div></aside>
      <main className="content">{query?<SearchResults sections={filtered} onOpen={openSection}/>:active==='home'?<Dashboard onOpen={openSection} onModal={setModal} onAction={notify} userCount={users.length} orgCount={orgs.length} groupCount={groups.length}/>:current?<SectionView section={current} activeLink={activeLink} setActiveLink={setActiveLink} users={users} orgs={orgs} groups={groups} onModal={setModal} onDeleteOrg={deleteOrg} onDeleteUser={deleteUser} onDeleteGroup={deleteGroup} onAction={notify} onHome={()=>setActive('home')}/>:null}<Footer/></main>
    </div>
    {modal==='org'&&<OrgModal orgs={orgs} onClose={()=>setModal(null)} onSave={addOrg}/>} {modal==='user'&&<UserModal orgs={orgs} onClose={()=>setModal(null)} onSave={addUser}/>} {modal==='group'&&<GroupModal users={users} onClose={()=>setModal(null)} onSave={addGroup}/>} {toast&&<div className="toast" role="status"><BookOpenCheck size={19}/>{toast}<button onClick={()=>setToast('')}><X size={16}/></button></div>}
  </div>;
}

function SidebarItem({section,expanded,activeLink,onOpen,showBadge,defaultExpanded}:{section:Section;expanded:boolean;activeLink:string;onOpen:(id:string,link?:string)=>void;showBadge?:boolean;defaultExpanded?:boolean}){
  const [open,setOpen]=useState(defaultExpanded||false); const Icon=section.icon; const isOpen=open||expanded;
  return <div><button className={`nav-item ${expanded?'active':''}`} onClick={()=>{setOpen(v=>!v);onOpen(section.id,section.links[0]);}}><span className="nav-chevron">{isOpen?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</span><Icon size={19}/><span>{section.title}</span>{showBadge&&<em>새로운 기능</em>}</button>{isOpen&&<div className="subitems">{section.links.map(link=><button key={link} className={expanded&&activeLink===link?'active':''} onClick={()=>onOpen(section.id,link)}>{link}</button>)}</div>}</div>;
}

function Dashboard({onOpen,onModal,onAction,userCount,orgCount,groupCount}:{onOpen:(id:string,link?:string)=>void;onModal:(v:'org'|'user'|'group')=>void;onAction:(v:string)=>void;userCount:number;orgCount:number;groupCount:number}){
  const cards=[
    {id:'directory',title:'사용자',subtitle:`연습 계정 ${userCount}개`,links:['사용자 추가','사용자 삭제','사용자 이름 또는 이메일 업데이트','보조 이메일 주소 만들기']},
    {id:'apps',title:'앱 액세스 제어',subtitle:'사용자가 요청한 앱 검토',links:['앱 검토','사용자 요청 보기']},
    {id:'billing',title:'결제',subtitle:'구독 및 결제 관리',links:['구독 관리','결제 계정','구매 또는 업그레이드']},
    {id:'ai',title:'디스커버',subtitle:'교육 현장의 새로운 기능',links:['새 소식 살펴보기','설정 관리']},
    {id:'reports',title:'제품 업데이트',subtitle:'Workspace의 최신 소식',links:['Sheets 업데이트','외부 공유 관리','새 관리자 기능']},
    {id:'security',title:'알리미',subtitle:'잠재적 문제 관련 알림',links:['신고된 스팸 검토','관리자 비밀번호 알림','서비스 변경 알림']},
    {id:'chrome',title:'Chrome Enterprise',subtitle:'브라우저 정책 및 확장 프로그램',links:['클라우드 관리 설정','브라우저 등록','브라우저 정책 구성','확장 프로그램 관리']},
    {id:'devices',title:'ChromeOS 기기 관리',subtitle:'기기 정책과 보고서 보기',links:['기기 관리 안내 설정 시작','ChromeOS 기기 보기 및 관리']},
  ];
  return <div className="dashboard-wrap"><div className="welcome-row"><div><p className="eyebrow">연습 조직 · SCHOOL.SEN.MS.KR</p><h1>관리 콘솔 홈</h1><p>오늘의 연수 과제를 선택해 자유롭게 탐색해 보세요.</p></div><button className="outline-button" onClick={()=>onAction('연수 가이드 열기')}><GraduationCap size={18}/> 연수 가이드</button></div><div className="quick-practice"><button onClick={()=>onModal('org')}><Building2/><span><strong>조직 단위 만들기</strong><small>현재 {orgCount}개 · 직접 생성 실습</small></span><Plus/></button><button onClick={()=>onModal('user')}><Users/><span><strong>사용자 계정 만들기</strong><small>현재 {userCount}개 · 직접 생성 실습</small></span><Plus/></button><button onClick={()=>onModal('group')}><Grid3X3/><span><strong>그룹 만들기</strong><small>현재 {groupCount}개 · 구성원 선택 실습</small></span><Plus/></button></div><div className="info-banner"><BookOpenCheck/><div><strong>추천 실습 순서</strong><span>조직 단위 만들기 → 사용자 계정 만들기 → 새 그룹을 만들고 구성원 추가</span></div><button onClick={()=>onModal('org')}>시작하기</button></div><section className="card-grid">{cards.map(card=><article className="dashboard-card" key={card.title} onClick={()=>onOpen(card.id)}><header><div><h2>{card.title}</h2><p>{card.subtitle}</p></div><button onClick={e=>{e.stopPropagation();onOpen(card.id)}}>모두 보기</button></header><div className="card-links">{card.links.map(link=><button key={link} onClick={e=>{e.stopPropagation(); if(link==='사용자 추가')onModal('user'); else onOpen(card.id,link)}}>{link}<ChevronRight size={15}/></button>)}</div></article>)}</section><section className="compact-grid">{sections.filter(s=>['apps','devices','account','directory','security','reports','rules','roles','storage','support'].includes(s.id)).map(s=><button className="compact-card" key={s.id} onClick={()=>onOpen(s.id)}><span><strong>{s.id==='directory'?'조직 단위':s.title}</strong><small>{s.id==='directory'?`${orgCount}개의 연습 조직 단위`:s.subtitle}</small></span><ChevronRight/></button>)}</section></div>;
}

function SectionView({section,activeLink,setActiveLink,users,orgs,groups,onModal,onDeleteOrg,onDeleteUser,onDeleteGroup,onAction,onHome}:{section:Section;activeLink:string;setActiveLink:(v:string)=>void;users:PracticeUser[];orgs:Org[];groups:PracticeGroup[];onModal:(v:'org'|'user'|'group')=>void;onDeleteOrg:(id:string)=>void;onDeleteUser:(id:string)=>void;onDeleteGroup:(id:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  const Icon=section.icon; const isUsers=section.id==='directory'&&activeLink==='사용자'; const isOrgs=section.id==='directory'&&activeLink==='조직 단위'; const isGroups=section.id==='directory'&&activeLink==='그룹';
  const rows=isUsers?users.map(u=>({id:u.id,cells:[`${u.lastName}${u.firstName}`,u.email,u.org,u.status]})):isOrgs?orgs.map(o=>({id:o.id,cells:[o.name,o.parent,o.description,'연습용']})):isGroups?groups.map(g=>({id:g.id,cells:[g.name,g.email,`${g.members.length}명`,g.description]})):section.links.map((link,i)=>({id:`row-${i}`,cells:[`${link} 예시 ${i+1}`,'school.sen.ms.kr',i%2?'Google 기본값':'로컬 단위로 적용됨','사용 중']}));
  const add=()=>isOrgs?onModal('org'):isUsers?onModal('user'):isGroups?onModal('group'):onAction(`${section.title} 항목 추가`);
  if(!isUsers&&!isOrgs&&!isGroups) return <SettingsView section={section} activeLink={activeLink} setActiveLink={setActiveLink} onAction={onAction} onHome={onHome}/>;
  return <div className="section-page wide"><nav className="breadcrumbs"><button onClick={onHome}>홈</button><ChevronRight size={14}/><span>{section.title}</span><ChevronRight size={14}/><strong>{activeLink}</strong></nav><div className="section-heading"><div className="section-icon"><Icon size={26}/></div><div><h1>{section.title}</h1><p>{section.subtitle} · 모든 항목은 연습용 예시입니다.</p></div><button className="primary-button" onClick={add}><Plus size={17}/>{isOrgs?'조직 단위 만들기':isUsers?'새 사용자 추가':'그룹 만들기'}</button></div><div className="directory-layout"><OrgTree orgs={orgs}/><section className="data-panel"><div className="action-strip"><strong>{activeLink} | 모든 조직 단위 표시</strong><button onClick={add}>{isUsers?'새 사용자 추가':isOrgs?'조직 단위 만들기':'그룹 만들기'}</button><button onClick={()=>onAction('일괄 업데이트')}>일괄 업데이트</button><button onClick={()=>onAction('목록 다운로드')}>다운로드</button><button onClick={()=>onAction('옵션 더보기')}>옵션 더보기 <ChevronDown size={14}/></button></div><div className="filter-strip"><button><Plus size={17}/> 필터 추가</button></div><div className="table-wrap detailed"><table><thead><tr><th><input type="checkbox" aria-label="전체 선택"/></th><th>이름 ↑</th><th>이메일 / 상위 조직</th><th>조직 / 구성원</th><th>상태</th><th></th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><input type="checkbox" aria-label={`${row.cells[0]} 선택`}/></td><td><span className="avatar-dot">{row.cells[0].slice(0,1)}</span><b className="blue-text">{row.cells[0]}</b></td>{row.cells.slice(1).map(cell=><td key={cell}>{cell}</td>)}<td><button className="delete-button" onClick={()=>isUsers?onDeleteUser(row.id):isOrgs?onDeleteOrg(row.id):onDeleteGroup(row.id)}>삭제</button></td></tr>)}</tbody></table></div><div className="practice-panel"><div><GraduationCap/><span><strong>연수 미션</strong><small>{isOrgs?'새 조직 단위를 하나 만들어 보세요.':isUsers?'새 사용자 계정을 만들고 조직 단위를 지정해 보세요.':'새 그룹을 만들고 방금 만든 사용자를 구성원으로 추가해 보세요.'}</small></span></div><button onClick={add}>실습 시작</button></div></section></div></div>;
}

function OrgTree({orgs}:{orgs:Org[]}){return <aside className="org-tree"><header>모든 조직 <ChevronRight/></header><label><Search size={18}/><input placeholder="검색"/></label><div className="selection-toggle"><button className="active">✓ 단일 선택</button><button>다중 선택</button></div><button className="tree-root"><ChevronDown size={16}/> school.sen.ms.kr</button>{orgs.map(o=><button className="tree-child" key={o.id}>{o.name}</button>)}</aside>}

function SettingsView({section,activeLink,setActiveLink,onAction,onHome}:{section:Section;activeLink:string;setActiveLink:(v:string)=>void;onAction:(v:string)=>void;onHome:()=>void}){
  const Icon=section.icon; const settings=['사용자 세션 최대 길이','맞춤 서비스 약관','맞춤 아바타','맞춤 배경화면','맞춤 테마 색상','조직 이름(프로필)','조직 아이콘 URL(프로필)','조직 이름(브라우저)','조직 아이콘 URL(브라우저)','기업 프로필 배지 툴바 설정'];
  return <div className="section-page wide"><nav className="breadcrumbs"><button onClick={onHome}>홈</button><ChevronRight size={14}/><span>{section.title}</span><ChevronRight size={14}/><strong>{activeLink}</strong></nav><div className="settings-shell"><aside className="settings-nav"><h1>설정</h1>{section.links.map(link=><button className={activeLink===link?'active':''} key={link} onClick={()=>setActiveLink(link)}>{link}<ChevronDown size={17}/></button>)}</aside><section className="settings-main"><div className="settings-tabs"><button className="active">사용자 및 브라우저 설정</button><button>기기 설정</button><button>관리 게스트 세션 설정</button></div><div className="settings-tools"><span>표시: 지원됨</span><button><Plus size={18}/> 필터 검색 또는 추가</button><button onClick={()=>onAction('최근 변경사항 보기')}>최근 변경사항</button></div><div className="settings-title"><span className="section-icon"><Icon size={22}/></span><strong>{activeLink} · 일반</strong></div><div className="settings-table"><div className="settings-row header"><b>설정</b><b>구성</b><b>상속</b><b>지원 플랫폼</b></div>{settings.map((name,i)=><button className="settings-row" key={name} onClick={()=>onAction(`${name} 설정 열기`)}><span>{name}</span><span>{i===3?'업로드된 파일':'Google 기본값'}</span><span>{i===3||i===6?'로컬 단위로 적용됨':'상속됨'}</span><span className="platforms">▣ ◉ ▲ iOS</span></button>)}</div></section></div></div>
}

function ModalShell({title,description,onClose,children}:{title:string;description:string;onClose:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><section className="modal" role="dialog" aria-modal="true"><header><div><p className="eyebrow">안전한 연습 모드</p><h2>{title}</h2><p>{description}</p></div><button className="icon-button" onClick={onClose}><X/></button></header>{children}<div className="modal-warning"><ShieldCheck size={16}/> 이 내용은 이 브라우저에만 저장되며 실제 Google 계정은 만들어지지 않습니다.</div></section></div>}
function OrgModal({orgs,onClose,onSave}:{orgs:Org[];onClose:()=>void;onSave:(v:Omit<Org,'id'>)=>void}){const [name,setName]=useState('');const [parent,setParent]=useState('최상위 조직 단위');const [description,setDescription]=useState('');const submit=(e:FormEvent)=>{e.preventDefault();if(name.trim())onSave({name:name.trim(),parent,description:description.trim()||'연수에서 만든 조직 단위'})};return <ModalShell title="조직 단위 만들기" description="조직 구조를 연습용으로 직접 구성해 보세요." onClose={onClose}><form className="practice-form" onSubmit={submit}><label><span>조직 단위 이름 *</span><input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="예: 3학년"/></label><label><span>상위 조직 단위</span><select value={parent} onChange={e=>setParent(e.target.value)}><option>최상위 조직 단위</option>{orgs.map(o=><option key={o.id}>{o.name}</option>)}</select></label><label><span>설명</span><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="이 조직 단위의 용도를 입력하세요."/></label><div className="form-actions"><button type="button" onClick={onClose}>취소</button><button type="submit">조직 단위 만들기</button></div></form></ModalShell>}
function UserModal({orgs,onClose,onSave}:{orgs:Org[];onClose:()=>void;onSave:(v:Omit<PracticeUser,'id'|'status'>)=>void}){const [firstName,setFirstName]=useState('');const [lastName,setLastName]=useState('');const [username,setUsername]=useState('');const [org,setOrg]=useState(orgs[0]?.name||'최상위 조직 단위');const submit=(e:FormEvent)=>{e.preventDefault();if(firstName&&lastName&&username)onSave({firstName,lastName,email:`${username.replace(/@.*/,'')}@school.sen.ms.kr`,org})};return <ModalShell title="새 사용자 계정 만들기" description="이름, 계정 주소, 조직 단위를 지정하는 과정을 연습하세요." onClose={onClose}><form className="practice-form" onSubmit={submit}><div className="form-row"><label><span>성 *</span><input required value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="김"/></label><label><span>이름 *</span><input autoFocus required value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="하늘"/></label></div><label><span>기본 이메일 *</span><div className="email-input"><input required pattern="[a-zA-Z0-9._-]+" value={username} onChange={e=>setUsername(e.target.value)} placeholder="haneul"/><b>@school.sen.ms.kr</b></div></label><label><span>조직 단위</span><select value={org} onChange={e=>setOrg(e.target.value)}>{orgs.map(o=><option key={o.id}>{o.name}</option>)}</select></label><div className="generated-password"><KeyRound size={18}/><span><strong>임시 비밀번호는 생성하지 않습니다</strong><small>실제 계정이 아닌 연습용 기록이므로 로그인 정보가 필요하지 않습니다.</small></span></div><div className="form-actions"><button type="button" onClick={onClose}>취소</button><button type="submit">사용자 추가</button></div></form></ModalShell>}

function GroupModal({users,onClose,onSave}:{users:PracticeUser[];onClose:()=>void;onSave:(v:Omit<PracticeGroup,'id'>)=>void}){const [name,setName]=useState('');const [address,setAddress]=useState('');const [description,setDescription]=useState('');const [members,setMembers]=useState<string[]>([]);const submit=(e:FormEvent)=>{e.preventDefault();if(name&&address)onSave({name,email:`${address.replace(/@.*/,'')}@school.sen.ms.kr`,description:description||'연수에서 만든 그룹',members})};const toggle=(id:string)=>setMembers(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);return <ModalShell title="새 그룹 만들기" description="그룹 주소를 정하고 생성한 사용자를 구성원으로 선택해 보세요." onClose={onClose}><form className="practice-form" onSubmit={submit}><label><span>그룹 이름 *</span><input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="예: 1학년 담임"/></label><label><span>그룹 이메일 *</span><div className="email-input"><input required pattern="[a-zA-Z0-9._-]+" value={address} onChange={e=>setAddress(e.target.value)} placeholder="grade1-teachers"/><b>@school.sen.ms.kr</b></div></label><label><span>그룹 설명</span><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="그룹의 용도를 입력하세요."/></label><fieldset className="member-picker"><legend>구성원 선택</legend>{users.map(user=><label key={user.id} className={user.id==='admin-locked'?'locked-member':''}><input type="checkbox" checked={members.includes(user.id)} onChange={()=>toggle(user.id)}/><span><strong>{user.lastName}{user.firstName}</strong><small>{user.email}{user.id==='admin-locked'?' · 초기 관리자':''}</small></span></label>)}{users.length===1&&<p>아직 생성한 일반 사용자가 없습니다. 관리자만으로 그룹을 만들거나, 먼저 사용자 계정을 추가하세요.</p>}</fieldset><div className="form-actions"><button type="button" onClick={onClose}>취소</button><button type="submit">그룹 만들기</button></div></form></ModalShell>}

function SearchResults({sections,onOpen}:{sections:Section[];onOpen:(id:string,link?:string)=>void}){return <div className="search-results"><p className="eyebrow">통합 검색</p><h1>검색 결과</h1><p>{sections.length}개의 메뉴를 찾았습니다.</p><div>{sections.map(s=>{const Icon=s.icon;return <button key={s.id} onClick={()=>onOpen(s.id,s.links[0])}><span className="section-icon"><Icon size={21}/></span><span><strong>{s.title}</strong><small>{s.subtitle}</small></span><ChevronRight/></button>})}</div>{!sections.length&&<div className="empty-state"><Search/><strong>일치하는 메뉴가 없습니다</strong><span>사용자, 보안, 기기처럼 다른 단어로 검색해 보세요.</span></div>}</div>}
function Footer(){return <footer className="site-footer"><span>관리콘솔 연습을 위한 Admin C 2026</span><span>Google Certified Trainer &amp; Innovator Sujin Lee</span><a href="mailto:gajungssamzzang@gmail.com">문의: gajungssamzzang@gmail.com</a><small>비공식 교육용 시뮬레이터 · Google LLC와 제휴하거나 Google이 승인한 서비스가 아닙니다.</small></footer>}
