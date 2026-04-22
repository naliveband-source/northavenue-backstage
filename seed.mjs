import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");

const users = [
  {id:"u1",email:"admin@na.dk",password:"admin123",first:"Band",last:"Admin",initials:"BA",instrument:"",phone:"",role:"admin",subType:"owner",isAdmin:true,tags:[],theme:"dark",musicianId:null},
  {id:"u2",email:"isabella@na.dk",password:"isabella123",first:"Isabella",last:"Vahle",initials:"IV",instrument:"Lead vokal",phone:"",role:"musician",subType:"member",isAdmin:false,tags:["musiker"],theme:"dark",musicianId:1},
  {id:"u3",email:"mikkel@na.dk",password:"mikkel123",first:"Mikkel",last:"Maagaard Olesen",initials:"MM",instrument:"Guitar & lead vokal",phone:"",role:"admin",subType:"owner",isAdmin:true,tags:["musiker"],theme:"dark",musicianId:2},
  {id:"u4",email:"oliver@na.dk",password:"oliver123",first:"Oliver",last:"Sigmann Beck",initials:"OS",instrument:"Lead guitar & vokal",phone:"",role:"admin",subType:"owner",isAdmin:true,tags:["musiker"],theme:"dark",musicianId:3},
  {id:"u5",email:"magnus@na.dk",password:"magnus123",first:"Magnus",last:"Rønnest France",initials:"MR",instrument:"Keyboard & vokal",phone:"",role:"admin",subType:"owner",isAdmin:true,tags:["musiker"],theme:"dark",musicianId:4},
  {id:"u6",email:"niels@na.dk",password:"niels123",first:"Niels",last:"Rævdal",initials:"NR",instrument:"Bas & vokal",phone:"",role:"musician",subType:"member",isAdmin:false,tags:["musiker"],theme:"dark",musicianId:5},
  {id:"u7",email:"thomas@na.dk",password:"thomas123",first:"Thomas",last:"Holt",initials:"TH",instrument:"Trommer",phone:"",role:"musician",subType:"member",isAdmin:false,tags:["musiker"],theme:"dark",musicianId:6},
  {id:"u8",email:"ruben@na.dk",password:"ruben123",first:"Ruben",last:"Jensen",initials:"RJ",instrument:"Keys",phone:"",role:"musician",subType:"substitute",isAdmin:false,tags:["vikar"],theme:"dark",musicianId:7},
  {id:"u9",email:"sjabon@na.dk",password:"sjabon123",first:"Sjabon",last:"Andersen",initials:"SA",instrument:"Bas",phone:"",role:"musician",subType:"substitute",isAdmin:false,tags:["vikar"],theme:"dark",musicianId:8},
  {id:"ua1",email:"niklas@na.dk",password:"niklas123",first:"Niklas",last:"Runge",initials:"NR",instrument:"",phone:"",role:"musician",subType:"alias",isAdmin:false,tags:["alias_manager"],theme:"dark",musicianId:null},
  {id:"ua2",email:"mikkelmik@na.dk",password:"mikkelmik123",first:"Mikkel",last:"Mikkelsen",initials:"MM",instrument:"",phone:"",role:"musician",subType:"alias",isAdmin:false,tags:["alias_manager"],theme:"dark",musicianId:null},
  {id:"ua3",email:"lasse@na.dk",password:"lasse123",first:"Lasse",last:"Herold",initials:"LH",instrument:"",phone:"",role:"musician",subType:"alias",isAdmin:false,tags:["alias_manager"],theme:"dark",musicianId:null},
  {id:"ua4",email:"jacob@na.dk",password:"jacob123",first:"Jacob",last:"Nørregaard",initials:"JN",instrument:"",phone:"",role:"musician",subType:"alias",isAdmin:false,tags:["alias_manager"],theme:"dark",musicianId:null},
  {id:"ua5",email:"magnussj@na.dk",password:"magnussj123",first:"Magnus",last:"Sjabon",initials:"MS",instrument:"Bas",phone:"",role:"musician",subType:"substitute",isAdmin:false,tags:["vikar","alias_manager"],theme:"dark",musicianId:9},
];

