# Hướng dẫn Cấu trúc & Tổ chức Mã nguồn (Engducation Monorepo)

Tài liệu này mô tả chi tiết cách tổ chức mã nguồn, kiến trúc hệ thống và các quy tắc lập trình cốt lõi áp dụng cho cả Frontend và Backend trong dự án **Engducation**. Hướng dẫn này giúp định hướng cho các AI Agent và lập trình viên phát triển mã nguồn một cách đồng bộ, an toàn và tuân thủ đúng kiến trúc đã thiết kế.

---

## 1. Tổng quan Kiến trúc Monorepo

Dự án Engducation được tổ chức dưới dạng **Monorepo** quản lý bởi **Turborepo** và sử dụng trình quản lý gói **PNPM** với tính năng **PNPM Workspace** và **PNPM Catalogs** hiện đại (PNPM 10).

```mermaid
graph TD
    subgraph Apps (Ứng dụng chính)
        web[apps/web - Next.js Frontend]
        server[apps/server - ElysiaJS Backend]
    end

    subgraph Packages (Thư viện chia sẻ)
        api[packages/api - tRPC Routers & Context]
        auth[packages/auth - Better Auth Server Config]
        db[packages/db - Neon Serverless & Drizzle ORM]
        env[packages/env - Dynamic Server/Web Env Validation]
        ui[packages/ui - Shared Shadcn UI Components & Tailwind v4]
        config[packages/config - Base shared configurations]
    end

    web --> api
    web --> auth
    web --> env
    web --> ui

    server --> api
    server --> auth
    server --> env

    api --> auth
    api --> db
    api --> env

    auth --> db
    auth --> env

    db --> env
```

### Các Lệnh Quản trị Hệ thống ở Thư mục Gốc (Root)
Các lệnh thực thi toàn dự án được định nghĩa tập trung tại `package.json` gốc:
*   `pnpm dev`: Khởi chạy môi trường phát triển đồng thời cho cả Frontend (`apps/web`) và Backend (`apps/server`) thông qua `turbo dev`.
*   `pnpm build`: Biên dịch toàn bộ các ứng dụng và thư viện.
*   `pnpm check-types`: Kiểm tra kiểu dữ liệu TypeScript tĩnh trên toàn bộ monorepo.
*   `pnpm dev:web`: Khởi chạy riêng ứng dụng Next.js Frontend.
*   `pnpm dev:server`: Khởi chạy riêng server ElysiaJS Backend.
*   `pnpm db:push`: Đẩy trực tiếp schema thay đổi lên Neon Serverless PostgreSQL thông qua Drizzle Kit.
*   `pnpm db:generate`: Tạo các tệp migration SQL.
*   `pnpm db:migrate`: Áp dụng các tệp migration vào cơ sở dữ liệu production.
*   `pnpm db:seed`: Gieo dữ liệu mẫu (seeding) vào cơ sở dữ liệu.
*   `pnpm db:reset`: Reset toàn bộ dữ liệu hiện có trong database.

---

## 2. Chi tiết Cấu trúc & Tổ chức các Packages Chia sẻ (`packages/`)

Các thư viện trong thư mục `packages/` đóng vai trò là xương sống kết nối Frontend và Backend. Chúng độc lập, có thể tái sử dụng cao và được biên dịch trực tiếp thông qua cơ chế Workspace của PNPM.

### 2.1. `@engducation/env` (packages/env)
Gói quản lý và xác thực nghiêm ngặt các biến môi trường tại thời điểm runtime sử dụng `@t3-oss/env-core` và `@t3-oss/env-nextjs` kết hợp thư viện xác thực **Zod**.
*   **Xuất bản (Exports):**
    *   `@engducation/env/server`: Chứa các biến môi trường chỉ chạy phía máy chủ (ví dụ: `DATABASE_URL`, `BETTER_AUTH_SECRET`, API keys của Cloudinary). Tự động nạp từ `.env.local` hoặc `.env` ở thư mục gốc của dự án.
    *   `@engducation/env/web`: Chứa các biến môi trường công khai phía máy khách (bắt đầu bằng tiền tố `NEXT_PUBLIC_`).
