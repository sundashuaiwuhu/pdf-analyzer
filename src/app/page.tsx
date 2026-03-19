"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { useSession, signIn, signOut } from "next-auth/react";

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js`;

// PDF解析函数 (客户端)
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  const pdf = await pdfjsLib.getDocument({
    data: uint8Array,
  }).promise;
  
  let fullText = "";
  const maxPages = Math.min(pdf.numPages, 50);
  
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }
  
  // 限制长度
  if (fullText.length > 50000) {
    fullText = fullText.slice(0, 50000) + "\n\n[内容已截断...]";
  }
  
  return fullText;
}

// AI分析函数
async function analyzeWithAI(text: string, mode: "summary" | "extract" | "qa", question?: string): Promise<string> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, question }),
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [question, setQuestion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult("");
      setPdfText("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult("正在解析PDF...");
    try {
      console.log("Starting PDF parsing...");
      const text = await extractTextFromPDF(file);
      console.log("PDF parsed, text length:", text.length);
      
      if (!text || text.length < 50) {
        setResult("此PDF可能是扫描版，无法提取文字。请转换为文字版PDF后重试。");
      } else {
        setPdfText(text);
        setResult("PDF上传成功！请选择分析功能。");
      }
    } catch (error: any) {
      console.error("PDF parse error:", error);
      setResult("PDF解析失败: " + error.message);
    }
    setLoading(false);
  };

  const handleAnalyze = async (mode: "summary" | "extract" | "qa") => {
    if (!pdfText) {
      alert("Please upload a PDF first");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await analyzeWithAI(
        pdfText,
        mode,
        mode === "qa" ? question : undefined
      );
      setResult(response);
    } catch (error: any) {
      console.error(error);
      setResult("分析失败: " + error.message);
    }
    setLoading(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPdfText("");
    setResult("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 未登录时显示登录界面
  if (status === "loading") {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">
              📄 PDF Analyzer
            </h1>
            <p className="text-gray-600">
              AI-powered PDF document analysis tool
            </p>
          </header>

          <section className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mb-6">
              <span className="text-6xl">🔐</span>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Sign in to continue</h2>
            <p className="text-gray-600 mb-6">
              Please sign in with your Google account to use this application
            </p>
            <button
              onClick={() => signIn("google")}
              className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </section>

          <footer className="text-center text-gray-500 text-sm mt-8">
            Powered by SiliconFlow AI
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">
            📄 PDF Analyzer
          </h1>
          <p className="text-gray-600">
            AI-powered PDF document analysis tool
          </p>
        </header>

        {/* 用户信息栏 */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            {session.user?.image ? (
              <img src={session.user.image} alt="avatar" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800">{session.user?.name}</p>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Sign Out
          </button>
        </div>

        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload PDF</h2>
          
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-4xl mb-2">📄</div>
            <p className="text-gray-600">
              Drag and drop your PDF here, or click to browse
            </p>
            <p className="text-sm text-gray-400 mt-2">Max file size: 10MB (PDF only)</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700"
              >
                ✕ Remove
              </button>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Upload & Parse PDF"}
          </button>
        </section>

        {pdfText && (
          <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. AI Analysis</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => handleAnalyze("summary")}
                disabled={loading}
                className="bg-indigo-100 text-indigo-700 py-3 px-4 rounded-lg font-medium hover:bg-indigo-200 disabled:opacity-50 transition-colors"
              >
                📝 Generate Summary
              </button>
              
              <button
                onClick={() => handleAnalyze("extract")}
                disabled={loading}
                className="bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 disabled:opacity-50 transition-colors"
              >
                🔑 Extract Key Info
              </button>
              
              <button
                onClick={() => handleAnalyze("qa")}
                disabled={loading}
                className="bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium hover:bg-blue-200 disabled:opacity-50 transition-colors"
              >
                💬 Q&A
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this document..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleAnalyze("qa")}
                disabled={loading || !question.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                Send
              </button>
            </div>
          </section>
        )}

        {result && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Result</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {loading ? "Analyzing..." : result}
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm"
            >
              📋 Copy to clipboard
            </button>
          </section>
        )}

        <footer className="text-center text-gray-500 text-sm mt-8">
          Powered by SiliconFlow AI
        </footer>
      </div>
    </main>
  );
}
