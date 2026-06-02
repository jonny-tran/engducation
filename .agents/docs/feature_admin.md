# TÀI LIỆU ĐẶC TẢ CHI TIẾT NGHIỆP VỤ PHÂN HỆ QUẢN TRỊ NÂNG CAO (ADMIN CMS SPECIFICATION)
**Dự án:** Hệ thống EdTech & AI Writing Assistant
**Ngữ cảnh hệ thống:** Hệ thống vận hành theo mô hình bán khóa học lẻ (Pay-per-course). Học viên mua quyền truy cập cho từng khóa học cụ thể. Tính năng AI Writing Assistant được tích hợp đóng vai trò là công cụ tự động chấm điểm, sửa lỗi chính tả và ngữ pháp cho các bài tập làm văn (Writing Exercises) nằm trong các khóa học đó. Admin quản lý hạn mức sử dụng AI theo ngày để phòng ngừa rủi ro spam và kiểm soát chi phí API.

---

## 1. PHÂN HỆ QUẢN LÝ HẠN MỨC VÀ GIÁM SÁT AI (AI INFRASTRUCTURE & COST CONTROL)

### 1.1. Cấu hình Prompt Tập trung cho Bài tập Writing (Prompt Centralized Management)
* **Ngữ cảnh:** Mỗi bài tập viết trong từng khóa học có thể yêu cầu tiêu chí chấm điểm khác nhau (Ví dụ: Bài tập viết thuộc khóa học "Tiếng Anh Giao tiếp Cơ bản" chỉ cần sửa lỗi chính tả; bài tập thuộc khóa học "Luyện viết IELTS" cần chấm theo 4 tiêu chí của IELTS). Admin cần giao diện quản lý cấu hình Prompt động để thay đổi chỉ dẫn cho AI mà không cần can thiệp mã nguồn.
* **Chi tiết nghiệp vụ:**
    * **Quản lý danh mục Prompt:** Admin có quyền tạo, sửa, xóa các bản ghi Prompt cấu hình hệ thống. Mỗi bản ghi gồm: Mã định danh Prompt (Prompt ID), Tên mô tả, `System Prompt` (Quy định vai trò của AI là giám khảo chấm bài), `User Prompt Template` (Mẫu định dạng chứa các biến động để hệ thống tự điền vào khi gửi sang API như `{{student_answer}}`, `{{exercise_requirement}}`, `{{max_word_count}}`), tham số `Temperature` và `Max Tokens`.
    * **Cơ chế liên kết nội dung:** Khi tạo hoặc chỉnh sửa một Bài tập viết (Writing Exercise) trong phân hệ Quản trị nội dung (CMS), Admin có một trường tùy chọn để liên kết bài tập đó với một Mã định danh Prompt cụ thể trong danh mục cấu hình Prompt hệ thống.
    * **Luồng xử lý:** Khi học viên bấm nộp bài tập viết, hệ thống truy vấn bài tập để lấy cấu hình Prompt đã liên kết, trích xuất văn bản làm bài của học viên điền vào `User Prompt Template` rồi mới gửi sang OpenAI/Perplexity API.

