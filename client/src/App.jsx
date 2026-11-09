import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Sparkles, Download, Save, Plus, Trash2, FileText, WandSparkles, RefreshCw } from "lucide-react";

const API = "http://localhost:5000/api";
const blank = {
  fullName:"", role:"", email:"", phone:"", location:"", website:"", linkedin:"",
  summary:"", education:[{school:"",degree:"",year:"",grade:""}],
  experience:[{company:"",role:"",period:"",description:""}],
  projects:[{name:"",tech:"",description:""}], skills:""
};
const templates = ["modern","professional","minimal"];
const safe = (v) => v || "";

function Field({label,value,onChange,placeholder="",type="text"}) {
  return <label className="field"><span>{label}</span><input type={type} value={safe(value)} placeholder={placeholder} onChange={e=>onChange(e.target.value)} /></label>;
}
function Area({label,value,onChange,placeholder=""}) {
  return <label className="field"><span>{label}</span><textarea value={safe(value)} placeholder={placeholder} rows="3" onChange={e=>onChange(e.target.value)} /></label>;
}
function SectionTitle({children}) { return <div className="section-title">{children}</div>; }

function ResumePreview({data,template}) {
  const skills = String(data.skills||"").split(",").map(x=>x.trim()).filter(Boolean);
  return <div id="resume-paper" className={`resume-paper ${template}`}>
    <header className="resume-head">
      <h1>{data.fullName || "Your Name"}</h1><h3>{data.role || "Professional Title"}</h3>
      <p>{[data.email,data.phone,data.location,data.website,data.linkedin].filter(Boolean).join("  •  ") || "email@example.com • +91 00000 00000 • City, Country"}</p>
    </header>
    {data.summary && <section><h2>PROFILE</h2><p>{data.summary}</p></section>}
    {!!data.skills && <section><h2>SKILLS</h2><div className="skill-list">{skills.map((s,i)=><span key={i}>{s}</span>)}</div></section>}
    {data.experience?.some(x=>x.company||x.role||x.description) && <section><h2>EXPERIENCE</h2>{data.experience.map((x,i)=><div className="resume-entry" key={i}><div className="entry-top"><b>{x.role}</b><span>{x.period}</span></div><i>{x.company}</i><p>{x.description}</p></div>)}</section>}
    {data.projects?.some(x=>x.name||x.description) && <section><h2>PROJECTS</h2>{data.projects.map((x,i)=><div className="resume-entry" key={i}><b>{x.name}</b>{x.tech && <i> · {x.tech}</i>}<p>{x.description}</p></div>)}</section>}
    {data.education?.some(x=>x.school||x.degree) && <section><h2>EDUCATION</h2>{data.education.map((x,i)=><div className="resume-entry" key={i}><div className="entry-top"><b>{x.degree}</b><span>{x.year}</span></div><p>{x.school}{x.grade ? ` · ${x.grade}` : ""}</p></div>)}</section>}
  </div>;
}

