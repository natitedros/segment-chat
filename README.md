# segment-chat

Segment-Chat is a small demo that combines a web frontend and a FastAPI backend to perform image segmentation using a pretrained HED (Holistically-Nested Edge Detection) model and a chat-style interface. The project originally experimented with an MCP server integration (Dedalus) for orchestrating model/tool calls, and includes optimizations to keep heavy image work local to the backend for low latency.

**Demo Images**

**Repository layout**

- [backend](backend): FastAPI server, HED model integration, inference helpers.
- [frontend](frontend): Vite + React + TypeScript chat UI and upload form.
- [hed_model](backend/hed_model): pretrained HED model artifacts and inference wrappers.

**Quick links**

- Backend main: [backend/main.py](backend/main.py)
- HED inference helpers: [backend/hed_model/hed_inference.py](backend/hed_model/hed_inference.py)
- Frontend entry: [frontend/App.tsx](frontend/App.tsx)
- Chat service: [frontend/services/chatService.ts](frontend/services/chatService.ts)

**Architecture (high level)**

- Frontend: collects a prompt and an image, sends a multipart `POST /chat` request to the backend.
- Backend: receives prompt + image, decodes/uploads the image bytes and runs the HED pipeline locally (no heavy model bytes are embedded in prompts).
- (Optional) MCP: an external MCP server (Dedalus) was used in experiments for orchestrating model + tools, but the production path calls local HED functions directly to avoid latency.

**Backend details**

- Framework: FastAPI. See [backend/main.py](backend/main.py).
- On startup the backend calls `load_hed_model()` (in `hed_inference.py`) to load the Caffe-based pretrained model into memory so inference is fast and avoids re-loading per request.
- The endpoint `POST /chat` accepts a `prompt` and an `image` file. The server reads image bytes and calls the local HED helper `generate_hed_image()` which returns a base64-encoded PNG suitable for serving back to the frontend.
- Key files:
  - [backend/main.py](backend/main.py) — API routes and startup loader.
  - [backend/hed_model/hed_inference.py](backend/hed_model/hed_inference.py) — wrappers around the pretrained model; contains:
    - `load_hed_model()` — loads `deploy.prototxt` and `hed_pretrained_bsds.caffemodel` once on startup.
    - `generate_hed_image(base64_image)` — runs the HED inference and returns an encoded PNG result.

**HED pretrained model**

- Files in `backend/hed_model`:
  - `deploy.prototxt` — network definition.
  - `hed_pretrained_bsds.caffemodel` — pretrained weights (BSDS dataset).
- These are loaded by `load_hed_model()` into memory and used by the inference helpers to avoid repeated disk I/O.

**MCP server (Dedalus) used in experiments**

- The project experimented with the Dedalus MCP client (see traces of `dedalus_labs.AsyncDedalus` and `DedalusRunner` in `backend/main.py`). That flow involved sending a prompt and a large base64 image to the MCP to coordinate tool execution.
- This approach caused timeouts because embedding large base64 images in the model prompt and waiting for a remote orchestrator increases latency and network IO. To improve responsiveness the code now calls local HED functions directly and avoids handing raw image blobs to remote models.

**Frontend technical details**

- Built with Vite + React + TypeScript. Entry points:
  - [frontend/index.tsx](frontend/index.tsx)
  - [frontend/App.tsx](frontend/App.tsx)
- UI components:
  - `ChatInput.tsx` — prompt input and file chooser.
  - `MessageItem.tsx` — displays messages and image attachments.
  - `frontend/services/chatService.ts` — wraps the network call to `POST /chat` using `multipart/form-data`.
- Interaction model: the frontend sends a `FormData` payload with keys `prompt` (string) and `image` (file). The backend returns a JSON response with `text`, `imageAttachment` (base64 PNG) and `mime_type`.

**Run locally (basic)**

Backend (Windows PowerShell, using the provided venv):

```powershell
# from project root
cd backend
.\myenv\Scripts\Activate.ps1
# Run with FastAPI dev runner command used in this repo
fastapi main.py
```

Or run via `uvicorn`:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend (from project root):

```bash
cd frontend
npm install
npm run dev
```

**Performance notes & best practices**

- Do not embed large base64 images in model prompts — it increases token size and causes long remote processing times.
- Keep heavy image processing local (the HED Caffe model is on-disk in `backend/hed_model`). Load the model once at startup via `load_hed_model()` and reuse it for each inference call.
- Use asynchronous FastAPI endpoints (already used in `POST /chat`) to avoid blocking other requests during processing.
- If you must use a remote MCP/orchestration service, prefer passing a lightweight reference (URL or small metadata) instead of the full image bytes, or stream results back with pagination/streaming.
- Consider returning partial results via streaming APIs if segmentation can be chunked.

**Troubleshooting**

- If you see request timeouts originating from embedding images in model calls, check `backend/main.py` for any call that sends the full base64 image to a remote SDK (e.g., `DedalusRunner.run`) and replace it with a local `generate_hed_image()` call.
- If inference fails, verify model files exist in `backend/hed_model` and that `load_hed_model()` ran successfully (look for startup logs).

**Next steps / Improvements**

- Add an optional background task queue (Redis + RQ or Celery) for very large images or batch processing.
- Add an endpoint that returns a direct image URL (store output in an object store) rather than base64 to reduce response sizes on long lists of messages.

If you want, I can:

- add a small health-check endpoint that confirms the HED model is loaded;
- switch the frontend to fetch an image URL instead of base64;
- add basic tests for `hed_inference.py`.

---
