// client/src/pages/Landing.tsx
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import CrosshairLogo from "@/components/CrosshairLogo";
import { useAuth } from "@/contexts/AuthContext"; // 请根据实际项目中的 useAuth 路径调整导入

export default function Landing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 1. 头部栏 Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* 左侧：Logo 和 名称 */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <CrosshairLogo size={32} />
            <span className="font-semibold text-lg hidden sm:inline-block">Blueprint Annotator</span>
          </div>

          {/* 中间：两个简介链接 */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              关于我们
            </a>
            <a 
              href="#features" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              产品介绍
            </a>
          </nav>

          {/* 右侧：登录/注册 或 进入系统 (根据登录状态动态显示) */}
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/projects")}>
                进入工作台
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  登录
                </Button>
                <Button onClick={() => navigate("/login")}>
                  注册
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. 主体内容 Main */}
      <main className="flex-1">
        {/* Hero 区域 */}
        <section className="py-20 md:py-32 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            专业的建筑图纸 PDF 标注工具
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            提供高效、精准的 PDF 图纸标注、测量与协作功能，助力工程团队提升工作效率。
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate(user ? "/projects" : "/login")}>
              立即开始
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              了解更多
            </Button>
          </div>
        </section>

        {/* 关于我们 区域 */}
        <section id="about" className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">关于我们</h2>
            <div className="max-w-3xl mx-auto text-center text-muted-foreground leading-relaxed">
              <p>
                我们是一支专注于建筑工程数字化领域的团队，致力于通过先进的技术手段，
                解决传统图纸审阅和标注过程中的痛点。我们的平台为建筑师、工程师和施工团队
                提供了一站式的云端协作解决方案，确保每一个项目都能高效、准确地推进。
              </p>
            </div>
          </div>
        </section>

        {/* 产品介绍 区域 */}
        <section id="features" className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "精准标注", desc: "支持多种标注工具，包括尺寸测量、文字注释、高亮和图形绘制。" },
              { title: "云端协作", desc: "团队成员可实时共享图纸，同步查看标注内容，提升沟通效率。" },
              { title: "版本管理", desc: "自动保存历史版本，随时回溯和对比不同阶段的图纸修改。" }
            ].map((feature, index) => (
              <div key={index} className="p-6 border border-border rounded-xl bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 3. 页脚 Footer */}
      <footer className="border-t border-border py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <CrosshairLogo size={24} />
              <span className="text-sm font-semibold">Blueprint Annotator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Blueprint Annotator. 保留所有权利。
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">隐私政策</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">服务条款</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}