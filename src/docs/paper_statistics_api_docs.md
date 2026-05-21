# Paper Statistics API Documentation

The Paper Statistics API provides endpoints for analyzing papers within a systematic review project. These endpoints are designed to power dashboards with various visualizations and data quality summaries.

## Base Configuration

- **Controller**: `PaperStatisticsController`
- **Base Route**: `/api/project/{projectId}/papers`
- **Response Wrapper**: All successful responses return an `ApiResponse<T>` object.

---

## Shared Filtering

Most endpoints support an optional `PaperStatisticsFilter` as query parameters:

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `yearFrom` | `int?` | Filter papers published from this year (inclusive). |
| `yearTo` | `int?` | Filter papers published up to this year (inclusive). |
| `source` | `string?` | Filter papers by a specific source (e.g., "PubMed", "Scopus"). |

---

## API Endpoints

### 1. Overview Statistics
Get a high-level summary of the paper pool.

- **Endpoint**: `GET /overview`
- **Response Data**: `PaperOverviewDto`

```json
{
  "totalPapers": 1250,
  "totalPapersWithFulltext": 850,
  "fulltextAvailablePercentage": 68.0,
  "totalMissingDoi": 45,
  "totalMissingAbstract": 12
}
```

### 2. Papers Per Year
Get the distribution of papers by publication year.

- **Endpoint**: `GET /by-year`
- **Response Data**: `List<YearCountDto>`

```json
[
  { "year": 2020, "count": 150 },
  { "year": 2021, "count": 200 }
]
```

### 3. Publication Type Distribution
Get the frequency of different publication types (e.g., Journal Article, Conference Paper).

- **Endpoint**: `GET /publication-types`
- **Response Data**: `List<CountItemDto>`

### 4. Top Journals
Get the most frequent journals in the project.

- **Endpoint**: `GET /top-journals`
- **Query Params**: `top` (int, default: 10)
- **Response Data**: `List<CountItemDto>`

### 5. Top Conferences
Get the most frequent conferences.

- **Endpoint**: `GET /top-conferences`
- **Query Params**: `top` (int, default: 10)
- **Response Data**: `List<CountItemDto>`

### 6. Top Publishers
Get the most frequent publishers.

- **Endpoint**: `GET /top-publishers`
- **Query Params**: `top` (int, default: 10)
- **Response Data**: `List<CountItemDto>`

### 7. Language Distribution
Get the frequency of papers by language.

- **Endpoint**: `GET /languages`
- **Response Data**: `List<CountItemDto>`

### 8. Fulltext Status Distribution
Get the distribution of papers by their fulltext retrieval status.

- **Endpoint**: `GET /fulltext-status`
- **Response Data**: `List<StatusCountItemDto>`

```json
[
  { "status": 1, "label": "Retrieved", "count": 850 },
  { "status": 2, "label": "NotRetrieved", "count": 400 }
]
```

### 9. Top Keywords
Get the most frequent keywords. Keywords are extracted from the comma/semicolon-separated list, trimmed, and normalized to lowercase.

- **Endpoint**: `GET /top-keywords`
- **Query Params**: `top` (int, default: 20)
- **Response Data**: `List<CountItemDto>`

### 10. Data Quality Metrics
Get counts of missing critical metadata fields.

- **Endpoint**: `GET /data-quality`
- **Response Data**: `DataQualityDto`

```json
{
  "missingDoiCount": 45,
  "missingAbstractCount": 12,
  "missingAuthorsCount": 5,
  "missingYearCount": 8
}
```

---

## Data Models (DTOs)

### PaperOverviewDto
- `totalPapers` (int)
- `totalPapersWithFulltext` (int)
- `fulltextAvailablePercentage` (double)
- `totalMissingDoi` (int)
- `totalMissingAbstract` (int)

### CountItemDto
- `label` (string)
- `count` (int)

### StatusCountItemDto
- `status` (int): Enum integer value.
- `label` (string): Enum string name.
- `count` (int)

### YearCountDto
- `year` (int)
- `count` (int)

### DataQualityDto
- `missingDoiCount` (int)
- `missingAbstractCount` (int)
- `missingAuthorsCount` (int)
- `missingYearCount` (int)

---

## Response Wrapper

All successful responses (200 OK) follow this structure:

```json
{
  "isSuccess": true,
  "message": "...",
  "data": { ... },
  "errors": null
}
```
