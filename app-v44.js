const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const nowTime = () => new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
const STORAGE_KEY = "asterra-v44-state";

let THREE = null;
let engineError = null;
try {
  THREE = await import("https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js");
} catch (err) {
  engineError = err;
  console.error("Asterra 3D engine failed to load", err);
}

const FACE_PRESETS = [
  {label:"柔和橢圓",width:1.00,height:1.04,depth:1.00,jaw:.88,chin:.96,cheek:.08},
  {label:"小圓臉",width:1.06,height:.96,depth:1.02,jaw:.98,chin:.93,cheek:.12},
  {label:"瓜子臉",width:.98,height:1.07,depth:1.00,jaw:.77,chin:1.08,cheek:.07},
  {label:"俐落 V 臉",width:.97,height:1.05,depth:.98,jaw:.70,chin:1.12,cheek:.04},
  {label:"修長臉",width:.94,height:1.12,depth:1.00,jaw:.84,chin:1.08,cheek:.03},
  {label:"方圓臉",width:1.05,height:1.00,depth:1.01,jaw:1.02,chin:.95,cheek:.07},
  {label:"心形臉",width:1.05,height:1.04,depth:1.00,jaw:.75,chin:1.07,cheek:.10},
  {label:"短臉",width:1.03,height:.93,depth:1.02,jaw:.90,chin:.90,cheek:.11},
  {label:"高顴臉",width:1.02,height:1.06,depth:1.00,jaw:.82,chin:1.03,cheek:.16},
  {label:"柔方臉",width:1.02,height:1.03,depth:1.02,jaw:.99,chin:.98,cheek:.05},
  {label:"娃娃臉",width:1.05,height:.98,depth:1.04,jaw:.84,chin:.92,cheek:.15},
  {label:"冷感長臉",width:.93,height:1.13,depth:.98,jaw:.78,chin:1.12,cheek:.02}
];
const SKINS = ["#f8dfcf","#f4d3bf","#efc9ae","#e9bea1","#ddb08f","#d2a17f","#c3916f","#b98261","#aa7456","#986247","#85523c","#754735","#633b2e","#543127","#45291f","#382119"];
const EYES = [
  {label:"杏仁",w:1.00,h:.82,tilt:0,space:1.00},{label:"圓潤",w:.92,h:1.08,tilt:0,space:1.00},{label:"細長",w:1.12,h:.68,tilt:0,space:1.02},{label:"上挑",w:1.05,h:.78,tilt:.11,space:1.00},
  {label:"下垂",w:1.04,h:.82,tilt:-.10,space:1.00},{label:"大眼",w:1.08,h:1.04,tilt:.02,space:1.02},{label:"冷感",w:1.10,h:.66,tilt:.07,space:.98},{label:"柔和",w:1.00,h:.92,tilt:-.03,space:1.02},
  {label:"貓系",w:1.08,h:.76,tilt:.15,space:.98},{label:"鹿系",w:1.03,h:1.10,tilt:-.02,space:1.04},{label:"窄距",w:1.00,h:.82,tilt:0,space:.90},{label:"寬距",w:1.00,h:.82,tilt:0,space:1.12},
  {label:"短眼尾",w:.92,h:.84,tilt:.03,space:1.00},{label:"長眼尾",w:1.16,h:.76,tilt:.06,space:1.00},{label:"清秀",w:.97,h:.88,tilt:.04,space:1.00},{label:"成熟",w:1.08,h:.70,tilt:.09,space:1.02}
];
const BROWS = [
  {label:"自然眉",arch:.06,tilt:0,thick:1},{label:"平眉",arch:0,tilt:0,thick:.92},{label:"柔弧眉",arch:.12,tilt:0,thick:.92},{label:"高挑眉",arch:.16,tilt:.05,thick:.90},
  {label:"俐落眉",arch:.08,tilt:.10,thick:.82},{label:"濃眉",arch:.06,tilt:0,thick:1.25},{label:"細眉",arch:.08,tilt:.02,thick:.68},{label:"下垂眉",arch:.04,tilt:-.08,thick:.88},
  {label:"短眉",arch:.08,tilt:.04,thick:.92,len:.86},{label:"長眉",arch:.06,tilt:.03,thick:.88,len:1.14},{label:"直挑眉",arch:.02,tilt:.12,thick:.90},{label:"溫柔眉",arch:.10,tilt:-.03,thick:.82}
];
const NOSES = [
  {label:"小巧",len:.92,width:.82,tip:.90,bridge:.88},{label:"直鼻",len:1.08,width:.88,tip:.94,bridge:1.05},{label:"精緻",len:1.00,width:.76,tip:.82,bridge:1.00},{label:"圓鼻",len:.94,width:1.08,tip:1.16,bridge:.88},
  {label:"高鼻",len:1.10,width:.86,tip:.92,bridge:1.18},{label:"短鼻",len:.82,width:.92,tip:1.00,bridge:.86},{label:"窄鼻",len:1.02,width:.70,tip:.82,bridge:1.03},{label:"柔和",len:.96,width:.95,tip:1.02,bridge:.92},
  {label:"挺鼻",len:1.12,width:.80,tip:.86,bridge:1.22},{label:"微翹",len:.94,width:.84,tip:.94,bridge:.96,up:.05},{label:"自然",len:1.00,width:1.00,tip:1.00,bridge:1.00},{label:"立體",len:1.08,width:.96,tip:1.02,bridge:1.16}
];
const MOUTHS = [
  {label:"自然",width:1,full:.88,smile:0},{label:"微笑",width:1.02,full:.86,smile:.10},{label:"柔和",width:.98,full:1.00,smile:.04},{label:"豐唇",width:1.02,full:1.28,smile:.02},
  {label:"小嘴",width:.82,full:.92,smile:.02},{label:"寬唇",width:1.18,full:.92,smile:.02},{label:"薄唇",width:1.02,full:.66,smile:0},{label:"上揚",width:1.05,full:.90,smile:.16},
  {label:"冷淡",width:1.03,full:.78,smile:-.04},{label:"圓潤",width:.94,full:1.16,smile:.03},{label:"唇峰明顯",width:1.00,full:1.03,smile:.02,cupid:.10},{label:"成熟",width:1.08,full:1.08,smile:.05}
];
const HAIRS = [
  {label:"空氣短髮",type:"short",len:.28,bangs:"air",wave:.03},{label:"俐落短髮",type:"short",len:.20,bangs:"side",wave:0},{label:"短鮑伯",type:"bob",len:.45,bangs:"air",wave:.02},{label:"齊肩髮",type:"bob",len:.62,bangs:"side",wave:.02},
  {label:"長直髮",type:"long",len:1.00,bangs:"center",wave:0},{label:"長層次",type:"long",len:.94,bangs:"side",wave:.04},{label:"柔長捲",type:"long",len:.98,bangs:"air",wave:.14},{label:"大波浪",type:"long",len:.92,bangs:"side",wave:.22},
  {label:"高馬尾",type:"pony",len:.88,bangs:"air",wave:.08},{label:"低馬尾",type:"ponyLow",len:.78,bangs:"side",wave:.05},{label:"丸子頭",type:"bun",len:.28,bangs:"air",wave:.02},{label:"低盤髮",type:"bunLow",len:.34,bangs:"side",wave:.02},
  {label:"雙馬尾",type:"twin",len:.78,bangs:"air",wave:.08},{label:"側馬尾",type:"sidePony",len:.84,bangs:"side",wave:.10},{label:"狼尾短髮",type:"wolf",len:.52,bangs:"shag",wave:.06},{label:"狼尾長髮",type:"wolf",len:.80,bangs:"shag",wave:.10},
  {label:"中分長髮",type:"long",len:.90,bangs:"center",wave:.02},{label:"法式短捲",type:"bob",len:.50,bangs:"center",wave:.18},{label:"側分瀏海",type:"long",len:.82,bangs:"sweep",wave:.08},{label:"編髮感長髮",type:"braid",len:.92,bangs:"air",wave:.04}
];
const HAIR_COLORS = ["#161515","#2a211e","#3d2a23","#5a3a2b","#76503a","#946b4b","#b68a61","#d2b081","#ead6aa","#ddd7cc","#b9c0c6","#89939e","#62666e","#5d4f67","#775f83","#4e6479","#385b64","#49624a","#7b4c49","#a34b4d"];
const IRIS = ["#2c211b","#493227","#6c4d35","#8a6848","#74634d","#536b58","#406c66","#487b7c","#4e718b","#5c83a6","#6d7697","#7370a1","#7f638d","#905f7b","#a06b67","#92989c","#6e7e83","#a4a07b","#7d8c68","#3b4957"];
const OUTFITS = [
  {label:"港灣白襯衫",type:"shirt",top:"#ece8df",accent:"#b88e67",bottom:"#3f342f"},{label:"海風藍外套",type:"jacket",top:"#66889f",accent:"#dce8ee",bottom:"#293c49"},{label:"淺灰針織",type:"knit",top:"#c8c4c1",accent:"#eee7df",bottom:"#5c5858"},{label:"深色便服",type:"shirt",top:"#2c343e",accent:"#8d9aa6",bottom:"#191f27"},{label:"象牙套裝",type:"jacket",top:"#e8dfd1",accent:"#c0a887",bottom:"#6a625d"},
  {label:"霧藍高領",type:"turtleneck",top:"#8398a6",accent:"#cdd8de",bottom:"#39444d"},{label:"港區工作服",type:"work",top:"#40596d",accent:"#d6a85f",bottom:"#2c3540"},{label:"暖棕背心",type:"vest",top:"#f0e8dc",accent:"#6d5143",bottom:"#453a36"},{label:"白金正式服",type:"formal",top:"#f1eee7",accent:"#b59b65",bottom:"#333944"},{label:"自由旅人",type:"traveler",top:"#d8c9b8",accent:"#78604c",bottom:"#403934"}
];

