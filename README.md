# Power BI Semantic Explorer

An AI-powered documentation, lineage, and health analysis tool for Power BI Semantic Models. Designed for both technical developers and non-technical business users.

## Features

- **Dual Modes (Technical & Simple):** A detailed developer view for debugging and a simplified card-based view for business users.
- **Automated Metadata Extraction:** Parse `.pbip`, `.bim`, and `.zip` Power BI projects directly in the browser or via server.
- **Git & Zip Integration:** Connect directly to Azure DevOps/GitHub repositories or upload zipped Power BI projects.
- **Lineage Visualization:** Interactive D3.js graphs showing field lineage, model schema, and relationship matrices.
- **Impact Analysis:** See exactly which reports and visual elements will break if you modify a measure or column.
- **Model Diffing:** Compare two semantic models to track changes across versions.
- **AI-Powered Explanations:** Automatically translate complex DAX into plain business language (requires Gemini API key).

## Installation and Deployment

### 1. Local Setup (Development)

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.x](https://www.python.org/)
- Git

**Steps:**
1. Clone this repository:
   ```bash
   git clone https://github.com/skhan-data/bi-semantic-explorer.git
   cd bi-semantic-explorer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### 2. Company Server Deployment (Production)

To run this continuously on an internal Windows or Linux VM:

1. Build the production application:
   ```bash
   npm run build
   ```
2. Run the server using PM2 (or similar process manager):
   ```bash
   npm install -g pm2
   pm2 start "npx tsx server.ts" --name "pbi-explorer"
   pm2 save
   ```

### 3. Docker Deployment (Recommended for Cloud)

We provide a `Dockerfile` that packages Node.js, Python, Git, and the application together. This is the easiest way to deploy to platforms like DigitalOcean App Platform, Render, or Azure Container Apps.

```bash
# Build the image
docker build -t bi-semantic-explorer .

# Run the container
docker run -p 3000:3000 bi-semantic-explorer
```

## How It Works

The application uses a **React (Vite)** frontend and an **Express (Node.js)** backend. 
When a user uploads a `.zip` or clones a Git repository, the Node.js backend saves it temporarily and triggers the `pbi_extractor.py` Python script. This script recursively scans the files, extracts TMDL/BIM metadata, resolves measure dependencies, and returns a clean JSON structure to the frontend for visualization.

## Enabling AI Features (Optional)

To enable AI-generated DAX explanations:
1. Get a [Gemini API Key](https://aistudio.google.com/app/apikey).
2. Create a `.env` file in the project root:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the server.
