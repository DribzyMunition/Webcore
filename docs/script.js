// Webcore interactive canvas — reselect & drag webs (ES5 safe)
// v1.5


var canvas = document.getElementById('webCanvas');
var ctx = canvas.getContext('2d');


function resizeCanvas(){
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.font = '14px monospace';
}
resizeCanvas();


var people = [];
var activePerson = null;
var draggingPerson = null;
var dragOffsetX = 0;
var dragOffsetY = 0;
var lastAddedIdx = null;


function Person(name, x, y){
this.name = name;
this.x = x;
this.y = y;
this.traits = [];
this.generated = [];
}


// helpers used below
function goldenAngle(n){ return (n * 2.399963229728653) % (Math.PI*2); } // ~137.5°
function posOf(p, node){ return { x: p.x + Math.cos(node.angle)*node.dist, y: p.y + Math.sin(node.angle)*node.dist }; }

function nodePositions(p){
  var pts=[], i;
  for(i=0;i<p.traits.length;i++){ pts.push(posOf(p, p.traits[i])); }
  for(i=0;i<p.generated.length;i++){ pts.push(posOf(p, p.generated[i])); }
  return pts;
}
function tooClose(pt, pts, min){ for(var i=0;i<pts.length;i++){ var dx=pt.x-pts[i].x, dy=pt.y-pts[i].y; if(Math.sqrt(dx*dx+dy*dy) < min) return true; } return false; }
function findOpenSpot(p, baseAngle, dist){
  var pts=nodePositions(p), step=Math.PI/18; // 10° steps
  for(var t=0;t<36;t++){ // try up to full circle
    var a = baseAngle + t*step;
    var test = { x: p.x + Math.cos(a)*dist, y: p.y + Math.sin(a)*dist };
    if(!tooClose(test, pts, 26)) return a;
  }
  return baseAngle; // fallback
}

// REPLACE the whole addTrait with this:
Person.prototype.addTrait = function(trait){
  if(!trait) return -1;
  var n = this.traits.length;
  var baseAngle = goldenAngle(n);
  var ring = (n % 8 >= 4) ? 1 : 0;  // spread across two rings
  var dist = 110 + ring*50;
  var angle = findOpenSpot(this, baseAngle, dist);
  this.traits.push({ text: trait, angle: angle, dist: dist });
  return this.traits.length - 1; // return index of new trait
};