export default function App() {
  const [data,setData] = useState(blank);
  const [template,setTemplate] = useState("modern");
  const [title,setTitle] = useState("My Resume");
  const [saved,setSaved] = useState([]);
  const [activeId,setActiveId] = useState(null);
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  const [tab,setTab] = useState("personal");

  const update = (key,value) => setData(d=>({...d,[key]:value}));
  const updateArray = (key,index,field,value) => setData(d=>({...d,[key]:d[key].map((item,i)=>i===index?{...item,[field]:value}:item)}));
  const addRow = key => setData(d=>({...d,[key]:[...d[key], key==="education"?{school:"",degree:"",year:"",grade:""}:key==="experience"?{company:"",role:"",period:"",description:""}:{name:"",tech:"",description:""}]}));
  const removeRow = (key,index) => setData(d=>({...d,[key]:d[key].filter((_,i)=>i!==index)}));

  const loadSaved = async () => { try { const r=await axios.get(`${API}/resumes`); setSaved(r.data); } catch { setNotice("Cannot reach backend. Start the server on port 5000."); } };
  useEffect(()=>{loadSaved();},[]);
  const save = async () => {
    setBusy(true);
    try {
      const payload={title,template,data};
      if(activeId) await axios.put(`${API}/resumes/${activeId}`,payload);
      else { const r=await axios.post(`${API}/resumes`,payload); setActiveId(r.data.id); }
      await loadSaved(); setNotice("Resume saved successfully.");
    } catch { setNotice("Save failed. Make sure the backend is running."); }
    finally { setBusy(false); }
  };
  const openResume = async id => {
    try { const r=await axios.get(`${API}/resumes/${id}`); setActiveId(id); setTitle(r.data.title); setTemplate(r.data.template); setData({...blank,...r.data.data}); setNotice("Resume loaded."); }
    catch { setNotice("Could not load resume."); }
  };
  const deleteResume = async id => {
    if(!confirm("Delete this saved resume?")) return;
    try { await axios.delete(`${API}/resumes/${id}`); if(activeId===id){setActiveId(null);setData(blank);setTitle("My Resume");} loadSaved(); }
    catch { setNotice("Delete failed."); }
  };
  const improve = async (field,kind) => {
    if(!data[field]?.trim()) return setNotice("Enter some text first, then use AI Improve.");
    setBusy(true);
    try { const r=await axios.post(`${API}/ai/improve`,{text:data[field],kind}); update(field,r.data.improvedText); setNotice("AI improvement complete."); }
    catch(e) { setNotice(e.response?.data?.error || "AI service unavailable."); }
    finally { setBusy(false); }
  };
  const newResume = () => {setData(blank);setTitle("My Resume");setTemplate("modern");setActiveId(null);setTab("personal");};
  const print = () => { window.print(); };
  const sections = ["personal","education","experience","projects"];
  return <div className="app-shell">
    <nav className="topbar"><div className="brand"><div className="brand-icon"><FileText size={20}/></div><span>resume<span className="brand-accent">studio</span></span></div><div className="top-actions"><button className="btn ghost" onClick={newResume}><Plus size={16}/> New</button><button className="btn secondary" onClick={save} disabled={busy}><Save size={16}/> Save Resume</button><button className="btn primary" onClick={print}><Download size={16}/> Download PDF</button></div></nav>
    <main className="layout">
      <aside className="sidebar">
        <div className="side-label">WORKSPACE</div>
        <button className="side-new" onClick={newResume}><Plus size={16}/> Create new resume</button>
        <div className="side-label saved-label">SAVED RESUMES</div>
        {saved.length===0?<p className="empty-side">Your saved resumes will appear here.</p>:saved.map(r=><div className={`saved-item ${activeId===r.id?"selected":""}`} key={r.id}><button onClick={()=>openResume(r.id)}><FileText size={15}/><span>{r.title}</span></button><button className="delete" onClick={()=>deleteResume(r.id)} aria-label="Delete"><Trash2 size={14}/></button></div>)}
        <div className="sidebar-tip"><Sparkles size={16}/><b>Make it stand out</b><p>Use clear action verbs and measurable results. Keep your resume relevant to each role.</p></div>
      </aside>
      <section className="editor">
        <div className="page-heading"><div><div className="eyebrow">RESUME WORKSPACE</div><h1>Build your resume</h1><p>Complete your details and watch your resume come together.</p></div><div className="status-pill"><span/> Autosaved locally while editing</div></div>
        <div className="title-row"><Field label="RESUME NAME" value={title} onChange={setTitle} placeholder="e.g. Software Engineer Resume"/></div>
        <div className="tabs">{sections.map((s,i)=><button className={tab===s?"active":""} onClick={()=>setTab(s)} key={s}><span>{String(i+1).padStart(2,"0")}</span>{s[0].toUpperCase()+s.slice(1)}</button>)}</div>
        <div className="form-panel">
          {tab==="personal" && <>
            <SectionTitle>Personal information <small>Tell employers who you are.</small></SectionTitle>
            <div className="form-grid"><Field label="FULL NAME" value={data.fullName} onChange={v=>update("fullName",v)} placeholder="e.g. Alex Johnson"/><Field label="PROFESSIONAL TITLE" value={data.role} onChange={v=>update("role",v)} placeholder="e.g. Full Stack Developer"/><Field label="EMAIL" type="email" value={data.email} onChange={v=>update("email",v)} placeholder="alex@email.com"/><Field label="PHONE" value={data.phone} onChange={v=>update("phone",v)} placeholder="+91 98765 43210"/><Field label="LOCATION" value={data.location} onChange={v=>update("location",v)} placeholder="Hyderabad, India"/><Field label="PORTFOLIO / WEBSITE" value={data.website} onChange={v=>update("website",v)} placeholder="yourportfolio.com"/><Field label="LINKEDIN" value={data.linkedin} onChange={v=>update("linkedin",v)} placeholder="linkedin.com/in/username"/></div>
            <div className="field-block"><Area label="PROFESSIONAL SUMMARY" value={data.summary} onChange={v=>update("summary",v)} placeholder="Write 2–4 lines about your strengths, experience, and career goals."/><button className="ai-button" disabled={busy} onClick={()=>improve("summary","professional summary")}><WandSparkles size={15}/> AI Improve</button></div>
            <div className="field-block"><Area label="SKILLS (COMMA SEPARATED)" value={data.skills} onChange={v=>update("skills",v)} placeholder="JavaScript, React, Node.js, SQL, Communication"/></div>
          </>}
          {tab==="education" && <><SectionTitle>Education <small>Add your academic background.</small></SectionTitle>{data.education.map((x,i)=><div className="repeat-card" key={i}><div className="repeat-head"><b>Education {i+1}</b>{data.education.length>1&&<button className="text-danger" onClick={()=>removeRow("education",i)}><Trash2 size={14}/> Remove</button>}</div><div className="form-grid"><Field label="INSTITUTION" value={x.school} onChange={v=>updateArray("education",i,"school",v)} placeholder="University / College"/><Field label="DEGREE / COURSE" value={x.degree} onChange={v=>updateArray("education",i,"degree",v)} placeholder="B.Tech Computer Science"/><Field label="YEAR" value={x.year} onChange={v=>updateArray("education",i,"year",v)} placeholder="2022 – 2026"/><Field label="CGPA / GRADE" value={x.grade} onChange={v=>updateArray("education",i,"grade",v)} placeholder="8.5 CGPA"/></div></div>)}<button className="add-button" onClick={()=>addRow("education")}><Plus size={15}/> Add education</button></>}
          {tab==="experience" && <><SectionTitle>Experience <small>Show the impact of your work.</small></SectionTitle>{data.experience.map((x,i)=><div className="repeat-card" key={i}><div className="repeat-head"><b>Experience {i+1}</b>{data.experience.length>1&&<button className="text-danger" onClick={()=>removeRow("experience",i)}><Trash2 size={14}/> Remove</button>}</div><div className="form-grid"><Field label="COMPANY" value={x.company} onChange={v=>updateArray("experience",i,"company",v)} placeholder="Company name"/><Field label="JOB TITLE" value={x.role} onChange={v=>updateArray("experience",i,"role",v)} placeholder="Software Intern"/><Field label="DURATION" value={x.period} onChange={v=>updateArray("experience",i,"period",v)} placeholder="May 2025 – Aug 2025"/></div><div className="field-block"><Area label="DESCRIPTION" value={x.description} onChange={v=>updateArray("experience",i,"description",v)} placeholder="Describe your responsibilities and achievements."/></div><button className="ai-button" disabled={busy} onClick={()=>improve("experience","experience description")}> <WandSparkles size={15}/> AI Improve</button></div>)}<button className="add-button" onClick={()=>addRow("experience")}><Plus size={15}/> Add experience</button></>}
          {tab==="projects" && <><SectionTitle>Projects <small>Highlight projects, tools, and outcomes.</small></SectionTitle>{data.projects.map((x,i)=><div className="repeat-card" key={i}><div className="repeat-head"><b>Project {i+1}</b>{data.projects.length>1&&<button className="text-danger" onClick={()=>removeRow("projects",i)}><Trash2 size={14}/> Remove</button>}</div><Field label="PROJECT NAME" value={x.name} onChange={v=>updateArray("projects",i,"name",v)} placeholder="AI Resume Builder"/><Field label="TECHNOLOGIES" value={x.tech} onChange={v=>updateArray("projects",i,"tech",v)} placeholder="React, Node.js, SQLite"/><div className="field-block"><Area label="DESCRIPTION" value={x.description} onChange={v=>updateArray("projects",i,"description",v)} placeholder="What did you build? What problem did it solve?"/></div><button className="ai-button" disabled={busy} onClick={async()=>{if(!x.description.trim())return setNotice("Enter a project description first.");setBusy(true);try{const r=await axios.post(`${API}/ai/improve`,{text:x.description,kind:"project description"});updateArray("projects",i,"description",r.data.improvedText);setNotice("AI improvement complete.");}catch(e){setNotice(e.response?.data?.error||"AI service unavailable.");}finally{setBusy(false);}}}><WandSparkles size={15}/> AI Improve</button></div>)}<button className="add-button" onClick={()=>addRow("projects")}><Plus size={15}/> Add project</button></>}
          <div className="form-footer"><span>{notice}</span><div><button className="btn ghost" onClick={()=>setTab(sections[Math.max(0,sections.indexOf(tab)-1)])}>Back</button><button className="btn primary" onClick={()=>setTab(sections[Math.min(3,sections.indexOf(tab)+1)])}>Continue</button></div></div>
        </div>
        <div className="template-picker"><div><b>Choose a template</b><p>Select a style that fits your career.</p></div><div className="template-options">{templates.map(t=><button key={t} className={template===t?"chosen":""} onClick={()=>setTemplate(t)}><span className={`template-thumb ${t}`}><i/><i/><i/><i/></span><span>{t[0].toUpperCase()+t.slice(1)}</span>{template===t&&<span className="check">✓</span>}</button>)}</div></div>
      </section>
      <section className="preview-column"><div className="preview-top"><div><b>Live preview</b><p>Your resume updates as you type.</p></div><button className="icon-btn" onClick={()=>setNotice("Preview refreshed.")} title="Refresh"><RefreshCw size={16}/></button></div><ResumePreview data={data} template={template}/><div className="preview-note"><Sparkles size={15}/> Tip: Use consistent dates and concise bullet points.</div></section>
    </main>
  </div>;
}
