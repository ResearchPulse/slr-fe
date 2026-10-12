# AI Review — Phase 1: Reviewer giao task screening cho AI

## Mục tiêu

AI Agent là trợ lý riêng của Human Reviewer trong Study Selection. Leader giao paper cho Human Reviewers theo workflow hiện có; Reviewer dùng một hay nhiều AI Agent để tham khảo bằng chứng, tự đưa ra screening decision và gửi quyết định của mình theo luồng hiện hành.

> Phạm vi buổi brainstorm: chốt trải nghiệm Reviewer chọn Agent và giao paper đã được giao cho mình thành AI task, Agent trả recommendation/evidence, Reviewer xem và tự quyết định. Cần xác nhận “Phase 1” là đợt MVP đầu hay riêng stage Title/Abstract; tài liệu hiện mô tả cả `TITLE_ABSTRACT` và `FULL_TEXT` để nhóm chọn phạm vi triển khai.

Kết quả Agent không phải screening vote của con người, không đổi trạng thái paper và không tạo conflict chính thức giữa Human Reviewers. Bất đồng giữa AI và Reviewer hoặc giữa các AI được hiển thị để Reviewer cân nhắc; conflict resolution hiện có chỉ dành cho bất đồng Human-vs-Human.

## Phân vai

### Project Leader

- Quản lý project, protocol, criteria và Research Questions.
- Giao paper cho một hoặc nhiều Human Reviewers.
- Theo dõi tiến độ review và nhận quyết định do Reviewer gửi.
- Giải quyết conflict giữa các Human Reviewers theo workflow hiện có.
- Không kết nối Agent hoặc giao screening task cho Agent thay Reviewer.

### Human Reviewer

- Chỉ gửi cho Agent paper đã được giao cho chính mình.
- Kết nối và quản lý Agent riêng trong phạm vi project, xem/rotate token, bật hoặc thu hồi quyền truy cập.
- Gửi một paper cho nhiều Agent; xem trạng thái, recommendation, reasoning và evidence của từng Agent.
- Tự thực hiện screening, so sánh các gợi ý, chốt và gửi quyết định human chính thức.
- Chỉ xem task và token thuộc workspace của mình.

### AI Agent

- Nhận task theo project, reviewer và stage.
- Dùng protocol snapshot tại thời điểm giao task và paper metadata.
- Đọc title/abstract cho `TITLE_ABSTRACT`; đọc full-text Markdown khi stage là `FULL_TEXT` và văn bản đã sẵn sàng.
- Nộp recommendation, reasoning và dữ liệu criteria/evidence.
- Không submit Human screening decision, đổi paper status, sửa protocol, xử lý conflict người-với-người hoặc xem task của Reviewer khác.

## Luồng sử dụng

1. Leader giao paper cho Human Reviewer như hiện tại.
2. Reviewer mở paper được giao và vào **My AI review workspace**.
3. Reviewer kết nối Agent từ catalog; hệ thống tạo token riêng cho tổ hợp project + reviewer + agent.
4. Reviewer chọn một hoặc nhiều Agent rồi giao task ở stage đang làm: Title/Abstract hoặc Full-text.
5. Agent lấy task qua API, đọc đúng stage và protocol snapshot, rồi nộp kết quả.
6. Reviewer theo dõi trạng thái và xem kết quả từng Agent trong panel.
7. Workspace báo nếu các Agent khác nhau và đối chiếu từng recommendation với human decision của Reviewer. Đây chỉ là thông tin hỗ trợ.
8. Reviewer dùng workflow screening hiện có để nộp/chỉnh quyết định human. Leader tiếp tục theo dõi quyết định và xử lý conflict người-với-người.

## Backend/API đã triển khai

