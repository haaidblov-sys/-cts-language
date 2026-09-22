function setVar(LVN,LV,name,value){
let p=LVN.indexOf(name);
if(p!==-1)LV[p]=value;
else{LVN.push(name);LV.push(value);}
}
function getVar(LVN,LV,name){
let p=LVN.indexOf(name);
return p!==-1?LV[p]:null;
}
function getQuoted(L){
let a=L.indexOf('"')+1;
let b=L.indexOf('"',a);
return(a>0&&b>a)?L.substring(a,b).trim():null;
}
function getBraces(L){
let a=L.indexOf("{")+1;
let b=L.lastIndexOf("}");
return(a>0&&b>a)?L.substring(a,b).trim():null;
}
function getBrackets(L,after){
let a=L.indexOf("[",after||0)+1;
let b=L.indexOf("]",a);
return(a>0&&b>a)?L.substring(a,b).trim():null;
}
function replaceAllVars(t,LV,LVN){
for(let M=0;M<LVN.length;M++)if(!Array.isArray(LV[M]))t=t.split(LVN[M]).join(LV[M]);
for(let S=0;S<LVN.length;S++)if(Array.isArray(LV[S])){let n=LVN[S].slice(1,-1);for(let i=0;i<LV[S].length;i++)t=t.replaceAll("<"+n+"["+i+"]>",LV[S][i]);}
for(let D=0;D<LVN.length;D++)if(Array.isArray(LV[D]))t=t.replaceAll(LVN[D],LV[D].join(", "));
return evalMath(t);
}
function evalMath(t){
return t.replace(/\[\s*Math\s+([^\]]+)\]/g,function(m,e){
try{let s=e.replace(/[^0-9+\-*/() .%]/g,"");if(s.trim()==="")return m;return Function("return ("+s+")")();}
catch(x){return "[MathError]";}
});
}
function escapeHTML(s){
return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function RunCTS(script){
let Lines=script.split("\n"),MainOP="",AllBugs="",LV=[],LVN=[],AllImages=[],NewTitle=null,NewColor=null,VER="CTS-JavaScript v3.0";
for(let i=0;i<Lines.length;i++){
let L=Lines[i].trim();
    setVar(LVN,LV,"<CurrentLine>",i+1);
    setVar(LVN, LV, "<getDate>", new Date());
    setVar(LVN, LV, "<getDateAsString>", new Date().toString());
    setVar(LVN, LV, "<getTodayDate>", new Date().getDate());
    setVar(LVN, LV, "<getDay>", new Date().getDay());
    setVar(LVN, LV, "<getYear>", new Date().getFullYear());
    setVar(LVN,LV,"<getDayName>",["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()]);
    setVar(LVN,LV,"<CurrentCountry>",
  Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[1] || "Unknown"
);
let ua = navigator.userAgent;
setVar(LVN,LV,"<CurrentDevice>",/Mobi|Android/i.test(ua)?"Mobile":/Tablet|iPad/i.test(ua)?"Tablet":"Desktop");
setVar(LVN,LV,"<CurrentOS>",(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||"Unknown");
setVar(LVN,LV,"<CurrentBrowser>",ua.includes("Firefox")?"Firefox":ua.includes("Edg")?"Edge":ua.includes("Chrome")?"Chrome":ua.includes("Safari")?"Safari":"Unknown");
setVar(LVN,LV,"<ScreenWidth>",screen.width);
setVar(LVN,LV,"<ScreenHeight>",screen.height);
setVar(LVN,LV,"<IsTouch>",("ontouchstart"in window)?"Yes":"No");
if(L.startsWith("Say {")){
let o=getBraces(L);
if(o===null){AllBugs+="Line "+(i+1)+": Say: Missing braces<br>";continue;}
o=replaceAllVars(o,LV,LVN).replace(/"/g,"");
MainOP+=escapeHTML(o)+"<br>";
}
else if(L.startsWith("Debug {")){
let o=getBraces(L);
if(o!==null)console.log(replaceAllVars(o,LV,LVN).replace(/"/g,""));
}
else if(L.startsWith("Make {")){
let o=getBraces(L);
if(o===null)continue;
let name=getQuoted(L);
if(!name){AllBugs+="Line "+(i+1)+": Make: Missing name<br>";continue;}
    let reserved=["CurrentLine","Roll","Result","Length","Loaded","RandomLetter",
"getDate","getDateAsString","getTodayDate","getDay","getYear","getDayName",
"CurrentDevice","CurrentOS","CurrentBrowser","ScreenWidth","ScreenHeight","IsTouch",
"CurrentCountry","Version"];
if(reserved.includes(name)){AllBugs+="Line "+(i+1)+": Make: '"+name+"' is a reserved name<br>";continue;}
if(LVN.includes("<"+name+">")){AllBugs+="Line "+(i+1)+": Make: Duplicate name<br>";continue;}
if(L.includes("VarValue [")){let v=getBrackets(L,L.indexOf("VarValue"));setVar(LVN,LV,"<"+name+">",replaceAllVars(v.replace(/"/g,"").trim(),LV,LVN));}
else if(L.includes("VarType [Array]")){setVar(LVN,LV,"<"+name+">",[]);}
else{AllBugs+="Line "+(i+1)+": Make: Missing VarValue/VarType<br>";}
}
else if(L.startsWith("Set {")){
let name=getQuoted(L);
if(!name)continue;
let v=getBrackets(L,L.indexOf("Value"));
if(v===null){AllBugs+="Line "+(i+1)+": Set: Missing Value<br>";continue;}
let p=LVN.indexOf("<"+name+">");
if(p===-1){AllBugs+="Line "+(i+1)+": Set: Variable not found<br>";continue;}
LV[p]=replaceAllVars(v.replace(/"/g,"").trim(),LV,LVN);
}
else if(L.startsWith("Push {")){
let name=getQuoted(L);
if(!name)continue;
let v=getBrackets(L,L.indexOf("Value"));
if(v===null){AllBugs+="Line "+(i+1)+": Push: Missing Value<br>";continue;}
let p=LVN.indexOf("<"+name+">");
if(p===-1){AllBugs+="Line "+(i+1)+": Push: Array not found<br>";continue;}
if(!Array.isArray(LV[p])){AllBugs+="Line "+(i+1)+": Push: Not an array<br>";continue;}
LV[p].push(v.replace(/"/g,"").trim());
}
else if(L.startsWith("Size {")){
let name=getQuoted(L);
if(!name)continue;
let p=LVN.indexOf("<"+name+">");
if(p===-1){AllBugs+="Line "+(i+1)+": Size: Array not found<br>";continue;}
if(!Array.isArray(LV[p])){AllBugs+="Line "+(i+1)+": Size: Not an array<br>";continue;}
setVar(LVN,LV,"<Length>",LV[p].length);
}
else if(L.startsWith("Calc {")){
let m=getBraces(L);
if(m===null)continue;
m=replaceAllVars(m,LV,LVN);
let r=Number(evalMath("[ Math "+m+" ]"));
if(isNaN(r)){AllBugs+="Line "+(i+1)+": Calc: Bad math<br>";continue;}
setVar(LVN,LV,"<Result>",r);
}
else if(L.startsWith("Roll {")){
let a=L.indexOf("{")+1;
let b=L.indexOf("}",a);
if(a<=0||b===-1)continue;
let minS=replaceAllVars(L.substring(a,b).trim(),LV,LVN);
let tP=L.indexOf("To",b);
if(tP===-1)continue;
let c=L.indexOf("{",tP)+1;
let d=L.indexOf("}",c);
if(c<=0||d===-1)continue;
let maxS=replaceAllVars(L.substring(c,d).trim(),LV,LVN);
let mn=Number(minS),mx=Number(maxS);
if(isNaN(mn)||isNaN(mx)){AllBugs+="Line "+(i+1)+": Roll: Bad min/max<br>";continue;}
let rnd=Math.floor(Math.random()*(mx-mn+1))+mn;
setVar(LVN,LV,"<Roll>",rnd);
}
else if(L.startsWith("Random_Letter")){
let m=L.match(/\[\s*(\d+)\s*\]/);
if(!m){AllBugs+="Line "+(i+1)+": Random_Letter: Missing [ number ]<br>";continue;}
let c=Number(m[1]);
if(c<1||c>100000){AllBugs+="Line "+(i+1)+": Random_Letter: Count 1-100000<br>";continue;}
let a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
let r="";
for(let x=0;x<c;x++)r+=a[Math.floor(Math.random()*a.length)];
setVar(LVN,LV,"<RandomLetter>",r);
MainOP+=escapeHTML(r)+"<br>";
}
else if(L.startsWith("Save {")){
let k=getQuoted(L);
if(!k)continue;
let v=getBrackets(L,L.indexOf("Value"));
if(v===null)continue;
localStorage.setItem("CTS_"+k,replaceAllVars(v.replace(/"/g,"").trim(),LV,LVN));
}
else if(L.startsWith("Load {")){
let k=getQuoted(L);
if(!k)continue;
let s=localStorage.getItem("CTS_"+k);
if(s===null)s="0";
setVar(LVN,LV,"<Loaded>",s);
}
else if(L.startsWith("Wipe {")){
localStorage.clear();
MainOP+="All data wiped.<br>";
}
else if(L.startsWith("Jump [")){
let n=Number(getBrackets(L));
if(!isNaN(n)&&n>i&&n<Lines.length)i=n-1;
}
else if(L.startsWith("Show {")){
let u=getBraces(L);
if(u===null)continue;
AllImages.push(replaceAllVars(u,LV,LVN).replace(/"/g,"").trim());
}
else if(L.startsWith("Title {")){
let o=getBraces(L);
if(o!==null)NewTitle=replaceAllVars(o,LV,LVN).replace(/"/g,"");
}
else if(L.startsWith("Paint {")){
let c=getBraces(L);
if(c===null)continue;
c=replaceAllVars(c,LV,LVN).replace(/"/g,"");
if(c.includes("/")){let p=c.split("/").map(s=>Number(s.trim()));if(p.length===3&&!p.some(isNaN))NewColor="rgb("+p[0]+","+p[1]+","+p[2]+")";}
else NewColor=c;
}
else if(L.startsWith("Repeat {")){
let n=getBraces(L);
if(n===null)continue;
n=replaceAllVars(n,LV,LVN);
let count=Number(n);
if(isNaN(count)||count<1||count>2000){AllBugs+="Line "+(i+1)+": Repeat: Bad count<br>";continue;}
let end=-1;
for(let j=i+1;j<Lines.length;j++)if(Lines[j].trim()==="End"){end=j;break;}
if(end===-1){AllBugs+="Line "+(i+1)+": Repeat: Missing End<br>";continue;}
let body=Lines.slice(i+1,end);
let rep=[];
for(let r=0;r<count;r++)rep=rep.concat(body);
Lines.splice(i,end-i+1,...rep);
i=i-1;
}
else if(L.startsWith("When {")||L.startsWith("Or {")||L.startsWith("Otherwise")||L.startsWith("Done")){
let branches=[];
let depth=0;
let endIdx=-1;
let firstCond=getBraces(L)||"";
branches.push({type:"when",line:i,cond:firstCond});
for(let j=i+1;j<Lines.length;j++){
let t=Lines[j].trim();
if(t.startsWith("When {"))depth++;
else if(t.startsWith("Done")){if(depth===0){endIdx=j;break;}else depth--;}
else if(depth===0&&t.startsWith("Or {"))branches.push({type:"or",line:j,cond:getBraces(t)||""});
else if(depth===0&&t==="Otherwise")branches.push({type:"else",line:j,cond:null});
}
if(endIdx===-1){AllBugs+="Line "+(i+1)+": When: Missing Done<br>";continue;}
let chosenS=-1,chosenE=-1;
for(let b=0;b<branches.length;b++){
let br=branches[b];
if(br.type==="else"){chosenS=br.line+1;chosenE=endIdx;break;}
let c=replaceAllVars(br.cond,LV,LVN).replace(/"/g,"").trim();
let res=false;
if(c.includes(">=")){let p=c.split(">=");res=Number(p[0].trim())>=Number(p[1].trim());}
else if(c.includes("<=")){let p=c.split("<=");res=Number(p[0].trim())<=Number(p[1].trim());}
else if(c.includes("==")){let p=c.split("==");res=p[0].trim()===p[1].trim();}
else if(c.includes("!=")){let p=c.split("!=");res=p[0].trim()!==p[1].trim();}
else if(c.includes(">")){let p=c.split(">");res=Number(p[0].trim())>Number(p[1].trim());}
else if(c.includes("<")){let p=c.split("<");res=Number(p[0].trim())<Number(p[1].trim());}
if(res){let nextLine=(b+1<branches.length)?branches[b+1].line:endIdx;chosenS=br.line+1;chosenE=nextLine;break;}
}
let body=(chosenS===-1)?[]:Lines.slice(chosenS,chosenE);
Lines.splice(i,endIdx-i+1,...body);
i=i-1;
}
}
let plain=MainOP.replace(/<br>/g,"\n");
return{output:AllBugs+MainOP+"<br>-----------<br>"+(plain.length-1)+"<br>"+VER+"<br>Thats it!",images:AllImages,title:NewTitle,color:NewColor,raw:MainOP,version:VER,chars: (plain.length-1),bugInfo: AllBugs};
}
