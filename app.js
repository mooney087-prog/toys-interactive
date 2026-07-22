const $=s=>document.querySelector(s);
const home=$("#homeScreen"),menu=$("#menuScreen"),game=$("#gameScreen"),stageArea=$("#stageArea");
const toys=[
 {w:"teddy bear",th:"ตุ๊กตาหมี",img:"assets/teddy-bear.jpg"},
 {w:"car",th:"รถของเล่น",img:"assets/car.jpg"},
 {w:"doll",th:"ตุ๊กตา",img:"assets/doll.jpg"},
 {w:"robot",th:"หุ่นยนต์",img:"assets/robot.jpg"},
 {w:"puzzle",th:"เกมต่อภาพ",img:"assets/puzzle.jpg"},
 {w:"ball",th:"ลูกบอล",img:"assets/ball.jpg"},
 {w:"train",th:"รถไฟของเล่น",img:"assets/train.jpg"},
 {w:"kite",th:"ว่าว",img:"assets/kite.jpg"}
];
const stages=["speaking","listening","reading","writing"];
let completed=new Set(),totalScore=0,stageScore=0,currentStage="speaking";

$("#startBtn").onclick=showMenu;
$("#menuHomeBtn").onclick=()=>show(home);
$("#backBtn").onclick=()=>show(menu);
$("#menuBtn").onclick=()=>{$("#resultDialog").close();showMenu();};
$("#nextBtn").onclick=()=>{
  $("#resultDialog").close();
  const i=stages.indexOf(currentStage);
  if(i<stages.length-1)startStage(stages[i+1]);else showMenu();
};
document.querySelectorAll(".mission-card").forEach(b=>b.onclick=()=>startStage(b.dataset.stage));

function show(s){[home,menu,game].forEach(x=>x.classList.remove("active"));s.classList.add("active")}
function showMenu(){
  $("#playerName").textContent=$("#studentName").value.trim()||"Player";
  $("#totalScore").textContent=totalScore;
  stages.forEach(s=>{$(`#status-${s}`).textContent=completed.has(s)?"✓ Complete":"Start"});
  $("#progressBar").style.width=`${completed.size*25}%`;
  $("#progressText").textContent=`${completed.size} / 4 missions`;
  show(menu);
}
function startStage(stage){
  currentStage=stage;stageScore=0;$("#stageScore").textContent=0;
  const labels={
    speaking:["Speaking","ฟังและออกเสียงตาม"],
    listening:["Listening","ฟังประโยคแล้วเลือกภาพ"],
    reading:["Reading","อ่านเรื่องสั้นพร้อมคำอธิบายภาษาไทย"],
    writing:["Writing","เติมคำศัพท์ที่ขาดหายไป"]
  };
  $("#stageTitle").textContent=labels[stage][0];$("#stageThai").textContent=labels[stage][1];
  show(game);
  ({speaking:renderSpeaking,listening:renderListening,reading:renderReading,writing:renderWriting})[stage]();
}
function addScore(n){stageScore+=n;totalScore+=n;$("#stageScore").textContent=stageScore}
function finishStage(text){
  completed.add(currentStage);$("#resultText").textContent=text;$("#resultDialog").showModal();
}
function speak(text,rate=.8){
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=rate;u.pitch=1.05;speechSynthesis.speak(u);
}
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function sound(ok=true){
  const ac=window._ac||(window._ac=new (window.AudioContext||window.webkitAudioContext)());
  const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);
  o.frequency.value=ok?740:180;o.type=ok?"sine":"sawtooth";g.gain.value=.12;o.start();
  g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.25);o.stop(ac.currentTime+.25);
}