Reviewer workspace (Firebase user token, project role `REVIEWER`):

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/api/projects/:projectId/ai-review/agents` | Catalog và Agent kết nối với Reviewer hiện tại |
| `POST` | `/api/projects/:projectId/ai-review/agents` | Kết nối Agent và tạo token reviewer-scoped |
| `GET` | `/api/projects/:projectId/ai-review/agents/:agentId/token` | Xem token hiện tại |
| `POST` | `/api/projects/:projectId/ai-review/agents/:agentId/rotate-token` | Rotate token; token cũ mất hiệu lực |
| `PATCH` | `/api/projects/:projectId/ai-review/agents/:agentId` | Bật/tắt kết nối (tắt là thu hồi khả năng dùng token) |
| `POST` | `/api/projects/:projectId/ai-review/agents/:agentId/tasks` | Giao task cho paper đã giao Reviewer |
| `GET` | `/api/projects/:projectId/ai-review/agents/:agentId/tasks` | Danh sách task của Agent trong workspace Reviewer |
| `DELETE` | `/api/projects/:projectId/ai-review/agents/:agentId/tasks/:taskId` | Xóa task đang chờ của Reviewer |
| `GET` | `/api/projects/:projectId/ai-review/tasks?paperIds=...` | Xem các task/kết quả Agent của Reviewer cho paper |

Task lưu `reviewerId`, `stage`, `instructions` và snapshot RQs/criteria. External Agent API hiện có vẫn dùng token bearer:

- `GET /api/agent/v1/tasks`
- `GET /api/agent/v1/tasks/:taskId`
- `GET /api/agent/v1/tasks/:taskId/markdown`
- `POST /api/agent/v1/tasks/:taskId/result`

Token mới chỉ truy cập task reviewer sở hữu. Token project cũ chỉ đọc task legacy không có owner Reviewer. Kết quả vẫn được lưu tách trong `agents/{agentId}/tasks/{taskId}`. Các mutation kết nối/giao task trước đây dưới `/api/projects/:projectId/agents` bị chặn để Leader không giao task trực tiếp.

## Quy tắc hiển thị và nghiệp vụ

- Bảng Leader tách số Human Reviews khỏi số AI Tasks; task AI không làm tăng tiến độ human consensus.
- Paper Viewer hiển thị Agent result riêng với các phiếu Human Reviewer.
- Trong Reviewer workspace, từng recommendation được so sánh với quyết định của Reviewer nếu đã có; Agent-vs-Agent disagreement có nhãn rõ là bất đồng AI-only.
- Nộp result chỉ chuyển task từ `ASSIGNED` sang `COMPLETED`. API result không tạo record `screeningDecisions`, không gọi resolve conflict và không cập nhật paper status.
- `TITLE_ABSTRACT` và `FULL_TEXT` lưu tách trên task. Markdown endpoint tiếp tục báo pending/unavailable khi full-text chưa trích xuất được.

## Điểm cần chốt tiếp trong brainstorm

1. Có cần trạng thái task `IN_PROGRESS`, `FAILED`, `CANCELLED`, retry và deadline không? Hiện task có `ASSIGNED`/`COMPLETED`; lỗi đầu vào được agent báo trong result.
2. Có cần cấu trúc result bắt buộc gồm `INCLUDE/EXCLUDE/UNCERTAIN`, kết quả từng criterion, quote, section/page, exclusion reason và confidence không? Hiện `decision`/`reasoning`/`data` còn linh hoạt.
3. Có cần audit record riêng khi Reviewer thay đổi quyết định sau khi xem AI không? Human decision hiện được lưu bằng workflow screening hiện tại.
4. Khi protocol thay đổi, có giữ task đã giao với snapshot cũ hay buộc tạo lại? Task hiện giữ criteria snapshot; lần giao sau dùng phiên bản hiện tại.
5. Có cần cho Reviewer gửi batch lớn, chọn template instructions, lọc theo trạng thái Agent, hoặc so sánh kết quả trong bảng không?
6. Với Full-text, cần evidence location theo trang/section và PDF highlight ở mức nào?
7. Nên pilot trên Title/Abstract hay Full-text trước; tiêu chí đánh giá chính là thời gian tiết kiệm, tỷ lệ evidence hợp lệ, mức Reviewer chấp nhận/chỉnh sửa hay độ đồng thuận?
8. Trước khi tự động hóa bất kỳ triage nào, cần đo false exclusion trên tập paper đại diện và kiểm tra chuyên gia.

## Prompt dùng để brainstorm tiếp

```text
Bạn là Product Manager và chuyên gia phương pháp Systematic Literature Review.

Hãy đánh giá feature AI Review theo mô hình Reviewer AI-Assisted Screening Workspace:
- Leader phân công paper cho Human Reviewers.
- Mỗi Reviewer có AI Agents riêng theo project và user, có thể giao một paper cho nhiều Agent.
- Agent đọc protocol snapshot và paper theo stage, rồi trả recommendation, reasoning, criteria và evidence.
- Reviewer tự quyết định screening chính thức; AI result không đổi paper status và không tạo Human-vs-Human conflict.
- Reviewer so sánh quyết định của mình với từng Agent, xử lý bất đồng và gửi quyết định human theo workflow hiện hành.

Hãy đề xuất: (1) MVP và user journey, (2) task lifecycle/error states, (3) cấu trúc result/evidence, (4) màn hình so sánh Reviewer-vs-Agent và Agent-vs-Agent, (5) acceptance criteria và metrics pilot, đặc biệt false exclusion, và (6) các câu hỏi phương pháp SLR cần nhóm quyết định.

Phân biệt rõ AI-only disagreement với conflict giữa Human Reviewers. Không xem model confidence là xác suất đúng nếu chưa hiệu chuẩn; không đề xuất AI tự loại paper khi chưa được đánh giá trên tập dữ liệu đại diện.
```
