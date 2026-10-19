(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const pick = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  const money = (n) => Number(n).toLocaleString("zh-TW");
  const shortTime = () => new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});

  const cities = {
    A:{name:"潮港城",sub:"海港 · 音樂 · 自由業"},
    B:{name:"月樹城",sub:"學術 · 湖泊 · 植物園"},
    C:{name:"曜城",sub:"高樓 · 商業 · 夜生活"},
    D:{name:"霧森城",sub:"森林 · 霧湖 · 慢生活"}
  };

  const places = {
    A:[
      {id:"A-social",name:"潮港社會住宅",kind:"住宅",x:10,y:12,open:true},
      {id:"A-hall",name:"潮港市政廳",kind:"市政廳",x:57,y:11,open:true},
      {id:"A-cafe",name:"港口咖啡館",kind:"咖啡館",x:10,y:49,open:true},
      {id:"A-stage",name:"表演碼頭",kind:"表演場地",x:58,y:48,open:true},
      {id:"A-market",name:"海風市集",kind:"市集",x:34,y:73,open:true}
    ],
    B:[
      {id:"B-social",name:"月樹社會住宅",kind:"住宅",x:10,y:12,open:true},
      {id:"B-hall",name:"月樹市政廳",kind:"市政廳",x:57,y:11,open:true},
      {id:"B-lib",name:"月樹大圖書館",kind:"圖書館",x:10,y:49,open:true},
      {id:"B-garden",name:"植物園",kind:"公園",x:58,y:48,open:true},
      {id:"B-uni",name:"月樹學院",kind:"學院",x:34,y:73,open:true}
    ],
    C:[
      {id:"C-social",name:"曜城社會住宅",kind:"住宅",x:10,y:12,open:true},
      {id:"C-hall",name:"曜城市政廳",kind:"市政廳",x:57,y:11,open:true},
      {id:"C-office",name:"曜城企業區",kind:"辦公區",x:10,y:49,open:true},
      {id:"C-theater",name:"曜城劇院",kind:"劇院",x:58,y:48,open:true},
      {id:"C-square",name:"中央廣場",kind:"廣場",x:34,y:73,open:true}
    ],
    D:[
      {id:"D-social",name:"霧森社會住宅",kind:"住宅",x:10,y:12,open:true},
      {id:"D-hall",name:"霧森市政廳",kind:"市政廳",x:57,y:11,open:true},
      {id:"D-forest",name:"森林邊界",kind:"自然區",x:10,y:49,open:true},
      {id:"D-lake",name:"霧湖",kind:"自然區",x:58,y:48,open:true},
      {id:"D-lab",name:"生態研究站",kind:"研究站",x:34,y:73,open:true}
    ]
  };

  const defaultState = {
    player:{
      name:"夏彌",city:"A",place:"A-social",money:2800,inTransit:false,
      home:{name:"潮港社會住宅 302 室",rent:420,due:"本月 28 日",paid:false,owned:false,
        furniture:{kitchen:false,table:false,sofa:false,console:false}}
    },
    ais:[
      {id:"zhao",name:"朝野",city:"A",place:"A-cafe",known:false,spot:"window-seat",action:"坐在窗邊喝咖啡，偶爾低頭改歌詞。",talkative:"high"},
      {id:"qing",name:"青禾",city:"A",place:"A-cafe",known:false,spot:"counter",action:"站在吧檯和老闆聊天。",talkative:"high"},
      {id:"lin",name:"林舟",city:"B",place:"B-lib",known:false,spot:"reading",action:"正在翻閱資料。",talkative:"medium"},
      {id:"jun",name:"君煦",city:"D",place:"D-forest",known:false,spot:"edge",action:"靠在樹邊，安靜看著遠處。",talkative:"low"}
    ],
    selected:null,
    logs:{},
    worldFeed:[
      {t:"現在",m:"夏彌住進潮港社會住宅。這個世界目前沒有熟人。"},
      {t:"現在",m:"潮港城今天海風偏強，表演碼頭仍有零星活動。"}
    ],
    cityFeed:{A:[{t:"現在",m:"港口咖啡館目前正常營業。"}],B:[],C:[],D:[]}
  };

  let state = load();
  let currentCity = state.player.city;

  function load(){
    try{
      const raw = localStorage.getItem("asterra-v2-state");
      if(!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return parsed?.player ? parsed : structuredClone(defaultState);
    }catch{return structuredClone(defaultState)}
  }
  function save(){try{localStorage.setItem("asterra-v2-state",JSON.stringify(state))}catch{}}
  function allPlaces(){return Object.values(places).flat()}
  function placeById(id){return allPlaces().find(p=>p.id===id)}
  function aiById(id){return state.ais.find(a=>a.id===id)}
  function samePlace(ai){return !state.player.inTransit && ai.city===state.player.city && ai.place===state.player.place}
  function displayName(ai){return ai.known?ai.name:"陌生人"}
  function addWorld(m){state.worldFeed.unshift({t:shortTime(),m});state.worldFeed=state.worldFeed.slice(0,30);save()}
  function addCity(city,m){state.cityFeed[city].unshift({t:shortTime(),m});state.cityFeed[city]=state.cityFeed[city].slice(0,20);save()}
  function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2200)}

  function switchScreen(name){
    if(name!=="place"){
      document.body.classList.remove("art-immersive");
      $("#screen-place")?.classList.remove("art-mode");
    }
    $$(".screen").forEach(s=>s.classList.toggle("active",s.id==="screen-"+name));
    $$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.screen===name));
    if(name==="world") renderWorld();
    if(name==="city") renderCity();
    if(name==="place") renderPlace();
    if(name==="house") renderHouse();
    if(name==="phone") renderPhone();
  }

  function startTravel({title,meta,duration,onDone}){
    if(state.player.inTransit) return;
    state.player.inTransit=true;
    const strip=$("#travelStrip");
    strip.classList.remove("hidden");
    $("#travelTitle").textContent=title;
    $("#travelMeta").textContent=meta;
    $("#travelProgress").style.width="0%";
    const started=Date.now();
    const timer=setInterval(()=>{
      const elapsed=Date.now()-started;
      const pct=Math.min(100,elapsed/duration*100);
      $("#travelProgress").style.width=pct+"%";
      $("#travelRemain").textContent=Math.max(0,Math.ceil((duration-elapsed)/1000))+" 秒";
      if(elapsed>=duration){
        clearInterval(timer);
        state.player.inTransit=false;
        strip.classList.add("hidden");
        $("#travelProgress").style.width="0%";
        onDone();
        save();
        renderAll();
      }
    },120)
  }

  function travelCity(city){
    if(city===state.player.city){
      currentCity=city;
      switchScreen("city");
      return;
    }
    startTravel({
      title:"前往 "+cities[city].name,
      meta:cities[state.player.city].name+" → "+cities[city].name+" · 原型壓縮時間",
      duration:9000,
      onDone:()=>{
        state.player.city=city;
        currentCity=city;
        state.player.place=city+"-social";
        addWorld("夏彌抵達"+cities[city].name+"。");
        switchScreen("city");
      }
    })
  }

  function travelPlace(place){
    if(!place?.open || state.player.inTransit) return;
    if(place.id===state.player.place){
      switchScreen("place");
      return;
    }
    startTravel({
      title:"前往 "+place.name,
      meta:"市內移動 · 原型以 4 秒示範",
      duration:4000,
      onDone:()=>{
        state.player.place=place.id;
        addWorld("夏彌抵達"+place.name+"。");
        switchScreen("place");
      }
    })
  }

  function renderWorld(){
    const p=placeById(state.player.place);
    $("#worldCurrent").textContent=state.player.inTransit?"移動中":(p?.name||cities[state.player.city].name);
    $("#worldCurrentSub").textContent=cities[state.player.city].name+" · 存款 "+money(state.player.money)+" 幣";
    $("#worldFeed").innerHTML=state.worldFeed.map(x=>`<div class="feed-item"><small>${x.t}</small><div>${x.m}</div></div>`).join("");
  }

  function renderCity(){
    const city=currentCity;
    $("#cityTitle").textContent=cities[city].name;
    $("#citySubtitle").textContent=cities[city].sub+"。點一棟建築就開始移動，到達後會直接進入場景。";
    $("#buildingLayer").innerHTML="";
    $("#cityPeopleLayer").innerHTML="";

    places[city].forEach(p=>{
      const btn=document.createElement("button");
      btn.className="iso-building"+(p.id===state.player.place&&state.player.city===city?" current":"")+(p.open?"":" closed");
      btn.dataset.kind=p.kind;
      btn.style.left=p.x+"%";
      btn.style.top=p.y+"%";
      btn.disabled=!p.open;
      btn.innerHTML=`<span class="building-top"></span><span class="building-name"><b>${p.name}</b><small>${p.open?p.kind:"目前關閉"}</small></span>`;
      btn.onclick=()=>state.player.city===city?travelPlace(p):travelCity(city);
      $("#buildingLayer").appendChild(btn);
    });

    if(state.player.city===city&&!state.player.inTransit){
      const p=placeById(state.player.place);
      if(p){
        const me=document.createElement("div");
        me.className="city-person player";
        me.style.left=`calc(${p.x}% + 85px)`;
        me.style.top=`calc(${p.y}% + 55px)`;
        me.innerHTML=`<i class="head"></i><i class="body"></i><span>夏彌</span>`;
        $("#cityPeopleLayer").appendChild(me);
      }
    }

    state.ais.filter(a=>a.city===city && (a.known||samePlace(a))).forEach(ai=>{
      const p=placeById(ai.place); if(!p)return;
      const person=document.createElement("button");
      person.className="city-person";
      person.style.left=`calc(${p.x}% + 115px)`;
      person.style.top=`calc(${p.y}% + 54px)`;
      person.innerHTML=`<i class="head"></i><i class="body"></i><span>${displayName(ai)}</span>`;
      person.onclick=()=>{state.selected=ai.id;if(samePlace(ai))switchScreen("place")}
      $("#cityPeopleLayer").appendChild(person);
    });

    const current=state.player.city===city?placeById(state.player.place):null;
    $("#cityCurrent").textContent=current?.name||"目前不在這座城市";
    $("#cityCurrentSub").textContent=current?"你可以進入場景查看現在裡面發生什麼。":"";
    const feed=state.cityFeed[city].length?state.cityFeed[city]:[{t:"目前",m:"暫時沒有新的公開消息。"}];
    $("#cityFeed").innerHTML=feed.map(x=>`<div class="feed-item"><small>${x.t}</small><div>${x.m}</div></div>`).join("");
  }

  function sceneSpec(place){
    if(place.id==="A-cafe") return {
      subtitle:"港口旁的小咖啡館。靠窗可以看到海。",
      furniture:[
        ["window",8,12],["counter",60,26],["table",18,47],["table",39,57],["chair",16,59],["chair",29,55],["chair",39,69],["chair",50,66]
      ],
      actions:["找位置坐","查看菜單","點一杯飲料","看看窗外","離開地點"]
    };
    if(place.kind==="市政廳") return {
      subtitle:"辦理承租、購屋、新建與城市房產相關業務。",
      furniture:[["desk",55,29],["bench",18,50],["bench",18,65]],
      actions:["抽號碼牌","查看承租資訊","查看出售房屋","詢問新建申請","離開地點"]
    };
    if(place.kind==="住宅") return {
      subtitle:"社會住宅公共區。私人房間不能隨意進入。",
      furniture:[["sofa",20,46],["bench",58,55]],
      actions:["回自己的房間","坐一下","查看公告","離開地點"]
    };
    if(place.kind==="表演場地") return {
      subtitle:"靠海的表演區，偶爾有人排練或臨時演出。",
      furniture:[["bench",14,55],["bench",55,57]],
      actions:["看表演","在碼頭散步","找地方坐","離開地點"]
    };
    return {
      subtitle:place.kind+"場景。",
      furniture:[["bench",22,52],["bench",56,53]],
      actions:["四處看看","找地方坐","離開地點"]
    };
  }

  function scenePersonLayout(ai){
    if(ai.spot==="window-seat") return {x:17,y:41,pose:"sitting"};
    if(ai.spot==="counter") return {x:67,y:36,pose:"standing"};
    if(ai.spot==="reading") return {x:38,y:48,pose:"standing"};
    if(ai.spot==="edge") return {x:54,y:44,pose:"standing"};
    return {x:45+Math.random()*12,y:45+Math.random()*12,pose:"standing"}
  }

  function introduce(ai){
    if(ai.known)return;
    ai.known=true;
    addWorld("夏彌認識了 "+ai.name+"。");
  }

  const artActors = {
    reception:{
      name:"接待員",
      text:"她正在處理市政服務。你靠近後，她抬頭確認你需要辦理什麼。",
      actions:[
        ["詢問房屋承租", "市政廳可以查詢目前可承租的住宅、店面與工作室。正式版會連到實際房源。"],
        ["詢問購屋", "她向你說明購屋需要查看出售物件、價格與你的資金狀況。"],
        ["詢問新建", "她說新建要先選土地與用途，再進入申請、施工與完工流程。"]
      ]
    },
    resident:{
      name:"等候的居民",
      text:"對方坐在等候區看著手上的資料。你可以直接從場景點他開始當面互動。",
      actions:[
        ["打招呼", "對方抬起頭：「嗨，你也是來辦事情的嗎？」"],
        ["聊聊天", "你們壓低聲音聊了幾句。這裡目前還是本地模擬台詞，之後可換成模型。"],
        ["詢問房產資訊", "他說自己正在看租屋資料，但不一定知道所有最新房源。"]
      ]
    },
    guard:{
      name:"守衛",
      text:"守衛正在留意大廳出入口與人流。",
      actions:[
        ["打招呼", "守衛禮貌地向你點頭。"],
        ["詢問方向", "他告訴你房產相關窗口在大廳右側。"]
      ]
    },
    counter:{
      name:"市政櫃台",
      text:"這裡可以辦理戶籍、證件與房產相關市政服務。",
      actions:[
        ["查看房產業務", "承租、購屋、新建等業務會在這裡進入實際流程。"],
        ["抽號碼牌", "你抽了一張號碼牌。原型暫時不模擬完整排隊時間。"]
      ]
    },
    board:{
      name:"公告欄",
      text:"公告欄上會顯示城市公開資訊、建案、市政公告與部分房屋資訊。",
      actions:[
        ["查看公告", "你快速瀏覽了今天的市政公告。"],
        ["查看房屋資訊", "正式版會從世界狀態即時產生可租、可買與施工中的物件。"]
      ]
    },
    housing:{
      name:"房產資訊",
      text:"這裡會整理目前公開的租屋、售屋、空地與建案資訊。",
      actions:[
        ["承租住宅", "下一步會接成實際房源清單，而不是彈出純文字視窗。"],
        ["購買房屋", "下一步會讓你從真正在城市裡的物件挑選。"],
        ["申請新建", "下一步會串接土地、用途、成本與施工時間。"]
      ]
    }
  };

  function showArtInteraction(target){
    if(target==="exit"){
      hideArtDialogue();
      document.body.classList.remove("art-immersive");
      $("#screen-place")?.classList.remove("art-mode");
      switchScreen("city");
      return;
    }
    const info=artActors[target];
    if(!info)return;
    $("#artDialogueName").textContent=info.name;
    $("#artDialogueText").textContent=info.text;
    $("#artDialogueActions").innerHTML=info.actions.map(([label])=>`<button data-art-action="${target}" data-art-label="${label}">${label}</button>`).join("");
    $("#artDialogue").classList.remove("hidden");
    $$("[data-art-action]").forEach(btn=>{
      btn.onclick=()=>{
        const actor=artActors[btn.dataset.artAction];
        const pair=actor.actions.find(x=>x[0]===btn.dataset.artLabel);
        if(pair) $("#artDialogueText").textContent=pair[1];
      };
    });
  }

  function hideArtDialogue(){
    $("#artDialogue")?.classList.add("hidden");
  }

  function renderCityHallArtwork(){
    document.body.classList.add("art-immersive");
    $("#screen-place").classList.add("art-mode");
    $("#artSceneWrap").classList.remove("hidden");
    $("#normalPlaceWrap").classList.add("hidden");
    hideArtDialogue();
  }

  function renderPlace(){
    const place=placeById(state.player.place);
    if(!place)return;

    if(place.id==="A-hall"){
      renderCityHallArtwork();
      return;
    }

    document.body.classList.remove("art-immersive");
    $("#screen-place").classList.remove("art-mode");
    $("#artSceneWrap").classList.add("hidden");
    $("#normalPlaceWrap").classList.remove("hidden");

    const spec=sceneSpec(place);
    $("#placeTitle").textContent=place.name;
    $("#placeSubtitle").textContent=spec.subtitle;
    $("#sceneFurniture").innerHTML="";
    $("#scenePeople").innerHTML="";

    spec.furniture.forEach(([type,x,y])=>{
      const el=document.createElement("div");
      el.className="scene-object "+type;
      el.style.left=x+"%"; el.style.top=y+"%";
      $("#sceneFurniture").appendChild(el);
    });

    const ownerNeeded=place.id==="A-cafe";
    if(ownerNeeded){
      const owner=document.createElement("div");
      owner.className="scene-person owner";
      owner.style.left="78%"; owner.style.top="31%";
      owner.innerHTML=`<i class="shadow"></i><i class="head"></i><i class="body"></i><span class="name-tag">店主</span>`;
      $("#scenePeople").appendChild(owner);
    }

    const me=document.createElement("div");
    me.className="scene-person player";
    me.style.left="8%"; me.style.top="72%";
    me.innerHTML=`<i class="shadow"></i><i class="head"></i><i class="body"></i><span class="name-tag">夏彌</span>`;
    $("#scenePeople").appendChild(me);

    const here=state.ais.filter(samePlace);
    here.forEach(ai=>{
      const pos=scenePersonLayout(ai);
      const btn=document.createElement("button");
      btn.className="scene-person"+(state.selected===ai.id?" selected":"");
      btn.style.left=pos.x+"%";btn.style.top=pos.y+"%";
      btn.innerHTML=`<i class="shadow"></i><i class="head"></i><i class="body"></i><span class="name-tag">${displayName(ai)}</span>`;
      btn.onclick=()=>{state.selected=ai.id;renderPlace()};
      $("#scenePeople").appendChild(btn);

      if(Math.random()<.48){
        const bubble=document.createElement("div");
        bubble.className="person-bubble";
        bubble.style.left=(pos.x+5)+"%"; bubble.style.top=(pos.y-7)+"%";
        bubble.textContent=ai.action;
        $("#scenePeople").appendChild(bubble);
      }
    });

    const selected=aiById(state.selected);
    if(selected&&samePlace(selected)){
      renderPersonActions(selected);
    }else{
      $("#sceneActionTitle").textContent="場景操作";
      $("#sceneActions").innerHTML=spec.actions.map(a=>`<button class="action-btn" data-scene-action="${a}">${a}</button>`).join("");
      $$("[data-scene-action]").forEach(b=>b.onclick=()=>sceneAction(b.dataset.sceneAction,place));
    }

    $("#peopleHere").innerHTML=here.length?here.map(ai=>`
      <button class="person-row" data-person="${ai.id}">
        <b>${displayName(ai)}</b><small>${ai.action}</small>
      </button>`).join(""):`<p class="observed">現在沒有其他居民在你眼前。</p>`;
    $$("[data-person]").forEach(b=>b.onclick=()=>{state.selected=b.dataset.person;renderPlace()});

    const observations=[];
    if(place.id==="A-cafe") observations.push("吧檯後方有人工作。","窗邊有幾張能看海的位置。");
    here.forEach(ai=>observations.push(displayName(ai)+"： "+ai.action));
    $("#observed").innerHTML=observations.length?observations.map(x=>`<div>• ${x}</div>`).join(""):"目前沒有特別值得注意的事。";
  }

  function renderPersonActions(ai){
    $("#sceneActionTitle").textContent=displayName(ai);
    const actions=[
      ["走過去","approach"],
      ["打招呼","greet"],
      ["一起坐","sit"],
      ["邀請一起喝東西","drink"],
      ["牽手","hand"],
      ["擁抱","hug"],
      ["親吻","kiss"],
      ["取消選取","cancel"]
    ];
    $("#sceneActions").innerHTML=actions.map(([label,key])=>`<button class="action-btn" data-person-action="${key}">${label}</button>`).join("");
    $$("[data-person-action]").forEach(b=>b.onclick=()=>personAction(ai,b.dataset.personAction));
  }

  function personAction(ai,key){
    if(key==="cancel"){state.selected=null;renderPlace();return}
    const logKey=ai.id;
    state.logs[logKey] ||= [];
    if(key==="greet"){
      introduce(ai);
      const reply=ai.id==="jun"?"……你好。":pick(["嗨。","你好。","嗯？你也在這裡啊。","第一次見？"]);
      state.logs[logKey].push({t:shortTime(),m:"夏彌向"+ai.name+"打招呼。"+ai.name+"回應：「"+reply+"」"});
      ai.action="剛和夏彌說過話。";
      toast(ai.name+"回應了你");
    }else if(["hand","hug","kiss"].includes(key)){
      const label={hand:"牽手",hug:"擁抱",kiss:"親吻"}[key];
      let chance=ai.known?.55:.05;
      if(ai.id==="jun") chance*=.6;
      if(key==="kiss")chance*=.45;
      const r=Math.random();
      const result=r<chance?"接受":r<chance+.18?"猶豫":"拒絕";
      state.logs[logKey].push({t:shortTime(),m:ai.name+"對「"+label+"」的反應："+result+"。"});
      toast(ai.name+"："+result);
    }else{
      toast("你和"+displayName(ai)+"進行了「"+({approach:"走過去",sit:"一起坐",drink:"一起喝東西"}[key])+"」。");
    }
    save();renderPlace()
  }

  function sceneAction(action,place){
    if(action==="離開地點"){switchScreen("city");return}
    if(action==="回自己的房間"){switchScreen("house");return}
    if(action==="查看承租資訊"||action==="查看出售房屋"||action==="詢問新建申請"){
      toast("市政廳功能會在下一版接成完整流程。");
      return;
    }
    toast("夏彌："+action);
  }

  function renderHouse(){
    const h=state.player.home;
    $("#houseTitle").textContent=h.name;
    $("#rentBox").innerHTML=h.owned?"這是自有住宅。":`本期房租 ${money(h.rent)} 幣<br>到期：${h.due}<br>${h.paid?"本期已繳":"本期尚未繳"}`;
    $("#payRent").style.display=h.owned?"none":"block";
    $("#homeDynamic").innerHTML="";
    const dyn=$("#homeDynamic");
    const items=[];
    if(h.furniture.kitchen)items.push(["🍳",59,44]);
    if(h.furniture.table)items.push(["🍽️",39,43]);
    if(h.furniture.sofa)items.push(["🛋️",32,59]);
    if(h.furniture.console)items.push(["🎮",57,62]);
    items.forEach(([icon,x,y])=>{
      const el=document.createElement("div");el.className="home-dyn";el.textContent=icon;el.style.left=x+"%";el.style.top=y+"%";dyn.appendChild(el)
    });

    const shop=[
      ["完整廚房","kitchen",900],["餐桌","table",350],["沙發","sofa",500],["遊戲主機","console",650]
    ];
    $("#furnitureShop").innerHTML=shop.map(([name,key,price])=>`<button class="action-btn" data-buy="${key}" data-price="${price}" ${h.furniture[key]?"disabled":""}>${h.furniture[key]?"已擁有 · ":""}${name} · ${price} 幣</button>`).join("");
    $$("[data-buy]").forEach(b=>b.onclick=()=>buyFurniture(b.dataset.buy,Number(b.dataset.price)));

    const acts=["休息","洗澡"];
    if(h.furniture.kitchen)acts.push("做飯","烤餅乾");
    if(h.furniture.table)acts.push("邀請朋友吃飯");
    if(h.furniture.sofa)acts.push("一起看電影");
    if(h.furniture.console)acts.push("一起玩遊戲");
    $("#homeActivities").innerHTML=acts.map(a=>`<button class="action-btn" data-home-act="${a}">${a}</button>`).join("");
    $$("[data-home-act]").forEach(b=>b.onclick=()=>toast("家中活動："+b.dataset.homeAct));
  }

  function buyFurniture(key,price){
    if(state.player.money<price){toast("存款不足");return}
    if(state.player.home.furniture[key])return;
    state.player.money-=price;
    state.player.home.furniture[key]=true;
    addWorld("夏彌替住處添購了新家具。");
    save();renderAll();toast("家具已送達")
  }

  function payRent(){
    const h=state.player.home;
    if(h.paid||h.owned)return;
    if(state.player.money<h.rent){toast("存款不足");return}
    state.player.money-=h.rent;h.paid=true;addWorld("夏彌繳交了本期房租。");save();renderAll();toast("房租已繳")
  }

  function renderPhone(){
    const known=state.ais.filter(a=>a.known).length;
    $("#phoneContent").innerHTML=`
      <div class="phone-grid">
        <div class="phone-card"><b>訊息</b><small>面對面聊天和手機訊息是兩回事。</small></div>
        <div class="phone-card"><b>聯絡人</b><small>目前認識 ${known} 位居民。</small></div>
        <div class="phone-card"><b>城市新聞</b><small>查看你有可能知道的公開事件。</small></div>
        <div class="phone-card"><b>工作中心</b><small>公開職缺、委託與工作機會。</small></div>
        <div class="phone-card"><b>房屋</b><small>${state.player.home.name}</small></div>
        <div class="phone-card"><b>錢包</b><small>${money(state.player.money)} 幣</small></div>
      </div>`;
  }

  function simulateAmbient(){
    if(state.player.inTransit)return;
    const here=state.ais.filter(samePlace);
    here.forEach(ai=>{
      if(Math.random()<.22){
        if(ai.place==="A-cafe"){
          ai.action=pick([
            "坐在椅子上慢慢喝飲料。",
            "站在吧檯附近和店主聊了幾句。",
            "低頭看手機，沒有說話。",
            "望向窗外，像是在等人。",
            "拿著飲料換到另一張桌子。"
          ]);
          ai.spot=pick(["window-seat","counter","window-seat"]);
        }
      }
    });
    if($("#screen-place").classList.contains("active"))renderPlace();
    save()
  }

  function renderClock(){
    const d=new Date();
    $("#clock").textContent=d.toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
    $("#date").textContent=d.toLocaleDateString("zh-TW",{month:"long",day:"numeric",weekday:"short"});
    $("#phoneTime").textContent=shortTime();
    $("#moneyText").textContent=money(state.player.money)
  }

  function renderAll(){
    renderClock();renderWorld();renderCity();renderPlace();renderHouse();renderPhone()
  }

  $$(".tab").forEach(b=>b.onclick=()=>switchScreen(b.dataset.screen));
  $$(".city-diorama").forEach(b=>b.onclick=()=>travelCity(b.dataset.city));
  $("#payRent").onclick=payRent;

  $$("[data-art-target]").forEach(btn=>{
    btn.onclick=()=>showArtInteraction(btn.dataset.artTarget);
  });
  $("#artDialogueClose").onclick=hideArtDialogue;
  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape" && document.body.classList.contains("art-immersive")){
      if(!$("#artDialogue").classList.contains("hidden")) hideArtDialogue();
      else showArtInteraction("exit");
    }
  });

  renderAll();
  setInterval(renderClock,1000);
  setInterval(simulateAmbient,9000);
})();