const defaultAppearance = {face:0,skin:2,eyes:0,brows:0,nose:0,mouth:0,hair:4,hairColor:2,iris:8,outfit:0,tweaks:{faceWidth:0,jaw:0,eyeSpacing:0}};
const CATEGORY = {
  face:{title:"臉型",kicker:"FACE SHAPE",items:FACE_PRESETS,key:"face",type:"cards"},
  skin:{title:"膚色",kicker:"SKIN TONE",items:SKINS,key:"skin",type:"swatches"},
  eyes:{title:"眼睛",kicker:"EYES",items:EYES,key:"eyes",type:"cards"},
  brows:{title:"眉毛",kicker:"BROWS",items:BROWS,key:"brows",type:"cards"},
  nose:{title:"鼻子",kicker:"NOSE",items:NOSES,key:"nose",type:"cards"},
  mouth:{title:"嘴巴",kicker:"MOUTH",items:MOUTHS,key:"mouth",type:"cards"},
  hair:{title:"髮型",kicker:"HAIR STYLE",items:HAIRS,key:"hair",type:"cards"},
  hairColor:{title:"髮色",kicker:"HAIR COLOR",items:HAIR_COLORS,key:"hairColor",type:"swatches"},
  iris:{title:"瞳孔顏色",kicker:"IRIS COLOR",items:IRIS,key:"iris",type:"swatches"},
  outfit:{title:"基礎服飾",kicker:"STARTER OUTFIT",items:OUTFITS,key:"outfit",type:"outfits"}
};

const world = {
  city:"潮港城",
  profile:{created:false,appearance:clone(defaultAppearance)},
  player:{name:null,birthday:null,pronoun:null,residentId:null,money:12840,place:"social-west",inTransit:false,registered:false,ticket:null,hallActivity:null},
  onboarding:{started:false,finished:false},
  cityhall:{currentNumber:"A017",nextNumber:18,counterBusy:true,calledNumber:null,serviceResidentPresent:true},
  parcels:{"P-01":{zone:"civic",building:"hall"},"P-02":{zone:"commercial",building:"cafe"},"P-03":{zone:"residential",building:"social-west"},"P-04":{zone:"residential",building:"res-east"},"P-05":{zone:"commercial",building:"business"},"P-06":{zone:"historic",building:"oldtown"},"P-07":{zone:"industrial",building:"dock"},"P-08":{zone:"scenic",building:"highland"}},
  buildings:{
    hall:{id:"hall",parcel:"P-01",name:"潮港市政廳",icon:"▦",status:"open",x:50.5,y:40,scene:"cityhall",description:"居民登記、證件、房產與土地建設業務都由服務櫃台受理。"},
    cafe:{id:"cafe",parcel:"P-02",name:"港口咖啡館",icon:"☕",status:"open",x:61.5,y:56,scene:"cafe",description:"靠海的咖啡館。"},
    "social-west":{id:"social-west",parcel:"P-03",name:"西灣住宅區",icon:"⌂",status:"open",x:26,y:22,scene:"generic",description:"住宅區。"},
    "res-east":{id:"res-east",parcel:"P-04",name:"東灣住宅區",icon:"⌂",status:"open",x:84,y:45,scene:"generic",description:"住宅區。"},
    business:{id:"business",parcel:"P-05",name:"中央商業區",icon:"▥",status:"open",x:72,y:32,scene:"generic",description:"辦公與商業核心。"},
    oldtown:{id:"oldtown",parcel:"P-06",name:"舊城區",icon:"▤",status:"open",x:23,y:49,scene:"generic",description:"舊港街區。"},
    dock:{id:"dock",parcel:"P-07",name:"潮港碼頭",icon:"⚓",status:"open",x:83,y:73,scene:"generic",description:"港口物流與出海區。"},
    highland:{id:"highland",parcel:"P-08",name:"山城高地",icon:"▲",status:"open",x:48,y:13,scene:"generic",description:"山城景觀區。"}
  },
  actors:{zhaoye:{id:"zhaoye",name:"朝野",place:"cafe",known:false,activity:"坐在靠窗座位寫東西，沒有主動找人說話。",portrait:"assets/zhaoye-portrait.png",x:43,y:51}},
  feed:[{time:"現在",text:"你剛抵達潮港城，尚未完成居民證件登記。"},{time:"現在",text:"港口咖啡館今日正常營業。"}]
};

function loadState(){
  try{const raw=localStorage.getItem(STORAGE_KEY);return raw?mergeState(clone(world),JSON.parse(raw)):clone(world)}catch{return clone(world)}
}
function mergeState(base,saved){return {...base,...saved,profile:{...base.profile,...(saved.profile||{}),appearance:{...base.profile.appearance,...(saved.profile?.appearance||{}),tweaks:{...base.profile.appearance.tweaks,...(saved.profile?.appearance?.tweaks||{})}}},player:{...base.player,...(saved.player||{})},onboarding:{...base.onboarding,...(saved.onboarding||{})},cityhall:{...base.cityhall,...(saved.cityhall||{})},buildings:{...base.buildings,...(saved.buildings||{})},actors:{...base.actors,...(saved.actors||{})}}}
let state=loadState();
let draftAppearance=clone(state.profile.appearance||defaultAppearance);
let currentCategory="face";
let queueTimer=null;
let worldEntered=false;
let snapshots={standing:null,sitting:null,reading:null,counter:null};
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}}
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2200)}
function playerDisplayName(){return state.player.registered&&state.player.name?state.player.name:"未登記居民"}
function building(id){return state.buildings[id]}
function peopleAt(place){return Object.values(state.actors).filter(a=>a.place===place)}

