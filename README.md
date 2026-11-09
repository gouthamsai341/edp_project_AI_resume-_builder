# AI Resume Builder – Full Stack Project

A full-stack resume builder with AI-assisted writing, three templates, live preview, SQLite persistence, and PDF export.

## Requirements
- Node.js 18+ (20 LTS recommended)
- npm
- OpenAI API key (optional; AI writing buttons work only when configured)

## Project structure
```text
ai-resume-builder/
├── client/                 # React + Vite frontend
├── server/                 # Express API + SQLite database
├── package.json            # Root scripts
├── .gitignore
└── README.md
```

## 1. Install dependencies
Open a terminal in the project root and run:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

## 2. Configure the backend
Create `server/.env` by copying `server/.env.example`.

Windows PowerShell:
```powershell
Copy-Item server/.env.example server/.env
```

Windows CMD:
```cmd
copy server\.env.example server\.env
```

macOS/Linux:
```bash
cp server/.env.example server/.env
```

Open `server/.env` and add your OpenAI API key:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```
AI features are optional. Without a key, the app still supports manual resume creation, templates, saving, editing, and PDF export.

## 3. Run the application
From the project root:

```bash
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

You can also run frontend and backend separately in two terminals:

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run client
```

## 4. How to use
1. Open the frontend URL.
2. Fill in personal details, education, skills, projects, and experience.
3. Choose Modern, Professional, or Minimal template.
4. Use **AI Improve** to polish the summary or a project/experience description (requires API key).
5. Click **Save Resume** to store it in SQLite.
6. Use **Download PDF** to export the resume. In the print dialog, choose “Save as PDF”.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API status |
| GET | `/api/resumes` | List saved resumes |
| GET | `/api/resumes/:id` | Get one resume |
| POST | `/api/resumes` | Create a resume |
| PUT | `/api/resumes/:id` | Update a resume |
| DELETE | `/api/resumes/:id` | Delete a resume |
| POST | `/api/ai/improve` | AI writing assistance |

## Libraries used
### Frontend
- React, React DOM
- Vite
- Axios
- Lucide React
- jsPDF (available for future client-side PDF enhancements; current export uses browser print for dependable layout)

### Backend
- Express
- better-sqlite3
- cors
- dotenv
- OpenAI SDK
- Nodemon

## Notes
- SQLite database is created automatically at `server/data/resumes.db`.
- Do not commit `server/.env` or share your API key.
- The AI endpoint returns a clear error if the key is missing or the AI provider is unavailable.
- This starter project does not include user accounts or cloud hosting. Add authentication before deploying it for multiple users.