### 1.2. Quản lý Hạn mức Sử dụng AI theo Ngày (Daily Global & Course Quota)
* **Ngữ cảnh:** Vì AI Writing được sử dụng miễn phí kèm theo khóa học đã mua, học viên có thể vô tình hoặc cố ý nộp đi nộp lại một bài tập nhiều lần liên tục, gây lãng phí chi phí token API của hệ thống.
* **Chi tiết nghiệp vụ:**
    * **Cấu hình giới hạn toàn cục (Global Daily Limit):** Admin thiết lập một con số trần về số lượt sử dụng AI tối đa mà một học viên được phép thực hiện trong vòng một ngày trên toàn hệ thống (Ví dụ: Tối đa `20 lượt gọi AI/ngày/học viên`).
    * **Cấu hình giới hạn theo từng bài tập (Per-Exercise Quota):** Trong giao diện tạo bài tập viết, Admin cấu hình số lần tối đa AI hỗ trợ sửa lỗi cho riêng bài tập đó (Ví dụ: Học viên chỉ được nhờ AI sửa và chấm điểm tối đa `5 lần` cho Bài tập viết số 1; nếu muốn viết lại tốt hơn sau 5 lần đó, học viên phải tự hoàn thiện hoặc chờ giáo viên chấm thủ công).
    * **Cơ chế thiết lập lại (Reset Counter):** Hệ thống tự động xóa bộ đếm số lượt gọi AI của học viên về `0` vào đúng `00:00:00` hàng ngày (Múi giờ GMT+7).
    * **Logic chặn và thông báo:** Khi học viên nhấn nút "Bấm vào đây để AI chấm bài", Backend kiểm tra đồng thời 2 điều kiện: (1) Số lượt dùng trong ngày của học viên đã đạt ngưỡng trần toàn cục chưa? (2) Số lượt nộp bài tại bài tập cụ thể này đã vượt quá giới hạn bài tập chưa? Nếu một trong hai điều kiện bị vi phạm, hệ thống từ chối gửi request sang OpenAI và hiển thị thông báo lỗi tương ứng lên giao diện người dùng: `"Bạn đã hết lượt chấm bài bằng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai."` hoặc `"Bạn đã vượt quá số lần AI hỗ trợ cho bài tập này."`

### 1.3. Bảng phân tích và giám sát chi phí AI (AI Analytics Dashboard)
* **Ngữ cảnh:** Giúp Admin theo dõi lượng tài chính tiêu hao cho API AI trên từng khóa học cụ thể nhằm đánh giá tỷ lệ lợi nhuận ròng của khóa học đó.
* **Chi tiết nghiệp vụ:**
    * **Thống kê chi phí theo Khóa học (Cost per Course):** Biểu đồ hiển thị tổng số Token tiêu thụ và chi phí tiền tệ quy đổi ($ USD hoặc VNĐ) phân rã theo từng Khóa học. Admin nhìn vào sẽ biết khóa học nào học viên đang sử dụng AI nhiều nhất và khóa học đó có đang bị lỗ chi phí API hay không.
    * **Thống kê theo Bài tập (Cost per Exercise):** Danh sách xếp hạng (Top List) các bài tập viết tiêu tốn nhiều chi phí API nhất để Admin kịp thời điều chỉnh lại cấu hình giới hạn của riêng bài tập đó nếu cần.
    * **Theo dõi tỷ lệ lỗi kết nối:** Biểu đồ đường thể hiện tỷ lệ lỗi khi gọi API bên thứ ba. Nếu tỷ lệ lỗi vượt quá `5%` trong vòng 10 phút, hệ thống hiển thị cảnh báo đỏ trên Dashboard để Admin kiểm tra lại số dư tài khoản OpenAI hoặc đổi API Key dự phòng.

---

## 2. PHÂN HỆ QUẢN LÝ ĐĂNG KÝ VÀ GIAO DỊCH KHÓA HỌC (COURSE SUBSCRIPTION & ORDER MANAGEMENT)

### 2.1. Quản lý Chính sách Giá Khóa học (Course Pricing & Access Management)
* **Ngữ cảnh:** Hệ thống thương mại hóa bằng cách bán lẻ từng khóa học. Admin cần quản lý vòng đời thương mại của khóa học trực tiếp trên giao diện quản trị.
* **Chi tiết nghiệp vụ:**
    * **Thông tin thương mại khóa học:** Admin cấu hình các trường dữ liệu gồm: Giá gốc, Giá bán thực tế (Giá sau giảm), Thời hạn quyền truy cập khóa học kể từ khi kích hoạt (Ví dụ: `180 ngày`, `365 ngày`, hoặc `Vô thời hạn - Lifetime`).
    * **Quản lý trạng thái mở bán:** Khóa học có các trạng thái vận hành: `DRAFT` (Đang soạn thảo nội dung, học viên không thấy), `PUBLISHED` (Đã mở bán, học viên có thể nạp tiền mua), `ARCHIVED` (Ngừng kinh doanh, những học viên đã mua trước đó vẫn có quyền vào học cho đến khi hết hạn, nhưng học viên mới không thể mua được nữa).

