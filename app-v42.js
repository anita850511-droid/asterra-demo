(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const nowTime = () => new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
  const clone = o => JSON.parse(JSON.stringify(o));

  const world = {
    city:"潮港城",
    player:{name:"夏彌",money:12840,place:"social-west",inTransit:false,registered:false,ticket:null,hallActivity:null},
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
  let queueTimer = null;
  function load(){
    try{
      const raw=localStorage.getItem("asterra-v42-state");
      return raw?mergeState(clone(world),JSON.parse(raw)):clone(world);
    }catch{return clone(world)}
  }
  function mergeState(base,saved){
    return {...base,...saved,player:{...base.player,...(saved.player||{})},onboarding:{...base.onboarding,...(saved.onboarding||{})},cityhall:{...base.cityhall,...(saved.cityhall||{})},buildings:{...base.buildings,...(saved.buildings||{})},actors:{...base.actors,...(saved.actors||{})}};
  }
  function save(){try{localStorage.setItem("asterra-v42-state",JSON.stringify(state))}catch{}}
  function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2300)}
  function building(id){return state.buildings[id]}
  function peopleAt(place){return Object.values(state.actors).filter(a=>a.place===place)}

  function renderClock(){$("#clock").textContent=nowTime();$("#money").textContent=Number(state.player.money).toLocaleString("zh-TW")}
  setInterval(renderClock,1000);renderClock();

  function updateGuide(){
    const strip=$("#guideStrip"),text=$("#guideText");
    if(state.player.registered){strip.classList.add("hidden");return}
    strip.classList.remove("hidden");
    if(state.player.place!=="hall") text.textContent="新居民需要先到潮港市政廳完成證件登記。";
    else if(!state.player.ticket && state.cityhall.counterBusy) text.textContent="服務櫃台目前有人使用，請先抽號碼牌。";
    else if(state.player.ticket && !state.player.ticket.called) text.textContent=`你的號碼是 ${state.player.ticket.number}，等待叫號時可坐下或查看市政資訊公告欄。`;
    else if(state.player.ticket?.called) text.textContent=`叫到 ${state.player.ticket.number}，請到服務櫃台。`;
    else text.textContent="請到服務櫃台完成居民證件登記。";
  }

  function renderCity(){
    $("#buildingBubbles").innerHTML="";
    Object.values(state.buildings).forEach(b=>{
      if(b.status==="demolished") return;
      const btn=document.createElement("button");
      btn.className=`building-bubble ${b.status} ${state.player.place===b.id?"current":""} ${(!state.player.registered&&b.id==="hall")?"guided":""}`;
      btn.style.left=b.x+"%";btn.style.top=b.y+"%";
      btn.innerHTML=`<span class="ico">${b.icon}</span><span class="name">${b.name}</span>`;
      btn.title=b.status==="closed"?"目前停業":b.status==="construction"?"施工中":"前往";
      btn.onclick=()=>goToBuilding(b);$("#buildingBubbles").appendChild(btn);
    });
    const cur=building(state.player.place);
    $("#currentPlace").textContent=cur?.name || "潮港城";
    $("#currentState").textContent=state.player.registered?"點建築名稱氣泡即可前往。":"首次抵達：請先完成居民證件登記。";
    $("#feed").innerHTML=state.feed.slice(0,6).map(x=>`<div class="feed-item"><time>${x.time}</time>${x.text}</div>`).join("");
    updateGuide();
  }

  function goToBuilding(b){
    if(state.player.inTransit)return;
    if(b.status==="closed"){toast(`${b.name}目前停業。`);return}
    if(b.status==="construction"){toast(`${b.name}仍在施工。`);return}
    if(state.player.place===b.id){openPlace(b);return}
    startTravel(b);
  }

  function startTravel(b,{onboarding=false}={}){
    state.player.inTransit=true;state.onboarding.started ||= onboarding;save();
    const strip=$("#travelStrip");strip.classList.remove("hidden");
    $("#travelTitle").textContent=onboarding?`居民登記引導 · 前往 ${b.name}`:`前往 ${b.name}`;
    $("#travelMeta").textContent="潮港城市內移動 · 原型壓縮時間";
    const duration=3600,start=performance.now();
    const tick=t=>{
      const p=Math.min(1,(t-start)/duration);$("#travelBar").style.width=(p*100)+"%";$("#travelRemain").textContent=Math.max(0,Math.ceil((duration-(t-start))/1000))+" 秒";
      if(p<1){requestAnimationFrame(tick);return}
      state.player.inTransit=false;state.player.place=b.id;save();strip.classList.add("hidden");$("#travelBar").style.width="0";openPlace(b);renderCity();
      if(onboarding) setTimeout(()=>toast("請先查看服務櫃台；若櫃台有人使用，就到取號機抽號碼牌。"),350);
    };requestAnimationFrame(tick);
  }

  const sceneConfig={
    cityhall:{
      image:"assets/cityhall-scene-v41.png",legacyMask:false,
      objects:[
        {id:"desk",name:"服務櫃台",x:77,y:47},
        {id:"ticket",name:"取號機",x:66,y:56},
        {id:"board",name:"市政資訊公告欄",x:38.2,y:40.5},
        {id:"waiting",name:"候位區",x:46,y:66}
      ]
    },
    cafe:{image:"assets/cafe-scene.png",legacyMask:true,objects:[{id:"bar",name:"吧檯",x:22,y:48},{id:"seat",name:"靠窗座位",x:61,y:47},{id:"exit",name:"出入口",x:82,y:62}]}
  };

  function setSceneScreen(on){$("#cityScreen").classList.toggle("active",!on);$("#placeScreen").classList.toggle("active",on)}

  function openPlace(b,pushHistory=true){
    const cfg=sceneConfig[b.scene];if(!cfg){toast(`${b.name}的室內場景之後建立。`);return}
    setSceneScreen(true);$("#sceneImage").src=cfg.image;$("#sceneMask").classList.toggle("hidden",!cfg.legacyMask);$("#sceneTitle").textContent=b.name;$("#placeHeading").textContent=b.name;$("#placeText").textContent=b.description;
    renderObjects(cfg,b);renderPeople(b);renderActions(b);renderQueuePanel(b);
    if(pushHistory && history.state?.asterraScreen!=="place") history.pushState({asterraScreen:"place",place:b.id},"",location.href);
    updateGuide();window.scrollTo({top:0,behavior:"instant"});
  }

  function renderObjects(cfg,b){
    const layer=$("#objectLayer");layer.innerHTML="";
    cfg.objects.forEach(o=>{
      const btn=document.createElement("button");btn.className=`object-chip object-${o.id}`;btn.style.left=o.x+"%";btn.style.top=o.y+"%";btn.textContent=o.name;
      btn.onclick=()=>handleObject(o.id,b);layer.appendChild(btn);
    });
  }

  function handleObject(id,b){
    if(b.id!=="hall"){toast(`${event?.currentTarget?.textContent||"這個位置"}：之後接上對應互動。`);return}
    if(id==="desk") openServiceDesk();
    if(id==="ticket") drawTicket();
    if(id==="board") viewBulletin();
    if(id==="waiting") chooseWaitingSeat();
  }

  function hallPeople(){
    const list=[];
    if(state.cityhall.serviceResidentPresent){list.push({id:"resident017",name:"居民",activity:"正在服務櫃台辦理業務。",kind:"npc",x:75,y:47,glyph:"居"})}
    if(state.player.place==="hall" && state.player.hallActivity){
      const slots={"waiting-seat":{x:46,y:67,activity:"坐在候位區等待叫號。"},"bulletin":{x:38,y:48,activity:"站在市政資訊公告欄前查看公告。"},"counter":{x:70,y:52,activity:"正在服務櫃台辦理業務。"}};
      const s=slots[state.player.hallActivity];if(s) list.push({id:"player",name:state.player.name,activity:s.activity,kind:"player",x:s.x,y:s.y,glyph:"夏"});
    }
    return list;
  }

  function renderPeople(b){
    const layer=$("#peopleLayer"),list=$("#peopleList");layer.innerHTML="";list.innerHTML="";
    const people=b.id==="hall"?hallPeople():peopleAt(b.id);
    if(!people.length){list.innerHTML='<div class="empty">目前沒有其他人在這個場景位置。</div>';return}
    people.forEach(a=>{
      const btn=document.createElement("button");btn.className=`person-anchor ${a.kind||""}`;btn.style.left=a.x+"%";btn.style.top=a.y+"%";
      if(a.portrait) btn.innerHTML=`<span class="person-card"><img src="${a.portrait}" alt="${a.name}"></span><span class="person-bubble">${a.known?a.name:"陌生人"}</span>`;
      else btn.innerHTML=`<span class="person-token">${a.glyph||"人"}</span><span class="person-bubble">${a.name}</span>`;
      btn.onclick=()=>a.id==="player"?toast(`你目前：${a.activity}`):a.id==="zhaoye"?talk(a):toast(`${a.name}${a.activity}`);layer.appendChild(btn);
      const row=document.createElement("button");row.className="person-row";row.innerHTML=`<b>${a.id==="zhaoye"?(a.known?a.name:"陌生人"):a.name}</b><small>${a.activity}</small>`;row.onclick=btn.onclick;list.appendChild(row);
    });
  }

  function renderQueuePanel(b){
    const panel=$("#queuePanel");if(b.id!=="hall"){panel.classList.add("hidden");return}
    panel.classList.remove("hidden");
    const parts=[`目前叫號：<b>${state.cityhall.currentNumber}</b>`];
    if(state.player.ticket) parts.push(`你的號碼：<b>${state.player.ticket.number}</b>${state.player.ticket.called?' · <em>已叫號</em>':''}`);
    else parts.push("你尚未取號");
    $("#queueStatus").innerHTML=parts.join("<br>");
  }

  function renderActions(b){
    const list=$("#actionList");list.innerHTML="";
    const labels=b.id==="hall"?hallActionLabels():["找位置坐","查看菜單","點一杯飲料","看看窗外","離開咖啡館"];
    labels.forEach(({label,fn})=>{const btn=document.createElement("button");btn.className="action-btn";btn.textContent=label;btn.onclick=fn;list.appendChild(btn)});
  }

  function hallActionLabels(){
    const out=[{label:"服務櫃台",fn:openServiceDesk}];
    if(state.cityhall.counterBusy && !state.player.ticket) out.push({label:"抽號碼牌",fn:drawTicket});
    if(state.player.ticket && !state.player.ticket.called){
      out.push({label:"坐在候位區等待",fn:chooseWaitingSeat});
      out.push({label:"查看市政資訊公告欄",fn:viewBulletin});
    } else out.push({label:"查看市政資訊公告欄",fn:viewBulletin});
    out.push({label:"離開市政廳",fn:leavePlace});return out;
  }

  function openModal(kicker,title,text,actions=[]){
    $("#dialogueKicker").textContent=kicker;$("#dialogueName").textContent=title;$("#dialogueText").textContent=text;const acts=$("#dialogueActions");acts.innerHTML="";
    actions.forEach(([label,fn])=>{const b=document.createElement("button");b.textContent=label;b.onclick=fn;acts.appendChild(b)});$("#dialogue").classList.remove("hidden");
  }

  function openServiceDesk(){
    if(state.player.place!=="hall") return;
    if(state.player.ticket?.called){
      state.player.hallActivity="counter";save();renderPeople(building("hall"));
      openServiceMenu();return;
    }
    if(state.cityhall.counterBusy){
      openModal("SERVICE","服務櫃台","目前有居民正在使用服務櫃台。請先抽號碼牌，等待叫號後再前往櫃台。",[["抽號碼牌",drawTicket],["先查看公告欄",viewBulletin]]);return;
    }
    state.player.hallActivity="counter";save();renderPeople(building("hall"));openServiceMenu();
  }

  function openServiceMenu(){
    const actions=[];
    if(!state.player.registered) actions.push(["居民證件登記",completeRegistration]);
    actions.push(["房產服務",()=>openModal("PROPERTY","房產服務","可在這裡查詢承租、購買、土地與住宅相關業務。此版本先完成入口層級。",[["返回櫃台",openServiceMenu]])]);
    actions.push(["土地／建設業務",()=>openModal("CITY HALL","土地／建設業務","之後會接上購地、新建、改建與許可流程。",[["返回櫃台",openServiceMenu]])]);
    openModal("SERVICE","服務櫃台",state.player.registered?"請選擇要辦理的業務。":"你尚未完成潮港城居民證件登記，首次辦理請先完成登記。",actions);
  }

  function drawTicket(){
    if(state.player.place!=="hall")return;
    if(state.player.ticket){openWaitChoices();return}
    if(!state.cityhall.counterBusy){toast("服務櫃台目前無人使用，可以直接辦理。 ");openServiceDesk();return}
    const n=`A${String(state.cityhall.nextNumber).padStart(3,"0")}`;state.cityhall.nextNumber++;state.player.ticket={number:n,called:false};state.player.hallActivity=null;save();renderAllHall();
    openModal("QUEUE","已取得號碼牌",`你的號碼是 ${n}。目前叫號 ${state.cityhall.currentNumber}。等待期間可以坐在候位區，或到市政資訊公告欄查看公告。`,[["坐下等待",chooseWaitingSeat],["查看公告欄",viewBulletin]]);
    scheduleQueueCall();
  }

  function scheduleQueueCall(){
    clearTimeout(queueTimer);if(!state.player.ticket||state.player.ticket.called)return;
    queueTimer=setTimeout(()=>{
      if(!state.player.ticket||state.player.ticket.called)return;
      state.cityhall.serviceResidentPresent=false;state.cityhall.counterBusy=false;state.cityhall.currentNumber=state.player.ticket.number;state.cityhall.calledNumber=state.player.ticket.number;state.player.ticket.called=true;save();
      if(state.player.place==="hall"){renderAllHall();toast(`${state.player.ticket.number}，請至服務櫃台。`);openModal("QUEUE","叫到你的號碼",`${state.player.ticket.number}，請到服務櫃台辦理。你目前的位置會保留到你前往櫃台為止。`,[["前往服務櫃台",openServiceDesk],["稍後再去",closeDialogue]])}
    },9000);
  }

  function openWaitChoices(){
    openModal("QUEUE","等待叫號",`你的號碼是 ${state.player.ticket.number}。等待期間可以選擇坐下，或站到公告欄前查看市政資訊。`,[["坐在候位區",chooseWaitingSeat],["查看公告欄",viewBulletin]]);
  }

  function chooseWaitingSeat(){
    if(state.player.place!=="hall")return;
    if(state.cityhall.counterBusy && !state.player.ticket){openModal("QUEUE","候位區","服務櫃台有人使用時，請先抽號碼牌再等待。",[["抽號碼牌",drawTicket]]);return}
    state.player.hallActivity="waiting-seat";save();closeDialogue();renderAllHall();toast("你在候位區坐下等待。");
  }

  function viewBulletin(){
    if(state.player.place!=="hall")return;
    if(state.player.ticket && !state.player.ticket.called) state.player.hallActivity="bulletin";
    save();renderAllHall();
    openModal("CITY INFO","市政資訊公告欄","公告欄目前張貼：城市公共住宅資訊、港區道路施工通知、近期市集活動。若你正在排隊，叫號狀態仍會持續。",state.player.ticket&&!state.player.ticket.called?[["繼續查看",closeDialogue],["回候位區坐下",chooseWaitingSeat]]:[["關閉",closeDialogue]]);
  }

  function completeRegistration(){
    state.player.registered=true;state.onboarding.finished=true;state.player.ticket=null;state.player.hallActivity="counter";state.cityhall.calledNumber=null;state.cityhall.counterBusy=false;
    state.feed.unshift({time:nowTime(),text:"夏彌已完成潮港城居民證件登記。"});save();renderAllHall();renderCity();updateGuide();
    openModal("REGISTRATION","居民登記完成","你的潮港城居民資料已建立。接下來可以自由使用市政廳服務，或回到城市開始生活。",[["查看房產服務",()=>openModal("PROPERTY","房產服務","下一階段會把承租、購屋與土地建設流程接到這裡。",[["完成",closeDialogue]])],["完成",closeDialogue]]);
  }

  function renderAllHall(){if(state.player.place!=="hall")return;const b=building("hall");renderPeople(b);renderActions(b);renderQueuePanel(b);updateGuide()}

  function talk(a){
    openModal("FACE TO FACE",a.known?a.name:"陌生人",a.known?"朝野把筆記闔上一半，抬眼看向你。":"你靠近時，他先看了你一眼，沒有主動把對話接得很長。",[["打招呼",()=>{if(!a.known){a.known=true;state.feed.unshift({time:nowTime(),text:`夏彌在港口咖啡館認識了${a.name}。`});save()}$("#dialogueName").textContent=a.name;$("#dialogueText").textContent="「嗨。」他笑了一下，接著仍把注意力留在自己的筆記上。";renderPeople(building(state.player.place));renderCity()}],["先不打擾",closeDialogue]]);
  }

  function closeDialogue(){$("#dialogue").classList.add("hidden")}
  function showCity(){closeDialogue();setSceneScreen(false);renderCity();window.scrollTo({top:0,behavior:"instant"})}
  function leavePlace(){state.player.hallActivity=null;save();if(history.state?.asterraScreen==="place")history.back();else showCity()}

  $("#dialogueClose").onclick=closeDialogue;$("#backToCity").onclick=leavePlace;$("#worldBtn").onclick=()=>toast("世界地圖會在後續階段接回四城。");
  $("#resetDemo").onclick=()=>{localStorage.removeItem("asterra-v42-state");location.reload()};
  history.replaceState({asterraScreen:"city"},"",location.href);window.addEventListener("popstate",()=>showCity());

  renderCity();
  if(state.player.ticket&&!state.player.ticket.called) scheduleQueueCall();
  if(!state.player.registered&&!state.onboarding.started&&state.player.place!=="hall"){
    setTimeout(()=>{toast("首次抵達潮港城：先前往市政廳完成居民證件登記。");setTimeout(()=>startTravel(building("hall"),{onboarding:true}),1000)},700);
  } else if(state.player.place==="hall") openPlace(building("hall"),false);
})();
