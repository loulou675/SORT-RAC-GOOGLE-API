const MODEL = 'gemini-3.5-flash-lite'
const MAX_BASE64_LENGTH = 5 * 1024 * 1024

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return response.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server' })
  }

  const body = typeof request.body === 'string' ? safeJson(request.body) : request.body
  const dataUrl = body?.imageDataUrl
  const match = typeof dataUrl === 'string'
    ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
    : null

  if (!match) {
    return response.status(400).json({ error: 'Send one JPEG, PNG or WEBP image as imageDataUrl' })
  }

  const mimeType = match[1]
  const imageData = match[2]
  if (imageData.length > MAX_BASE64_LENGTH) {
    return response.status(413).json({ error: 'Image is too large after compression' })
  }

  const catalogue = Array.isArray(body?.catalogue) ? body.catalogue : []
  const prompt = buildPrompt(catalogue)

  let googleResponse
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
              kind: { type: 'string', enum: ['item', 'material', 'uncertain'] },
              item_code: { type: 'string' },
              material_code: {
                type: 'string',
                enum: ['plastic', 'metal', 'paper_cardboard', 'organic', 'glass', 'electronic_battery', 'landfill', 'mixed_uncertain'],
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
          temperature: 0.1,
          maxOutputTokens: 420,
        },
      }),
    })
  } catch (error) {
    return response.status(502).json({ error: 'Google API request failed', detail: String(error) })
  }

  const payload = await googleResponse.json().catch(() => ({}))
  if (!googleResponse.ok) {
    return response.status(googleResponse.status >= 500 ? 502 : googleResponse.status).json({
      error: payload?.error?.message ?? 'Google API returned an error',
    })
  }

  const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text
  const parsed = safeJson(text)
  if (!parsed || typeof parsed !== 'object') {
    return response.status(502).json({ error: 'Google API returned an unreadable result' })
  }

  const allowedCodes = new Set(catalogue.map((item) => item?.code).filter(Boolean))
  const confidence = clampNumber(parsed.confidence)
  const itemCode = allowedCodes.has(parsed.item_code) && confidence >= 0.58 ? parsed.item_code : undefined
  const materialCode = normalizeMaterial(parsed.material_code)

  return response.status(200).json({
    kind: itemCode ? 'item' : 'material',
    itemCode,
    materialCode: itemCode ? undefined : materialCode,
    confidence,
    observedLabel: String(parsed.observed_label ?? 'Unknown item'),
    materialLabel: String(parsed.material_label ?? materialCode),
    condition: normalizeCondition(parsed.condition),
    parts: normalizeParts(parsed.parts),
    reason: String(parsed.reason ?? 'The image was classified using Google Gemini.'),
  })
}

function buildPrompt(catalogue) {
  const items = catalogue
    .filter((item) => item && typeof item.code === 'string')
    .map((item) => `${item.code}: ${item.name} | material=${item.material ?? 'unknown'} | category=${item.category} | aliases=${(item.aliases ?? []).join(', ')}`)
    .join('\n')

  return `Analyse this whole image like a visual search and OCR assistant for a local waste-sorting app.

Read visible packaging text when it helps distinguish the object, for example eye-drop bottles, medicine containers, cream tubes, food packaging, or cleaning products. Identify the main object even when it is not centered in the image. Do not require a crop or a guide box.

Choose kind "item" only when the image clearly matches exactly one item in the catalogue and return its exact item_code. Otherwise choose kind "material" and return the broad material. Choose "uncertain" only when no safe material can be inferred.

Always return:
- observed_label: the plain-language name you can actually see or read.
- material_label: the most specific visible material or material combination.
- condition: clean, dirty, wet, contains_food_or_liquid, empty, or unknown. Use unknown when the photo cannot support the claim; never assume clean from appearance alone.
- parts: each separate visible part that could need a different disposal route, such as a lid, pump, straw, cap, paper sleeve, battery, liquid, or food. Do not invent hidden parts. Return [] when there are no clear separate parts.
- reason: one short evidence-based explanation.

Safety rules:
- Food or edible leftovers are organic; do not label them as disposable cutlery just because a utensil is visible nearby.
- A spoon, fork, knife or other utensil is disposable_cutlery only when it is the main object being scanned.
- Cosmetic containers with product residue or parts that cannot be cleaned are cosmetic containers and should not be treated as clean plastic.
- Batteries, electronics, chemicals, medicine, medical items and sharp objects require special handling or a cautious material result.
- Cat litter or animal faeces are not ordinary food waste; use the catalogue item when available and prefer a cautious non-recycling result.
- Eye-drop bottles, medicine bottles, cream tubes and other healthcare packaging must not be treated as ordinary clean plastic when residue or medication may remain.
- If several unrelated objects are visible, lower confidence and prefer material or uncertain.

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
  const allowed = new Set(['plastic', 'metal', 'paper_cardboard', 'organic', 'glass', 'electronic_battery', 'landfill', 'mixed_uncertain'])
  return allowed.has(value) ? value : 'mixed_uncertain'
}

function normalizeCondition(value) {
  const allowed = new Set(['clean', 'dirty', 'wet', 'contains_food_or_liquid', 'empty', 'unknown'])
  return allowed.has(value) ? value : 'unknown'
}

function normalizeParts(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((part) => part && typeof part.name === 'string')
    .slice(0, 8)
    .map((part) => ({
      name: String(part.name).trim().slice(0, 100),
      material: String(part.material ?? 'Unknown material').trim().slice(0, 100),
      condition: normalizeCondition(part.condition),
      confidence: clampNumber(part.confidence),
    }))
}