### 2.2. Xử lý Giao dịch và Kích hoạt Khóa học Thủ công (Manual Order Override)
* **Ngữ cảnh:** Học viên chọn phương thức thanh toán chuyển khoản ngân hàng thủ công, hoặc hệ thống đối tác cổng thanh toán (PayOS, Stripe) gặp lỗi không gửi được tín hiệu kích hoạt tự động (Webhook) về hệ thống dù học viên đã bị trừ tiền trong tài khoản.
* **Chi tiết nghiệp vụ:**
    * **Tạo đơn hàng mua khóa học thủ công:** Admin có giao diện chọn tài khoản Học viên, chọn Khóa học học viên muốn mua, nhập số tiền thực tế đã thu, và bấm tạo Đơn hàng. Trạng thái đơn hàng mặc định là `PENDING`.
    * **Logic Phê duyệt của Admin (Manual Activation Logic):**
        * Trên danh sách đơn hàng `PENDING`, Admin kiểm tra minh chứng thanh toán (Sao kê ngân hàng, biên lai học viên gửi qua kênh hỗ trợ). Nếu thông tin chính xác, Admin nhấn nút **"Phê duyệt (Approve)"**.
        * **Chuỗi hành động của hệ thống khi Phê duyệt:** 
            1. Chuyển trạng thái đơn hàng sang `SUCCESS`.
            2. Ghi nhận phương thức thanh toán của đơn hàng là `MANUAL_BANK_TRANSFER`.
            3. Khởi tạo quyền truy cập khóa học cho học viên: Ghi nhận bản ghi vào bảng quyền sở hữu khóa học (`user_courses`), tính toán chính xác ngày hết hạn quyền truy cập dựa trên cấu hình thời hạn của khóa học đó (`Ngày kích hoạt + Thời hạn khóa học`).
            4. Mở khóa toàn bộ các khối học (Modules), bài học (Lessons), bài tập Quiz và bài tập Writing thuộc khóa học đó cho tài khoản của học viên.
        * Nếu giao dịch không hợp lệ, Admin nhấn nút **"Từ chối (Reject)"** và bắt buộc phải nhập lý do từ chối. Đơn hàng chuyển sang trạng thái `FAILED`.

### 2.3. Hệ thống Log Giao dịch đối soát (Transaction Auditing Logs)
* **Ngữ cảnh:** Đảm bảo tính minh bạch, chống thất thoát tài chính và ngăn ngừa hành vi gian lận nội bộ (Ví dụ: Nhân viên có quyền Admin cấu kết tự ý mở khóa khóa học cho người quen mà không có dòng tiền thực tế).
* **Chi tiết nghiệp vụ:**
    * Hệ thống tự động ghi lại một bản ghi nhật ký vĩnh viễn, không thể chỉnh sửa, không thể xóa cho mỗi giao dịch mua khóa học.
    * Thông tin bắt buộc trong bản ghi log: Mã đơn hàng, ID học viên, ID khóa học, Số tiền giao dịch, Trạng thái cũ, Trạng thái mới, Phương thức thanh toán, ID của Admin thực hiện thao tác (Nếu duyệt thủ công) hoặc nhãn `SYSTEM_GATEWAY_WEBHOOK` (Nếu cổng thanh toán tự động kích hoạt), Dấu thời gian.
    * **Quy tắc an ninh:** Tuyệt đối không cung cấp bất kỳ API hay nút bấm nào trên UI cho phép thực hiện lệnh `UPDATE` hoặc `DELETE` trên bảng dữ liệu log giao dịch này.

---

## 3. HỆ THỐNG HỖ TRỢ HỌC VIÊN & CHẤM ĐIỂM (STUDENT SUPPORT & HUMAN-IN-THE-LOOP)

