# Text-to-Video API Research (March 2026)

Practical API usage guide for generating 5-10 second cinematic video clips programmatically.

---

## 1. Runway API (Gen-4.5 / Gen-4 Turbo)

### Authentication

All requests require two headers:
```
Authorization: Bearer $RUNWAYML_API_SECRET
X-Runway-Version: 2024-11-06
```

Get your API key at https://dev.runwayml.com/

### Text-to-Video Generation

**Endpoint:** `POST https://api.dev.runwayml.com/v1/text_to_video`

```bash
curl -X POST https://api.dev.runwayml.com/v1/text_to_video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNWAYML_API_SECRET" \
  -H "X-Runway-Version: 2024-11-06" \
  -d '{
    "model": "gen4.5",
    "promptText": "A cinematic aerial shot of a futuristic city at sunset, flying between glass skyscrapers",
    "ratio": "1280:720",
    "duration": 5
  }'
```

**Request Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | yes | `gen4.5`, `veo3.1`, `veo3.1_fast`, `veo3` |
| `promptText` | string | yes | 1-1000 characters describing the video |
| `ratio` | string | yes | `1280:720` (landscape) or `720:1280` (portrait) |
| `duration` | integer | yes | 2-10 seconds |
| `seed` | integer | no | 0-4294967295 for reproducibility |

**Response:**
```json
{
  "id": "task_xxxxxxxx"
}
```

### Poll for Completion

**Endpoint:** `GET https://api.dev.runwayml.com/v1/tasks/{id}`

```bash
curl -s https://api.dev.runwayml.com/v1/tasks/$TASK_ID \
  -H "Authorization: Bearer $RUNWAYML_API_SECRET" \
  -H "X-Runway-Version: 2024-11-06"
```

**Task status values:** `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`

Poll every 5-10 seconds until `SUCCEEDED`, then extract the video URL from the response.

### Cancel a Task

```bash
curl -X DELETE https://api.dev.runwayml.com/v1/tasks/$TASK_ID \
  -H "Authorization: Bearer $RUNWAYML_API_SECRET" \
  -H "X-Runway-Version: 2024-11-06"
```

### Image-to-Video (more models available)

```bash
curl -X POST https://api.dev.runwayml.com/v1/image_to_video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNWAYML_API_SECRET" \
  -H "X-Runway-Version: 2024-11-06" \
  -d '{
    "model": "gen4_turbo",
    "promptImage": "https://example.com/image.jpg",
    "promptText": "Camera slowly pans right, golden hour lighting",
    "ratio": "1280:720",
    "duration": 5
  }'
```

Image-to-video supports more models: `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3`

### Pricing

