// Webcore interactive canvas — reselect & drag webs
// v1.4


const canvas = document.getElementById('webCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();


ctx.font = '14px monospace';
ctx.fillStyle = 'white';


let people = [];
let activePerson = null;
let draggingPerson = null;
let dragOffset = { x: 0, y: 0 };


// ---- helpers
function resizeCanvas() {
// Map CSS pixels to device pixels for crisp hit‑tests
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = Math.round(rect.width * dpr) || window.innerWidth * dpr;
canvas.height = Math.round(rect.height * dpr) || window.innerHeight * dpr;
canvas.style.width = rect.width ? rect.width + 'px' : '100%';
canvas.style.height = rect.height ? rect.height + 'px' : '100%';
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}


function mousePos(e) {
const rect = canvas.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
return { x, y };
}


// ---- model
class Person {
constructor(name, x, y) {
this.name = name;
this.x = x; // center in CSS pixels
this.y = y;
this.traits = [];
this.generated = [];
}


addTrait(trait) {
if (!trait) return;
this.traits.push({
text: trait,
redraw();
