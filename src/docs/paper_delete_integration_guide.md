# Paper Delete API Integration Guide

This document provides technical details for integrating the **DeletePaper** API endpoint. This API allows for the soft-deletion of bibliographic records (papers) within the Systematic Review Support System.

## 1. Basic Info
- **Method**: `DELETE`
- **Route**: `/api/papers/{paperId}`
- **Purpose**: Marks a paper as deleted with a mandatory reason for audit and compliance (PRISMA).
- **Authentication**: Required (JWT Bearer Token).

## 2. Request Details

### Headers
| Name | Value | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `Bearer <token>` | Yes | Valid JWT token |
| `Content-Type` | `application/json` | Yes | Request body format |

### Path Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `paperId` | `string (GUID)` | Yes | The unique identifier of the paper to delete |

### Request Body (JSON)
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reason` | `string` | Yes | The reason for deleting this paper (e.g., "Irrelevant", "Duplicate", "Incorrect metadata") |

#### TypeScript Interface
```typescript
export interface DeletePaperRequest {
  /**
   * The reason for deleting the paper. 
   * This is stored for audit purposes and PRISMA reporting.
   */
  reason: string;
}
```

## 3. Response Details

### Success Response (200 OK)
Returns a standard `ApiResponse` object.

#### TypeScript Interface
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}
```

**Example Response Body**:
```json
{
  "success": true,
  "message": "Paper deleted successfully.",
  "data": null
}
```

### Error Responses
| Status Code | Description | Payload |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid GUID format or missing required fields. | `ApiResponse` with error details |
| `401 Unauthorized` | Missing or invalid authentication token. | - |
| `404 Not Found` | Paper with the specified ID does not exist. | `ApiResponse` with message "Paper with ID ... not found." |
| `500 Internal Error` | Unexpected server-side failure. | `ApiResponse` with generic error message |

---

## 4. Business Logic Summary

- **Soft Delete Implementation**: This API **does not permanently remove** the paper from the database. It sets `IsDeleted = true` and records the `DeleteReason`.
- **Audit Tracking**: The `ModifiedAt` timestamp is automatically updated to the current UTC time.
- **PRISMA Compliance**: Capturing the reason for deletion is critical for PRISMA flow diagrams (e.g., "Records excluded for [Reason]").
- **Visibility**: Once deleted, the paper will be hidden from standard list views (Project Paper Pool, Screening lists) by default.

---

## 5. Frontend Integration Notes

### When to call this API
- When a user manually identifies a paper as invalid or out of scope outside of the formal screening process.
- To handle "manual deduplication" where a user spots a duplicate that the system missed.

### Common Pitfalls
- **Empty Reasons**: While the backend might accept an empty string, UI should enforce a minimum length for meaningful audits.
- **Optimistic UI**: If using optimistic updates, ensure you remove the item from the local state immediately, but provide a way to "Undo" or revert if the API fails.

### Suggested Loading/Error Handling
1. Show a confirmation modal asking for the **Delete Reason**.
2. Trigger the `DELETE` request and show a loading spinner on the "Confirm" button.
3. On success:
   - Remove the paper from the local list.
   - Show a success toast message.
4. On failure:
   - Show an error toast with the message from the `ApiResponse`.
   - Keep the item in the list.

---

## 6. Ready-to-Use FE Code

### TypeScript Definition
```typescript
/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Request payload for deleting a paper
 */
export interface DeletePaperRequest {
  reason: string;
}
```

### Example Service Implementation (using Axios)
```typescript
import axios from 'axios';

const API_BASE_URL = 'https://api.yourdomain.com/api';

/**
 * Soft deletes a paper with a given reason
 * @param paperId The GUID of the paper
 * @param reason Why the paper is being deleted
 */
export const deletePaper = async (paperId: string, reason: string): Promise<ApiResponse> => {
  const payload: DeletePaperRequest = { reason };
  
  const response = await axios.delete<ApiResponse>(`${API_BASE_URL}/papers/${paperId}`, {
    data: payload // Axios DELETE body is passed in the 'data' property of config
  });
  
  return response.data;
};

// --- Usage in Component ---
try {
  const result = await deletePaper('550e8400-e29b-41d4-a716-446655440000', 'Duplicate of paper #123');
  if (result.success) {
    // Update local state / notify user
  }
} catch (error) {
  // Handle 404 or validation errors
  console.error('Failed to delete paper:', error.response?.data?.message || error.message);
}
```