function renderSpeaking(){
  let index=0,done=0;
  stageArea.innerHTML=`<div class="game-panel"><p class="instruction">Listen to each word and repeat.</p><p class="subinstruction">ฟังระบบออกเสียง แล้วให้นักเรียนออกเสียงตามจนครบ 8 คำ</p><div id="speakContent"></div><div class="speaking-progress" id="speakProgress"></div></div>`;
  toys.forEach((_,i)=>{$("#speakProgress").innerHTML+=`<span id="dot${i}">${i+1}</span>`});
  function showWord(){
    if(index>=toys.length){finishStage(`You practised all ${toys.length} toy words!`);return}
    const t=toys[index];
    $("#speakContent").innerHTML=`<div class="toy-focus"><div class="counter">Word ${index+1} / ${toys.length}</div><img class="toy-photo" src="${t.img}" alt="${t.w}"><h2 class="big-word">${t.w}</h2><div class="thai-word">${t.th}</div>
      <div class="action-row"><button id="listenWord" class="listen-main">🔊 Listen</button><button id="recordWord" class="speak-main">🎤 Speak</button><button id="saidIt">✅ I said it</button></div><div id="micResult" class="mic-result">Listen first, then repeat.</div></div>`;
    $("#listenWord").onclick=()=>speak(t.w,.7);
    $("#recordWord").onclick=()=>recognize(t.w);
    $("#saidIt").onclick=completeWord;
    setTimeout(()=>speak(t.w,.7),350);
  }
  function recognize(target){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){$("#micResult").textContent="ไมโครโฟนตรวจเสียงไม่รองรับ กรุณาพูดตามแล้วกด I said it";return}
    const r=new SR();r.lang="en-US";r.interimResults=false;r.maxAlternatives=1;
    $("#micResult").textContent="Listening...";
    r.onresult=e=>{
      const heard=e.results[0][0].transcript.toLowerCase();
      $("#micResult").textContent=`You said: ${heard}`;
      if(heard.includes(target.split(" ")[0])){sound(true);setTimeout(completeWord,500)}
      else{sound(false);$("#micResult").textContent+=` — Try again: ${target}`;}
    };
    r.onerror=()=>$("#micResult").textContent="Please try again.";
    r.start();
  }
  function completeWord(){
    $(`#dot${index}`).classList.add("done");addScore(10);sound(true);done++;index++;setTimeout(showWord,250);
  }
  showWord();
}

function renderListening(){
  let index=0,correct=0;
  stageArea.innerHTML=`<div class="game-panel listen-question"><p class="instruction">Listen to the sentence and choose the correct cartoon picture.</p><p class="subinstruction">ตัวอย่าง: “This is a teddy bear.” แล้วเลือกภาพให้ถูกต้อง</p><button id="playSentence" class="listen-main">🔊 Play Sentence</button><div class="sentence-box" id="sentenceBox">Listen carefully.</div><div class="picture-grid" id="listenGrid"></div></div>`;
  function next(){
    if(index>=toys.length){finishStage(`You matched ${correct} listening sentences!`);return}
    const target=toys[index],opts=shuffled([target,...shuffled(toys.filter(t=>t.w!==target.w)).slice(0,3)]);
    $("#sentenceBox").textContent=`Question ${index+1} / ${toys.length}`;
    $("#listenGrid").innerHTML="";
    opts.forEach(t=>{
      const b=document.createElement("button");b.className="picture-card";b.innerHTML=`<img src="${t.img}" alt="${t.w}"><b>${t.w}</b>`;
      b.onclick=()=>{
        if(t.w===target.w){b.classList.add("correct");correct++;addScore(10);sound(true);speak(`Correct. This is a ${target.w}.`);index++;setTimeout(next,700)}
        else{b.classList.add("wrong");sound(false);speak("Try again.");setTimeout(()=>b.classList.remove("wrong"),450)}
      };
      $("#listenGrid").appendChild(b);
    });
    setTimeout(()=>speak(`This is a ${target.w}.`),350);
  }
  $("#playSentence").onclick=()=>speak(`This is a ${toys[index]?.w}.`);
  next();
}

