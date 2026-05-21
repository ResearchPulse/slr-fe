# Paper Import API Documentation

This document describes the API endpoints for importing bibliographic records from various sources into a project's paper pool.

---

## 1. Import from DOI
Resolves a single paper's metadata using its Digital Object Identifier (DOI) via the Crossref API and imports it.

- **URL:** `POST /api/papers/import/doi`
- **Authentication:** Required (Bearer Token)
- **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `doi` | `string` | Yes | The DOI of the paper to import (e.g., `10.1145/3313831.3376227`). |
| `searchSourceId` | `Guid?` | No | Optional ID of the `SearchSource` (e.g., Scopus, PubMed) to associate with this paper. |
| `projectId` | `Guid` | Yes | The ID of the project where the paper will be imported. |

**Example:**
```json
{
  "doi": "10.1145/3313831.3376227",
  "searchSourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "projectId": "771e355c-2234-4d6d-b873-195616f73188"
}
```

---

## 2. Import from Crossref API
Performs a search on the Crossref API using various query parameters and imports all matching results.

- **URL:** `POST /api/papers/import/cross-ref`
- **Authentication:** Required (Bearer Token)
- **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `query` | `object` | Yes | Crossref search parameters (see below). |
| `searchSourceId` | `Guid?` | No | Optional ID of the `SearchSource` to associate with these papers. |
| `projectId` | `Guid` | Yes | The ID of the project where the papers will be imported. |

#### Query Object (`CrossrefQueryParameters`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `query` | `string` | General search query. |
| `queryAuthor` | `string` | Search by author name. |
| `queryTitle` | `string` | Search by title keywords. |
| `rows` | `int?` | Number of results to return (max 1000). |
| `offset` | `int?` | Number of results to skip for pagination. |
| `sort` | `string` | Field to sort by (e.g., `published`, `score`). |
| `order` | `string` | Sort order (`asc` or `desc`). |

**Example:**
```json
{
  "query": {
    "query": "Systematic Review",
    "queryAuthor": "Kitchenham",
    "rows": 20
  },
  "searchSourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "projectId": "771e355c-2234-4d6d-b873-195616f73188"
}
```

---

## Response Format
Both endpoints return a standard `ApiResponse` wrapping a `RisImportResultDto`.

### Success Response (`200 OK`)
```json
{
  "isSuccess": true,
  "message": "Successfully imported ... records.",
  "data": {
    "importBatchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "totalRecords": 20,
    "importedRecords": 18,
    "duplicateRecords": 2,
    "skippedRecords": 0,
    "updatedRecords": 0,
    "errors": [],
    "importedPaperIds": [
      "771e355c-2234-4d6d-b873-195616f73188",
      ...
    ]
  }
}
```

### Response Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `importBatchId` | `Guid?` | The ID of the created import batch for tracking. |
| `totalRecords` | `int` | Total number of records found/processed. |
| `importedRecords` | `int` | Number of new papers successfully created. |
| `duplicateRecords` | `int` | Number of papers identified as duplicates within the project. |
| `errors` | `string[]` | List of error messages for any failed records. |
| `importedPaperIds` | `Guid[]` | List of IDs for the newly imported papers. |