class ProceduralAvatar {
  constructor(THREE,appearance){this.T=THREE;this.appearance=appearance;this.group=new THREE.Group();this.group.name="AsterraAvatar";this.rebuild(appearance,"standing")}
  disposeObject(obj){obj.traverse?.(x=>{x.geometry?.dispose?.();if(Array.isArray(x.material))x.material.forEach(m=>m.dispose?.());else x.material?.dispose?.()})}
  clear(){while(this.group.children.length){const c=this.group.children.pop();this.disposeObject(c)}}
  mat(color,opts={}){return new this.T.MeshPhysicalMaterial({color,roughness:opts.roughness??.58,metalness:opts.metalness??0,clearcoat:opts.clearcoat??.08,clearcoatRoughness:.65,transparent:opts.transparent??false,opacity:opts.opacity??1,side:this.T.FrontSide})}
  addMesh(geo,mat,parent=this.group,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const m=new this.T.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  tube(points,radius,mat,parent=this.group){const curve=new this.T.CatmullRomCurve3(points.map(p=>new this.T.Vector3(...p)),false,"catmullrom",.55);const geo=new this.T.TubeGeometry(curve,Math.max(6,points.length*5),radius,6,false);return this.addMesh(geo,mat,parent)}
  headGeometry(face,tweaks){const T=this.T;const g=new T.SphereGeometry(.36,56,42);const p=g.attributes.position;const width=face.width*(1+(tweaks.faceWidth||0)*.08);const jawBase=face.jaw*(1+(tweaks.jaw||0)*.10);for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const yn=y/.36;const absx=Math.abs(x)/.36;const lower=clamp((-yn+.12)/1.1,0,1);const chinBand=Math.exp(-Math.pow((yn+.82)/.23,2));const cheekBand=Math.exp(-Math.pow((yn+.06)/.33,2))*clamp(absx/.68,0,1);let xs=width*(1-(1-jawBase)*Math.pow(lower,1.35));xs*=1+face.cheek*cheekBand;xs*=1-(1-face.chin)*chinBand*.32;x*=xs;y*=face.height;y-=chinBand*(face.chin-1)*.028;z*=face.depth*(1+cheekBand*.02);p.setXYZ(i,x,y,z)}p.needsUpdate=true;g.computeVertexNormals();return g}
  makeEye(parent,x,eye,irisColor,skinMat,irisMat,darkMat){const T=this.T;const spacing=(eye.space*(1+(this.appearance.tweaks.eyeSpacing||0)*.08));x*=spacing;const y=1.57;const z=.322;const grp=new T.Group();grp.position.set(x,y,z);grp.rotation.z=eye.tilt;parent.add(grp);const white=this.mat("#f5f3ef",{roughness:.35,clearcoat:.12});this.addMesh(new T.SphereGeometry(.071,28,18),white,grp,[0,0,0],[eye.w,eye.h,.42]);this.addMesh(new T.SphereGeometry(.034,24,16),irisMat,grp,[0,0,.033],[.95,1,.35]);this.addMesh(new T.SphereGeometry(.013,16,12),darkMat,grp,[0,0,.047],[1,1,.3]);this.addMesh(new T.SphereGeometry(.006,12,8),this.mat("#ffffff",{roughness:.15}),grp,[-.010,.010,.053],[1,1,.25]);const linerPts=[[-.076*eye.w,.006,0.034],[0,.045*eye.h,0.042],[.076*eye.w,.004,0.034]];this.tube(linerPts,.006,darkMat,grp);return grp}
  makeBrow(parent,x,brow,hairMat){const side=x<0?-1:1;const len=.105*(brow.len||1);const y=1.675;const z=.335;const pts=[[-len*side,0,0],[0, brow.arch, .005],[len*side,.012+brow.tilt*side,.002]].map(([px,py,pz])=>[x+px,y+py,z+pz]);return this.tube(pts,.008*brow.thick,hairMat,parent)}
  makeNose(parent,nose,skinMat,skinShade){const T=this.T;const g=new T.Group();g.position.set(0,1.495,.345+nose.bridge*.008);parent.add(g);this.addMesh(new T.CapsuleGeometry(.018*nose.width,.105*nose.len,5,12),skinShade,g,[0,.018,0],[1,1,1],[Math.PI/2,0,0]);this.addMesh(new T.SphereGeometry(.038*nose.tip,18,12),skinMat,g,[0,-.057*nose.len,.062+(nose.up||0)],[nose.width, .74, .85]);return g}
  makeMouth(parent,mouth,lipMat){const z=.355,y=1.37,w=.088*mouth.width,sm=.05*mouth.smile,c=mouth.cupid||0;this.tube([[-w,y+sm,z],[0,y+.008+c,z+.006],[w,y+sm,z]],.0085*mouth.full,lipMat,parent);this.tube([[-w*.92,y-.006+sm,z],[0,y-.015,z+.004],[w*.92,y-.006+sm,z]],.0075*mouth.full,lipMat,parent)}
  addHairStrand(parent,start,end,style,idx,mat,front=false){const wave=style.wave||0;const seed=Math.sin((idx+1)*12.9898)*43758.5453;const wob=(seed-Math.floor(seed)-.5)*wave;const mid1=[start[0]+wob*.18,start[1]-(start[1]-end[1])*.33,start[2]+(front?.05:-.02)+Math.sin(idx*1.7)*wave*.05];const mid2=[end[0]-wob*.22,start[1]-(start[1]-end[1])*.68,end[2]+Math.cos(idx*1.4)*wave*.07];this.tube([start,mid1,mid2,end],front?.014:.018,mat,parent)}
  makeHair(parent,style,color){const T=this.T;const mat=this.mat(color,{roughness:.40,clearcoat:.22});const capGeo=new T.SphereGeometry(.374,42,24,0,Math.PI*2,0,Math.PI*.60);this.addMesh(capGeo,mat,parent,[0,1.575,-.010],[1.02,1.04,1.00]);const type=style.type;const len=style.len;const sideCount=(type==="short"?12:type==="bob"?16:20);for(let i=0;i<sideCount;i++){const a=(i/(sideCount-1)-.5)*Math.PI*.95;const sx=Math.sin(a)*.29,sz=Math.cos(a)*.18-.02;const sy=1.77-Math.abs(Math.sin(a))*.05;let endY=1.50-len*.52,endX=sx*1.12,endZ=sz-.04;if(type==="short")endY=1.47-len*.15;if(type==="bob")endY=1.43-len*.28;if(type==="wolf")endY=1.38-len*.40;this.addHairStrand(parent,[sx,sy,sz],[endX,endY,endZ],style,i,mat,false)}
    const bang=style.bangs;const bangN=bang==="center"?10:bang==="sweep"?12:8;for(let i=0;i<bangN;i++){const t=(i/(bangN-1)-.5);let sx=t*.34,ex=sx*.72,ey=1.49;if(bang==="air")ey=1.53+Math.abs(t)*.06;if(bang==="side"){ex=sx+(t<0?-.11:.06);ey=1.51+Math.abs(t)*.05}if(bang==="center"){ex=sx+(t<0?-.055:.055);ey=1.50+Math.abs(t)*.09}if(bang==="sweep"){ex=sx+.15;ey=1.50+Math.abs(t)*.07}if(bang==="shag"){ex=sx+(i%2?-.04:.05);ey=1.45+Math.abs(t)*.10}this.addHairStrand(parent,[sx,1.82,.16],[ex,ey,.34],style,100+i,mat,true)}
    if(["long","wolf","braid"].includes(type)){for(let i=0;i<12;i++){const t=i/11;const sx=(t-.5)*.48;const start=[sx,1.66,-.24+Math.abs(t-.5)*.05];const end=[sx*1.10,1.05-len*.34,-.16];this.addHairStrand(parent,start,end,style,200+i,mat,false)}}
    if(type==="pony"||type==="ponyLow"||type==="sidePony"){const baseY=type==="pony"?1.72:1.56,side=type==="sidePony"?.24:0;for(let i=0;i<10;i++){const t=(i/9-.5);this.addHairStrand(parent,[side+t*.10,baseY,-.30],[side+t*.15,baseY-len*.70,-.38+Math.abs(t)*.03],{...style,wave:style.wave+.08},300+i,mat,false)}this.addMesh(new T.SphereGeometry(.075,18,12),mat,parent,[side,baseY,-.29],[1.2,.75,.8])}
    if(type==="bun"||type==="bunLow"){const y=type==="bun"?1.90:1.55;this.addMesh(new T.SphereGeometry(.13,28,18),mat,parent,[0,y,-.25],[1.05,.95,.86])}
    if(type==="twin"){[-1,1].forEach(side=>{for(let i=0;i<7;i++){const t=(i/6-.5);this.addHairStrand(parent,[side*.26+t*.04,1.68,-.20],[side*.38+t*.07,1.10-len*.18,-.12],{...style,wave:.13},400+(side+1)*10+i,mat,false)}this.addMesh(new T.SphereGeometry(.055,16,12),mat,parent,[side*.27,1.67,-.19])})}
    if(type==="braid"){const beadMat=this.mat(color,{roughness:.46});for(let side of [-1,1])for(let i=0;i<7;i++){this.addMesh(new T.SphereGeometry(.045,14,10),beadMat,parent,[side*.25,1.42-i*.08,-.11],[1,.72,1])}}
  }
  buildLimb(parent,skinMat,clothMat,side=1){const T=this.T;const shoulder=new T.Group();shoulder.position.set(side*.34,1.20,0);parent.add(shoulder);const upper=this.addMesh(new T.CapsuleGeometry(.065,.29,5,12),clothMat,shoulder,[0,-.18,0]);const elbow=new T.Group();elbow.position.set(0,-.36,0);shoulder.add(elbow);this.addMesh(new T.CapsuleGeometry(.055,.27,5,12),skinMat,elbow,[0,-.17,0]);this.addMesh(new T.SphereGeometry(.068,16,12),skinMat,elbow,[0,-.36,.01],[.90,1.08,.75]);return {shoulder,elbow}}
  buildLeg(parent,clothMat,shoeMat,side=1){const T=this.T;const hip=new T.Group();hip.position.set(side*.15,.80,0);parent.add(hip);this.addMesh(new T.CapsuleGeometry(.095,.38,5,12),clothMat,hip,[0,-.25,0]);const knee=new T.Group();knee.position.set(0,-.50,0);hip.add(knee);this.addMesh(new T.CapsuleGeometry(.075,.40,5,12),clothMat,knee,[0,-.25,0]);this.addMesh(new T.SphereGeometry(.09,16,12),shoeMat,knee,[0,-.50,.055],[1.25,.62,1.8]);return {hip,knee}}
  rebuild(appearance=this.appearance,pose="standing"){
    this.clear();this.appearance=clone(appearance);const T=this.T,face=FACE_PRESETS[appearance.face]||FACE_PRESETS[0],eye=EYES[appearance.eyes]||EYES[0],brow=BROWS[appearance.brows]||BROWS[0],nose=NOSES[appearance.nose]||NOSES[0],mouth=MOUTHS[appearance.mouth]||MOUTHS[0],hair=HAIRS[appearance.hair]||HAIRS[0],outfit=OUTFITS[appearance.outfit]||OUTFITS[0];
    const skinColor=SKINS[appearance.skin]||SKINS[2],hairColor=HAIR_COLORS[appearance.hairColor]||HAIR_COLORS[2],irisColor=IRIS[appearance.iris]||IRIS[8];
    const skinMat=this.mat(skinColor,{roughness:.62,clearcoat:.04});const skinShade=this.mat(new T.Color(skinColor).multiplyScalar(.96),{roughness:.65});const darkMat=this.mat("#312824",{roughness:.58});const irisMat=this.mat(irisColor,{roughness:.28,clearcoat:.28});const lipMat=this.mat("#b97876",{roughness:.48,clearcoat:.12});const hairMat=this.mat(hairColor,{roughness:.42,clearcoat:.18});const clothMat=this.mat(outfit.top,{roughness:.72});const accentMat=this.mat(outfit.accent,{roughness:.60,metalness:outfit.type==="formal"?.12:0});const bottomMat=this.mat(outfit.bottom,{roughness:.78});const shoeMat=this.mat("#282a2e",{roughness:.72});
    const body=new T.Group();this.group.add(body);
    // Legs and lower body
    const leftLeg=this.buildLeg(body,bottomMat,shoeMat,-1),rightLeg=this.buildLeg(body,bottomMat,shoeMat,1);
    this.addMesh(new T.SphereGeometry(.25,28,18),bottomMat,body,[0,.83,0],[1.05,.75,.68]);
    // Torso and clothing silhouette
    this.addMesh(new T.CapsuleGeometry(.29,.43,8,24),clothMat,body,[0,1.07,0],[1.05,1,.68]);
    this.addMesh(new T.SphereGeometry(.32,28,18),clothMat,body,[0,1.27,0],[1.08,.50,.68]);
    if(["jacket","work","formal","traveler"].includes(outfit.type)){this.addMesh(new T.CapsuleGeometry(.305,.38,6,20),accentMat,body,[0,1.07,.015],[1.03,1,.70]);this.addMesh(new T.BoxGeometry(.035,.45,.018),clothMat,body,[0,1.08,.215])}
    if(outfit.type==="vest"){this.addMesh(new T.CapsuleGeometry(.285,.36,6,20),accentMat,body,[0,1.09,.02],[.96,1,.69])}
    if(outfit.type==="turtleneck"){this.addMesh(new T.CylinderGeometry(.105,.13,.16,24),clothMat,body,[0,1.41,0],[1,1,1])}
    // Neck
    this.addMesh(new T.CylinderGeometry(.085,.105,.22,24),skinMat,body,[0,1.43,0]);
    // Arms
    const la=this.buildLimb(body,skinMat,clothMat,-1),ra=this.buildLimb(body,skinMat,clothMat,1);
    // Head
    const head=new T.Group();body.add(head);this.addMesh(this.headGeometry(face,appearance.tweaks||{}),skinMat,head,[0,1.61,0]);this.addMesh(new T.SphereGeometry(.060,18,12),skinMat,head,[-.355,1.60,0],[.55,1.05,.48]);this.addMesh(new T.SphereGeometry(.060,18,12),skinMat,head,[.355,1.60,0],[.55,1.05,.48]);
    this.makeEye(head,-.115,eye,irisColor,skinMat,irisMat,darkMat);this.makeEye(head,.115,eye,irisColor,skinMat,irisMat,darkMat);this.makeBrow(head,-.115,brow,hairMat);this.makeBrow(head,.115,{...brow,tilt:-(brow.tilt||0)},hairMat);this.makeNose(head,nose,skinMat,skinShade);this.makeMouth(head,mouth,lipMat);this.makeHair(head,hair,hairColor);
    // pose
    if(pose==="standing"||pose==="counter"){la.shoulder.rotation.z=.06;ra.shoulder.rotation.z=-.06;if(pose==="counter"){la.shoulder.rotation.x=-.45;ra.shoulder.rotation.x=-.45;la.elbow.rotation.x=-.8;ra.elbow.rotation.x=-.8}}
    if(pose==="reading"){la.shoulder.rotation.x=-.72;ra.shoulder.rotation.x=-.72;la.shoulder.rotation.z=.18;ra.shoulder.rotation.z=-.18;la.elbow.rotation.x=-1.08;ra.elbow.rotation.x=-1.08}
    if(pose==="sitting"){body.position.y=-.28;leftLeg.hip.rotation.x=-1.28;rightLeg.hip.rotation.x=-1.28;leftLeg.knee.rotation.x=1.28;rightLeg.knee.rotation.x=1.28;la.shoulder.rotation.x=-.32;ra.shoulder.rotation.x=-.32;la.elbow.rotation.x=-.58;ra.elbow.rotation.x=-.58}
    this.group.rotation.y=.10;return this.group
  }
}

