import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";

    // 只支持PDF
    if (fileName.endsWith('.pdf')) {
      try {
        // 动态导入pdf2json
        const pdf2json = await import("pdf2json");
        const PDFParser = pdf2json.PDFParser;
        
        const pdfParser: any = new PDFParser();
        
        // 使用promise包装
        const pdfData: any = await new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataReady", (data: any) => resolve(data));
          pdfParser.on("pdfParser_error", (error: any) => reject(error));
          pdfParser.parseBuffer(buffer);
        });
        
        // 提取所有页面的文本
        if (pdfData && pdfData.Pages) {
          text = pdfData.Pages.map((page: any) => {
            return page.Texts.map((t: any) => 
              t.R.map((r: any) => decodeURIComponent(r.T)).join("")
            ).join(" ");
          }).join("\n\n");
        }
        
      } catch (pdfError: any) {
        console.error("PDF parse error:", pdfError);
        text = "";
      }

      // 如果提取到的文字太少，提示用户
      if (!text || text.length < 50) {
        text = "This PDF appears to be scanned or image-based and cannot be directly parsed.\n\nPlease convert to a text-based PDF.";
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload PDF files." },
        { status: 400 }
      );
    }

    // 限制文本长度
    const maxLength = 50000;
    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + "\n\n[Content truncated...]";
    }

    return NextResponse.json({ text, isOCR: false });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error.message || "File parsing failed. Please try another PDF." },
      { status: 500 }
    );
  }
}
