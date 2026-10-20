(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const nowTime = () => new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
  const clone = o => JSON.parse(JSON.stringify(o));

  const world = {
    city:"潮港城",
    player:{name:"夏彌",money:12840,place:"social-west",inTransit:false},
    parcels:{
      "P-01":{zone:"civic",building:"hall"},"P-02":{zone:"commercial",building:"cafe"},"P-03":{zone:"residential",building:"social-west"},
      "P-04":{zone:"residential",building:"res-east"},"P-05":{zone:"commercial",building:"business"},"P-06":{zone:"historic",building:"oldtown"},
      "P-07":{zone:"industrial",building:"dock"},"P-08":{zone:"scenic",building:"highland"}
    },
    buildings:{
      hall:{id:"hall",parcel:"P-01",name:"潮港市政廳",icon:"▦",status:"open",x:50.5,y:40,scene:"cityhall",description:"辦理城市生活與房產業務。"},
      cafe:{id:"cafe",parcel:"P-02",name:"港口咖啡館",icon:"☕",status:"open",x:61.5,y:56,scene:"cafe",description:"靠海的咖啡館。"},
      "social-west":{id:"social-west",parcel:"P-03",name:"西灣住宅區",icon:"⌂",status:"open",x:26,y:22,scene:"generic",description:"住宅區。"},
      "res-east":{id:"res-east",parcel:"P-04",name:"東灣住宅區",icon:"⌂",status:"open",x:84,y:45,scene:"generic",description:"住宅區。"},
      business:{id:"business",parcel:"P-05",name:"中央商業區",icon:"▥",status:"open",x:72,y:32,scene:"generic",description:"辦公與商業核心。"},
      oldtown:{id:"oldtown",parcel:"P-06",name:"舊城區",icon:"▤",status:"open",x:23,y:49,scene:"generic",description:"舊港街區。"},
      dock:{id:"dock",parcel:"P-07",name:"潮港碼頭",icon:"⚓",status:"open",x:83,y:73,scene:"generic",description:"港口物流與出海區。"},
      highland:{id:"highland",parcel:"P-08",name:"山城高地",icon:"▲",status:"open",x:48,y:13,scene:"generic",description:"山城景觀區。"}
    },
    actors:{
      zhaoye:{id:"zhaoye",name:"朝野",place:"cafe",known:false,activity:"靠窗坐著，手邊放著一本寫滿歌詞的筆記。",portrait:"assets/zhaoye-portrait.png",x:43,y:51}
    },
    feed:[
      {time:"現在",text:"潮港城目前維持正常運作。"},
      {time:"現在",text:"港口咖啡館今日正常營業。"}
    ]
  };

  let state = load();
  function load(){
    try{const raw=localStorage.getItem("asterra-v4-state");return raw?Object.assign(clone(world),JSON.parse(raw)):clone(world)}catch{return clone(world)}
  }
  function save(){try{localStorage.setItem("asterra-v4-state",JSON.stringify(state))}catch{}}
  function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),1900)}
  function building(id){return state.buildings[id]}
  function peopleAt(place){return Object.values(state.actors).filter(a=>a.place===place)}

  function renderClock(){$("#clock").textContent=nowTime();$("#money").textContent=Number(state.player.money).toLocaleString("zh-TW")}
  setInterval(renderClock,1000);renderClock();

  function renderCity(){
    $("#buildingBubbles").innerHTML="";
    Object.values(state.buildings).forEach(b=>{
      if(b.status==="demolished") return;
      const btn=document.createElement("button");
      btn.className=`building-bubble ${b.status} ${state.player.place===b.id?"current":""}`;
      btn.style.left=b.x+"%";btn.style.top=b.y+"%";
      btn.innerHTML=`<span class="ico">${b.icon}</span><span class="name">${b.name}</span>`;
      btn.title=b.status==="closed"?"目前停業":b.status==="construction"?"施工中":"前往";
      btn.onclick=()=>goToBuilding(b);
      $("#buildingBubbles").appendChild(btn);
    });
    const cur=building(state.player.place);
    $("#currentPlace").textContent=cur?.name || "潮港城";
    $("#currentState").textContent=state.player.inTransit?"移動中":"點建築名稱氣泡即可前往。";
    $("#feed").innerHTML=state.feed.slice(0,6).map(x=>`<div class="feed-item"><time>${x.time}</time>${x.text}</div>`).join("");
  }

  function goToBuilding(b){
    if(state.player.inTransit)return;
    if(b.status==="closed"){toast(`${b.name}目前停業。`);return}
    if(b.status==="construction"){toast(`${b.name}仍在施工。`);return}
    if(state.player.place===b.id){openPlace(b);return}
    startTravel(b);
  }

  function startTravel(b){
    state.player.inTransit=true;save();
    const strip=$("#travelStrip");strip.classList.remove("hidden");
    $("#travelTitle").textContent=`前往 ${b.name}`;
    $("#travelMeta").textContent="潮港城市內移動 · 原型壓縮時間";
    const duration=3600,start=performance.now();
    const tick=t=>{
      const p=Math.min(1,(t-start)/duration);$("#travelBar").style.width=(p*100)+"%";$("#travelRemain").textContent=Math.max(0,Math.ceil((duration-(t-start))/1000))+" 秒";
      if(p<1){requestAnimationFrame(tick);return}
      state.player.inTransit=false;state.player.place=b.id;save();strip.classList.add("hidden");$("#travelBar").style.width="0";openPlace(b);renderCity();
    };requestAnimationFrame(tick);
  }

  const sceneConfig={
    cityhall:{image:"assets/cityhall-scene.png",objects:[{name:"服務櫃台",x:22,y:48},{name:"公告欄",x:78,y:42},{name:"房產服務",x:37,y:29}],actions:["查看承租物件","查看出售房屋","申請新建／改建","離開市政廳"]},
    cafe:{image:"assets/cafe-scene.png",objects:[{name:"吧檯",x:22,y:48},{name:"靠窗座位",x:61,y:47},{name:"出入口",x:82,y:62}],actions:["找位置坐","查看菜單","點一杯飲料","看看窗外","離開咖啡館"]}
  };

  function openPlace(b){
    if(!sceneConfig[b.scene]){toast(`${b.name}的室內場景之後建立。`);return}
    $("#cityScreen").classList.remove("active");$("#placeScreen").classList.add("active");
    const cfg=sceneConfig[b.scene];$("#sceneImage").src=cfg.image;$("#sceneTitle").textContent=b.name;$("#placeHeading").textContent=b.name;$("#placeText").textContent=b.description;
    renderObjects(cfg);renderPeople(b);renderActions(cfg,b);
  }

  function renderObjects(cfg){
    const layer=$("#objectLayer");layer.innerHTML="";
    cfg.objects.forEach(o=>{const btn=document.createElement("button");btn.className="object-chip";btn.style.left=o.x+"%";btn.style.top=o.y+"%";btn.textContent=o.name;btn.onclick=()=>toast(`${o.name}：正式版會開啟對應互動。`);layer.appendChild(btn)});
  }
  function renderPeople(b){
    const layer=$("#peopleLayer"),list=$("#peopleList");layer.innerHTML="";list.innerHTML="";
    const people=peopleAt(b.id);
    if(!people.length){list.innerHTML='<div class="empty">現在沒有你可以直接互動的人。</div>';return}
    people.forEach(a=>{
      const btn=document.createElement("button");btn.className="person-anchor";btn.style.left=a.x+"%";btn.style.top=a.y+"%";btn.innerHTML=`<span class="person-card"><img src="${a.portrait}" alt="${a.name}"></span><span class="person-bubble">${a.known?a.name:"陌生人"}</span>`;btn.onclick=()=>talk(a);layer.appendChild(btn);
      const row=document.createElement("button");row.className="person-row";row.innerHTML=`<b>${a.known?a.name:"陌生人"}</b><small>${a.activity}</small>`;row.onclick=()=>talk(a);list.appendChild(row);
    })
  }
  function renderActions(cfg,b){
    const list=$("#actionList");list.innerHTML="";cfg.actions.forEach(label=>{const btn=document.createElement("button");btn.className="action-btn";btn.textContent=label;btn.onclick=()=>{if(label.startsWith("離開")){showCity();return}toast(`${label}：互動規則之後接上。`)};list.appendChild(btn)})
  }
  function talk(a){
    $("#dialogue").classList.remove("hidden");$("#dialogueName").textContent=a.known?a.name:"陌生人";$("#dialogueText").textContent=a.known?"朝野把筆記闔上一半，抬眼看向你。":"你靠近時，他先看了你一眼，沒有主動把對話接得很長。";
    const acts=$("#dialogueActions");acts.innerHTML="";
    [["打招呼",()=>{if(!a.known){a.known=true;state.feed.unshift({time:nowTime(),text:`夏彌在港口咖啡館認識了${a.name}。`});save()}$("#dialogueName").textContent=a.name;$("#dialogueText").textContent="「嗨。」他笑了一下，語氣很自然，但沒有因為你站在旁邊就不停找話題。";renderPeople(building(state.player.place));renderCity()}],["先不打擾",()=>closeDialogue()]].forEach(([label,fn])=>{const b=document.createElement("button");b.textContent=label;b.onclick=fn;acts.appendChild(b)})
  }
  function closeDialogue(){$("#dialogue").classList.add("hidden")}
  function showCity(){closeDialogue();$("#placeScreen").classList.remove("active");$("#cityScreen").classList.add("active");renderCity()}
  $("#dialogueClose").onclick=closeDialogue;$("#backToCity").onclick=showCity;$("#worldBtn").onclick=()=>toast("世界地圖會在下一階段接回四城。")

  renderCity();
})();
