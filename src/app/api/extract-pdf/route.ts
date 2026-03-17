import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 后端不再负责 PDF 解析，现在只做简单响应
  return NextResponse.json({ 
    message: "PDF parsing is now done on client side" 
  });
}
