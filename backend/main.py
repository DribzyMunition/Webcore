from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="webcore-api")


class Payload(BaseModel):
scenario: str
agentA: str | None = None
agentB: str | None = None


@app.get("/health")
async def health():
return {"ok": True}


@app.post("/api/analyze")
async def analyze(p: Payload):
txt = f"{p.scenario} {p.agentA or ''} {p.agentB or ''}".lower()
def count(keys):
return sum(txt.count(k) for k in keys)
scores = {
"loss_aversion": count(["loss","risk","penalty","downside","price drop"]),
"time_pressure": count(["deadline","time","clock","rush","hurry","minutes"]),
"social_audience": count(["audience","public","room","press","board","investors"]),
"dominance": count(["dominant","assert","strong","power","control"]),
"agreeableness": count(["agreeable","friendly","cooperate","rapport"]),
"scarcity": count(["scarce","limited","only","few","last"]),
"reciprocity": count(["favor","return","owed","debt","gift"]),
}
moves = []
if scores["loss_aversion"]: moves.append("Frame upside vs. certain downside; add an escape hatch.")
if scores["time_pressure"]: moves.append("Binary options, early anchor, visible clock.")
if scores["social_audience"]: moves.append("Offer face‑saving exits; status‑protective wording.")
if scores["dominance"] > scores["agreeableness"]: moves.append("Low‑reactive posture; understate power.")
if scores["agreeableness"] > scores["dominance"]: moves.append("Build rapport; lean on reciprocity.")
if scores["scarcity"]: moves.append("Make scarcity legible; timebox.")
if scores["reciprocity"]: moves.append("Seed favor → timed ask.")


def top3(d):
return " · ".join(k.replace("_"," ") for k,_ in sorted(d.items(), key=lambda x: -x[1])[:3])


return {
"scores": scores,
"brief": f"Primary forces: {top3(scores) if any(scores.values()) else 'insufficient signal'}",
"moves": moves,
}