*   **Điểm nổi bật:**
    *   Tự động ánh xạ biến dựa trên môi trường `NODE_ENV`. Ví dụ: `DATABASE_URL` sẽ ánh xạ từ `DATABASE_URL_DEVELOPMENT` ở local dev và `DATABASE_URL_PRODUCTION` ở môi trường production.
    *   Ngăn chặn rò rỉ các khoá bí mật (Secret Keys) của server xuống phía client.

### 2.2. `@engducation/db` (packages/db)
Tầng giao tiếp Cơ sở dữ liệu sử dụng **Drizzle ORM** kết nối tới **Neon Serverless PostgreSQL** bằng WebSocket (`@neondatabase/serverless` kết hợp `ws`).
*   **Cấu trúc thư mục:**
    *   `src/index.ts`: Khởi tạo Drizzle instance với cơ chế Pool Connection thích ứng tốt với Serverless.
    *   `src/schema/`: Chứa các tệp định nghĩa schema chia thành:
        *   `auth.ts`: Lưu trữ bảng người dùng, phiên đăng nhập, tài khoản liên kết, và mã xác thực phục vụ Better Auth.
        *   `content.ts`: Lưu trữ bảng phục vụ hệ thống học tập bao gồm khóa học (Courses), học phần (Modules), bài học (Lessons), bài tập trắc nghiệm (Quizzes), tiến độ học tập (Progress) và các bài viết luận (Writing submissions).
    *   `src/scripts/`: Chứa mã kịch bản seed dữ liệu mẫu và reset database.
*   **Điểm nổi bật:**
    *   Mỗi khi thay đổi schema tại đây, cần thực thi `pnpm db:generate` và `pnpm db:push` từ thư mục gốc để đồng bộ database.

### 2.3. `@engducation/auth` (packages/auth)
Định nghĩa cấu hình dịch vụ xác thực **Better Auth** phía Server.
*   **Cấu trúc mã nguồn:**
    *   Sử dụng `drizzleAdapter` liên kết trực tiếp với database thông qua `@engducation/db/schema/auth`.
    *   Kích hoạt xác thực Email/Password (`emailAndPassword: { enabled: true }`).
    *   Thiết lập cookie bảo mật nâng cao (`sameSite: "none"`, `secure: true`, `httpOnly: true`) để cho phép trao đổi cookie xuyên suốt giữa hai domain riêng biệt của Frontend và Backend.
    *   Tích hợp plugin `admin` để phân quyền quản trị viên (`adminRoles: ["admin"]`, `defaultRole: "user"`).

### 2.4. `@engducation/api` (packages/api)
Thư viện chứa toàn bộ logic API sử dụng **tRPC** (bản v11). Đây là nơi định nghĩa các endpoint và phương thức giao tiếp type-safe tuyệt đối giữa web app và server app.
*   **Cấu trúc thư mục:**
    *   `src/context.ts`: Định nghĩa `createContext` để trích xuất session đăng nhập từ headers thông qua `auth.api.getSession` và khởi tạo kết nối DB Drizzle phục vụ các query/mutation.
    *   `src/index.ts`: Khởi tạo tRPC (`initTRPC`), thiết lập các thủ tục (Procedures):
        *   `publicProcedure`: API mở, không cần đăng nhập.
        *   `protectedProcedure`: API cần đăng nhập (kiểm tra `ctx.session`, nếu không có trả về lỗi `UNAUTHORIZED`).
        *   `adminProcedure`: API chỉ dành cho Quản trị viên (kiểm tra `ctx.session.user.role === "admin"`).
    *   `src/routers/`: Chứa danh sách các Router nghiệp vụ:
        *   `admin/`: Các tác vụ quản trị khóa học, bài giảng, từ vựng và bài tập.
        *   `user/`: Các tác vụ của học viên như đăng ký khóa học, cập nhật tiến độ, nộp bài viết AI.
        *   `media.ts`: Tạo chữ ký upload trực tiếp lên Cloudinary.

