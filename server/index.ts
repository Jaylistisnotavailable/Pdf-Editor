import express from "express";
import cors from "cors";
// 引入你其他的 PDF 处理路由或逻辑...

const app = express();

// 启用中间件
app.use(express.json({ limit: '50mb' })); // PDF 文件较大，建议提高限制
app.use(cors());

// 在这里写你的 PDF 处理路由，注意路径最好加上 /api 前缀
// app.post('/api/process-pdf', async (req, res) => { ... })

// ❌ 删除原来的 server.listen 和 startServer 函数
// ✅ 导出 app 给 Vercel 使用
export default app;
