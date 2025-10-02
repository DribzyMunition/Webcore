const scenarioEl = document.getElementById('scenario');
const personaAEl = document.getElementById('personaA');
const personaBEl = document.getElementById('personaB');
const outputEl = document.getElementById('output');
const runBtn = document.getElementById('runBtn');
const apiToggle = document.getElementById('apiToggle');


runBtn.addEventListener('click', async () => {
outputEl.textContent = '⏳ analysing…';
const payload = {
scenario: scenarioEl.value.trim(),
agentA: personaAEl.value.trim(),
agentB: personaBEl.value.trim()
};


if (apiToggle.checked) {
try {
const res = await fetch('http://localhost:8000/api/analyze', {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
});
const data = await res.json();
outputEl.textContent = formatReport(data);
return;
} catch (e) {
outputEl.textContent = 'API error. Falling back to local heuristics.';
}
}


// Local heuristic fallback (v0): keyword cues + simple weights
const report = localHeuristics(payload);
outputEl.textContent = formatReport(report);
});


function localHeuristics({ scenario, agentA, agentB }) {
const txt = `${scenario} ${agentA} ${agentB}`.toLowerCase();
const cues = {
loss_aversion: /(loss|risk|fear|penalty|downside|price drop)/g,
time_pressure: /(deadline|time|clock|rush|hurry|minutes)/g,
social_audience: /(audience|public|room|press|board|investors)/g,
dominance: /(dominant|assert|strong|power|control)/g,
agreeableness: /(agreeable|friendly|cooperate|rapport)/g,
scarcity: /(scarce|limited|only|few|last)/g,
reciprocity: /(favor|return|owed|debt|gift)/g
};
const score = {};
for (const k in cues) score[k] = matches(txt, cues[k]);


const moves = [];
if (score.loss_aversion > 0) moves.push('Frame upside vs. **certain** downside to trigger loss aversion. Offer safety valve.');
if (score.time_pressure > 0) moves.push('Compress choices. Short, binary options. Anchor early.');
if (score.social_audience > 0) moves.push('Protect status in public. Offer face‑saving exits.');
if (score.dominance > score.agreeableness) moves.push('Meet dominance with calm, low‑reactive posture. Understate power.');
if (score.agreeableness > score.dominance) moves.push('Lean into rapport and reciprocity. Slow the frame.');
if (score.scarcity > 0) moves.push('Make scarcity legible, not loud. Provide a clock.');
if (score.reciprocity > 0) moves.push('Seed a favor → ask. Keep it specific and timed.');


return {
scores: score,
brief: pickBrief(score),
moves
};
}


function matches(txt, re) { return (txt.match(re) || []).length; }


function pickBrief(s) {
const keys = Object.entries(s).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
const top = keys.slice(0,3).map(k=>k.replace('_',' ')).join(' · ');
return `Primary forces: ${top || 'insufficient signal'}`;
}


function formatReport({ scores, brief, moves }) {
const table = Object.entries(scores || {})
.map(([k,v]) => `${k.padEnd(16,' ')} : ${v}`)
.join('\n');
const steps = (moves || []).map((m,i)=>`- ${m}`).join('\n');
return `>>> webcore // psychological modeller\n\n${brief}\n\n[signal]\n${table}\n\n[moves]\n${steps || '- add more detail for analysis'}`;
}