class Creator3D {
  constructor(canvas){this.canvas=canvas;this.ready=false;this.yaw=.36;this.pitch=.01;this.distance=4.15;this.drag=false;this.lastX=0;this.lastY=0;this.targetYaw=.36;this.targetPitch=.01;this.avatar=null;if(THREE)this.init()}
  init(){const T=THREE;this.renderer=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.outputColorSpace=T.SRGBColorSpace;this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(26,1,.1,100);this.scene.add(new T.HemisphereLight(0xeaf5ff,0x6d7882,1.65));const key=new T.DirectionalLight(0xfff3df,3.2);key.position.set(3.4,5.6,4.6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);this.scene.add(key);const fill=new T.DirectionalLight(0xb9dbf4,1.8);fill.position.set(-4,2.2,3);this.scene.add(fill);const rim=new T.DirectionalLight(0xc9dff1,2.0);rim.position.set(-3,4,-4);this.scene.add(rim);const groundMat=new T.MeshPhysicalMaterial({color:0xdbe4e9,roughness:.72,transparent:true,opacity:.50});const ground=new T.Mesh(new T.CircleGeometry(1.35,64),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.03;ground.receiveShadow=true;this.scene.add(ground);this.avatar=new ProceduralAvatar(T,draftAppearance);this.scene.add(this.avatar.group);this.bind();this.resize();this.ready=true;this.renderLoop();$("#engineStatus").classList.add("hidden")}
  bind(){const c=this.canvas;c.addEventListener("pointerdown",e=>{this.drag=true;this.lastX=e.clientX;this.lastY=e.clientY;c.setPointerCapture(e.pointerId)});c.addEventListener("pointermove",e=>{if(!this.drag)return;const dx=e.clientX-this.lastX,dy=e.clientY-this.lastY;this.lastX=e.clientX;this.lastY=e.clientY;this.targetYaw+=dx*.008;this.targetPitch=clamp(this.targetPitch+dy*.004,-.18,.16)});c.addEventListener("pointerup",()=>this.drag=false);c.addEventListener("pointercancel",()=>this.drag=false);c.addEventListener("wheel",e=>{e.preventDefault();this.distance=clamp(this.distance+e.deltaY*.0025,3.35,5.2)},{passive:false});window.addEventListener("resize",()=>this.resize())}
  resize(){if(!this.renderer)return;const r=this.canvas.parentElement.getBoundingClientRect();this.renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);this.camera.aspect=r.width/Math.max(1,r.height);this.camera.updateProjectionMatrix()}
  update(app){if(!this.ready)return;this.avatar.rebuild(app,"standing")}
  setView(yaw){this.targetYaw=yaw;$$('.viewport-toolbar .chip').forEach(b=>b.classList.remove('active'))}
  renderLoop(){if(!this.ready)return;this.yaw+=(this.targetYaw-this.yaw)*.09;this.pitch+=(this.targetPitch-this.pitch)*.09;const y=1.17+this.pitch;this.camera.position.set(Math.sin(this.yaw)*this.distance,y+1.08,Math.cos(this.yaw)*this.distance);this.camera.lookAt(0,1.13,0);const t=performance.now()*.001;this.avatar.group.position.y=Math.sin(t*1.25)*.004;this.renderer.render(this.scene,this.camera);requestAnimationFrame(()=>this.renderLoop())}
}

