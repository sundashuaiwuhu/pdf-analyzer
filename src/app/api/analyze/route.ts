import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";
const MODEL = "abab6.5s-chat";

interface AnalyzeRequest {
  text: string;
  mode: "summary" | "extract" | "qa";
  question?: string;
}

const PROMPTS = {
  summary: `请仔细阅读以下PDF文档内容，然后生成一个简洁的摘要（200-500字），概括文档的主要内容和要点。

文档内容：
`,

  extract: `请从以下PDF文档中提取关键信息，包括：
1. 文档标题
2. 日期（如果有）
3. 金额/数字（如果有）
4. 重要人物/机构
5. 关键条款/要点

请以结构化的方式呈现。

文档内容：
`,

  qa: (question: string) => `请根据以下PDF文档内容回答用户的问题。如果文档中没有相关信息，请如实说明。

用户问题：${question}

文档内容：
`,
};

async function callMiniMax(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `${MINIMAX_BASE_URL}/text/chatcompletion_v2`,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "你是一个专业的文档分析助手，擅长理解和总结各类文档内容。请用中文回答问题。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${MINIMAX_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error("MiniMax API error:", error.response?.data || error.message);
    throw new Error("AI analysis failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!MINIMAX_API_KEY) {
      return NextResponse.json(
        { error: "MINIMAX_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body: AnalyzeRequest = await request.json();
    const { text, mode, question } = body;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    let prompt: string;

    switch (mode) {
      case "summary":
        prompt = PROMPTS.summary + text;
        break;
      case "extract":
        prompt = PROMPTS.extract + text;
        break;
      case "qa":
        if (!question) {
          return NextResponse.json(
            { error: "Question required for Q&A mode" },
            { status: 400 }
          );
        }
        prompt = PROMPTS.qa(question) + text;
        break;
      default:
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const result = await callMiniMax(prompt);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
