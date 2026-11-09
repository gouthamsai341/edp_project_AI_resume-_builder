import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import db from "./db.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "AI Resume Builder API" }));

app.get("/api/resumes", (_req, res) => {
  const rows = db.prepare("SELECT id,title,template,created_at,updated_at FROM resumes ORDER BY updated_at DESC").all();
  res.json(rows);
});

app.get("/api/resumes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM resumes WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Resume not found" });
  res.json({ ...row, data: JSON.parse(row.data) });
});

app.post("/api/resumes", (req, res) => {
  const { title = "My Resume", template = "modern", data = {} } = req.body || {};
  const result = db.prepare("INSERT INTO resumes(title,template,data) VALUES(?,?,?)")
    .run(String(title).slice(0,120), template, JSON.stringify(data));
  res.status(201).json({ id: result.lastInsertRowid, message: "Resume saved" });
});

app.put("/api/resumes/:id", (req, res) => {
  const { title = "My Resume", template = "modern", data = {} } = req.body || {};
  const result = db.prepare("UPDATE resumes SET title=?,template=?,data=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .run(String(title).slice(0,120), template, JSON.stringify(data), req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Resume not found" });
  res.json({ message: "Resume updated" });
});

app.delete("/api/resumes/:id", (req, res) => {
  const result = db.prepare("DELETE FROM resumes WHERE id=?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Resume not found" });
  res.json({ message: "Resume deleted" });
});

app.post("/api/ai/improve", async (req, res) => {
  const { text = "", kind = "professional resume content" } = req.body || {};
  if (!String(text).trim()) return res.status(400).json({ error: "Please provide text to improve." });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI is not configured. Add OPENAI_API_KEY to server/.env." });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert resume writer. Improve the user's resume text so it is concise, truthful, professional, achievement-oriented, and ATS-friendly. Never invent qualifications, metrics, employers, or skills. Return only the improved text." },
        { role: "user", content: `Improve this ${kind}. Preserve the facts and do not add unsupported claims:\n${String(text).slice(0,5000)}` }
      ],
      temperature: 0.5
    });
    res.json({ improvedText: response.choices[0]?.message?.content?.trim() || text });
  } catch (error) {
    console.error("AI request failed:", error.message);
    res.status(502).json({ error: "AI request failed. Check your API key, model access, and server logs." });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`API running at http://localhost:${port}`));
