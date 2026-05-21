Dựa trên các tài liệu nghiệp vụ (`DOCS_LEARNING_CONTENT_MECHANICS.md`, `tRPC_routes_learning_content.md`) và mã nguồn Backend hiện tại (`adminContentRouter`), dưới đây là định hướng tích hợp (Integration) chi tiết và lộ trình phát triển cho phân hệ **Admin CMS**.

Mục tiêu chính ở giai đoạn này là gắn kết giao diện Frontend (đã dựng sẵn) với các tRPC procedures của `appRouter.admin.content` nhằm vận hành trơn tru luồng CMS Khóa học -> Bài học -> Bài tập (Quiz).

---

## 1. Bản Đồ Tổng Quan Luồng Nghiệp Vụ Admin CMS

Để dễ hình dung trước khi đi vào chi tiết, toàn bộ quy trình quản trị nội dung của Admin sẽ tuân theo luồng tuyến tính một chiều sau:

[Tạo Khóa học (Course)] ──> [Tạo Bài học (Lesson)] ──> [Upload Video lên Cloudinary via Presigned URL] ──> [Sắp xếp Thứ tự Bài học (Reorder)] ──> [Thiết lập Cấu trúc Bài tập (Quiz/Questions/Answers)] ──> [Xuất bản (Publish)]

---

## 2. Định Hướng Tích Hợp Chi Tiết Theo Từng Thực Thể

### 2.1. Phân hệ Quản lý Khóa học (Course Management)

Hệ thống hiển thị danh sách dạng bảng hoặc grid kèm phân trang. Admin có quyền CRUD toàn bộ trạng thái khóa học kể cả bản nháp (`draft`).

* **Tích hợp Fetching (`courseList`):** * Gọi query `trpc.admin.content.courseList.useQuery` truyền vào các state cục bộ như `page`, `pageSize`, `search`, `level`, `status`.
* *Lưu ý UI:* Badge cấp độ cần map chính xác theo Enum CEFR (`A1`–`C2`).


* **Tích hợp Tạo mới & Cập nhật (`courseCreate`, `courseUpdate`):**
* Gắn schema kiểm thử dữ liệu đầu vào phía Frontend tương ứng với định nghĩa Zod tại Backend để bắt các lỗi như "Tiêu đề trống" ngay tại ô nhập liệu.
* Mặc định khi tạo mới, trạng thái khóa học sẽ là `draft`.


* **Tích hợp Nghiệp vụ Xóa (`courseDelete`) - Logic Biên Quan Trọng:**
* Backend áp dụng cơ chế `restrict` (chặn xóa vật lý nếu khóa học có bài học bên trong) và sẽ trả về mã lỗi `PRECONDITION_FAILED` (412).
* *Giải pháp Frontend:* Khi nhấn nút Xóa, cần hiển thị một **Confirm Dialog** cảnh báo. Nếu catch được lỗi mã `PRECONDITION_FAILED` từ tRPC, hãy hiển thị thông báo trực quan: *"Khóa học hiện có X bài học. Vui lòng xóa hết bài học bên trong trước khi xóa khóa học này"*.



### 2.2. Phân hệ Quản lý Bài học & Tối ưu Hạ tầng Video (Lesson CMS)

Nghiệp vụ bài học liên quan mật thiết đến việc quản lý tệp video bài giảng lớn, đòi hỏi xử lý khéo léo để tránh nghẽn băng thông server.

* **Tích hợp Tạo bài học (`lessonCreate`):**
* Mỗi bài học bắt buộc phải gắn với một `courseId` cha.
* Trường `order` (thứ tự hiển thị) nên để trống ở input nếu tạo tuần tự, Backend sẽ tự động chạy câu lệnh SQL để lấy số thứ tự cao nhất hiện tại (`maxOrder + 1`).


