# API Documentation: Remove PDF Attachment

This endpoint allows for the removal of a PDF attachment from a specific paper record. It clears the PDF metadata in the paper entity and deletes any associated `PaperPdf` records.

## Endpoint Overview

- **Path**: `/api/papers/{paperId}/pdf`
- **Method**: `DELETE`
- **Authentication**: Required (as per project standards)

## Request Parameters

### Path Parameters
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `paperId` | `Guid` | Yes | The unique identifier of the paper to remove the PDF from. |

### Query Parameters
None.

### Request Body
None.

## Response Structure

The API returns a standard `ApiResponse` object.

### Success Response (200 OK)

Returned when the PDF attachment and its metadata are successfully removed.

```json
{
  "isSuccess": true,
  "message": "PDF attachment removed successfully.",
  "errors": null
}
```

### Error Responses

#### 404 Not Found
Returned if the paper ID does not exist.

```json
{
  "isSuccess": false,
  "message": "Paper with ID {paperId} not found.",
  "errors": [
    {
      "code": "NotFound",
      "message": "Paper with ID {paperId} not found."
    }
  ]
}
```

#### 400 Bad Request
Returned if the paper ID is invalid or other validation errors occur.

```json
{
  "isSuccess": false,
  "message": "Validation failed",
  "errors": [
    {
      "code": "InvalidId",
      "message": "The provided paper ID is not a valid Guid."
    }
  ]
}
```

## Business Logic Notes
- Clears `PdfUrl` and `PdfFileName` fields in the `Paper` entity.
- Sets `FullTextRetrievalStatus` to `NotRetrieved` (value: `2`).
- Sets `FullTextAvailable` to `false`.
- Removes all records from the `PaperPdfs` table associated with the given `paperId`.
- Updates the `ModifiedAt` timestamp of the `Paper` entity.
