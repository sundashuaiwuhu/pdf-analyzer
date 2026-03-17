import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    // 转换为 Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let text = "";
    let isOCR = false;

    // 判断文件类型
    if (fileName.endsWith('.pdf')) {
      try {
        // PDF文件 - 尝试提取文字
        const pdf = new PDFParse({ data: uint8Array });
        const textData = await pdf.getText();
        text = textData.text.trim();
        await pdf.destroy();
      } catch (pdfError) {
        console.error("PDF parse error:", pdfError);
        text = "Unable to parse this PDF. It may be corrupted or password-protected.";
      }

      // 如果提取到的文字太少，提示用户
      if (!text || text.length < 50) {
        text = "This PDF appears to be scanned or image-based and cannot be directly parsed.\n\nSolutions:\n1. Convert PDF to text-based format (Save As/Searchable PDF)\n2. Or upload an image file (PNG/JPG) - I can recognize it directly";
      }
    } else if (fileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)) {
      // 图片文件 - 使用OCR
      console.log("Processing image with OCR...");
      // 转换为base64
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = fileName.match(/\.jpe?g$/i) ? 'image/jpeg' : 
                       fileName === '.png' ? 'image/png' : 'image/gif';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      const result = await Tesseract.recognize(dataUrl, 'chi_sim+eng', {
        logger: () => {}
      });
      text = result.data.text;
      isOCR = true;
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload PDF or image files." },
        { status: 400 }
      );
    }

    // 限制文本长度
    const maxLength = 50000;
    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + "\n\n[Content truncated...]";
    }

    return NextResponse.json({ text, isOCR });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error.message || "File parsing failed. Please ensure it's a valid PDF or image file." },
      { status: 500 }
    );
  }
}
