# SỌRT RÁC Google API test

This is a completely independent prototype next to the original SORT RÁC app.
It does not load, import or deploy the original ONNX models.

## How it works

- React, TypeScript, Vite and React Router provide the app UI.
- The camera and upload flows send one compressed image at a time to
  `/api/analyze-image`.
- The Vercel serverless function calls Google's Gemini image API with a
  server-side `GEMINI_API_KEY`.
- Gemini returns structured JSON constrained to the waste catalogue bundled in
  this project.
- The local disposal rules decide the final bin and guidance. Google never
  decides the bin by itself.
- Uncertain recognition returns broad-material guidance or asks for manual
  correction instead of inventing a precise item.

The upload is resized and re-encoded as JPEG in the browser before it is sent,
which removes the original image metadata such as GPS location.

## Local setup

Use Node.js 22 or newer. From this folder:

```bash
pnpm install
cp .env.example .env.local
```

Put your Google key in `.env.local`:

```text
GEMINI_API_KEY=your_key_here
```

Keep this key server-side. Do not rename it to `VITE_GEMINI_API_KEY` and do not
commit `.env.local`.

Run the complete local app, including the API route:

```bash
pnpm dev --host 127.0.0.1 --port 5186
```

On macOS, you can also double-click `START_GOOGLE_API.command`. It asks for
the key in a hidden-input dialog, starts the same server automatically and
opens `http://127.0.0.1:5186/`.

The Vite dev server includes a local adapter for `/api/analyze-image`, so no
Vercel CLI login is needed for local testing. Vercel uses the real serverless
function in `api/analyze-image.js` after deployment.

## Environment variables

```text
GEMINI_API_KEY=
VITE_USE_MOCK_VISION=false
VITE_CAMERA_START_TIMEOUT_MS=12000
VITE_RESULT_FEEDBACK=false
VITE_FEEDBACK_AUTO_UPLOAD=false
```

Set `VITE_USE_MOCK_VISION=true` when developing the UI without making Google
requests. This project intentionally does not inherit the original project's
Supabase variables or training database.

## Build and tests

```bash
pnpm typecheck
pnpm build
pnpm test
```

The Vercel function is configured in `vercel.json` with a 60-second timeout and
1024 MB memory. The API accepts JPEG, PNG and WEBP data URLs and rejects input
that is too large before calling Google.

## Deploy to Vercel

1. Create a separate Git repository for this folder, or import this folder as
   its own Vercel project.
2. Set the Vercel build command to `pnpm build` and output directory to `dist`.
3. Add `GEMINI_API_KEY` to the Vercel project's Production environment.
4. Redeploy after adding or changing the variable.

Do not put the API key in the frontend, in Git, or in a `VITE_` variable.

## Safety and cost controls

The endpoint sends a single compressed image per scan and uses the lightweight
`gemini-3.5-flash-lite` model. It validates the response against the local
catalogue and applies conservative confidence thresholds. Before sharing the
prototype publicly, add authentication or rate limiting to protect the API
quota and review Google's current pricing in AI Studio.