class SnapshotMaker {
  constructor(){if(!THREE)return;const T=THREE;this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(1);this.renderer.setSize(300,430,false);this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.10;this.renderer.outputColorSpace=T.SRGBColorSpace;this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(29,300/430,.1,50);this.camera.position.set(.72,1.35,4.15);this.camera.lookAt(0,.95,0);this.scene.add(new T.HemisphereLight(0xeaf5ff,0x65717c,1.7));const key=new T.DirectionalLight(0xfff0da,3.2);key.position.set(3,4,4);this.scene.add(key);const fill=new T.DirectionalLight(0xb9dcf4,1.4);fill.position.set(-3,2,3);this.scene.add(fill);this.avatar=new ProceduralAvatar(T,defaultAppearance);this.scene.add(this.avatar.group)}
  make(app,pose){if(!this.renderer)return null;this.avatar.rebuild(app,pose);this.avatar.group.rotation.y=.16;this.camera.position.set(.55,pose==="sitting"?1.05:1.30,4.20);this.camera.lookAt(0,pose==="sitting"?.78:.96,0);this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL("image/png")}
}

let creator3d=null;let snapshotMaker=null;
if(THREE){creator3d=new Creator3D($("#creatorCanvas"));snapshotMaker=new SnapshotMaker()}else{$("#engineStatus").textContent="3D 引擎無法載入。請確認網路後重新整理。";$("#engineStatus").classList.add("error")}

function refreshSnapshots(){if(!snapshotMaker)return;snapshots.standing=snapshotMaker.make(state.profile.appearance,"standing");snapshots.sitting=snapshotMaker.make(state.profile.appearance,"sitting");snapshots.reading=snapshotMaker.make(state.profile.appearance,"reading");snapshots.counter=snapshotMaker.make(state.profile.appearance,"counter")}
function poseImage(pose="standing"){return snapshots[pose]||snapshots.standing||""}
function avatarImg(pose="standing",alt="角色"){const src=poseImage(pose);return src?`<img src="${src}" alt="${esc(alt)}">`:`<span class="person-token">人</span>`}

function optionIcon(cat,index){if(cat==="face")return `<span class="preview-icon" style="border-radius:${42-(index%4)*3}% ${46+(index%3)*2}% 50% 50%"></span>`;if(cat==="eyes")return `<span class="preview-icon" style="height:${26+(index%4)*2}px;border-radius:50%"></span>`;if(cat==="hair")return `<span class="preview-icon" style="background:linear-gradient(160deg,#29343c ${35+(index%4)*7}%,#d5e0e6 0)"></span>`;return `<span class="preview-icon"></span>`}
function renderCategory(){const cfg=CATEGORY[currentCategory];$("#categoryTitle").textContent=cfg.title;$("#categoryKicker").textContent=cfg.kicker;$("#categoryCount").textContent=`${cfg.items.length} 種`;const host=$("#optionHost");host.innerHTML="";cfg.items.forEach((item,i)=>{const b=document.createElement("button");b.type="button";const selected=draftAppearance[cfg.key]===i;b.className=`option-card ${selected?"selected":""} ${cfg.type==="swatches"?"swatch-option":""} ${cfg.type==="outfits"?"outfit-option":""}`;if(cfg.type==="swatches")b.innerHTML=`<span class="swatch-dot" style="--swatch:${item}"></span><b>${String(i+1).padStart(2,"0")}</b>`;else if(cfg.type==="outfits")b.innerHTML=`<span class="outfit-thumb" style="--top:${item.top};--accent:${item.accent};--bottom:${item.bottom}"></span><b>${item.label}</b>`;else b.innerHTML=`${optionIcon(currentCategory,i)}<b>${item.label}</b>`;b.onclick=()=>{draftAppearance[cfg.key]=i;renderCategory();creator3d?.update(draftAppearance)};host.appendChild(b)});renderDetail()}
function renderDetail(){const host=$("#detailHost");if(currentCategory!=="face"){host.innerHTML=`<div class="detail-card">所有選項都會直接改變同一個 3D 角色模型，不會重新生成另一張人物圖片。</div>`;return}const t=draftAppearance.tweaks||{faceWidth:0,jaw:0,eyeSpacing:0};host.innerHTML=`<div class="detail-card"><b>細部微調</b><div class="slider-row"><span>臉寬</span><input data-tweak="faceWidth" type="range" min="-1" max="1" step=".05" value="${t.faceWidth||0}"><output>${Math.round((t.faceWidth||0)*100)}</output></div><div class="slider-row"><span>下顎</span><input data-tweak="jaw" type="range" min="-1" max="1" step=".05" value="${t.jaw||0}"><output>${Math.round((t.jaw||0)*100)}</output></div><div class="slider-row"><span>眼距</span><input data-tweak="eyeSpacing" type="range" min="-1" max="1" step=".05" value="${t.eyeSpacing||0}"><output>${Math.round((t.eyeSpacing||0)*100)}</output></div></div>`;host.querySelectorAll("input[data-tweak]").forEach(inp=>inp.oninput=()=>{draftAppearance.tweaks[inp.dataset.tweak]=Number(inp.value);inp.nextElementSibling.value=Math.round(Number(inp.value)*100);creator3d?.update(draftAppearance)})}
function selectCategory(cat){currentCategory=cat;$$('#categoryRail button').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));renderCategory()}

