# Backend Integration Requirements: Search Strategy Module

This document outlines the gaps identified between the Frontend (React) implementation and the Backend (.NET) for the **Search Strategy Builder**.

## 1. AI Analysis Endpoint (NEW)

The frontend currently uses mock data to simulate the breakdown of PICOC into keywords. We need a real AI-powered endpoint to perform this analysis.

- **Proposed Endpoint**: `POST /api/ai/projects/{projectId}/analyze-picoc`
- **Purpose**: Transform raw PICOC sentences into structured keyword lists.
- **Request Body**: 
    ```json
    {
      "population": "string",
      "intervention": "string",
      "comparator": "string",
      "outcome": "string",
      "context": "string"
    }
    ```
- **Response Body**:
    ```json
    {
      "population": ["term1", "term2"],
      "intervention": ["term1", "term2"],
      "comparison": ["term1", "term2"],
      "outcome": ["term1", "term2"],
      "context": ["term1", "term2"]
    }
    ```

---

## 2. Data Model Updates (SearchSource & SearchStrategy)

The `SearchSource` entity needs to support persistent storage for search strategies.

### SearchSource Entity
Update the `SearchSource` entity to include a collection of `SearchStrategy`.

### SearchStrategy Entity (New or Nested)
Each source can have one or more strategies (for versioning).

| Field | Type | Description |
| :--- | :--- | :--- |
| **Query** | String (Text) | The final Boolean search string. |
| **Fields** | List<String> | Search fields (Title, Abstract, Keywords, MeSH). |
| **DateSearched** | DateTime? | When the search was performed. |
| **Version** | String | Version tag (e.g., "v1", "v2"). |
| **Notes** | String (Text) | Additional researcher notes. |
| **Filters** | Object/JSON | Structured filters (see below). |

**Filters Structure**:
```json
{
  "yearFrom": 2010,
  "yearTo": 2024,
  "language": "English",
  "studyType": "Randomized Controlled Trial"
}
```

---

## 3. API Logic Updates

### `POST /api/search-sources/bulk`
The bulk upsert logic must be updated to handle the nested `Strategies` collection.

- **Requirement**: When a `SearchSourceDto` is received with a `Strategies` list, the backend should:
    1. Update/Insert the `SearchSource`.
    2. Sync the `SearchStrategy` records (Upsert logic).
    3. Ensure existing strategies are preserved or versioned correctly.

---

## 4. Frontend Reference

**DTOs sent by Frontend:**

```typescript
export interface SearchStrategyDto {
  query: string;
  fields: string[]; 
  filters: {
    yearFrom?: number;
    yearTo?: number;
    language?: string;
    studyType?: string;
  };
  dateSearched?: string;
  version?: string;
  notes?: string;
}

export interface SearchSourceDto {
  sourceId?: string;
  masterSourceId?: string;
  projectId: string;
  name: string;
  strategies?: SearchStrategyDto[];
}
```

---

## ✅ Success Criteria for Backend
- [ ] `POST /api/ai/projects/{projectId}/analyze-picoc` returns structured keywords.
- [ ] `GET /api/projects/{projectId}/sources` returns sources including their `Strategies`.
- [ ] `POST /api/search-sources/bulk` correctly persists nested strategy data.
