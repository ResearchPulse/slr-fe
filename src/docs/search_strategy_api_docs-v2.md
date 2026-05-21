# Search Strategy & AI API Documentation

This document describes the API endpoints for managing search sources and generating AI-powered search strategies.

## Common Response Structure
All responses follow the standard `ApiResponse<T>` format defined in `Shared/Shared/Models/ApiResponse.cs`:

```json
{
  "isSuccess": boolean,
  "message": "string",
  "data": T,
  "errors": [
    {
      "code": "string",
      "message": "string"
    }
  ]
}
```

---

## 1. AI PICOC Analysis

### `POST /api/ai/projects/{projectId}/analyze-picoc`
Transforms raw PICOC descriptions into structured keyword lists and a database-specific Boolean search query.

**Path Parameters:**
- `projectId` (Guid): The ID of the project.

**Request Body (`PicocAnalysisRequest`):**
```json
{
  "searchSourceId": "uuid?", // Optional: ID of the target database to adapt the query syntax
  "population": "string",
  "intervention": "string",
  "comparator": "string",
  "outcome": "string",
  "context": "string"
}
```

**Success Response Data (`PicocAnalysisResponse`):**
```json
{
  "population": ["term1", "term2"],
  "intervention": ["term1", "term2"],
  "comparison": ["term1", "term2"],
  "outcome": ["term1", "term2"],
  "context": ["term1", "term2"],
  "generatedQuery": "string" // Boolean search query adapted for the source syntax
}
```

---

## 2. Search Sources Management

### `GET /api/projects/{projectId}/sources`
Retrieves all search sources associated with a project, including their current strategies and base URLs.

**Path Parameters:**
- `projectId` (Guid): The ID of the project.

**Success Response Data (`List<SearchSourceDto>`):**
```json
[
  {
    "sourceId": "uuid",
    "masterSourceId": "uuid?",
    "projectId": "uuid",
    "name": "string",
    "url": "string", // Base URL from MasterSearchSources
    "strategies": [
      {
        "id": "uuid",
        "query": "string",
        "fields": ["Title", "Abstract"],
        "filters": {
          "yearFrom": 2010,
          "yearTo": 2024,
          "language": "English",
          "studyType": "RCT"
        },
        "dateSearched": "ISO8601 string",
        "version": "string",
        "notes": "string"
      }
    ]
  }
]
```

---

### `POST /api/search-sources`
Adds a single search source or updates an existing one. If a `sourceId` is provided and exists, the source will be updated; otherwise, a new source will be created. This endpoint also handles nested strategies.

**Request Body (`SearchSourceDto`):**
```json
{
  "sourceId": "uuid?", // Optional for creation, required for update
  "masterSourceId": "uuid?", // Optional: Reference to a master database (Scopus, PubMed, etc.)
  "projectId": "uuid",
  "name": "string",
  "strategies": [
    {
      "id": "uuid?", // Optional for creation, required for update
      "query": "string",
      "fields": ["string"],
      "filters": {
        "yearFrom": 2010,
        "yearTo": 2024,
        "language": "string",
        "studyType": "string"
      },
      "dateSearched": "ISO8601 string",
      "version": "string",
      "notes": "string"
    }
  ]
}
```

**Success Response Data:**
The updated/created `SearchSourceDto`.

---

### `PUT /api/search-sources/{sourceId}/strategies`
Updates the list of search strategies for a specific search source. This endpoint synchronizes the list by adding new strategies, updating existing ones, and removing strategies that are no longer in the list.

**Path Parameters:**
- `sourceId` (Guid): The ID of the search source.

**Request Body (`List<SearchStrategyDto>`):**
```json
[
  {
    "id": "uuid?", // Optional for creation, required for update
    "query": "string",
    "fields": ["string"],
    "filters": { ... },
    "dateSearched": "ISO8601 string",
    "version": "string",
    "notes": "string"
  }
]
```

**Success Response Data:**
The updated `SearchSourceDto` containing the synchronized strategies.

---

### `POST /api/search-sources/bulk`
Bulk upserts search sources and their nested strategies. Existing records are updated; new records are created.

**Request Body (`List<SearchSourceDto>`):**
Same structure as the response data above (omitting `sourceId` and strategy `id` for new items).

**Success Response Data:**
The updated/created `List<SearchSourceDto>`.

---

## Data Structures

### `SearchFiltersDto`
```json
{
  "yearFrom": number?,
  "yearTo": number?,
  "language": "string?",
  "studyType": "string?"
}
```