* **Luồng Tích hợp Media (Cloudinary Presigned Upload) - Giải phóng Server:**
* *Tuyệt đối không:* Gửi file video thô từ Frontend qua server Backend ElysiaJS.
* *Quy trình chuẩn:* Frontend gọi một API/Mutation từ Backend để lấy **Presigned Upload URL (URL ký danh an toàn)** của Cloudinary. Sau đó, Frontend dùng thư viện axios/fetch để đẩy trực tiếp file video từ máy Admin lên Cloudinary.
* Sau khi Cloudinary upload thành công, client nhận về `public_id` và `secure_url`. Lúc này mới truyền 2 giá trị này vào payload của `lessonCreate` hoặc `lessonUpdate`.


* **Tích hợp Kéo thả Sắp xếp Tuyến tính (`lessonReorder`):**
* Khi Admin thực hiện kéo thả (Drag & Drop) để đổi vị trí bài học trên UI, Frontend cần tính toán lại mảng vị trí mới dạng `movements: [{ id: "lesson-id", order: 2 }, ...]`.
* *Xử lý lỗi:* Backend đã có cơ chế cập nhật tạm thời qua số âm (2-phase update) để tránh trùng Unique Constraint `(courseId, order)` trong Database Transaction. Frontend chỉ cần đảm bảo không gửi trùng số `order` trong cùng một payload (nếu trùng sẽ ăn lỗi `BAD_REQUEST`).



### 2.3. Phân hệ Cấu trúc Bài tập (Quiz & Anti-Cheat Cấu Trúc)

Mỗi bài học có tối đa 1 bài tập Quiz (Quan hệ `1:1` hoặc `1:0`). Đây là nơi thiết lập dữ liệu gốc cho luồng chấm điểm chống gian lận phía học viên.

* **Tích hợp Toàn bộ Cấu trúc Quiz (`quizUpsertStructure`):**
* Nên ưu tiên dùng procedure này vì nó mang tính **Idempotent** (Thiết lập đồng bộ). Nếu không truyền `quizId` -> tạo mới; nếu có `quizId` -> Backend tự động xóa toàn bộ câu hỏi/đáp án cũ của Quiz đó đi và ghi đè mảng mới vào trong một Transaction.
* *Ràng buộc nghiệp vụ:* Admin bắt buộc phải nhập trường `explanation` (Lời giải thích đáp án đúng/sai cho từng câu hỏi). Mảng `answers` của mỗi câu hỏi phải có **ít nhất 2 đáp án** và **bắt buộc phải có ít nhất 1 đáp án đúng** (`isCorrect: true`). Nếu thiếu, server lập tức chặn và trả lỗi `BAD_REQUEST`.



---

## 3. Định Hướng Quản Lý Trạng Thái Toàn Cục & Xử Lý Lỗi (Error Handling)

Khi tích hợp với tRPC, Admin cần một bộ đánh chặn lỗi tập trung để đảm bảo trải nghiệm quản trị không bị gián đoạn:

1. **Phân quyền Nghiệp vụ (`adminProcedure`):**
* Mọi API trong router này đều kiểm tra `ctx.session.user.role === 'admin'`. Nếu một tài khoản học viên cố tình gọi các procedure này (qua F12/script), hệ thống lập tức ném lỗi `UNAUTHORIZED` (401) hoặc `FORBIDDEN` (403). Frontend cần bọc toàn bộ trang admin trong một Layout kiểm tra quyền, nếu không phải admin thì chặn truy cập ngay từ tầng Routing của Next.js.


2. **Đồng bộ hóa Lỗi Nhập liệu (Validation UI):**
* Khi Admin nhập thiếu dữ liệu hoặc sai định dạng (ví dụ: URL thumbnail sai cấu trúc), Zod tại Backend sẽ từ chối truy cập và trả về `BAD_REQUEST`. Hãy cấu hình tRPC `errorFormatter` toàn cục để trích xuất `err.message` của Zod và hiển thị dạng *Inline Field Error* (Lỗi ngay dưới ô Input) thay vì hiện một thông báo chung chung.



---

## 4. Các Bước Hành Động Tiếp Theo Dành Cho Bạn (Action Plan)

Để bắt tay vào tích hợp cho role Admin một cách tuần tự và khoa học, bạn nên triển khai theo các bước sau:

