import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const MAX_BASE64_LENGTH = 5 * 1024 * 1024

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}

export default async function handler(request, response) {
  const handlerStarted = performance.now()
  let googleTotalMs = 0
  const timings = {}
  // Temporary K230 diagnostics: never log the request, photo or API key.
  // The existing board response logger saves this same diagnostic envelope.
  const diagnosticEnabled = request.headers?.['user-agent'] === 'Sort-Rac-K230/1'
  const timingEnabled = diagnosticEnabled && request.headers?.['x-sort-rac-timing'] === '1'
  const diagnosticId = diagnosticEnabled ? randomUUID() : undefined
  let googleDiagnostic = null
  function send(status, result) {
    if (!diagnosticEnabled) return response.status(status).json(result)
    const diagnostic = {
      version: 'k230-google-board-v1', id: diagnosticId,
      model: MODEL, google: googleDiagnostic,
      server: { httpStatus: status, decision: result },
    }
    if (timingEnabled) {
      // Google duration includes outbound network and response-body reading;
      // it is not a measurement of Google's internal inference time alone.
      const total = performance.now() - handlerStarted
      diagnostic.timings = {
        version: 1, ...timings,
        google_total_ms: Math.round(googleTotalMs),
        server_total_ms: Math.round(total),
        server_non_google_ms: Math.round(Math.max(0, total - googleTotalMs)),
      }
    }
    const secret = process.env.GEMINI_API_KEY
    const serialized = JSON.stringify(diagnostic)
    const safe = JSON.parse(secret ? serialized.split(secret).join('<redacted>') : serialized)
    try {
      console.info('SORT_RAC_DIAGNOSTIC ' + JSON.stringify(safe))
    } catch { /* Logging must not affect recognition. */ }
    return response.status(status).json({ ...result, diagnostic: safe })
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return send(405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return send(503, { error: 'GEMINI_API_KEY is not configured on the server' })
  }

  const body = typeof request.body === 'string' ? safeJson(request.body) : request.body
  const dataUrl = body?.imageDataUrl
  const match = typeof dataUrl === 'string'
    ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/)
    : null

  if (!match) {
    return send(400, { error: 'Send one JPEG, PNG, WEBP, HEIC or HEIF image as imageDataUrl' })
  }

  const mimeType = match[1]
  const imageData = match[2]
  if (imageData.length > MAX_BASE64_LENGTH) {
    return send(413, { error: 'Image is too large after compression' })
  }

  const catalogue = Array.isArray(body?.catalogue) ? body.catalogue : []
  const prompt = buildPrompt(catalogue)

  let googleResponse
  const googleStarted = performance.now()
  try {
    googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are a careful waste-item recognition assistant. Never invent an exact item code.' }],
        },
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageData } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['item', 'multiple', 'material', 'uncertain'] },
              item_code: { type: 'string' },
              material_code: {
                type: 'string',
                enum: ['plastic', 'metal', 'paper_cardboard', 'organic', 'glass', 'electronic_battery', 'landfill'],
              },
              material_label: { type: 'string' },
              condition: {
                type: 'string',
                enum: ['clean', 'dirty', 'wet', 'contains_food_or_liquid', 'empty', 'unknown'],
              },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              observed_label: { type: 'string' },
              parts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    item_code: { type: 'string' },
                    material: { type: 'string' },
                    condition: {
                      type: 'string',
                      enum: ['clean', 'dirty', 'wet', 'contains_food_or_liquid', 'empty', 'unknown'],
                    },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                  },
                  required: ['name', 'material', 'condition', 'confidence'],
                },
              },
              reason: { type: 'string' },
            },
            required: ['kind', 'confidence', 'observed_label', 'material_label', 'condition', 'parts', 'reason'],
          },
          thinkingConfig: { thinkingLevel: 'minimal' },
          maxOutputTokens: 320,
        },
      }),
    })
    timings.google_headers_ms = Math.round(performance.now() - googleStarted)
  } catch (error) {
    googleTotalMs = performance.now() - googleStarted
    return send(502, { error: 'Google API request failed', detail: String(error) })
  }

  const bodyStarted = performance.now()
  const payload = await googleResponse.json().catch(() => ({}))
  timings.google_body_ms = Math.round(performance.now() - bodyStarted)
  googleTotalMs = performance.now() - googleStarted
  if (diagnosticEnabled) {
    const rawText = payload?.candidates?.[0]?.content?.parts
      ?.filter((part) => typeof part.text === 'string' && !part.thought)
      .map((part) => part.text).join('\n') ?? ''
    googleDiagnostic = {
      httpStatus: googleResponse.status,
      finishReason: payload?.candidates?.[0]?.finishReason ?? null,
      blockReason: payload?.promptFeedback?.blockReason ?? null,
      rawText: rawText.slice(0, 8192), truncated: rawText.length > 8192,
    }
  }
  if (!googleResponse.ok) {
    return send(googleResponse.status >= 500 ? 502 : googleResponse.status, {
      error: payload?.error?.message ?? 'Google API returned an error',
    })
  }

  const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text
  const parsed = safeJson(text)
  if (!parsed || typeof parsed !== 'object') {
    return send(502, { error: 'Google API returned an unreadable result' })
  }

  const allowedCodes = new Set(catalogue.map((item) => item?.code).filter(Boolean))
  const confidence = clampNumber(parsed.confidence)
  const itemCode = allowedCodes.has(parsed.item_code) && confidence >= 0.58 ? parsed.item_code : undefined
  const materialCode = normalizeMaterial(parsed.material_code)
  const parts = normalizeParts(parsed.parts, allowedCodes)

  if (parsed.kind === 'multiple') {
    const everyObjectRecognised = parts.length >= 2
      && parts.length <= 8
      && parts.every((part) => part.itemCode && part.confidence >= 0.58)
    if (!everyObjectRecognised) {
      return send(422, {
        code: 'MULTIPLE_ITEMS_DETECTED',
        error: 'Every visible object must be recognised before showing multi-object disposal guidance',
      })
    }

    return send(200, {
      kind: 'multiple',
      confidence,
      observedLabel: 'Multiple objects',
      materialLabel: 'Multiple materials',
      condition: 'unknown',
      parts,
      reason: String(parsed.reason ?? 'Multiple objects were identified in the image.'),
    })
  }

  if (
    parsed.kind === 'uncertain'
    || (parsed.kind === 'item' && !itemCode)
    || (parsed.kind === 'material' && !materialCode)
  ) {
    return send(422, {
      code: 'ITEM_AMBIGUOUS',
      error: 'The image could not be identified with enough confidence',
    })
  }

  return send(200, {
    kind: itemCode ? 'item' : 'material',
    itemCode,
    materialCode: itemCode ? undefined : materialCode,
    confidence,
    observedLabel: String(parsed.observed_label ?? 'Unknown item'),
    materialLabel: String(parsed.material_label ?? materialCode),
    condition: normalizeCondition(parsed.condition),
    parts,
    reason: String(parsed.reason ?? 'The image was classified using Google Gemini.'),
  })
}

