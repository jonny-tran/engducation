# Hướng Dẫn Tích Hợp Frontend — Phân Hệ Khóa Học, Bài Học & Bài Tập Trắc Nghiệm

> **Package:** `@engducation/api` · **Router path:** `appRouter.admin.content` và `appRouter.user.content`
> **Kiến trúc:** tRPC (Type-safe) · **Xác thực:** Better Auth (Session/Cookie) · **Ngày cập nhật:** 2026-05-17

---

## 1. Kiến Trúc Kết Nối tRPC

### 1.1. Tại sao dùng tRPC thay vì REST thuần?

tRPC cung cấp **Type-safety end-to-end**: khi Backend thay đổi shape của dữ liệu trả về, TypeScript compiler sẽ báo lỗi ngay tại Frontend mà không cần generate lại contract. Đội ngũ Frontend chỉ cần gõ `.` sau router là IDE tự động hiển thị toàn bộ danh sách API cùng gợi ý kiểu đầy đủ.

**Cấu hình tRPC Client** (tham khảo file cấu hình trong `apps/web` hoặc `apps/mobile`):

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@engducation/api";

export const trpc = createTRPCReact<AppRouter>();
```

**Xác thực Better Auth:** Mọi request gửi đến `protectedProcedure` hoặc `adminProcedure` đều được tự động bảo mật bằng Session Cookie qua Better Auth. Frontend chỉ cần đảm bảo người dùng đã đăng nhập trước khi gọi — Cookie sẽ được tự động đính kèm vào mọi request tRPC.

| Đặc điểm | REST thuần | tRPC (dự án này) |
|---|---|---|
| Type-safety | Phải generate OpenAPI / manually | Tự động, end-to-end |
| Gợi ý API (Auto-complete) | Không | Có |
| Validate input | Manual hoặc thư viện riêng | Zod (định nghĩa tại Backend) |
| Chấm điểm Quiz (server-only) | Có thể bị lộ key API | Luôn server-side, an toàn tuyệt đối |

---

## 2. Tài Liệu API Chi Tiết

### 2.1. Vai trò: Học viên (`appRouter.user.content`)

#### 📡 `courseList` — Danh sách khóa học có phân trang

> **Loại:** Query · **Middleware:** `protectedProcedure` (cần đăng nhập)

**Input:**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `page` | `number` (int ≥ 1) | Không | `1` | Số trang hiện tại |
| `pageSize` | `number` (int, 1–100) | Không | `12` | Số khóa học mỗi trang |
| `level` | `"A1" \| "A2" \| "B1" \| "B2" \| "C1" \| "C2"` | Không | — | Lọc theo cấp độ CEFR |

**Output — Thành công:**

```typescript
{
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    status: "draft" | "published" | "archived";
    createdAt: Date;
    updatedAt: Date;
    lessons: { id: string }[];   // chỉ có id, không có nội dung bài học
    totalLessons: number;         // tổng số bài học trong khóa
    completedLessons: number;    // số bài học đã hoàn thành của user hiện tại
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

**Lưu ý hiệu năng:**
- Chỉ trả về khóa học có `status = "published"` (đã xuất bản).
- Phía Frontend nên bật **`@tanstack/react-query` staleTime** hoặc dùng `useInfiniteQuery` để tận dụng cache, tránh fetch lại khi người dùng quay lại trang danh mục.
- Backend đã flatten `totalLessons` và `completedLessons` từ DB để Frontend không cần tính toán thêm.

---

#### 📡 `courseGetDetail` — Chi tiết một khóa học và đề cương bài học

> **Loại:** Query · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `courseId` | `string` | Có | ID khóa học cần xem |

**Output — Thành công:**

```typescript
{
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  status: "published";
  createdAt: Date;
  updatedAt: Date;
  lessons: Array<{
    id: string;
    courseId: string;
    title: string;
    description: string | null;
    videoPublicId: string | null;
    videoUrl: string | null;
    order: number;        // thứ tự tuyến tính: 1, 2, 3...
    status: string;
    createdAt: Date;
    updatedAt: Date;
    progressStatus: "learning" | "completed" | null; // null = chưa học
  }>;
}
```

**Nghiệp vụ:**
- Nếu khóa học chưa xuất bản (`status !== "published"`), server trả `FORBIDDEN`.
- Mảng `lessons` đã được **sắp xếp tuyến tính** theo trường `order` từ Backend — Frontend chỉ cần render tuần tự.

---

#### 📡 `trackLessonProgress` — Cập nhật trạng thái học tập

> **Loại:** Mutation · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lessonId` | `string` | Có | ID bài học |
| `status` | `"IN_PROGRESS" \| "COMPLETED"` | Có | Trạng thái mới |

**Output — Thành công:** Trả về bản ghi `userProgress` đã được tạo hoặc cập nhật:

```typescript
{
  userId: string;
  lessonId: string;
  status: "learning" | "completed";
  updatedAt: Date;
}
```

**Luồng xử lý UX khuyến nghị:**

```
1. User bấm "Xem bài học"  →  gọi trackLessonProgress({ lessonId, status: "IN_PROGRESS" })
   → hiển thị thanh tiến độ "Đang học"

2. Video phát xong (event: onEnded)
   → gọi trackLessonProgress({ lessonId, status: "COMPLETED" })
   → cập nhật thanh tiến độ "Hoàn thành" trên UI
   → tự động hiện nút "Làm bài tập" (nếu có quiz)
```

**Nghiệp vụ:** Sử dụng UPSERT — nếu bản ghi đã tồn tại, chỉ cập nhật `status` và `updatedAt`, không tạo dòng mới.

---

#### 📡 `lessonGetDetail` — Chi tiết bài học (kèm Quiz ẩn đáp án)

> **Loại:** Query · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lessonId` | `string` | Có | ID bài học |

**Output — Thành công:**

```typescript
{
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoPublicId: string | null;
  videoUrl: string | null;
  order: number;
  status: "published";
  course: { id, title, level, status, ... };
  quiz: {
    id: string;
    title: string;
    questions: Array<{
      id: string;          // UUID — dùng làm key React
      content: string;      // nội dung câu hỏi
      order: number;        // thứ tự câu hỏi
      answers: Array<{
        id: string;         // UUID answer — gửi lên khi submit
        content: string;    // nội dung lựa chọn A / B / C / D
      }>;
    }>;
  } | null;   // null nếu bài học chưa có quiz
}
```

**🔒 ANTI-CHEAT — Rất quan trọng:**
- Backend **KHÔNG BAO GIỜ** gửi `isCorrect` hoặc `explanation` về phía client trong API này.
- Nếu Frontend mở Developer Tools (F12), không có thông tin nào về đáp án đúng.
- Sau khi User nộp bài (`submitQuiz`), server mới trả `correctOption` và `explanation` trong kết quả chấm điểm.

---

#### 📡 `lessonGetMediaUrl` — Lấy URL video đã ký (signed URL Cloudinary)

> **Loại:** Mutation · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lessonId` | `string` | Có | ID bài học |

**Output — Thành công:**

```typescript
{
  url: string;     // Cloudinary signed URL có TTL 1 giờ
  expiresAt: Date; // thời điểm URL hết hạn
}
```

**Lưu ý:** URL trả về là **signed URL** — có chữ ký HMAC-SHA256 kèm timestamp, chỉ hợp lệ trong 1 giờ. Frontend cần gọi lại mutation này nếu video đang load lâu (quá 1 giờ).

---

#### 📡 `getQuiz` — Lấy đề bài trắc nghiệm (ẩn đáp án)

> **Loại:** Query · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lessonId` | `string` | Có | ID bài học |

**Output — Thành công:**

```typescript
{
  id: string;        // quiz ID — dùng khi submit
  title: string;    // tiêu đề bài tập
  questions: Array<{
    id: string;         // question UUID — gửi kèm trong answers[]
    content: string;   // nội dung câu hỏi
    order: number;     // thứ tự hiển thị
    answers: Array<{
      id: string;      // answer UUID — gửi khi nộp bài (giá trị selectedOption)
      content: string; // nội dung lựa chọn (A, B, C, D)
    }>;
  }>;
}
```

**🔒 ANTI-CHEAT:**
- Tuyệt đối **không có** trường `isCorrect` hay `explanation` trong response này.
- Logic chấm điểm diễn ra **hoàn toàn phía server** — Frontend chỉ gửi mảng `selectedOption` và nhận kết quả đã chấm.

**Lưu ý nghiệp vụ:**
- Quiz gắn với `lessonId`, không gắn trực tiếp với `courseId`. Mỗi bài học chỉ có **tối đa 1 quiz**.
- Nếu bài học chưa có quiz, server trả `NOT_FOUND`.

---

#### 📡 `submitQuiz` — Nộp bài và nhận kết quả chấm điểm

> **Loại:** Mutation · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lessonId` | `string` | Có | ID bài học |
| `answers` | `Array<{ questionId: string; selectedOption: "A" \| "B" \| "C" \| "D" }>` | Có | Mảng đáp án đã chọn |

**Cấu trúc `answers` chi tiết:**

```typescript
answers: [
  { questionId: "uuid-câu-hỏi-1", selectedOption: "B" },
  { questionId: "uuid-câu-hỏi-2", selectedOption: "A" },
  { questionId: "uuid-câu-hỏi-3", selectedOption: "D" },
  // ...
]
```

> **Quy tắc mapping đáp án:** Frontend gửi `selectedOption` dưới dạng nhãn `"A"`, `"B"`, `"C"`, `"D"` — tương ứng với thứ tự các lựa chọn nhận được trong `getQuiz.questions[n].answers`. Backend tự động map sang answer UUID phía server.

**Output — Thành công:**

```typescript
{
  attemptId: string;           // UUID của bản ghi lịch sử làm bài
  score: number;               // điểm số (0–100)
  totalQuestions: number;      // tổng số câu hỏi
  correctCount: number;       // số câu đúng
  passed: boolean;             // true khi score >= 70
  results: Array<{
    questionId: string;
    selectedOption: "A" | "B" | "C" | "D";   // đáp án user đã chọn
    selectedAnswerId: string;                 // UUID answer đã chọn
    isCorrect: boolean;                        // đúng hay sai
    correctOption: "A" | "B" | "C" | "D";     // đáp án đúng
    explanation: string | null;                // giải thích (server gửi sau khi nộp)
  }>;
}
```

**Luồng UX khuyến nghị:**

```
1. User làm quiz trên UI (chọn A/B/C/D)
   → Frontend lưu state cục bộ, KHÔNG gọi API từng câu

2. User bấm "Nộp bài"
   → gọi submitQuiz({ lessonId, answers: [...] })
   → nhận kết quả đã chấm điểm

3. Hiển thị màn hình kết quả:
   → score, passed, danh sách câu đúng/sai
   → highlight đáp án đúng + hiển thị explanation

4. Nếu passed = true (score >= 70):
   → lesson tự động được đánh dấu "Hoàn thành"
   → Frontend có thể cập nhật Progress bar mà không cần gọi thêm API
```

**Nghiệp vụ JSONB — Tại sao lưu array đáp án dưới dạng JSONB:**
- Mỗi bài quiz có số câu hỏi và cấu trúc khác nhau. Dùng JSONB cho phép lưu toàn bộ lịch sử lựa chọn của user vào **một cột duy nhất** mà không cần bảng trung gian.
- Trong DB: `quiz_attempts.selectedAnswers` là kiểu `jsonb`, chứa mảng snapshot đã được "đóng băng" tại thời điểm nộp bài.
- Ưu điểm: giảm số lượng bảng/row, truy vấn lịch sử nhanh, không cần JOIN nhiều bảng.

---

#### 📡 `quizAttemptsHistory` — Lịch sử các lần làm bài

> **Loại:** Query · **Middleware:** `protectedProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `quizId` | `string` | Có | ID bài tập |

**Output — Thành công:** Mảng `quizAttempts`, mỗi phần tử chứa toàn bộ snapshot JSONB đã nộp.

---

### 2.2. Vai trò: Quản trị viên (`appRouter.admin.content`)

> **Middleware:** `adminProcedure` — kiểm tra `session.user.role === "admin"`. Nếu không phải Admin, server trả `UNAUTHORIZED`.

#### 📡 `courseList` — Danh sách khóa học có phân trang (Admin)

> **Loại:** Query · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `page` | `number` (int ≥ 1) | Không | `1` | Số trang |
| `pageSize` | `number` (int, 1–100) | Không | `20` | Số khóa học mỗi trang |
| `level` | `"A1" \| "A2" \| "B1" \| "B2" \| "C1" \| "C2"` | Không | — | Lọc theo cấp độ |
| `status` | `"draft" \| "published" \| "archived"` | Không | — | Lọc theo trạng thái |
| `search` | `string` | Không | — | Tìm kiếm theo tiêu đề hoặc mô tả |

**Output — Thành công:**

```typescript
{
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    status: "draft" | "published" | "archived";
    createdAt: Date;
    updatedAt: Date;
    lessons: { id: string }[];  // chỉ count
    lessonCount: number;        // tổng số bài học
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

**Lưu ý:** Khác với phiên bản User, Admin thấy **tất cả khóa học** (bao gồm `draft` và `archived`), không chỉ `published`.

---

#### 📡 `courseCreate` — Tạo mới khóa học

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | `string` (min 1) | Có | Tiêu đề khóa học |
| `description` | `string` | Không | Mô tả chi tiết |
| `thumbnailUrl` | `string` (URL) | Không | Link ảnh đại diện |
| `level` | `"A1" \| "A2" \| "B1" \| "B2" \| "C1" \| "C2"` | Có | Cấp độ CEFR |
| `status` | `"draft" \| "published" \| "archived"` | Không | Mặc định: `"draft"` |

**Output:** Trả về bản ghi `courses` vừa được tạo.

---

#### 📡 `courseUpdate` — Chỉnh sửa khóa học

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:** Tương tự `courseCreate`, thêm trường bắt buộc `id: string`.

---

#### 📡 `courseDelete` — Xóa khóa học

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | `string` | Có | ID khóa học cần xóa |

**Nghiệp vụ:**
- Nếu khóa học đang có bài học (`lessonCount > 0`), server trả `PRECONDITION_FAILED` kèm số lượng bài học đang tồn tại.
- Frontend **nên hiển thị Confirm Dialog** trước khi gọi API này.

---

#### 📡 `lessonCreate` — Tạo bài học mới

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `courseId` | `string` | Có | ID khóa học cha |
| `title` | `string` (min 1) | Có | Tiêu đề bài học |
| `description` | `string` | Không | Mô tả bài học |
| `videoPublicId` | `string` | Không | Cloudinary public ID |
| `videoUrl` | `string` (URL) | Không | Cloudinary URL |
| `order` | `number` (int ≥ 1) | Không | Thứ tự hiển thị. Nếu bỏ qua, tự động gán số tiếp theo |
| `status` | `"draft" \| "published" \| "archived"` | Không | Mặc định: `"draft"` |

**Output:** Trả về bản ghi `lessons` vừa được tạo.

---

#### 📡 `lessonUpdate` — Chỉnh sửa bài học

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:** Tương tự `lessonCreate`, thêm trường bắt buộc `id: string`. Không thể thay đổi `courseId` (đã bị loại khỏi input).

---

#### 📡 `lessonDelete` — Xóa bài học

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | `string` | Có | ID bài học cần xóa |

**Nghiệp vụ:** Xóa bài học sẽ cascade xóa quiz, câu hỏi và đáp án gắn với nó.

---

#### 📡 `lessonReorder` — Sắp xếp lại thứ tự bài học

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

```typescript
{
  courseId: string;
  movements: Array<{
    id: string;    // lesson UUID
    order: number; // thứ tự mới (int ≥ 1)
  }>;
}
```

**Nghiệp vụ:**
- Backend dùng chiến lược **2-phase update** (đẩy tạm sang giá trị âm → gán giá trị mới) để tránh vi phạm unique constraint trên `(courseId, order)`.
- Số thứ tự trong `movements` phải **không trùng nhau** — server trả `BAD_REQUEST` nếu có.

---

#### 📡 `quizUpsertStructure` — Tạo mới / cập nhật toàn bộ cấu trúc quiz

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `quizId` | `string` | Không | Bỏ qua → tạo mới; có → cập nhật |
| `lessonId` | `string` | Có | ID bài học |
| `title` | `string` | Có | Tiêu đề bài tập |
| `questions` | `Array<QuestionInput>` | Có | Mảng câu hỏi |

**Cấu trúc `QuestionInput`:**

```typescript
{
  id: string;              // UUID do frontend/admin tạo (upsert idempotent)
  content: string;         // nội dung câu hỏi
  explanation: string;      // giải thích (sẽ gửi cho user sau khi nộp bài)
  order: number;           // thứ tự câu hỏi
  answers: Array<{
    id: string;            // UUID answer
    content: string;       // nội dung lựa chọn A/B/C/D
    isCorrect: boolean;    // đáp án đúng (chỉ backend thấy)
  }>;
}
```

**Nghiệp vụ:**
- Mỗi câu hỏi **phải có ít nhất 1 đáp án đúng** (`isCorrect: true`), server trả `BAD_REQUEST` nếu thiếu.
- Khi update (`quizId` có giá trị): xóa toàn bộ câu hỏi cũ rồi chèn lại từ đầu.

---

#### 📡 `createQuizQuestion` — Thêm một câu hỏi vào quiz hiện có

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `quizId` | `string` | Có | ID quiz cần thêm câu hỏi |
| `content` | `string` | Có | Nội dung câu hỏi |
| `explanation` | `string` | Không | Giải thích đáp án đúng |
| `order` | `number` (int ≥ 1) | Có | Thứ tự câu hỏi |
| `answers` | `Array<{ id: string; content: string; isCorrect: boolean }>` | Có | Tối thiểu 2 đáp án, ít nhất 1 `isCorrect: true` |

**Output:** Trả về bản ghi `questions` với danh sách `answers` vừa được tạo.

---

#### 📡 `quizDelete` — Xóa bài tập

> **Loại:** Mutation · **Middleware:** `adminProcedure`

**Input:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | `string` | Có | ID quiz cần xóa |

**Nghiệp vụ:** Cascade xóa toàn bộ câu hỏi và đáp án.

---

#### 📡 `dashboardStats` — Số liệu tổng quan CMS

> **Loại:** Query · **Middleware:** `adminProcedure`

**Output:**

```typescript
{
  totalCourses: number;
  totalLessons: number;
  totalQuizzes: number;
  totalProgressLogs: number;
}
```

---

## 3. Xử Lý Lỗi TRPCError

### 3.1. Bảng mã lỗi và hướng xử lý UI

| Mã lỗi tRPC | Nghiệp vụ kích hoạt | UX khuyến nghị cho Frontend |
|---|---|---|
| `UNAUTHORIZED` (401) | User chưa đăng nhập, session hết hạn, hoặc gọi Admin API mà không có quyền | Điều hướng về trang `/login`. Xóa token/session cũ. |
| `FORBIDDEN` (403) | User cố tình gọi Admin API; hoặc truy cập khóa học/bài học có `status !== "published"` | Hiển thị trang lỗi 403 hoặc thông báo "Bạn không có quyền truy cập nội dung này". |
| `NOT_FOUND` (404) | `courseId`, `lessonId`, `quizId` không tồn tại trong DB | Hiển thị thông báo "Nội dung không tồn tại hoặc đã bị xóa". |
| `BAD_REQUEST` (400) | Dữ liệu không vượt qua Zod validation (tiêu đề trống, URL sai định dạng, số thứ tự trùng nhau...) | Hiển thị lỗi validation **trực tiếp dưới ô nhập liệu** tương ứng (inline field error). |
| `PRECONDITION_FAILED` (412) | Thao tác xóa khóa học khi đang có bài học bên trong | Hiển thị Confirm Dialog: "Khóa học có X bài học. Hãy xóa toàn bộ bài học trước." |
| `INTERNAL_SERVER_ERROR` (500) | Lỗi hệ thống không lường trước (insert thất bại, transaction lỗi...) | Hiển thị Toast: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." |

### 3.2. Ví dụ bắt lỗi trong React

```typescript
import { TRPCError } from "@trpc/server";

try {
  await trpc.user.content.trackLessonProgress.mutate({ ... });
} catch (err) {
  if (err instanceof TRPCError) {
    switch (err.code) {
      case "UNAUTHORIZED":
        router.push("/login");
        break;
      case "NOT_FOUND":
        toast.error("Bài học không tồn tại hoặc đã bị xóa");
        break;
      case "BAD_REQUEST":
        toast.error(err.message); // Zod validation message
        break;
      default:
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  }
}
```

### 3.3. Cấu hình tRPC Error Handler (toàn cục)

```typescript
import { httpBatchLink } from "@trpc/client";
import { default as TRPCError } from "@trpc/server";

const trpc = createTRPCReact<AppRouter>();

function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({ url: "/api/trpc" }),
    ],
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          // Frontend nhận: error.data.code, error.data.message
        },
      };
    },
  });
}
```

---

## 4. Cấu Trúc Dữ Liệu Backend (Database Schema)

```
┌─────────────────────────────────────────────────────────────┐
│                        courses                              │
│  id, title, description, thumbnailUrl, level, status        │
│  ─────────────────────────────────────────────────────     │
│  has many → lessons (onDelete: restrict)                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ lessons  │   │ quizzes  │   │  quizzes │  (quiz gắn 1 lesson)
        │          │   └──────────┘   └──────────┘
        │  id      │         │
        │  order   │         ▼
        │  video*  │   ┌──────────┐
        └──────────┘   │questions │
              │         └──────────┘
              │               │
              ▼               ▼
        ┌──────────┐   ┌──────────┐
        │userProg. │   │ answers   │
        │ (per us) │   │isCorrect  │
        └──────────┘   └──────────┘
              │
              ▼
        ┌──────────────────┐
        │  quizAttempts    │
        │  selectedAnswers │  ← JSONB snapshot
        │  score           │
        └──────────────────┘