function showLogin(){$("#authScreen").classList.remove("hidden");$("#loginStep").classList.remove("hidden");$("#creatorStep").classList.add("hidden");const has=!!state.profile.created;$("#continueProfileBtn").classList.toggle("hidden",!has);$("#editProfileBtn").classList.toggle("hidden",!has);$("#newProfileBtn").textContent=has?"建立新角色（重設目前進度）":"建立新角色";const preview=$("#savedProfilePreview");preview.classList.toggle("hidden",!has);if(has){if(!snapshots.standing)refreshSnapshots();preview.innerHTML=`${poseImage("standing")?`<img src="${poseImage("standing")}" alt="目前角色">`:""}<div><small>目前角色</small><b>${esc(playerDisplayName())}</b><span>${state.player.registered?`居民編號 ${esc(state.player.residentId||"")}`:"尚未進行居民登記"}</span></div>`}}
function showCreator(reset=false){draftAppearance=reset?clone(defaultAppearance):clone(state.profile.appearance||defaultAppearance);$("#loginStep").classList.add("hidden");$("#creatorStep").classList.remove("hidden");selectCategory("face");creator3d?.update(draftAppearance);setTimeout(()=>creator3d?.resize(),30)}
function resetWorldForNewCharacter(){const fresh=clone(world);fresh.profile.created=true;fresh.profile.appearance=clone(draftAppearance);state=fresh;save()}
async function saveAppearanceAndEnter(newCharacter=false){if(!THREE){toast("3D 引擎尚未載入，請確認網路後重新整理。");return}if(newCharacter||!state.profile.created)resetWorldForNewCharacter();else{state.profile.created=true;state.profile.appearance=clone(draftAppearance);save()}refreshSnapshots();enterWorld()}
function enterWorld(){worldEntered=true;$("#authScreen").classList.add("hidden");renderAll();if(state.player.place==="hall")openPlace(building("hall"),false);else showCity();startOnboardingIfNeeded()}

function renderClock(){$("#clock").textContent=nowTime();$("#money").textContent=Number(state.player.money).toLocaleString("zh-TW");$("#playerLabel").textContent=playerDisplayName()}
setInterval(renderClock,1000);renderClock();
function updateGuide(){const strip=$("#guideStrip"),text=$("#guideText");if(state.player.registered){strip.classList.add("hidden");return}strip.classList.remove("hidden");if(state.player.place!=="hall")text.textContent="你目前還沒有正式居民姓名。請先到潮港市政廳完成居民登記。";else if(!state.player.ticket&&state.cityhall.counterBusy)text.textContent="服務櫃台目前有人使用，請先抽號碼牌。";else if(state.player.ticket&&!state.player.ticket.called)text.textContent=`你的號碼是 ${state.player.ticket.number}，等待時可坐下或查看公告欄。`;else if(state.player.ticket?.called)text.textContent=`叫到 ${state.player.ticket.number}，請到服務櫃台。`;else text.textContent="請到服務櫃台完成居民姓名與生日登記。"}
function renderPlayerSummary(){if(!snapshots.standing)refreshSnapshots();$("#playerSummaryAvatar").innerHTML=avatarImg("standing",playerDisplayName());$("#playerSummaryName").textContent=playerDisplayName();$("#playerSummaryMeta").textContent=state.player.registered?`生日 ${state.player.birthday} · ${state.player.residentId}`:"外觀已建立；姓名、生日尚未登記。"}
function renderCity(){$("#buildingBubbles").innerHTML="";Object.values(state.buildings).forEach(b=>{if(b.status==="demolished")return;const btn=document.createElement("button");btn.className=`building-bubble ${b.status} ${state.player.place===b.id?"current":""} ${(!state.player.registered&&b.id==="hall")?"guided":""}`;btn.style.left=b.x+"%";btn.style.top=b.y+"%";btn.innerHTML=`<span class="ico">${b.icon}</span><span class="name">${esc(b.name)}</span>`;btn.onclick=()=>goToBuilding(b);$("#buildingBubbles").appendChild(btn)});const cur=building(state.player.place);$("#currentPlace").textContent=cur?.name||"潮港城";$("#currentState").textContent=state.player.registered?"點建築名稱氣泡即可前往。":"首次抵達：請先完成居民證件登記。";$("#feed").innerHTML=state.feed.slice(0,6).map(x=>`<div class="feed-item"><time>${esc(x.time)}</time>${esc(x.text)}</div>`).join("");renderPlayerSummary();updateGuide();renderClock()}
function renderAll(){renderCity();renderClock()}
function goToBuilding(b){if(state.player.inTransit)return;if(b.status==="closed"){toast(`${b.name}目前停業。`);return}if(b.status==="construction"){toast(`${b.name}仍在施工。`);return}if(state.player.place===b.id){openPlace(b);return}startTravel(b)}
function startTravel(b,{onboarding=false}={}){state.player.inTransit=true;state.onboarding.started ||= onboarding;save();const strip=$("#travelStrip");strip.classList.remove("hidden");$("#travelTitle").textContent=onboarding?`居民登記引導 · 前往 ${b.name}`:`前往 ${b.name}`;$("#travelMeta").textContent="潮港城市內移動 · 原型壓縮時間";const duration=3200,start=performance.now();const tick=t=>{const p=Math.min(1,(t-start)/duration);$("#travelBar").style.width=(p*100)+"%";$("#travelRemain").textContent=Math.max(0,Math.ceil((duration-(t-start))/1000))+" 秒";if(p<1){requestAnimationFrame(tick);return}state.player.inTransit=false;state.player.place=b.id;save();strip.classList.add("hidden");$("#travelBar").style.width="0";openPlace(b);renderCity();if(onboarding)setTimeout(()=>toast("請查看服務櫃台；若有人使用，先抽號碼牌。"),350)};requestAnimationFrame(tick)}