### 2.5. `@engducation/ui` (packages/ui)
Hệ thống thiết kế (Design System) và các thành phần giao diện dùng chung phát triển trên nền **Tailwind CSS v4** và **Shadcn UI**.
*   **Cấu trúc thư mục:**
    *   `src/styles/globals.css`: Định nghĩa cấu hình Tailwind v4 dạng CSS-first. Sử dụng các biến màu sắc trong hệ màu `oklch` hiện đại cho cả Light và Dark Mode.
    *   `src/components/`: Tập hợp hơn 50 UI component chất lượng cao của Shadcn UI như Accordion, Button, Calendar, Dialog, Form Field, Sidebar, Table, Sonner Toast, v.v.
    *   `src/lib/utils.ts`: Chứa hàm `cn` hỗ trợ gộp class Tailwind thông qua `clsx` và `tailwind-merge`.

---

## 3. Kiến trúc Frontend (`apps/web`)

Ứng dụng Frontend được xây dựng bằng framework **Next.js 16 (App Router)** chạy tại cổng mặc định `3001` ở môi trường phát triển. Giao diện được tối ưu hóa theo hướng chuyên nghiệp, đáp ứng nhanh và tương tác mượt mà.

### 3.1. Cấu trúc Thư mục `apps/web/src`
*   `app/`: Quản lý các tuyến đường ứng dụng (Routing) của Next.js:
    *   `layout.tsx` & `page.tsx`: Giao diện bao ngoài và trang chủ chính.
    *   `[userId]/`: Trang thông tin cá nhân và lịch sử học tập của học sinh.
    *   `admin/[adminId]/`: Các trang quản trị hệ thống (Dashboard, Courses, Users, Settings).
    *   `courses/`: Khám phá và đăng ký danh sách khóa học.
    *   `vocabulary/`: Trang học từ vựng cá nhân (`my-notebook`).
    *   `login/`: Giao diện đăng nhập/đăng ký.
*   `components/`: Các thành phần giao diện đặc thù của web (không nằm trong ui package):
    *   `layout/`: Chứa thanh điều hướng Header, Footer,...
    *   `providers/`: Tích hợp các Provider bao bọc ứng dụng (`ThemeProvider` cho dark mode, `QueryClientProvider` cho React Query, `CartProvider` cho giỏ hàng, và `Toaster`).
*   `context/`: Chứa các React Context cụ thể, ví dụ: `CartContext`.
*   `features/`: **Tổ chức mã nguồn theo tính năng học tập (Feature-driven).** Mỗi tính năng lớn nằm trong một thư mục khép kín gồm UI components, hooks riêng biệt:
    *   `vocabulary/`: Quản lý từ vựng của học sinh và biên soạn từ vựng của admin.
    *   `learning-content/`: Quản lý hiển thị khóa học, bài học video, bài thi trắc nghiệm (Quiz Engine), tích hợp trình soạn thảo bài viết luận tiếng Anh.
    *   `auth/`: Xử lý giao diện và trạng thái đăng nhập/đăng ký.
    *   `admin-dashboard/`: Các biểu đồ thống kê học tập cho admin.
*   `hooks/`: Chứa các custom React hooks dùng chung của web app.
*   `lib/`: Các dịch vụ thư viện client-side:
    *   `auth-client.ts`: Khởi tạo Client SDK của Better Auth (`createAuthClient`) kết nối với Server API.
    *   `axios-client.ts`: Client Axios cấu hình sẵn `withCredentials: true` và bộ xử lý lỗi (Interceptor) tự động chuyển hướng về `/login` nếu phiên đăng nhập hết hạn (lỗi 401).
*   `utils/`:
    *   `trpc.ts`: Cấu hình tRPC Client (`createTRPCClient`) sử dụng proxy React Query (`createTRPCOptionsProxy`) liên kết chặt chẽ với `@engducation/api/routers/index`. Định nghĩa xử lý lỗi tRPC tập trung.

### 3.2. Quy tắc Giao tiếp tRPC trên Frontend
Để tối ưu và giữ tính type-safe cao, Frontend gọi API thông qua biến `trpc` được xuất từ `@/utils/trpc`.
Ví dụ gọi dữ liệu:
```tsx
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery(
  trpc.userVocabulary.list.queryOptions({ courseId })
);
```

Ví dụ thực thi Mutation:
```tsx
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";

const { mutate } = useMutation(
  trpc.userVocabulary.toggleSave.mutationOptions({
    onSuccess: () => {
      // Invalidate queries để tự động làm mới dữ liệu
    }
  })
);
```

---

