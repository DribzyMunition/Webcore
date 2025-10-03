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


function Person(name, x, y){
this.name = name;
this.x = x;
this.y = y;
this.traits = [];
this.generated = [];
}


Person.prototype.addTrait = function(trait){
if (!trait) return;
this.traits.push({
text: trait,
angle: Math.random() * Math.PI * 2,
dist: 100 + Math.random() * 50
});
if (this.traits.length > 1) {
var prev = this.traits[this.traits.length - 2].text;
this.generated.push({
text: prev + '+' + trait,
angle: Math.random() * Math.PI * 2,
dist: 180
});
}
};


Person.prototype.draw = function(){
// center node
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
ctx.fill();
ctx.fillText(this.name, this.x + 12, this.y + 4);


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
redraw();