Person.prototype.draw = function(){
// center node
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
ctx.fill();
ctx.fillText(this.name, this.x + 12, this.y + 4);


// ---------- persistence ----------
function saveState(){
  var data = people.map(function(p){
    return {
      name:p.name, x:p.x, y:p.y,
      traits:p.traits.map(function(t){ return {text:t.text, angle:t.angle, dist:t.dist}; }),
      generated:p.generated.map(function(g){ return {text:g.text, angle:g.angle, dist:g.dist, from:g.from}; })
    };
  });
  localStorage.setItem('webcore.v1', JSON.stringify(data));
}

function loadState(){
  var raw = localStorage.getItem('webcore.v1'); if(!raw) return;
  try{
    var arr = JSON.parse(raw);
    people = arr.map(function(p){
      var P = new Person(p.name, p.x, p.y);
      P.traits = (p.traits||[]).map(function(t){ return {text:t.text, angle:t.angle, dist:t.dist}; });
      P.generated = (p.generated||[]).map(function(g){ return {text:g.text, angle:g.angle, dist:g.dist, from:g.from}; });
      return P;
    });
  }catch(e){}
}

// ---------- co-occurrence & suggestions ----------
function traitPairs(p){
  // return all unordered pairs once: [ [i,j], ... ]
  var out=[], n=p.traits.length;
  for(var i=0;i<n;i++) for(var j=i+1;j<n;j++) out.push([i,j]);
  return out;
}

function alreadyHasGen(p,i,j){
  for(var k=0;k<p.generated.length;k++){
    var f=p.generated[k].from||[]; if(f.length<2) continue;
    if((f[0]===i && f[1]===j) || (f[0]===j && f[1]===i)) return true;
  }
  return false;
}

function scorePair(p,i,j){
  // small heuristic: prefer mid-distance, not too crowded; slight novelty bonus
  var tA=p.traits[i], tB=p.traits[j];
  var dx=Math.cos(tA.angle)*tA.dist - Math.cos(tB.angle)*tB.dist;
  var dy=Math.sin(tA.angle)*tA.dist - Math.sin(tB.angle)*tB.dist;
  var spatial = Math.sqrt(dx*dx+dy*dy);
  var novelty = 1 + Math.random()*0.2; // tie-breaker to vary
  return spatial * novelty;
}

function proposeCombos(p, limit, onlyIdx){
  if(!p || p.traits.length<2) return [];
  var pairs=[], n=p.traits.length, i,j;
  for(i=0;i<n;i++) for(j=i+1;j<n;j++){
    if(onlyIdx!=null && !(i===onlyIdx || j===onlyIdx)) continue;
    // skip if already materialised
    if(alreadyHasGen(p,i,j)) continue;
    pairs.push([i,j]);
  }
  if(!pairs.length) return [];
  pairs.sort(function(a,b){ return scorePair(p,b[0],b[1]) - scorePair(p,a[0],a[1]); });
  return pairs.slice(0, limit||2);
}


function renderSuggestions(){
  var box = document.getElementById('sugCombos');
  var probe = document.getElementById('sugProbe');
  box.innerHTML=''; probe.innerHTML='';

  if(!activePerson){ box.innerHTML='<div class="card">Select or create a person</div>'; return; }

  // try to propose with the most recently added trait; fallback to general
  var picks = proposeCombos(activePerson, 2, lastAddedIdx);
  if(!picks.length) picks = proposeCombos(activePerson, 2, null);

  if(picks.length===0){
    box.innerHTML = '<div class="card">No new combos right now — add more traits.</div>';
  } else {
    for(var i=0;i<picks.length;i++){
      (function(pair){
        var a = activePerson.traits[pair[0]], b = activePerson.traits[pair[1]];
        var label = (a.text + ' × ' + b.text);
        var card = document.createElement('div');
        card.className='card';
        card.innerHTML = '<span class="badge">combo</span>' + label;
        card.onclick = function(){
          var ang = angleAvg(a.angle, b.angle);
          var dist = (a.dist + b.dist)/2 + 20;
          activePerson.generated.push({ text: label, angle: ang, dist: dist, from:[pair[0], pair[1]] });
          saveState(); redraw(); renderSuggestions();
        };
        box.appendChild(card);
      })(picks[i]);
    }
  }

  // ... (keep your quick probe block unchanged)
}


  // quick probe — 3 choices → adds as tiny pref traits (you can rename these)
  var row = document.createElement('div');
  row.className='btnrow';
  ['clubbing','gaming','working'].forEach(function(opt){
    var b=document.createElement('button'); b.className='btn'; b.textContent=opt;
    b.onclick=function(){
      activePerson.addTrait('prefers: '+opt);
      saveState(); redraw(); renderSuggestions();
    };
    row.appendChild(b);
  });
  probe.appendChild(row);
}


// traits
var i, t, tx, ty, gx, gy;
for (i = 0; i < this.traits.length; i++) {
t = this.traits[i];
tx = this.x + Math.cos(t.angle) * t.dist;
ty = this.y + Math.sin(t.angle) * t.dist;
ctx.strokeStyle = '#444';
ctx.beginPath();
ctx.moveTo(this.x, this.y);
ctx.lineTo(tx, ty);
ctx.stroke();
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(tx, ty, 6, 0, Math.PI * 2);
ctx.fill();
ctx.fillText(t.text, tx + 10, ty);
}


// generated behaviors
for (i = 0; i < this.generated.length; i++) {
t = this.generated[i];
gx = this.x + Math.cos(t.angle) * t.dist;
gy = this.y + Math.sin(t.angle) * t.dist;
ctx.strokeStyle = '#800';
ctx.beginPath();
ctx.moveTo(this.x, this.y);
ctx.lineTo(gx, gy);
ctx.stroke();
ctx.fillStyle = '#ff0040';
// load, suggest, paint
loadState();
renderSuggestions();
redraw();