const sceneConfig={cityhall:{image:"assets/cityhall-scene-v41.png",legacyMask:false,objects:[{id:"desk",name:"服務櫃台",x:77,y:47},{id:"ticket",name:"取號機",x:66,y:56},{id:"board",name:"市政資訊公告欄",x:38.2,y:40.5},{id:"waiting",name:"候位區",x:46,y:66}]},cafe:{image:"assets/cafe-scene.png",legacyMask:true,objects:[{id:"bar",name:"吧檯",x:22,y:48},{id:"seat",name:"靠窗座位",x:61,y:47},{id:"exit",name:"出入口",x:82,y:62}]}};
function setSceneScreen(on){$("#cityScreen").classList.toggle("active",!on);$("#placeScreen").classList.toggle("active",on)}
function openPlace(b,pushHistory=true){const cfg=sceneConfig[b.scene];if(!cfg){toast(`${b.name}的室內場景之後建立。`);return}setSceneScreen(true);$("#sceneImage").src=cfg.image;$("#sceneMask").classList.toggle("hidden",!cfg.legacyMask);$("#sceneTitle").textContent=b.name;$("#placeHeading").textContent=b.name;$("#placeText").textContent=b.description;renderObjects(cfg,b);renderPeople(b);renderActions(b);renderQueuePanel(b);if(pushHistory&&history.state?.asterraScreen!=="place")history.pushState({asterraScreen:"place",place:b.id},"",location.href);updateGuide();window.scrollTo({top:0,behavior:"instant"})}
function renderObjects(cfg,b){const layer=$("#objectLayer");layer.innerHTML="";cfg.objects.forEach(o=>{const btn=document.createElement("button");btn.className=`object-chip object-${o.id}`;btn.style.left=o.x+"%";btn.style.top=o.y+"%";btn.textContent=o.name;btn.onclick=()=>handleObject(o.id,b);layer.appendChild(btn)})}
function handleObject(id,b){if(b.id!=="hall"){toast("這個位置之後接上對應互動。");return}if(id==="desk")openServiceDesk();if(id==="ticket")drawTicket();if(id==="board")viewBulletin();if(id==="waiting")chooseWaitingSeat()}
function hallPeople(){const list=[];if(state.cityhall.serviceResidentPresent)list.push({id:"resident017",name:"居民",activity:"正在服務櫃台辦理業務。",kind:"npc",x:75,y:47,glyph:"居"});if(state.player.place==="hall"&&state.player.hallActivity){const slots={"waiting-seat":{x:46,y:65,activity:"坐在候位區等待叫號。",pose:"sitting"},bulletin:{x:38,y:48,activity:"站在市政資訊公告欄前查看公告。",pose:"reading"},counter:{x:70,y:52,activity:"正在服務櫃台辦理業務。",pose:"counter"}};const s=slots[state.player.hallActivity];if(s)list.push({id:"player",name:playerDisplayName(),activity:s.activity,kind:"player",x:s.x,y:s.y,pose:s.pose})}return list}
function renderPeople(b){const layer=$("#peopleLayer"),list=$("#peopleList");layer.innerHTML="";list.innerHTML="";const people=b.id==="hall"?hallPeople():peopleAt(b.id);if(!people.length){list.innerHTML='<div class="empty">目前沒有其他人在這個場景位置。</div>';return}people.forEach(a=>{const btn=document.createElement("button");btn.className=`person-anchor ${a.kind||""}`;btn.style.left=a.x+"%";btn.style.top=a.y+"%";if(a.id==="player")btn.innerHTML=`<span class="scene-avatar-wrap">${avatarImg(a.pose||"standing",a.name)}</span><span class="person-bubble">${esc(a.name)}</span>`;else if(a.portrait)btn.innerHTML=`<span class="person-card"><img src="${a.portrait}" alt="${esc(a.name)}"></span><span class="person-bubble">${a.known?esc(a.name):"陌生人"}</span>`;else btn.innerHTML=`<span class="person-token">${a.glyph||"人"}</span><span class="person-bubble">${esc(a.name)}</span>`;btn.onclick=()=>a.id==="player"?toast(`你目前：${a.activity}`):a.id==="zhaoye"?talk(a):toast(`${a.name}${a.activity}`);layer.appendChild(btn);const row=document.createElement("button");row.className="person-row";row.innerHTML=`<b>${a.id==="zhaoye"?(a.known?esc(a.name):"陌生人"):esc(a.name)}</b><small>${esc(a.activity)}</small>`;row.onclick=btn.onclick;list.appendChild(row)})}
function renderQueuePanel(b){const panel=$("#queuePanel");if(b.id!=="hall"){panel.classList.add("hidden");return}panel.classList.remove("hidden");const parts=[`目前叫號：<b>${esc(state.cityhall.currentNumber)}</b>`];if(state.player.ticket)parts.push(`你的號碼：<b>${esc(state.player.ticket.number)}</b>${state.player.ticket.called?' · <em>已叫號</em>':''}`);else parts.push("你尚未取號");$("#queueStatus").innerHTML=parts.join("<br>")}
function renderActions(b){const list=$("#actionList");list.innerHTML="";const labels=b.id==="hall"?hallActionLabels():[{label:"找位置坐",fn:()=>toast("你找了個位置坐下。")},{label:"查看菜單",fn:()=>toast("菜單後續接上。")},{label:"點一杯飲料",fn:()=>toast("點餐後續接上。")},{label:"看看窗外",fn:()=>toast("你看向港口。")},{label:"離開咖啡館",fn:leavePlace}];labels.forEach(({label,fn})=>{const btn=document.createElement("button");btn.className="action-btn";btn.textContent=label;btn.onclick=fn;list.appendChild(btn)})}
function hallActionLabels(){const out=[{label:"服務櫃台",fn:openServiceDesk}];if(state.cityhall.counterBusy&&!state.player.ticket)out.push({label:"抽號碼牌",fn:drawTicket});if(state.player.ticket&&!state.player.ticket.called){out.push({label:"坐在候位區等待",fn:chooseWaitingSeat});out.push({label:"查看市政資訊公告欄",fn:viewBulletin})}else out.push({label:"查看市政資訊公告欄",fn:viewBulletin});out.push({label:"離開市政廳",fn:leavePlace});return out}
function openModal(kicker,title,text,actions=[]){$("#dialogueKicker").textContent=kicker;$("#dialogueName").textContent=title;$("#dialogueText").textContent=text;const acts=$("#dialogueActions");acts.innerHTML="";actions.forEach(([label,fn])=>{const b=document.createElement("button");b.textContent=label;b.onclick=fn;acts.appendChild(b)});$("#dialogue").classList.remove("hidden")}
function closeDialogue(){$("#dialogue").classList.add("hidden")}
function openServiceDesk(){if(state.player.place!=="hall")return;if(state.player.ticket?.called){state.player.hallActivity="counter";save();renderPeople(building("hall"));openServiceMenu();return}if(state.cityhall.counterBusy){openModal("SERVICE","服務櫃台","目前有居民正在使用服務櫃台。請先抽號碼牌。",[["抽號碼牌",drawTicket],["先查看公告欄",viewBulletin]]);return}state.player.hallActivity="counter";save();renderPeople(building("hall"));openServiceMenu()}
function openServiceMenu(){const actions=[];if(!state.player.registered)actions.push(["居民證件登記",openRegistration]);actions.push(["房產服務",()=>openModal("PROPERTY","房產服務","可在這裡查詢承租、購買、土地與住宅相關業務。此版本先完成入口層級。",[["返回櫃台",openServiceMenu]])]);actions.push(["土地／建設業務",()=>openModal("CITY HALL","土地／建設業務","之後會接上購地、新建、改建與許可流程。",[["返回櫃台",openServiceMenu]])]);openModal("SERVICE","服務櫃台",state.player.registered?"請選擇要辦理的業務。":"你還沒有居民姓名與生日資料。首次辦理請先完成居民登記。",actions)}
function drawTicket(){if(state.player.place!=="hall")return;if(state.player.ticket){openWaitChoices();return}if(!state.cityhall.counterBusy){toast("服務櫃台目前無人使用，可以直接辦理。");openServiceDesk();return}const n=`A${String(state.cityhall.nextNumber).padStart(3,"0")}`;state.cityhall.nextNumber++;state.player.ticket={number:n,called:false};state.player.hallActivity=null;save();renderAllHall();openModal("QUEUE","已取得號碼牌",`你的號碼是 ${n}。目前叫號 ${state.cityhall.currentNumber}。等待期間可以坐在候位區，或到市政資訊公告欄查看公告。`,[["坐下等待",chooseWaitingSeat],["查看公告欄",viewBulletin]]);scheduleQueueCall()}
function scheduleQueueCall(){clearTimeout(queueTimer);if(!state.player.ticket||state.player.ticket.called)return;queueTimer=setTimeout(()=>{if(!state.player.ticket||state.player.ticket.called)return;state.cityhall.serviceResidentPresent=false;state.cityhall.counterBusy=false;state.cityhall.currentNumber=state.player.ticket.number;state.cityhall.calledNumber=state.player.ticket.number;state.player.ticket.called=true;save();if(state.player.place==="hall"){renderAllHall();toast(`${state.player.ticket.number}，請至服務櫃台。`);openModal("QUEUE","叫到你的號碼",`${state.player.ticket.number}，請到服務櫃台辦理。`,[["前往服務櫃台",openServiceDesk],["稍後再去",closeDialogue]])}},9000)}
function openWaitChoices(){openModal("QUEUE","等待叫號",`你的號碼是 ${state.player.ticket.number}。等待期間可以選擇坐下，或站到公告欄前查看市政資訊。`,[["坐在候位區",chooseWaitingSeat],["查看公告欄",viewBulletin]])}
function chooseWaitingSeat(){if(state.player.place!=="hall")return;if(state.cityhall.counterBusy&&!state.player.ticket){openModal("QUEUE","候位區","服務櫃台有人使用時，請先抽號碼牌再等待。",[["抽號碼牌",drawTicket]]);return}state.player.hallActivity="waiting-seat";save();closeDialogue();renderAllHall();toast("你在候位區坐下等待。")}
function viewBulletin(){if(state.player.place!=="hall")return;if(state.player.ticket&&!state.player.ticket.called)state.player.hallActivity="bulletin";save();renderAllHall();openModal("CITY INFO","市政資訊公告欄","公告欄目前張貼：城市公共住宅資訊、港區道路施工通知、近期市集活動。若你正在排隊，叫號仍會持續。",state.player.ticket&&!state.player.ticket.called?[["繼續查看",closeDialogue],["回候位區坐下",chooseWaitingSeat]]:[["關閉",closeDialogue]])}
function makeResidentId(){return `CH-${String(new Date().getFullYear()).slice(-2)}-${Math.floor(100000+Math.random()*900000)}`}
function openRegistration(){closeDialogue();$("#regName").value=state.player.name||"";$("#regBirthday").value=state.player.birthday||"";$("#regPronoun").value=state.player.pronoun||"";$("#residentIdPreview").textContent=state.player.residentId||makeResidentId();$("#registrationModal").classList.remove("hidden")}
function closeRegistration(){$("#registrationModal").classList.add("hidden")}
function submitRegistration(e){e.preventDefault();const name=$("#regName").value.trim(),birthday=$("#regBirthday").value,pronoun=$("#regPronoun").value.trim();if(!name||!birthday)return;state.player.name=name;state.player.birthday=birthday;state.player.pronoun=pronoun||null;state.player.residentId=$("#residentIdPreview").textContent;state.player.registered=true;state.onboarding.finished=true;state.player.ticket=null;state.player.hallActivity="counter";state.cityhall.calledNumber=null;state.cityhall.counterBusy=false;state.feed.unshift({time:nowTime(),text:`${name}已完成潮港城居民證件登記。`});save();closeRegistration();renderAllHall();renderCity();updateGuide();openModal("REGISTRATION","居民登記完成",`${name}的潮港城居民資料已建立。居民編號：${state.player.residentId}。`,[["完成",closeDialogue]])}
function renderAllHall(){if(state.player.place!=="hall")return;const b=building("hall");renderPeople(b);renderActions(b);renderQueuePanel(b);updateGuide();renderClock()}
function talk(a){openModal("FACE TO FACE",a.known?a.name:"陌生人",a.known?"朝野把筆記闔上一半，抬眼看向你。":"你靠近時，他先看了你一眼，沒有主動把對話接得很長。",[["打招呼",()=>{if(!a.known){a.known=true;state.feed.unshift({time:nowTime(),text:`${playerDisplayName()}在港口咖啡館認識了${a.name}。`});save()}$("#dialogueName").textContent=a.name;$("#dialogueText").textContent="「嗨。」他笑了一下，接著仍把注意力留在自己的筆記上。";renderPeople(building(state.player.place));renderCity()}],["先不打擾",closeDialogue]])}
function showCity(){closeDialogue();setSceneScreen(false);renderCity();window.scrollTo({top:0,behavior:"instant"})}
function leavePlace(){state.player.hallActivity=null;save();if(history.state?.asterraScreen==="place")history.back();else showCity()}
function resetFirstFlowPreserveAppearance(){const app=clone(state.profile.appearance),created=state.profile.created;const fresh=clone(world);fresh.profile.created=created;fresh.profile.appearance=app;state=fresh;save();clearTimeout(queueTimer);refreshSnapshots();showCity();renderAll();startOnboardingIfNeeded(true);toast("居民登記流程已重置；外觀保留。")}
function startOnboardingIfNeeded(force=false){if(!worldEntered||state.player.registered)return;if((force||!state.onboarding.started)&&state.player.place!=="hall"){setTimeout(()=>{toast("首次抵達潮港城：先前往市政廳完成居民證件登記。");setTimeout(()=>startTravel(building("hall"),{onboarding:true}),850)},600)}else if(state.player.place==="hall")openPlace(building("hall"),false)}