* **Bước 1:** Cấu hình file `trpc.ts` client tại thư mục `apps/web` kết nối thành công với Server Elysia và đính kèm Better Auth Cookie tự động vào Header.
* **Bước 2:** Viết trang **Dashboard Stats** trước (`/admin/dashboard`), gọi query `dashboardStats` để hiển thị 4 số liệu tổng quan lên các thẻ Card UI (Tổng khóa học, bài học, quiz, tiến độ). Bước này giúp test kết nối API đơn giản nhất.
* **Bước 3:** Hoàn thiện luồng **CRUD Khóa học** (`/admin/courses`), xử lý triệt để việc bắt lỗi xác thực form và Dialog xác nhận xóa khóa học.
* **Bước 4:** Triển khai trang **Đề cương bài học** bên trong khóa học. Tích hợp luồng upload video trực tiếp lên Cloudinary từ Client trước, sau đó lưu thông tin qua `lessonCreate`. Tiếp tục tích hợp thư viện kéo thả với API `lessonReorder`.
* **Bước 5:** Xây dựng giao diện **Quiz Builder** (`/admin/lessons/[lessonId]/quiz`). Dùng `quizUpsertStructure` để gom toàn bộ dữ liệu form động (gồm các cụm Câu hỏi + nút bấm tick chọn đáp án đúng `isCorrect` + Lời giải thích `explanation`) gửi lên Server một lần duy nhất.