for(const u of users){
  await sql`INSERT INTO users (id,email,password,first,last,initials,instrument,phone,role,sub_type,is_admin,tags,theme,musician_id)
    VALUES (${u.id},${u.email},${u.password},${u.first},${u.last},${u.initials},${u.instrument},${u.phone},${u.role},${u.subType},${u.isAdmin},${JSON.stringify(u.tags)},${u.theme},${u.musicianId})
    ON CONFLICT (id) DO NOTHING`;
}
console.log("✅ Brugere indlæst!");

const bookings = [
  {date:"2025-03-14",departure:"16:00",arrival:"17:30",type:"60 års fødselsdag",city:"Svendborg",address:"Brogade 1, 5700",playTime:"20:00–22:30",sets:"2×80",bandPay:0,booker:"Magnus",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:"Betales på dagen"},
  {date:"2025-05-10",departure:"19:00",arrival:"20:15",type:"Kobberbryllup",city:"Vinderup",address:"Herrup Kulturhus",playTime:"22:00–00:30",sets:"2×80",bandPay:3000,booker:"Mox",memberIds:[2,3,5,6,7],substituteIds:[7,8],notes:""},
  {date:"2025-08-22",departure:"16:30",arrival:"17:15",type:"VIA Fredagsbar",city:"Aarhus",address:"VIA",playTime:"19:00–21:00",sets:"1 sæt á 2t",bandPay:1500,booker:"Mox",memberIds:[2,4,5,6],substituteIds:[7,8],notes:""},
  {date:"2025-11-07",departure:"17:45",arrival:"19:45",type:"Efterskoleforeningens Aften",city:"Nyborg",address:"Østersøvej 2, 5800",playTime:"21:30–00:00",sets:"3×50",bandPay:2500,booker:"Oliver",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:"Stort setup"},
  {date:"2025-12-13",departure:"18:00",arrival:"19:00",type:"Julefrokost",city:"Kolding",address:"Skovvangen 10, 6000",playTime:"21:00–23:30",sets:"2×80",bandPay:2000,booker:"Mox",memberIds:[2,3,5,6,7],substituteIds:[],notes:""},
  {date:"2026-04-18",departure:"18:00",arrival:"20:00",type:"Fødselsdag",city:"Sønderborg",address:"Vollerup Kro, 6400",playTime:"21:30–00:00",sets:"2×80",bandPay:2000,booker:"Mox",memberIds:[2,3,5,6,7],substituteIds:[],notes:""},
  {date:"2026-05-09",departure:"17:30",arrival:"19:45",type:"Byfest",city:"Genner",address:"Genner Sportspladsen",playTime:"21:00–23:30",sets:"3×60",bandPay:2500,booker:"Mox",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
  {date:"2026-06-06",departure:"20:30",arrival:"22:00",type:"Bryllup",city:"Ringkøbing",address:"Nørredige 7, 6950",playTime:"23:30–02:00",sets:"2×80",bandPay:3000,booker:"Magnus",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
  {date:"2026-08-14",departure:"18:00",arrival:"19:30",type:"Sølvbryllup",city:"Odense",address:"Oensvej 79, 5700",playTime:"20:00–22:30",sets:"2×80",bandPay:2500,booker:"Mox",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
  {date:"2027-02-20",departure:"17:00",arrival:"18:30",type:"Firmafest",city:"Aarhus",address:"Rådhuspladsen 1",playTime:"19:30–22:00",sets:"2×80",bandPay:3000,booker:"Magnus",memberIds:[2,3,4,5,6,7],substituteIds:[],notes:""},
];

for(const b of bookings){
  await sql`INSERT INTO bookings (date,departure,arrival,type,city,address,play_time,sets,band_pay,booker,notes,member_ids,substitute_ids)
    VALUES (${b.date},${b.departure},${b.arrival},${b.type},${b.city},${b.address},${b.playTime},${b.sets},${b.bandPay},${b.booker},${b.notes},${JSON.stringify(b.memberIds)},${JSON.stringify(b.substituteIds)})`;
}
console.log("✅ Bookinger indlæst!");
console.log("✅ Alt data er i databasen!");