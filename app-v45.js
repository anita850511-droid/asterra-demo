(() => {
  "use strict";
  const $=s=>document.querySelector(s);
  const STORAGE="asterra-v45-character-recipe";
  const categories=[
    {id:"face",zh:"臉型",en:"Face",icon:"◎",count:12,camera:"face"},
    {id:"skin",zh:"膚色",en:"Skin",icon:"◉",count:16,camera:"face"},
    {id:"eyes",zh:"眼睛",en:"Eyes",icon:"◌",count:16,camera:"face"},
    {id:"brows",zh:"眉毛",en:"Eyebrows",icon:"⌒",count:12,camera:"face"},
    {id:"nose",zh:"鼻子",en:"Nose",icon:"△",count:12,camera:"face"},
    {id:"mouth",zh:"嘴型",en:"Mouth",icon:"◇",count:12,camera:"face"},
    {id:"hair",zh:"髮型",en:"Hair",icon:"♧",count:20,camera:"face"},
    {id:"hairColor",zh:"髮色",en:"Hair Color",icon:"◈",count:20,camera:"face"},
    {id:"eyeColor",zh:"瞳孔",en:"Eye Color",icon:"⊙",count:20,camera:"face"},
    {id:"body",zh:"身形",en:"Body",icon:"♙",count:12,camera:"body"},
    {id:"outfit",zh:"服飾",en:"Outfit",icon:"♢",count:10,camera:"body"}
  ];
  const skinColors=["#f6e8de","#f2d7c7","#edc8b1","#e6b99e","#d9a184","#c78a6d","#b6795b","#a3664a","#92583f","#814c35","#70412f","#5e3528","#4f2d23","#41251d","#351e18","#2c1915"];
  const hairColors=["#f1ede7","#d8d2c8","#b7ab9d","#8a7565","#5d493d","#3b302a","#282422","#181819","#dcc29d","#b18158","#804e3d","#653747","#8d7e99","#71597e","#536883","#35546f","#8e9ca5","#63706e","#9b645d","#c98da1"];
  const eyeColors=["#c4c5c5","#9aa5ad","#728da2","#50768f","#5d7a69","#75895a","#a28750","#9b6f47","#754f39","#5b4136","#756080","#8a6e95","#6c5b9a","#935865","#a14c4c","#4e5968","#a4a0c9","#628e8c","#b5a172","#43382e"];
  const sliders={
    face:[['faceWidth','臉部寬度','Face Width',-50,50,0],['jaw','下顎輪廓','Jaw Contour',-50,50,0],['cheek','顴骨高低','Cheekbone Height',-50,50,0],['chin','下巴長度','Chin Length',-50,50,0],['faceLength','臉部長度','Face Length',-50,50,0],['maturity','幼態／成熟','Youthful / Mature',-50,50,0]],
    eyes:[['eyeSize','眼睛大小','Eye Size',-50,50,0],['eyeWidth','眼睛寬度','Eye Width',-50,50,0],['eyeAngle','眼尾角度','Eye Angle',-50,50,0],['eyeSpace','眼距','Eye Spacing',-50,50,0],['eyeHeight','眼睛高低','Eye Height',-50,50,0]],
    brows:[['browHeight','眉毛高低','Brow Height',-50,50,0],['browAngle','眉峰角度','Brow Angle',-50,50,0],['browThickness','眉毛粗細','Brow Thickness',-50,50,0],['browLength','眉毛長度','Brow Length',-50,50,0]],
    nose:[['noseLength','鼻子長度','Nose Length',-50,50,0],['noseWidth','鼻翼寬度','Nose Width',-50,50,0],['noseBridge','鼻樑高低','Bridge Height',-50,50,0],['noseTip','鼻尖大小','Tip Size',-50,50,0]],
    mouth:[['mouthWidth','嘴巴寬度','Mouth Width',-50,50,0],['upperLip','上唇厚度','Upper Lip',-50,50,0],['lowerLip','下唇厚度','Lower Lip',-50,50,0],['mouthCorner','嘴角弧度','Mouth Corner',-50,50,0]],
    body:[['height','身高','Height',-50,50,0],['headRatio','頭身比例','Head / Body Ratio',-50,50,0],['shoulder','肩寬','Shoulder Width',-50,50,0],['torsoWidth','上半身寬度','Torso Width',-50,50,0],['waist','腰部寬度','Waist Width',-50,50,0],['hip','臀部寬度','Hip Width',-50,50,0],['torsoLength','軀幹長度','Torso Length',-50,50,0],['armLength','手臂長度','Arm Length',-50,50,0],['legLength','腿長','Leg Length',-50,50,0],['thigh','大腿粗細','Thigh Size',-50,50,0],['calf','小腿粗細','Calf Size',-50,50,0],['muscle','肌肉感','Muscle Tone',-50,50,0]]
  };
  const defaults={active:"face",camera:"face",preset:{face:1,eyes:1,brows:1,nose:1,mouth:1,hair:1,body:1,outfit:1},skin:1,hairColor:1,eyeColor:1,values:{}};
  Object.values(sliders).flat().forEach(s=>defaults.values[s[0]]=s[5]);
  let state=load()||structuredClone(defaults),history=[JSON.stringify(state)],future=[];

  function load(){try{return JSON.parse(localStorage.getItem(STORAGE))}catch{return null}}
  function saveLocal(){localStorage.setItem(STORAGE,JSON.stringify(state))}
  function snapshot(){history.push(JSON.stringify(state));if(history.length>40)history.shift();future=[]}
  function mutate(fn){snapshot();fn();render()}
  function category(id){return categories.find(x=>x.id===id)}
  function pad(n){return String(n).padStart(2,'0')}
  function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1600)}

  function buildNav(){const nav=$('#categoryNav');nav.innerHTML='';categories.forEach(c=>{const b=document.createElement('button');b.className='cat-btn'+(state.active===c.id?' active':'');b.innerHTML=`<span class="cat-icon">${c.icon}</span><span class="cat-label"><b>${c.zh}</b><small>${c.en}</small></span>`;b.onclick=()=>{state.active=c.id;state.camera=c.camera;render()};nav.appendChild(b)})}
  function numberGrid(c){let h=`<div class="option-title"><b>${c.zh}編號</b><small>${pad(state.preset[c.id]||1)} / ${pad(c.count)}</small></div><div class="number-grid">`;for(let i=1;i<=c.count;i++)h+=`<button class="num-btn ${(state.preset[c.id]||1)===i?'active':''}" data-preset="${i}">${pad(i)}</button>`;return h+'</div>'}
  function swatches(colors,key){return `<div class="swatch-grid">${colors.map((v,i)=>`<button class="swatch ${state[key]===i+1?'active':''}" data-swatch="${i+1}" style="background:${v}" aria-label="${pad(i+1)}"></button>`).join('')}</div>`}
  function sliderRows(items){return `<div class="slider-list">${items.map(([id,zh,en,min,max])=>`<label class="slider-row"><span class="slider-label"><b>${zh}</b><small>${en}</small></span><input type="range" data-slider="${id}" min="${min}" max="${max}" value="${state.values[id]??0}"><span class="slider-value">${state.values[id]??0}</span></label>`).join('')}</div>`}
  function buildControls(){const c=category(state.active);$('#panelTitle').textContent=c.zh;let counter='';let html='';if(['skin','hairColor','eyeColor'].includes(c.id)){const arr=c.id==='skin'?skinColors:c.id==='hairColor'?hairColors:eyeColors;counter=`${pad(state[c.id])} / ${pad(arr.length)}`;html=`<div class="option-title"><b>${c.zh}</b><small>選擇 ${pad(state[c.id])}</small></div>${swatches(arr,c.id)}`;if(c.id==='hairColor')html+=`<p class="section-note">目前以色彩覆層近似預覽髮色。正式 3D 版會直接更換髮材質。</p>`;if(c.id==='eyeColor')html+=`<p class="section-note">瞳色會在臉部模式中顯示近似效果。</p>`;}else{counter=`${pad(state.preset[c.id]||1)} / ${pad(c.count)}`;html=numberGrid(c);if(sliders[c.id])html+=sliderRows(sliders[c.id]);if(c.id==='hair')html+=`<p class="section-note">髮型 01～20 的選單與儲存已可測試；實際 20 組 3D 髮型 Mesh 尚未接入，因此目前主預覽不會真的換髮型。</p>`;if(c.id==='outfit')html+=`<p class="section-note">服飾 01～10 的選單與儲存已可測試；正式服裝 Mesh 接入後才會真正更換款式。</p>`;if(c.id==='body')html+=`<p class="section-note">身形滑桿目前用全身圖做近似比例預覽，主要用來測試操作手感與參數範圍。</p>`;}
    $('#counterLabel').textContent=counter;$('#controlContent').innerHTML=html;
    document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>mutate(()=>state.preset[c.id]=Number(b.dataset.preset)));
    document.querySelectorAll('[data-swatch]').forEach(b=>b.onclick=()=>mutate(()=>state[c.id]=Number(b.dataset.swatch)));
    document.querySelectorAll('[data-slider]').forEach(inp=>{inp.oninput=()=>{state.values[inp.dataset.slider]=Number(inp.value);inp.parentElement.querySelector('.slider-value').textContent=inp.value;applyPreview()};inp.onchange=()=>{snapshot();saveLocal()}});
  }
  function applyPreview(){const root=document.documentElement,faceX=1+(state.values.faceWidth||0)/500,faceY=1+(state.values.faceLength||0)/700,bodyX=1+((state.values.shoulder||0)+(state.values.torsoWidth||0)+(state.values.hip||0))/2400,bodyY=1+(state.values.height||0)/700;root.style.setProperty('--face-x',faceX.toFixed(3));root.style.setProperty('--face-y',faceY.toFixed(3));root.style.setProperty('--body-x',bodyX.toFixed(3));root.style.setProperty('--body-y',bodyY.toFixed(3));root.style.setProperty('--skin',skinColors[state.skin-1]);root.style.setProperty('--hair',hairColors[state.hairColor-1]);root.style.setProperty('--iris',eyeColors[state.eyeColor-1]);
    const bodyMode=state.camera==='body';$('#portraitViewport').classList.toggle('body-mode',bodyMode);$('#faceImage').classList.toggle('hidden',bodyMode);$('#bodyImage').classList.toggle('hidden',!bodyMode);$('#cameraLabel').textContent=bodyMode?'正面 · 全身':'正面 · 臉部';document.querySelectorAll('.camera-switch button').forEach(b=>b.classList.toggle('active',b.dataset.camera===state.camera));
    const c=category(state.active);let sum='';if(['skin','hairColor','eyeColor'].includes(c.id))sum=`${c.zh} ${pad(state[c.id])}`;else sum=`${c.zh} ${pad(state.preset[c.id]||1)}`;$('#activeSummary').textContent=sum;
  }
  function render(){buildNav();buildControls();applyPreview();saveLocal()}
  function reset(){state=structuredClone(defaults);history=[JSON.stringify(state)];future=[];render();toast('已重置全部參數')}
  function randomize(){snapshot();for(const c of categories){if(['skin','hairColor','eyeColor'].includes(c.id))state[c.id]=1+Math.floor(Math.random()*c.count);else state.preset[c.id]=1+Math.floor(Math.random()*c.count)};Object.values(sliders).flat().forEach(s=>state.values[s[0]]=Math.floor(Math.random()*41)-20);render();toast('已產生隨機外觀參數')}
  function undo(){if(history.length<2)return toast('沒有可撤銷的變更');future.push(history.pop());state=JSON.parse(history[history.length-1]);render()}
  function redo(){if(!future.length)return toast('沒有可重做的變更');history.push(future.pop());state=JSON.parse(history[history.length-1]);render()}
  function showSave(){saveLocal();$('#recipePreview').textContent=JSON.stringify(state,null,2);$('#saveSheet').classList.remove('hidden')}

  $('#randomBtn').onclick=randomize;$('#resetBtn').onclick=reset;$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#saveBtn').onclick=showSave;$('#continueEditing').onclick=()=>$('#saveSheet').classList.add('hidden');$('#confirmSave').onclick=()=>{$('#saveSheet').classList.add('hidden');toast('角色外觀已保存在此瀏覽器')};
  document.querySelectorAll('.camera-switch button').forEach(b=>b.onclick=()=>{state.camera=b.dataset.camera;applyPreview()});
  render();
})();
