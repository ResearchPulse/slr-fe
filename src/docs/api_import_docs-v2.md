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
| `query.author` | `string` | Search by author name. |
| `query.title` | `string` | Search by title keywords. |
| `rows` | `int` | Number of results to return. |
| `offset` | `int` | Number of results to skip. |
| `sort` | `string` | Field to sort by. |
| `order` | `string` | Sort order (`asc`, `desc`). |

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

using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SRSS.IAM.Services.DTOs.Crossref;

public class CrossrefResponse<T>
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("message-type")]
    public string MessageType { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public T Message { get; set; } = default!;
}

public class CrossrefMessageList<T>
{
    [JsonPropertyName("items-per-page")]
    public int ItemsPerPage { get; set; }

    [JsonPropertyName("query")]
    public CrossrefQueryMeta? Query { get; set; }

    [JsonPropertyName("total-results")]
    public int TotalResults { get; set; }

    [JsonPropertyName("next-cursor")]
    public string? NextCursor { get; set; }

    [JsonPropertyName("items")]
    public List<T> Items { get; set; } = new();
}

public class CrossrefQueryMeta
{
    [JsonPropertyName("start-index")]
    public int StartIndex { get; set; }

    [JsonPropertyName("search-terms")]
    public string? SearchTerms { get; set; }
}

public class CrossrefWorkDto
{
    [JsonPropertyName("DOI")]
    public string Doi { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public List<string> Title { get; set; } = new();

    [JsonPropertyName("author")]
    public List<CrossrefAuthorDto> Author { get; set; } = new();

    [JsonPropertyName("publisher")]
    public string? Publisher { get; set; }

    [JsonPropertyName("is-referenced-by-count")]
    public int IsReferencedByCount { get; set; }

    [JsonPropertyName("created")]
    public CrossrefDateDto? Created { get; set; }

    [JsonPropertyName("published")]
    public CrossrefDateDto? Published { get; set; }

    [JsonPropertyName("license")]
    public List<CrossrefLicenseDto>? License { get; set; }

    [JsonPropertyName("funder")]
    public List<CrossrefFunderDto>? Funder { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }
}

public class CrossrefAuthorDto
{
    [JsonPropertyName("given")]
    public string? Given { get; set; }

    [JsonPropertyName("family")]
    public string? Family { get; set; }

    [JsonPropertyName("ORCID")]
    public string? Orcid { get; set; }

    [JsonPropertyName("authenticated-orcid")]
    public bool? AuthenticatedOrcid { get; set; }

    [JsonPropertyName("sequence")]
    public string? Sequence { get; set; }

    [JsonPropertyName("affiliation")]
    public List<CrossrefAffiliationDto>? Affiliation { get; set; }
}

public class CrossrefAffiliationDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class CrossrefDateDto
{
    [JsonPropertyName("date-parts")]
    public List<List<int>> DateParts { get; set; } = new();

    [JsonPropertyName("date-time")]
    public string? DateTime { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}

public class CrossrefLicenseDto
{
    [JsonPropertyName("URL")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("start")]
    public CrossrefDateDto? Start { get; set; }

    [JsonPropertyName("delay-in-days")]
    public int DelayInDays { get; set; }

    [JsonPropertyName("content-version")]
    public string? ContentVersion { get; set; }
}

public class CrossrefFunderDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("DOI")]
    public string? Doi { get; set; }

    [JsonPropertyName("award")]
    public List<string>? Award { get; set; }

    [JsonPropertyName("doi-asserted-by")]
    public string? DoiAssertedBy { get; set; }
}

public class CrossrefAgencyDto
{
    [JsonPropertyName("DOI")]
    public string Doi { get; set; } = string.Empty;

    [JsonPropertyName("agency")]
    public CrossrefAgencyInfo? Agency { get; set; }
}

public class CrossrefAgencyInfo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;
}

