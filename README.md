# PDF Analyzer

AI-powered PDF document analysis tool using Next.js, Tailwind CSS, and MiniMax M2.5.

## 功能

- 📄 PDF 文件上传
- 🔍 智能文本提取
- 📝 AI 生成摘要
- 🔑 关键信息提取
- 💬 智能问答

## 技术栈

- **前端**: Next.js 14 + Tailwind CSS
- **AI**: MiniMax M2.5
- **PDF 解析**: pdfjs-dist
- **部署**: Vercel

## 本地开发

```bash
# 安装依赖
npm install

# 设置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 MiniMax API Key

# 运行开发服务器
npm run dev
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 在 Vercel 后台配置环境变量：
   - `MINIMAX_API_KEY`: 你的 MiniMax API Key
   - `MINIMAX_BASE_URL`: https://api.minimax.chat/v1 (可选)
4. Deploy!

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| MINIMAX_API_KEY | MiniMax API Key | 是 |
| MINIMAX_BASE_URL | API 地址（可选） | 否 |

---
