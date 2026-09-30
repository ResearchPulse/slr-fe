# SLRS UI Redesign Guide

Tài liệu này mô tả style đang được áp dụng cho đợt làm mới giao diện SLRS, để các thành viên tiếp tục các trang còn lại theo cùng một hướng. Với khu vực Admin, tài liệu này là nguồn tham chiếu hiện hành và thay thế các quy tắc màu cũ trong [`design-system.md`](./design-system.md) khi có mâu thuẫn.

## Hướng thiết kế

- Giao diện nghiên cứu hiện đại, rõ ràng và tiết chế; ưu tiên khả năng đọc dữ liệu và thao tác quản trị.
- Dùng nền sáng, xanh navy cho nội dung chính và xanh dương cho hành động/điểm nhấn.
- Dùng sans-serif cho giao diện ứng dụng, đặc biệt là bảng, biểu mẫu và điều hướng.
- Giữ bố cục gọn, nhất quán giữa các trang; không thêm trang trí nếu không giúp người dùng hiểu hoặc thao tác.
- Tránh gradient, glassmorphism, hiệu ứng phát sáng, sparkle, huy hiệu không có ý nghĩa và các chi tiết tạo cảm giác “AI-generated”.
- Tôn trọng chức năng và dữ liệu hiện có. Không tạo số liệu, trạng thái, người phụ trách hoặc tiến độ giả để lấp chỗ trống.

## Bảng màu tham chiếu

| Vai trò | Màu |
| --- | --- |
| Nền vùng ứng dụng | `#F6F9FB` |
| Nền sidebar / vùng nhẹ | `#F8FAFC` |
| Surface / card | `#FFFFFF` |
| Navy cho tiêu đề và thương hiệu | `#173247` (logo đậm: `#102B3D`) |
| Accent xanh dương | `#087BC1` |
| Hover accent | `#066CA9` |
| Nội dung phụ | `#71838F` |
| Nội dung muted | `#82929C` / `#98A6AE` |
| Border | `#E0E8ED` (divider nhẹ: `#E8EEF2`) |

Trạng thái có thể dùng màu ngữ nghĩa nhẹ: xanh lá cho hoàn tất/đang hoạt động, xám cho nháp hoặc chưa rõ, hổ phách cho review, đỏ cho lỗi/xóa. Dùng nền nhạt và chữ đủ tương phản; không tô đậm cả hàng hoặc cả card.

## Typography và phân cấp

- Tiêu đề trang: sans-serif, khoảng `28–34px`, weight 600; tracking hơi âm.
- Nội dung: `12–14px`, màu navy/xám xanh; line-height thoáng vừa đủ.
- Nhãn nhóm/eyebrow: `9–10px`, chữ hoa, weight 700, tracking rộng, màu xanh hoặc muted.
- Header bảng: `10–11px`, chữ hoa, màu muted; không dùng chữ đen đậm.
- Ưu tiên sentence case cho nút và tiêu đề. Chỉ dùng uppercase cho nhãn ngắn.
- Không dùng serif/cormorant trong màn hình quản trị mới, trừ khi một khu vực nội dung biên tập có lý do rõ ràng.

## Layout và component

### Khung Admin

- Sidebar desktop rộng `252px`, thu gọn còn `76px`; nhóm menu theo Main, Management, System.
- Header trên cao khoảng `72px`, nền trắng, sticky; giữ tên trang và cụm tài khoản gọn.
- Vùng nội dung cuộn độc lập trong phần main. Dùng nền `#F6F9FB`, padding tăng theo breakpoint và giới hạn nội dung khoảng `1600px`.
- Trên mobile, dùng drawer cho điều hướng; không ép bảng nhiều cột vào khung hẹp.

### Trang danh sách