### 3.1. Cổng Tiếp nhận và Chấm điểm Khiếu nại Bài viết (AI Feedback & Moderation Workspace)
* **Ngữ cảnh:** Khi học viên làm bài tập viết, AI sửa lỗi và chấm điểm tự động. Tuy nhiên, nếu học viên không đồng ý với kết quả sửa lỗi của AI (Ví dụ: AI hiểu sai ý ngữ cảnh bài viết), học viên sẽ bấm nút khiếu nại để yêu cầu giáo viên bằng con người chấm lại.
* **Chi tiết nghiệp vụ:**
    * **Cơ chế gửi khiếu nại bài viết:** Tại giao diện xem lại kết quả sửa lỗi của AI trong bài học, học viên nhấn nút "Yêu cầu Giáo viên Chấm lại". Hệ thống sẽ tạo một Phiếu chấm lại (Writing Review Ticket) lưu trữ các thông tin: ID bài tập, Nội dung văn bản gốc của học viên, Kết quả sửa lỗi mà AI đã trả về trước đó, và Lời nhắn/Lý do khiếu nại của học viên.
    * **Không gian làm việc của Admin/Giáo viên (Moderation Workspace):**
        * Admin truy cập danh mục Phiếu chấm lại. Giao diện thiết kế dạng so sánh hai màn hình (Split-screen) hiển thị văn bản của học viên và các lỗi mà AI đã chỉ ra.
        * Hệ thống cung cấp một trình biên tập văn bản (Text Editor). Admin/Giáo viên sẽ tự tay chỉnh sửa, sửa lại lỗi chính tả/ngữ pháp chuẩn xác theo chuyên môn sư phạm và nhập điểm số đánh giá thủ công của con người, kèm theo nhận xét chi tiết.
    * **Cơ chế hoàn tất và đồng bộ kết quả:** Sau khi giáo viên hoàn thành chấm bài và nhấn "Gửi kết quả chuẩn hóa", trạng thái phiếu khiếu nại chuyển sang `RESOLVED`. Kết quả chấm của giáo viên sẽ được ghi đè hoặc hiển thị ưu tiên thay thế cho kết quả của AI trong trang tiến độ học tập của học viên đó. Hệ thống bắn thông báo về tài khoản học viên để thông báo bài viết đã có kết quả chấm chính thức từ giáo viên.

### 3.2. Hệ thống Tiếp nhận Ticket Hỗ trợ Kỹ thuật & Khóa học (Helpdesk System)
* **Ngữ cảnh:** Tiếp nhận và xử lý các phản ánh của học viên về vận hành hệ thống (Ví dụ: Video bài giảng bị lỗi không tải được, bài tập Quiz bị sai đáp án, lỗi giao diện).
* **Chi tiết nghiệp vụ:**
    * Học viên gửi ticket hỗ trợ kèm theo tiêu đề, danh mục lỗi (Tài khoản, Video, Quiz, Lỗi hệ thống) và nội dung mô tả chi tiết kèm hình ảnh đính kèm (nếu có).
    * **Quản lý luồng xử lý tại CMS Admin:**
        * Trạng thái Ticket tuân thủ vòng đời: `OPEN` -> `IN_PROGRESS` -> `RESOLVED` / `CLOSED`.
        * Admin có quyền nhập nội dung phản hồi, trao đổi qua lại với học viên dưới dạng khung chat luồng (Threaded Chat) bên trong ticket đó.
        * Hệ thống hỗ trợ cơ chế chuyển giao trách nhiệm xử lý (Assignee Selection): Admin điều phối có thể chuyển tiếp ticket này cho Admin phụ trách kỹ thuật hoặc Giáo viên phụ trách chuyên môn khóa học đó giải quyết.

---

## 4. KIỂM TOÁN VÀ BẢO MẬT VẬN HÀNH (AUDIT LOGS & ADVANCED SECURITY)

