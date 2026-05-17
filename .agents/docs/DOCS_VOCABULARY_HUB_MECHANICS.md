# Đặc Tả Nghiệp Vụ Chức Năng: Phân Hệ Từ Vựng (Vocabulary Hub)

## 1. Tổng Quan Hệ Thống & Phạm Vi
Phân hệ Danh mục Từ vựng (Vocabulary Hub) có nhiệm vụ xây dựng kho từ điển nội bộ hệ thống nhằm hỗ trợ học viên tra cứu, học từ mới và cá nhân hóa lộ trình học thông qua tính năng lưu trữ từ vựng (Bookmark).

### Tác nhân tham gia (Actors)
* **Quản trị viên (Admin):** Toàn quyền kiểm soát (CRUD) dữ liệu từ vựng gốc thông qua giao diện CMS.
* **Học viên (User):** Tra cứu thông tin, sử dụng bộ lọc, nghe phát âm mẫu và quản lý sổ từ vựng cá nhân.

---

## 2. Kiến Trúc Cơ Sở Dữ Liệu (Database Schema Design)

Dữ liệu phân hệ từ vựng được quản lý thông qua hai bảng chính trong cơ sở dữ liệu PostgreSQL sử dụng Drizzle ORM. Tệp cấu hình sẽ được tích hợp vào `packages/db/src/schema/content.ts`.

### 2.1. Sơ đồ Quan hệ Thực thể (ERD)
* Bảng `vocabularies` có mối quan hệ Một - Nhiều (1:N) với bảng trung gian `user_bookmarks`.
* Bảng `user` có mối quan hệ Một - Nhiều (1:N) với bảng trung gian `user_bookmarks`.
* Kết quả tạo thành mối quan hệ Nhiều - Nhiều (N:M) giữa người dùng và từ vựng thông qua bảng kết nối `user_bookmarks`.

### 2.2. Chi Tiết Thuộc Tính Thực Thể