## 4. Kiến trúc Backend (`apps/server`)

Ứng dụng Backend được phát triển trên nền tảng **ElysiaJS** siêu nhanh, chạy trong môi trường Node.js tại cổng `3000`. Server chịu trách nhiệm xử lý các tác vụ API tRPC, quản lý xác thực Better Auth và hiển thị tài liệu đặc tả API chuẩn OpenAPI.

### 4.1. Chức năng chính trong `apps/server/src/index.ts`
1.  **Swagger & Scalar UI:**
    *   Tại thời điểm khởi chạy, server sử dụng thư viện `@trpc/openapi` để phân tích tĩnh (statically analyse) kiểu dữ liệu `AppRouter` của tRPC.
    *   Tự động kết hợp đặc tả API của tRPC và đặc tả các endpoint xác thực của Better Auth để xuất bản tài liệu OpenAPI hoàn chỉnh tại `/openapi.json`.
    *   Tích hợp giao diện thử nghiệm API đẹp mắt sử dụng **Scalar UI** tại địa chỉ `/swagger`.
2.  **Định tuyến API tRPC:**
    *   Tất cả các yêu cầu gửi đến `/trpc/*` sẽ được phân tích và điều phối bởi bộ xử lý `fetchRequestHandler` liên kết với `appRouter` và `createContext` từ `@engducation/api`.
3.  **Endpoint Xác thực Better Auth:**
    *   Đăng ký các route xác thực (`/api/auth/*`) thông qua plugin trung gian `createBetterAuthRoutes({ authInstance: auth })`.
4.  **Cấu hình CORS:**
    *   Cho phép chia sẻ tài nguyên nguồn gốc chéo (CORS) với Frontend (`CORS_ORIGIN` được kiểm soát từ env).
    *   Bắt buộc cấu hình `credentials: true` và cho phép các header `Content-Type`, `Authorization`, và `openai-ephemeral-user-id`.

---

## 5. Quy tắc Phát triển & Đồng bộ hóa Mã nguồn

Để mã nguồn luôn thống nhất, lập trình viên và các AI Agent bắt buộc phải tuân theo các nguyên tắc thiết kế và phát triển sau:

1.  **Tuyệt đối tuân thủ đường dẫn Import:**
    *   Luôn sử dụng import từ các Package chia sẻ thay vì viết lại mã nguồn hoặc trích xuất tương đối phức tạp qua thư mục ứng dụng khác.
    *   Sử dụng `@engducation/env/server` cho các tiến trình chạy trên Server (backend, tRPC context, better auth config).
    *   Sử dụng `@engducation/env/web` cho mã nguồn chạy ở Browser của Next.js Frontend.
    *   Sử dụng `@engducation/ui/components/*` để lấy UI components của Shadcn.
    *   Trên Frontend Next.js, sử dụng cấu hình `@/*` trỏ về thư mục `apps/web/src/*` để import các tài nguyên nội bộ.
2.  **Tính năng phát triển (Feature-driven) trên Frontend:**
    *   Mã nguồn Frontend liên quan tới nghiệp vụ cụ thể (như từ vựng, bài tập luận AI) bắt buộc phải nằm trong `apps/web/src/features/[feature-name]`.
    *   Không được viết các component quá cồng kềnh trực tiếp trong thư mục `apps/web/src/app`. Thư mục `app/` chỉ nên chứa tệp định tuyến chính (`page.tsx`, `layout.tsx`) và gọi Component tổng từ thư mục `features/` tương ứng.
3.  **Tích hợp Database & Schema:**
    *   Không khai báo schema database trực tiếp ở Backend hay Frontend. Tất cả định nghĩa thực thể bảng và quan hệ phải được thực hiện tại `@engducation/db/schema/*`.
    *   Sau khi sửa schema, bắt buộc phải chạy `db:generate` và `db:push` để cơ sở dữ liệu Neon luôn đồng bộ với cấu trúc TypeScript trong mã nguồn.
