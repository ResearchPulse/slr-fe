Viewed PrismaReportController.cs:77-102
Viewed PrismaReportController.cs:90-111

I've created the API documentation for the `DownloadPrismaFlowDiagram` endpoint. This documentation covers the endpoint details, request parameters, response types, and the technical mapping of data to the Word template.

### API Documentation: PRISMA Flow Diagram Download

**Endpoint**: `GET /api/review-processes/{reviewProcessId}/prisma-report/download`

**Description**:
Generates a PRISMA 2020 flow diagram document (`.docx`) populated with the latest available data for a specific review process. This endpoint retrieves the most recent report, injects the values into a predefined Word template, and returns the result as a downloadable file.

#### Request Information
- **Method**: `GET`
- **Route**: `api/review-processes/{reviewProcessId}/prisma-report/download`
- **Authentication**: Required (JWT)
- **Permissions**: Project Member/Leader (depending on system policy)

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reviewProcessId` | `Guid` | Yes | The ID of the review process to export. |

#### Responses
| Status Code | Description | Content Type |
| :--- | :--- | :--- |
| `200 OK` | Success. Returns the filled `.docx` file. | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `404 Not Found` | No PRISMA report has been generated for this process yet. | `application/json` |
| `500 Internal Error` | Template file missing or server-side processing error. | `application/json` |

#### Template Placeholder Reference
The document is filled by replacing the following "merge tags" in the template. Ensure your template (`PRISMA_2020_flow_diagram_new_SRs_v1.docx`) contains these tags exactly:

| Placeholder | Data Source | Description |
| :--- | :--- | :--- |
| `{{RecordsIdentified}}` | Total Identified | Sum of all records imported from all sources. |
| `{{IdentifiedBreakdown}}` | Breakdown | List of sources and their respective counts. |
| `{{DuplicateRecordsRemoved}}` | Duplicates | Number of records removed before screening. |
| `{{RecordsScreened}}` | Screening Phase | Total unique records that entered screening. |
| `{{RecordsExcluded}}` | Screening Excluded | Number of records excluded at the Title/Abstract phase. |
| `{{ExclusionReasonsTA}}` | TA Reasons | List of exclusion reasons (Title/Abstract phase). |
| `{{ReportsSoughtForRetrieval}}` | Retrieval Phase | Records remaining after screening. |
| `{{ReportsNotRetrieved}}` | Not Retrieved | Records where full-text could not be obtained. |
| `{{ReportsAssessed}}` | Eligibility Phase | Records that moved to full-text eligibility check. |
| `{{ReportsExcludedFT}}` | FT Excluded | Records excluded after full-text review. |
| `{{ExclusionReasonsFT}}` | FT Reasons | List of exclusion reasons (Full-Text phase). |
| `{{StudiesIncluded}}` | Final Included | Total number of studies included in the review. |

> [!TIP]
> The system handles multi-line replacements for `Breakdown` and `Reasons` tags by automatically inserting Word line breaks. You don't need to add extra spacing in the template boxes.

> [!NOTE]
> I noticed the return type in your controller was `ActionResult<ApiResponse<byte[]>>` while returning a `File()` result. I have updated the controller to use `IActionResult` to properly support file streaming and ensure correct Swagger/OpenAPI documentation generation.

render_diffs(file:///d:/Capstone-project/be/SRSS/SRSS.IAM/SRSS.IAM.API/Controllers/PrismaReportController.cs)