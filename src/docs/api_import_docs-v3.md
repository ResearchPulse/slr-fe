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
| `query` | `string` | General keyword search across all fields. |
| `queryAuthor` | `string` | Search in author given/family names. |
| `queryTitle` | `string` | Search in title fields. |
| `queryBibliographic` | `string` | Search in bibliographic fields (title, authors, year, etc.). |
| `queryAffiliation` | `string` | Search in contributor affiliations. |
| `queryContainerTitle` | `string` | Search in journal or book titles. |
| `queryPublisherName`| `string` | Search in publisher names. |
| `rows` | `int?` | Number of results to return (max 1000). |
| `offset` | `int?` | Number of results to skip (max 10,000). |
| `cursor` | `string` | Cursor for deep pagination (start with `*`). See [Pagination & Deep Paging](#pagination--deep-paging). |
| `sort` | `string` | Field to sort by (e.g., `published`, `is-referenced-by-count`, `score`). |
| `order` | `string` | Sort order (`asc` or `desc`). |
| `filter` | `string` | Comma-separated filters (e.g., `type:journal-article,from-pub-date:2022`). |
| `select` | `string` | Comma-separated list of top-level fields to return. |
| `mailto` | `string` | Contact email for the "polite pool" (higher rate limits). |


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

---

# Works API (Crossref Proxy)

These endpoints provide direct access to the Crossref API, allowing for searching and retrieving detailed metadata for academic works.

---

## 3. Query Works
Searches for academic works using Crossref query parameters.

- **URL:** `GET /api/works`
- **Authentication:** Not Required (as per controller code, though usually restricted in production)
- **Content-Type:** `application/json`

### Query Parameters (`CrossrefQueryParameters`)
Passed as standard URL query string parameters.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `query` | `string` | General search query keywords. |
| `queryAuthor` | `string` | Search in author given/family names. |
| `queryTitle` | `string` | Search in title fields. |
| `queryBibliographic`| `string` | Search in bibliographic metadata. |
| `rows` | `int` | Number of results to return (max 1000). |
| `offset` | `int` | Number of results to skip. |
| `cursor` | `string` | Cursor for deep pagination (start with `*`). |
| `sort` | `string` | Field to sort by (e.g., is-referenced-by-count, issued, published, references-count,relevance,score). |
| `order` | `string` | Sort order (`asc`, `desc`). |
| `filter` | `string` | Comma-separated filters. |
| `select` | `string` | Comma-separated list of fields to include. |
| `mailto` | `string` | Contact email for polite pool access. |


### Pagination & Deep Paging

The API supports two methods for navigating through search results:

#### A. Basic Offset (Small result sets)
Use `offset` for simple navigation through the first 10,000 results.
- **Example**: `GET /api/works?query=AI&rows=20&offset=40` (Retrieves page 3).

#### B. Cursors (Large result sets - Recommended)
For retrieving more than 10,000 results or for faster processing, use **Cursors**.
1. **Initialize**: Set `cursor=*` in your first request.
2. **Next Page**: The response will contain a `next-cursor` field (in `data.nextCursor`).
3. **Iterate**: Use this `next-cursor` value in the `cursor` parameter of your next request.
4. **Terminate**: Stop when the number of returned `items` is less than your `rows` count.

**Example Cursor Flow:**
1. `GET /api/works?query=systematic&rows=100&cursor=*`
2. Response contains `nextCursor: "AoJ4v...=="`
3. `GET /api/works?query=systematic&rows=100&cursor=AoJ4v...=="`

**Example:**
`GET /api/works?query=Machine+Learning&rows=5`

### Success Response (`200 OK`)
Returns an `ApiResponse` wrapping a `CrossrefMessageList<CrossrefWorkDto>`.

---

## 4. Get Work Detail
Retrieves the full metadata for a specific work using its DOI.

- **URL:** `GET /api/works/{doi}`
- **Authentication:** Not Required
- **Content-Type:** `application/json`

### URL Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `doi` | `string` | Yes | The DOI of the work. Supports forward slashes (e.g., `10.1016/j.jbusres.2021.01.001`). |

**Example:**
`GET /api/works/10.1016/j.jbusres.2021.01.001`

### Success Response (`200 OK`)
Returns an `ApiResponse` wrapping a `CrossrefWorkDto`.

The `CrossrefWorkDto` now contains full bibliographic details including:
- **Core**: `DOI`, `title`, `author` (with ORCID and affiliation), `publisher`, `type`.
- **Publication**: `volume`, `issue`, `page`, `container-title`, `abstract`, `language`.
- **Dates**: `published`, `issued`, `created`, `deposited`, `indexed`.
- **Metrics**: `is-referenced-by-count`, `references-count`.
- **Links**: `link` (full-text URLs), `license`, `resource`.
- **Context**: `funder`, `event` (for conferences), `subject` (keywords).
