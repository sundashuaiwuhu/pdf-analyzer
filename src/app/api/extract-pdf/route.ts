import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdf = new PDFParse(buffer);
    const data = await pdf.getText();
    let text = data.text;

    // 限制文本长度
    const maxLength = 50000;
    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + "\n\n[内容已截断...]";
    }

    // 清理资源
    await pdf.destroy();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract PDF text" },
      { status: 500 }
    );
  }
}