// UI bindings
$("#categoryRail").addEventListener("click",e=>{const b=e.target.closest("button[data-cat]");if(b)selectCategory(b.dataset.cat)});
$("#newProfileBtn").onclick=()=>{if(state.profile.created&&!confirm("建立新角色會重設目前的遊戲測試進度。要繼續嗎？"))return;showCreator(true);$("#saveAvatar").dataset.newCharacter="1"};
$("#continueProfileBtn").onclick=()=>{refreshSnapshots();enterWorld()};
$("#editProfileBtn").onclick=()=>{showCreator(false);$("#saveAvatar").dataset.newCharacter="0"};
$("#backToLogin").onclick=showLogin;
$("#randomizeAvatar").onclick=()=>{draftAppearance={face:Math.floor(Math.random()*FACE_PRESETS.length),skin:Math.floor(Math.random()*SKINS.length),eyes:Math.floor(Math.random()*EYES.length),brows:Math.floor(Math.random()*BROWS.length),nose:Math.floor(Math.random()*NOSES.length),mouth:Math.floor(Math.random()*MOUTHS.length),hair:Math.floor(Math.random()*HAIRS.length),hairColor:Math.floor(Math.random()*HAIR_COLORS.length),iris:Math.floor(Math.random()*IRIS.length),outfit:Math.floor(Math.random()*OUTFITS.length),tweaks:{faceWidth:(Math.random()-.5)*.5,jaw:(Math.random()-.5)*.5,eyeSpacing:(Math.random()-.5)*.5}};renderCategory();creator3d?.update(draftAppearance)};
$("#resetAvatar").onclick=()=>{draftAppearance=clone(defaultAppearance);renderCategory();creator3d?.update(draftAppearance)};
$("#saveAvatar").onclick=()=>saveAppearanceAndEnter($("#saveAvatar").dataset.newCharacter==="1");
const setView=(yaw,btn)=>{if(creator3d)creator3d.targetYaw=yaw;[$("#frontView"),$("#threeQuarterView"),$("#sideView")].forEach(x=>x.classList.toggle("active",x===btn))};$("#frontView").onclick=()=>setView(0,$("#frontView"));$("#threeQuarterView").onclick=()=>setView(.36,$("#threeQuarterView"));$("#sideView").onclick=()=>setView(Math.PI/2,$("#sideView"));
$("#returnLogin").onclick=()=>{worldEntered=false;showLogin()};$("#dialogueClose").onclick=closeDialogue;$("#backToCity").onclick=leavePlace;$("#worldBtn").onclick=()=>toast("世界地圖會在後續階段接回四城。");$("#resetDemo").onclick=resetFirstFlowPreserveAppearance;$("#registrationClose").onclick=closeRegistration;$("#registrationForm").addEventListener("submit",submitRegistration);
history.replaceState({asterraScreen:"city"},"",location.href);window.addEventListener("popstate",()=>{if(worldEntered)showCity()});

if(engineError){$("#newProfileBtn").title="需要連線載入 Three.js 3D 引擎"}
selectCategory("face");showLogin();if(state.player.ticket&&!state.player.ticket.called)scheduleQueueCall();
