import * as XLSX from "xlsx";

export interface VocabularyImportItem {
  word: string;
  partOfSpeech: string;
  phonetics: string;
  definition: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  mediaUrl?: string | null;
}

export interface AnswerImportItem {
  content: string;
  isCorrect: boolean;
}

export interface QuestionImportItem {
  content: string;
  explanation?: string | null;
  order: number;
  answers: AnswerImportItem[];
}

/**
 * Parses vocabulary from an uploaded Excel file.
 */
export async function parseVocabularyExcel(file: File): Promise<VocabularyImportItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]!];
        if (!worksheet) {
          return resolve([]);
        }
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        const dataRows = rawRows.slice(1);

        const items: VocabularyImportItem[] = dataRows
          .map((row) => {
            const word = String(row[0] || "").trim();
            const partOfSpeech = String(row[1] || "").trim().toLowerCase();
            const phonetics = String(row[2] || "").trim();
            const definition = String(row[3] || "").trim();
            const translation = String(row[4] || "").trim();
            const example = String(row[5] || "").trim();
            const exampleTranslation = String(row[6] || "").trim();
            const mediaUrl = row[7] ? String(row[7]).trim() : null;

            return {
              word,
              partOfSpeech,
              phonetics,
              definition,
              translation,
              example,
              exampleTranslation,
              mediaUrl: mediaUrl || undefined,
            };
          })
          .filter((item) => item.word.length > 0);

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses quiz questions and answers from a flattened Excel structure.
 */
export async function parseQuizExcel(file: File): Promise<QuestionImportItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]!];
        if (!worksheet) {
          return resolve([]);
        }
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        const dataRows = rawRows.slice(1);

        const mapQuestions = new Map<string, QuestionImportItem>();

        dataRows.forEach((row) => {
          const qContent = String(row[0] || "").trim();
          if (!qContent) return;

          const explanation = row[1] ? String(row[1]).trim() : "";
          const order = row[2] !== undefined && row[2] !== "" ? Number(row[2]) : 1;
          const answerContent = String(row[3] || "").trim();
          const isCorrect = String(row[4] || "").trim().toUpperCase() === "TRUE";

          if (!mapQuestions.has(qContent)) {
            mapQuestions.set(qContent, {
              content: qContent,
              explanation: explanation || undefined,
              order: isNaN(order) ? 1 : order,
              answers: [],
            });
          }

          const currentQuestion = mapQuestions.get(qContent);
          if (currentQuestion && answerContent) {
            currentQuestion.answers.push({
              content: answerContent,
              isCorrect,
            });
          }
        });

        resolve(Array.from(mapQuestions.values()));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and downloads a pre-formatted Excel template for Vocabulary data.
 */
export function downloadVocabularyTemplate() {
  const headers = [
    "Từ gốc (word)*",
    "Từ loại (partOfSpeech)*",
    "Phiên âm (phonetics)*",
    "Định nghĩa tiếng Anh (definition)*",
    "Dịch nghĩa tiếng Việt (translation)*",
    "Câu ví dụ (example)*",
    "Dịch câu ví dụ (exampleTranslation)*",
    "Liên kết phát âm (mediaUrl) [Không bắt buộc]"
  ];
  const examples = [
    [
      "scrupulous",
      "adjective",
      "/ˈskruː.pjə.ləs/",
      "Extremely attentive to details; very concerned to avoid doing wrong.",
      "Kỹ lưỡng, tỉ mỉ, cực kỳ cẩn thận tránh sai sót.",
      "She was scrupulous about keeping her office tidy.",
      "Cô ấy rất cẩn thận trong việc giữ gìn văn phòng ngăn nắp.",
      "https://res.cloudinary.com/demo/video/upload/scrupulous.mp3"
    ],
    [
      "ephemerality",
      "noun",
      "/ɪˌfem.ər.ˈæl.ə.ti/",
      "The concept of things being transitory, existing only briefly.",
      "Sự ngắn ngủi, tính chất chóng vánh.",
      "The beauty of cherry blossoms lies in their ephemerality.",
      "Vẻ đẹp của hoa anh đào nằm ở sự chóng vánh của chúng.",
      ""
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  
  // Set column widths for readability
  ws["!cols"] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 45 },
    { wch: 35 },
    { wch: 40 },
    { wch: 40 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vocabulary Template");
  XLSX.writeFile(wb, "vocabulary_template.xlsx");
}

/**
 * Generates and downloads a pre-formatted Excel template for Quiz exercises.
 */
export function downloadQuizTemplate() {
  const headers = [
    "Câu hỏi (questionContent)*",
    "Giải thích câu đúng (questionExplanation) [Không bắt buộc]",
    "Thứ tự câu (questionOrder)*",
    "Phương án lựa chọn (answerContent)*",
    "Đáp án đúng? (isCorrect - TRUE/FALSE)*"
  ];
  const examples = [
    [
      "Which of the following is a synonym for 'scrupulous'?",
      "Scrupulous means extremely attentive to details or meticulous, which is a synonym.",
      1,
      "Meticulous",
      "TRUE"
    ],
    [
      "Which of the following is a synonym for 'scrupulous'?",
      "Scrupulous means extremely attentive to details or meticulous, which is a synonym.",
      1,
      "Careless",
      "FALSE"
    ],
    [
      "Which of the following is a synonym for 'scrupulous'?",
      "Scrupulous means extremely attentive to details or meticulous, which is a synonym.",
      1,
      "Ignorant",
      "FALSE"
    ],
    [
      "What is the noun form of the adjective 'transitory'?",
      "Transitoriness or transience are the noun forms of transitory.",
      2,
      "Transience",
      "TRUE"
    ],
    [
      "What is the noun form of the adjective 'transitory'?",
      "Transitoriness or transience are the noun forms of transitory.",
      2,
      "Transition",
      "FALSE"
    ],
    [
      "What is the noun form of the adjective 'transitory'?",
      "Transitoriness or transience are the noun forms of transitory.",
      2,
      "Transitory",
      "FALSE"
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  
  // Set column widths for readability
  ws["!cols"] = [
    { wch: 45 },
    { wch: 45 },
    { wch: 12 },
    { wch: 30 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Quiz Template");
  XLSX.writeFile(wb, "quiz_template.xlsx");
}