### 4.1. Nhật ký Hoạt động Quản trị (Admin Audit Logs)
* **Ngữ cảnh:** Khi hệ thống có nhiều nhân sự Admin (Nhân viên nhập liệu từ vựng, giáo viên chấm bài, quản trị viên hệ thống), cần ghi vết toàn bộ hành vi thay đổi dữ liệu để phục vụ truy vết khi có sự cố dữ liệu khóa học bị xóa hoặc sửa sai lệch.
* **Chi tiết nghiệp vụ:**
    * **Quy tắc ghi nhận tự động:** Hệ thống tự động ghi nhật ký đối với toàn bộ các hành động thực hiện lệnh Thêm (`CREATE`), Sửa (`UPDATE`), Xóa (`DELETE`) trên cơ sở dữ liệu CMS từ phía các tài khoản có quyền Admin. Các thao tác xem dữ liệu thông thường không ghi nhận để tránh rác hệ thống.
    * **Cấu trúc dữ liệu Log bắt buộc:**
        * `Who`: ID Admin, Email, Vai trò, Địa chỉ IP thiết bị, thông tin Trình duyệt (User-Agent).
        * `When`: Thời gian chính xác của máy chủ hệ thống (Múi giờ UTC hoặc GMT+7 kèm mili-giây).
        * `What`: Tên hành động nghiệp vụ (Ví dụ: `DELETE_QUIZ_QUESTION`, `UPDATE_COURSE_PRICE`, `MODERATE_AI_PROMPT`).
        * `Data Context`: Lưu trạng thái của đối tượng dữ liệu ngay trước khi sửa (`Old Payload`) và trạng thái dữ liệu ngay sau khi cập nhật thành công (`New Payload`) dưới dạng định dạng Text thô (JSON String) để phục vụ đối chiếu xem Admin đã sửa đổi những từ ngữ hoặc thông số cụ thể nào.
    * **Tính bất biến của Log:** Bảng dữ liệu này cấu hình theo dạng chỉ cho phép Thêm mới (`Append-Only`). Tuyệt đối không cung cấp bất kỳ tính năng hay quyền hạn nào cho phép sửa đổi hoặc xóa các dòng log này trong cơ sở dữ liệu.

### 4.2. Quản lý và Điều hòa Người dùng (User Moderation & Security Control)
* **Ngữ cảnh:** Xử lý các tình huống khẩn cấp liên quan đến an ninh hệ thống và vi phạm chính sách sử dụng, bảo vệ tài nguyên hệ thống khỏi các hành vi phá hoại từ phía người dùng cuối.
* **Chi tiết nghiệp vụ:**
    * **Tính năng Khóa tài khoản nhanh (Ban/Block User):**
        * Tại danh sách quản lý học viên, Admin có nút thao tác nhanh để chuyển trạng thái tài khoản người dùng từ `ACTIVE` sang `BANNED`.
    * **Hành động tức thời của hệ thống:** Ngay khi trạng thái chuyển sang `BANNED`, hệ thống phải lập tức thu hồi toàn bộ các chuỗi mã xác thực (Hủy bỏ JWT Token / Hủy Session hiện hành) của người dùng đó trên tất cả các thiết bị đang đăng nhập. Người dùng bị khóa tài khoản sẽ bị đẩy ra khỏi màn hình học tập ngay lập tức tại request tiếp theo và giao diện hiển thị thông báo: `"Tài khoản của bạn đã bị khóa do vi phạm chính sách hệ thống. Vui lòng liên hệ hỗ trợ."`
    * **Tiêu chí quản trị để đưa ra quyết định khóa tài khoản:** Admin thực hiện khóa tài khoản dựa trên các phát hiện thủ công hoặc cảnh báo tự động từ hệ thống bao gồm:
        * Học viên cố tình sử dụng công cụ tự động (Tool/Script) để spam liên tục lệnh nộp bài tập viết nhằm phá hoại hoặc làm cạn kiệt tài khoản API OpenAI của hệ thống.
        * Học viên cố tình nhập các văn bản có nội dung độc hại, vi phạm pháp luật, ngôn từ thù ghét vào ô bài tập làm văn của AI.
    * **Tính năng Mở khóa (Unban):** Cho phép Admin chuyển trạng thái tài khoản từ `BANNED` ngược lại về `ACTIVE` sau khi tranh chấp được giải quyết, khôi phục toàn bộ quyền truy cập vào các khóa học học viên đã mua trước đó. Mọi hành động Khóa hoặc Mở khóa tài khoản đều bắt buộc Admin phải nhập lý do giải trình hệ thống và hành động này sẽ được ghi lại vào hệ thống Nhật ký hoạt động quản trị (Audit Logs).