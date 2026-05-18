# tRPC Routes Vocabulary — Frontend Integration Reference

> **Purpose**: Complete reference of all tRPC procedures for frontend developers. Every procedure includes its path, auth level, input schema, and output type.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Router Structure](#2-router-structure)
3. [Auth Levels & Context](#3-auth-levels--context)
4. [Shared Response Format](#4-shared-response-format)
5. [Root Procedures](#5-root-procedures)
6. [Admin.Content Router](#6-admincontent-router)
7. [Admin.Vocabulary Router](#7-adminvocabulary-router)
8. [User.Content Router](#8-usercontent-router)
9. [User.Vocabulary Router](#9-uservocabulary-router)
10. [Shared Enums & Schemas](#10-shared-enums--schemas)
11. [Frontend Client Usage Examples](#11-frontend-client-usage-examples)

---

## 1. Overview

The tRPC router is defined at `packages/api/src/routers/index.ts` and exported as `appRouter`. All procedures follow the same naming pattern:

```
<router>.<subRouter>.<procedure>
```

Example: `user.vocabulary.toggleBookmark`

---

## 2. Router Structure

```
appRouter
├── healthCheck          (public)
├── privateData          (protected)
├── admin
│   ├── content          → adminContentRouter
│   └── vocabulary       → adminVocabularyRouter
└── user
    ├── content          → userContentRouter
    └── vocabulary       → userVocabularyRouter
```

---

## 3. Auth Levels & Context

### Context Shape

Every request receives a context object:

```ts
interface Context {
  auth: null;                                // Always null (Better Auth uses session)
  session: Session | null;                  // null if not logged in
  db: DrizzleInstance;
}
```

### Procedure Variants

| Procedure | Auth Required | Behavior if Unauthenticated |
|---|---|---|
| `publicProcedure` | None | Passes through |
| `protectedProcedure` | Valid session | Throws `UNAUTHORIZED` error |
| `adminProcedure` | Session + `role === "admin"` | Throws `UNAUTHORIZED` error |

---

## 4. Shared Response Format

All successful responses are wrapped in `ApiResponse<T>`:

```ts
interface ApiResponse<T = unknown> {
  success: boolean;       // Always true on success
  data: T | null;        // The actual payload
  message: string;        // Human-readable message (e.g. "Course created successfully")
  code: string;           // Machine-readable code (e.g. "SUCCESS", "CREATED")
  path?: string;          // Route path on error
}
```

Example success response from `admin.vocabulary.create`:

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "word": "ephemeral",
    "ipa": "/ɪˈfem.ər.əl/",
    "partOfSpeech": "adjective",
    "meaningVi": "tồn tại trong thời gian ngắn, nhất thời",
    "exampleEn": "Fame in the digital age is often ephemeral.",
    "exampleVi": "Danh tiếng trong thời đại kỹ thuật số thường chỉ là nhất thời.",
    "audioUrl": "https://...",
    "level": "B2",
    "topic": "social_media",
    "createdAt": "2026-05-18T00:00:00.000Z",
    "updatedAt": "2026-05-18T00:00:00.000Z"
  },
  "message": "Vocabulary created successfully",
  "code": "CREATED"
}
```

Error response (e.g. duplicate word):

```json
{
  "success": false,
  "data": null,
  "message": "Word already exists",
  "code": "CONFLICT",
  "path": "admin.vocabulary.create"
}
```

---

## 5. Root Procedures

### `healthCheck`

**Path**: `healthCheck`
**Router**: Root
**Type**: Query
**Auth**: Public
**Input**: None

```ts
// Output: string
"OK"
```

Simple health check to verify the API server is responding.

---

### `privateData`

**Path**: `privateData`
**Router**: Root
**Type**: Query
**Auth**: Protected
**Input**: None

```ts
// Output
{
  message: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: "admin" | "user";
  };
}
```

Returns the authenticated user's session data.

---

## 6. Admin.Content Router

**Router path prefix**: `admin.content`
**Auth**: Admin only

### `courseList`

**Path**: `admin.content.courseList`
**Type**: Query
**Input**:

```ts
{
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 10
  level?: CourseLevel;  // Filter by course level
  status?: "draft" | "published"; // Filter by status
  search?: string;      // Search in title/description
}
```

**Output**:

```ts
{
  items: Course[];      // See Course schema below
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### `courseCreate`

**Path**: `admin.content.courseCreate`
**Type**: Mutation
**Input**:

```ts
{
  title: string;           // Required
  description?: string;
  thumbnailUrl?: string;   // Cloudinary URL
  level: CourseLevel;     // "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  status?: "draft" | "published"; // Default: "draft"
}
```

**Output**: `Course`

### `courseUpdate`

**Path**: `admin.content.courseUpdate`
**Type**: Mutation
**Input**:

```ts
{
  id: string;              // Required — course ID
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  level?: CourseLevel;
  status?: "draft" | "published";
}
```

**Output**: `Course`

### `courseDelete`

**Path**: `admin.content.courseDelete`
**Type**: Mutation
**Input**: `{ id: string }`
**Output**: `{ deleted: true }`

> **Note**: Fails with `BAD_REQUEST` if the course has any lessons.

### `lessonCreate`

**Path**: `admin.content.lessonCreate`
**Type**: Mutation
**Input**:

```ts
{
  courseId: string;         // Required — parent course ID
  title: string;
  description?: string;
  videoPublicId?: string;   // Cloudinary public ID
  videoUrl?: string;       // Direct URL (fallback)
  order?: number;          // If omitted, auto-appends to end
  status?: "draft" | "published"; // Default: "draft"
}
```

**Output**: `Lesson`

### `lessonUpdate`

**Path**: `admin.content.lessonUpdate`
**Type**: Mutation
**Input**:

```ts
{
  id: string;              // Required — lesson ID
  title?: string;
  description?: string;
  videoPublicId?: string;
  videoUrl?: string;
  order?: number;
  status?: "draft" | "published";
}
```

**Output**: `Lesson`

> **Note**: `courseId` is immutable after creation.

### `lessonDelete`

**Path**: `admin.content.lessonDelete`
**Type**: Mutation
**Input**: `{ id: string }`
**Output**: `{ deleted: true }`

### `lessonReorder`

**Path**: `admin.content.lessonReorder`
**Type**: Mutation
**Input**:

```ts
{
  courseId: string;
  movements: Array<{
    id: string;    // lesson ID
    order: number; // new order
  }>;
}
```

**Output**: `Lesson[]` — all lessons of the course in new order

> **Note**: Uses a two-phase swap to avoid gaps in the order sequence.

### `quizUpsertStructure`

**Path**: `admin.content.quizUpsertStructure`
**Type**: Mutation
**Input**:

```ts
{
  quizId?: string;          // If provided, updates existing quiz; otherwise creates
  lessonId: string;
  title: string;
  questions: Array<{
    id?: string;            // If provided, updates; otherwise creates
    content: string;
    explanation?: string;
    order: number;
    answers: Array<{
      id?: string;          // If provided, updates; otherwise creates
      content: string;     // e.g. "A", "B", "C", "D" or actual text
      isCorrect: boolean;   // Only one answer should be isCorrect: true per question
    }>;
  }>;
}
```

**Output**: Full `Quiz` object including all questions and answers.

> **Upsert behavior**: If `quizId` is provided, the entire quiz structure is replaced (questions/answers not in the input are deleted). If omitted, a new quiz is created for the lesson.

### `createQuizQuestion`

**Path**: `admin.content.createQuizQuestion`
**Type**: Mutation
**Input**:

```ts
{
  quizId: string;
  content: string;
  explanation?: string;
  order: number;
  answers: Array<{
    id?: string;
    content: string;
    isCorrect: boolean;
  }>;
}
```

**Output**: `Question` with its answers array.

### `quizDelete`

**Path**: `admin.content.quizDelete`
**Type**: Mutation
**Input**: `{ id: string }`
**Output**: `{ deleted: true }`

### `dashboardStats`

**Path**: `admin.content.dashboardStats`
**Type**: Query
**Input**: None
**Output**:

```ts
{
  totalCourses: number;
  totalLessons: number;
  totalQuizzes: number;
  totalProgressLogs: number;
}
```

---

## 7. Admin.Vocabulary Router

**Router path prefix**: `admin.vocabulary`
**Auth**: Admin only

### `create`

**Path**: `admin.vocabulary.create`
**Type**: Mutation
**Input**:

```ts
{
  word: string;            // Required; normalized to lowercase/trimmed
  ipa: string;            // International Phonetic Alphabet, e.g. "/ɪˈfem.ər.əl/"
  partOfSpeech: PartOfSpeech;
  meaningVi: string;       // Vietnamese meaning
  exampleEn: string;      // English example sentence
  exampleVi: string;      // Vietnamese translation of the example
  audioUrl?: string;       // URL to pronunciation audio file
  level: CourseLevel;
  topic: string;           // Free-text topic tag (e.g. "social_media", "technology")
}
```

**Output**: `Vocabulary`

> **Validation**: Rejects if a vocabulary entry with the same `[word, partOfSpeech]` already exists. Returns `CONFLICT` error.

### `update`

**Path**: `admin.vocabulary.update`
**Type**: Mutation
**Input**:

```ts
{
  id: string;              // Required — vocabulary ID
  word?: string;
  ipa?: string;
  partOfSpeech?: PartOfSpeech;
  meaningVi?: string;
  exampleEn?: string;
  exampleVi?: string;
  audioUrl?: string;
  level?: CourseLevel;
  topic?: string;
}
```

**Output**: `Vocabulary`

> **Conflict detection**: If `word` or `partOfSpeech` is changed, checks for existing `[word, partOfSpeech]` conflicts.

### `delete`

**Path**: `admin.vocabulary.delete`
**Type**: Mutation
**Input**: `{ id: string }`
**Output**: `{ deleted: true }`

> **Cascade**: Deletes cascade to `userBookmarks` at the database level.

### `list`

**Path**: `admin.vocabulary.list`
**Type**: Query
**Input**:

```ts
{
  page?: number;
  pageSize?: number;
  search?: string;   // Searches word and meaningVi
  level?: CourseLevel;
  topic?: string;
}
```

**Output**:

```ts
{
  items: Vocabulary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

---

## 8. User.Content Router

**Router path prefix**: `user.content`
**Auth**: Protected (requires valid session)

### `courseList`

**Path**: `user.content.courseList`
**Type**: Query
**Input**:

```ts
{
  page?: number;
  pageSize?: number;
  level?: CourseLevel;  // Filter — only shows "published" courses
}
```

**Output**:

```ts
{
  items: Array<Course & {
    completedLessons: number;   // Count of lessons user has completed
    totalLessons: number;
  }>;
  pagination: PaginationMeta;
}
```

> **Note**: Only returns `status === "published"` courses. Each course is enriched with the user's lesson completion progress.

### `courseGetDetail`

**Path**: `user.content.courseGetDetail`
**Type**: Query
**Input**: `{ courseId: string }`
**Output**:

```ts
Course & {
  lessons: Array<Lesson & {
    progressStatus: "not_started" | "in_progress" | "completed";
  }>;
}
```

> **Note**: Only works for `status === "published"` courses.

### `lessonGetDetail`

**Path**: `user.content.lessonGetDetail`
**Type**: Query
**Input**: `{ lessonId: string }`
**Output**: `Lesson & { quiz: Quiz | null }`

> **Anti-cheat**: The returned lesson **strips `isCorrect`** and **`explanation`** from quiz answers before sending.

### `lessonGetMediaUrl`

**Path**: `user.content.lessonGetMediaUrl`
**Type**: Mutation
**Input**: `{ lessonId: string }`
**Output**:

```ts
{
  url: string;          // Cloudinary signed URL
  expiresAt: Date;      // URL validity — typically 1 hour from now
}
```

> **Note**: Generates a Cloudinary signed URL valid for 1 hour. Call this immediately before playing the video.

### `trackLessonProgress`

**Path**: `user.content.trackLessonProgress`
**Type**: Mutation
**Input**:

```ts
{
  lessonId: string;
  status: "IN_PROGRESS" | "COMPLETED";
}
```

**Output**: `UserProgress`

> **Behavior**: Upserts progress. If `status === "COMPLETED"`, the lesson is marked complete.

### `getQuiz`

**Path**: `user.content.getQuiz`
**Type**: Query
**Input**: `{ lessonId: string }`
**Output**:

```ts
{
  id: string;
  title: string;
  questions: Array<{
    id: string;
    content: string;
    order: number;
    answers: Array<{
      id: string;
      content: string;
    }>;
  }>;
}
```

> **Anti-cheat**: `isCorrect` and `explanation` are stripped from every answer.

### `submitQuiz`

**Path**: `user.content.submitQuiz`
**Type**: Mutation
**Input**:

```ts
{
  lessonId: string;
  answers: Array<{
    questionId: string;
    selectedOption: "A" | "B" | "C" | "D";
  }>;
}
```

**Output**:

```ts
{
  attemptId: string;
  score: number;           // Percentage 0–100
  totalQuestions: number;
  correctCount: number;
  passed: boolean;          // true if score >= 70%
  results: Array<{
    questionId: string;
    selectedOption: string;
    correctOption: string;
    isCorrect: boolean;
    explanation: string;    // Revealed after submission
  }>;
}
```

> **Side effects**: If `passed === true`, the lesson is auto-marked as `COMPLETED` in the user's progress.

### `quizAttemptsHistory`

**Path**: `user.content.quizAttemptsHistory`
**Type**: Query
**Input**: `{ quizId: string }`
**Output**: `QuizAttempt[]` — ordered by creation time (newest first)

---

## 9. User.Vocabulary Router

**Router path prefix**: `user.vocabulary`

### `list`

**Path**: `user.vocabulary.list`
**Type**: Query
**Auth**: Public (but enriched if authenticated)
**Input**:

```ts
{
  search?: string;
  level?: CourseLevel;
  topic?: string;
  page?: number;
  pageSize?: number;
}
```

**Output**:

```ts
{
  items: Array<Vocabulary & {
    isBookmarked?: boolean;  // Present if user is authenticated
  }>;
  pagination: PaginationMeta;
}
```

> **Behavior**: If the caller has a valid session, each vocabulary item includes `isBookmarked: boolean`.

### `toggleBookmark`

**Path**: `user.vocabulary.toggleBookmark`
**Type**: Mutation
**Auth**: Protected
**Input**: `{ vocabularyId: string }`
**Output**: `{ bookmarked: boolean }` — the new state after toggle

### `getPersonalNotebook`

**Path**: `user.vocabulary.getPersonalNotebook`
**Type**: Query
**Auth**: Protected
**Input**:

```ts
{
  search?: string;
  level?: CourseLevel;
  topic?: string;
  page?: number;
  pageSize?: number;
}
```

**Output**:

```ts
{
  items: Vocabulary[];
  pagination: PaginationMeta;
}
```

> **Note**: Returns only vocabulary items the user has bookmarked. All returned items have `isBookmarked: true`. Bookmarks are ordered by the order in which they were created.

---

## 10. Shared Enums & Schemas

### `CourseLevel`

```ts
type CourseLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
```

CEFR language proficiency levels.

### `PartOfSpeech`

```ts
type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction" | "idiom" | "phrasal_verb";
```

### `Course` Schema

```ts
{
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: CourseLevel;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}
```

### `Lesson` Schema

```ts
{
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoPublicId: string | null;
  videoUrl: string | null;
  order: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}
```

### `Vocabulary` Schema

```ts
{
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: PartOfSpeech;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  audioUrl: string | null;
  level: CourseLevel;
  topic: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### `PaginationMeta`

```ts
{
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

---

## 11. Frontend Client Usage Examples

### Initialize Client

```ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@engducation/api";

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});
```

### Fetch Vocabulary List (Public)

```ts
const result = await trpc.user.vocabulary.list.query({
  level: "B2",
  topic: "technology",
  page: 1,
  pageSize: 20,
});

// result.data.items[0].word  // "algorithm"
// result.data.items[0].isBookmarked  // true (if logged in)
```

### Toggle Bookmark (Protected)

```ts
const result = await trpc.user.vocabulary.toggleBookmark.mutate({
  vocabularyId: "clx123abc",
});

// result.data.bookmarked  // true (now bookmarked) or false (removed)
```

### Get Personal Notebook (Protected)

```ts
const result = await trpc.user.vocabulary.getPersonalNotebook.query({
  search: "algorithm",
  level: "B2",
});

// All items have isBookmarked: true
```

### Submit Quiz

```ts
const result = await trpc.user.content.submitQuiz.mutate({
  lessonId: "clx456def",
  answers: [
    { questionId: "q1", selectedOption: "B" },
    { questionId: "q2", selectedOption: "A" },
    { questionId: "q3", selectedOption: "C" },
  ],
});

// result.data.passed      // true
// result.data.score       // 66.67
// result.data.correctCount // 2
// result.data.results[0].explanation  // Revealed after submission!
```

### Admin: Create Vocabulary

```ts
const result = await trpc.admin.vocabulary.create.mutate({
  word: "ephemeral",
  ipa: "/ɪˈfem.ər.əl/",
  partOfSpeech: "adjective",
  meaningVi: "tồn tại trong thời gian ngắn, nhất thời",
  exampleEn: "Fame in the digital age is often ephemeral.",
  exampleVi: "Danh tiếng trong thời đại kỹ thuật số thường chỉ là nhất thời.",
  audioUrl: "https://res.cloudinary.com/.../ephemeral.mp3",
  level: "B2",
  topic: "social_media",
});
```

### Admin: Full Quiz Upsert

```ts
await trpc.admin.content.quizUpsertStructure.mutate({
  lessonId: "clx456def",
  title: "Vocabulary Quiz — Algorithms",
  questions: [
    {
      content: "What does 'algorithm' mean?",
      explanation: "An algorithm is a step-by-step procedure for solving a problem.",
      order: 1,
      answers: [
        { content: "A. A type of computer hardware", isCorrect: false },
        { content: "B. A step-by-step procedure for solving a problem", isCorrect: true },
        { content: "C. A programming language", isCorrect: false },
        { content: "D. A database system", isCorrect: false },
      ],
    },
  ],
});
```

### Get Media URL (Protected)

```ts
const result = await trpc.user.content.lessonGetMediaUrl.mutate({
  lessonId: "clx456def",
});

// result.data.url        // Cloudinary signed URL
// result.data.expiresAt  // new Date — URL expires at this time
```