4.  **Quản lý lỗi tRPC tập trung:**
    *   Tất cả các lỗi trả về từ backend tRPC sẽ đi qua bộ lọc trung gian tại `apps/web/src/utils/trpc.ts`. Lỗi liên quan đến quyền truy cập (`UNAUTHORIZED` hoặc `FORBIDDEN`) sẽ tự động xóa phiên và chuyển hướng người dùng về `/login`. Lỗi nghiệp vụ thông thường sẽ hiển thị dưới dạng thông báo Toast đẹp mắt kèm nút bấm "Thử lại" (Retry).

---

## 6. Danh mục Bộ Kỹ năng Hỗ trợ (Agent Skills)

Dưới đây là danh sách các kỹ năng bổ trợ (Skills) sẵn có trong thư mục `.agents/skills/`. Khi thực hiện lập trình hoặc gỡ lỗi, các AI Agent cần tham khảo các kỹ năng tương ứng để áp dụng các thiết kế chuẩn nhất:

| Tên Skill | Mô tả & Tình huống Áp dụng |
| :--- | :--- |
| **`better-auth-best-practices`** | Hướng dẫn cấu hình Better Auth server & client, thiết lập database adapters, quản lý session, cấu hình các plugin xác thực và xử lý biến môi trường bảo mật. |
| **`cloudinary-docs`** | Hướng dẫn chi tiết về API/SDK tích hợp upload hình ảnh/video trực tiếp từ client, tối ưu hóa kích thước và thực hiện các phép biến đổi media của Cloudinary. |
| **`cloudinary-react`** | Hướng dẫn thực hành tốt nhất (Best Practices) cho React SDK của Cloudinary, xử lý các lỗi thường gặp và tối ưu hóa hiển thị media. |
| **`cloudinary-transformations`** | Hướng dẫn xây dựng và kiểm tra cú pháp URL chuyển đổi ảnh/video của Cloudinary. |
| **`elysiajs`** | Hướng dẫn phát triển ứng dụng Backend hiệu năng cao bằng ElysiaJS, tối ưu hóa khả năng phản hồi và tương thích kiểu dữ liệu tĩnh. |
| **`neon-postgres`** | Hướng dẫn kết nối và phát triển tối ưu với cơ sở dữ liệu serverless Neon Postgres. Gồm cách quản lý pool connection, tối ưu hóa câu lệnh query và các API hỗ trợ. |
| **`next-best-practices`** | Quy tắc tối ưu cho Next.js: Ranh giới giữa Client/Server Components (RSC boundaries), tối ưu hóa font/image, nạp dữ liệu không đồng bộ, xử lý lỗi chi tiết. |
| **`next-cache-components`** | Hướng dẫn sử dụng hệ thống cache nâng cao của Next.js (PPR, directive `'use cache'`, quản lý `cacheLife` và `cacheTag`). |
| **`nextjs-app-router-patterns`** | Các mẫu thiết kế nâng cao với Next.js App Router, truyền phát dữ liệu (Streaming SSR), định tuyến song song (Parallel Routes) và Server Actions. |
| **`nextjs-developer`** | Kỹ năng thiết lập Route Handlers, cấu hình Middleware, SEO metadata (`generateMetadata`), và tối ưu hóa tải trang qua `loading.tsx` / `error.tsx`. |
| **`shadcn`** | Quản lý các thành phần giao diện Shadcn UI, cách thêm mới component, gỡ lỗi style và kết hợp linh hoạt các component phức tạp. |
| **`turborepo`** | Kỹ năng quản trị monorepo với Turborepo, thiết lập đường ống công việc (pipelines), quản lý cache build, tối ưu hóa CI và phân tích ranh giới dependency. |
| **`vercel-composition-patterns`** | Các mẫu thiết kế Component React nâng cao (Compound Components, Render Props, Context Providers) đáp ứng khả năng mở rộng tốt và cập nhật React 19 API. |
| **`vercel-react-best-practices`** | Hướng dẫn tối ưu hóa hiệu năng hiển thị và giảm kích thước gói tài nguyên (bundle optimization) từ các chuyên gia kỹ thuật Vercel. |
| **`web-design-guidelines`** | Đánh giá giao diện người dùng dựa trên chuẩn khả năng tiếp cận (Accessibility), trải nghiệm người dùng (UX) và tối ưu hóa tương tác. |

---
*Tài liệu này được biên soạn tự động bởi hệ thống AI Antigravity nhằm duy trì tính nhất quán kiến trúc cho dự án Engducation.*