function buildPrompt(catalogue) {
  const items = catalogue
    .filter((item) => item && typeof item.code === 'string')
    .map((item) => `${item.code}: ${item.name} | material=${item.material ?? 'unknown'} | category=${item.category} | aliases=${(item.aliases ?? []).join(', ')}`)
    .join('\n')

  return `Analyse this whole image as a visual search and OCR assistant for a local waste-sorting app.

Read visible packaging text before choosing a generic container label. Identify the main object even when it is not centered in the image. Do not require a crop or a guide box. A visible yogurt/yoghurt/Greek-yogurt pot remains yogurt_cup even when opened or partly used; put residue in condition.

First count the separate discardable objects visible in the image. Do not count attached parts of one object, such as a bottle cap or a cup lid, as separate objects.

- Choose kind "item" only when exactly one object is visible and it clearly matches one catalogue item; return its exact item_code.
- Choose kind "multiple" only when two to eight separate objects are visible AND every one can be matched confidently to an exact catalogue item. In parts, return every visible object exactly once, with its exact item_code. Choose uncertain if there are more than eight objects.
- Choose kind "material" only when exactly one object is visible, no exact catalogue item is justified, and a safe broad material is clear.
- Choose kind "uncertain" when the image is unclear, when any of several visible objects cannot be identified exactly, or when you cannot tell whether there are more objects. Never use a guessed item code.

Always return:
- observed_label: the plain-language name you can actually see or read.
- material_label: the most specific visible material or material combination.
- condition: clean, dirty, wet, contains_food_or_liquid, empty, or unknown. Use unknown when the photo cannot support the claim; never assume clean from appearance alone.
- When condition is contains_food_or_liquid, always include a visible part named "Food or liquid" with material "organic" and condition "contains_food_or_liquid". This part must be shown even when the food or liquid is inside the main container.
- For kind "item" or "material", parts are only clearly visible attached parts that need separate disposal, such as a lid, pump, straw, cap, paper sleeve, battery, liquid, or food. Do not invent hidden parts.
- For kind "multiple", parts are the recognised objects themselves and every part must have an exact item_code from the catalogue.
- reason: one concise, object-only description, maximum 14 words. Describe only the waste item, its visible material, condition, and attached parts. Never mention a hand, person, table, floor, background, room, camera angle, position, or any other scene context. For example: "A plastic milk tea cup with a straw and remaining liquid." Never mention the catalogue, item code, model confidence, or matching.

Safety rules:
- Food or edible leftovers are organic; do not label them as disposable cutlery just because a utensil is visible nearby.
- A spoon, fork, knife or other utensil is disposable_cutlery only when it is the main object being scanned.
- Cosmetic containers with product residue or parts that cannot be cleaned are cosmetic containers and should not be treated as clean plastic.
- Batteries, electronics, chemicals, medicine, medical items and sharp objects require special handling or a cautious material result.
- Cat litter or animal faeces are not ordinary food waste; use the catalogue item when available and prefer a cautious non-recycling result.
- Eye-drop bottles, medicine bottles, cream tubes and other healthcare packaging must not be treated as ordinary clean plastic when residue or medication may remain.
- If several unrelated objects are visible but any one cannot be identified exactly, choose uncertain rather than giving a partial result.

Catalogue:
${items}`
}

function safeJson(value) {
  if (typeof value !== 'string') return value && typeof value === 'object' ? value : null
  try {
    return JSON.parse(value.replace(/^```json\s*/i, '').replace(/\s*```$/, ''))
  } catch {
    return null
  }
}

function clampNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0
}

function normalizeMaterial(value) {
  const allowed = new Set(['plastic', 'metal', 'paper_cardboard', 'organic', 'glass', 'electronic_battery', 'landfill'])
  return allowed.has(value) ? value : undefined
}

function normalizeCondition(value) {
  const allowed = new Set(['clean', 'dirty', 'wet', 'contains_food_or_liquid', 'empty', 'unknown'])
  return allowed.has(value) ? value : 'unknown'
}

function normalizeParts(value, allowedCodes) {
  if (!Array.isArray(value)) return []
  return value
    .filter((part) => part && typeof part.name === 'string')
    .map((part) => ({
      name: String(part.name).trim().slice(0, 100),
      itemCode: allowedCodes.has(part.item_code) ? part.item_code : undefined,
      material: String(part.material ?? 'Unknown material').trim().slice(0, 100),
      condition: normalizeCondition(part.condition),
      confidence: clampNumber(part.confidence),
    }))
}
