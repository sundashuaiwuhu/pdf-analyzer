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
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    let isOCR = false;

    // 判断文件类型
    if (fileName.endsWith('.pdf')) {
      // PDF文件 - 尝试提取文字
      const pdf = new PDFParse(buffer);
      const textData = await pdf.getText();
      text = textData.text.trim();
      await pdf.destroy();

      // 如果提取到的文字太少，提示用户
      if (text.length < 50) {
        text = "This PDF appears to be scanned or image-based and cannot be directly parsed.\n\nSolutions:\n1. Convert PDF to text-based format (Save As/Searchable PDF)\n2. Or upload an image file (PNG/JPG) - I can recognize it directly";
      }
    } else if (fileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)) {
      // 图片文件 - 使用OCR
      console.log("Processing image with OCR...");
      const result = await Tesseract.recognize(buffer, 'chi_sim+eng', {
        logger: () => {}
      });
      text = result.data.text;
      isOCR = true;
    } else {
      return NextResponse.json(
        { error: "不支持的文件格式，请上传 PDF 或图片文件" },
        { status: 400 }
      );
    }

    // 限制文本长度
    const maxLength = 50000;
    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + "\n\n[内容已截断...]";
    }

    return NextResponse.json({ text, isOCR });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "文件解析失败，请确保是有效的PDF或图片文件" },
      { status: 500 }
    );
  }
}