function renderReading(){
  const story=[
    {en:"Mina has a big toy box.",th:"มีนามีกล่องของเล่นใบใหญ่"},
    {en:"There is a teddy bear and a doll in the box.",th:"ในกล่องมีตุ๊กตาหมีและตุ๊กตา"},
    {en:"She plays with the ball in the park.",th:"เธอเล่นลูกบอลในสวนสาธารณะ"},
    {en:"Her brother likes the robot and the train.",th:"น้องชายของเธอชอบหุ่นยนต์และรถไฟของเล่น"},
    {en:"They put all the toys back in the box.",th:"พวกเขาเก็บของเล่นทั้งหมดกลับเข้าไปในกล่อง"}
  ];
  let current=0;
  stageArea.innerHTML=`<div class="game-panel"><p class="instruction">Read the short story with the system.</p><p class="subinstruction">กดฟังทีละประโยค พร้อมอ่านคำอธิบายภาษาไทย</p>
    <div class="story-card"><img class="story-image" src="assets/toys-worksheet.png" alt="Toy story"><div><div class="story-lines" id="storyLines"></div>
    <div class="story-controls"><button id="readAll">🔊 Read All</button><button id="readCurrent">▶ Read This Sentence</button><button id="nextLine">Next Sentence</button><button id="finishReading" class="primary">✅ I finished reading</button></div></div></div></div>`;
  const box=$("#storyLines");
  story.forEach((s,i)=>box.innerHTML+=`<div class="story-line" id="line${i}"><div class="english">${i+1}. ${s.en}</div><div class="thai">${s.th}</div></div>`);
  function highlight(){document.querySelectorAll(".story-line").forEach((x,i)=>x.classList.toggle("active",i===current))}
  highlight();
  $("#readCurrent").onclick=()=>{highlight();speak(story[current].en,.72)};
  $("#nextLine").onclick=()=>{current=Math.min(story.length-1,current+1);highlight();speak(story[current].en,.72)};
  $("#readAll").onclick=async()=>{
    for(let i=0;i<story.length;i++){current=i;highlight();speak(story[i].en,.72);await new Promise(r=>setTimeout(r,3000))}
  };
  $("#finishReading").onclick=()=>{addScore(40);finishStage("You read the story and understood all 5 sentences!")};
}

function renderWriting(){
  const questions=[
    {img:"assets/teddy-bear.jpg",sentence:"This is a _____.",answer:"teddy bear"},
    {img:"assets/robot.jpg",sentence:"I have a _____.",answer:"robot"},
    {img:"assets/ball.jpg",sentence:"The _____ is round.",answer:"ball"},
    {img:"assets/train.jpg",sentence:"This _____ has many cars.",answer:"train"},
    {img:"assets/kite.jpg",sentence:"I can fly a _____.",answer:"kite"},
    {img:"assets/puzzle.jpg",sentence:"I can play with a _____.",answer:"puzzle"}
  ];
  stageArea.innerHTML=`<div class="game-panel"><p class="instruction">Complete the missing words.</p><p class="subinstruction">เติมคำศัพท์ที่ขาดหายไปให้ถูกต้อง</p>
    <div class="word-bank">${shuffled(questions.map(q=>q.answer)).map(w=>`<span>${w}</span>`).join("")}</div><div class="writing-list" id="writingList"></div><button id="checkWriting" class="submit-btn">Check Answers</button></div>`;
  const list=$("#writingList");
  questions.forEach((q,i)=>{
    const parts=q.sentence.split("_____");
    list.innerHTML+=`<div class="writing-item" id="writeItem${i}"><img src="${q.img}" alt="${q.answer}"><div><div class="sentence-fill">${i+1}. ${parts[0]}<input id="answer${i}" autocomplete="off">${parts[1]}</div><div class="feedback" id="feedback${i}"></div></div></div>`;
  });
  $("#checkWriting").onclick=()=>{
    let correct=0;
    questions.forEach((q,i)=>{
      const value=$(`#answer${i}`).value.trim().toLowerCase(),item=$(`#writeItem${i}`),fb=$(`#feedback${i}`);
      item.classList.remove("correct","wrong");
      if(value===q.answer){correct++;item.classList.add("correct");fb.textContent="✓ Correct!";fb.style.color="#167437"}
      else{item.classList.add("wrong");fb.textContent=`Try again. Hint: ${q.answer[0]}...`;fb.style.color="#b51e36"}
    });
    if(correct===questions.length){addScore(60);sound(true);finishStage("Excellent! You completed every missing word correctly.")}
    else{sound(false);speak(`You have ${correct} correct answers. Please try again.`)}
  };
}