[tRPC_routes_learning_content.md](file;file:///d%3A/Code/project/engducation/.agents/docs/tRPC_routes_learning_content.md)[DOCS_LEARNING_CONTENT_MECHANICS.md](file;file:///d%3A/Code/project/engducation/.agents/docs/DOCS_LEARNING_CONTENT_MECHANICS.md) [web](file;file:///d%3A/Code/project/engducation/apps/web) [api](file;file:///d%3A/Code/project/engducation/packages/api) [ui](file;file:///d%3A/Code/project/engducation/packages/ui) [schema](file;file:///d%3A/Code/project/engducation/packages/db/src/schema)  [skills](file;file:///d%3A/Code/project/engducation/.agents/skills) 

Context & Tech Stack:
Chúng ta đang phát triển phân hệ Admin CMS (Quản lý nội dung học tập) cho dự án Engducation.
Hệ thống sử dụng tRPC @engducation/api làm tầng kết nối loại bỏ REST, xác thực bằng Better Auth (Session/Cookie dựa trên middleware adminProcedure). Toàn bộ giao diện (UI Components) của dự án đã được cấu hình sẵn bằng Shadcn UI trong packages/ui.
Goal:
Hãy thực hiện code tích hợp tầng logic dữ liệu (tRPC mutations/queries, state management, form validation) vào các giao diện Admin đã dựng sẵn theo đúng lộ trình nghiệp vụ dưới đây.

LỘ TRÌNH VÀ QUY TẮC PHÁT TRIỂN (DEVELOPMENT SPECS)
LƯU Ý PHẢI TUÂN THỦ TOÀN CỤC:
Xử lý lỗi tRPC: Tạo một bộ đánh chặn lỗi (Error Handler) tập trung. Với lỗi BAD_REQUEST (400) do Zod validation, trích xuất err.message để hiển thị trực tiếp dưới từng ô nhập liệu (Inline field error). Với các lỗi khác (UNAUTHORIZED, FORBIDDEN), hiển thị thông báo Toast thông qua Sonner và điều hướng thích hợp.

Quản lý State: Sử dụng @tanstack/react-query tích hợp trong tRPC client. Sau mỗi thao tác Mutation thành công (Thêm/Sửa/Xóa), bắt buộc phải gọi utils.admin.content.[procedure].invalidate() để đồng bộ lại dữ liệu tầng UI mà không cần tải lại trang.

PHẦN 1: THỐNG KÊ DASHBOARD TOÀN CỤC
Mục tiêu: Vận hành trang /admin/dashboard để kiểm tra kết nối API.

Thực hiện:

Gọi Query trpc.admin.content.dashboardStats.useQuery().

Đổ dữ liệu an toàn vào các card UI tương ứng: totalCourses, totalLessons, totalQuizzes, totalProgressLogs.

Thêm trạng thái Skeleton loading khi API đang fetch dữ liệu để tránh lỗi Hydration.

PHẦN 2: TÍCH HỢP CMS KHÓA HỌC (COURSES)
Giao diện tương ứng: /admin/courses và component AdminCourseForm.

Thực hiện:

Hiển thị: Gọi query courseList kèm các state phân trang cục bộ (page, pageSize, search, level, status). Map enum level hiển thị dạng Badge chuẩn CEFR (A1 -> C2).

Thêm/Sửa: Tích hợp form bằng react-hook-form kết hợp Zod schema đồng bộ với Backend. Trạng thái xuất bản mặc định của khóa học mới luôn là draft.

Xóa (Logic Biên): Khi gọi mutation courseDelete, nếu khóa học chứa bài học (lessonCount > 0), Backend sẽ chặn vật lý và trả về mã lỗi PRECONDITION_FAILED (412). Hãy bọc hành động này trong một AlertDialog của Shadcn, nếu bắt được lỗi 412, hiển thị thông báo: "Khóa học đang có X bài học. Hãy xóa toàn bộ bài học trước."

PHẦN 3: TÍCH HỢP CMS BÀI HỌC VÀ QUY TRÌNH UPLOAD VIDEO
Giao diện tương ứng: Component AdminLessonManager.

Yêu cầu hạ tầng: Giải phóng băng thông cho server ElysiaJS bằng cơ chế Cloudinary Presigned URL.

Quy trình code bài học mới:

Admin chọn tệp video từ máy tính tại Client.

Frontend gọi API sinh URL ký danh (Presigned URL) từ hệ thống.

Frontend sử dụng HTTP Client (như Axios/Fetch) để POST trực tiếp file video thô từ trình duyệt lên Cloudinary.

Khi Cloudinary phản hồi thành công và trả về public_id cùng secure_url, Frontend mới đóng gói 2 giá trị này vào payload và gọi mutation lessonCreate hoặc lessonUpdate.

Sắp xếp thứ tự (Linear Ordering): Khi admin kéo thả thay đổi vị trí bài học, tính toán mảng dịch chuyển dữ liệu movements: [{ id: string, order: number }] (đảm bảo các số order không trùng nhau) và gọi mutation lessonReorder trong một Transaction duy nhất để tối ưu hiệu năng.

PHẦN 4: TÍCH HỢP CMS BÀI TẬP TRẮC NGHIỆM (QUIZ BUILDER)
Giao diện tương ứng: Component AdminQuizBuilder.

Nghiệp vụ cốt lõi: Quản lý cấu trúc Idempotent đồng bộ một lần.

Thực hiện:

Tích hợp form động (Dynamic Form Array) cho phép thêm nhiều câu hỏi, trong mỗi câu hỏi cho phép thêm nhiều lựa chọn đáp án.

Sử dụng mutation quizUpsertStructure. Nếu truyền quizId -> cập nhật cấu trúc (Backend sẽ tự xóa câu hỏi cũ, ghi đè mảng mới); nếu không truyền -> tạo mới bài tập cho lessonId.

Ràng buộc dữ liệu nghiêm ngặt phía Client:

Mỗi câu hỏi phải chứa ô nhập liệu explanation (Văn bản giải thích lý do đúng/sai).

Mỗi câu hỏi phải có tối thiểu 2 lựa chọn đáp án (answers).

Bắt buộc phải có ít nhất 1 đáp án được tích chọn là đúng (isCorrect: true). Nếu không thỏa mãn, chặn không cho submit form và báo lỗi trực quan trên UI trước khi dữ liệu bị Backend trả về BAD_REQUEST.

Output Requirement:
Hãy tiến hành sinh mã nguồn sạch (Clean code), tối ưu hiệu năng render của React bằng cách chia nhỏ các sub-component hợp lý, sử dụng đúng các hooks mutation/query của tRPC và viết comment giải thích rõ ràng tại các khối xử lý logic biên nguy hiểm. Tiến hành thực hiện từng file hoặc từng phân hệ một cách tuần tự.