#### Bảng `vocabularies` (Dữ liệu gốc do Admin CMS quản lý)
* `id` (text): Primary Key (UUID hoặc Nanoid).
* `word` (text): Từ gốc tiếng Anh (Not Null).
* `ipa` (text): Phiên âm quốc tế chuẩn (Not Null). Ví dụ: `/kəmˈpjuː.tər/`.
* `partOfSpeech` (enum): Từ loại, bắt buộc thuộc tập hợp: `noun`, `verb`, `adjective`, `adverb`, `preposition`, `conjunction`, `idiom`, `phrasal_verb`.
* `meaningVi` (text): Định nghĩa hoặc nghĩa tiếng Việt cốt lõi (Not Null).
* `exampleEn` (text): Câu ví dụ minh họa bằng tiếng Anh (Not Null).
* `exampleVi` (text): Bản dịch nghĩa tiếng Việt của câu ví dụ (Not Null).
* `audioUrl` (text): Đường dẫn URL chứa tệp phát âm mẫu (Null hoặc Not Null). Có thể trỏ về CDN Cloudinary hoặc URL từ điển mở.
* `level` (enum): Cấp độ năng lực tiếng Anh, tái sử dụng `courseLevelEnum` sẵn có của hệ thống (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`).
* `topic` (text): Nhãn chủ đề từ vựng (Not Null). Ví dụ: `"Technology"`, `"Work"`, `"Weather"`.
* `createdAt` / `updatedAt` (timestamp): Thời gian khởi tạo và cập nhật bản ghi có kèm theo Timezone.

#### Bảng `user_bookmarks` (Mối quan hệ Nhiều - Nhiều ghi nhận tương tác cá nhân)
* `userId` (text): Foreign Key liên kết tới bảng `user.id`. Khóa phức hợp (Composite Key) chung với `vocabularyId`.
* `vocabularyId` (text): Foreign Key liên kết tới bảng `vocabularies.id`.
* `createdAt` (timestamp): Thời gian học viên thực hiện bookmark từ vựng.

### 2.3. Ràng Buộc & Chỉ Mục (Constraints & Indexes)
* **Chỉ mục duy nhất (Unique Index):** Tạo một `uniqueIndex` trên tổ hợp cặp trường `[word, partOfSpeech]`. Hệ thống chấp nhận một từ gốc xuất hiện nhiều lần nếu từ loại khác nhau (Ví dụ: từ "record" vừa là Danh từ vừa là Động từ), nhưng chặn trùng lặp tuyệt đối nếu trùng cả từ loại.
* **Xóa dây chuyền (Cascade Delete):** Cấu hình ràng buộc ngoại vi của bảng `user_bookmarks` với cơ chế `{ onDelete: "cascade" }` trên cả `userId` và `vocabularyId`. Khi Admin xóa hoàn toàn một từ vựng khỏi hệ thống, toàn bộ lượt bookmark của User liên quan đến từ đó phải tự động bị xóa sạch.

---

## 3. Quy Trình & Logic Nghiệp Vụ Chi Tiết (Business Logic)

### 3.1. Phía Quản Trị Viên (Admin CMS)
* **Thêm mới/Cập nhật từ vựng:**
    * Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào (Validation qua Zod).
    * Thực hiện chuẩn hóa chuỗi dữ liệu (Trim khoảng trắng đầu cuối, ép trường `word` về dạng chữ thường trước khi đối chiếu trùng lặp).
    * Nếu phát hiện trùng lặp tổ hợp `word` + `partOfSpeech`, hệ thống ngay lập tức từ chối và trả về mã lỗi cụ thể (Conflict Error).
* **Xử lý tệp phát âm âm thanh:**
    * Nếu tải file trực tiếp, hệ thống giới hạn dung lượng dưới `500KB`, định dạng tệp bắt buộc là `.mp3` hoặc `.m4a`.
    * Hỗ trợ cơ chế dán URL tĩnh từ bên thứ ba nhằm cắt giảm băng thông hạ tầng lưu trữ.

### 3.2. Phía Học Viên (User-side)

#### Luồng Tra cứu & Bộ lọc dữ liệu (Search & Filter Mechanics)
* **Thanh tìm kiếm thông minh:** Phải hỗ trợ tìm kiếm không phân biệt chữ hoa chữ thường (Case-insensitive) và tìm kiếm gần đúng (Partial Match).
* **Mức độ ưu tiên thuật toán tìm kiếm:**
    1. Khớp hoàn toàn với trường `word`.
    2. Khớp một phần chuỗi ký tự trong trường `word`.
    3. Khớp nội dung dịch nghĩa trong trường `meaningVi` (Giúp học viên tìm từ tiếng Anh khi chỉ nhớ nghĩa tiếng Việt).
* **Bộ lọc kết hợp:** Học viên có thể kết hợp đồng thời bộ lọc theo `level` (Enum) và `topic` (Chuỗi ký tự hoặc danh mục).
* **Phân trang bắt buộc (Pagination):** Tất cả các API danh sách từ vựng hệ thống đều phải áp dụng phân trang (Mặc định `limit = 20` bản ghi trên một trang) kèm theo các siêu dữ liệu trả về: `total`, `page`, `pageSize`, `totalPages`.

#### Luồng Sổ tay Từ vựng Cá nhân (Personal Notebook & Bookmark Mechanics)
* **Trạng thái hiển thị trực quan:** Khi nạp danh sách từ vựng tổng thể của hệ thống, API phải tự động kiểm tra xem `userId` hiện tại đã bookmark từ này chưa để trả về cờ boolean `isBookmarked: true/false`.
* **Cơ chế Bật/Tắt Yêu thích (Toggle Mutation):** Thao tác Đánh dấu / Hủy đánh dấu được gom gọn vào một Endpoint duy nhất để tối ưu hóa Frontend logic:
    * Nếu cặp `(userId, vocabularyId)` chưa tồn tại -> Thêm bản ghi mới vào bảng `user_bookmarks`.
    * Nếu cặp `(userId, vocabularyId)` đã tồn tại -> Thực hiện xóa bản ghi khỏi bảng `user_bookmarks`.
* **Không gian Sổ tay cá nhân (My Notebook):** Cung cấp API chuyên biệt chỉ truy vấn các từ vựng mà User đã lưu trữ. Tại màn hình này, tất cả bộ lọc tìm kiếm và phân trang vẫn hoạt động bình thường nhưng phạm vi dữ liệu bị giới hạn trong tập hợp dữ liệu riêng của User.

---

## 4. Đặc Tả Thiết Kế API (tRPC Routers)

Hệ thống sử dụng mô hình tRPC cho giao tiếp API bảo mật Type-safe.

### 4.1. `adminVocabularyRouter` (Nơi đặt: `packages/api/src/routers/admin/`)
Yêu cầu sử dụng `protectedProcedure` kết hợp kiểm tra quyền hạn vai trò người dùng (Bắt buộc `ctx.session.user.role === 'admin'`).
* `create`: Khởi tạo từ vựng mới (Đầu vào: Zod Object chứa đầy đủ các trường dữ liệu tĩnh).
* `update`: Chỉnh sửa từ vựng theo `id`.
* `delete`: Xóa bỏ từ vựng theo `id` (Kích hoạt luồng Cascade Delete dữ liệu tương tác).

### 4.2. `userVocabularyRouter` (Nơi đặt: `packages/api/src/routers/user/`)

#### Endpoint `list` (Query)
* **Đầu vào (Input Schema):**
    ```typescript
    z.object({
      search: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
      topic: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20)
    })
    ```
* **Logic xử lý dữ liệu:** Truy vấn song song (Parallel Fetching) sử dụng `Promise.all` danh sách các từ vựng và tổng số dòng thỏa mãn điều kiện lọc từ database để giảm thiểu tối đa độ trễ phản hồi (Latency). Thực hiện nối dữ liệu (Join/Subquery) hoặc so khớp Set để điền trường trạng thái `isBookmarked` của User.

#### Endpoint `toggleBookmark` (Mutation)
* **Đầu vào (Input Schema):** `z.object({ vocabularyId: z.string().min(1) })`
* **Logic xử lý dữ liệu:** Đảm bảo kiểm tra thực thể từ vựng tồn tại trước khi thao tác. Trả về trạng thái sau khi xử lý: `{ bookmarked: true | false }`.

---

## 5. Quy Tắc Xử Lý Ngoại Lệ & Các Trường Hợp Biên (Edge Cases)

1. **Học viên chưa thực hiện đăng nhập (Khách ẩn danh):**
    * *Nghiệp vụ:* Cho phép truy cập tính năng tìm kiếm, áp dụng bộ lọc và xem thông tin chi tiết từ vựng hệ thống chung.
    * *Giới hạn:* Khi kích hoạt hành động `toggleBookmark`, hệ thống Frontend chặn gọi API tRPC và thực hiện điều hướng (Redirect) người dùng tới trang `/login`.
2. **Đường dẫn âm thanh bị lỗi hoặc trống (Broken/Empty Audio Link):**
    * Trường hợp trường `audioUrl` có giá trị `null` hoặc liên kết CDN trả về lỗi, Frontend bắt buộc phải vô hiệu hóa (Disable) hoặc ẩn nút phát âm thanh trên giao diện, tránh tình trạng click vô định gây trải nghiệm không tốt.
3. **Hủy bookmark trực tiếp tại không gian Sổ tay cá nhân:**
    * Khi học viên thực hiện hủy bookmark một từ vựng ngay trong màn hình "Từ cần nhớ", bản ghi đó phải lập tức biến mất khỏi danh sách hiện tại. Giao diện nên hiển thị thông báo nhỏ dạng Toast có kèm theo nút "Hoàn tác" (Undo) để giảm thiểu rủi ro khi học viên bấm nhầm.

---

## 6. Chiến Lược Tối Ưu Hiệu Năng & Chi Phí Hạ Tầng

* **Tối ưu tìm kiếm văn bản phía Database:** Nhằm tránh việc sử dụng câu lệnh `LIKE '%keyword%'` quét toàn bộ bảng (Table Scan) gây quá tải CPU khi dữ liệu phình to, hệ thống khuyến nghị kích hoạt Extension **Trigram Index (`pg_trgm`)** của PostgreSQL trên cột dữ liệu `word`.
* **Chiến lược Cache phía Frontend:** Vì dữ liệu từ vựng gốc (Bảng `vocabularies`) có đặc điểm cực kỳ tĩnh, cấu hình trạng thái **TanStack Query** trên Client với `staleTime: 1000 * 60 * 60` (Bảo lưu trạng thái 1 tiếng) để triệt tiêu các lượt gọi API lặp đi lặp lại không cần thiết khi học viên chuyển đổi qua lại giữa các Tab chức năng.