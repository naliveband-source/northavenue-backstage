"use client";
// v2.1 — Design C
import { useState, useMemo, useRef, useEffect } from "react";

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

// ── ConfirmModal ───────────────────────────────────────────────────────────
function ConfirmModal({message,onConfirm,onCancel,T}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000e",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:T.dim,border:`1px solid ${T.red}55`,padding:28,minWidth:320,maxWidth:420,boxShadow:"0 16px 48px #0009"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:9,color:T.red,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:14}}>ER DU SIKKER?</div>
        <p style={{fontSize:13,color:T.muted,fontFamily:"'Poppins',sans-serif",lineHeight:1.7,marginBottom:20}}>{message}</p>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn onClick={onCancel} color={T.muted} small>ANNULLER</Btn>
          <Btn onClick={onConfirm} color={T.red} small>JA, FJERN</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Job Detail Popup (read-only) ───────────────────────────────────────────
function JobDetailPopup({booking,users,isSub,T,onClose}){
  const mp = calcMusicianPay(booking.bandPay);
  const sp = calcSubPay(mp);
  const memberUsers = users.filter(u=>u.musicianId&&u.subType!=="substitute"&&u.subType!=="alias");
  const subUsers    = users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId);
  const past = isPast(booking.date);
  const oA = "#D4622A";

  const Row = ({label,value,accent=false})=>(
    <div style={{display:"flex",gap:16,padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",minWidth:100,flexShrink:0}}>{label}</span>
      <span style={{fontSize:13,color:accent?T.orange:T.cardText,fontWeight:accent?700:500,fontFamily:"'Poppins',sans-serif"}}>{value||"–"}</span>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.dim,border:`1px solid ${past?oA+"55":T.border}`,width:560,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px #0009"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            {past&&<div style={{fontSize:8,color:oA,letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:4}}>AFHOLDT</div>}
            <div style={{fontSize:20,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.01em",lineHeight:1.1}}>{booking.type}</div>
            <div style={{fontSize:13,color:T.muted,marginTop:4,fontFamily:"'Poppins',sans-serif"}}>{fmtDate(booking.date)}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:22,lineHeight:1,padding:"0 4px",flexShrink:0}}>×</button>
        </div>

        {/* Details */}
        <div style={{padding:"4px 24px 20px"}}>
          <Row label="BY" value={booking.city}/>
          <Row label="ADRESSE" value={booking.address}/>
          <Row label="AFGANG" value={booking.departure}/>
          <Row label="ANKOMST" value={booking.arrival}/>
          <Row label="SPILLETID" value={booking.playTime}/>
          <Row label="SÆT" value={booking.sets}/>
          <Row label="BOOKER" value={booking.booker}/>
          <Row label="MUSIKER LØN" value={fmt(isSub?sp:mp)} accent/>
          {booking.notes&&<Row label="NOTE" value={booking.notes}/>}

          {/* Musikere */}
          {!isSub&&(<>
            <div style={{marginTop:16,marginBottom:8,fontSize:9,color:T.muted,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",fontWeight:600}}>MUSIKERE</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {memberUsers.map(u=>{
                const isIn=booking.memberIds.includes(u.musicianId);
                const c=SPOT[u.id];
                return(<div key={u.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:isIn?c+"18":T.black,border:`1px solid ${isIn?c+"44":T.border}`,borderRadius:2,opacity:isIn?1:0.4}}>
                  <span style={{width:18,height:18,background:c+"22",border:`1px solid ${c}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif"}}>{u.initials}</span>
                  <span style={{fontSize:11,color:isIn?T.white:T.muted,fontFamily:"'Poppins',sans-serif",fontWeight:isIn?600:400}}>{u.first}</span>
                </div>);
              })}
            </div>
            {booking.substituteIds.length>0&&(<>
              <div style={{marginTop:12,marginBottom:8,fontSize:9,color:T.muted,letterSpacing:"0.1em",fontFamily:"'Poppins',sans-serif",fontWeight:600}}>VIKARER</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {booking.substituteIds.map(mid=>{
                  const u=users.find(x=>x.musicianId===mid);if(!u)return null;
                  const c=SPOT[u.id];
                  return(<div key={mid} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:c+"18",border:`1px solid ${c+"44"}`,borderRadius:2}}>
                    <span style={{width:18,height:18,background:c+"22",border:`1px solid ${c}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif"}}>{u.initials}</span>
                    <span style={{fontSize:11,color:T.white,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>{u.first}</span>
                    <span style={{fontSize:9,color:c,fontFamily:"'Poppins',sans-serif",fontWeight:700}}>VIKAR</span>
                  </div>);
                })}
              </div>
            </>)}
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── Alias Job Detail Popup ─────────────────────────────────────────────────
function AliasDetailPopup({booking,T,onClose}){
  const past=isPast(booking.date);
  const oA="#D4622A";
  const Row=({label,value,accent=false,green=false})=>(
    <div style={{display:"flex",gap:16,padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:10,color:T.muted,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",minWidth:110,flexShrink:0}}>{label}</span>
      <span style={{fontSize:13,color:accent?T.orange:green?T.green:T.cardText,fontWeight:accent||green?700:500,fontFamily:"'Poppins',sans-serif"}}>{value||"–"}</span>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.dim,border:`1px solid ${past?oA+"55":T.border}`,width:560,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px #0009"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            {past&&<div style={{fontSize:8,color:oA,letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginBottom:4}}>AFHOLDT</div>}
            <div style={{fontSize:20,fontWeight:800,color:T.white,fontFamily:"'Poppins',sans-serif",letterSpacing:"-0.01em",lineHeight:1.1}}>{booking.type}</div>
            <div style={{fontSize:13,color:T.muted,marginTop:4,fontFamily:"'Poppins',sans-serif"}}>{fmtDate(booking.date)}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:22,lineHeight:1,padding:"0 4px",flexShrink:0}}>×</button>
        </div>
        <div style={{padding:"4px 24px 20px"}}>
          <Row label="BY" value={booking.city}/>
          <Row label="ADRESSE" value={booking.address}/>
          <Row label="ANKOMST" value={booking.arrival}/>
          <Row label="SPILLETID" value={booking.playTime}/>
          <Row label="SÆT" value={booking.sets}/>
          <Row label="BEMANDING" value={`${booking.musicians} musikere`}/>
          <Row label="BELØB" value={fmt(booking.bandPay)} accent/>
          <Row label="BOOKING" value={fmt(booking.bookingFee||0)}/>
          <Row label="BIL + GEAR" value={booking.carGear?"Ja":"Nej"} green={booking.carGear}/>
          <Row label="ARRANGØR" value={booking.contact}/>
          <Row label="TELEFON" value={booking.phone}/>
          <Row label="BOOKER" value={booking.booker}/>
          {booking.notes&&<Row label="NOTE" value={booking.notes}/>}
        </div>
      </div>
    </div>
  );
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
  const color=SPOT[user.id]||"#888";
  return(<>
    <span onClick={()=>setOpen(true)} title={`${user.first} ${user.last}`}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:6,
        background:active?color+"33":"#2A262833",border:`1px solid ${active?color+"55":color+"22"}`,color:active?color:color+"77",
        fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",cursor:"pointer",flexShrink:0,userSelect:"none",
        filter:active?"none":"blur(1.5px) grayscale(40%)",opacity:active?1:0.5,transition:"all .2s"}}>
      {user.initials}
    </span>
    {open&&(<div style={{position:"fixed",inset:0,background:"#000d",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setOpen(false)}>
      <div style={{background:"#1E1C1D",border:`1px solid ${color}55`,borderRadius:16,padding:28,minWidth:260,maxWidth:340}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          {user.avatar?<img src={user.avatar} alt="" style={{width:52,height:52,borderRadius:8,objectFit:"cover",border:`2px solid ${color}`}}/>
            :<div style={{width:52,height:52,background:color+"22",border:`2px solid ${color}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color,fontFamily:"'Poppins',sans-serif"}}>{user.initials}</div>}
          <div>
            <div style={{fontSize:17,fontWeight:800,color:"#F8F5E6",fontFamily:"'Poppins',sans-serif"}}>{user.first} {user.last}</div>
            <div style={{fontSize:11,color:"#B0A8A4",fontFamily:"'Poppins',sans-serif",marginTop:3}}>{user.instrument||"–"}</div>
          </div>
        </div>
        {user.phone&&<div style={{display:"flex",gap:10,marginBottom:6}}><span style={{fontSize:11,color:"#7A7470",minWidth:60,fontFamily:"'Poppins',sans-serif"}}>Telefon</span><span style={{fontSize:13,color:"#E8E0DC",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{user.phone}</span></div>}
        <div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:"#7A7470",minWidth:60,fontFamily:"'Poppins',sans-serif"}}>Email</span><span style={{fontSize:13,color:"#E8E0DC",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{user.email}</span></div>
        <button onClick={()=>setOpen(false)} style={{marginTop:20,width:"100%",padding:"8px",background:"transparent",border:"1px solid #2E2B2C",borderRadius:8,color:"#6B6468",cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:10,letterSpacing:"0.08em"}}>LUK</button>
      </div>
    </div>)}
  </>);
}

function PayBadge({amount,color}){
  const br=PAY_BRACKETS.find(b=>b.pay===amount)||PAY_BRACKETS.slice(-1)[0];
  const c=color||br.color;
  return <span style={{background:c+"22",border:`1px solid ${c}55`,color:c,borderRadius:2,padding:"2px 9px",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>{fmt(amount)}</span>;
}

function Btn({children,onClick,color,style={},small=false}){
  const [h,setH]=useState(false);
  return <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{padding:small?"5px 14px":"9px 20px",background:h?color+"dd":color,border:"none",color:"#F8F5E6",fontWeight:700,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:small?10:11,letterSpacing:"0.07em",transition:"all .15s",borderRadius:8,...style}}>
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

// ── Booking Edit Modal ─────────────────────────────────────────────────────
function BookingEditModal({booking,users,onSave,onDelete,onClose,T}){
  const [form,setForm]=useState({...booking,bandPay:String(booking.bandPay)});
  const [askDel,setAskDel]=useState(false);
  const memberUsers=users.filter(u=>u.musicianId&&u.subType!=="substitute"&&u.subType!=="alias");
  const subUsers   =users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId);
  const toggleMember=mid=>setForm(p=>{const has=p.memberIds.includes(mid);return{...p,memberIds:has?p.memberIds.filter(x=>x!==mid):[...p.memberIds,mid]};});
  const toggleSub   =mid=>setForm(p=>{const has=p.substituteIds.includes(mid);return{...p,substituteIds:has?p.substituteIds.filter(x=>x!==mid):[...p.substituteIds,mid]};});
  if(askDel)return <ConfirmModal message="Dette job vil blive fjernet permanent." onConfirm={onDelete} onCancel={()=>setAskDel(false)} T={T}/>;
  return(<Modal title={`REDIGER JOB · ${booking.type}`} onClose={onClose} T={T} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
      <Field label="DATO" T={T}><Inp value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} type="date" T={T}/></Field>
      <Field label="JOB TYPE" T={T}><Inp value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} T={T}/></Field>
      <Field label="BY" T={T}><Inp value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))} T={T}/></Field>
      <Field label="ADRESSE" T={T}><Inp value={form.address||""} onChange={e=>setForm(p=>({...p,address:e.target.value}))} T={T}/></Field>
      <Field label="AFGANG" T={T}><Inp value={form.departure||""} onChange={e=>setForm(p=>({...p,departure:e.target.value}))} placeholder="17:00" T={T}/></Field>
      <Field label="ANKOMST" T={T}><Inp value={form.arrival||""} onChange={e=>setForm(p=>({...p,arrival:e.target.value}))} placeholder="18:30" T={T}/></Field>
      <Field label="SPILLETID" T={T}><Inp value={form.playTime||""} onChange={e=>setForm(p=>({...p,playTime:e.target.value}))} placeholder="21:00–23:30" T={T}/></Field>
      <Field label="SÆT" T={T}><Inp value={form.sets||""} onChange={e=>setForm(p=>({...p,sets:e.target.value}))} T={T}/></Field>
      <Field label="BELØB (kr)" T={T}><Inp value={form.bandPay} onChange={e=>setForm(p=>({...p,bandPay:e.target.value}))} type="number" T={T}/></Field>
      <Field label="BOOKER" T={T}><Inp value={form.booker||""} onChange={e=>setForm(p=>({...p,booker:e.target.value}))} T={T}/></Field>
    </div>
    <Field label="NOTE" T={T}>
      <textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
        style={{width:"100%",padding:"10px 12px",background:T.black,border:`1px solid ${T.border}`,color:T.white,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Poppins',sans-serif",borderRadius:0,resize:"vertical",minHeight:60}}/>
    </Field>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:9,color:T.orange,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:10}}>MUSIKERE</div>
      {memberUsers.map(u=>{const isIn=form.memberIds.includes(u.musicianId);const c=SPOT[u.id];
        return(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",marginBottom:4,background:T.black,border:`1px solid ${isIn?c+"44":T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:26,height:26,background:c+"22",border:`1px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif"}}>{u.initials}</span>
            <div style={{fontSize:13,color:T.white,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{u.first} {u.last}</div>
          </div>
          <button onClick={()=>toggleMember(u.musicianId)} style={{padding:"4px 10px",border:`1px solid ${isIn?T.green:T.red}`,background:isIn?T.green+"22":T.red+"18",color:isIn?T.green:T.red,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{isIn?"MED ✓":"FRAVÆRENDE"}</button>
        </div>);
      })}
    </div>
    <div style={{marginBottom:20}}>
      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:10}}>VIKARER</div>
      {subUsers.map(u=>{const isIn=form.substituteIds.includes(u.musicianId);const c=SPOT[u.id];
        return(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",marginBottom:4,background:T.black,border:`1px solid ${isIn?c+"44":T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:26,height:26,background:c+"22",border:`1px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif"}}>{u.initials}</span>
            <div><div style={{fontSize:13,color:T.white,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{u.first} {u.last}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>{u.instrument}</div></div>
          </div>
          <button onClick={()=>toggleSub(u.musicianId)} style={{padding:"4px 10px",border:`1px solid ${isIn?T.green:T.border}`,background:isIn?T.green+"22":"transparent",color:isIn?T.green:T.muted,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{isIn?"MED ✓":"TILFØJ"}</button>
        </div>);
      })}
    </div>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <Btn onClick={()=>setAskDel(true)} color={T.red} small>FJERN JOB</Btn>
      <div style={{display:"flex",gap:8}}>
        <Btn onClick={onClose} color={T.muted} small>ANNULLER</Btn>
        <Btn onClick={()=>onSave({...form,bandPay:parseFloat(form.bandPay)||0})} color={T.orange} small>GEM ÆNDRINGER</Btn>
      </div>
    </div>
  </Modal>);
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
  const visibleBookings=isSub?bookings.filter(b=>b.substituteIds.includes(currentUser.musicianId)):bookings;
  const filtered=useMemo(()=>visibleBookings.filter(b=>getYear(b.date)===yr),[visibleBookings,yr]);

  const memberUsers=users.filter(u=>u.musicianId&&u.subType!=="substitute"&&u.subType!=="alias");
  const subUsers=users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId);
  const getUserByMid=mid=>users.find(u=>u.musicianId===mid);

  const myJobs=filtered.filter(b=>isSub?b.substituteIds.includes(currentUser.musicianId):b.memberIds.includes(currentUser.musicianId));
  const totalBand=filtered.reduce((s,b)=>s+b.bandPay,0);
  const totalMPay=filtered.reduce((s,b)=>s+calcMusicianPay(b.bandPay),0);
  const myEarned=isSub?myJobs.reduce((s,b)=>s+calcSubPay(calcMusicianPay(b.bandPay)),0):myJobs.reduce((s,b)=>s+calcMusicianPay(b.bandPay),0);

  const toggleMember=(bid,mid)=>setBookings(prev=>prev.map(b=>{
    if(b.id!==bid)return b;
    const has=b.memberIds.includes(mid);
    return {...b,memberIds:has?b.memberIds.filter(x=>x!==mid):[...b.memberIds,mid]};
  }));

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

    {/* Card view — single column all screen sizes */}
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {filtered.map(b=>{
        const past=isPast(b.date);
        const mp=calcMusicianPay(b.bandPay);
        const sp=calcSubPay(mp);
        const pay=isSub?sp:mp;
        const iAmIn=isSub?b.substituteIds.includes(currentUser.musicianId):b.memberIds.includes(currentUser.musicianId);
        const isMyJob=isAdmin||iAmIn;
        const br=PAY_BRACKETS.find(x=>x.pay===pay)||PAY_BRACKETS.slice(-1)[0];
        const weekday=new Date(b.date).toLocaleDateString("da-DK",{weekday:"short"}).toUpperCase();
        const dateStr=new Date(b.date).toLocaleDateString("da-DK",{day:"2-digit",month:"short"});
        return(
          <div key={b.id} onClick={()=>setDetailBooking(b)}
            style={{background:T.dim,borderRadius:12,overflow:"hidden",display:"flex",cursor:"pointer",opacity:past?0.65:isMyJob?1:0.3,position:"relative"}}>
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
                  {memberUsers.map(u=><UserChip key={u.id} user={u} active={b.memberIds.includes(u.musicianId)} T={T}/>)}
                </div>
              )}
              <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                <div style={{fontSize:isMobile?14:16,fontWeight:800,color:isAdmin?T.orange:br.color,fontFamily:"'Poppins',sans-serif"}}>{isAdmin?fmt(b.bandPay):fmt(pay)}</div>
                {!isAdmin&&!isSub&&!past&&(
                  <button onClick={e=>{e.stopPropagation();toggleMember(b.id,currentUser.musicianId);}}
                    style={{padding:"4px 10px",border:`1px solid ${iAmIn?T.red:T.green}`,background:iAmIn?T.red+"18":T.green+"22",color:iAmIn?T.red:T.green,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif",borderRadius:6}}>
                    {iAmIn?"MELD FRAVÆRENDE":"MELD PÅ"}
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
      {filtered.length===0&&<div style={{padding:"32px 16px",textAlign:"center",color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:13}}>Ingen jobs dette år</div>}
    </div>

    {detailBooking&&<JobDetailPopup booking={detailBooking} users={users} isSub={isSub} T={T} onClose={()=>setDetailBooking(null)}/>}
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
  const [editForm,setEditForm]=useState({});
  const [confirmDel,setConfirmDel]=useState(null);

  const managerBookings=useMemo(()=>(aliasData[selManager]||[]).filter(b=>getYear(b.date)===yr).sort((a,b)=>new Date(a.date)-new Date(b.date)),[aliasData,selManager,yr]);
  const totalPay=managerBookings.reduce((s,b)=>s+b.bandPay,0);
  const totalBook=managerBookings.reduce((s,b)=>s+(b.bookingFee||0),0);

  const openEdit=b=>{setEditForm({...b,bandPay:String(b.bandPay),bookingFee:String(b.bookingFee||"")});setEditModal(b);};
  const saveEdit=()=>{
    const updated={...editForm,bandPay:parseFloat(editForm.bandPay)||0,bookingFee:parseFloat(editForm.bookingFee)||0,carGear:editForm.carGear===true||editForm.carGear==="ja"};
    setAliasData(prev=>({...prev,[selManager]:(prev[selManager]||[]).map(b=>b.id===editModal.id?updated:b)}));
    setEditModal(null);
  };
  const doDelete=id=>{setAliasData(prev=>({...prev,[selManager]:(prev[selManager]||[]).filter(b=>b.id!==id)}));setConfirmDel(null);setEditModal(null);};

  const oA=darkMode?"#D4622A":"#C4521F";
  const hd={padding:"9px 12px",textAlign:"left",color:T.muted,fontSize:11,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",whiteSpace:"nowrap",fontWeight:600};
  const winW=useWindowWidth();
  const isMobile=winW<768;
  const isTablet=winW<1400;
  if(!selManager)return <div style={{color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:14,padding:20}}>Ingen alias-visning tilgængelig.</div>;

  return(<div>
    {isAdmin&&visibleManagers.length>1&&(
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {visibleManagers.map(m=>{const c=SPOT[m.id]||"#888";const active=selManager===m.id;
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

    {/* Alias cards — Design C */}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {managerBookings.map(b=>{
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
              <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                {past&&<span style={{fontSize:8,color:oA,fontWeight:700,letterSpacing:"0.08em",fontFamily:"'Poppins',sans-serif",background:oA+"18",padding:"3px 8px",borderRadius:4}}>AFHOLDT</span>}
                <div style={{fontSize:isMobile?14:16,fontWeight:800,color:T.orange,fontFamily:"'Poppins',sans-serif"}}>{fmt(b.bandPay)}</div>
                {isAdmin&&<button onClick={e=>{e.stopPropagation();openEdit(b);}} style={{padding:"4px 10px",border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Poppins',sans-serif",borderRadius:6}}>REDIGER</button>}
              </div>
            </div>
          </div>
        );
      })}
      {managerBookings.length===0&&<div style={{padding:"32px 16px",textAlign:"center",color:T.muted,fontFamily:"'Poppins',sans-serif",fontSize:13}}>Ingen jobs dette år</div>}
    </div>

    {detailBooking&&<AliasDetailPopup booking={detailBooking} T={T} onClose={()=>setDetailBooking(null)}/>}

    {editModal&&(<Modal title="REDIGER ALIAS JOB" onClose={()=>setEditModal(null)} T={T} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="DATO" T={T}><Inp value={editForm.date} onChange={e=>setEditForm(p=>({...p,date:e.target.value}))} type="date" T={T}/></Field>
        <Field label="JOB TYPE" T={T}><Inp value={editForm.type} onChange={e=>setEditForm(p=>({...p,type:e.target.value}))} T={T}/></Field>
        <Field label="BY" T={T}><Inp value={editForm.city} onChange={e=>setEditForm(p=>({...p,city:e.target.value}))} T={T}/></Field>
        <Field label="ADRESSE" T={T}><Inp value={editForm.address} onChange={e=>setEditForm(p=>({...p,address:e.target.value}))} T={T}/></Field>
        <Field label="ANKOMST" T={T}><Inp value={editForm.arrival} onChange={e=>setEditForm(p=>({...p,arrival:e.target.value}))} T={T}/></Field>
        <Field label="SPILLETID" T={T}><Inp value={editForm.playTime} onChange={e=>setEditForm(p=>({...p,playTime:e.target.value}))} T={T}/></Field>
        <Field label="SÆT" T={T}><Inp value={editForm.sets} onChange={e=>setEditForm(p=>({...p,sets:e.target.value}))} T={T}/></Field>
        <Field label="BEMANDING" T={T}><Inp value={editForm.musicians} onChange={e=>setEditForm(p=>({...p,musicians:e.target.value}))} type="number" T={T}/></Field>
        <Field label="BELØB (kr)" T={T}><Inp value={editForm.bandPay} onChange={e=>setEditForm(p=>({...p,bandPay:e.target.value}))} type="number" T={T}/></Field>
        <Field label="BOOKING (kr)" T={T}><Inp value={editForm.bookingFee} onChange={e=>setEditForm(p=>({...p,bookingFee:e.target.value}))} type="number" T={T}/></Field>
        <Field label="BIL + GEAR" T={T}>
          <select value={editForm.carGear?"ja":"nej"} onChange={e=>setEditForm(p=>({...p,carGear:e.target.value==="ja"}))}
            style={{width:"100%",padding:"10px 12px",background:T.black,border:`1px solid ${T.border}`,color:T.white,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif",borderRadius:0}}>
            <option value="ja">Ja</option><option value="nej">Nej</option>
          </select>
        </Field>
        <Field label="ARRANGØR" T={T}><Inp value={editForm.contact} onChange={e=>setEditForm(p=>({...p,contact:e.target.value}))} T={T}/></Field>
        <Field label="TELEFON" T={T}><Inp value={editForm.phone} onChange={e=>setEditForm(p=>({...p,phone:e.target.value}))} T={T}/></Field>
        <Field label="BOOKER" T={T}><Inp value={editForm.booker} onChange={e=>setEditForm(p=>({...p,booker:e.target.value}))} T={T}/></Field>
      </div>
      <Field label="NOTE" T={T}>
        <textarea value={editForm.notes||""} onChange={e=>setEditForm(p=>({...p,notes:e.target.value}))}
          style={{width:"100%",padding:"10px 12px",background:T.black,border:`1px solid ${T.border}`,color:T.white,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Poppins',sans-serif",borderRadius:0,resize:"vertical",minHeight:60}}/>
      </Field>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
        <Btn onClick={()=>setConfirmDel(editModal.id)} color={T.red} small>FJERN JOB</Btn>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setEditModal(null)} color={T.muted} small>ANNULLER</Btn>
          <Btn onClick={saveEdit} color={T.orange} small>GEM ÆNDRINGER</Btn>
        </div>
      </div>
    </Modal>)}
    {confirmDel&&<ConfirmModal message="Dette alias-job vil blive fjernet permanent og kan ikke fortrydes." onConfirm={()=>doDelete(confirmDel)} onCancel={()=>setConfirmDel(null)} T={T}/>}
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

  const memberUsers=users.filter(u=>u.subType==="member"&&u.musicianId);
  const ownerUsers =users.filter(u=>u.subType==="owner"&&u.musicianId);
  const subUsers   =users.filter(u=>(u.subType==="substitute"||u.tags?.includes("vikar"))&&u.musicianId);

  const groupUsers=isSub?subUsers.filter(u=>u.id===currentUser.id):!isAdmin?memberUsers.filter(u=>u.id===currentUser.id):group==="members"?memberUsers:group==="owners"?ownerUsers:subUsers;
  const displayUsers=isAdmin&&selIds?groupUsers.filter(u=>selIds.includes(u.id)):groupUsers;
  const jobsForYear=bookings.filter(b=>isPast(b.date)&&getYear(b.date)===yr);

  const addPayment=()=>{
    if(!na||!nn||!addTarget)return;
    const e2={id:`p${Date.now()}`,date:nd||new Date().toISOString().slice(0,10),amount:parseFloat(na),note:nn};
    setPayments(prev=>({...prev,[addTarget]:[...(prev[addTarget]||[]),e2]}));
    setNa("");setNn("");setNd("");setShowAdd(false);setAddTarget(null);
  };
  const removePay=(mid,pid)=>{setPayments(prev=>({...prev,[mid]:(prev[mid]||[]).filter(p=>p.id!==pid)}));setConfirmRemove(null);};
  const tabSt=active=>({padding:"10px 20px",background:active?T.orange:"transparent",border:`1px solid ${active?T.orange:T.border}`,borderRadius:10,color:active?"#F8F5E6":T.muted,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:11,letterSpacing:"0.08em",fontWeight:active?700:400,transition:"all .15s"});

  return(<div>
    <YearTabs value={yr} onChange={setYr} T={T} years={YEAR_OPTS}/>
    {isAdmin&&(<div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {[{id:"members",l:"NORTH AVENUE"},{id:"owners",l:"EJERE"},{id:"substitutes",l:"VIKARER"}].map(g=>(<button key={g.id} onClick={()=>{setGroup(g.id);setSelIds(null);}} style={tabSt(group===g.id)}>{g.l}</button>))}
    </div>)}
    {isAdmin&&groupUsers.length>1&&(<div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
      {groupUsers.map(u=>{const c=SPOT[u.id];const active=!selIds||selIds.includes(u.id);
        return(<button key={u.id} onClick={()=>{
          if(!selIds){setSelIds([u.id]);return;}
          const next=selIds.includes(u.id)?selIds.filter(x=>x!==u.id):[...selIds,u.id];
          setSelIds(next.length===0||next.length===groupUsers.length?null:next);
        }} style={{padding:"7px 16px",border:`1px solid ${active?c:T.border}`,borderRadius:20,background:active?c+"22":"transparent",color:active?c:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Poppins',sans-serif",transition:"all .15s"}}>{u.first}</button>);
      })}
    </div>)}

    {displayUsers.map(u=>{
      const isOwner=u.subType==="owner";const isSubU=hasVikar(u)&&!u.isAdmin;
      const jobs=jobsForYear.filter(b=>isSubU?b.substituteIds?.includes(u.musicianId):b.memberIds.includes(u.musicianId));
      const earned=isOwner?jobs.length*OWNER_PAY:isSubU?jobs.reduce((s,b)=>s+calcSubPay(calcMusicianPay(b.bandPay)),0):jobs.reduce((s,b)=>s+calcMusicianPay(b.bandPay),0);
      const myPay=(payments[u.musicianId]||[]).filter(p=>getYear(p.date)===yr);
      const paid=myPay.reduce((s,p)=>s+p.amount,0);
      const balance=earned+paid;const color=SPOT[u.id];
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <div style={{fontSize:9,color:T.subText,letterSpacing:"0.12em",marginBottom:8,fontFamily:"'Poppins',sans-serif",fontWeight:600}}>JOBS · {jobs.length}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {jobs.map(b=>{const mp=calcMusicianPay(b.bandPay);const pay=isOwner?OWNER_PAY:isSubU?calcSubPay(mp):mp;
                return(<div key={b.id} style={{background:T.dim,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:12,color:T.cardText,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{b.type}</div><div style={{fontSize:10,color:T.subText,marginTop:2,fontFamily:"'Poppins',sans-serif"}}>{fmtDateShort(b.date)} · {b.city}</div></div>
                  <PayBadge amount={pay}/>
                </div>);
              })}
              {jobs.length===0&&<div style={{background:T.dim,borderRadius:8,padding:"16px 14px",textAlign:"center",color:T.muted,fontSize:12,fontFamily:"'Poppins',sans-serif"}}>Ingen afholdte jobs</div>}
            </div>
          </div>
          <div>
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
          </div>
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

// ── ADMIN ──────────────────────────────────────────────────────────────────
function AdminView({users,setUsers,T}){
  const [editing,setEditing]=useState(null);
  const blank={first:"",last:"",initials:"",instrument:"",email:"",password:"",isAdmin:false,tags:[],phone:"",avatar:null};
  const [form,setForm]=useState(blank);
  const [confirmRemoveUser,setConfirmRemoveUser]=useState(null);
  const avatarRef=useRef();
  const nextMid=()=>Math.max(0,...users.map(u=>u.musicianId||0))+1;
  const deriveSubType=(isAdm,tags)=>{
    if(isAdm)return "owner";
    if(tags.includes("alias_manager")&&!tags.includes("vikar")&&!tags.includes("musiker"))return "alias";
    if(tags.includes("vikar"))return "substitute";
    return "member";
  };
  const openNew=()=>{setForm(blank);setEditing("new");};
  const openEdit=u=>{setForm({first:u.first,last:u.last,initials:u.initials,instrument:u.instrument||"",email:u.email,password:"",isAdmin:u.isAdmin||false,tags:u.tags||[],phone:u.phone||"",avatar:u.avatar||null});setEditing(u);};
  const toggleTag=tag=>setForm(p=>({...p,tags:p.tags.includes(tag)?p.tags.filter(t=>t!==tag):[...p.tags,tag]}));
  const handleAvatarFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setForm(p=>({...p,avatar:ev.target.result}));r.readAsDataURL(f);};
  const save=()=>{
    if(!form.first||!form.email)return;
    const subType=deriveSubType(form.isAdmin,form.tags);
    const role=form.isAdmin?"admin":"musician";
    const needsMid=subType!=="alias"||form.tags.includes("vikar");
    if(editing==="new"){
      setUsers(prev=>[...prev,{id:`u${Date.now()}`,musicianId:needsMid?nextMid():null,name:form.first,role,subType,isAdmin:form.isAdmin,...form,...(form.password?{}:{password:"changeme"})}]);
    } else {
      setUsers(prev=>prev.map(u=>u.id===editing.id?{...u,first:form.first,last:form.last,initials:form.initials,instrument:form.instrument,email:form.email,isAdmin:form.isAdmin,role,subType,tags:form.tags,phone:form.phone,name:form.first,avatar:form.avatar,...(form.password?{password:form.password}:{})}:u));
    }
    setEditing(null);
  };
  const grpDefs=[
    {key:"owner",      label:"ADMIN / EJERE",    color:T.orange, filter:u=>u.subType==="owner"},
    {key:"member",     label:"MUSIKERE",          color:T.green,  filter:u=>u.subType==="member"},
    {key:"substitute", label:"VIKARER",           color:T.muted,  filter:u=>u.subType==="substitute"||u.tags?.includes("vikar")},
    {key:"alias",      label:"ALIAS ANSVARLIGE",  color:"#4B8B9B",filter:u=>u.tags?.includes("alias_manager")},
  ];
  return(<div style={{maxWidth:760}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700}}>BRUGERE & MUSIKERE · {users.length}</div>
      <Btn onClick={openNew} color={T.orange} small>+ OPRET BRUGER</Btn>
    </div>
    {grpDefs.map(grp=>{
      const grpUsers=users.filter(grp.filter);
      if(!grpUsers.length)return null;
      return(<div key={grp.key} style={{marginBottom:20}}>
        <div style={{fontSize:9,color:grp.color,letterSpacing:"0.12em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:8}}>{grp.label} · {grpUsers.length}</div>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:T.border}}>
          {grpUsers.map(u=>{const c=SPOT[u.id]||"#888";return(<div key={`${grp.key}-${u.id}`} style={{background:T.dim,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,borderLeft:`2px solid ${c}`}}>
            {u.avatar?<img src={u.avatar} alt="" style={{width:34,height:34,borderRadius:2,objectFit:"cover",flexShrink:0}}/>
              :<div style={{width:34,height:34,background:c+"22",border:`1px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:c,fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{u.initials||"?"}</div>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{u.first} {u.last}</div>
              <div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:1,display:"flex",gap:6,flexWrap:"wrap"}}>
                <span>{u.email}</span>
                {u.instrument&&<span>· {u.instrument}</span>}
                {(u.tags||[]).map(t=><span key={t} style={{background:T.orange+"22",color:T.orange,padding:"1px 6px",fontSize:9,letterSpacing:"0.07em",fontWeight:700}}>{TAG_LABELS[t]||t}</span>)}
              </div>
            </div>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              <Btn onClick={()=>openEdit(u)} color={T.muted} small>REDIGER</Btn>
              <Btn onClick={()=>setConfirmRemoveUser(u)} color={T.red} small>FJERN</Btn>
            </div>
          </div>);})}
        </div>
      </div>);
    })}
    <div style={{background:T.dim,padding:22,border:`1px solid ${T.border}`,marginTop:8}}>
      <div style={{fontSize:9,color:T.green,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:8}}>HUBSPOT SYNC</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:14,fontFamily:"'Poppins',sans-serif"}}>Synkronisering køres automatisk hver time via HubSpot API.</div>
      <Btn onClick={()=>{}} color={T.orange}>SYNKRONISER NU →</Btn>
    </div>
    {confirmRemoveUser&&<ConfirmModal message={`Er du sikker på at du vil fjerne "${confirmRemoveUser.first} ${confirmRemoveUser.last}"? Handlingen kan ikke fortrydes.`} onConfirm={()=>{setUsers(prev=>prev.filter(x=>x.id!==confirmRemoveUser.id));setConfirmRemoveUser(null);}} onCancel={()=>setConfirmRemoveUser(null)} T={T}/>}
    {editing!==null&&(<Modal title={editing==="new"?"OPRET BRUGER":"REDIGER BRUGER"} onClose={()=>setEditing(null)} T={T} wide>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <div style={{cursor:"pointer",flexShrink:0}} onClick={()=>avatarRef.current.click()}>
          {form.avatar?<img src={form.avatar} alt="" style={{width:56,height:56,borderRadius:2,objectFit:"cover",border:`2px solid ${T.orange}`}}/>
            :<div style={{width:56,height:56,background:T.black,border:`2px dashed ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>FOTO</div>}
          <input ref={avatarRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarFile}/>
        </div>
        <div style={{fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>Klik for at uploade profilbillede</div>
      </div>
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
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <Btn onClick={()=>setEditing(null)} color={T.muted} small>ANNULLER</Btn>
        <Btn onClick={save} color={T.orange} small>GEM</Btn>
      </div>
    </Modal>)}
  </div>);
}

// ── PROFILE ────────────────────────────────────────────────────────────────
function ProfileView({currentUser,users,setUsers,T,darkMode,setDarkMode}){
  const u=users.find(x=>x.id===currentUser.id)||currentUser;
  const [form,setForm]=useState({first:u.first||"",last:u.last||"",phone:u.phone||"",email:u.email||""});
  const [pw,setPw]=useState({old:"",next:"",conf:""});
  const [avatar,setAvatar]=useState(u.avatar||null);
  const [msg,setMsg]=useState(null);const [pwMsg,setPwMsg]=useState(null);
  const fileRef=useRef();
  const saveProfile=()=>{
    const taken=users.some(x=>x.id!==currentUser.id&&x.email===form.email);
    if(taken){setMsg({err:true,text:"Email er allerede i brug"});return;}
    setUsers(prev=>prev.map(x=>x.id===currentUser.id?{...x,...form,name:form.first,avatar}:x));
    setMsg({err:false,text:"Profil gemt ✓"});
  };
  const savePw=()=>{
    const usr=users.find(x=>x.id===currentUser.id);
    if(usr.password!==pw.old){setPwMsg({err:true,text:"Nuværende adgangskode er forkert"});return;}
    if(pw.next.length<6){setPwMsg({err:true,text:"Mindst 6 tegn"});return;}
    if(pw.next!==pw.conf){setPwMsg({err:true,text:"Matcher ikke"});return;}
    setUsers(prev=>prev.map(x=>x.id===currentUser.id?{...x,password:pw.next}:x));
    setPwMsg({err:false,text:"Adgangskode opdateret ✓"});setPw({old:"",next:"",conf:""});
  };
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAvatar(ev.target.result);r.readAsDataURL(f);};
  return(<div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:16}}>
    <div style={{background:T.dim,padding:28,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:20}}>PROFILOPLYSNINGER</div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <div style={{cursor:"pointer"}} onClick={()=>fileRef.current.click()}>
          {avatar?<img src={avatar} alt="" style={{width:64,height:64,borderRadius:2,objectFit:"cover",border:`2px solid ${T.orange}`}}/>
            :<div style={{width:64,height:64,background:T.black,border:`2px dashed ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:T.muted,fontFamily:"'Poppins',sans-serif"}}>FOTO</div>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
        </div>
        <div><div style={{fontSize:14,fontWeight:700,color:T.white,fontFamily:"'Poppins',sans-serif"}}>{u.first} {u.last}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'Poppins',sans-serif",marginTop:4}}>Klik på billedet for at ændre foto</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="FORNAVN" T={T}><Inp value={form.first} onChange={e=>setForm(p=>({...p,first:e.target.value}))} T={T}/></Field>
        <Field label="EFTERNAVN" T={T}><Inp value={form.last} onChange={e=>setForm(p=>({...p,last:e.target.value}))} T={T}/></Field>
      </div>
      <Field label="TELEFON" T={T}><Inp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+45 12 34 56 78" T={T}/></Field>
      <Field label="EMAIL" T={T}><Inp value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} type="email" T={T}/></Field>
      {msg&&<div style={{fontSize:12,color:msg.err?T.red:T.green,marginBottom:10,fontFamily:"'Poppins',sans-serif"}}>{msg.text}</div>}
      <Btn onClick={saveProfile} color={T.orange}>GEM PROFIL →</Btn>
    </div>
    <div style={{background:T.dim,padding:28,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:20}}>SKIFT ADGANGSKODE</div>
      <Field label="NUVÆRENDE ADGANGSKODE" T={T}><PwInput value={pw.old} onChange={e=>setPw(p=>({...p,old:e.target.value}))} T={T}/></Field>
      <Field label="NY ADGANGSKODE" T={T}><PwInput value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} T={T}/></Field>
      <Field label="BEKRÆFT" T={T}><PwInput value={pw.conf} onChange={e=>setPw(p=>({...p,conf:e.target.value}))} T={T}/></Field>
      {pwMsg&&<div style={{fontSize:12,color:pwMsg.err?T.red:T.green,marginBottom:10,fontFamily:"'Poppins',sans-serif"}}>{pwMsg.text}</div>}
      <Btn onClick={savePw} color={T.orange}>GEM ADGANGSKODE →</Btn>
      <p style={{fontSize:11,color:T.muted,marginTop:12,fontFamily:"'Poppins',sans-serif",lineHeight:1.7}}>Din adgangskode er kun synlig for dig selv.</p>
    </div>
    <div style={{background:T.dim,padding:28,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:9,color:T.orange,letterSpacing:"0.14em",fontFamily:"'Poppins',sans-serif",fontWeight:700,marginBottom:16}}>TEMA</div>
      <div style={{display:"flex",gap:1,background:T.border}}>
        {[{id:true,label:"☾ MØRKT",desc:"Mørk baggrund"},{id:false,label:"☀ LYST",desc:"Lys baggrund"}].map(opt=>{
          const active=darkMode===opt.id;
          return(<button key={String(opt.id)} onClick={()=>setDarkMode(opt.id)}
            style={{flex:1,padding:"14px 16px",background:active?T.dim:T.black,border:"none",borderBottom:active?`2px solid ${T.orange}`:`2px solid transparent`,cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
            <div style={{fontSize:13,fontWeight:active?700:400,color:active?T.white:T.muted,fontFamily:"'Poppins',sans-serif"}}>{opt.label}</div>
            <div style={{fontSize:10,color:active?T.muted:T.border,fontFamily:"'Poppins',sans-serif",marginTop:3}}>{opt.desc}</div>
          </button>);
        })}
      </div>
    </div>
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
  const [user,setUser]=useState(null);
  const [view,setView]=useState("bookings");
  const [darkMode,setDarkMode]=useState(true);
  const [bookings,setBookings]=useState(INIT_BOOKINGS);
  const [aliasData,setAliasData]=useState(INIT_ALIAS);
  const [payments,setPayments]=useState(INIT_PAYMENTS);
  const [users,setUsers]=useState(INIT_USERS);
  const [loading,setLoading]=useState(true);
  const [loginLoading,setLoginLoading]=useState(false);
  const winW=useWindowWidth();
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const logoutTimer=useRef(null);

  const TIMEOUT_MS=60*60*1000;

  // Load all data from database on mount + restore session
  useEffect(()=>{
    const load=async()=>{
      try{
        const [u,b,p,a]=await Promise.all([
          fetch("/api/users").then(r=>r.json()),
          fetch("/api/bookings").then(r=>r.json()),
          fetch("/api/payments").then(r=>r.json()),
          fetch("/api/alias").then(r=>r.json()),
        ]);

        // Map users from DB format
        if(Array.isArray(u)&&u.length>0){
          setUsers(u.map(x=>({
            ...x,
            subType:x.sub_type,
            isAdmin:x.is_admin,
            musicianId:x.musician_id,
            tags:JSON.parse(x.tags||"[]"),
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
        // Restore session from sessionStorage
        try{
          const saved=sessionStorage.getItem("na_user");
          if(saved){
            const u=JSON.parse(saved);
            setUser(u);
            if(u.theme==="light")setDarkMode(false);
          }
        }catch(_){}
      }
    };
    load();
  },[]);

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

  // Auto-logout on inactivity
  useEffect(()=>{
    if(!user)return;
    const reset=()=>{
      clearTimeout(logoutTimer.current);
      logoutTimer.current=setTimeout(()=>{setUser(null);setView("bookings");},TIMEOUT_MS);
    };
    const events=["mousemove","keydown","click","touchstart","scroll"];
    events.forEach(e=>window.addEventListener(e,reset));
    reset();
    return()=>{clearTimeout(logoutTimer.current);events.forEach(e=>window.removeEventListener(e,reset));};
  },[user]);

  const T=darkMode?DARK:LIGHT;
  const curU=user?users.find(u=>u.id===user.id)||user:null;
  const isMobile=winW<768;
  const isTablet=winW<1400;

  // Load theme from user profile on login
  const handleLogin=u=>{
    setLoginLoading(true);
    setTimeout(()=>{
      setUser(u);
      setView("bookings");
      if(u.theme==="light")setDarkMode(false);
      else setDarkMode(true);
      try{sessionStorage.setItem("na_user",JSON.stringify(u));}catch(_){}
      setLoginLoading(false);
    },1000);
  };

  // Save theme to user profile when changed
  const handleTheme=val=>{
    setDarkMode(val);
    if(user)handleSetUsers(prev=>prev.map(u=>u.id===user.id?{...u,theme:val?"dark":"light"}:u));
  };

  if(loading||loginLoading)return(
    <div style={{minHeight:"100vh",background:"#181719",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <NAStar size={40} color="#D4622A"/>
      <div style={{color:"#B0A8A4",fontFamily:"'Poppins',sans-serif",fontSize:11,letterSpacing:"0.2em"}}>{loginLoading?"LOGGER IND...":"INDLÆSER..."}</div>
    </div>
  );

  if(!curU)return <LoginScreen onLogin={handleLogin} users={users}/>;

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
        <button onClick={()=>{setUser(null);setView("bookings");setMobileMenuOpen(false);try{sessionStorage.removeItem("na_user");}catch(_){};}} style={{width:"100%",padding:"10px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:11,letterSpacing:"0.06em"}}>LOG UD</button>
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
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          {curU.avatar?<img src={curU.avatar} alt="" style={{width:30,height:30,borderRadius:2,objectFit:"cover",flexShrink:0}}/>
            :<div style={{width:30,height:30,background:(SPOT[curU.id]||T.orange)+"22",border:`1px solid ${SPOT[curU.id]||T.orange}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:SPOT[curU.id]||T.orange,fontFamily:"'Poppins',sans-serif",flexShrink:0}}>{curU.initials||"?"}</div>}
          <div><div style={{fontSize:isTablet?11:13,fontWeight:700,color:T.white}}>{curU.first}</div>
            <div style={{fontSize:9,color:T.muted}}>{isAdmin?"ADMIN":isSub?"VIKAR":isAliasOnly?"ALIAS":"MUSIKER"}</div>
          </div>
        </div>
        <button onClick={()=>{setUser(null);setView("bookings");try{sessionStorage.removeItem("na_user");}catch(_){};}} style={{width:"100%",padding:"7px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,color:T.muted,cursor:"pointer",fontSize:10,letterSpacing:"0.06em",transition:"all .15s"}}
          onMouseEnter={e=>{e.target.style.borderColor=T.orange;e.target.style.color=T.orange;}} onMouseLeave={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.muted;}}>LOG UD</button>
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
        {effectiveView==="admin"   &&<AdminView users={users} setUsers={handleSetUsers} T={T}/>}
        {effectiveView==="profile" &&<ProfileView currentUser={curU} users={users} setUsers={handleSetUsers} T={T} darkMode={darkMode} setDarkMode={handleTheme}/>}
      </div>
    </div>
  </div>);
}
