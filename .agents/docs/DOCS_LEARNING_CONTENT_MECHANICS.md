# Nghiệp vụ Phân hệ Quản lý Học tập & Nội dung (Courses, Lessons & Quiz)

Tài liệu này định nghĩa toàn bộ quy tắc nghiệp vụ (Business Rules), kiến trúc luồng dữ liệu và logic biên cho Phân hệ Quản lý Học tập của dự án **Engducation**. Toàn bộ mã nguồn Drizzle Schema và tRPC Routers phải tuân thủ nghiêm ngặt các quy định dưới đây.

---

## 1. Bản đồ Kiến trúc Thực thể (Entity Relationship Map)

Hệ thống quản lý nội dung số tuân thủ cấu trúc phân cấp tuyến tính một chiều và các mối quan hệ đa tầng sau:
[Course] (1) ───> (N) [Lesson] (1) ───> (1) [Quiz] (1) ───> (N) [Question] (1) ───> (N) [Answer]
│                      │                    │
│                      ▼                    ▼
└───────────────> [UserProgress]      [QuizAttempt]

- Một **Khóa học (Course)** có nhiều **Bài học (Lesson)**.
- Một **Bài học (Lesson)** có tối đa một **Bài tập (Quiz)** củng cố kiến thức (Quan hệ `1:1` hoặc `1:0`).
- Một **Bài tập (Quiz)** bao gồm nhiều **Câu hỏi (Question)**.
- Một **Câu hỏi (Question)** bao gồm nhiều lựa chọn **Đáp án (Answer)**, trong đó bắt buộc phải có ít nhất một đáp án đúng.

---

## 2. Đặc tả Nghiệp vụ các Thực thể Tĩnh (CMS Metadata)

### 2.1. Khóa học (Courses)
- **Cấp độ (Level):** Định nghĩa bắt buộc bằng kiểu dữ liệu Enum của PostgreSQL: `A1`, `A2`, `B1`, `B2`, `C1`, `C2` theo chuẩn khung tham chiếu châu Âu (CEFR).
- **Trạng thái xuất bản (Status):** Sử dụng Enum: `draft` (Bản nháp), `published` (Đã xuất bản), `archived` (Lưu trữ).
  - *Quy tắc nghiệp vụ:* Phía Học viên chỉ được phép nhìn thấy và truy cập các khóa học có trạng thái `published`.
- **Ràng buộc:** Không được phép xóa vật lý (`HARD DELETE`) khóa học khi đã có dữ liệu học viên ghi danh hoặc phát sinh tiến độ học tập để tránh lỗi mồ côi dữ liệu (`Orphaned Records`).

### 2.2. Bài học (Lessons) & Cơ chế Sắp xếp Tuyến tính
- **Sắp xếp thứ tự (Linear Ordering):** Trường `order` (kiểu `integer`) đại diện cho số thứ tự của bài học *bên trong khóa học đó* (bắt đầu từ số `1`), không phải số tự tăng toàn cục hệ thống.
  - *Quy tắc Admin:* Khi thực hiện kéo thả thay đổi vị trí bài học (ví dụ: Chuyển Bài 5 thành Bài 2), hệ thống phải sử dụng Mutation `lesson.reorder` nhận mảng object vị trí mới `[{ id: string, order: number }]` để cập nhật đồng loạt trong một Database Transaction duy nhất nhằm tối ưu hiệu năng.
- **Tích hợp Media:** Lưu tệp tài nguyên video bài giảng qua Cloudinary.
  - *Quy tắc hạ tầng:* Hệ thống lưu `public_id` và URL gốc trong Database. Admin tạo bài học bằng cách upload trực tiếp từ Frontend lên Cloudinary thông qua URL ký danh an toàn (`Presigned Upload URL`) nhận từ Backend để giải phóng băng thông cho server ElysiaJS.

### 2.3. Bài tập & Câu hỏi (Quizzes, Questions, Answers)
- **Cấu trúc câu hỏi:** Bảng `questions` phải chứa trường `explanation` (Văn bản giải thích lý do tại sao đúng/sai).
- **Cấu trúc đáp án:** Bảng `answers` chứa trường `is_correct` dạng `boolean`. 
  - *Ràng buộc dữ liệu:* Một câu hỏi trắc nghiệm có thể có nhiều đáp án sai, nhưng phải có ít nhất 1 đáp án đúng (`is_correct = true`).

---

## 3. Đặc tả Nghiệp vụ các Thực thể Động (User Interaction Log)

### 3.1. Tiến độ Học tập (User Progress)
- **Bảng nối nhiều-nhiều:** Lưu vết tương tác giữa một `user_id` và một `lesson_id`.
- **Trạng thái tiến độ (Status):** Enum gồm `learning` (Đang học) và `completed` (Đã hoàn thành).
  - *Cơ chế kích hoạt:* Khi học viên xem hết video ở Frontend (Event `onEnded` của trình phát), Frontend gọi tRPC Mutation `progress.toggleStatus` chuyển trạng thái sang `completed`.
  - *Tối ưu hóa:* Khi hiển thị danh sách bài học của Khóa học, hệ thống thực hiện `LEFT JOIN` với bảng `user_progress` dựa trên `user_id` hiện tại để kết xuất trạng thái dấu tích xanh hoàn thành cho từng bài học.

