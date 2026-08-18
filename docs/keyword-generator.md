# Keyword Generator API

## `POST /api/v1/seo/keyword-generator`

Generates a comprehensive list of Arabic SEO keywords tailored to a specific project. The keywords are AI-generated using the project's site settings, hero section headline, and the titles of the last 10 published articles.

---

## Request

### Headers

| Header         | Value              | Required |
| -------------- | ------------------ | -------- |
| `Content-Type` | `application/json` | ✅ Yes   |

### Body

```json
{
  "projectId": "string"
}
```

| Field       | Type     | Required | Description                                      |
| ----------- | -------- | -------- | ------------------------------------------------ |
| `projectId` | `string` | ✅ Yes   | The unique ID of the project to generate keywords for |

---

## Responses

### `200 OK` — Keywords generated successfully

```json
{
  "success": true,
  "message": "SEO keywords generated successfully.",
  "data": {
    "keywords": [
      "قهوة سعودية",
      "أفضل مقهى في الرياض",
      "قهوة عربية أصيلة",
      "قهوة الرياض",
      "...more keywords"
    ]
  }
}
```

| Field            | Type       | Description                                        |
| ---------------- | ---------- | -------------------------------------------------- |
| `success`        | `boolean`  | Always `true` on success                           |
| `message`        | `string`   | Human-readable status message                      |
| `data.keywords`  | `string[]` | Deduplicated list of Arabic SEO keywords           |

The keywords array includes:
- **Primary keywords** – high-volume, core topic keywords
- **Secondary keywords** – related but slightly less competitive terms
- **Long-tail keywords** – specific multi-word phrases that reflect real user searches
- **Semantic/related keywords** – synonyms, related concepts, and contextually relevant terms

All keywords target Arabic-speaking users in Saudi Arabia and are returned in Arabic.

---

### `400 Bad Request` — Missing or invalid `projectId`

```json
{
  "success": false,
  "message": "projectId is required."
}
```

### `404 Not Found` — Project does not exist

```json
{
  "success": false,
  "message": "Project not found."
}
```

### `500 Internal Server Error` — Unexpected server error

```json
{
  "success": false,
  "message": "Internal server error."
}
```

### `502 Bad Gateway` — AI returned an unexpected response

```json
{
  "success": false,
  "message": "OpenAI returned an unexpected response."
}
```

---

## Context Used for Generation

The AI prompt is built from data fetched from the project's database records:

| Source           | Fields used                                        |
| ---------------- | -------------------------------------------------- |
| `SiteSettings`   | `siteTitle`, `siteDescription`, `siteKeywords`     |
| `HeroSection`    | `headline`                                         |
| `Article` (×10)  | `title` — last 10 articles with status `PUBLISHED` |

All fields are optional; the AI gracefully handles missing data.

---

## Example (JavaScript / fetch)

```js
const response = await fetch("https://your-api-domain.com/api/v1/seo/keyword-generator", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    projectId: "clx1abc23def456",
  }),
});

const result = await response.json();

if (result.success) {
  console.log("Generated keywords:", result.data.keywords);
} else {
  console.error("Error:", result.message);
}
```

## Example (Axios)

```js
import axios from "axios";

const { data } = await axios.post("/api/v1/seo/keyword-generator", {
  projectId: "clx1abc23def456",
});

console.log(data.data.keywords); // string[]
```

---

## Notes

- This endpoint does **not** require authentication.
- Keyword generation may take a few seconds due to the AI model call — consider showing a loading state in the UI.
- The returned keywords are **deduplicated** before being sent back.
- Keywords are always returned in **Arabic**, regardless of the site language settings.