```

**Ràng buộc đặc biệt:**
- `lessons.order` là **unique** trong phạm vi 1 khóa học `(courseId, order)` → đảm bảo không trùng thứ tự.
- `quizzes.lessonId` là **unique** → mỗi bài học chỉ có tối đa 1 quiz.
- `userProgress` có **composite primary key** `(userId, lessonId)` → mỗi user chỉ có 1 bản ghi tiến độ cho 1 bài học.

---

## 5. Checklist Tích Hợp Frontend

### Trước khi bắt đầu

- [ ] Đã cài `@trpc/react-query`, `@trpc/client`, `@tanstack/react-query`
- [ ] Đã cấu hình tRPC Client trỏ đến `/api/trpc`
- [ ] Đã wrap app bằng `trpc.withTRPC(App)` provider

### Trang Danh mục Khóa học (`/courses`)

- [ ] Gọi `trpc.user.content.courseList.useQuery({ page, pageSize, level })`
- [ ] Gắn badge cấp độ (A1, B1...) dựa trên `item.level`
- [ ] Hiển thị thanh tiến độ: `completedLessons / totalLessons`
- [ ] Phân trang: cập nhật `page` khi user chuyển trang

### Trang Chi tiết Khóa học (`/courses/[courseId]`)

- [ ] Gọi `trpc.user.content.courseGetDetail.useQuery({ courseId })`
- [ ] Render danh sách `lessons` theo thứ tự `order`
- [ ] Màu trạng thái: `learning` (vàng), `completed` (xanh lá), `null` (xám)

### Trang Bài học (`/lessons/[lessonId]`)

- [ ] Gọi `trpc.user.content.lessonGetMediaUrl.useMutation()` khi bắt đầu load trang
- [ ] Gọi `trackLessonProgress({ lessonId, status: "IN_PROGRESS" })` khi user mở bài
- [ ] Gắn `onEnded` event trên video player → gọi `trackLessonProgress({ lessonId, status: "COMPLETED" })`

### Trang Làm Quiz (`/lessons/[lessonId]/quiz`)

- [ ] Gọi `trpc.user.content.getQuiz.useQuery({ lessonId })` để lấy đề
- [ ] Render từng câu hỏi: map `answers[n]` theo thứ tự A, B, C, D
- [ ] Gửi `selectedOption: "A"|"B"|"C"|"D"` — **không gửi answer UUID**
- [ ] Gọi `submitQuiz({ lessonId, answers })` khi bấm "Nộp bài"
- [ ] Hiển thị `results[n].correctOption` + `explanation` sau khi nộp

### Trang CMS Quản trị (`/admin/courses`)

- [ ] Dùng `trpc.admin.content.courseList` (không lọc `published`)
- [ ] Gọi `courseCreate`, `courseUpdate`, `courseDelete` với Confirm Dialog
- [ ] Gọi `lessonCreate` sau khi chọn khóa học

### Trang CMS Quiz (`/admin/lessons/[lessonId]/quiz`)

- [ ] Dùng `trpc.admin.content.quizUpsertStructure` để tạo/sửa toàn bộ quiz
- [ ] Hoặc `createQuizQuestion` để thêm từng câu
- [ ] Luôn đảm bảo mỗi câu hỏi có ít nhất 1 `isCorrect: true`