Credits cost $0.01 each (purchased at https://dev.runwayml.com/).

| Model | Credits/second |
|-------|---------------|
| Gen-4.5 | 25 |
| Gen-4 Turbo | 5 |
| Gen-3 Alpha | 10-12 |

**Example cost:** 5-second Gen-4 Turbo video = 25 credits = **$0.25**
**Example cost:** 5-second Gen-4.5 video = 125 credits = **$1.25**

### Other Endpoints

Runway also exposes audio APIs (text-to-speech, voice dubbing, sound effects) and an upload endpoint (`POST /v1/uploads`) for providing local files.

---

## 2. Kling AI API

### Signup

1. Go to https://klingai.com/global/dev or https://app.klingai.com/global/dev/api-key
2. Create an account and get your AccessKey + SecretKey
3. New users receive **$1 in free credits**
4. Third-party option (no Kling account needed): https://piapi.ai/kling-api

### Authentication

Kling uses JWT (HS256) authentication. Generate a short-lived token from your AccessKey/SecretKey server-side:

```python
import jwt, time

def generate_kling_token(access_key: str, secret_key: str) -> str:
    now = int(time.time())
    payload = {
        "iss": access_key,
        "exp": now + 1800,  # 30 min expiry
        "nbf": now - 5,
        "iat": now,
    }
    headers = {"alg": "HS256", "typ": "JWT"}
    return jwt.encode(payload, secret_key, algorithm="HS256", headers=headers)
```

Never generate tokens in the browser -- keep AccessKey/SecretKey on your server only.

### Text-to-Video Generation

**Endpoint:** `POST https://api.klingapi.com/v1/videos/text2video`

```bash
curl -X POST https://api.klingapi.com/v1/videos/text2video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KLING_JWT_TOKEN" \
  -d '{
    "model": "kling-v2.6-pro",
    "prompt": "A cinematic tracking shot through a neon-lit Tokyo alley at night, rain falling",
    "negative_prompt": "blurry, distorted, low quality",
    "duration": 5,
    "aspect_ratio": "16:9",
    "mode": "standard"
  }'
```

**Request Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | yes | `kling-v2.6-pro`, `kling-v2.6-std`, `kling-v2.5-turbo`, `kling-video-o1` |
| `prompt` | string | yes | Text description of desired video |
| `negative_prompt` | string | no | Elements to exclude |
| `duration` | number | no | `5` or `10` seconds |
| `aspect_ratio` | string | no | `16:9`, `9:16`, `1:1` |
| `mode` | string | no | `standard` (~30s gen) or `professional` (~60s gen) |

**Response:**
```json
{
  "task_id": "xxxxxxxx"
}
```

### Poll for Completion

```bash
curl -X GET https://api.klingapi.com/v1/videos/$TASK_ID \
  -H "Authorization: Bearer $KLING_JWT_TOKEN"
```

Poll until status indicates completion, then extract the video URL from the response.

### Pricing

- Starter: $6.99/month (660 credits)
- Pro: $25.99/month (3,000 credits)
- Enterprise API packages: ~$4,200 for 30,000 units (90-day validity)

---

## 3. Google Veo (via Gemini API)

The best-documented and most straightforward API. No waitlist.

### Authentication

Get an API key at https://aistudio.google.com/apikey

### Complete Workflow (Text-to-Video)

**Step 1: Start generation**

```bash
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

operation_name=$(curl -s \
  "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "instances": [{
      "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering."
    }]
  }' | jq -r .name)
```

**Step 2: Poll until done**

```bash
while true; do
  status_response=$(curl -s \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    "${BASE_URL}/${operation_name}")

  is_done=$(echo "${status_response}" | jq .done)
  if [ "${is_done}" = "true" ]; then
    break
  fi
  sleep 10
done
```

**Step 3: Download the video**

```bash
video_uri=$(echo "${status_response}" | jq -r \
  '.response.generateVideoResponse.generatedSamples[0].video.uri')

curl -L -o output.mp4 \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  "${video_uri}"
```

### Available Models

| Model | Description |
|-------|-------------|
| `veo-3.1-generate-preview` | Latest, 8s, with audio, 720p/1080p/4K |
| `veo-3.1-fast-generate-preview` | Faster, lower cost |
| `veo-3-generate-preview` | Previous gen |

### Pricing (per second of generated video)

| Model | Standard | Fast |
|-------|----------|------|
| Veo 3.1 (720p/1080p) | $0.40/s | $0.15/s |
| Veo 3.1 (4K) | $0.60/s | $0.35/s |
| Veo 3 | $0.40/s | $0.15/s |
| Veo 2 | $0.35/s | -- |

**Example cost:** 8-second Veo 3.1 Fast (1080p) = **$1.20**

No free tier for Veo models.

---

## 4. Other Cheap/Free Options

### MiniMax Hailuo (Direct API)

```bash
curl -X POST https://api.minimax.io/v1/video_generation \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MiniMax-Hailuo-2.3",
    "prompt": "A man picks up a book, then reads it by the window.",
    "duration": 6,
    "resolution": "1080P"
  }'
```

Generates 6-second 720p videos with cinematic camera movement. Signup at https://platform.minimax.io/

### Replicate (Pay-per-use, many models)

```bash
curl -s -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "<model_version_hash>",
    "input": {
      "prompt": "A cinematic shot of mountains at dawn"
    }
  }'
```

**Cheapest models on Replicate:**
- `wan-video/wan-2.1-t2v-480p` -- very cheap for short 480p clips
- `wan-video/wan-2.2-t2v-fast` -- faster variant
- `pixverse/pixverse-v4` -- ~$0.30 for 5s at 360p

Also hosts premium models: `google/veo-3-fast`, `openai/sora-2`, `kwaivgi/kling-v3-video`, `minimax/hailuo-02`

Signup: https://replicate.com/ (pay-per-use, no subscription required)

### FAL.AI

- **Wan 2.6**: ~$0.05/second (cheapest option found)
- **LTX 2.0**: ~$0.04/second (open source)
- 5-second video = **$0.20-$0.25**
- API docs: https://fal.ai/models

### WaveSpeed AI

- Single API for 600+ models including Kling, Wan, LTX
- No waitlists or geographic restrictions
- https://wavespeed.ai/

---

## Cost Comparison Summary (5-second cinematic clip)

| Provider | Model | Approx Cost | Quality |
|----------|-------|-------------|---------|
| FAL.AI | Wan 2.6 | $0.25 | Good (480-720p) |
| FAL.AI | LTX 2.0 | $0.20 | Decent (open source) |
| Replicate | Wan 2.1 480p | ~$0.15-0.30 | Good for prototyping |
| Replicate | PixVerse v4 | ~$0.30 | Good |
| Runway | Gen-4 Turbo | $0.25 | High (720p) |
| Runway | Gen-4.5 | $1.25 | Very High |
| Kling | v2.6 Standard | ~$0.50-1.00 | High |
| Google Veo | 3.1 Fast | $0.75 | Very High (with audio) |
| Google Veo | 3.1 Standard | $2.00 | Excellent (with audio) |
| MiniMax | Hailuo 2.3 | ~$0.30-0.60 | High (1080p) |

**Best value for cinematic quality:** Runway Gen-4 Turbo ($0.25/5s) or FAL.AI Wan 2.6 ($0.25/5s)
**Best quality regardless of cost:** Google Veo 3.1 (includes generated audio/dialogue)
**Cheapest option:** FAL.AI LTX 2.0 (~$0.20/5s)
