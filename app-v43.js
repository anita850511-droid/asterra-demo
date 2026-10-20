(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const nowTime = () => new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
  const STORAGE_KEY = "asterra-v43-state";

  const creator = {
    skins:["#f7d9c5","#eec3a6","#d9a47e","#bc805d","#925f43","#68422f"],
    eyes:[
      {id:"round",label:"圓眼"},{id:"almond",label:"杏眼"},{id:"up",label:"上挑"},{id:"down",label:"下垂"},{id:"soft",label:"柔和大眼"}
    ],
    brows:[
      {id:"soft",label:"自然眉"},{id:"straight",label:"平眉"},{id:"arch",label:"弧眉"},{id:"sharp",label:"俐落眉"}
    ],
    noses:[
      {id:"small",label:"小巧"},{id:"straight",label:"直鼻"},{id:"round",label:"圓鼻"},{id:"defined",label:"立體"}
    ],
    mouths:[
      {id:"calm",label:"自然"},{id:"smile",label:"微笑"},{id:"soft",label:"柔和"},{id:"full",label:"豐唇"},{id:"small",label:"小嘴"}
    ],
    hairStyles:[
      {id:"bob",label:"短鮑伯"},{id:"short",label:"俐落短髮"},{id:"long",label:"長直髮"},{id:"wave",label:"長捲髮"},
      {id:"pony",label:"高馬尾"},{id:"bun",label:"盤髮"},{id:"side",label:"側分中長髮"},{id:"twin",label:"雙馬尾"}
    ],
    hairColors:["#181614","#36261f","#644332","#9b6b48","#d6b57c","#d8d9dc","#7c5a86","#35546d"],
    iris:["#413229","#6a4a32","#64809b","#4f6d60","#7c8792","#8b6e97","#3c596d","#8a7650"],
    outfits:[
      {id:"harbor",label:"港灣休閒",top:"#e8edf0",accent:"#6d879c",bottom:"#354657"},
      {id:"shirt",label:"簡約襯衫",top:"#f7f4ec",accent:"#b7c5d0",bottom:"#2b3440"},
      {id:"knit",label:"針織套裝",top:"#b9a89c",accent:"#e6ddd6",bottom:"#685c59"},
      {id:"coast",label:"海風外套",top:"#6b879f",accent:"#dbe9f2",bottom:"#283b4b"},
      {id:"dark",label:"深色便服",top:"#28313d",accent:"#8e9bad",bottom:"#181d26"},
      {id:"light",label:"淺色便服",top:"#ece0d1",accent:"#cda889",bottom:"#7b6d65"}
    ]
  };
  const defaultAppearance = {skin:1,eyes:"almond",brows:"soft",nose:"small",mouth:"calm",hairStyle:"bob",hairColor:0,iris:2,outfit:"harbor"};

  const world = {
    city:"潮港城",
    profile:{created:false,appearance:clone(defaultAppearance)},
    player:{name:null,birthday:null,pronoun:null,residentId:null,money:12840,place:"social-west",inTransit:false,registered:false,ticket:null,hallActivity:null},
    onboarding:{started:false,finished:false},
    cityhall:{currentNumber:"A017",nextNumber:18,counterBusy:true,calledNumber:null,serviceResidentPresent:true},
    parcels:{
      "P-01":{zone:"civic",building:"hall"},"P-02":{zone:"commercial",building:"cafe"},"P-03":{zone:"residential",building:"social-west"},
      "P-04":{zone:"residential",building:"res-east"},"P-05":{zone:"commercial",building:"business"},"P-06":{zone:"historic",building:"oldtown"},
      "P-07":{zone:"industrial",building:"dock"},"P-08":{zone:"scenic",building:"highland"}
    },
    buildings:{
      hall:{id:"hall",parcel:"P-01",name:"潮港市政廳",icon:"▦",status:"open",x:50.5,y:40,scene:"cityhall",description:"城市居民登記、證件、房產與土地建設業務都由服務櫃台受理。"},
      cafe:{id:"cafe",parcel:"P-02",name:"港口咖啡館",icon:"☕",status:"open",x:61.5,y:56,scene:"cafe",description:"靠海的咖啡館。"},
      "social-west":{id:"social-west",parcel:"P-03",name:"西灣住宅區",icon:"⌂",status:"open",x:26,y:22,scene:"generic",description:"住宅區。"},
      "res-east":{id:"res-east",parcel:"P-04",name:"東灣住宅區",icon:"⌂",status:"open",x:84,y:45,scene:"generic",description:"住宅區。"},
      business:{id:"business",parcel:"P-05",name:"中央商業區",icon:"▥",status:"open",x:72,y:32,scene:"generic",description:"辦公與商業核心。"},
      oldtown:{id:"oldtown",parcel:"P-06",name:"舊城區",icon:"▤",status:"open",x:23,y:49,scene:"generic",description:"舊港街區。"},
      dock:{id:"dock",parcel:"P-07",name:"潮港碼頭",icon:"⚓",status:"open",x:83,y:73,scene:"generic",description:"港口物流與出海區。"},
      highland:{id:"highland",parcel:"P-08",name:"山城高地",icon:"▲",status:"open",x:48,y:13,scene:"generic",description:"山城景觀區。"}
    },
    actors:{
      zhaoye:{id:"zhaoye",name:"朝野",place:"cafe",known:false,activity:"坐在靠窗座位寫東西，沒有主動找人說話。",portrait:"assets/zhaoye-portrait.png",x:43,y:51}
    },
    feed:[
      {time:"現在",text:"你剛抵達潮港城，尚未完成居民證件登記。"},
      {time:"現在",text:"港口咖啡館今日正常營業。"}
    ]
  };

  let state = load();
  let draftAppearance = clone(state.profile?.appearance || defaultAppearance);
  let queueTimer = null;
  let worldEntered = false;

  function load(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      return raw?mergeState(clone(world),JSON.parse(raw)):clone(world);
    }catch{return clone(world)}
  }
  function mergeState(base,saved){
    return {...base,...saved,
      profile:{...base.profile,...(saved.profile||{}),appearance:{...base.profile.appearance,...(saved.profile?.appearance||{})}},
      player:{...base.player,...(saved.player||{})},onboarding:{...base.onboarding,...(saved.onboarding||{})},cityhall:{...base.cityhall,...(saved.cityhall||{})},
      buildings:{...base.buildings,...(saved.buildings||{})},actors:{...base.actors,...(saved.actors||{})}
    };
  }
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}}
  function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2300)}
  function building(id){return state.buildings[id]}
  function peopleAt(place){return Object.values(state.actors).filter(a=>a.place===place)}
  function playerDisplayName(){return state.player.registered && state.player.name ? state.player.name : "未登記居民"}
  function outfitById(id){return creator.outfits.find(x=>x.id===id)||creator.outfits[0]}

  function eyeMarkup(type, iris, skin){
    const y=132;
    const common=(cx,flip=1)=>{
      if(type==="round") return `<ellipse cx="${cx}" cy="${y}" rx="12" ry="10" fill="#fff"/><circle cx="${cx}" cy="${y}" r="6" fill="${iris}"/><circle cx="${cx}" cy="${y}" r="2.3" fill="#17191b"/><circle cx="${cx-2}" cy="${y-2}" r="1.3" fill="#fff"/>`;
      if(type==="soft") return `<path d="M${cx-13} ${y+1} Q${cx} ${y-13} ${cx+13} ${y+1} Q${cx} ${y+11} ${cx-13} ${y+1}" fill="#fff"/><circle cx="${cx}" cy="${y}" r="6.2" fill="${iris}"/><circle cx="${cx}" cy="${y}" r="2.2" fill="#17191b"/>`;
      const tilt=type==="up"? -4:type==="down"?4:0;
      return `<path d="M${cx-14} ${y+tilt} Q${cx} ${y-8} ${cx+14} ${y-tilt}" fill="none" stroke="#2c2420" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="${cx}" cy="${y-1}" rx="5.7" ry="6.5" fill="${iris}"/><circle cx="${cx}" cy="${y-1}" r="2.1" fill="#151719"/>`;
    };
    return common(86)+common(134,-1);
  }
  function browMarkup(type){
    const map={
      soft:["M72 111 Q86 105 99 110","M121 110 Q134 105 148 111"],
      straight:["M72 110 L99 108","M121 108 L148 110"],
      arch:["M72 113 Q84 101 100 109","M120 109 Q136 101 148 113"],
      sharp:["M72 111 L87 105 L100 109","M120 109 L134 105 L148 111"]
    };
    return (map[type]||map.soft).map(d=>`<path d="${d}" fill="none" stroke="#3a2a24" stroke-width="4.2" stroke-linecap="round"/>`).join("");
  }
  function noseMarkup(type,skin){
    const dark="#9a6c57";
    if(type==="straight") return `<path d="M110 139 L108 161 Q110 166 116 163" fill="none" stroke="${dark}" stroke-width="2.3" stroke-linecap="round" opacity=".65"/>`;
    if(type==="round") return `<path d="M108 151 Q110 163 119 160 Q115 169 106 164" fill="none" stroke="${dark}" stroke-width="2.3" stroke-linecap="round" opacity=".65"/>`;
    if(type==="defined") return `<path d="M111 138 Q106 153 108 163 L119 163" fill="none" stroke="${dark}" stroke-width="2.7" stroke-linecap="round" opacity=".75"/>`;
    return `<path d="M109 151 Q108 162 116 162" fill="none" stroke="${dark}" stroke-width="2.1" stroke-linecap="round" opacity=".55"/>`;
  }
  function mouthMarkup(type){
    const c="#9c5961";
    if(type==="smile") return `<path d="M96 179 Q110 189 124 179" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    if(type==="soft") return `<path d="M98 180 Q110 175 122 180 Q110 187 98 180" fill="#bd7279" opacity=".9"/>`;
    if(type==="full") return `<path d="M95 180 Q104 172 110 177 Q116 172 125 180 Q112 191 95 180" fill="#a95c68"/>`;
    if(type==="small") return `<path d="M104 181 Q110 178 116 181" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    return `<path d="M98 181 Q110 184 122 181" fill="none" stroke="${c}" stroke-width="2.7" stroke-linecap="round"/>`;
  }
  function hairBack(style,color){
    const common=`fill="${color}"`;
    const map={
      bob:`<path d="M53 105 Q52 55 110 43 Q170 52 168 111 L158 196 Q145 210 135 191 L84 193 Q66 211 57 189Z" ${common}/>` ,
      short:`<path d="M58 112 Q49 65 78 51 Q111 32 151 52 Q175 69 160 119 L150 151 L70 150Z" ${common}/>` ,
      long:`<path d="M50 105 Q52 52 110 42 Q168 52 171 108 L165 272 Q144 292 130 263 L88 263 Q69 293 53 270Z" ${common}/>` ,
      wave:`<path d="M48 104 Q51 49 110 41 Q171 52 172 110 Q181 145 164 174 Q179 205 160 233 Q174 264 151 284 Q132 270 122 283 L92 283 Q79 269 60 285 Q40 260 56 232 Q38 205 56 176 Q41 145 48 104Z" ${common}/>` ,
      pony:`<path d="M56 106 Q51 52 110 42 Q169 52 166 113 L154 178 L67 176Z" ${common}/><path d="M153 78 Q193 91 175 155 Q169 199 193 239 Q158 238 145 199 Q136 158 151 117Z" ${common}/>` ,
      bun:`<circle cx="111" cy="48" r="34" ${common}/><path d="M57 106 Q52 55 110 43 Q168 53 165 115 L153 173 L68 173Z" ${common}/>` ,
      side:`<path d="M52 103 Q52 51 109 42 Q168 52 171 112 L160 242 Q144 258 130 236 L86 239 Q66 259 54 239Z" ${common}/>` ,
      twin:`<path d="M57 106 Q52 54 110 43 Q168 53 164 112 L153 174 L68 174Z" ${common}/><path d="M62 104 Q27 119 40 183 Q45 220 24 250 Q55 250 69 216 Q81 175 66 133Z" ${common}/><path d="M158 104 Q193 119 180 183 Q175 220 196 250 Q165 250 151 216 Q139 175 154 133Z" ${common}/>`
    };
    return map[style]||map.bob;
  }
  function hairFront(style,color){
    const c=`fill="${color}"`;
    const map={
      bob:`<path d="M62 99 Q70 52 111 52 Q151 55 161 96 Q147 77 129 72 Q121 93 101 101 Q84 87 62 99Z" ${c}/><path d="M66 86 Q57 117 68 150 L79 139 L80 91Z" ${c}/><path d="M154 87 L145 91 L143 141 L155 151 Q164 116 154 87Z" ${c}/>` ,
      short:`<path d="M61 99 Q69 58 106 51 Q138 47 160 77 L146 72 L155 94 Q137 79 126 73 L128 94 Q112 82 104 69 Q92 86 61 99Z" ${c}/>` ,
      long:`<path d="M62 98 Q69 53 110 50 Q151 55 161 98 Q145 77 125 70 Q116 91 94 101 Q82 87 62 98Z" ${c}/><path d="M64 91 L78 89 L76 181 L62 190Z" ${c}/><path d="M155 90 L143 89 L145 181 L160 191Z" ${c}/>` ,
      wave:`<path d="M61 98 Q69 52 110 49 Q151 54 161 98 Q145 76 126 71 Q114 94 93 100 Q82 86 61 98Z" ${c}/>` ,
      pony:`<path d="M62 98 Q70 52 111 51 Q151 55 160 97 Q148 75 131 70 Q121 89 97 101 Q84 86 62 98Z" ${c}/>` ,
      bun:`<path d="M61 98 Q69 52 110 50 Q150 54 160 97 Q143 75 126 69 Q115 92 93 101 Q81 86 61 98Z" ${c}/>` ,
      side:`<path d="M58 99 Q66 51 108 49 Q150 53 163 95 Q143 80 121 66 Q105 89 76 105Z" ${c}/><path d="M143 71 Q166 93 157 151 L146 136 L141 82Z" ${c}/>` ,
      twin:`<path d="M61 98 Q69 52 110 50 Q151 54 161 98 Q143 77 126 70 Q115 91 94 101 Q81 86 61 98Z" ${c}/>`
    };
    return map[style]||map.bob;
  }

  function avatarSvg(appearance=state.profile.appearance,pose="standing",compact=false){
    const skin=creator.skins[appearance.skin]||creator.skins[1];
    const hair=creator.hairColors[appearance.hairColor]||creator.hairColors[0];
    const iris=creator.iris[appearance.iris]||creator.iris[2];
    const outfit=outfitById(appearance.outfit);
    const seated=pose==="sitting";
    const read=pose==="reading";
    const yShift=seated?20:0;
    const bodyTop=196+yShift;
    const arms=read
      ? `<path d="M76 ${bodyTop+28} Q58 ${bodyTop+56} 74 ${bodyTop+78}" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round"/><path d="M144 ${bodyTop+28} Q157 ${bodyTop+42} 145 ${bodyTop+61}" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round"/><rect x="125" y="${bodyTop+54}" width="35" height="25" rx="3" fill="#d7e0e5" transform="rotate(-8 142 ${bodyTop+66})"/>`
      : `<path d="M77 ${bodyTop+28} Q65 ${bodyTop+61} 72 ${bodyTop+91}" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round"/><path d="M143 ${bodyTop+28} Q155 ${bodyTop+61} 148 ${bodyTop+91}" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round"/>`;
    const legs=seated
      ? `<path d="M91 ${bodyTop+100} L82 ${bodyTop+135} L112 ${bodyTop+140}" fill="none" stroke="${outfit.bottom}" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/><path d="M129 ${bodyTop+100} L139 ${bodyTop+135} L163 ${bodyTop+140}" fill="none" stroke="${outfit.bottom}" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/><path d="M109 ${bodyTop+140} l-23 7" stroke="#2d3037" stroke-width="13" stroke-linecap="round"/><path d="M161 ${bodyTop+140} l17 4" stroke="#2d3037" stroke-width="13" stroke-linecap="round"/>`
      : `<path d="M94 ${bodyTop+97} L91 ${bodyTop+150}" stroke="${outfit.bottom}" stroke-width="25" stroke-linecap="round"/><path d="M126 ${bodyTop+97} L129 ${bodyTop+150}" stroke="${outfit.bottom}" stroke-width="25" stroke-linecap="round"/><path d="M92 ${bodyTop+149} l-14 5" stroke="#2d3037" stroke-width="14" stroke-linecap="round"/><path d="M128 ${bodyTop+149} l14 5" stroke="#2d3037" stroke-width="14" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 220 385" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${outfit.top}"/><stop offset="1" stop-color="${outfit.accent}"/></linearGradient></defs>
      ${hairBack(appearance.hairStyle,hair)}
      <ellipse cx="110" cy="126" rx="52" ry="68" fill="${skin}"/>
      <ellipse cx="59" cy="135" rx="8" ry="15" fill="${skin}"/><ellipse cx="161" cy="135" rx="8" ry="15" fill="${skin}"/>
      ${browMarkup(appearance.brows)}${eyeMarkup(appearance.eyes,iris,skin)}${noseMarkup(appearance.nose,skin)}${mouthMarkup(appearance.mouth)}
      ${hairFront(appearance.hairStyle,hair)}
      <rect x="100" y="180" width="20" height="30" rx="9" fill="${skin}"/>
      ${arms}
      <path d="M75 ${bodyTop+12} Q110 ${bodyTop-5} 145 ${bodyTop+12} L139 ${bodyTop+101} L81 ${bodyTop+101}Z" fill="url(#shirt)"/>
      <path d="M87 ${bodyTop+18} Q110 ${bodyTop+38} 133 ${bodyTop+18}" fill="none" stroke="${outfit.accent}" stroke-width="7" opacity=".7"/>
      ${legs}
    </svg>`;
  }

  function renderClock(){
    $("#clock").textContent=nowTime();$("#money").textContent=Number(state.player.money).toLocaleString("zh-TW");
    $("#playerLabel").textContent=playerDisplayName();
  }
  setInterval(renderClock,1000);renderClock();

  function renderCreatorControls(){
    const makeSwatches=(id,values,key)=>{
      const host=$(id);host.innerHTML="";values.forEach((color,i)=>{const b=document.createElement("button");b.type="button";b.className=`swatch ${draftAppearance[key]===i?"selected":""}`;b.style.setProperty("--swatch",color);b.title=color;b.onclick=()=>{draftAppearance[key]=i;renderCreatorControls();renderAvatarPreview()};host.appendChild(b)});
    };
    const makeOptions=(id,values,key)=>{
      const host=$(id);host.innerHTML="";values.forEach(opt=>{const b=document.createElement("button");b.type="button";b.className=`creator-option ${draftAppearance[key]===opt.id?"selected":""}`;b.textContent=opt.label;b.onclick=()=>{draftAppearance[key]=opt.id;renderCreatorControls();renderAvatarPreview()};host.appendChild(b)});
    };
    makeSwatches("#skinOptions",creator.skins,"skin");
    makeOptions("#eyeOptions",creator.eyes,"eyes");makeOptions("#browOptions",creator.brows,"brows");makeOptions("#noseOptions",creator.noses,"nose");makeOptions("#mouthOptions",creator.mouths,"mouth");makeOptions("#hairStyleOptions",creator.hairStyles,"hairStyle");
    makeSwatches("#hairColorOptions",creator.hairColors,"hairColor");makeSwatches("#irisOptions",creator.iris,"iris");
    const outfits=$("#outfitOptions");outfits.innerHTML="";creator.outfits.forEach(o=>{const b=document.createElement("button");b.type="button";b.className=`outfit-option ${draftAppearance.outfit===o.id?"selected":""}`;b.innerHTML=`<span class="outfit-chip" style="--top:${o.top};--accent:${o.accent};--bottom:${o.bottom}"></span><b>${o.label}</b>`;b.onclick=()=>{draftAppearance.outfit=o.id;renderCreatorControls();renderAvatarPreview()};outfits.appendChild(b)});
  }
  function renderAvatarPreview(){$("#avatarPreview").innerHTML=avatarSvg(draftAppearance,"standing")}
  function showLogin(){
    $("#authScreen").classList.remove("hidden");$("#loginStep").classList.remove("hidden");$("#creatorStep").classList.add("hidden");
    const has=!!state.profile.created;$("#continueProfileBtn").classList.toggle("hidden",!has);$("#editProfileBtn").classList.toggle("hidden",!has);$("#newProfileBtn").textContent=has?"建立新角色（重設目前進度）":"建立新角色";
    const preview=$("#savedProfilePreview");preview.classList.toggle("hidden",!has);
    if(has) preview.innerHTML=`<div class="saved-avatar">${avatarSvg(state.profile.appearance,"standing")}</div><div><small>目前角色</small><b>${esc(playerDisplayName())}</b><span>${state.player.registered?`居民編號 ${esc(state.player.residentId||"")}`:"尚未進行居民登記"}</span></div>`;
  }
  function showCreator(reset=false){
    if(reset) draftAppearance=clone(defaultAppearance); else draftAppearance=clone(state.profile.appearance||defaultAppearance);
    $("#loginStep").classList.add("hidden");$("#creatorStep").classList.remove("hidden");renderCreatorControls();renderAvatarPreview();
  }
  function resetWorldForNewCharacter(){
    const fresh=clone(world);fresh.profile.created=true;fresh.profile.appearance=clone(draftAppearance);state=fresh;save();
  }
  function saveAppearanceAndEnter(newCharacter=false){
    if(newCharacter || !state.profile.created){resetWorldForNewCharacter();}
    else {state.profile.created=true;state.profile.appearance=clone(draftAppearance);save();}
    enterWorld();
  }
  function enterWorld(){
    worldEntered=true;$("#authScreen").classList.add("hidden");renderAll();
    if(state.player.place==="hall") openPlace(building("hall"),false);
    else showCity();
    startOnboardingIfNeeded();
  }

  function updateGuide(){
    const strip=$("#guideStrip"),text=$("#guideText");
    if(state.player.registered){strip.classList.add("hidden");return}
    strip.classList.remove("hidden");
    if(state.player.place!=="hall") text.textContent="你目前還沒有正式居民姓名。請先到潮港市政廳完成居民登記。";
    else if(!state.player.ticket && state.cityhall.counterBusy) text.textContent="服務櫃台目前有人使用，請先抽號碼牌。";
    else if(state.player.ticket && !state.player.ticket.called) text.textContent=`你的號碼是 ${state.player.ticket.number}，等待叫號時可坐下或查看市政資訊公告欄。`;
    else if(state.player.ticket?.called) text.textContent=`叫到 ${state.player.ticket.number}，請到服務櫃台。`;
    else text.textContent="請到服務櫃台完成居民姓名與生日登記。";
  }

  function renderPlayerSummary(){
    $("#playerSummaryAvatar").innerHTML=avatarSvg(state.profile.appearance,"standing");
    $("#playerSummaryName").textContent=playerDisplayName();
    $("#playerSummaryMeta").textContent=state.player.registered?`生日 ${state.player.birthday} · ${state.player.residentId}`:"外觀已建立；姓名、生日尚未登記。";
  }
  function renderCity(){
    $("#buildingBubbles").innerHTML="";
    Object.values(state.buildings).forEach(b=>{
      if(b.status==="demolished") return;
      const btn=document.createElement("button");btn.className=`building-bubble ${b.status} ${state.player.place===b.id?"current":""} ${(!state.player.registered&&b.id==="hall")?"guided":""}`;btn.style.left=b.x+"%";btn.style.top=b.y+"%";
      btn.innerHTML=`<span class="ico">${b.icon}</span><span class="name">${esc(b.name)}</span>`;btn.title=b.status==="closed"?"目前停業":b.status==="construction"?"施工中":"前往";btn.onclick=()=>goToBuilding(b);$("#buildingBubbles").appendChild(btn);
    });
    const cur=building(state.player.place);$("#currentPlace").textContent=cur?.name||"潮港城";$("#currentState").textContent=state.player.registered?"點建築名稱氣泡即可前往。":"首次抵達：請先完成居民證件登記。";
    $("#feed").innerHTML=state.feed.slice(0,6).map(x=>`<div class="feed-item"><time>${esc(x.time)}</time>${esc(x.text)}</div>`).join("");renderPlayerSummary();updateGuide();renderClock();
  }
  function renderAll(){renderCity();renderClock()}

  function goToBuilding(b){
    if(state.player.inTransit)return;if(b.status==="closed"){toast(`${b.name}目前停業。`);return}if(b.status==="construction"){toast(`${b.name}仍在施工。`);return}if(state.player.place===b.id){openPlace(b);return}startTravel(b);
  }
  function startTravel(b,{onboarding=false}={}){
    state.player.inTransit=true;state.onboarding.started ||= onboarding;save();const strip=$("#travelStrip");strip.classList.remove("hidden");$("#travelTitle").textContent=onboarding?`居民登記引導 · 前往 ${b.name}`:`前往 ${b.name}`;$("#travelMeta").textContent="潮港城市內移動 · 原型壓縮時間";
    const duration=3600,start=performance.now();const tick=t=>{const p=Math.min(1,(t-start)/duration);$("#travelBar").style.width=(p*100)+"%";$("#travelRemain").textContent=Math.max(0,Math.ceil((duration-(t-start))/1000))+" 秒";if(p<1){requestAnimationFrame(tick);return}state.player.inTransit=false;state.player.place=b.id;save();strip.classList.add("hidden");$("#travelBar").style.width="0";openPlace(b);renderCity();if(onboarding)setTimeout(()=>toast("請先查看服務櫃台；若櫃台有人使用，就到取號機抽號碼牌。"),350)};requestAnimationFrame(tick);
  }

  const sceneConfig={
    cityhall:{image:"assets/cityhall-scene-v41.png",legacyMask:false,objects:[{id:"desk",name:"服務櫃台",x:77,y:47},{id:"ticket",name:"取號機",x:66,y:56},{id:"board",name:"市政資訊公告欄",x:38.2,y:40.5},{id:"waiting",name:"候位區",x:46,y:66}]},
    cafe:{image:"assets/cafe-scene.png",legacyMask:true,objects:[{id:"bar",name:"吧檯",x:22,y:48},{id:"seat",name:"靠窗座位",x:61,y:47},{id:"exit",name:"出入口",x:82,y:62}]}
  };
  function setSceneScreen(on){$("#cityScreen").classList.toggle("active",!on);$("#placeScreen").classList.toggle("active",on)}
  function openPlace(b,pushHistory=true){
    const cfg=sceneConfig[b.scene];if(!cfg){toast(`${b.name}的室內場景之後建立。`);return}setSceneScreen(true);$("#sceneImage").src=cfg.image;$("#sceneMask").classList.toggle("hidden",!cfg.legacyMask);$("#sceneTitle").textContent=b.name;$("#placeHeading").textContent=b.name;$("#placeText").textContent=b.description;renderObjects(cfg,b);renderPeople(b);renderActions(b);renderQueuePanel(b);if(pushHistory&&history.state?.asterraScreen!=="place")history.pushState({asterraScreen:"place",place:b.id},"",location.href);updateGuide();window.scrollTo({top:0,behavior:"instant"});
  }
  function renderObjects(cfg,b){const layer=$("#objectLayer");layer.innerHTML="";cfg.objects.forEach(o=>{const btn=document.createElement("button");btn.className=`object-chip object-${o.id}`;btn.style.left=o.x+"%";btn.style.top=o.y+"%";btn.textContent=o.name;btn.onclick=()=>handleObject(o.id,b);layer.appendChild(btn)})}
  function handleObject(id,b){if(b.id!=="hall"){toast("這個位置之後接上對應互動。");return}if(id==="desk")openServiceDesk();if(id==="ticket")drawTicket();if(id==="board")viewBulletin();if(id==="waiting")chooseWaitingSeat()}

  function hallPeople(){
    const list=[];if(state.cityhall.serviceResidentPresent)list.push({id:"resident017",name:"居民",activity:"正在服務櫃台辦理業務。",kind:"npc",x:75,y:47,glyph:"居"});
    if(state.player.place==="hall"&&state.player.hallActivity){const slots={"waiting-seat":{x:46,y:67,activity:"坐在候位區等待叫號。",pose:"sitting"},bulletin:{x:38,y:48,activity:"站在市政資訊公告欄前查看公告。",pose:"reading"},counter:{x:70,y:52,activity:"正在服務櫃台辦理業務。",pose:"standing"}};const s=slots[state.player.hallActivity];if(s)list.push({id:"player",name:playerDisplayName(),activity:s.activity,kind:"player",x:s.x,y:s.y,pose:s.pose})}
    return list;
  }
  function renderPeople(b){
    const layer=$("#peopleLayer"),list=$("#peopleList");layer.innerHTML="";list.innerHTML="";const people=b.id==="hall"?hallPeople():peopleAt(b.id);if(!people.length){list.innerHTML='<div class="empty">目前沒有其他人在這個場景位置。</div>';return}
    people.forEach(a=>{const btn=document.createElement("button");btn.className=`person-anchor ${a.kind||""} ${a.id==="player"?"avatar-person":""}`;btn.style.left=a.x+"%";btn.style.top=a.y+"%";
      if(a.id==="player")btn.innerHTML=`<span class="scene-avatar-wrap pose-${a.pose||"standing"}">${avatarSvg(state.profile.appearance,a.pose||"standing")}</span><span class="person-bubble">${esc(a.name)}</span>`;
      else if(a.portrait)btn.innerHTML=`<span class="person-card"><img src="${a.portrait}" alt="${esc(a.name)}"></span><span class="person-bubble">${a.known?esc(a.name):"陌生人"}</span>`;
      else btn.innerHTML=`<span class="person-token">${a.glyph||"人"}</span><span class="person-bubble">${esc(a.name)}</span>`;
      btn.onclick=()=>a.id==="player"?toast(`你目前：${a.activity}`):a.id==="zhaoye"?talk(a):toast(`${a.name}${a.activity}`);layer.appendChild(btn);
      const row=document.createElement("button");row.className="person-row";row.innerHTML=`<b>${a.id==="zhaoye"?(a.known?esc(a.name):"陌生人"):esc(a.name)}</b><small>${esc(a.activity)}</small>`;row.onclick=btn.onclick;list.appendChild(row)});
  }
  function renderQueuePanel(b){const panel=$("#queuePanel");if(b.id!=="hall"){panel.classList.add("hidden");return}panel.classList.remove("hidden");const parts=[`目前叫號：<b>${esc(state.cityhall.currentNumber)}</b>`];if(state.player.ticket)parts.push(`你的號碼：<b>${esc(state.player.ticket.number)}</b>${state.player.ticket.called?' · <em>已叫號</em>':''}`);else parts.push("你尚未取號");$("#queueStatus").innerHTML=parts.join("<br>")}
  function renderActions(b){const list=$("#actionList");list.innerHTML="";const labels=b.id==="hall"?hallActionLabels():[{label:"找位置坐",fn:()=>toast("座位互動後續接上。")},{label:"查看菜單",fn:()=>toast("菜單後續接上。")},{label:"點一杯飲料",fn:()=>toast("點餐後續接上。")},{label:"看看窗外",fn:()=>toast("你看向港口。")},{label:"離開咖啡館",fn:leavePlace}];labels.forEach(({label,fn})=>{const btn=document.createElement("button");btn.className="action-btn";btn.textContent=label;btn.onclick=fn;list.appendChild(btn)})}
  function hallActionLabels(){const out=[{label:"服務櫃台",fn:openServiceDesk}];if(state.cityhall.counterBusy&&!state.player.ticket)out.push({label:"抽號碼牌",fn:drawTicket});if(state.player.ticket&&!state.player.ticket.called){out.push({label:"坐在候位區等待",fn:chooseWaitingSeat});out.push({label:"查看市政資訊公告欄",fn:viewBulletin})}else out.push({label:"查看市政資訊公告欄",fn:viewBulletin});out.push({label:"離開市政廳",fn:leavePlace});return out}

  function openModal(kicker,title,text,actions=[]){$("#dialogueKicker").textContent=kicker;$("#dialogueName").textContent=title;$("#dialogueText").textContent=text;const acts=$("#dialogueActions");acts.innerHTML="";actions.forEach(([label,fn])=>{const b=document.createElement("button");b.textContent=label;b.onclick=fn;acts.appendChild(b)});$("#dialogue").classList.remove("hidden")}
  function openServiceDesk(){
    if(state.player.place!=="hall")return;if(state.player.ticket?.called){state.player.hallActivity="counter";save();renderPeople(building("hall"));openServiceMenu();return}if(state.cityhall.counterBusy){openModal("SERVICE","服務櫃台","目前有居民正在使用服務櫃台。請先抽號碼牌，等待叫號後再前往櫃台。",[["抽號碼牌",drawTicket],["先查看公告欄",viewBulletin]]);return}state.player.hallActivity="counter";save();renderPeople(building("hall"));openServiceMenu();
  }
  function openServiceMenu(){const actions=[];if(!state.player.registered)actions.push(["居民證件登記",openRegistration]);actions.push(["房產服務",()=>openModal("PROPERTY","房產服務","可在這裡查詢承租、購買、土地與住宅相關業務。此版本先完成入口層級。",[["返回櫃台",openServiceMenu]])]);actions.push(["土地／建設業務",()=>openModal("CITY HALL","土地／建設業務","之後會接上購地、新建、改建與許可流程。",[["返回櫃台",openServiceMenu]])]);openModal("SERVICE","服務櫃台",state.player.registered?"請選擇要辦理的業務。":"你還沒有居民姓名與生日資料。首次辦理請先完成居民登記。",actions)}
  function drawTicket(){
    if(state.player.place!=="hall")return;if(state.player.ticket){openWaitChoices();return}if(!state.cityhall.counterBusy){toast("服務櫃台目前無人使用，可以直接辦理。");openServiceDesk();return}const n=`A${String(state.cityhall.nextNumber).padStart(3,"0")}`;state.cityhall.nextNumber++;state.player.ticket={number:n,called:false};state.player.hallActivity=null;save();renderAllHall();openModal("QUEUE","已取得號碼牌",`你的號碼是 ${n}。目前叫號 ${state.cityhall.currentNumber}。等待期間可以坐在候位區，或到市政資訊公告欄查看公告。`,[["坐下等待",chooseWaitingSeat],["查看公告欄",viewBulletin]]);scheduleQueueCall();
  }
  function scheduleQueueCall(){clearTimeout(queueTimer);if(!state.player.ticket||state.player.ticket.called)return;queueTimer=setTimeout(()=>{if(!state.player.ticket||state.player.ticket.called)return;state.cityhall.serviceResidentPresent=false;state.cityhall.counterBusy=false;state.cityhall.currentNumber=state.player.ticket.number;state.cityhall.calledNumber=state.player.ticket.number;state.player.ticket.called=true;save();if(state.player.place==="hall"){renderAllHall();toast(`${state.player.ticket.number}，請至服務櫃台。`);openModal("QUEUE","叫到你的號碼",`${state.player.ticket.number}，請到服務櫃台辦理。你目前的位置會保留到你前往櫃台為止。`,[["前往服務櫃台",openServiceDesk],["稍後再去",closeDialogue]])}},9000)}
  function openWaitChoices(){openModal("QUEUE","等待叫號",`你的號碼是 ${state.player.ticket.number}。等待期間可以選擇坐下，或站到公告欄前查看市政資訊。`,[["坐在候位區",chooseWaitingSeat],["查看公告欄",viewBulletin]])}
  function chooseWaitingSeat(){if(state.player.place!=="hall")return;if(state.cityhall.counterBusy&&!state.player.ticket){openModal("QUEUE","候位區","服務櫃台有人使用時，請先抽號碼牌再等待。",[["抽號碼牌",drawTicket]]);return}state.player.hallActivity="waiting-seat";save();closeDialogue();renderAllHall();toast("你在候位區坐下等待。")}
  function viewBulletin(){if(state.player.place!=="hall")return;if(state.player.ticket&&!state.player.ticket.called)state.player.hallActivity="bulletin";save();renderAllHall();openModal("CITY INFO","市政資訊公告欄","公告欄目前張貼：城市公共住宅資訊、港區道路施工通知、近期市集活動。若你正在排隊，叫號狀態仍會持續。",state.player.ticket&&!state.player.ticket.called?[["繼續查看",closeDialogue],["回候位區坐下",chooseWaitingSeat]]:[["關閉",closeDialogue]])}

  function makeResidentId(){const n=Math.floor(100000+Math.random()*900000);return `CH-${String(new Date().getFullYear()).slice(-2)}-${n}`}
  function openRegistration(){
    closeDialogue();$("#regName").value=state.player.name||"";$("#regBirthday").value=state.player.birthday||"";$("#regPronoun").value=state.player.pronoun||"";$("#residentIdPreview").textContent=state.player.residentId||makeResidentId();$("#registrationModal").classList.remove("hidden");
  }
  function closeRegistration(){$("#registrationModal").classList.add("hidden")}
  function submitRegistration(e){
    e.preventDefault();const name=$("#regName").value.trim(),birthday=$("#regBirthday").value,pronoun=$("#regPronoun").value.trim();if(!name||!birthday)return;state.player.name=name;state.player.birthday=birthday;state.player.pronoun=pronoun||null;state.player.residentId=$("#residentIdPreview").textContent;state.player.registered=true;state.onboarding.finished=true;state.player.ticket=null;state.player.hallActivity="counter";state.cityhall.calledNumber=null;state.cityhall.counterBusy=false;state.feed.unshift({time:nowTime(),text:`${name}已完成潮港城居民證件登記。`});save();closeRegistration();renderAllHall();renderCity();updateGuide();openModal("REGISTRATION","居民登記完成",`${name}的潮港城居民資料已建立。居民編號：${state.player.residentId}。`,[["查看房產服務",()=>openModal("PROPERTY","房產服務","下一階段會把承租、購屋與土地建設流程接到這裡。",[["完成",closeDialogue]])],["完成",closeDialogue]])
  }

  function renderAllHall(){if(state.player.place!=="hall")return;const b=building("hall");renderPeople(b);renderActions(b);renderQueuePanel(b);updateGuide();renderClock()}
  function talk(a){openModal("FACE TO FACE",a.known?a.name:"陌生人",a.known?"朝野把筆記闔上一半，抬眼看向你。":"你靠近時，他先看了你一眼，沒有主動把對話接得很長。",[["打招呼",()=>{if(!a.known){a.known=true;state.feed.unshift({time:nowTime(),text:`${playerDisplayName()}在港口咖啡館認識了${a.name}。`});save()}$("#dialogueName").textContent=a.name;$("#dialogueText").textContent="「嗨。」他笑了一下，接著仍把注意力留在自己的筆記上。";renderPeople(building(state.player.place));renderCity()}],["先不打擾",closeDialogue]])}
  function closeDialogue(){$("#dialogue").classList.add("hidden")}
  function showCity(){closeDialogue();setSceneScreen(false);renderCity();window.scrollTo({top:0,behavior:"instant"})}
  function leavePlace(){state.player.hallActivity=null;save();if(history.state?.asterraScreen==="place")history.back();else showCity()}

  function resetFirstFlowPreserveAppearance(){
    const app=clone(state.profile.appearance);const created=state.profile.created;const fresh=clone(world);fresh.profile.created=created;fresh.profile.appearance=app;state=fresh;save();clearTimeout(queueTimer);showCity();renderAll();startOnboardingIfNeeded(true);toast("居民登記流程已重置；外觀保留。")
  }
  function startOnboardingIfNeeded(force=false){
    if(!worldEntered||state.player.registered)return;if((force||!state.onboarding.started)&&state.player.place!=="hall"){setTimeout(()=>{toast("首次抵達潮港城：先前往市政廳完成居民證件登記。");setTimeout(()=>startTravel(building("hall"),{onboarding:true}),1000)},700)}else if(state.player.place==="hall")openPlace(building("hall"),false)
  }

  $("#newProfileBtn").onclick=()=>{
    if(state.profile.created && !confirm("建立新角色會重設目前的遊戲測試進度，但不會影響 GitHub 檔案。要繼續嗎？"))return;
    showCreator(true);$("#saveAvatar").dataset.newCharacter="1";
  };
  $("#continueProfileBtn").onclick=enterWorld;
  $("#editProfileBtn").onclick=()=>{showCreator(false);$("#saveAvatar").dataset.newCharacter="0"};
  $("#backToLogin").onclick=showLogin;
  $("#randomizeAvatar").onclick=()=>{draftAppearance={skin:Math.floor(Math.random()*creator.skins.length),eyes:creator.eyes[Math.floor(Math.random()*creator.eyes.length)].id,brows:creator.brows[Math.floor(Math.random()*creator.brows.length)].id,nose:creator.noses[Math.floor(Math.random()*creator.noses.length)].id,mouth:creator.mouths[Math.floor(Math.random()*creator.mouths.length)].id,hairStyle:creator.hairStyles[Math.floor(Math.random()*creator.hairStyles.length)].id,hairColor:Math.floor(Math.random()*creator.hairColors.length),iris:Math.floor(Math.random()*creator.iris.length),outfit:creator.outfits[Math.floor(Math.random()*creator.outfits.length)].id};renderCreatorControls();renderAvatarPreview()};
  $("#resetAvatar").onclick=()=>{draftAppearance=clone(defaultAppearance);renderCreatorControls();renderAvatarPreview()};
  $("#saveAvatar").onclick=()=>saveAppearanceAndEnter($("#saveAvatar").dataset.newCharacter==="1");
  $("#returnLogin").onclick=()=>{worldEntered=false;showLogin()};
  $("#dialogueClose").onclick=closeDialogue;$("#backToCity").onclick=leavePlace;$("#worldBtn").onclick=()=>toast("世界地圖會在後續階段接回四城。");
  $("#resetDemo").onclick=resetFirstFlowPreserveAppearance;$("#registrationClose").onclick=closeRegistration;$("#registrationForm").addEventListener("submit",submitRegistration);
  history.replaceState({asterraScreen:"city"},"",location.href);window.addEventListener("popstate",()=>{if(worldEntered)showCity()});

  showLogin();
  if(state.player.ticket&&!state.player.ticket.called)scheduleQueueCall();
})();
