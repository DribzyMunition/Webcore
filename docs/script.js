const canvas = document.getElementById('webCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.font = "14px monospace";
ctx.fillStyle = "white";

let people = [];
let activePerson = null;

class Person {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.traits = [];
    this.generated = [];
  }

  addTrait(trait) {
    if (!trait) return;
    this.traits.push({ text: trait, angle: Math.random()*Math.PI*2, dist: 100 + Math.random()*50 });
    // simple fake generated behavior
    if (this.traits.length > 1) {
      this.generated.push({
        text: `${this.traits[this.traits.length-2].text}+${trait}`,
        angle: Math.random()*Math.PI*2,
        dist: 180
      });
    }
  }

  draw() {
    // draw center
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillText(this.name, this.x+12, this.y+4);

    // draw traits
    this.traits.forEach(t => {
      const tx = this.x + Math.cos(t.angle)*t.dist;
      const ty = this.y + Math.sin(t.angle)*t.dist;
      ctx.strokeStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillText(t.text, tx+10, ty);
    });

    // draw generated behaviors
    this.generated.forEach(g => {
      const gx = this.x + Math.cos(g.angle)*g.dist;
      const gy = this.y + Math.sin(g.angle)*g.dist;
      ctx.strokeStyle = '#800';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.fillStyle = '#ff0040';
      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillText(g.text, gx+10, gy);
    });
  }
}

function redraw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  people.forEach(p => p.draw());
}

canvas.addEventListener('click', e => {
  const name = document.getElementById('nameInput').value.trim();
  if (name) {
    const p = new Person(name, e.clientX, e.clientY);
    people.push(p);
    activePerson = p;
    document.getElementById('nameInput').value = '';
    console.log("Added person:", name);
    redraw();
  }
});

document.getElementById('traitInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && activePerson) {
    activePerson.addTrait(e.target.value.trim());
    console.log("Added trait:", e.target.value.trim());
    e.target.value = '';
    redraw();
  }
});

window.addEventListener('resize', ()=>{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.font = "14px monospace";
  redraw();
});

redraw();
