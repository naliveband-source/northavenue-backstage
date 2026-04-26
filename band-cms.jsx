"use client";
// v2.2 — Design C + sidebar modals + DnD reorder
import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Responsive hook ────────────────────────────────────────────────────────
function useWindowWidth(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return w;
}

const DARK  = { black:"#181719",white:"#F8F5E6",orange:"#D4622A",green:"#1E7B5B",dim:"#2A2628",muted:"#B0A8A4",border:"#2E2B2C",red:"#C04040",cardText:"#E8E0DC",subText:"#C0B8B4" };
const LIGHT = { black:"#F2EFE4",white:"#1A1718",orange:"#C4521F",green:"#1E7B5B",dim:"#E8E4D8",muted:"#7A7470",border:"#D0CCC0",red:"#9B2020",cardText:"#1A1718",subText:"#4A4440" };

const calcMusicianPay = bp => bp<=18000?1500:bp<=22000?2000:bp<=26000?2500:3000;
const calcSubPay      = mp => mp===1500?2000:2500;
const OWNER_PAY = 1000;
const NOW = new Date();
const isPast  = d => new Date(d) < NOW;
const getYear = s => new Date(s).getFullYear();
const CUR_YEAR = NOW.getFullYear();
const fmt     = n => new Intl.NumberFormat("da-DK",{style:"currency",currency:"DKK",minimumFractionDigits:0}).format(n);
const fmtDate = s => new Date(s).toLocaleDateString("da-DK",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
const fmtDateShort = s => new Date(s).toLocaleDateString("da-DK",{day:"2-digit",month:"short"});
const YEAR_OPTS = [CUR_YEAR-1, CUR_YEAR, CUR_YEAR+1];

// ── Data ───────────────────────────────────────────────────────────────────
const INIT_USERS = [
  {id:"u1", email:"admin@na.dk",     password:"admin123",    role:"admin",   subType:"owner",      tags:[],                        first:"Band",    last:"Admin",           initials:"BA",instrument:"",                 phone:"",avatar:null,musicianId:null, isAdmin:true},
  {id:"u2", email:"isabella@na.dk",  password:"isabella123", role:"musician",subType:"member",     tags:["musiker"],               first:"Isabella",last:"Vahle",            initials:"IV",instrument:"Lead vokal",        phone:"",avatar:null,musicianId:1,   isAdmin:false},
  {id:"u3", email:"mikkel@na.dk",    password:"mikkel123",   role:"admin",   subType:"owner",      tags:["musiker"],               first:"Mikkel",  last:"Maagaard Olesen",  initials:"MM",instrument:"Guitar & lead vokal",phone:"",avatar:null,musicianId:2,  isAdmin:true},
  {id:"u4", email:"oliver@na.dk",    password:"oliver123",   role:"admin",   subType:"owner",      tags:["musiker"],               first:"Oliver",  last:"Sigmann Beck",     initials:"OS",instrument:"Lead guitar & vokal",phone:"",avatar:null,musicianId:3,  isAdmin:true},
  {id:"u5", email:"magnus@na.dk",    password:"magnus123",   role:"admin",   subType:"owner",      tags:["musiker"],               first:"Magnus",  last:"Rønnest France",   initials:"MR",instrument:"Keyboard & vokal",  phone:"",avatar:null,musicianId:4,  isAdmin:true},
  {id:"u6", email:"niels@na.dk",     password:"niels123",    role:"musician",subType:"member",     tags:["musiker"],               first:"Niels",   last:"Rævdal",           initials:"NR",instrument:"Bas & vokal",       phone:"",avatar:null,musicianId:5,   isAdmin:false},
  {id:"u7", email:"thomas@na.dk",    password:"thomas123",   role:"musician",subType:"member",     tags:["musiker"],               first:"Thomas",  last:"Holt",             initials:"TH",instrument:"Trommer",           phone:"",avatar:null,musicianId:6,   isAdmin:false},
  {id:"u8", email:"ruben@na.dk",     password:"ruben123",    role:"musician",subType:"substitute", tags:["vikar"],                 first:"Ruben",   last:"Jensen",           initials:"RJ",instrument:"Keys",              phone:"",avatar:null,musicianId:7,   isAdmin:false},
  {id:"u9", email:"sjabon@na.dk",    password:"sjabon123",   role:"musician",subType:"substitute", tags:["vikar"],                 first:"Sjabon",  last:"Andersen",         initials:"SA",instrument:"Bas",               phone:"",avatar:null,musicianId:8,   isAdmin:false},
  {id:"ua1",email:"niklas@na.dk",    password:"niklas123",   role:"musician",subType:"alias",      tags:["alias_manager"],         first:"Niklas",  last:"Runge",            initials:"NR",instrument:"",                phone:"",avatar:null,musicianId:null,  isAdmin:false},
  {id:"ua2",email:"mikkelmik@na.dk", password:"mikkelmik123",role:"musician",subType:"alias",      tags:["alias_manager"],         first:"Mikkel",  last:"Mikkelsen",        initials:"MM",instrument:"",                phone:"",avatar:null,musicianId:null,  isAdmin:false},
  {id:"ua3",email:"lasse@na.dk",     password:"lasse123",    role:"musician",subType:"alias",      tags:["alias_manager"],         first:"Lasse",   last:"Herold",           initials:"LH",instrument:"",                phone:"",avatar:null,musicianId:null,  isAdmin:false},
  {id:"ua4",email:"jacob@na.dk",     password:"jacob123",    role:"musician",subType:"alias",      tags:["alias_manager"],         first:"Jacob",   last:"Nørregaard",       initials:"JN",instrument:"",                phone:"",avatar:null,musicianId:null,  isAdmin:false},
  {id:"ua5",email:"magnussj@na.dk",  password:"magnussj123", role:"musician",subType:"substitute", tags:["vikar","alias_manager"], first:"Magnus",  last:"Sjabon",           initials:"MS",instrument:"Bas",               phone:"",avatar:null,musicianId:9,   isAdmin:false},
];

const SPOT = {"u1":"#888","u2":"#C4521F","u3":"#B87B30","u4":"#1E7B5B","u5":"#8B3FA8","u6":"#2E6B9B","u7":"#7B2020","u8":"#3B8B6B","u9":"#9B6B2B","ua1":"#4B8B9B","ua2":"#9B4B6B","ua3":"#6B9B4B","ua4":"#8B6B4B","ua5":"#4B6B9B"};
// Foretrækker brugerens egen farve, fallback til SPOT, fallback til grå
const userColor = u => (u?.color) || SPOT[u?.id] || "#888";

const INIT_BOOKINGS = [
  {id:1, date:"2025-03-14",departure:"16:00",arrival:"17:30",type:"60 års fødselsdag",          city:"Svendborg",  address:"Brogade 1, 5700",          playTime:"20:00–22:30",sets:"2×80",bandPay:0,    booker:"Magnus",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:"Betales på dagen"},
  {id:2, date:"2025-05-10",departure:"19:00",arrival:"20:15",type:"Kobberbryllup",              city:"Vinderup",   address:"Herrup Kulturhus",         playTime:"22:00–00:30",sets:"2×80",bandPay:3000, booker:"Mox",   memberIds:[2,3,5,6,7],  substituteIds:[7,8],notes:""},
  {id:3, date:"2025-08-22",departure:"16:30",arrival:"17:15",type:"VIA Fredagsbar",             city:"Aarhus",     address:"VIA",                      playTime:"19:00–21:00",sets:"1 sæt á 2t",bandPay:1500,booker:"Mox",memberIds:[2,4,5,6],substituteIds:[7,8],notes:""},
  {id:4, date:"2025-11-07",departure:"17:45",arrival:"19:45",type:"Efterskoleforeningens Aften",city:"Nyborg",     address:"Østersøvej 2, 5800",       playTime:"21:30–00:00",sets:"3×50",bandPay:2500, booker:"Oliver",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:"Stort setup"},
  {id:5, date:"2025-12-13",departure:"18:00",arrival:"19:00",type:"Julefrokost",                city:"Kolding",    address:"Skovvangen 10, 6000",      playTime:"21:00–23:30",sets:"2×80",bandPay:2000, booker:"Mox",   memberIds:[2,3,5,6,7],  substituteIds:[],notes:""},
  {id:6, date:"2026-04-18",departure:"18:00",arrival:"20:00",type:"Fødselsdag",                 city:"Sønderborg", address:"Vollerup Kro, 6400",       playTime:"21:30–00:00",sets:"2×80",bandPay:2000, booker:"Mox",   memberIds:[2,3,5,6,7],  substituteIds:[],notes:""},
  {id:7, date:"2026-05-09",departure:"17:30",arrival:"19:45",type:"Byfest",                     city:"Genner",     address:"Genner Sportspladsen",     playTime:"21:00–23:30",sets:"3×60",bandPay:2500, booker:"Mox",   memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
  {id:8, date:"2026-06-06",departure:"20:30",arrival:"22:00",type:"Bryllup",                    city:"Ringkøbing", address:"Nørredige 7, 6950",        playTime:"23:30–02:00",sets:"2×80",bandPay:3000, booker:"Magnus",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
  {id:9, date:"2026-08-14",departure:"18:00",arrival:"19:30",type:"Sølvbryllup",                city:"Odense",     address:"Oensvej 79, 5700",         playTime:"20:00–22:30",sets:"2×80",bandPay:2500, booker:"Mox",   memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
  {id:10,date:"2027-02-20",departure:"17:00",arrival:"18:30",type:"Firmafest",                  city:"Aarhus",     address:"Rådhuspladsen 1",          playTime:"19:30–22:00",sets:"2×80",bandPay:3000, booker:"Magnus",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
];

const INIT_ALIAS = {
  "ua1":[
    {id:"a1a",date:"2026-06-12",type:"Bryllup",  city:"Aalborg",   address:"Karolinelundsvej 4",       arrival:"21:00",playTime:"22:30–01:30",sets:"2×80",musicians:5,bandPay:18000,bookingFee:31000,carGear:true, contact:"Søren Hansen",            phone:"26441122",booker:"Niklas",         notes:"God lyd"},
    {id:"a2a",date:"2026-09-05",type:"Jubilæum", city:"Viborg",    address:"Riddervolden 2",            arrival:"19:00",playTime:"20:00–22:30",sets:"2×60",musicians:4,bandPay:14000,bookingFee:31000,carGear:false,contact:"Line Kjær",               phone:"29992233",booker:"Niklas",         notes:""},
  ],
  "ua2":[
    {id:"a3a",date:"2026-05-23",type:"Bryllup",  city:"Hobro",     address:"Bramslev Bakker 4, 9500",  arrival:"22:45",playTime:"23:50–02:20",sets:"2×60",musicians:4,bandPay:15000,bookingFee:31000,carGear:true, contact:"Richard Gerster Laursen", phone:"30715569",booker:"Mikkel Mikkelsen",notes:""},
    {id:"a4a",date:"2026-08-01",type:"Bryllup",  city:"Hundested", address:"Amtsvejen 280, 3390",      arrival:"21:00",playTime:"22:30–01:30",sets:"2×80",musicians:5,bandPay:22000,bookingFee:31000,carGear:true, contact:"Ella Paksuniemi",         phone:"50155018",booker:"Mikkel Mikkelsen",notes:""},
    {id:"a5a",date:"2026-08-08",type:"Bryllup",  city:"Sunds",     address:"Søgårdvej 1-2, 7451",      arrival:"22:00",playTime:"23:00–02:00",sets:"2×80",musicians:4,bandPay:16000,bookingFee:31000,carGear:true, contact:"Jakob Mikkelsen",         phone:"22816327",booker:"Mikkel Mikkelsen",notes:"Kvindelig forsanger"},
  ],
  "ua3":[{id:"a6a",date:"2026-07-15",type:"Bryllup",city:"Odense",address:"Munkemølle 12",arrival:"21:30",playTime:"23:00–02:00",sets:"2×80",musicians:5,bandPay:20000,bookingFee:31000,carGear:true,contact:"Bent Larsen",phone:"40221133",booker:"Lasse",notes:"Aftensmad inkl."}],
  "ua4":[{id:"a7a",date:"2026-09-29",type:"Bryllup",city:"Rudkøbing",address:"Skrøbelev Hedevej 4, 5900",arrival:"22:00",playTime:"23:45–02:45",sets:"2×80",musicians:5,bandPay:23000,bookingFee:31000,carGear:true,contact:"Alicia Sparre",phone:"27636084",booker:"Jacob",notes:"Både mand og kvindelig forsanger"}],
  "ua5":[{id:"a8a",date:"2026-09-19",type:"Bryllup",city:"Vinderup",address:"Djeldvej 9, 7830",arrival:"21:45",playTime:"23:00–02:00",sets:"2×80",musicians:5,bandPay:20000,bookingFee:31000,carGear:true,contact:"Marie-Louise Pedersen",phone:"29367590",booker:"Magnus Sjabon",notes:""}],
};

const INIT_PAYMENTS = {
  2:[{id:"p1",date:"2025-09-01",amount:-1500,note:"September leje"}],
  3:[],4:[],5:[],6:[{id:"p2",date:"2025-09-01",amount:-1500,note:"September leje"}],7:[],8:[],9:[],
};

const PAY_BRACKETS = [{label:"Lavlønnet",pay:1500,color:"#7B2020"},{label:"Middel-lav",pay:2000,color:"#C4521F"},{label:"Middel-høj",pay:2500,color:"#C88B30"},{label:"Høj",pay:3000,color:"#1E7B5B"}];
const COST_SPLIT   = [{label:"Markedsføringsbidrag",pct:12.5,note:"Vi bruger ca. 150–200.000 kr her årligt"},{label:"Driftsomkostninger",pct:12.5,note:"Husleje, strøm, lager, udstyr, vedligehold mv."},{label:"Transportomkostninger",pct:10,note:"Billeje, forsikring, omkostninger ifm. job, bro, benzin mv."},{label:"Løn til musikere",pct:60,note:"10% per mand (60%)"},{label:"Overskud",pct:5,note:""}];
const ALL_TAGS     = ["musiker","vikar","alias_manager"];
const TAG_LABELS   = {musiker:"Musiker",vikar:"Vikar",alias_manager:"Alias Ansvarlig"};

const hasAlias = u => u.tags?.includes("alias_manager");
const hasVikar = u => u.subType==="substitute" || u.tags?.includes("vikar");
const sortMusicians = arr => [...arr].sort((a,b)=>{
  const ao=a.displayOrder??Infinity; const bo=b.displayOrder??Infinity;
  return ao!==bo?ao-bo:(a.id<b.id?-1:1);
});

// ── ConfirmModal ───────────────────────────────────────────────────────────
function ConfirmModal({message,onConfirm,onCancel,T,confirmLabel="JA, FJERN",confirmLoading=false}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000e",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:T.dim,border:`1px solid ${T.red}55`,padding:28,minWidth:320,maxWidth:420,boxShadow:"0 16px 48px #0009"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:9,color:T.red,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:14}}>ER DU SIKKER?</div>
        <p style={{fontSize:13,color:T.muted,fontFamily:"'Poppins',sans-serif",lineHeight:1.7,marginBottom:20}}>{message}</p>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn onClick={onCancel} color={T.muted} small>ANNULLER</Btn>
          <Btn onClick={onConfirm} color={T.red} small disabled={confirmLoading}>{confirmLoading?"SLETTER...":confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Job Detail Popup (ticket style) ───────────────────────────────────────
function JobDetailPopup({booking,users,isSub,isAdmin,T,onClose}){
  const isMobile=useWindowWidth()<768;
  const [chipProfile,setChipProfile]=useState(null);
  const mp=calcMusicianPay(booking.bandPay);
  const sp=calcSubPay(mp);
  const memberUsers=sortMusicians(users.filter(u=>u.musicianId&&u.subType!=="substitute"&&u.subType!=="alias"));
  const stubColor=PAY_BRACKETS.find(x=>x.pay===mp)?.color||T.orange;
  const stubAmount=isAdmin?booking.bandPay:isSub?sp:mp;
  const stubLabel=isAdmin?"BELØB":"DIN LØN";
  const dateObj=new Date(booking.date);
  const weekday=dateObj.toLocaleDateString("da-DK",{weekday:"short"}).toUpperCase();
  const dayNum=dateObj.getDate();
  const monthYear=dateObj.toLocaleDateString("da-DK",{month:"short",year:"numeric"}).toUpperCase();

  const Fld=({label,value,span=1,color=T.muted,weight=400})=>(
    <div style={{gridColumn:`span ${span}`}}>
      <div style={{fontSize:12,color:T.subText,letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{label}</div>
      <div style={{fontSize:14,color,fontWeight:weight,fontFamily:"'Poppins',sans-serif",marginTop:2}}>{value||"–"}</div>
    </div>
  );

  const openChip=(e,u)=>{e.stopPropagation();setChipProfile(u);};

  const MusicianChips=()=>(<>
    <div style={{fontSize:9,color:T.subText,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:8}}>MUSIKERE</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:booking.substituteIds?.length>0?10:0}}>
      {memberUsers.map(u=>{
        const isIn=booking.memberIds.includes(u.musicianId);const c=userColor(u);
        return(<div key={u.id} onClick={e=>openChip(e,u)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:isIn?c+"18":T.dim,border:`1px solid ${isIn?c+"44":T.border}`,borderRadius:8,opacity:isIn?1:0.45,cursor:"pointer"}}>
          <span style={{width:18,height:18,background:isIn?c:c+"44",borderRadius:4,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{u.initials}</span>
          <span style={{fontSize:11,color:isIn?T.white:T.subText,fontFamily:"'Poppins',sans-serif",fontWeight:isIn?600:400}}>{u.first}</span>
        </div>);
      })}
    </div>
    {booking.substituteIds?.length>0&&(<>
      <div style={{fontSize:9,color:T.subText,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:8,marginTop:6}}>VIKARER</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {booking.substituteIds.map(mid=>{
          const u=users.find(x=>x.musicianId===mid);if(!u)return null;const c=userColor(u);
          return(<div key={mid} onClick={e=>openChip(e,u)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:c+"18",border:`1px solid ${c+"44"}`,borderRadius:8,cursor:"pointer"}}>
            <span style={{width:18,height:18,background:c,borderRadius:4,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{u.initials}</span>
            <span style={{fontSize:11,color:T.white,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>{u.first}</span>
            <span style={{fontSize:8,color:T.orange,background:T.orange+"18",padding:"1px 5px",borderRadius:3,fontFamily:"'Poppins',sans-serif",fontWeight:700}}>VIKAR</span>
          </div>);
        })}
      </div>
    </>)}
  </>);

  if(typeof document==="undefined") return null;

  const profilePopup=chipProfile?createPortal(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setChipProfile(null)}>
      <div style={{background:T.dim,border:`1px solid ${userColor(chipProfile)}33`,borderRadius:16,padding:28,minWidth:260,maxWidth:340}} onClick={e=>e.stopPropagation()}>
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:userColor(chipProfile),borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{chipProfile.initials}</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{chipProfile.first} {chipProfile.last}</div>
              <div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:3}}>{chipProfile.instrument||"–"}</div>
            </div>
          </div>
        </div>
        {chipProfile.phone&&<div style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}><span style={{fontSize:11,color:T.subText,minWidth:60,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>Telefon</span><span style={{fontSize:13,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif",flex:1,minWidth:0,wordBreak:"break-all"}}>{chipProfile.phone}</span></div>}
        <div style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start"}}><span style={{fontSize:11,color:T.subText,minWidth:60,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>Email</span><span style={{fontSize:13,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif",flex:1,minWidth:0,wordBreak:"break-all"}}>{chipProfile.email}</span></div>
        {(chipProfile.tags||[]).length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{(chipProfile.tags||[]).map(t=><span key={t} style={{background:`color-mix(in oklab, ${T.orange} 16%, transparent)`,color:T.orange,padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.07em"}}>{TAG_LABELS[t]||t}</span>)}</div>}
        <button onClick={()=>setChipProfile(null)} style={{marginTop:20,width:"100%",padding:"8px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,letterSpacing:"0.2em",fontWeight:600}}>LUK</button>
      </div>
    </div>,
    document.body
  ):null;

  if(!isMobile){
    return(<>{createPortal(
      <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
        <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",display:"flex",width:600,maxWidth:"94vw",maxHeight:"90vh",boxShadow:"0 20px 60px #0009"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:120,background:stubColor,padding:"24px 18px",display:"flex",flexDirection:"column",justifyContent:"space-between",flexShrink:0}}>
            <div>
              <div style={{fontSize:9,color:"#F8F5E6",letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.85,marginBottom:2}}>{weekday}</div>
              <div style={{fontSize:46,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",lineHeight:1}}>{dayNum}</div>
              <div style={{fontSize:10,color:"#F8F5E6",letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",opacity:0.9,marginTop:3}}>{monthYear}</div>
            </div>
            <div>
              <div style={{fontSize:8,color:"#F8F5E6",letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.75,marginBottom:3}}>{stubLabel}</div>
              <div style={{fontSize:17,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif"}}>{fmt(stubAmount)}</div>
              <div style={{fontSize:8,color:"#F8F5E6",opacity:0.75,fontFamily:"'Poppins',sans-serif"}}>kr.</div>
            </div>
          </div>
          <div style={{width:2,background:T.black,display:"flex",flexDirection:"column",justifyContent:"space-around",alignItems:"center",flexShrink:0}}>
            {[0,1,2,3,4].map(i=><div key={i} style={{width:8,height:8,background:T.black,border:`1px solid ${T.border}`,borderRadius:"50%"}}/>)}
          </div>
          <div style={{flex:1,padding:"20px 22px",position:"relative",overflowY:"auto"}}>
            <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:T.subText,cursor:"pointer",fontSize:22,lineHeight:1,padding:0}}>×</button>
            <div style={{fontSize:9,color:stubColor,letterSpacing:"0.14em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:3}}>NORTH AVENUE</div>
            <div style={{fontSize:21,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.01em",lineHeight:1.1,paddingRight:28,marginBottom:4}}>{booking.type}</div>
            <div style={{fontSize:12,color:T.muted,fontFamily:"'Poppins',sans-serif",marginBottom:14}}>{[booking.city,booking.address].filter(Boolean).join(" · ")}</div>
            <div style={{display:"grid",gridTemplateColumns:isAdmin?"repeat(3,1fr)":"repeat(4,1fr)",gap:"10px 16px",borderBottom:`1px dashed ${T.border}`,paddingBottom:14,marginBottom:14}}>
              {!isAdmin&&<Fld label="AFGANG" value={booking.departure}/>}
              <Fld label="ANKOMST" value={booking.arrival}/>
              <Fld label="SPILLETID" value={booking.playTime}/>
              <Fld label="SÆT" value={booking.sets}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isAdmin?"1fr 1fr":"1fr",gap:"10px 14px",borderBottom:`1px dashed ${T.border}`,paddingBottom:14,marginBottom:14}}>
              {isAdmin&&<Fld label="MUSIKER LØN" value={fmt(mp)} color={stubColor} weight={700}/>}
              <Fld label="BOOKER" value={booking.booker} color="#8B3FA8" weight={700}/>
            </div>
            {booking.notes&&<div style={{marginBottom:14,padding:"8px 10px",background:T.black,borderLeft:`3px solid ${stubColor}`,borderRadius:4}}>
              <div style={{fontSize:10,color:T.subText,letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:3}}>NOTE</div>
              <div style={{fontSize:14,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{booking.notes}</div>
            </div>}
            <MusicianChips/>
          </div>
        </div>
      </div>,
      document.body
    )}{profilePopup}</>);
  }

  return(<>{createPortal(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:stubColor,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:9,color:"#F8F5E6",letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.85,marginBottom:3}}>{weekday} · {dayNum}. {monthYear}</div>
            <div style={{fontSize:18,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.01em"}}>{booking.type}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
            <div style={{fontSize:8,color:"#F8F5E6",letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.75,marginBottom:2}}>{stubLabel}</div>
            <div style={{fontSize:18,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif"}}>{fmt(stubAmount)} kr.</div>
          </div>
        </div>
        <div style={{borderTop:`2px dashed ${T.black}`}}/>
        <div style={{padding:"16px 18px 28px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:T.subText,cursor:"pointer",fontSize:22,lineHeight:1,padding:0}}>×</button>
          <div style={{fontSize:9,color:stubColor,letterSpacing:"0.14em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:3}}>NORTH AVENUE</div>
          <div style={{fontSize:12,color:T.muted,fontFamily:"'Poppins',sans-serif",marginBottom:14}}>{[booking.city,booking.address].filter(Boolean).join(" · ")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px",marginBottom:14}}>
            {!isAdmin&&<Fld label="AFGANG" value={booking.departure}/>}
            <Fld label="ANKOMST" value={booking.arrival}/>
            <Fld label="SPILLETID" value={booking.playTime}/>
            <Fld label="SÆT" value={booking.sets}/>
            {isAdmin&&<Fld label="MUSIKER LØN" value={fmt(mp)} color={stubColor} weight={700}/>}
            <Fld label="BOOKER" value={booking.booker} color="#8B3FA8" weight={700} span={2}/>
          </div>
          {booking.notes&&<div style={{marginBottom:14,padding:"8px 10px",background:T.black,borderLeft:`3px solid ${stubColor}`,borderRadius:4,fontSize:14,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{booking.notes}</div>}
          <MusicianChips/>
        </div>
      </div>
    </div>,
    document.body
  )}{profilePopup}</>);
}

// ── Alias Job Detail Popup (ticket style) ─────────────────────────────────
function AliasDetailPopup({booking,T,onClose}){
  const isMobile=useWindowWidth()<768;
  const stubColor=T.orange;
  const dateObj=new Date(booking.date);
  const weekday=dateObj.toLocaleDateString("da-DK",{weekday:"short"}).toUpperCase();
  const dayNum=dateObj.getDate();
  const monthYear=dateObj.toLocaleDateString("da-DK",{month:"short",year:"numeric"}).toUpperCase();
  const carGearVal=booking.carGear
    ?<span><span style={{color:"#1E7B5B"}}>●</span>{" "}Ja</span>
    :<span><span style={{color:"#C04040"}}>●</span>{" "}Nej</span>;

  const Fld=({label,value,span=1,color=T.muted,weight=400})=>(
    <div style={{gridColumn:`span ${span}`}}>
      <div style={{fontSize:12,color:T.subText,letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{label}</div>
      <div style={{fontSize:14,color,fontWeight:weight,fontFamily:"'Poppins',sans-serif",marginTop:2}}>{value||"–"}</div>
    </div>
  );

  if(!isMobile){
    return typeof document!=="undefined"?createPortal(
      <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
        <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",display:"flex",width:620,maxWidth:"94vw",maxHeight:"90vh",boxShadow:"0 20px 60px #0009"}} onClick={e=>e.stopPropagation()}>
          {/* Stub */}
          <div style={{width:120,background:stubColor,padding:"24px 18px",display:"flex",flexDirection:"column",justifyContent:"space-between",flexShrink:0}}>
            <div>
              <div style={{fontSize:9,color:"#F8F5E6",letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.85,marginBottom:2}}>{weekday}</div>
              <div style={{fontSize:46,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",lineHeight:1}}>{dayNum}</div>
              <div style={{fontSize:10,color:"#F8F5E6",letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",opacity:0.9,marginTop:3}}>{monthYear}</div>
            </div>
            <div>
              <div style={{fontSize:8,color:"#F8F5E6",letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.75,marginBottom:3}}>BELØB</div>
              <div style={{fontSize:17,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif"}}>{fmt(booking.bandPay)}</div>
              <div style={{fontSize:8,color:"#F8F5E6",opacity:0.75,fontFamily:"'Poppins',sans-serif"}}>kr.</div>
            </div>
          </div>
          {/* Perforation */}
          <div style={{width:2,background:T.black,display:"flex",flexDirection:"column",justifyContent:"space-around",alignItems:"center",flexShrink:0}}>
            {[0,1,2,3,4].map(i=><div key={i} style={{width:8,height:8,background:T.black,border:`1px solid ${T.border}`,borderRadius:"50%"}}/>)}
          </div>
          {/* Content */}
          <div style={{flex:1,padding:"20px 22px",position:"relative",overflowY:"auto"}}>
            <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:T.subText,cursor:"pointer",fontSize:22,lineHeight:1,padding:0}}>×</button>
            <div style={{fontSize:9,color:stubColor,letterSpacing:"0.14em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:3}}>NA ALIAS</div>
            <div style={{fontSize:21,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.01em",lineHeight:1.1,paddingRight:28,marginBottom:4}}>{booking.type}</div>
            <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif",marginBottom:14}}>{[booking.city,booking.address].filter(Boolean).join(" · ")}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px 16px",borderBottom:`1px dashed ${T.border}`,paddingBottom:14,marginBottom:14}}>
              <Fld label="ANKOMST" value={booking.arrival}/>
              <Fld label="SPILLETID" value={booking.playTime}/>
              <Fld label="SÆT" value={booking.sets}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px 16px",borderBottom:`1px dashed ${T.border}`,paddingBottom:14,marginBottom:14}}>
              <Fld label="BEMANDING" value={booking.musicians?`${booking.musicians} musikere`:null}/>
              <Fld label="BIL + GEAR" value={carGearVal}/>
              <Fld label="BOOKER" value={booking.booker} color="#8B3FA8" weight={700}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px 16px",borderBottom:`1px dashed ${T.border}`,paddingBottom:14,marginBottom:14}}>
              <Fld label="KONTAKTPERSON" value={booking.contact}/>
              <Fld label="TELEFON" value={booking.phone}/>
              <Fld label="BOOKING (KR)" value={booking.bookingFee?fmt(booking.bookingFee):null} color={T.orange} weight={700}/>
            </div>
            {booking.notes&&<div style={{padding:"8px 10px",background:T.black,borderLeft:`3px solid ${stubColor}`,borderRadius:4}}>
              <div style={{fontSize:10,color:T.subText,letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:3}}>NOTE</div>
              <div style={{fontSize:14,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{booking.notes}</div>
            </div>}
          </div>
        </div>
      </div>,
      document.body
    ):null;
  }

  return typeof document!=="undefined"?createPortal(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:stubColor,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:9,color:"#F8F5E6",letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.85,marginBottom:3}}>{weekday} · {dayNum}. {monthYear}</div>
            <div style={{fontSize:18,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.01em"}}>{booking.type}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
            <div style={{fontSize:8,color:"#F8F5E6",letterSpacing:"0.1em",fontWeight:700,fontFamily:"'Poppins',sans-serif",opacity:0.75,marginBottom:2}}>BELØB</div>
            <div style={{fontSize:18,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif"}}>{fmt(booking.bandPay)} kr.</div>
          </div>
        </div>
        <div style={{borderTop:`2px dashed ${T.black}`}}/>
        <div style={{padding:"16px 18px 28px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:T.subText,cursor:"pointer",fontSize:22,lineHeight:1,padding:0}}>×</button>
          <div style={{fontSize:9,color:stubColor,letterSpacing:"0.14em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:3}}>NA ALIAS</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif",marginBottom:14}}>{[booking.city,booking.address].filter(Boolean).join(" · ")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px",marginBottom:14}}>
            <Fld label="ANKOMST" value={booking.arrival}/>
            <Fld label="SPILLETID" value={booking.playTime}/>
            <Fld label="SÆT" value={booking.sets}/>
            <Fld label="BEMANDING" value={booking.musicians?`${booking.musicians} musikere`:null}/>
            <Fld label="BIL + GEAR" value={carGearVal}/>
            <Fld label="BOOKER" value={booking.booker} color="#8B3FA8" weight={700}/>
            <Fld label="KONTAKTPERSON" value={booking.contact}/>
            <Fld label="TELEFON" value={booking.phone}/>
            <Fld label="BOOKING (KR)" value={booking.bookingFee?fmt(booking.bookingFee):null} color={T.orange} weight={700}/>
          </div>
          {booking.notes&&<div style={{padding:"8px 10px",background:T.black,borderLeft:`3px solid ${stubColor}`,borderRadius:4,fontSize:14,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{booking.notes}</div>}
        </div>
      </div>
    </div>,
    document.body
  ):null;
}

// ── Atoms ──────────────────────────────────────────────────────────────────
const NAStar=({size=16,color,opacity=1})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{opacity,flexShrink:0}}>
    <line x1="12" y1="1" x2="12" y2="23" stroke={color} strokeWidth="1.4"/>
    <line x1="1" y1="12" x2="23" y2="12" stroke={color} strokeWidth="1.4"/>
    <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" stroke={color} strokeWidth="1"/>
    <line x1="20.5" y1="3.5" x2="3.5" y2="20.5" stroke={color} strokeWidth="1"/>
  </svg>
);

function PwInput({value,onChange,onKeyDown,T}){
  const [show,setShow]=useState(false);
  return(<div style={{position:"relative"}}>
    <input type={show?"text":"password"} value={value} onChange={onChange} onKeyDown={onKeyDown}
      style={{width:"100%",padding:"11px 40px 11px 14px",background:T.black,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Poppins',sans-serif"}}/>
    <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,padding:0,lineHeight:1}}>{show?"🙈":"👁"}</button>
  </div>);
}

function UserChip({user,active,T}){
  const [open,setOpen]=useState(false);
  const color=userColor(user);
  return(<>
    <span onClick={e=>{e.stopPropagation();setOpen(true);}} title={`${user.first} ${user.last}`}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:6,
        background:active?color:"#2A262833",border:`1px solid ${active?color+"55":color+"22"}`,color:active?"#F8F5E6":color+"77",
        fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",cursor:"pointer",flexShrink:0,userSelect:"none",
        filter:active?"none":"blur(1.5px) grayscale(40%)",opacity:active?1:0.5,transition:"all .2s"}}>
      {user.initials}
    </span>
    {open&&typeof document!=="undefined"&&createPortal(
      <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setOpen(false)}>
        <div style={{background:T.dim,border:`1px solid ${color}33`,borderRadius:16,padding:28,minWidth:260,maxWidth:340}} onClick={e=>e.stopPropagation()}>
          <div style={{border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,background:color,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{user.initials}</div>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{user.first} {user.last}</div>
                <div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:3}}>{user.instrument||"–"}</div>
              </div>
            </div>
          </div>
          {user.phone&&<div style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}><span style={{fontSize:11,color:T.subText,minWidth:60,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>Telefon</span><span style={{fontSize:13,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif",flex:1,minWidth:0,wordBreak:"break-all"}}>{user.phone}</span></div>}
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:11,color:T.subText,minWidth:60,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>Email</span><span style={{fontSize:13,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif",flex:1,minWidth:0,wordBreak:"break-all"}}>{user.email}</span></div>
          <button onClick={()=>setOpen(false)} style={{marginTop:20,width:"100%",padding:"8px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,letterSpacing:"0.2em",fontWeight:600}}>LUK</button>
        </div>
      </div>,
      document.body
    )}
  </>);
}

function PayBadge({amount,color}){
  const br=PAY_BRACKETS.find(b=>b.pay===amount)||PAY_BRACKETS.slice(-1)[0];
  const c=color||br.color;
  return <span style={{background:c+"22",border:`1px solid ${c}55`,color:c,borderRadius:2,padding:"2px 9px",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>{fmt(amount)}</span>;
}

function Btn({children,onClick,color,style={},small=false,disabled=false}){
  const [h,setH]=useState(false);
  return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{padding:small?"5px 14px":"9px 20px",background:h&&!disabled?color+"dd":color,border:"none",color:"#F8F5E6",fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Poppins',sans-serif",fontSize:small?10:11,letterSpacing:"0.07em",transition:"all .15s",borderRadius:8,opacity:disabled?0.6:1,...style}}>
    {children}
  </button>;
}

function Modal({title,children,onClose,T,wide=false}){
  return(<div style={{position:"fixed",inset:0,background:"#000d",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
    <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:16,width:wide?700:440,maxWidth:"96vw",padding:28,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.orange,fontFamily:"'Poppins',sans-serif"}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
      </div>
      {children}
    </div>
  </div>);
}

function Field({label,children,T}){
  return(<div style={{marginBottom:14}}>
    <label style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",display:"block",marginBottom:5,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>{label}</label>
    {children}
  </div>);
}

function Inp({value,onChange,type="text",placeholder="",T}){
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",padding:"10px 12px",background:T.black,border:`1px solid ${T.border}`,color:T.white,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Poppins',sans-serif",borderRadius:0}}/>;
}

function YearTabs({value,onChange,T,years}){
  return(<div style={{display:"flex",gap:8,marginBottom:20}}>
    {years.map(y=>(<button key={y} onClick={()=>onChange(y)}
      style={{flex:1,padding:"10px",background:value===y?T.orange:T.dim,border:`1px solid ${value===y?T.orange:T.border}`,borderRadius:10,color:value===y?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontWeight:value===y?700:400,fontSize:14,transition:"all .15s"}}>
      {y}
    </button>))}
  </div>);
}

function NotePopup({note,T}){
  const [open,setOpen]=useState(false);
  if(!note||note==="")return <span style={{color:T.border,fontSize:11}}>–</span>;
  return(<>
    <span onClick={e=>{e.stopPropagation();setOpen(true);}} style={{cursor:"pointer",color:T.orange,fontSize:11,borderBottom:`1px dotted ${T.orange}55`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:90,display:"inline-block"}} title={note}>
      {note.length>12?note.slice(0,12)+"…":note}
    </span>
    {open&&(<div style={{position:"fixed",inset:0,background:"#000d",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setOpen(false)}>
      <div style={{background:"#1E1C1D",border:`1px solid ${T.orange}55`,padding:28,minWidth:280,maxWidth:400,boxShadow:"0 16px 48px #0009"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:9,color:T.orange,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:12}}>NOTE</div>
        <div style={{fontSize:14,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",lineHeight:1.7}}>{note}</div>
        <button onClick={()=>setOpen(false)} style={{marginTop:20,width:"100%",padding:"8px",background:"transparent",border:"1px solid #2E2B2C",color:"#6B6468",cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,letterSpacing:"0.08em"}}>LUK</button>
      </div>
    </div>)}
  </>);
}

// ── Underline inputs for sidebar modals ───────────────────────────────────
function UlField({label,children,T}){
  return(<div style={{marginBottom:20}}>
    <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>{label}</div>
    {children}
  </div>);
}
function UlInp({value,onChange,type="text",placeholder="",T}){
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${T.border}`,outline:"none",color:T.white,fontSize:15,fontFamily:"'Poppins',sans-serif",padding:"6px 0",boxSizing:"border-box"}}/>;
}

// ── Booking Edit Modal (sidebar design) ───────────────────────────────────
function BookingEditModal({booking,users,onSave,onDelete,onClose,T}){
  const [form,setForm]=useState({...booking,bandPay:String(booking.bandPay)});
  const [section,setSection]=useState("detaljer");
  const [askDel,setAskDel]=useState(false);
  const [isSaving,setIsSaving]=useState(false);
  const [saveSuccess,setSaveSuccess]=useState(false);
  const [saveError,setSaveError]=useState(null);
  const winW=useWindowWidth();
  const isMobile=winW<768;
  useEffect(()=>{
    const handler=e=>{if(isSaving){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',handler);
    return()=>window.removeEventListener('beforeunload',handler);
  },[isSaving]);
  const memberUsers=sortMusicians(users.filter(u=>u.musicianId&&u.subType!=="substitute"&&u.subType!=="alias"));
  const subUsers=users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId);
  const toggleMember=mid=>setForm(p=>{const has=p.memberIds.includes(mid);return{...p,memberIds:has?p.memberIds.filter(x=>x!==mid):[...p.memberIds,mid]};});
  const toggleSub=mid=>setForm(p=>{const has=p.substituteIds.includes(mid);return{...p,substituteIds:has?p.substituteIds.filter(x=>x!==mid):[...p.substituteIds,mid]};});
  const dateStr=booking.date?new Date(booking.date).toLocaleDateString("da-DK",{day:"2-digit",month:"short"}):"";
  const SECS=[{id:"detaljer",label:"Detaljer"},{id:"bemanding",label:"Bemanding"},{id:"note",label:"Note"},{id:"historik",label:"Historik"}];

  if(askDel)return <ConfirmModal message="Dette job vil blive fjernet permanent." onConfirm={onDelete} onCancel={()=>setAskDel(false)} T={T}/>;
  if(typeof document==="undefined") return null;

  const renderSection=()=>{
    if(section==="detaljer") return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
        <UlField label="DATO" T={T}><UlInp value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} type="date" T={T}/></UlField>
        <UlField label="JOB TYPE" T={T}><UlInp value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} T={T}/></UlField>
        <UlField label="BY" T={T}><UlInp value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))} T={T}/></UlField>
        <UlField label="ADRESSE" T={T}><UlInp value={form.address||""} onChange={e=>setForm(p=>({...p,address:e.target.value}))} T={T}/></UlField>
        <UlField label="AFGANG" T={T}><UlInp value={form.departure||""} onChange={e=>setForm(p=>({...p,departure:e.target.value}))} placeholder="17:00" T={T}/></UlField>
        <UlField label="ANKOMST" T={T}><UlInp value={form.arrival||""} onChange={e=>setForm(p=>({...p,arrival:e.target.value}))} placeholder="18:30" T={T}/></UlField>
        <UlField label="SPILLETID" T={T}><UlInp value={form.playTime||""} onChange={e=>setForm(p=>({...p,playTime:e.target.value}))} placeholder="21:00–23:30" T={T}/></UlField>
        <UlField label="SÆT" T={T}><UlInp value={form.sets||""} onChange={e=>setForm(p=>({...p,sets:e.target.value}))} T={T}/></UlField>
        <UlField label="BELØB (kr)" T={T}><UlInp value={form.bandPay} onChange={e=>setForm(p=>({...p,bandPay:e.target.value}))} type="number" T={T}/></UlField>
        <UlField label="BOOKER" T={T}><UlInp value={form.booker||""} onChange={e=>setForm(p=>({...p,booker:e.target.value}))} T={T}/></UlField>
      </div>
    );
    if(section==="bemanding") return(<div>
      <div style={{fontSize:9,color:T.orange,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:10}}>MUSIKERE</div>
      {memberUsers.map(u=>{const isIn=form.memberIds.includes(u.musicianId);const c=userColor(u);
        return(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",marginBottom:4,background:T.black,border:`1px solid ${isIn?c+"44":T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:26,height:26,background:c+"22",border:`1px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif"}}>{u.initials}</span>
            <div style={{fontSize:13,color:T.white,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{u.first} {u.last}</div>
          </div>
          <button onClick={()=>toggleMember(u.musicianId)} style={{padding:"4px 10px",border:`1px solid ${isIn?T.green:T.red}`,background:isIn?T.green+"22":T.red+"18",color:isIn?T.green:T.red,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{isIn?"MED ✓":"FRAVÆRENDE"}</button>
        </div>);
      })}
      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:10,marginTop:16}}>VIKARER</div>
      {subUsers.map(u=>{const isIn=form.substituteIds.includes(u.musicianId);const c=userColor(u);
        return(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",marginBottom:4,background:T.black,border:`1px solid ${isIn?c+"44":T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:26,height:26,background:c+"22",border:`1px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif"}}>{u.initials}</span>
            <div><div style={{fontSize:13,color:T.white,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{u.first} {u.last}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{u.instrument}</div></div>
          </div>
          <button onClick={()=>toggleSub(u.musicianId)} style={{padding:"4px 10px",border:`1px solid ${isIn?T.green:T.border}`,background:isIn?T.green+"22":"transparent",color:isIn?T.green:T.muted,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{isIn?"MED ✓":"TILFØJ"}</button>
        </div>);
      })}
    </div>);
    if(section==="note") return(<UlField label="NOTE" T={T}>
      <textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
        style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${T.border}`,outline:"none",color:T.white,fontSize:14,fontFamily:"'Poppins',sans-serif",padding:"6px 0",boxSizing:"border-box",resize:"vertical",minHeight:120,display:"block"}}/>
    </UlField>);
    return(<div style={{color:T.border,fontFamily:"'Poppins',sans-serif",fontSize:12,padding:"20px 0"}}>Ingen ændringer endnu.</div>);
  };

  const sidebar=(sideW)=>(
    <div style={{width:sideW,background:T.black,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"24px 20px 16px"}}>
        <div style={{fontSize:14,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",lineHeight:1.2}}>{booking.type}</div>
        <div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:4}}>{dateStr}{booking.city?` · ${booking.city}`:""}</div>
      </div>
      <nav style={{padding:"0 12px",flex:1}}>
        {SECS.map(s=>(<button key={s.id} onClick={()=>setSection(s.id)}
          style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",marginBottom:2,background:section===s.id?T.orange:"transparent",borderRadius:8,border:"none",color:section===s.id?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:12,fontWeight:section===s.id?700:400,transition:"all .15s"}}>
          {s.label}
        </button>))}
      </nav>
      <div style={{padding:"16px 20px",borderTop:`1px solid ${T.border}55`}}>
        <div style={{fontSize:9,color:T.muted,fontFamily:"'Poppins',sans-serif",lineHeight:1.6}}>Ændringer gemmes når du klikker GEM</div>
      </div>
    </div>
  );

  const doSaveBooking=async()=>{
    setIsSaving(true);setSaveError(null);
    const payload={...form,bandPay:parseFloat(form.bandPay)||0};
    try{
      const res=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!res.ok){const d=await res.json();throw new Error(d.error||`Fejl ${res.status}`);}
      setSaveSuccess(true);
      setTimeout(()=>{setSaveSuccess(false);onSave(payload);},800);
    }catch(e){setSaveError(e.message||"Kunne ikke gemme. Prøv igen.");}
    finally{setIsSaving(false);}
  };
  const footer=(
    <div style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,background:T.dim,flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn onClick={()=>setAskDel(true)} color={T.red} small disabled={isSaving}>FJERN JOB</Btn>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onClose} color={T.muted} small disabled={isSaving}>ANNULLER</Btn>
          <Btn onClick={doSaveBooking} color={saveSuccess?T.green:T.orange} small disabled={isSaving||saveSuccess}>{isSaving?"GEMMER...":saveSuccess?"Gemt ✓":"GEM"}</Btn>
        </div>
      </div>
      {saveError&&<div style={{fontSize:11,color:T.red,marginTop:8,textAlign:"right",fontFamily:"'Poppins',sans-serif"}}>{saveError}</div>}
    </div>
  );

  if(isMobile){
    return createPortal(
      <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.dim,width:"100%",maxHeight:"95vh",display:"flex",flexDirection:"column",borderRadius:"16px 16px 0 0",position:"relative"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${T.border}`,padding:"0 4px",flexShrink:0}}>
            {SECS.map(s=>(<button key={s.id} onClick={()=>setSection(s.id)}
              style={{padding:"14px 18px",background:"transparent",border:"none",borderBottom:section===s.id?`2px solid ${T.orange}`:"2px solid transparent",color:section===s.id?T.orange:T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:section===s.id?700:400,letterSpacing:"0.08em",whiteSpace:"nowrap",flexShrink:0}}>
              {s.label}
            </button>))}
          </div>
          <div style={{padding:"16px 20px 0",flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{booking.type}</div>
            <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:2}}>{dateStr}{booking.city?` · ${booking.city}`:""}</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:20}}>{renderSection()}</div>
          {footer}
          {isSaving&&<div style={{position:"absolute",inset:0,background:"#000",opacity:0.5,pointerEvents:"all",zIndex:10,borderRadius:"16px 16px 0 0"}}/>}
        </div>
      </div>,
      document.body
    );
  }

  const sideW=winW>=1024?180:160;
  return createPortal(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.dim,width:winW>=1024?800:"90vw",maxWidth:"96vw",maxHeight:"90vh",display:"flex",flexDirection:"column",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px #0009",position:"relative"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",flex:1,minHeight:0}}>
          {sidebar(sideW)}
          <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
            <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>{renderSection()}</div>
            {footer}
          </div>
        </div>
        {isSaving&&<div style={{position:"absolute",inset:0,background:"#000",opacity:0.5,pointerEvents:"all",zIndex:10}}/>}
      </div>
    </div>,
    document.body
  );
}

// ── Alias Edit Modal (sidebar design) ─────────────────────────────────────
function AliasEditModal({booking,onSave,onDelete,onClose,T}){
  const [form,setForm]=useState({...booking,bandPay:String(booking.bandPay),bookingFee:String(booking.bookingFee||"")});
  const [section,setSection]=useState("detaljer");
  const [askDel,setAskDel]=useState(false);
  const [isSaving,setIsSaving]=useState(false);
  const [saveSuccess,setSaveSuccess]=useState(false);
  const [saveError,setSaveError]=useState(null);
  const winW=useWindowWidth();
  const isMobile=winW<768;
  useEffect(()=>{
    const handler=e=>{if(isSaving){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',handler);
    return()=>window.removeEventListener('beforeunload',handler);
  },[isSaving]);
  const dateStr=booking.date?new Date(booking.date).toLocaleDateString("da-DK",{day:"2-digit",month:"short"}):"";
  const SECS=[{id:"detaljer",label:"Detaljer"},{id:"ansvarlig",label:"Ansvarlig"},{id:"note",label:"Note"},{id:"historik",label:"Historik"}];

  if(askDel)return <ConfirmModal message="Dette alias-job vil blive fjernet permanent og kan ikke fortrydes." onConfirm={onDelete} onCancel={()=>setAskDel(false)} T={T}/>;
  if(typeof document==="undefined") return null;

  const renderSection=()=>{
    if(section==="detaljer") return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
        <UlField label="DATO" T={T}><UlInp value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} type="date" T={T}/></UlField>
        <UlField label="JOB TYPE" T={T}><UlInp value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} T={T}/></UlField>
        <UlField label="BY" T={T}><UlInp value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))} T={T}/></UlField>
        <UlField label="ADRESSE" T={T}><UlInp value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} T={T}/></UlField>
        <UlField label="ANKOMST" T={T}><UlInp value={form.arrival} onChange={e=>setForm(p=>({...p,arrival:e.target.value}))} T={T}/></UlField>
        <UlField label="SPILLETID" T={T}><UlInp value={form.playTime} onChange={e=>setForm(p=>({...p,playTime:e.target.value}))} T={T}/></UlField>
        <UlField label="SÆT" T={T}><UlInp value={form.sets} onChange={e=>setForm(p=>({...p,sets:e.target.value}))} T={T}/></UlField>
        <UlField label="BEMANDING" T={T}><UlInp value={String(form.musicians||"")} onChange={e=>setForm(p=>({...p,musicians:e.target.value}))} type="number" T={T}/></UlField>
        <UlField label="BELØB (kr)" T={T}><UlInp value={form.bandPay} onChange={e=>setForm(p=>({...p,bandPay:e.target.value}))} type="number" T={T}/></UlField>
        <UlField label="BOOKING (kr)" T={T}><UlInp value={form.bookingFee} onChange={e=>setForm(p=>({...p,bookingFee:e.target.value}))} type="number" T={T}/></UlField>
        <UlField label="BIL + GEAR" T={T}>
          <select value={form.carGear?"ja":"nej"} onChange={e=>setForm(p=>({...p,carGear:e.target.value==="ja"}))}
            style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${T.border}`,outline:"none",color:T.white,fontSize:15,fontFamily:"'Poppins',sans-serif",padding:"6px 0",cursor:"pointer"}}>
            <option value="ja" style={{background:"#181719"}}>Ja</option><option value="nej" style={{background:"#181719"}}>Nej</option>
          </select>
        </UlField>
      </div>
    );
    if(section==="ansvarlig") return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
        <UlField label="ARRANGØR" T={T}><UlInp value={form.contact} onChange={e=>setForm(p=>({...p,contact:e.target.value}))} T={T}/></UlField>
        <UlField label="TELEFON" T={T}><UlInp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} T={T}/></UlField>
        <UlField label="BOOKER (fra HubSpot)" T={T}>
          <div style={{fontSize:15,color:T.muted,fontFamily:"'Poppins',sans-serif",padding:"6px 0",borderBottom:`1px solid ${T.border}44`}}>{form.booker||"–"}</div>
        </UlField>
      </div>
    );
    if(section==="note") return(<UlField label="NOTE" T={T}>
      <textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
        style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${T.border}`,outline:"none",color:T.white,fontSize:14,fontFamily:"'Poppins',sans-serif",padding:"6px 0",boxSizing:"border-box",resize:"vertical",minHeight:120,display:"block"}}/>
    </UlField>);
    return(<div style={{color:T.border,fontFamily:"'Poppins',sans-serif",fontSize:12,padding:"20px 0"}}>Ingen ændringer endnu.</div>);
  };

  const doSave=async()=>{
    setIsSaving(true);setSaveError(null);
    const payload={...form,bandPay:parseFloat(form.bandPay)||0,bookingFee:parseFloat(form.bookingFee)||0,carGear:form.carGear===true||form.carGear==="ja",musicians:parseInt(form.musicians)||0};
    try{
      const res=await fetch('/api/alias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||`Fejl ${res.status}`);}
      setSaveSuccess(true);
      setTimeout(()=>{setSaveSuccess(false);onSave(payload);},800);
    }catch(e){setSaveError(e.message||"Kunne ikke gemme. Prøv igen.");}
    finally{setIsSaving(false);}
  };

  const sidebar=(sideW)=>(
    <div style={{width:sideW,background:T.black,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"24px 20px 16px"}}>
        <div style={{fontSize:14,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",lineHeight:1.2}}>{booking.type}</div>
        <div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:4}}>{dateStr}{booking.city?` · ${booking.city}`:""}</div>
      </div>
      <nav style={{padding:"0 12px",flex:1}}>
        {SECS.map(s=>(<button key={s.id} onClick={()=>setSection(s.id)}
          style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",marginBottom:2,background:section===s.id?T.orange:"transparent",borderRadius:8,border:"none",color:section===s.id?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:12,fontWeight:section===s.id?700:400,transition:"all .15s"}}>
          {s.label}
        </button>))}
      </nav>
      <div style={{padding:"16px 20px",borderTop:`1px solid ${T.border}55`}}>
        <div style={{fontSize:9,color:T.muted,fontFamily:"'Poppins',sans-serif",lineHeight:1.6}}>Ændringer gemmes når du klikker GEM</div>
      </div>
    </div>
  );

  const footer=(
    <div style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,background:T.dim,flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn onClick={()=>setAskDel(true)} color={T.red} small disabled={isSaving}>FJERN JOB</Btn>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onClose} color={T.muted} small disabled={isSaving}>ANNULLER</Btn>
          <Btn onClick={doSave} color={saveSuccess?T.green:T.orange} small disabled={isSaving||saveSuccess}>{isSaving?"GEMMER...":saveSuccess?"Gemt ✓":"GEM"}</Btn>
        </div>
      </div>
      {saveError&&<div style={{fontSize:11,color:T.red,marginTop:8,textAlign:"right",fontFamily:"'Poppins',sans-serif"}}>{saveError}</div>}
    </div>
  );

  if(isMobile){
    return createPortal(
      <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.dim,width:"100%",maxHeight:"95vh",display:"flex",flexDirection:"column",borderRadius:"16px 16px 0 0",position:"relative"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${T.border}`,padding:"0 4px",flexShrink:0}}>
            {SECS.map(s=>(<button key={s.id} onClick={()=>setSection(s.id)}
              style={{padding:"14px 18px",background:"transparent",border:"none",borderBottom:section===s.id?`2px solid ${T.orange}`:"2px solid transparent",color:section===s.id?T.orange:T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:section===s.id?700:400,letterSpacing:"0.08em",whiteSpace:"nowrap",flexShrink:0}}>
              {s.label}
            </button>))}
          </div>
          <div style={{padding:"16px 20px 0",flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{booking.type}</div>
            <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:2}}>{dateStr}{booking.city?` · ${booking.city}`:""}</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:20}}>{renderSection()}</div>
          {footer}
          {isSaving&&<div style={{position:"absolute",inset:0,background:"#000",opacity:0.5,pointerEvents:"all",zIndex:10,borderRadius:"16px 16px 0 0"}}/>}
        </div>
      </div>,
      document.body
    );
  }

  const sideW=winW>=1024?180:160;
  return createPortal(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.dim,width:winW>=1024?800:"90vw",maxWidth:"96vw",maxHeight:"90vh",display:"flex",flexDirection:"column",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px #0009",position:"relative"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",flex:1,minHeight:0}}>
          {sidebar(sideW)}
          <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
            <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>{renderSection()}</div>
            {footer}
          </div>
        </div>
        {isSaving&&<div style={{position:"absolute",inset:0,background:"#000",opacity:0.5,pointerEvents:"all",zIndex:10}}/>}
      </div>
    </div>,
    document.body
  );
}

// ── BOOKINGS ───────────────────────────────────────────────────────────────
function BookingsView({currentUser,bookings,setBookings,users,T,darkMode}){
  const isAdmin=currentUser.role==="admin";
  const isSub=hasVikar(currentUser)&&!isAdmin;
  const [yr,setYr]=useState(CUR_YEAR);
  const [detailBooking,setDetailBooking]=useState(null);
  const [editingBooking,setEditingBooking]=useState(null);
  const winW=useWindowWidth();
  const isMobile=winW<768;
  const isTablet=winW<1400;
  const visibleBookings=isAdmin?bookings:bookings.filter(b=>b.memberIds.includes(currentUser.musicianId)||b.substituteIds.includes(currentUser.musicianId));
  const filtered=useMemo(()=>visibleBookings.filter(b=>getYear(b.date)===yr),[visibleBookings,yr]);
  const [filter,setFilter]=useState("all");
  const pastCount=filtered.filter(b=>isPast(b.date)).length;
  const upcomingCount=filtered.length-pastCount;
  const visible=filtered.filter(b=>{if(filter==="upcoming")return !isPast(b.date);if(filter==="past")return isPast(b.date);return true;});

  const memberUsers=sortMusicians(users.filter(u=>u.musicianId&&u.subType!=="substitute"&&u.subType!=="alias"));
  const subUsers=sortMusicians(users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId));
  const getUserByMid=mid=>users.find(u=>u.musicianId===mid);

  const myJobs=filtered.filter(b=>b.memberIds.includes(currentUser.musicianId)||b.substituteIds.includes(currentUser.musicianId));
  const totalBand=filtered.reduce((s,b)=>s+b.bandPay,0);
  const totalMPay=filtered.reduce((s,b)=>s+calcMusicianPay(b.bandPay),0);
  const myEarned=myJobs.reduce((s,b)=>{const inSub=b.substituteIds.includes(currentUser.musicianId)&&!b.memberIds.includes(currentUser.musicianId);return s+(inSub?calcSubPay(calcMusicianPay(b.bandPay)):calcMusicianPay(b.bandPay));},0);

  const [absent,setAbsent]=useState(new Set());
  const toggleAbsent=(bid)=>{
    setAbsent(prev=>{const n=new Set(prev);if(n.has(bid))n.delete(bid);else n.add(bid);return n;});
  };

  const oA=darkMode?"#D4622A":"#C4521F";
  const statItems=isAdmin
    ?[{l:"ANTAL JOBS",v:filtered.length},{l:"TOTAL BELØB",v:fmt(totalBand)},{l:"TOTAL LØN (1 MUSIKER)",v:fmt(totalMPay)}]
    :[{l:"JOBS I ALT",v:filtered.length},{l:"MINE JOBS",v:myJobs.length},{l:isSub?"VIKAR LØN":"TOTAL LØN",v:fmt(myEarned)}];

  return(<div>
    <YearTabs value={yr} onChange={setYr} T={T} years={YEAR_OPTS}/>
    <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`,gap:8,marginBottom:16}}>
      {statItems.map(s=>(<div key={s.l} style={{background:T.dim,borderRadius:12,padding:isMobile?"12px 14px":"16px 20px"}}>
        <div style={{fontSize:isMobile?9:11,color:T.muted,letterSpacing:"0.1em",marginBottom:4,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>{s.l}</div>
        <div style={{fontSize:isMobile?18:26,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.02em"}}>{s.v}</div>
      </div>))}
    </div>

    <div style={{display:"flex",gap:4,marginBottom:16,background:T.dim,padding:4,borderRadius:10,width:"fit-content",border:`1px solid ${T.border}`}}>
      {[{id:"all",label:`ALLE · ${filtered.length}`},{id:"upcoming",label:`KOMMENDE · ${upcomingCount}`},{id:"past",label:`AFHOLDTE · ${pastCount}`}].map(f=>{
        const active=filter===f.id;
        return(<button key={f.id} onClick={()=>setFilter(f.id)}
          style={{padding:"8px 18px",background:active?T.orange:"transparent",border:"none",borderRadius:7,color:active?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.06em",transition:"all .15s"}}>
          {f.label}
        </button>);
      })}
    </div>

    {/* Card view — single column all screen sizes */}
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {visible.map(b=>{
        const past=isPast(b.date);
        const mp=calcMusicianPay(b.bandPay);
        const sp=calcSubPay(mp);
        const pay=isSub?sp:mp;
        const iAmIn=b.memberIds.includes(currentUser.musicianId)||b.substituteIds.includes(currentUser.musicianId);
        const isMyJob=isAdmin||iAmIn;
        const isAbsent=!isAdmin&&absent.has(b.id);
        const br=PAY_BRACKETS.find(x=>x.pay===pay)||PAY_BRACKETS.slice(-1)[0];
        const weekday=new Date(b.date).toLocaleDateString("da-DK",{weekday:"short"}).toUpperCase();
        const dateStr=new Date(b.date).toLocaleDateString("da-DK",{day:"2-digit",month:"short"});
        return(
          <div key={b.id} onClick={()=>setDetailBooking(b)}
            style={{background:T.dim,borderRadius:12,overflow:"hidden",display:"flex",cursor:"pointer",opacity:past?0.65:isAbsent?0.45:isMyJob?1:0.3,position:"relative"}}>
            <div style={{width:5,background:past?oA:isMyJob?br.color:T.border,flexShrink:0}}/>
            <div style={{padding:isMobile?"12px 14px":"14px 20px",display:"flex",alignItems:"center",gap:isMobile?12:20,flex:1,minWidth:0}}>
              <div style={{textAlign:"center",flexShrink:0,minWidth:isMobile?40:52}}>
                <div style={{fontSize:isMobile?9:10,color:past?oA:T.muted,fontWeight:700,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif"}}>{weekday}</div>
                <div style={{fontSize:isMobile?20:26,fontWeight:800,color:past?T.muted:T.white,fontFamily:"'Poppins',sans-serif",lineHeight:1}}>{dateStr.split(" ")[0]}</div>
                <div style={{fontSize:isMobile?10:11,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{dateStr.split(" ")[1]}</div>
              </div>
              <div style={{width:1,alignSelf:"stretch",background:T.border,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:isMobile?13:15,fontWeight:700,color:past?T.muted:T.white,fontFamily:"'Poppins',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.type}</div>
                <div style={{fontSize:isMobile?11:12,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {[b.city,b.playTime,b.booker].filter(Boolean).join(" · ")}
                </div>
              </div>
              {!isMobile&&!isSub&&(
                <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  {past&&<span style={{fontSize:8,color:oA,fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",background:oA+"18",padding:"3px 8px",borderRadius:4,marginRight:4}}>AFHOLDT</span>}
                  {!past&&isAbsent&&<span style={{fontSize:8,color:T.red,fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",background:T.red+"18",padding:"3px 8px",borderRadius:4,marginRight:4}}>FRAVÆRENDE</span>}
                  {memberUsers.map(u=><UserChip key={u.id} user={u} active={b.memberIds.includes(u.musicianId)} T={T}/>)}
                </div>
              )}
              <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                <div style={{fontSize:isMobile?14:16,fontWeight:800,color:isAdmin?T.orange:br.color,fontFamily:"'Poppins',sans-serif"}}>{isAdmin?fmt(b.bandPay):fmt(pay)}</div>
                {!isAdmin&&!past&&b.memberIds.includes(currentUser.musicianId)&&(
                  <button onClick={e=>{e.stopPropagation();toggleAbsent(b.id);}}
                    style={{padding:"4px 10px",border:`1px solid ${isAbsent?T.green:T.red}`,background:isAbsent?T.green+"22":T.red+"18",color:isAbsent?T.green:T.red,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif",borderRadius:6}}>
                    {isAbsent?"MELD PÅ":"MELD FRAVÆRENDE"}
                  </button>
                )}
                {isAdmin&&(
                  <button onClick={e=>{e.stopPropagation();setEditingBooking(b);}}
                    style={{padding:"4px 10px",border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif",borderRadius:6}}>
                    REDIGER
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {visible.length===0&&<div style={{padding:"32px 16px",textAlign:"center",color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:13}}>Ingen jobs dette år</div>}
    </div>

    {detailBooking&&<JobDetailPopup booking={detailBooking} users={users} isSub={isSub} isAdmin={isAdmin} T={T} onClose={()=>setDetailBooking(null)}/>}
    {editingBooking&&<BookingEditModal booking={editingBooking} users={users}
      onSave={u=>{setBookings(prev=>prev.map(b=>b.id===u.id?u:b));setEditingBooking(null);}}
      onDelete={()=>{setBookings(prev=>prev.filter(b=>b.id!==editingBooking.id));setEditingBooking(null);}}
      onClose={()=>setEditingBooking(null)} T={T}/>}
  </div>);
}

// ── ALIAS VIEW ─────────────────────────────────────────────────────────────
function AliasView({currentUser,aliasData,setAliasData,users,T,darkMode}){
  const isAdmin=currentUser.role==="admin";
  const aliasManagers=users.filter(u=>u.tags?.includes("alias_manager")).sort((a,b)=>a.first.localeCompare(b.first));
  const visibleManagers=isAdmin?aliasManagers:aliasManagers.filter(m=>m.id===currentUser.id);
  const [selManager,setSelManager]=useState(visibleManagers[0]?.id||null);
  const [yr,setYr]=useState(CUR_YEAR);
  const [detailBooking,setDetailBooking]=useState(null);
  const [editModal,setEditModal]=useState(null);

  const managerBookings=useMemo(()=>(aliasData[selManager]||[]).filter(b=>getYear(b.date)===yr).sort((a,b)=>new Date(a.date)-new Date(b.date)),[aliasData,selManager,yr]);
  const [filter,setFilter]=useState("all");
  const pastCount=managerBookings.filter(b=>isPast(b.date)).length;
  const upcomingCount=managerBookings.length-pastCount;
  const visible=managerBookings.filter(b=>{if(filter==="upcoming")return !isPast(b.date);if(filter==="past")return isPast(b.date);return true;});
  const totalPay=managerBookings.reduce((s,b)=>s+b.bandPay,0);
  const totalBook=managerBookings.reduce((s,b)=>s+(b.bookingFee||0),0);

  const saveEdit=updated=>{
    setAliasData(prev=>({...prev,[selManager]:(prev[selManager]||[]).map(b=>b.id===updated.id?updated:b)}));
    setEditModal(null);
  };
  const doDelete=id=>{setAliasData(prev=>({...prev,[selManager]:(prev[selManager]||[]).filter(b=>b.id!==id)}));setEditModal(null);};

  const oA=darkMode?"#D4622A":"#C4521F";
  const hd={padding:"9px 12px",textAlign:"left",color:T.muted,fontSize:11,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",whiteSpace:"nowrap",fontWeight:600};
  const winW=useWindowWidth();
  const isMobile=winW<768;
  const isTablet=winW<1400;
  if(!selManager)return <div style={{color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:14,padding:20}}>Ingen alias-visning tilgængelig.</div>;

  return(<div>
    {isAdmin&&visibleManagers.length>1&&(
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {visibleManagers.map(m=>{const c=userColor(m);const active=selManager===m.id;
          return(<button key={m.id} onClick={()=>setSelManager(m.id)}
            style={{padding:"9px 18px",background:active?c+"22":T.dim,border:`1px solid ${active?c:T.border}`,borderRadius:10,color:active?c:T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontWeight:active?700:400,fontSize:12,transition:"all .15s"}}>
            {m.first} {m.last}
          </button>);
        })}
      </div>
    )}
    <YearTabs value={yr} onChange={setYr} T={T} years={YEAR_OPTS}/>
    <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`,gap:8,marginBottom:20}}>
      {[{l:"ANTAL JOBS",v:managerBookings.length},{l:"TOTAL BELØB",v:fmt(totalPay)},{l:"TOTAL BOOKING",v:fmt(totalBook)}].map(s=>(
        <div key={s.l} style={{background:T.dim,borderRadius:12,padding:isMobile?"12px 14px":"16px 20px"}}>
          <div style={{fontSize:isMobile?9:11,color:T.muted,letterSpacing:"0.1em",marginBottom:4,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>{s.l}</div>
          <div style={{fontSize:isMobile?18:26,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.02em"}}>{s.v}</div>
        </div>
      ))}
    </div>

    <div style={{display:"flex",gap:4,marginBottom:16,background:T.dim,padding:4,borderRadius:10,width:"fit-content",border:`1px solid ${T.border}`}}>
      {[{id:"all",label:`ALLE · ${managerBookings.length}`},{id:"upcoming",label:`KOMMENDE · ${upcomingCount}`},{id:"past",label:`AFHOLDTE · ${pastCount}`}].map(f=>{
        const active=filter===f.id;
        return(<button key={f.id} onClick={()=>setFilter(f.id)}
          style={{padding:"8px 18px",background:active?T.orange:"transparent",border:"none",borderRadius:7,color:active?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.06em",transition:"all .15s"}}>
          {f.label}
        </button>);
      })}
    </div>

    {/* Alias cards — Design C */}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {visible.map(b=>{
        const past=isPast(b.date);
        const weekday=new Date(b.date).toLocaleDateString("da-DK",{weekday:"short"}).toUpperCase();
        const dateStr=new Date(b.date).toLocaleDateString("da-DK",{day:"2-digit",month:"short"});
        return(
          <div key={b.id} onClick={()=>setDetailBooking(b)}
            style={{background:T.dim,borderRadius:12,overflow:"hidden",display:"flex",cursor:"pointer",opacity:past?0.65:1,position:"relative"}}>
            <div style={{width:5,background:past?oA:T.orange,flexShrink:0}}/>
            <div style={{padding:isMobile?"12px 14px":"14px 20px",display:"flex",alignItems:"center",gap:isMobile?12:20,flex:1,minWidth:0}}>
              <div style={{textAlign:"center",flexShrink:0,minWidth:isMobile?40:52}}>
                <div style={{fontSize:isMobile?9:10,color:past?oA:T.muted,fontWeight:700,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif"}}>{weekday}</div>
                <div style={{fontSize:isMobile?20:26,fontWeight:800,color:past?T.muted:T.white,fontFamily:"'Poppins',sans-serif",lineHeight:1}}>{dateStr.split(" ")[0]}</div>
                <div style={{fontSize:isMobile?10:11,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{dateStr.split(" ")[1]}</div>
              </div>
              <div style={{width:1,alignSelf:"stretch",background:T.border,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:isMobile?13:15,fontWeight:700,color:past?T.muted:T.white,fontFamily:"'Poppins',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.type}</div>
                <div style={{fontSize:isMobile?11:12,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {[b.city,b.playTime,b.booker].filter(Boolean).join(" · ")}
                </div>
              </div>
              {past&&<div style={{flexShrink:0,display:"flex",alignItems:"center"}}><span style={{fontSize:8,color:oA,fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",background:oA+"18",padding:"3px 8px",borderRadius:4}}>AFHOLDT</span></div>}
              <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                <div style={{fontSize:isMobile?14:16,fontWeight:800,color:T.orange,fontFamily:"'Poppins',sans-serif"}}>{fmt(b.bandPay)}</div>
                {isAdmin&&<button onClick={e=>{e.stopPropagation();setEditModal(b);}} style={{padding:"4px 10px",border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif",borderRadius:6}}>REDIGER</button>}
              </div>
            </div>
          </div>
        );
      })}
      {visible.length===0&&<div style={{padding:"32px 16px",textAlign:"center",color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:13}}>Ingen jobs dette år</div>}
    </div>

    {detailBooking&&<AliasDetailPopup booking={detailBooking} T={T} onClose={()=>setDetailBooking(null)}/>}
    {editModal&&<AliasEditModal booking={editModal} onSave={saveEdit} onDelete={()=>doDelete(editModal.id)} onClose={()=>setEditModal(null)} T={T}/>}
  </div>);
}

// ── PAYROLL ────────────────────────────────────────────────────────────────
function PayrollView({currentUser,bookings,payments,setPayments,users,T}){
  const isAdmin=currentUser.role==="admin";
  const isSub=hasVikar(currentUser)&&!isAdmin;
  const [yr,setYr]=useState(CUR_YEAR);
  const [group,setGroup]=useState(isSub?"substitutes":isAdmin?"members":"members");
  const [selIds,setSelIds]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [addTarget,setAddTarget]=useState(null);
  const [na,setNa]=useState("");const [nn,setNn]=useState("");const [nd,setNd]=useState("");
  const [confirmRemove,setConfirmRemove]=useState(null);
  const winW=useWindowWidth();
  const isMobile=winW<768;
  const [payTab,setPayTab]=useState("jobs");

  const memberUsers=sortMusicians(users.filter(u=>u.subType==="member"&&u.musicianId));
  const ownerUsers =sortMusicians(users.filter(u=>u.subType==="owner"&&u.musicianId));
  const subUsers   =sortMusicians(users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId));

  const groupUsers=isSub?subUsers.filter(u=>u.id===currentUser.id):!isAdmin?memberUsers.filter(u=>u.id===currentUser.id):group==="members"?memberUsers:group==="owners"?ownerUsers:subUsers;
  const displayUsers=isAdmin&&selIds?groupUsers.filter(u=>selIds.includes(u.id)):groupUsers;
  const jobsForYear=bookings.filter(b=>isPast(b.date)&&getYear(b.date)===yr);

  const addPayment=()=>{
    if(!na||!nn||!addTarget)return;
    const e2={id:`p${Date.now()}`,date:nd||new Date().toISOString().slice(0,10),amount:parseFloat(na),note:nn};
    setPayments(prev=>({...prev,[addTarget]:[...(prev[addTarget]||[]),e2]}));
    setNa("");setNn("");setNd("");setShowAdd(false);setAddTarget(null);
  };
  const removePay=async(mid,pid)=>{await fetch(`/api/payments?id=${pid}`,{method:"DELETE"}).catch(()=>{});setPayments(prev=>({...prev,[mid]:(prev[mid]||[]).filter(p=>p.id!==pid)}));setConfirmRemove(null);};
  const tabSt=active=>({padding:"10px 20px",background:active?T.orange:"transparent",border:`1px solid ${active?T.orange:T.border}`,borderRadius:10,color:active?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,letterSpacing:"0.08em",fontWeight:active?700:400,transition:"all .15s"});

  return(<div>
    <YearTabs value={yr} onChange={setYr} T={T} years={YEAR_OPTS}/>
    {isAdmin&&(<div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {[{id:"members",l:"NORTH AVENUE"},{id:"owners",l:"EJERE"},{id:"substitutes",l:"VIKARER"}].map(g=>(<button key={g.id} onClick={()=>{setGroup(g.id);setSelIds(null);}} style={tabSt(group===g.id)}>{g.l}</button>))}
    </div>)}
    {isAdmin&&groupUsers.length>1&&(<div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
      {groupUsers.map(u=>{const c=userColor(u);const active=!selIds||selIds.includes(u.id);
        return(<button key={u.id} onClick={()=>{
          if(!selIds){setSelIds([u.id]);return;}
          const next=selIds.includes(u.id)?selIds.filter(x=>x!==u.id):[...selIds,u.id];
          setSelIds(next.length===0||next.length===groupUsers.length?null:next);
        }} style={{padding:"7px 16px",border:`1px solid ${active?c:T.border}`,borderRadius:20,background:active?c+"22":"transparent",color:active?c:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Poppins',sans-serif",transition:"all .15s"}}>{u.first}</button>);
      })}
    </div>)}

    {displayUsers.map(u=>{
      const isOwner=u.subType==="owner";const isSubU=hasVikar(u)&&!u.isAdmin;
      const jobs=jobsForYear.filter(b=>b.memberIds.includes(u.musicianId)||b.substituteIds?.includes(u.musicianId));
      const earned=isOwner?jobs.length*OWNER_PAY:jobs.reduce((s,b)=>{const inSub=b.substituteIds?.includes(u.musicianId)&&!b.memberIds.includes(u.musicianId);return s+(inSub?calcSubPay(calcMusicianPay(b.bandPay)):calcMusicianPay(b.bandPay));},0);
      const myPay=(payments[u.musicianId]||[]).filter(p=>getYear(p.date)===yr).sort((a,b)=>new Date(a.date)-new Date(b.date));
      const paid=myPay.reduce((s,p)=>s+p.amount,0);
      const balance=earned+paid;const color=userColor(u);
      return(<div key={u.id} style={{marginBottom:24}}>
        <div style={{background:T.dim,borderRadius:12,overflow:"hidden",display:"flex",marginBottom:12}}>
          <div style={{width:5,background:color,flexShrink:0}}/>
          <div style={{padding:"18px 22px",display:"flex",gap:24,flexWrap:"wrap",alignItems:"center",flex:1}}>
            <div>
              <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",marginBottom:4}}>MUSIKER</div>
              <div style={{fontSize:22,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.02em",lineHeight:1.1}}>{u.first} {u.last}</div>
              <div style={{fontSize:11,color:T.subText,marginTop:4,fontFamily:"'Poppins',sans-serif"}}>{u.instrument} · {jobs.length} jobs{isOwner?` · ${fmt(OWNER_PAY)}/job`:""}</div>
            </div>
            <div style={{display:"flex",gap:24,marginLeft:"auto",flexWrap:"wrap",alignItems:"center"}}>
              {[{l:"OPTJENT",v:fmt(earned),c:T.green},{l:"UDBETALT",v:fmt(Math.abs(paid)),c:T.red},{l:"TIL GODE",v:fmt(balance),c:balance>=0?T.green:T.red}].map(s=>(<div key={s.l}>
                <div style={{fontSize:9,color:T.subText,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.02em"}}>{s.v}</div>
              </div>))}
              {isAdmin&&<Btn onClick={()=>{setAddTarget(u.musicianId);setShowAdd(true);}} color={T.orange} small style={{alignSelf:"center"}}>+ POST</Btn>}
            </div>
          </div>
        </div>
        {isMobile&&(<div style={{display:"flex",gap:6,marginBottom:8}}>
          <button onClick={()=>setPayTab("jobs")} style={{flex:1,padding:"9px",background:payTab==="jobs"?T.orange:"transparent",border:`1px solid ${payTab==="jobs"?T.orange:T.border}`,borderRadius:8,color:payTab==="jobs"?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,fontWeight:700}}>JOBS · {jobs.length}</button>
          <button onClick={()=>setPayTab("posts")} style={{flex:1,padding:"9px",background:payTab==="posts"?T.orange:"transparent",border:`1px solid ${payTab==="posts"?T.orange:T.border}`,borderRadius:8,color:payTab==="posts"?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,fontWeight:700}}>POSTER · {myPay.length}</button>
        </div>)}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          {(!isMobile||payTab==="jobs")&&<div>
            <div style={{fontSize:9,color:T.subText,letterSpacing:"0.12em",marginBottom:8,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>JOBS · {jobs.length}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {jobs.map(b=>{const mp=calcMusicianPay(b.bandPay);const inSub=b.substituteIds?.includes(u.musicianId)&&!b.memberIds.includes(u.musicianId);const pay=isOwner?OWNER_PAY:inSub?calcSubPay(mp):mp;
                return(<div key={b.id} style={{background:T.dim,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:12,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{b.type}</div><div style={{fontSize:10,color:T.subText,marginTop:2,fontFamily:"'Poppins',sans-serif"}}>{fmtDateShort(b.date)} · {b.city}</div></div>
                  <PayBadge amount={pay}/>
                </div>);
              })}
              {jobs.length===0&&<div style={{background:T.dim,borderRadius:8,padding:"16px 14px",textAlign:"center",color:T.muted,fontSize:12,fontFamily:"'Poppins',sans-serif"}}>Ingen afholdte jobs</div>}
            </div>
          </div>}
          {(!isMobile||payTab==="posts")&&<div>
            <div style={{fontSize:9,color:T.subText,letterSpacing:"0.12em",marginBottom:8,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>POSTER</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {myPay.map(p=>(<div key={p.id} style={{background:T.dim,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:12,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{p.note}</div><div style={{fontSize:10,color:T.subText,marginTop:2,fontFamily:"'Poppins',sans-serif"}}>{p.date}</div></div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,color:p.amount<0?T.red:T.green,fontSize:12}}>{fmt(p.amount)}</span>
                  {isAdmin&&<button onClick={()=>setConfirmRemove({mid:u.musicianId,pid:p.id,note:p.note})} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0}}>×</button>}
                </div>
              </div>))}
              {myPay.length===0&&<div style={{background:T.dim,borderRadius:8,padding:"16px 14px",textAlign:"center",color:T.muted,fontSize:12,fontFamily:"'Poppins',sans-serif"}}>Ingen poster</div>}
            </div>
          </div>}
        </div>
      </div>);
    })}

    {showAdd&&(<Modal title="TILFØJ POST" onClose={()=>{setShowAdd(false);setAddTarget(null);}} T={T}>
      <Field label="BELØB" T={T}><Inp value={na} onChange={e=>setNa(e.target.value)} type="number" placeholder="-1500" T={T}/></Field>
      <Field label="BESKRIVELSE" T={T}><Inp value={nn} onChange={e=>setNn(e.target.value)} placeholder="Januar leje" T={T}/></Field>
      <Field label="DATO" T={T}><Inp value={nd} onChange={e=>setNd(e.target.value)} type="date" T={T}/></Field>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
        <Btn onClick={()=>{setShowAdd(false);setAddTarget(null);}} color={T.muted} small>ANNULLER</Btn>
        <Btn onClick={addPayment} color={T.orange} small>GEM</Btn>
      </div>
    </Modal>)}
    {confirmRemove&&<ConfirmModal message={`Vil du fjerne posten "${confirmRemove.note}"?`} onConfirm={()=>removePay(confirmRemove.mid,confirmRemove.pid)} onCancel={()=>setConfirmRemove(null)} T={T}/>}
  </div>);
}

// ── INFO ───────────────────────────────────────────────────────────────────
function InfoView({currentUser,T}){
  const isSub=hasVikar(currentUser)&&!currentUser.isAdmin;
  const winW=useWindowWidth();
  const isMobile=winW<768;
  return(<div style={{maxWidth:760,display:"flex",flexDirection:"column",gap:12}}>
    {!isSub&&(<>
      <div style={{background:T.dim,borderRadius:12,padding:28}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><NAStar size={13} color={T.orange}/><span style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700}}>AFLØNNINGSPRINCIP</span></div>
        <p style={{fontSize:14,color:T.cardText,lineHeight:1.85,margin:0,fontFamily:"'Poppins',sans-serif"}}>
          Vi forsøger altid at give <strong style={{color:T.white}}>så meget i løn som muligt</strong> til alle medlemmer — ejer som musikere. Lønnen er dynamisk og afhænger af det pågældende job. Det sikrer, at et job rent faktisk kan bære sine omkostninger.
        </p>
      </div>
      <div style={{background:T.dim,borderRadius:12,padding:28}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><NAStar size={13} color={T.orange}/><span style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700}}>DEN DYNAMISKE FORDELING</span></div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:8,marginBottom:18}}>
          {PAY_BRACKETS.map(br=>(<div key={br.pay} style={{background:T.black,borderRadius:10,padding:"18px 16px",textAlign:"center",borderBottom:`3px solid ${br.color}`}}>
            <div style={{fontSize:9,color:br.color,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",marginBottom:8,fontWeight:700}}>{br.label.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:700,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{fmt(br.pay)}</div>
          </div>))}
        </div>
        <div style={{fontSize:13,color:T.muted,lineHeight:1.75,padding:"12px 16px",background:T.black,borderLeft:`3px solid ${T.orange}`,borderRadius:8,fontFamily:"'Poppins',sans-serif"}}>
          Det vil stadig være 3.000 kr i løn per job i langt de fleste tilfælde. De to ekstra trin sikrer en bedre sammenhæng for job der ellers ville ligge i en gråzone.
        </div>
      </div>
      <div style={{background:T.dim,padding:28}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><NAStar size={13} color={T.green}/><span style={{fontSize:9,color:T.green,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700}}>FORDELING AF ØKONOMI I UDGANGSPUNKT</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {COST_SPLIT.map((c,i)=>(<div key={i}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:13,color:i===3?T.cardText:T.subText,fontWeight:i===3?700:400,fontFamily:"'Poppins',sans-serif"}}>{c.label}</span>
              <span style={{fontFamily:"'Poppins',sans-serif",fontSize:14,color:i===3?T.green:i===4?T.orange:T.subText,fontWeight:700}}>{c.pct}%</span>
            </div>
            <div style={{height:3,background:T.black}}><div style={{height:"100%",width:`${c.pct/0.625}%`,background:i===3?T.green:i===4?T.orange:T.border}}/></div>
            {c.note&&<div style={{fontSize:10,color:T.subText,marginTop:3,fontFamily:"'Poppins',sans-serif"}}>{c.note}</div>}
          </div>))}
        </div>
      </div>
    </>)}
    {isSub&&(<div style={{background:T.dim,padding:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><NAStar size={13} color={T.orange}/><span style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700}}>LØNNIVEAUER · VIKARER</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:1,background:T.border,marginBottom:18}}>
        {[{label:"Uni/Gym-jobs",pay:2000,color:"#C4521F"},{label:"Øvrige jobs",pay:2500,color:"#1E7B5B"}].map(br=>(<div key={br.pay} style={{background:T.black,padding:"18px 16px",textAlign:"center",borderBottom:`2px solid ${br.color}`}}>
          <div style={{fontSize:9,color:br.color,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",marginBottom:8,fontWeight:700}}>{br.label.toUpperCase()}</div>
          <div style={{fontSize:22,fontWeight:700,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{fmt(br.pay)}</div>
        </div>))}
      </div>
    </div>)}
  </div>);
}

// ── Admin pill helper + accent colours ────────────────────────────────────
const AMBER  = "#C88B30";
const PURPLE = "#8B3FA8";
const BLUE_A = "#4B8B9B";
const pillStyle = accent => ({
  padding:"4px 10px", fontSize:10, borderRadius:99, fontWeight:600,
  fontFamily:"'Poppins',sans-serif", letterSpacing:"0.04em",
  background:`color-mix(in oklab, ${accent} 16%, transparent)`,
  color:accent, whiteSpace:"nowrap",
});

// ── Sortable musician row (DnD) ────────────────────────────────────────────
function SortableMusicianRow({u,T,size,onEdit,onDelete,onGenerateLink,onShowLink,inviteLoading,deleting}){
  const [menuOpen,setMenuOpen]=useState(false);
  const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:u.id});
  const ds={transform:CSS.Transform.toString(transform),transition,position:"relative",zIndex:isDragging?1:0};
  const c=userColor(u);
  const av=sz=>(<div style={{width:sz,height:sz,background:c,borderRadius:sz===40?8:6,display:"grid",placeItems:"center",fontSize:sz===40?13:11,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{u.initials||"?"}</div>);
  const statusPills=(<>{u.status==="pending"&&<span style={pillStyle(T.muted)}>AFVENTER</span>}{u.status==="invited"&&<span style={pillStyle(BLUE_A)}>INVITERET</span>}</>);
  const tagPills=(u.tags||[]).map(t=>{const tc=t==="musiker"?T.green:t==="vikar"?AMBER:t==="alias_manager"?PURPLE:T.muted;const tl=t==="musiker"?"Musiker":t==="vikar"?"Vikar":t==="alias_manager"?"Alias ans.":t;return <span key={t} style={pillStyle(tc)}>{tl}</span>;});
  const infoCol=ns=>(<div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:size==="mobile"?"nowrap":"wrap",overflow:"hidden"}}>
      <span style={{fontFamily:"'Trirong',serif",fontSize:size==="mobile"?14:ns,fontWeight:600,letterSpacing:"-0.01em",color:T.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.first} {u.last}</span>
      {size!=="mobile"&&statusPills}
      {size==="tablet"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tagPills}</div>}
    </div>
    {size==="mobile"
      ?<div style={{fontSize:9,fontFamily:"'Poppins',sans-serif",color:T.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>{u.instrument||""}</div>
      :<div style={{marginTop:2,fontSize:11,fontFamily:"'Poppins',sans-serif"}}>
        {u.instrument&&<span style={{color:T.muted}}>{u.instrument}</span>}
        {u.instrument&&u.email&&<span style={{color:T.muted}}> · </span>}
        {u.email?<span style={{color:T.muted}}>{u.email}</span>:<span style={{color:T.border,fontStyle:"italic"}}>(ingen email)</span>}
      </div>
    }
  </div>);
  const actions=(<div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
    {u.status==="pending"&&<button onClick={()=>onGenerateLink(u)} disabled={inviteLoading===u.id} style={{padding:"5px 10px",background:"transparent",border:`1px solid ${T.orange}55`,borderRadius:8,color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.07em",opacity:inviteLoading===u.id?0.6:1}}>{inviteLoading===u.id?"...":"🔗 LINK"}</button>}
    {u.status==="invited"&&<button onClick={()=>onShowLink(u)} style={{padding:"5px 10px",background:"transparent",border:`1px solid ${T.orange}55`,borderRadius:8,color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.07em"}}>🔗 LINK</button>}
    <button onClick={()=>onEdit(u)} style={{padding:"5px 14px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.cardText,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.07em",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.orange;e.currentTarget.style.color=T.orange;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.cardText;}}>REDIGER</button>
    <Btn onClick={()=>onDelete(u)} color={T.red} small disabled={deleting}>FJERN</Btn>
  </div>);
  const mobileMenu=(<div style={{position:"relative",flexShrink:0,alignSelf:"center"}}>
    <button onClick={()=>setMenuOpen(v=>!v)} style={{padding:"8px 10px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,cursor:"pointer",fontSize:14,minHeight:36,lineHeight:1}}>⋯</button>
    {menuOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 4px",zIndex:10,minWidth:140,display:"flex",flexDirection:"column",gap:2}}>
      {u.status==="pending"&&<button onClick={()=>{onGenerateLink(u);setMenuOpen(false);}} disabled={inviteLoading===u.id} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8,opacity:inviteLoading===u.id?0.6:1}}>🔗 Generer link</button>}
      {u.status==="invited"&&<button onClick={()=>{onShowLink(u);setMenuOpen(false);}} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8}}>🔗 Vis link</button>}
      <button onClick={()=>{onEdit(u);setMenuOpen(false);}} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.white,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8}}>Rediger</button>
      <button onClick={()=>{onDelete(u);setMenuOpen(false);}} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.red,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8}}>Fjern</button>
    </div>}
  </div>);
  if(size==="mobile"){return(
    <div ref={setNodeRef} style={{...ds,opacity:isDragging?0.8:1}}>
      <div style={{padding:"14px 4px",borderBottom:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div {...attributes} {...listeners} style={{width:16,textAlign:"center",color:T.muted,cursor:isDragging?"grabbing":"grab",fontSize:13,flexShrink:0,touchAction:"none",lineHeight:1,userSelect:"none",alignSelf:"center"}}>⋮⋮</div>
          {av(34)}{infoCol(14)}{mobileMenu}
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",paddingLeft:27}}>{statusPills}{tagPills}</div>
      </div>
    </div>
  );}
  const gridCols=size==="desktop"?"auto 40px 1fr auto auto":"auto 40px 1fr auto";
  return(
    <div ref={setNodeRef} style={ds}>
      <div style={{display:"grid",gridTemplateColumns:gridCols,gap:14,alignItems:"center",padding:"16px 4px",borderBottom:`1px solid ${T.border}`,background:isDragging?T.orange+"11":"transparent",opacity:isDragging?0.8:1}}>
        <div {...attributes} {...listeners} style={{color:T.muted,cursor:isDragging?"grabbing":"grab",fontSize:13,padding:"2px 4px",flexShrink:0,touchAction:"none",lineHeight:1,userSelect:"none",alignSelf:"center"}}>⋮⋮</div>
        {av(40)}{infoCol(size==="desktop"?22:19)}
        {size==="desktop"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tagPills}</div>}
        {actions}
      </div>
    </div>
  );
}

// ── Static user row (non-DnD tabs) ─────────────────────────────────────────
function UserRow({u,T,size,onEdit,onDelete,onGenerateLink,onShowLink,inviteLoading,deleting}){
  const [menuOpen,setMenuOpen]=useState(false);
  const c=userColor(u);
  const av=sz=>(<div style={{width:sz,height:sz,background:c,borderRadius:sz===40?8:7,display:"grid",placeItems:"center",fontSize:sz===40?13:11,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{u.initials||"?"}</div>);
  const statusPills=(<>{u.status==="pending"&&<span style={pillStyle(T.muted)}>AFVENTER</span>}{u.status==="invited"&&<span style={pillStyle(BLUE_A)}>INVITERET</span>}</>);
  const tagPills=(u.tags||[]).map(t=>{const tc=t==="musiker"?T.green:t==="vikar"?AMBER:t==="alias_manager"?PURPLE:T.muted;const tl=t==="musiker"?"Musiker":t==="vikar"?"Vikar":t==="alias_manager"?"Alias ans.":t;return <span key={t} style={pillStyle(tc)}>{tl}</span>;});
  const infoCol=ns=>(<div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
      <span style={{fontFamily:"'Trirong',serif",fontSize:ns,fontWeight:600,letterSpacing:"-0.01em",color:T.white}}>{u.first} {u.last}</span>
      {statusPills}
      {size==="tablet"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tagPills}</div>}
    </div>
    <div style={{marginTop:2,fontSize:11,fontFamily:"'Poppins',sans-serif"}}>
      {u.instrument&&<span style={{color:T.muted}}>{u.instrument}</span>}
      {u.instrument&&u.email&&<span style={{color:T.muted}}> · </span>}
      {u.email?<span style={{color:T.muted}}>{u.email}</span>:<span style={{color:T.border,fontStyle:"italic"}}>(ingen email)</span>}
    </div>
  </div>);
  const actions=(<div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
    {u.status==="pending"&&<button onClick={()=>onGenerateLink(u)} disabled={inviteLoading===u.id} style={{padding:"5px 10px",background:"transparent",border:`1px solid ${T.orange}55`,borderRadius:8,color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.07em",opacity:inviteLoading===u.id?0.6:1}}>{inviteLoading===u.id?"...":"🔗 LINK"}</button>}
    {u.status==="invited"&&<button onClick={()=>onShowLink(u)} style={{padding:"5px 10px",background:"transparent",border:`1px solid ${T.orange}55`,borderRadius:8,color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.07em"}}>🔗 LINK</button>}
    <button onClick={()=>onEdit(u)} style={{padding:"5px 14px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.cardText,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.07em",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.orange;e.currentTarget.style.color=T.orange;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.cardText;}}>REDIGER</button>
    <Btn onClick={()=>onDelete(u)} color={T.red} small disabled={deleting}>FJERN</Btn>
  </div>);
  if(size==="mobile"){return(
    <div style={{padding:"14px 4px",borderBottom:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {av(34)}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Trirong',serif",fontSize:14,fontWeight:600,letterSpacing:"-0.01em",color:T.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.first} {u.last}</div>
          {u.instrument&&<div style={{fontSize:9,color:T.muted,fontFamily:"'Poppins',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.instrument}</div>}
        </div>
        <div style={{position:"relative",flexShrink:0,alignSelf:"center"}}>
          <button onClick={()=>setMenuOpen(v=>!v)} style={{padding:"8px 10px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,cursor:"pointer",fontSize:14,minHeight:36,lineHeight:1}}>⋯</button>
          {menuOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 4px",zIndex:10,minWidth:140,display:"flex",flexDirection:"column",gap:2}}>
            {u.status==="pending"&&<button onClick={()=>{onGenerateLink(u);setMenuOpen(false);}} disabled={inviteLoading===u.id} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8,opacity:inviteLoading===u.id?0.6:1}}>🔗 Generer link</button>}
            {u.status==="invited"&&<button onClick={()=>{onShowLink(u);setMenuOpen(false);}} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.orange,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8}}>🔗 Vis link</button>}
            <button onClick={()=>{onEdit(u);setMenuOpen(false);}} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.white,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8}}>Rediger</button>
            <button onClick={()=>{onDelete(u);setMenuOpen(false);}} style={{padding:"10px 14px",background:"transparent",border:"none",color:T.red,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,textAlign:"left",borderRadius:8}}>Fjern</button>
          </div>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",paddingLeft:0}}>{statusPills}{tagPills}</div>
    </div>
  );}
  const gridCols=size==="desktop"?"40px 1fr auto auto":"40px 1fr auto";
  return(
    <div style={{display:"grid",gridTemplateColumns:gridCols,gap:14,alignItems:"center",padding:"16px 4px",borderBottom:`1px solid ${T.border}`}}>
      {av(40)}{infoCol(size==="desktop"?22:19)}
      {size==="desktop"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tagPills}</div>}
      {actions}
    </div>
  );
}

// ── ADMIN ──────────────────────────────────────────────────────────────────
function AdminView({users,setUsers,T,onReorder,onUserSaved}){
  const [editing,setEditing]=useState(null);
  const blank={first:"",last:"",initials:"",instrument:"",email:"",password:"",isAdmin:false,tags:[],phone:"",color:""};
  const [form,setForm]=useState(blank);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [confirmRemoveUser,setConfirmRemoveUser]=useState(null);
  const [syncState,setSyncState]=useState({loading:false,msg:null});
  const [linkModal,setLinkModal]=useState(null); // { user, link } | null
  const [inviteLoading,setInviteLoading]=useState(null); // userId being processed
  const [copied,setCopied]=useState(false);
  const [activeTab,setActiveTab]=useState(0);
  const [search,setSearch]=useState("");
  const winW=useWindowWidth();
  const size=winW>=1024?"desktop":winW>=640?"tablet":"mobile";
  const deriveSubType=(isAdm,tags)=>{
    if(isAdm)return "owner";
    if(tags.includes("alias_manager")&&!tags.includes("vikar")&&!tags.includes("musiker"))return "alias";
    if(tags.includes("vikar"))return "substitute";
    return "member";
  };
  const openNew=()=>{setForm(blank);setEditing("new");};
  const openEdit=u=>{setForm({first:u.first,last:u.last,initials:u.initials,instrument:u.instrument||"",email:u.email,password:"",isAdmin:u.isAdmin||false,tags:u.tags||[],phone:u.phone||"",color:u.color||SPOT[u.id]||""});setEditing(u);};
  const toggleTag=tag=>setForm(p=>{
    const has=p.tags.includes(tag);
    if(has)return{...p,tags:p.tags.filter(t=>t!==tag)};
    if(tag==="musiker")return{...p,tags:[...p.tags.filter(t=>t!=="vikar"),"musiker"]};
    if(tag==="vikar")return{...p,tags:[...p.tags.filter(t=>t!=="musiker"),"vikar"]};
    return{...p,tags:[...p.tags,tag]};
  });
  const save=async()=>{
    if(!form.first)return;
    setSaving(true);
    try{
      const subType=deriveSubType(form.isAdmin,form.tags);
      const role=form.isAdmin?"admin":"musician";
      if(editing==="new"){
        const id=`u${Date.now()}`;
        const res=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          id,first:form.first,last:form.last,initials:form.initials,
          instrument:form.instrument||"",email:form.email,
          phone:form.phone||"",color:form.color||"",
          role,subType,isAdmin:form.isAdmin,tags:form.tags,
          musicianId:null,theme:"dark",status:"pending",
          ...(form.password?{password:form.password}:{}),
        })});
        if(!res.ok){const d=await res.json();alert("Fejl: "+(d.error||res.status));return;}
        await onUserSaved?.();
        setEditing(null);
      } else {
        const userId=editing.id;
        console.log('[admin-edit] saving:',userId);
        const updated={
          ...editing,
          first:form.first,last:form.last,initials:form.initials,
          instrument:form.instrument||"",email:form.email,
          phone:form.phone||"",color:form.color||"",
          role,subType,isAdmin:form.isAdmin,tags:form.tags,
          ...(form.password?{password:form.password}:{}),
        };
        const res=await fetch("/api/users",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)});
        if(!res.ok){const d=await res.json();alert("Fejl: "+(d.error||res.status));return;}
        const result=await res.json();
        console.log('[admin-edit] saved:',result);
        setUsers(prev=>prev.map(u=>u.id===updated.id?updated:u));
        setEditing(null);
      }
    }catch(e){alert("Netværksfejl: "+e.message);}
    finally{setSaving(false);}
  };
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}));
  const generateLink=async(u)=>{
    setInviteLoading(u.id);
    try{
      const res=await fetch("/api/invitations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:u.id})});
      const data=await res.json();
      if(data.link){
        setUsers(prev=>prev.map(x=>x.id===u.id?{...x,status:"invited"}:x));
        setLinkModal({user:u,link:data.link});
      }
    }catch(e){alert("Fejl ved generering af link: "+e.message);}
    setInviteLoading(null);
  };
  const showLink=async(u)=>{
    const res=await fetch("/api/invitations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:u.id})});
    const data=await res.json();
    if(data.link)setLinkModal({user:u,link:data.link});
  };
  const copyLink=(link)=>{
    navigator.clipboard.writeText(link).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };
  const handleDragEnd=event=>{
    const {active,over}=event;
    if(!over||active.id===over.id)return;
    const musicians=sortMusicians(users.filter(u=>u.tags?.includes("musiker")));
    const oldIdx=musicians.findIndex(u=>u.id===active.id);
    const newIdx=musicians.findIndex(u=>u.id===over.id);
    if(oldIdx<0||newIdx<0)return;
    const reordered=arrayMove(musicians,oldIdx,newIdx);
    const orderedIds=reordered.map(u=>u.id);
    const orderMap=new Map(orderedIds.map((id,i)=>[id,i+1]));
    setUsers(prev=>prev.map(u=>orderMap.has(u.id)?{...u,displayOrder:orderMap.get(u.id)}:u));
    onReorder(orderedIds);
  };

  const tabDefs=[
    {key:"owner",  label:"Admin / Ejere",    accent:T.orange, filter:u=>u.isAdmin,                        sortable:false, subtitle:"De fire der ejer scenen"},
    {key:"musiker",label:"Musikere",          accent:T.green,  filter:u=>u.tags?.includes("musiker"),       sortable:true,  subtitle:"Det faste band"},
    {key:"vikar",  label:"Vikarer",           accent:AMBER,    filter:u=>u.tags?.includes("vikar"),         sortable:false, subtitle:"Når kalenderen kalder"},
    {key:"alias",  label:"Alias Ansvarlige",  accent:PURPLE,   filter:u=>u.tags?.includes("alias_manager"), sortable:false, subtitle:"Bookings under eget navn"},
  ];
  const cur=tabDefs[activeTab];
  const tabUsers=cur.sortable?sortMusicians(users.filter(cur.filter)):users.filter(cur.filter);
  const visibleUsers=search?tabUsers.filter(u=>`${u.first} ${u.last} ${u.email||""} ${u.instrument||""}`.toLowerCase().includes(search.toLowerCase())):tabUsers;
  const counts=tabDefs.map(t=>users.filter(t.filter).length);
  const pad=n=>String(n).padStart(2,"0");
  const statCells=[
    {label:"Total brugere",    n:users.length,                                                    accent:T.white},
    {label:"Admins / Ejere",   n:users.filter(u=>u.isAdmin).length,                               accent:T.orange},
    {label:"Faste musikere",   n:users.filter(u=>u.tags?.includes("musiker")).length,              accent:T.green},
    {label:"Vikarer",          n:users.filter(u=>u.tags?.includes("vikar")).length,                accent:AMBER},
    {label:"Alias ansvarlige", n:users.filter(u=>u.tags?.includes("alias_manager")).length,        accent:PURPLE},
  ];

  return(<div>

    {/* STAT STRIP */}
    {size!=="mobile"&&<div style={{border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden",marginBottom:20}}>
      <div style={{display:"grid",gridTemplateColumns:size==="desktop"?"repeat(5,1fr)":size==="tablet"?"repeat(3,1fr)":"repeat(2,1fr)",gap:1,background:T.border}}>
        {statCells.map(({label,n,accent})=>(
          <div key={label} style={{padding:size==="mobile"?12:18,background:T.dim}}>
            <div style={{fontSize:size==="mobile"?9:10,color:accent,letterSpacing:"0.18em",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>{label}</div>
            <div style={{fontFamily:"'Poppins',sans-serif",fontSize:size==="desktop"?36:size==="tablet"?28:22,fontWeight:800,letterSpacing:"-0.02em",lineHeight:1,color:T.white}}>{pad(n)}</div>
          </div>
        ))}
      </div>
    </div>}

    {/* ROLE TABS — MOBILE: 2×2 pill grid */}
    {size==="mobile"?(
      <div style={{borderBottom:`1px solid ${T.border}`,paddingBottom:12,marginBottom:0,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {tabDefs.map((t,i)=>{const active=activeTab===i;return(
            <button key={t.key} onClick={()=>{setActiveTab(i);setSearch("");}}
              style={{padding:"10px 12px",borderRadius:10,minHeight:44,border:`1px solid ${active?t.accent:T.border}`,
                background:active?`color-mix(in oklab, ${t.accent} 14%, transparent)`:"transparent",
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,
                color:active?T.white:T.muted,cursor:"pointer",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                <div style={{width:6,height:6,borderRadius:99,background:t.accent,flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.12em",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
              </div>
              <span style={{fontFamily:"'Trirong',serif",fontStyle:"italic",fontWeight:600,fontSize:13,color:active?t.accent:T.muted,flexShrink:0}}>{pad(counts[i])}</span>
            </button>
          );})}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Søg..." style={{flex:1,padding:"10px 12px",fontSize:12,background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontFamily:"'Poppins',sans-serif",outline:"none"}}/>
          <Btn onClick={openNew} color={T.orange} small>+ Opret</Btn>
        </div>
      </div>
    ):(
      /* ROLE TABS — DESKTOP / TABLET */
      <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",gap:0}}>
            {tabDefs.map((t,i)=>{const active=activeTab===i;return(
              <button key={t.key} onClick={()=>{setActiveTab(i);setSearch("");}}
                style={{padding:"14px 18px",background:"transparent",border:0,cursor:"pointer",position:"relative",
                  fontFamily:"'Poppins',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",
                  color:active?T.white:T.muted,transition:"color .15s"}}>
                {t.label}
                <span style={{color:T.muted,fontWeight:500,marginLeft:6}}>{counts[i]}</span>
                {active&&<div style={{position:"absolute",left:0,right:0,bottom:-1,height:2,background:t.accent}}/>}
              </button>
            );})}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:12}}>
            {size==="desktop"&&<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Søg..." style={{padding:"8px 12px",fontSize:12,width:180,background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontFamily:"'Poppins',sans-serif",outline:"none"}}/>}
            <Btn onClick={openNew} color={T.orange} small>+ Opret bruger</Btn>
          </div>
        </div>
        {size==="tablet"&&(
          <div style={{display:"flex",gap:8,paddingTop:10}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Søg..." style={{flex:1,padding:"8px 12px",fontSize:12,background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontFamily:"'Poppins',sans-serif",outline:"none"}}/>
          </div>
        )}
      </>
    )}

    {/* SECTION HEADER */}
    <div style={{padding:"20px 0 8px"}}>
      <div style={{fontSize:10,color:cur.accent,letterSpacing:"0.18em",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>{cur.label}</div>
      <div style={{fontFamily:"'Trirong',serif",fontStyle:"italic",fontSize:16,color:T.muted}}>{cur.subtitle}</div>
    </div>

    {/* USER LIST */}
    <div style={{borderTop:`1px solid ${T.border}`}}>
      {cur.sortable?(
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleUsers.map(u=>u.id)} strategy={verticalListSortingStrategy}>
            {visibleUsers.map(u=>(
              <SortableMusicianRow key={u.id} u={u} T={T} size={size}
                onEdit={openEdit} onDelete={setConfirmRemoveUser}
                onGenerateLink={generateLink} onShowLink={showLink}
                inviteLoading={inviteLoading} deleting={deleting}/>
            ))}
          </SortableContext>
        </DndContext>
      ):(
        visibleUsers.map(u=>(
          <UserRow key={u.id} u={u} T={T} size={size}
            onEdit={openEdit} onDelete={setConfirmRemoveUser}
            onGenerateLink={generateLink} onShowLink={showLink}
            inviteLoading={inviteLoading} deleting={deleting}/>
        ))
      )}
      {visibleUsers.length===0&&(
        <div style={{padding:"32px 4px",textAlign:"center",color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:13}}>
          {search?`Ingen resultater for "${search}"`:"Ingen brugere i denne gruppe."}
        </div>
      )}
    </div>

    {/* HUBSPOT SYNC CARD */}
    <div style={{marginTop:24,background:T.dim,border:`1px solid ${T.border}`,borderRadius:14,padding:size==="mobile"?16:24,display:"flex",flexDirection:size==="mobile"?"column":"row",alignItems:size==="mobile"?"stretch":"center",gap:size==="mobile"?12:16,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:16,flex:1,minWidth:0}}>
        <div style={{width:36,height:36,borderRadius:8,background:`color-mix(in oklab, ${T.green} 18%, transparent)`,display:"grid",placeItems:"center",color:T.green,fontSize:18,fontWeight:700,flexShrink:0}}>↻</div>
        <div>
          <div style={{fontSize:10,color:T.green,letterSpacing:"0.18em",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>HUBSPOT SYNC</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>Automatisk synkronisering hver time via HubSpot API.</div>
        </div>
      </div>
      <div style={{flexShrink:0,width:size==="mobile"?"100%":undefined}}>
        <Btn onClick={async()=>{
          setSyncState({loading:true,msg:null});
          try{
            const res=await fetch("/api/hubspot/sync");
            const data=await res.json();
            if(data.ok){
              setSyncState({loading:false,msg:{err:false,text:`✓ ${data.synced.northAvenue} NA jobs, ${data.synced.alias} Alias jobs synkroniseret`}});
              setTimeout(()=>window.location.reload(),1500);
            }else{
              setSyncState({loading:false,msg:{err:true,text:data.error||"Fejl ved synk"}});
            }
          }catch(e){
            setSyncState({loading:false,msg:{err:true,text:"Netværksfejl: "+e.message}});
          }
        }} color={T.orange} style={size==="mobile"?{width:"100%"}:{}}>{syncState.loading?"SYNKRONISERER...":"Synkronisér nu →"}</Btn>
      </div>
      {syncState.msg&&<div style={{width:"100%",fontSize:12,color:syncState.msg.err?T.red:T.green,fontFamily:"'Poppins',sans-serif"}}>{syncState.msg.text}</div>}
    </div>

    {/* MODALS (unchanged) */}
    {confirmRemoveUser&&<ConfirmModal message={`Er du sikker på at du vil fjerne "${confirmRemoveUser.first} ${confirmRemoveUser.last}"? Handlingen kan ikke fortrydes.`} confirmLoading={deleting} onConfirm={async()=>{
      setDeleting(true);
      try{
        const res=await fetch(`/api/users?id=${confirmRemoveUser.id}`,{method:"DELETE"});
        if(!res.ok){const d=await res.json();alert("Fejl: "+(d.error||res.status));return;}
        setUsers(prev=>prev.filter(x=>x.id!==confirmRemoveUser.id));
        setConfirmRemoveUser(null);
      }catch(e){alert("Netværksfejl: "+e.message);}
      finally{setDeleting(false);}
    }} onCancel={()=>setConfirmRemoveUser(null)} T={T}/>}
    {linkModal&&(<div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setLinkModal(null)}>
      <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:16,padding:28,maxWidth:500,width:"100%"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:4}}>INVITATIONSLINK</div>
        <div style={{fontSize:13,color:T.muted,fontFamily:"'Poppins',sans-serif",marginBottom:16,lineHeight:1.5}}>Send dette link til <strong style={{color:T.white}}>{linkModal.user.first}</strong> via SMS, mail eller besked. Linket udløber om 14 dage.</div>
        <div style={{display:"flex",gap:8,alignItems:"stretch",marginBottom:16}}>
          <input readOnly value={linkModal.link} style={{flex:1,background:T.black,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:11,fontFamily:"'Poppins',sans-serif",outline:"none",minWidth:0}} onClick={e=>e.target.select()}/>
          <button onClick={()=>copyLink(linkModal.link)} style={{padding:"10px 16px",background:copied?T.green:T.orange,border:"none",borderRadius:8,color:"#F8F5E6",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Poppins',sans-serif",flexShrink:0,transition:"background .2s"}}>{copied?"KOPIERET ✓":"KOPIER"}</button>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <Btn onClick={()=>setLinkModal(null)} color={T.muted} small>LUK</Btn>
        </div>
      </div>
    </div>)}
    {editing!==null&&(<Modal title={editing==="new"?"OPRET BRUGER":"REDIGER BRUGER"} onClose={()=>setEditing(null)} T={T} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="FORNAVN" T={T}><Inp value={form.first} onChange={e=>setForm(p=>({...p,first:e.target.value}))} T={T}/></Field>
        <Field label="EFTERNAVN" T={T}><Inp value={form.last} onChange={e=>setForm(p=>({...p,last:e.target.value}))} T={T}/></Field>
        <Field label="INITIALER" T={T}><Inp value={form.initials} onChange={e=>setForm(p=>({...p,initials:e.target.value}))} T={T}/></Field>
        <Field label="TELEFON" T={T}><Inp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+45 12 34 56 78" T={T}/></Field>
        <Field label="INSTRUMENT / ROLLE" T={T}><Inp value={form.instrument} onChange={e=>setForm(p=>({...p,instrument:e.target.value}))} T={T}/></Field>
        <Field label="EMAIL" T={T}><Inp value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} type="email" T={T}/></Field>
        <Field label={editing==="new"?"ADGANGSKODE":"NY ADGANGSKODE (lad stå tom)"} T={T}><PwInput value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} T={T}/></Field>
        <div style={{display:"flex",alignItems:"center",paddingTop:10}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <input type="checkbox" checked={form.isAdmin} onChange={e=>setForm(p=>({...p,isAdmin:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
            <span style={{fontSize:12,color:T.white,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>Administrator / Ejer</span>
          </label>
        </div>
      </div>
      <div style={{marginTop:16,marginBottom:8}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:600,marginBottom:10}}>TAGS</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {ALL_TAGS.map(tag=>{const active=form.tags.includes(tag);return(<button key={tag} onClick={()=>toggleTag(tag)}
            style={{padding:"6px 14px",border:`1px solid ${active?T.orange:T.border}`,background:active?T.orange+"22":"transparent",color:active?T.orange:T.muted,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.08em",transition:"all .15s"}}>
            {TAG_LABELS[tag]}
          </button>);})}
        </div>
      </div>
      <div style={{marginTop:16,marginBottom:8}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:600,marginBottom:10}}>FARVE</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {["#C4521F","#B87B30","#1E7B5B","#8B3FA8","#2E6B9B","#7B2020","#3B8B6B","#9B6B2B","#4B8B9B","#9B4B6B","#6B9B4B","#8B6B4B"].map(c=>{
            const active=form.color===c;
            return(<button key={c} onClick={()=>setForm(p=>({...p,color:c}))} title={c}
              style={{width:30,height:30,background:c,border:active?`3px solid ${T.white}`:"3px solid transparent",borderRadius:8,cursor:"pointer",transition:"all .15s",outline:active?`1px solid ${c}`:"none"}}/>);
          })}
          <input type="color" value={form.color||"#888888"} onChange={e=>setForm(p=>({...p,color:e.target.value}))}
            style={{width:36,height:36,background:"transparent",border:`1px dashed ${T.border}`,borderRadius:8,cursor:"pointer",padding:2}} title="Brugerdefineret farve"/>
          {form.color&&<button onClick={()=>setForm(p=>({...p,color:""}))} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,color:T.muted,cursor:"pointer",fontSize:10,fontFamily:"'Poppins',sans-serif"}}>Ryd</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <Btn onClick={()=>setEditing(null)} color={T.muted} small>ANNULLER</Btn>
        <Btn onClick={save} color={T.orange} small disabled={saving}>{saving?"GEMMER...":"GEM"}</Btn>
      </div>
    </Modal>)}
  </div>);
}

// ── PROFILE ────────────────────────────────────────────────────────────────

function ProfileView({currentUser,users,setUsers,T,darkMode,setDarkMode}){
  const u=users.find(x=>x.id===currentUser.id)||currentUser;
  const [form,setForm]=useState({first:u.first||"",last:u.last||"",phone:u.phone||"",email:u.email||""});
  const [pw,setPw]=useState({old:"",next:"",conf:""});
  const [msg,setMsg]=useState(null);
  const [pwMsg,setPwMsg]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const [hoverDel,setHoverDel]=useState(false);
  const winW=useWindowWidth();
  const size=winW>=1024?"desktop":winW>=640?"tablet":"mobile";

  const cardStyle={background:T.dim,border:`1px solid ${T.border}`,borderRadius:14,padding:size==="mobile"?16:24};
  const secLabel=(eyebrow,idx,color=T.orange)=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
      <div style={{fontSize:10,color,letterSpacing:"0.18em",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase"}}>{eyebrow}</div>
      <div style={{fontFamily:"'Trirong',serif",fontStyle:"italic",fontSize:12,color:T.muted}}>{idx}</div>
    </div>
  );

  const saveProfile=()=>{
    const taken=users.some(x=>x.id!==currentUser.id&&x.email===form.email);
    if(taken){setMsg({err:true,text:"Email er allerede i brug"});return;}
    setUsers(prev=>prev.map(x=>x.id===currentUser.id?{...x,...form,name:form.first}:x));
    setMsg({err:false,text:"Profil gemt ✓"});
  };
  const savePw=()=>{
    const usr=users.find(x=>x.id===currentUser.id);
    if(usr.password!==pw.old){setPwMsg({err:true,text:"Forkert nuværende adgangskode",field:"old"});return;}
    if(pw.next.length<6){setPwMsg({err:true,text:"Mindst 6 tegn",field:"new"});return;}
    if(pw.next!==pw.conf){setPwMsg({err:true,text:"Adgangskoderne matcher ikke",field:"conf"});return;}
    setUsers(prev=>prev.map(x=>x.id===currentUser.id?{...x,password:pw.next}:x));
    setPwMsg({err:false,text:"Adgangskode opdateret ✓",field:null});
    setPw({old:"",next:"",conf:""});
  };

  const isGoogleUser=!!(u.google_id||currentUser.google_id);
  const instrument=u.instrument||"";

  return(<div>
    <div style={{maxWidth:1000,display:"grid",gridTemplateColumns:size==="desktop"?"1fr 1fr":"1fr",gap:14}}>

      {/* CARD 1 — HERO */}
      <div style={{...cardStyle,gridColumn:"1 / -1",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,pointerEvents:"none"}}>
          <NAStar size={160} color={T.orange} opacity={0.06}/>
        </div>
        <div style={{display:"flex",flexDirection:size==="mobile"?"column":"row",alignItems:size==="mobile"?"flex-start":"center",gap:size==="mobile"?14:20,position:"relative"}}>
          <div style={{width:size==="mobile"?56:64,height:size==="mobile"?56:64,borderRadius:12,background:userColor(u),display:"grid",placeItems:"center",flexShrink:0}}>
            <span style={{fontFamily:"'Trirong',serif",fontSize:size==="mobile"?18:22,fontWeight:600,color:"#F8F5E6"}}>{u.initials||"?"}</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"0.18em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>LOGGET IND SOM</div>
            <div style={{fontFamily:"'Trirong',serif",fontSize:size==="mobile"?20:24,fontWeight:600,letterSpacing:"-0.01em",lineHeight:1.1,color:T.white}}>{u.first} {u.last}</div>
            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
              {instrument
                ?<span style={{padding:"4px 10px",fontSize:10,borderRadius:99,fontWeight:600,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.04em",background:`color-mix(in oklab, ${T.orange} 16%, transparent)`,color:T.orange,whiteSpace:"nowrap"}}>Musiker · {instrument}</span>
                :<span style={{padding:"4px 10px",fontSize:10,borderRadius:99,fontWeight:600,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.04em",background:`color-mix(in oklab, ${T.orange} 16%, transparent)`,color:T.orange,whiteSpace:"nowrap"}}>Musiker</span>
              }
              {u.isAdmin&&<span style={{padding:"4px 10px",fontSize:10,borderRadius:99,fontWeight:600,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.04em",background:`color-mix(in oklab, ${T.orange} 16%, transparent)`,color:T.orange,whiteSpace:"nowrap"}}>Admin / Ejer</span>}
            </div>
          </div>
          {size!=="mobile"&&(
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:9,color:T.muted,letterSpacing:"0.1em",fontFamily:"monospace",marginBottom:4}}>SESSION</div>
              <div style={{fontFamily:"'Trirong',serif",fontStyle:"italic",fontSize:12,color:T.muted}}>Session aktiv</div>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2 — PROFILOPLYSNINGER */}
      <div style={cardStyle}>
        {secLabel("PROFILOPLYSNINGER","1 / 4")}
        <div style={{display:"grid",gridTemplateColumns:size==="mobile"?"1fr":"1fr 1fr",gap:12}}>
          <Field label="FORNAVN" T={T}><Inp value={form.first} onChange={e=>setForm(p=>({...p,first:e.target.value}))} T={T}/></Field>
          <Field label="EFTERNAVN" T={T}><Inp value={form.last} onChange={e=>setForm(p=>({...p,last:e.target.value}))} T={T}/></Field>
        </div>
        <Field label="TELEFON" T={T}><Inp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+45 12 34 56 78" T={T}/></Field>
        <Field label="EMAIL" T={T}>
          {isGoogleUser
            ?<input readOnly value={form.email} style={{width:"100%",padding:"10px 12px",background:T.black,border:`1px solid ${T.border}`,color:T.muted,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Poppins',sans-serif",borderRadius:0,cursor:"default",opacity:0.7}}/>
            :<Inp value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} type="email" T={T}/>
          }
        </Field>
        {isGoogleUser&&<div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:-8,marginBottom:14}}>Email styres via din Google-konto.</div>}
        {msg&&<div style={{fontSize:12,color:msg.err?T.red:T.green,marginBottom:10,fontFamily:"'Poppins',sans-serif"}}>{msg.text}</div>}
        <Btn onClick={saveProfile} color={T.orange} small style={size==="mobile"?{width:"100%"}:{}}>Gem profil →</Btn>
      </div>

      {/* CARD 3 — SKIFT ADGANGSKODE */}
      <div style={cardStyle}>
        {secLabel("SKIFT ADGANGSKODE","2 / 4")}
        <Field label="NUVÆRENDE ADGANGSKODE" T={T}><PwInput value={pw.old} onChange={e=>setPw(p=>({...p,old:e.target.value}))} T={T}/></Field>
        {pwMsg?.err&&pwMsg.field==="old"&&<div style={{fontSize:11,color:T.red,fontFamily:"'Poppins',sans-serif",marginTop:-10,marginBottom:12}}>{pwMsg.text}</div>}
        <div style={{display:"grid",gridTemplateColumns:size==="mobile"?"1fr":"1fr 1fr",gap:12}}>
          <div>
            <Field label="NY ADGANGSKODE" T={T}><PwInput value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} T={T}/></Field>
            {pwMsg?.err&&pwMsg.field==="new"&&<div style={{fontSize:11,color:T.red,fontFamily:"'Poppins',sans-serif",marginTop:-10,marginBottom:12}}>{pwMsg.text}</div>}
          </div>
          <div>
            <Field label="BEKRÆFT ADGANGSKODE" T={T}><PwInput value={pw.conf} onChange={e=>setPw(p=>({...p,conf:e.target.value}))} T={T}/></Field>
            {pwMsg?.err&&pwMsg.field==="conf"&&<div style={{fontSize:11,color:T.red,fontFamily:"'Poppins',sans-serif",marginTop:-10,marginBottom:12}}>{pwMsg.text}</div>}
          </div>
        </div>
        <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif",marginBottom:14,lineHeight:1.5}}>Mindst 6 tegn. Kun synlig for dig.</div>
        {pwMsg&&!pwMsg.err&&<div style={{fontSize:12,color:T.green,marginBottom:10,fontFamily:"'Poppins',sans-serif"}}>{pwMsg.text}</div>}
        <Btn onClick={savePw} color={T.orange} small style={size==="mobile"?{width:"100%"}:{}}>Gem adgangskode →</Btn>
      </div>

      {/* CARD 4 — TEMA */}
      <div style={cardStyle}>
        {secLabel("TEMA","3 / 4")}
        <div style={{display:"flex",gap:10}}>
          {[
            {id:true, icon:"☾", label:"Mørkt", bg:"#181719", fg:"#F8F5E6", accent:"#D4622A"},
            {id:false,icon:"☀", label:"Lyst",  bg:"#F2EFE4", fg:"#181719", accent:"#C4521F"},
          ].map(opt=>{
            const active=darkMode===opt.id;
            return(<button key={String(opt.id)} onClick={()=>setDarkMode(opt.id)}
              style={{flex:1,borderRadius:10,overflow:"hidden",cursor:"pointer",padding:0,background:"transparent",border:`1px solid ${active?T.orange:T.border}`,transition:"border-color .15s"}}>
              <div style={{height:size==="mobile"?48:56,padding:8,position:"relative",background:opt.bg}}>
                <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:10,lineHeight:0.95}}>
                  <div style={{color:opt.fg}}>NORTH</div>
                  <div style={{color:opt.accent}}>AVENUE</div>
                </div>
                <div style={{width:7,height:7,borderRadius:99,position:"absolute",top:6,right:6,background:opt.accent}}/>
              </div>
              <div style={{padding:"8px 12px",fontSize:11,fontWeight:700,fontFamily:"'Poppins',sans-serif",color:T.cardText,background:T.dim,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{opt.icon}  {opt.label}</span>
                {active&&<span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",color:T.orange}}>AKTIV</span>}
              </div>
            </button>);
          })}
        </div>
      </div>

      {/* CARD 5 — FAREOMRÅDE */}
      <div style={{...cardStyle,border:`1px solid color-mix(in oklab, ${T.red} 40%, ${T.border})`}}>
        {secLabel("FAREOMRÅDE","4 / 4",T.red)}
        <div style={{fontSize:12,color:T.muted,fontFamily:"'Poppins',sans-serif",lineHeight:1.6,marginBottom:14}}>
          Din profil arkiveres permanent. Du kan ikke fortryde dette selv. Kontakt en anden admin hvis du har brug for hjælp.
        </div>
        <button onClick={()=>setDeleteConfirm(true)} onMouseEnter={()=>setHoverDel(true)} onMouseLeave={()=>setHoverDel(false)}
          style={{padding:size==="mobile"?"12px":"8px 16px",width:size==="mobile"?"100%":"auto",minHeight:size==="mobile"?44:undefined,background:hoverDel?`color-mix(in oklab, ${T.red} 12%, transparent)`:"transparent",border:`1px solid ${T.red}`,color:T.red,borderRadius:8,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.07em",transition:"background .15s"}}>
          SLET MIN PROFIL
        </button>
      </div>

    </div>

    {deleteConfirm&&<ConfirmModal
      message="Er du sikker? Din profil arkiveres og du logges ud. Kontakt admin hvis du fortryder."
      onConfirm={async()=>{
        await fetch(`/api/users?id=${currentUser.id}`,{method:"DELETE"}).catch(()=>{});
        await signOut({callbackUrl:"/login?reason=self_deleted"});
      }}
      onCancel={()=>setDeleteConfirm(false)}
      confirmLabel="JA, SLET MIN PROFIL"
      T={T}
    />}
  </div>);
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
function LoginScreen({onLogin,users}){
  const T=DARK;
  const winW=useWindowWidth();
  const isMob=winW<500;
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [err,setErr]=useState("");
  const handle=()=>{const u=users.find(u=>u.email===email&&u.password===pass);if(u)onLogin(u);else setErr("Forkert email eller adgangskode");};
  const onKey=e=>{if(e.key==="Enter")handle();};
  return(<div style={{minHeight:"100vh",background:"#181719",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",padding:"20px 16px",boxSizing:"border-box"}}>
    <div style={{position:"absolute",top:"-20%",left:"-10%",width:"50%",height:"60%",background:"radial-gradient(ellipse,#C4521F18 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"50%",height:"60%",background:"radial-gradient(ellipse,#1E7B5B12 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:1,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:isMob?32:52,width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><NAStar size={isMob?36:54} color={T.orange}/></div>
        <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:isMob?32:52,letterSpacing:"-0.01em",color:T.white,lineHeight:0.9}}>NORTH<span style={{color:T.orange}}>AVENUE</span></div>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.18em",marginTop:12,fontFamily:"'Poppins',sans-serif"}}>BACKSTAGE · LOG IND</div>
      </div>
      <div style={{background:T.dim,padding:isMob?24:36,borderRadius:16}}>
        <Field label="EMAIL" T={T}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={onKey} placeholder="dit@northavenue.dk"
          style={{width:"100%",padding:"11px 14px",background:T.black,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Poppins',sans-serif"}}/></Field>
        <Field label="ADGANGSKODE" T={T}><PwInput value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={onKey} T={T}/></Field>
        {err&&<div style={{color:T.orange,fontSize:11,marginBottom:10,fontFamily:"'Poppins',sans-serif"}}>{err}</div>}
        <button onClick={handle} style={{width:"100%",padding:"13px",fontSize:13,letterSpacing:"0.08em",marginTop:4,background:T.orange,border:"none",borderRadius:8,color:"#F8F5E6",fontWeight:700,cursor:"pointer",fontFamily:"'Poppins',sans-serif"}}>LOG IND →</button>
      </div>
    </div>
  </div>);
}

// ── SHELL ──────────────────────────────────────────────────────────────────
export default function App(){
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view,setView]=useState("bookings");
  const [darkMode,setDarkMode]=useState(true);
  const [bookings,setBookings]=useState(INIT_BOOKINGS);
  const [aliasData,setAliasData]=useState(INIT_ALIAS);
  const [payments,setPayments]=useState(INIT_PAYMENTS);
  const [users,setUsers]=useState(INIT_USERS);
  const [loading,setLoading]=useState(true);
  const winW=useWindowWidth();
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);

  // Redirect to login if unauthenticated
  useEffect(()=>{
    if(status==="unauthenticated") router.push("/login");
  },[status,router]);

  // Load all data from database on mount
  useEffect(()=>{
    if(status!=="authenticated") return;
    const load=async()=>{
      try{
        const [u,b,p,a]=await Promise.all([
          fetch("/api/users").then(r=>r.json()),
          fetch("/api/bookings").then(r=>r.json()),
          fetch("/api/payments").then(r=>r.json()),
          fetch("/api/alias").then(r=>r.json()),
        ]);

        // Map users from DB format
        if(Array.isArray(u)){
          setUsers(u.map(x=>({
            ...x,
            subType:x.sub_type,
            isAdmin:x.is_admin,
            musicianId:x.musician_id,
            tags:JSON.parse(x.tags||"[]"),
            displayOrder:x.display_order??null,
          })));
        }

        // Map bookings from DB format
        if(Array.isArray(b)&&b.length>0){
          setBookings(b.map(x=>({
            ...x,
            bandPay:x.band_pay||0,
            playTime:x.play_time||"",
            memberIds:JSON.parse(x.member_ids||"[]"),
            substituteIds:JSON.parse(x.substitute_ids||"[]"),
          })));
        }

        // Map payments: group by musician_id
        if(Array.isArray(p)&&p.length>0){
          const grouped={};
          p.forEach(x=>{
            const mid=x.musician_id;
            if(!grouped[mid])grouped[mid]=[];
            grouped[mid].push({id:x.id,date:x.date,amount:x.amount,note:x.note});
          });
          setPayments(grouped);
        }

        // Map alias bookings: group by manager_user_id
        if(Array.isArray(a)&&a.length>0){
          const grouped={};
          a.forEach(x=>{
            const mid=x.manager_user_id||x.managerUserId;
            if(!grouped[mid])grouped[mid]=[];
            grouped[mid].push({
              ...x,
              bandPay:x.band_pay||0,
              bookingFee:x.booking_fee||0,
              carGear:x.car_gear||false,
              playTime:x.play_time||"",
              managerUserId:mid,
            });
          });
          setAliasData(grouped);
        }
      }catch(e){
        console.error("Kunne ikke hente data:",e);
      }finally{
        setLoading(false);
      }
    };
    load();
  },[status]);

  // Persist booking changes to DB
  const handleSetBookings=async(updater)=>{
    const next=typeof updater==="function"?updater(bookings):updater;
    setBookings(next);
    // Find changed/new bookings and save
    for(const b of next){
      await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).catch(()=>{});
    }
  };

  // Persist user changes to DB
  const handleSetUsers=async(updater)=>{
    const next=typeof updater==="function"?updater(users):updater;
    setUsers(next);
    for(const u of next){
      await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)}).catch(()=>{});
    }
  };

  // Persist payment changes to DB
  const handleSetPayments=async(updater)=>{
    const next=typeof updater==="function"?updater(payments):updater;
    setPayments(next);
    // Flatten and save all payments
    for(const [mid,ps] of Object.entries(next)){
      for(const p of ps){
        await fetch("/api/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...p,musicianId:parseInt(mid)})}).catch(()=>{});
      }
    }
  };

  // Persist alias changes to DB
  const handleSetAliasData=async(updater)=>{
    const next=typeof updater==="function"?updater(aliasData):updater;
    setAliasData(next);
    for(const [managerId,bookingList] of Object.entries(next)){
      for(const b of bookingList){
        await fetch("/api/alias",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...b,managerUserId:managerId})}).catch(()=>{});
      }
    }
  };

  const T=darkMode?DARK:LIGHT;
  const curU=session?users.find(u=>u.id===session.user.id)||null:null;

  // Apply theme from user profile once users are loaded
  useEffect(()=>{
    if(curU?.theme==="light") setDarkMode(false);
    else if(curU?.theme==="dark") setDarkMode(true);
  },[curU?.id, curU?.theme]);

  const isMobile=winW<768;
  const isTablet=winW<1400;

  // Save theme to user profile when changed
  const handleTheme=val=>{
    setDarkMode(val);
    if(session)handleSetUsers(prev=>prev.map(u=>u.id===session.user.id?{...u,theme:val?"dark":"light"}:u));
  };

  const handleUserSaved=async()=>{
    const [u,b]=await Promise.all([
      fetch("/api/users").then(r=>r.json()).catch(()=>null),
      fetch("/api/bookings").then(r=>r.json()).catch(()=>null),
    ]);
    if(Array.isArray(u))setUsers(u.map(x=>({...x,subType:x.sub_type,isAdmin:x.is_admin,musicianId:x.musician_id,tags:JSON.parse(x.tags||"[]"),displayOrder:x.display_order??null})));
    if(Array.isArray(b))setBookings(b.map(x=>({...x,bandPay:x.band_pay||0,playTime:x.play_time||"",memberIds:JSON.parse(x.member_ids||"[]"),substituteIds:JSON.parse(x.substitute_ids||"[]")})));
  };

  const handleReorder=async(orderedIds)=>{
    try{
      const res=await fetch("/api/users/reorder",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:orderedIds})});
      if(!res.ok){
        const fresh=await fetch("/api/users").then(r=>r.json());
        if(Array.isArray(fresh))setUsers(fresh.map(x=>({...x,subType:x.sub_type,isAdmin:x.is_admin,musicianId:x.musician_id,tags:JSON.parse(x.tags||"[]"),displayOrder:x.display_order??null})));
      }
    }catch(e){console.error("[reorder]",e);}
  };

  if(status==="loading"||loading)return(
    <div style={{minHeight:"100vh",background:"#181719",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <NAStar size={40} color="#D4622A"/>
      <div style={{color:"#B0A8A4",fontFamily:"'Poppins',sans-serif",fontSize:11,letterSpacing:"0.2em"}}>INDLÆSER...</div>
    </div>
  );

  if(!curU)return null;

  const isAdmin=curU.role==="admin";
  const isAliasOnly=!isAdmin&&curU.subType==="alias"&&!hasVikar(curU);
  const isSub=hasVikar(curU)&&!isAdmin;
  const showAlias=isAdmin||hasAlias(curU);

  const nav=[
    {id:"bookings",label:"BOOKINGER",  show:!isAliasOnly},
    {id:"alias",   label:"ALIAS",      show:showAlias},
    {id:"payroll", label:"LØNOVERSIGT",show:!isAliasOnly},
    {id:"info",    label:"AFLØNNING",  show:!isAliasOnly},
    {id:"admin",   label:"ADMIN",      show:isAdmin},
    {id:"profile", label:"MIN PROFIL", show:true},
  ].filter(n=>n.show);

  const defaultView=isAliasOnly?"alias":"bookings";
  const effectiveView=(!nav.find(n=>n.id===view))?defaultView:view;

  const meta={
    bookings:{title:"BOOKINGER",      sub:"Klik på en række for at se detaljer"},
    alias:   {title:"ALIAS",          sub:"Klik på en række for at se detaljer"},
    payroll: {title:"LØNOVERSIGT",    sub:"Afholdte jobs og udbetalinger"},
    info:    {title:"AFLØNNING",      sub:"Løn og fordeling i North Avenue"},
    admin:   {title:"ADMINISTRATION", sub:"Brugere og indstillinger"},
    profile: {title:"MIN PROFIL",     sub:"Rediger dine oplysninger"},
  };

  return(<div style={{minHeight:"100vh",background:T.black,color:T.white,display:"flex",fontFamily:"'Poppins',sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>

    {/* Mobile top bar */}
    {isMobile&&(<div style={{position:"fixed",top:0,left:0,right:0,height:56,background:T.dim,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",zIndex:20}}>
      <div style={{fontWeight:800,fontSize:20,letterSpacing:"-0.01em",color:T.white,lineHeight:1}}>NORTH<span style={{color:T.orange}}>AVENUE</span></div>
      <button onClick={()=>setMobileMenuOpen(o=>!o)} style={{background:"none",border:`1px solid ${T.border}`,color:T.white,cursor:"pointer",padding:"6px 10px",fontSize:16,borderRadius:2}}>
        {mobileMenuOpen?"✕":"☰"}
      </button>
    </div>)}

    {/* Mobile menu overlay */}
    {isMobile&&mobileMenuOpen&&(<div style={{position:"fixed",inset:0,zIndex:19,background:T.dim,paddingTop:56,display:"flex",flexDirection:"column"}}>
      <nav style={{padding:"16px 0",flex:1}}>
        {nav.map(n=>(<button key={n.id} onClick={()=>{setView(n.id);setMobileMenuOpen(false);}}
          style={{display:"block",width:"100%",textAlign:"left",padding:"14px 24px",background:"transparent",border:"none",borderLeft:effectiveView===n.id?`3px solid ${T.orange}`:"3px solid transparent",color:effectiveView===n.id?T.white:T.muted,cursor:"pointer",fontSize:14,letterSpacing:"0.1em",fontWeight:effectiveView===n.id?700:400}}>
          {n.label}
        </button>))}
      </nav>
      <div style={{padding:16,borderTop:`1px solid ${T.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:8}}>{curU.first} · {isAdmin?"ADMIN":isSub?"VIKAR":"MUSIKER"}</div>
        <button onClick={()=>signOut({callbackUrl:"/login"})} style={{width:"100%",padding:"10px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:11,letterSpacing:"0.06em"}}>LOG UD</button>
      </div>
    </div>)}

    {/* Desktop sidebar */}
    {!isMobile&&(<div style={{width:isTablet?180:240,background:T.dim,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,bottom:0,zIndex:10}}>
      <div style={{padding:isTablet?"20px 16px":"28px 22px 22px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{marginBottom:10}}><NAStar size={isTablet?24:32} color={T.orange}/></div>
        <div style={{fontWeight:800,fontSize:isTablet?28:42,letterSpacing:"-0.01em",color:T.white,lineHeight:0.9}}>NORTH<br/><span style={{color:T.orange}}>AVENUE</span></div>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.15em",marginTop:10}}>BACKSTAGE</div>
      </div>
      <nav style={{padding:"14px 0",flex:1,overflowY:"auto"}}>
        {nav.map(n=>(<button key={n.id} onClick={()=>setView(n.id)}
          style={{display:"block",width:"100%",textAlign:"left",padding:isTablet?"9px 16px":"11px 22px",background:"transparent",border:"none",borderLeft:effectiveView===n.id?`2px solid ${T.orange}`:"2px solid transparent",color:effectiveView===n.id?T.white:T.muted,cursor:"pointer",fontSize:isTablet?10:11,letterSpacing:"0.1em",fontWeight:effectiveView===n.id?700:400,transition:"all .15s"}}>
          {n.label}
        </button>))}
      </nav>
      <div style={{padding:isTablet?12:16,borderTop:`1px solid ${T.border}`}}>
        <div style={{border:`1px solid ${T.border}`,borderRadius:12,padding:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,background:userColor(curU),borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{curU.initials||"?"}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{curU.first}</div>
              <div style={{fontSize:9,fontWeight:600,color:T.muted,fontFamily:"'Poppins',sans-serif",letterSpacing:"0.18em"}}>{isAdmin?"ADMIN":isSub?"VIKAR":isAliasOnly?"ALIAS":"MUSIKER"}</div>
            </div>
          </div>
        </div>
        <button onClick={()=>signOut({callbackUrl:"/login"})} style={{width:"100%",marginTop:12,padding:"8px",background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:10,letterSpacing:"0.2em",fontFamily:"'Poppins',sans-serif",fontWeight:600,transition:"color .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.color=T.orange;}} onMouseLeave={e=>{e.currentTarget.style.color=T.muted;}}>LOG UD</button>
      </div>
    </div>)}

    {/* Main content */}
    <div style={{marginLeft:isMobile?0:isTablet?180:240,flex:1,padding:isMobile?"72px 16px 24px":isTablet?"24px":40,minWidth:0}}>
      <div style={{position:"fixed",top:0,right:0,width:"40%",height:"40%",background:`radial-gradient(ellipse at top right,${T.orange}07 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{marginBottom:isMobile?16:28,paddingBottom:isMobile?12:20,borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><NAStar size={10} color={T.orange} opacity={0.6}/><span style={{fontSize:9,color:T.muted,letterSpacing:"0.14em"}}>{meta[effectiveView]?.sub}</span></div>
          <h1 style={{fontSize:isMobile?18:isTablet?22:28,fontWeight:800,color:T.white,margin:0,letterSpacing:"0.04em"}}>{meta[effectiveView]?.title}</h1>
        </div>
        {effectiveView==="bookings"&&<BookingsView currentUser={curU} bookings={bookings} setBookings={handleSetBookings} users={users} T={T} darkMode={darkMode}/>}
        {effectiveView==="alias"   &&<AliasView currentUser={curU} aliasData={aliasData} setAliasData={handleSetAliasData} users={users} T={T} darkMode={darkMode}/>}
        {effectiveView==="payroll" &&<PayrollView currentUser={curU} bookings={bookings} payments={payments} setPayments={handleSetPayments} users={users} T={T}/>}
        {effectiveView==="info"    &&<InfoView currentUser={curU} T={T}/>}
        {effectiveView==="admin"   &&<AdminView users={users} setUsers={handleSetUsers} T={T} onReorder={handleReorder} onUserSaved={handleUserSaved}/>}
        {effectiveView==="profile" &&<ProfileView currentUser={curU} users={users} setUsers={handleSetUsers} T={T} darkMode={darkMode} setDarkMode={handleTheme}/>}
      </div>
    </div>
  </div>);
}
