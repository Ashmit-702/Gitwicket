import { NextRequest, NextResponse } from "next/server";
import { extractCvFields } from "@/lib/cvParsing";

export const runtime = "nodejs"; // unpdf/mammoth need Node APIs, not the edge runtime
export const dynamic = "force-dynamic";

// Vercel's default serverless request body limit is 4.5MB — cap well under that
// so we get a clean error message instead of a platform-level 413.
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

const ALLOWED_TYPES: Record<string, "pdf" | "docx"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Couldn't read the upload. Try again." }, { status: 400 });
  }

  const file = formData.get("cv");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File is too large — keep it under ${MAX_BYTES / 1024 / 1024}MB.` }, { status: 400 });
  }

  const kind = ALLOWED_TYPES[file.type] || (file.name.endsWith(".pdf") ? "pdf" : file.name.endsWith(".docx") ? "docx" : null);
  if (!kind) {
    return NextResponse.json({ error: "Unsupported file type — upload a PDF or DOCX." }, { status: 400 });
  }

  // The buffer only ever exists in this function's memory for the duration of this
  // request. It is never written to disk, Redis, or any other store — this is the
  // entire "don't persist the CV" privacy boundary, enforced by simply not doing it.
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    if (kind === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = result.text;
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }
  } catch (err) {
    // Log the REAL error server-side — the message returned to the client stays
    // generic (a raw parser stack trace isn't useful to a user), but whoever has
    // access to Vercel's function logs can see exactly what failed here.
    console.error("CV parse failure:", err);
    return NextResponse.json(
      { error: "Couldn't read that file — it may be corrupted, scanned/image-only, or password-protected." },
      { status: 422 }
    );
  }

  if (!text || text.trim().length < 40) {
    return NextResponse.json(
      { error: "Couldn't find readable text in that file — if it's a scanned image, text extraction won't work yet." },
      { status: 422 }
    );
  }

  const parsed = extractCvFields(text);
  return NextResponse.json({ parsed });
}
