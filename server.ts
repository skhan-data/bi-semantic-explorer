import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import fs from "fs-extra";
import os from "os";
import multer from "multer";
import AdmZip from "adm-zip";
import { simpleGit } from "simple-git";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Multer for memory storage (Zip uploads)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Helper: Create a unique session directory
  const createSessionDir = () => {
    const sessionId = crypto.randomBytes(16).toString("hex");
    const sessionDir = path.join(os.tmpdir(), `pbi_explorer_${sessionId}`);
    fs.ensureDirSync(sessionDir);
    return { sessionId, sessionDir };
  };

  // Helper: Run the Python extractor and cleanup
  const runExtractor = (projectPath: string, sessionDir: string, res: any) => {
    const outputPath = path.join(sessionDir, "metadata.json");
    // Ensure the path is quoted for the shell
    const command = `python pbi_extractor.py "${projectPath}" --output "${outputPath}"`;

    console.log(`[Session] Analyzing Flow: ${projectPath}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Session] Python Extractor Error: ${error.message}`);
        console.error(`[Session] Stderr: ${stderr}`);
        
        // Return detailed error to UI
        const errorMessage = stderr || error.message || "Unknown extraction error";
        fs.removeSync(sessionDir);
        return res.status(500).json({ error: "Technical Audit Failed", detail: errorMessage });
      }

      try {
        if (!fs.existsSync(outputPath)) {
          throw new Error(`Extractor did not generate output file at ${outputPath}. \nStdout: ${stdout}\nStderr: ${stderr}`);
        }
        const data = fs.readJsonSync(outputPath);
        res.json(data);
        console.log(`[Session] Analysis Complete. Data sent.`);
      } catch (parseError: any) {
        console.error(`[Session] Parse Error: ${parseError.message}`);
        res.status(500).json({ error: "Failed to parse analysis results.", detail: parseError.message });
      } finally {
        fs.remove(sessionDir).catch(err => console.error(`[Session] Cleanup failed: ${err.message}`));
      }
    });
  };

  // 1. ZIP Upload Endpoint
  app.post("/api/analyze/zip", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { sessionDir } = createSessionDir();
    try {
      const zip = new AdmZip(req.file.buffer);
      zip.extractAllTo(sessionDir, true);
      
      // The extractor handles finding the .pbip or .bim inside
      runExtractor(sessionDir, sessionDir, res);
    } catch (err: any) {
      fs.removeSync(sessionDir);
      res.status(500).json({ error: "Failed to extract ZIP", detail: err.message });
    }
  });

  // 2. GIT Clone Endpoint
  app.post("/api/analyze/git", async (req, res) => {
    const { repoUrl, branch = "main", token } = req.body;
    if (!repoUrl) return res.status(400).json({ error: "Missing repoUrl" });

    const { sessionDir } = createSessionDir();
    
    // Construct authenticated URL if token provided
    let authenticatedUrl = repoUrl;
    if (token) {
      if (repoUrl.includes("github.com")) {
        authenticatedUrl = repoUrl.replace("https://", `https://${token}@`);
      } else if (repoUrl.includes("azure.com") || repoUrl.includes("visualstudio.com")) {
        authenticatedUrl = repoUrl.replace("https://", `https://${token}@`);
      }
    }

    try {
      const git = simpleGit();
      await git.clone(authenticatedUrl, sessionDir, ["--depth", "1", "-b", branch]);

      // Auto-extract any .zip files found inside the cloned repo
      const clonedFiles = fs.readdirSync(sessionDir);
      for (const file of clonedFiles) {
        if (file.endsWith('.zip')) {
          const zipPath = path.join(sessionDir, file);
          console.log(`[Session] Found ZIP in repo: ${file}, extracting...`);
          try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(sessionDir, true);
            fs.removeSync(zipPath); // Clean up the zip after extraction
          } catch (zipErr: any) {
            console.warn(`[Session] Could not extract ${file}: ${zipErr.message}`);
          }
        }
      }

      runExtractor(sessionDir, sessionDir, res);
    } catch (err: any) {
      fs.removeSync(sessionDir);
      res.status(500).json({ error: "Failed to clone repository", detail: err.message });
    }
  });

  // Backwards compatibility endpoint
  app.post("/api/extract", (req, res) => {
    const { inputPath } = req.body;
    if (!inputPath) return res.status(400).json({ error: "Missing path" });
    const { sessionDir } = createSessionDir();
    runExtractor(inputPath, sessionDir, res);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Explorer Server running on http://localhost:${PORT}`);
  });

  // Global Error Handler for final fallback
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error] ${err.stack || err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", detail: err.message });
    }
  });
}

startServer();