### 3.2. Cơ chế Làm bài & Chấm điểm Quiz (Anti-Cheat Mechanics)
Đây là nghiệp vụ cốt lõi yêu cầu tính bảo mật tuyệt đối chống gian lận điểm số từ phía Client.

- **Luồng nộp bài (Submission Flow):**
  1. Học viên làm bài tập trắc nghiệm ở Frontend. Khi nhấn Nộp bài, Frontend **KHÔNG** tự tính điểm, cũng **KHÔNG** gửi kết quả điểm số lên Server.
  2. Frontend gửi lên tRPC Mutation `quiz.submit` với Payload tối giản: 
     ```json
     {
       "quizId": "string",
       "answers": [
         { "questionId": "string", "selectedAnswerId": "string" }
       ]
     }
     ```
  3. Tại lớp xử lý của tRPC Backend:
     - Truy vấn toàn bộ câu hỏi và đáp án đúng (`is_correct = true`) của `quizId` đó trực tiếp từ Database.
     - Thực hiện vòng lặp so sánh đối chiếu mã nguồn đáp án từ payload của học viên gửi lên với đáp án chuẩn trong DB trên Server.
     - Tính toán số câu đúng, câu sai, và tỷ lệ phần trăm điểm số cuối cùng.
  4. Lưu toàn bộ lượt làm bài vào bảng `quiz_attempts`:
     - Trường `score` lưu điểm số thực tế vừa tính toán.
     - Trường `selected_answers` sử dụng kiểu dữ liệu `jsonb` của PostgreSQL để lưu lại snapshot dạng thô các câu trả lời học viên đã chọn: `[{ questionId, selectedAnswerId, isCorrect }]`. Việc lưu trữ JSONB giúp hiển thị lại trang lịch sử xem lại bài cũ cực kỳ nhanh chóng mà không cần query join phức tạp đập vào bảng đáp án hệ thống.
  5. Phản hồi về Frontend: Trả về kết quả chấm điểm kèm mảng dữ liệu chứa nội dung `explanation` tương ứng của từng câu hỏi để Frontend render phần sửa lỗi trực quan cho học viên.

---

## 4. Kiểm soát Quyền truy cập & Bảo mật Nội dung (Access Control)

Hệ thống kế thừa Middleware `protectedProcedure` từ cấu hình Better-Auth hiện tại và chia nhỏ thành 2 Gate chính tại tầng tRPC:

### 4.1. Cổng Quản trị viên (`adminProcedure`)
- Toàn bộ các Mutation liên quan đến CRUD Khóa học, Bài học, Quiz, Câu hỏi, và sắp xếp lại thứ tự bài học (`reorder`) bắt buộc phải bọc trong `adminProcedure`.
- Thẩm định quyền: Kiểm tra `ctx.session.user.role === 'admin'`. Nếu sai, lập tức throw lỗi `TRPCError` mã `UNAUTHORIZED`.

### 4.2. Cổng Học viên (`protectedProcedure` + Gói Premium Gate)
- Học viên thông thường chỉ được xem danh sách khóa học công khai (`status = 'published'`).
- **Bảo mật luồng Video:** Để tránh việc rò rỉ URL video khóa học Premium ra ngoài cho tài khoản Free, khi học viên gọi Query `lesson.getMediaUrl`, Backend phải thẩm định quyền sở hữu/trạng thái tài khoản (Gói Free vs Gói Premium). Nếu tài khoản hợp lệ, Backend sử dụng thư viện SDK của Cloudinary để tạo ra một **Cloudinary Signed URL** (Đường dẫn kèm token bảo mật có thời gian hết hạn ngắn, ví dụ: 1 giờ). Học viên không thể copy link này để chia sẻ bất hợp pháp.

---

## 5. Chiến lược Hiệu năng & Tiết kiệm Hạ tầng (Infrastructure Optimization)

- **Caching Tầng Ứng dụng:** Dữ liệu cấu trúc Khóa học và Bài học là dữ liệu tĩnh, tần suất cập nhật thấp nhưng tần suất đọc (Query) của học viên rất cao. Sử dụng cơ chế Cache Control Headers của Vercel / Elysia memory cache để giảm thiểu số lượng truy vấn trùng lặp tải vào database Neon PostgreSQL.
- **Tránh Thảm họa N+1 Query:** Khi truy vấn cây thư mục nội dung (Khóa học -> danh sách Bài học), tuyệt đối không loop qua từng bài học để query DB. Phải tận dụng tính năng Relational Queries của Drizzle ORM để fetch dữ liệu lồng nhau qua một câu lệnh SQL tổng bộ duy nhất.