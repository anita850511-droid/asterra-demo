(() => {
  "use strict";
  const $=s=>document.querySelector(s);
  const STORAGE="asterra-v46-character-recipe";

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

  const skinColors=["#f7e9df","#f2d9c8","#edc8b1","#e4b69b","#d7a083","#c98d70","#b97a5e","#a9694f","#955a42","#834b36","#72412f","#61372a","#503025","#42271f","#362018","#2c1915"];
  const hairColors=["#ece8e2","#d9d2c7","#b9ad9d","#8a7565","#5d493d","#3b302a","#282422","#171719","#dcc29d","#b18158","#804e3d","#653747","#8d7e99","#71597e","#536883","#35546f","#8e9ca5","#63706e","#9b645d","#c98da1"];
  const eyeColors=["#c8c9ca","#9aa5ad","#728da2","#50768f","#5d7a69","#75895a","#a28750","#9b6f47","#754f39","#5b4136","#756080","#8a6e95","#6c5b9a","#935865","#a14c4c","#4e5968","#a4a0c9","#628e8c","#b5a172","#43382e"];
  const outfitColors=["#e6ded4","#17191f","#342c30","#6c5445","#30475c","#59634f","#6d4050","#65567b","#b79b75","#d8d1c7"];

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
  const hexRgb=h=>{const v=parseInt(h.slice(1),16);return [(v>>16&255)/255,(v>>8&255)/255,(v&255)/255]};

  // ----- WebGL live preview -------------------------------------------------
  const canvas=$('#avatarCanvas');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,premultipliedAlpha:false});
  let program,texFace,texBody,ready=false;
  const uniforms={};

  const vs=`
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0.0,1.0); }
  `;
  const fs=`
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform float u_mode;
    uniform float u_canvasAspect,u_texAspect,u_contain;
    uniform float u_faceWidth,u_faceLength,u_jaw,u_cheek,u_chin,u_maturity;
    uniform float u_eyeSize,u_eyeWidth,u_eyeAngle,u_eyeSpace,u_eyeHeight;
    uniform float u_browHeight,u_browAngle,u_browThickness,u_browLength;
    uniform float u_noseLength,u_noseWidth,u_noseBridge,u_noseTip;
    uniform float u_mouthWidth,u_upperLip,u_lowerLip,u_mouthCorner;
    uniform float u_height,u_headRatio,u_shoulder,u_torsoWidth,u_waist,u_hip,u_torsoLength,u_armLength,u_legLength,u_thigh,u_calf,u_muscle;
    uniform float u_hairVolume,u_hairLength,u_hairPart,u_outfitShape;
    uniform vec3 u_skinColor,u_hairColor,u_eyeColor,u_outfitColor;

    float g(vec2 p, vec2 c, vec2 s){ vec2 d=(p-c)/s; return exp(-2.4*dot(d,d)); }
    float ellipse(vec2 p, vec2 c, vec2 r){ vec2 d=(p-c)/r; return 1.0-smoothstep(.82,1.04,dot(d,d)); }
    vec3 tintPreserve(vec3 src, vec3 target, float amt){
      float lum=dot(src,vec3(.299,.587,.114));
      vec3 t=target*(.52+lum*.78);
      return mix(src,t,clamp(amt,0.0,1.0));
    }

    vec2 warpFace(vec2 p){
      vec2 q=p;
      float faceM=ellipse(q,vec2(.50,.455),vec2(.285,.315));
      float fw=1.0+u_faceWidth*.16*faceM;
      q.x=.50+(q.x-.50)/max(.72,fw);
      float fl=1.0+u_faceLength*.10*faceM;
      q.y=.455+(q.y-.455)/max(.80,fl);

      float jawM=g(q,vec2(.50,.58),vec2(.235,.16));
      q.x=.50+(q.x-.50)/max(.76,1.0+u_jaw*.18*jawM);
      float cheekM=g(q,vec2(.50,.445),vec2(.26,.12));
      q.x=.50+(q.x-.50)/max(.78,1.0+u_cheek*.11*cheekM);
      float chinM=g(q,vec2(.50,.635),vec2(.18,.10));
      q.y=.54+(q.y-.54)/max(.80,1.0+u_chin*.14*chinM);

      vec2 le=vec2(.405,.365), re=vec2(.595,.365);
      float es=u_eyeSpace*.028;
      vec2 lnew=le+vec2(-es, -u_eyeHeight*.016);
      vec2 rnew=re+vec2( es, -u_eyeHeight*.016);
      float lm=g(q,lnew,vec2(.095,.056));
      float rm=g(q,rnew,vec2(.095,.056));
      vec2 dl=q-lnew, dr=q-rnew;
      vec2 ls=vec2(1.0+u_eyeWidth*.18,1.0+u_eyeSize*.18);
      vec2 rs=ls;
      vec2 lsamp=le+vec2(dl.x/max(.70,ls.x),dl.y/max(.70,ls.y));
      vec2 rsamp=re+vec2(dr.x/max(.70,rs.x),dr.y/max(.70,rs.y));
      float ang=u_eyeAngle*.018;
      lsamp.y += dl.x*ang; rsamp.y -= dr.x*ang;
      q=mix(q,lsamp,lm*.94); q=mix(q,rsamp,rm*.94);

      float browY=.305-u_browHeight*.018;
      float bl=g(q,vec2(.405,browY),vec2(.11,.035));
      float br=g(q,vec2(.595,browY),vec2(.11,.035));
      q.y += (u_browHeight*.018)*(bl+br);
      q.x=.50+(q.x-.50)/max(.82,1.0+u_browLength*.08*(bl+br));
      q.y += (q.x-.50)*u_browAngle*.025*(bl-br);

      float noseM=g(q,vec2(.50,.47),vec2(.075,.13));
      q.x=.50+(q.x-.50)/max(.78,1.0+u_noseWidth*.14*noseM);
      q.y=.41+(q.y-.41)/max(.82,1.0+u_noseLength*.11*noseM);
      q.x += (q.x-.50)*u_noseTip*.02*g(q,vec2(.50,.515),vec2(.06,.05));

      float mouthM=g(q,vec2(.50,.555),vec2(.12,.055));
      q.x=.50+(q.x-.50)/max(.78,1.0+u_mouthWidth*.17*mouthM);
      float upper=g(q,vec2(.50,.545),vec2(.10,.025));
      float lower=g(q,vec2(.50,.565),vec2(.10,.03));
      q.y=.555+(q.y-.555)/max(.82,1.0+(u_upperLip*upper+u_lowerLip*lower)*.10);
      q.y += abs(q.x-.50)*u_mouthCorner*.035*mouthM;

      float hairTop=g(q,vec2(.50,.13),vec2(.36,.22));
      q.x=.50+(q.x-.50)/max(.76,1.0+u_hairVolume*.16*hairTop);
      float sides=g(q,vec2(.50,.46),vec2(.46,.36))*(1.0-faceM*.55);
      q.y=.25+(q.y-.25)/max(.74,1.0+u_hairLength*.12*sides);
      q.x += u_hairPart*.018*g(q,vec2(.50,.20),vec2(.17,.17));
      return clamp(q,0.001,.999);
    }

    vec2 warpBody(vec2 p){
      vec2 q=p;
      float h=1.0+u_height*.15;
      q.y=.94+(q.y-.94)/max(.78,h);
      float headM=g(q,vec2(.50,.115),vec2(.22,.12));
      q.x=.50+(q.x-.50)/max(.78,1.0+u_headRatio*.10*headM);
      q.y=.115+(q.y-.115)/max(.82,1.0+u_headRatio*.08*headM);
      float shoulderM=g(q,vec2(.50,.25),vec2(.28,.08));
      float torsoM=g(q,vec2(.50,.36),vec2(.25,.14));
      float waistM=g(q,vec2(.50,.44),vec2(.19,.09));
      float hipM=g(q,vec2(.50,.52),vec2(.23,.09));
      float thighM=g(q,vec2(.50,.66),vec2(.22,.13));
      float calfM=g(q,vec2(.50,.80),vec2(.18,.12));
      float sx=1.0 + u_shoulder*.18*shoulderM + u_torsoWidth*.14*torsoM + u_waist*.18*waistM + u_hip*.19*hipM + u_thigh*.15*thighM + u_calf*.13*calfM + u_outfitShape*.07*(torsoM+hipM);
      q.x=.50+(q.x-.50)/max(.68,sx);
      float torsoLen=g(q,vec2(.50,.38),vec2(.32,.22));
      q.y=.25+(q.y-.25)/max(.82,1.0+u_torsoLength*.08*torsoLen);
      float legs=smoothstep(.48,.70,q.y);
      q.y=.52+(q.y-.52)/max(.82,1.0+u_legLength*.10*legs);
      return clamp(q,0.001,.999);
    }

    void main(){
      vec2 p=vec2(v_uv.x,1.0-v_uv.y);
      float inside=1.0;
      if(u_contain>.5){
        if(u_canvasAspect>u_texAspect){
          float frac=u_texAspect/u_canvasAspect; float left=(1.0-frac)*.5;
          if(p.x<left || p.x>left+frac) inside=0.0; else p.x=(p.x-left)/frac;
        }else{
          float frac=u_canvasAspect/u_texAspect; float top=(1.0-frac)*.5;
          if(p.y<top || p.y>top+frac) inside=0.0; else p.y=(p.y-top)/frac;
        }
      }else{
        if(u_canvasAspect>u_texAspect){ float frac=u_texAspect/u_canvasAspect; p.y=.5+(p.y-.5)*frac; }
        else{ float frac=u_canvasAspect/u_texAspect; p.x=.5+(p.x-.5)*frac; }
      }
      if(inside<.5){ gl_FragColor=vec4(.085,.09,.105,1.0); return; }
      vec2 src = u_mode < .5 ? warpFace(p) : warpBody(p);
      vec3 col=texture2D(u_tex,vec2(src.x,1.0-src.y)).rgb;
      float lum=dot(col,vec3(.299,.587,.114));
      if(u_mode < .5){
        float skin=ellipse(p,vec2(.50,.46),vec2(.275,.315));
        skin=max(skin,ellipse(p,vec2(.50,.73),vec2(.30,.22))*.65);
        float head=ellipse(p,vec2(.50,.29),vec2(.44,.39));
        float hair=clamp(head-skin*.74,0.0,1.0);
        hair=max(hair,g(p,vec2(.18,.48),vec2(.18,.40))*.62);
        hair=max(hair,g(p,vec2(.82,.48),vec2(.18,.40))*.62);
        float eyes=g(p,vec2(.405,.365),vec2(.025,.020))+g(p,vec2(.595,.365),vec2(.025,.020));
        col=tintPreserve(col,u_skinColor,skin*.52);
        col=tintPreserve(col,u_hairColor,hair*.72);
        col=tintPreserve(col,u_eyeColor,clamp(eyes,0.0,1.0)*.85);
        col=mix(col,col*vec3(1.0-u_maturity*.08,1.0-u_maturity*.05,1.0),abs(u_maturity)*.22);
      } else {
        float body=ellipse(p,vec2(.50,.50),vec2(.32,.47));
        float hair=g(p,vec2(.50,.15),vec2(.23,.18));
        float cloth=body*smoothstep(.20,.48,p.y)*(1.0-smoothstep(.74,.90,p.y));
        cloth*=1.0-smoothstep(.30,.95,lum);
        float skin=body*(1.0-cloth*.70)*smoothstep(.15,.82,lum);
        col=tintPreserve(col,u_skinColor,skin*.34);
        col=tintPreserve(col,u_hairColor,hair*.52);
        col=tintPreserve(col,u_outfitColor,cloth*.58);
        col=mix(col,col*(1.0+u_muscle*.08),body*.25);
      }
      gl_FragColor=vec4(col,1.0);
    }
  `;

  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
  function initGL(){
    if(!gl){ $('#previewHint').textContent='此瀏覽器未啟用 WebGL，無法顯示即時變形預覽。'; return; }
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,'a_pos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    for(const n of ['u_mode','u_canvasAspect','u_texAspect','u_contain','u_faceWidth','u_faceLength','u_jaw','u_cheek','u_chin','u_maturity','u_eyeSize','u_eyeWidth','u_eyeAngle','u_eyeSpace','u_eyeHeight','u_browHeight','u_browAngle','u_browThickness','u_browLength','u_noseLength','u_noseWidth','u_noseBridge','u_noseTip','u_mouthWidth','u_upperLip','u_lowerLip','u_mouthCorner','u_height','u_headRatio','u_shoulder','u_torsoWidth','u_waist','u_hip','u_torsoLength','u_armLength','u_legLength','u_thigh','u_calf','u_muscle','u_hairVolume','u_hairLength','u_hairPart','u_outfitShape','u_skinColor','u_hairColor','u_eyeColor','u_outfitColor']) uniforms[n]=gl.getUniformLocation(program,n);
    Promise.all([loadTexture('assets/avatar-face-source.png'),loadTexture('assets/avatar-body-source.png')]).then(([a,b])=>{texFace=a;texBody=b;ready=true;resizeCanvas();applyPreview()}).catch(e=>{$('#previewHint').textContent='預覽素材載入失敗：'+e.message});
    addEventListener('resize',resizeCanvas);
  }
  function loadTexture(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);resolve({tex:t,w:img.width,h:img.height})};img.onerror=()=>reject(new Error(url));img.src=url})}
  function resizeCanvas(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.7);const w=Math.max(2,Math.round(r.width*d)),h=Math.max(2,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}if(gl)gl.viewport(0,0,w,h)}
  const norm=id=>(state.values[id]||0)/50;
  function presetBias(){
    const pf=state.preset.face||1,pe=state.preset.eyes||1,pb=state.preset.brows||1,pn=state.preset.nose||1,pm=state.preset.mouth||1,ph=state.preset.hair||1,pbody=state.preset.body||1,pout=state.preset.outfit||1;
    const wave=(n,k)=>Math.sin((n*1.73+k)*1.19)*.55+Math.cos((n*.71+k)*.91)*.25;
    return {
      faceWidth:wave(pf,1)*.42, jaw:wave(pf,2)*.38, cheek:wave(pf,3)*.32, chin:wave(pf,4)*.28, faceLength:wave(pf,5)*.30, maturity:wave(pf,6)*.22,
      eyeSize:wave(pe,1)*.36, eyeWidth:wave(pe,2)*.30, eyeAngle:wave(pe,3)*.34, eyeSpace:wave(pe,4)*.24, eyeHeight:wave(pe,5)*.20,
      browHeight:wave(pb,1)*.30,browAngle:wave(pb,2)*.32,browThickness:wave(pb,3)*.22,browLength:wave(pb,4)*.28,
      noseLength:wave(pn,1)*.30,noseWidth:wave(pn,2)*.34,noseBridge:wave(pn,3)*.25,noseTip:wave(pn,4)*.25,
      mouthWidth:wave(pm,1)*.34,upperLip:wave(pm,2)*.26,lowerLip:wave(pm,3)*.28,mouthCorner:wave(pm,4)*.30,
      hairVolume:wave(ph,1)*.52,hairLength:wave(ph,2)*.56,hairPart:wave(ph,3)*.45,
      height:wave(pbody,1)*.26,headRatio:wave(pbody,2)*.24,shoulder:wave(pbody,3)*.30,torsoWidth:wave(pbody,4)*.24,waist:wave(pbody,5)*.28,hip:wave(pbody,6)*.30,thigh:wave(pbody,7)*.22,calf:wave(pbody,8)*.20,
      outfitShape:wave(pout,1)*.40
    };
  }
  function set1(n,v){const l=uniforms[n]; if(l)gl.uniform1f(l,v)}
  function set3(n,a){const l=uniforms[n]; if(l)gl.uniform3fv(l,a)}
  function drawPreview(){
    if(!ready)return;resizeCanvas();gl.useProgram(program);const body=state.camera==='body';const t=body?texBody:texFace;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t.tex);const texLoc=gl.getUniformLocation(program,'u_tex');gl.uniform1i(texLoc,0);set1('u_mode',body?1:0);set1('u_canvasAspect',canvas.width/canvas.height);set1('u_texAspect',t.w/t.h);set1('u_contain',body?1:0);
    const b=presetBias(),val=k=>Math.max(-1,Math.min(1,norm(k)+(b[k]||0)));
    ['faceWidth','faceLength','jaw','cheek','chin','maturity','eyeSize','eyeWidth','eyeAngle','eyeSpace','eyeHeight','browHeight','browAngle','browThickness','browLength','noseLength','noseWidth','noseBridge','noseTip','mouthWidth','upperLip','lowerLip','mouthCorner','height','headRatio','shoulder','torsoWidth','waist','hip','torsoLength','armLength','legLength','thigh','calf','muscle'].forEach(k=>set1('u_'+k,val(k)));
    set1('u_hairVolume',b.hairVolume||0);set1('u_hairLength',b.hairLength||0);set1('u_hairPart',b.hairPart||0);set1('u_outfitShape',b.outfitShape||0);
    set3('u_skinColor',hexRgb(skinColors[state.skin-1]||skinColors[0]));set3('u_hairColor',hexRgb(hairColors[state.hairColor-1]||hairColors[0]));set3('u_eyeColor',hexRgb(eyeColors[state.eyeColor-1]||eyeColors[0]));set3('u_outfitColor',hexRgb(outfitColors[(state.preset.outfit||1)-1]||outfitColors[0]));
    gl.drawArrays(gl.TRIANGLES,0,6);
  }

  // ----- UI ----------------------------------------------------------------
  function buildNav(){const nav=$('#categoryNav');nav.innerHTML='';categories.forEach(c=>{const b=document.createElement('button');b.className='cat-btn'+(state.active===c.id?' active':'');b.innerHTML=`<span class="cat-icon">${c.icon}</span><span class="cat-label"><b>${c.zh}</b><small>${c.en}</small></span>`;b.onclick=()=>{state.active=c.id;state.camera=c.camera;render()};nav.appendChild(b)})}
  function numberGrid(c){let h=`<div class="option-title"><b>${c.zh}編號</b><small>${pad(state.preset[c.id]||1)} / ${pad(c.count)}</small></div><div class="number-grid">`;for(let i=1;i<=c.count;i++)h+=`<button class="num-btn ${(state.preset[c.id]||1)===i?'active':''}" data-preset="${i}">${pad(i)}</button>`;return h+'</div>'}
  function swatches(colors,key){return `<div class="swatch-grid">${colors.map((v,i)=>`<button class="swatch ${state[key]===i+1?'active':''}" data-swatch="${i+1}" style="background:${v}" aria-label="${pad(i+1)}"></button>`).join('')}</div>`}
  function sliderRows(items){return `<div class="slider-list">${items.map(([id,zh,en,min,max])=>`<label class="slider-row"><span class="slider-label"><b>${zh}</b><small>${en}</small></span><input type="range" data-slider="${id}" min="${min}" max="${max}" value="${state.values[id]??0}"><span class="slider-value">${state.values[id]??0}</span></label>`).join('')}</div>`}
  function buildControls(){
    const c=category(state.active);$('#panelTitle').textContent=c.zh;let counter='',html='';
    if(['skin','hairColor','eyeColor'].includes(c.id)){
      const arr=c.id==='skin'?skinColors:c.id==='hairColor'?hairColors:eyeColors;counter=`${pad(state[c.id])} / ${pad(arr.length)}`;html=`<div class="option-title"><b>${c.zh}</b><small>選擇 ${pad(state[c.id])}</small></div>${swatches(arr,c.id)}`;
    }else{
      counter=`${pad(state.preset[c.id]||1)} / ${pad(c.count)}`;html=numberGrid(c);if(sliders[c.id])html+=sliderRows(sliders[c.id]);
      if(c.id==='hair')html+=`<p class="section-note">髮型 01～20 現在會用髮量、長度與分線的即時變形呈現差異；它仍是技術原型，不等同正式 20 組髮型 Mesh。</p>`;
      if(c.id==='outfit')html+=`<p class="section-note">服飾 01～10 目前會改變服裝色調與輪廓感，正式版會換成真正不同服裝 Mesh。</p>`;
      if(c.id==='body')html+=`<p class="section-note">身形參數會立即改變全身預覽比例，正式 3D 角色會沿用相同數值。</p>`;
    }
    $('#counterLabel').textContent=counter;$('#controlContent').innerHTML=html;
    document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>mutate(()=>state.preset[c.id]=Number(b.dataset.preset)));
    document.querySelectorAll('[data-swatch]').forEach(b=>b.onclick=()=>mutate(()=>state[c.id]=Number(b.dataset.swatch)));
    document.querySelectorAll('[data-slider]').forEach(inp=>{inp.oninput=()=>{state.values[inp.dataset.slider]=Number(inp.value);inp.parentElement.querySelector('.slider-value').textContent=inp.value;applyPreview()};inp.onchange=()=>{snapshot();saveLocal()}});
  }
  function applyPreview(){
    const bodyMode=state.camera==='body';$('#cameraLabel').textContent=bodyMode?'正面 · 全身':'正面 · 臉部';document.querySelectorAll('.camera-switch button').forEach(b=>b.classList.toggle('active',b.dataset.camera===state.camera));
    const c=category(state.active);$('#activeSummary').textContent=['skin','hairColor','eyeColor'].includes(c.id)?`${c.zh} ${pad(state[c.id])}`:`${c.zh} ${pad(state.preset[c.id]||1)}`;drawPreview();
  }
  function render(){buildNav();buildControls();applyPreview();saveLocal()}
  function reset(){state=structuredClone(defaults);history=[JSON.stringify(state)];future=[];render();toast('已重置全部參數')}
  function randomize(){snapshot();for(const c of categories){if(['skin','hairColor','eyeColor'].includes(c.id))state[c.id]=1+Math.floor(Math.random()*c.count);else state.preset[c.id]=1+Math.floor(Math.random()*c.count)};Object.values(sliders).flat().forEach(s=>state.values[s[0]]=Math.floor(Math.random()*61)-30);render();toast('已產生隨機外觀參數')}
  function undo(){if(history.length<2)return toast('沒有可撤銷的變更');future.push(history.pop());state=JSON.parse(history[history.length-1]);render()}
  function redo(){if(!future.length)return toast('沒有可重做的變更');history.push(future.pop());state=JSON.parse(history[history.length-1]);render()}
  function showSave(){saveLocal();$('#recipePreview').textContent=JSON.stringify(state,null,2);$('#saveSheet').classList.remove('hidden')}

  $('#randomBtn').onclick=randomize;$('#resetBtn').onclick=reset;$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#saveBtn').onclick=showSave;$('#continueEditing').onclick=()=>$('#saveSheet').classList.add('hidden');$('#confirmSave').onclick=()=>{$('#saveSheet').classList.add('hidden');toast('角色外觀已保存在此瀏覽器')};
  document.querySelectorAll('.camera-switch button').forEach(b=>b.onclick=()=>{state.camera=b.dataset.camera;applyPreview()});
  initGL();render();
})();