- Mở đầu bằng eyebrow, tiêu đề, mô tả một dòng và hành động chính.
- Đặt tìm kiếm và filter trong thanh công cụ nền trắng, border mảnh, input cao khoảng `44px`.
- Dùng panel/bảng có radius khoảng `10–12px`, border mảnh và bóng rất nhẹ hoặc không có bóng.
- Header bảng nền `#F8FAFC`; hàng dữ liệu có divider mảnh, hover nền gần trắng.
- Đặt độ rộng cột có chủ đích. Cho phép cuộn ngang trên màn hình nhỏ và đặt `min-width` phù hợp thay vì làm chữ/cột quá chật.
- Hành động mỗi hàng dùng icon button gọn, có `aria-label`/tooltip; giữ trạng thái focus nhìn thấy được.

### Cards và nút

- Card thường dùng nền trắng, border `#E0E8ED`, radius `12px`, padding `16–20px`.
- Primary button dùng nền `#087BC1`, chữ trắng, radius `8–10px`, cao khoảng `40–44px`.
- Secondary button dùng nền trắng, border xám xanh và chữ navy.
- Hover đổi màu nhẹ; tránh phóng to, nhảy, xoay icon hoặc đổ bóng mạnh.

### Trạng thái trang

- Loading: skeleton trung tính hoặc spinner hiện có; giữ kích thước bố cục gần với nội dung thật.
- Empty: icon nhỏ trong nền nhạt, tiêu đề ngắn, hướng dẫn cụ thể; cung cấp “Clear filters” nếu filter đang bật.
- Error: thông báo dễ đọc và nút Retry nếu truy vấn có thể thử lại.
- Dữ liệu thiếu: dùng `—` hoặc nhãn “Unavailable”; không tự thay bằng `0`, “Active”, “No leader” nếu API chưa xác nhận.

## Motion và accessibility

- Chỉ dùng chuyển màu/opacity nhẹ và reveal ngắn khi nội dung cuộn vào khung nhìn.
- Không dùng bounce hoặc animation lặp cho giao diện quản trị.
- Tôn trọng `prefers-reduced-motion`; giữ nội dung hiển thị bình thường nếu không hỗ trợ `IntersectionObserver`.
- Nút chỉ có icon cần accessible name; trạng thái toggle cần `aria-pressed` hoặc `aria-expanded` phù hợp.
- Không dựa duy nhất vào màu để biểu đạt trạng thái.

## Quy tắc dữ liệu và hành vi

- Giữ nguyên hooks, API contract, quyền truy cập, route, validation và hành vi CRUD khi chỉ làm UI.
- Nếu nhãn nói tìm theo tên hoặc URL, logic lọc phải tìm cả hai trường.
- KPI, usage và workflow progress phải lấy từ response hoặc phép tính dựa trên dữ liệu thật. Khi API không có dữ liệu, hiển thị trạng thái chưa có thay vì giả lập.
- Hiển thị đúng tên vai trò theo domain. Ví dụ chủ dự án/Leader tương ứng với role `OWNER`; không gán nhầm thành `LECTURER` hoặc `REVIEWER`.
- Trước khi đổi cấu trúc dữ liệu hiển thị, kiểm tra type, hook và response backend; nếu cần số liệu mới, bổ sung ở nguồn dữ liệu thay vì hard-code ở component.

## File tham chiếu đã làm mới

- Khung Admin: [`AdminDashboard.tsx`](../src/pages/admin/AdminDashboard.tsx), [`Sidebar.tsx`](../src/components/ui/Sidebar.tsx), [`AdminHeader.tsx`](../src/components/admin/AdminHeader.tsx).
- Dashboard: [`AdminOverview.tsx`](../src/pages/admin/AdminOverview.tsx).
- Danh sách dự án: [`SLRProjectManagement.tsx`](../src/pages/admin/SLRProjectManagement.tsx).
- Search Sources: [`MasterSourcePage.tsx`](../src/pages/admin/MasterSourcePage.tsx).
- Profile người dùng: [`MyProfilePage.tsx`](../src/pages/profile/MyProfilePage.tsx).
- Global scroll/reveal và reduced-motion styles: [`index.css`](../src/index.css).

Khi tiếp tục redesign trang khác, hãy dùng các trang trên làm mẫu trực tiếp, rồi giữ nguyên nghiệp vụ của trang đó. Những trang chưa được cập nhật có thể còn style cũ; không nên sao chép các màu đỏ/tím hoặc component cũ chỉ vì chúng đang tồn tại.
