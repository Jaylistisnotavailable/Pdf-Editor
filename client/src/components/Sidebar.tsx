/**
 * Sidebar — Left panel showing document info, page list,
 * scale settings and project management.
 *
 * Studio Light design:
 * white panel, IBM Plex Sans/Mono, cobalt accent.
 *
 * Project integration:
 * - Supabase authenticated user
 * - Current project
 * - Save project
 * - Project list navigation
 * - Logout
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLocation } from "wouter";

import { usePdf } from "@/contexts/PdfContext";

import { useAnnotation } from "@/contexts/AnnotationContext";

import {
  useProject,
} from "@/contexts/ProjectContext";

import {
  useAuth,
} from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FolderOpen,
  Layers,
  Ruler,
  Info,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Save,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { toast } from "sonner";

import CrosshairLogo from "./CrosshairLogo";


interface SidebarProps {
  className?: string;
}


/**
 * Format PDF page dimensions.
 *
 * PDF dimensions are stored in mm.
 */
function formatMm(mm: number): string {
  if (mm >= 1000) {
    return `${(mm / 1000).toFixed(2)} m`;
  }

  if (mm >= 10) {
    return `${mm.toFixed(1)} mm`;
  }

  return `${mm.toFixed(2)} mm`;
}


/**
 * Sidebar
 */
export default function Sidebar({
  className,
}: SidebarProps) {
  const [, navigate] = useLocation();

  /**
   * ---------------------------------------------------------
   * PDF Context
   * ---------------------------------------------------------
   */
  const {
    fileName,
    numPages,
    currentPage,
    pages,

    scaleNumerator,
    scaleDenominator,
    scaleUnit,

    renderScale,

    isLoading,

    loadPdf,
    setCurrentPage,
    setScale,
    setRenderScale,
  } = usePdf();


  /**
   * ---------------------------------------------------------
   * Annotation Context
   * ---------------------------------------------------------
   */
  const {
    shapes,
    clearAll,
  } = useAnnotation();


  /**
   * ---------------------------------------------------------
   * Project Context
   * ---------------------------------------------------------
   */
  const {
    currentProject,
    saveProject,
    saving,
  } = useProject();


  /**
   * ---------------------------------------------------------
   * Auth Context
   * ---------------------------------------------------------
   */
  const {
    user,
    signOut,
  } = useAuth();


  /**
   * ---------------------------------------------------------
   * Local state
   * ---------------------------------------------------------
   */
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    scaleNum,
    setScaleNum,
  ] = useState(
    String(scaleNumerator)
  );

  const [
    scaleDen,
    setScaleDen,
  ] = useState(
    String(scaleDenominator)
  );

  const [
    scaleUnitVal,
    setScaleUnitVal,
  ] = useState<
    "m" | "cm" | "mm"
  >(scaleUnit);


  /**
   * ---------------------------------------------------------
   * Keep local scale controls synchronized with
   * the active project / PDF context.
   *
   * This is important when opening a project from
   * Supabase because ProjectContext restores the
   * saved scale values asynchronously.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    setScaleNum(
      String(scaleNumerator)
    );
  }, [scaleNumerator]);


  useEffect(() => {
    setScaleDen(
      String(scaleDenominator)
    );
  }, [scaleDenominator]);


  useEffect(() => {
    setScaleUnitVal(
      scaleUnit
    );
  }, [scaleUnit]);


  /**
   * ---------------------------------------------------------
   * Open local PDF
   * ---------------------------------------------------------
   *
   * This preserves the original behaviour.
   *
   * The selected PDF is loaded into PdfContext.
   * It is NOT automatically uploaded to Supabase.
   *
   * The user can then press "保存项目".
   */
  const handleFileChange =
    useCallback(
      async (
        e: React.ChangeEvent<HTMLInputElement>
      ) => {
        const file =
          e.target.files?.[0];

        if (!file) {
          return;
        }

        if (
          file.type !==
          "application/pdf"
        ) {
          toast.error(
            "请选择 PDF 文件"
          );

          e.target.value = "";

          return;
        }

        try {
          await loadPdf(file);

          toast.success(
            `已加载: ${file.name}`
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "PDF 加载失败"
          );
        } finally {
          /**
           * Reset input so the same PDF can
           * be selected again later.
           */
          e.target.value = "";
        }
      },
      [loadPdf]
    );


  /**
   * ---------------------------------------------------------
   * Apply scale
   * ---------------------------------------------------------
   */
  const handleApplyScale =
    useCallback(() => {
      const num =
        parseFloat(scaleNum);

      const den =
        parseFloat(scaleDen);

      if (
        Number.isNaN(num) ||
        Number.isNaN(den) ||
        num <= 0 ||
        den <= 0
      ) {
        toast.error(
          "请输入有效的比例值"
        );

        return;
      }

      setScale(
        num,
        den,
        scaleUnitVal
      );

      toast.success(
        "比例已更新"
      );
    }, [
      scaleNum,
      scaleDen,
      scaleUnitVal,
      setScale,
    ]);


  /**
   * ---------------------------------------------------------
   * Save current project
   * ---------------------------------------------------------
   *
   * ProjectContext is responsible for:
   *
   * PDF -> Supabase Storage
   * annotations -> Supabase PostgreSQL
   * settings -> Supabase PostgreSQL
   */
  const handleSaveProject =
    useCallback(async () => {
      if (!currentProject) {
        toast.error(
          "当前没有打开项目，请先从项目列表打开或创建项目"
        );

        return;
      }

      if (!fileName) {
        toast.error(
          "请先打开 PDF 图纸"
        );

        return;
      }

      await saveProject();
    }, [
      currentProject,
      fileName,
      saveProject,
    ]);


  /**
   * ---------------------------------------------------------
   * Go to project list
   * ---------------------------------------------------------
   */
  const handleGoToProjects =
    useCallback(() => {
      navigate("/projects");
    }, [navigate]);


  /**
   * ---------------------------------------------------------
   * Logout
   * ---------------------------------------------------------
   */
  const handleLogout =
    useCallback(async () => {
      try {
        const result =
          await signOut();

        if (result.error) {
          toast.error(
            result.error.message
          );

          return;
        }

        navigate("/login");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "退出登录失败"
        );
      }
    }, [
      signOut,
      navigate,
    ]);


  /**
   * ---------------------------------------------------------
   * Current page information
   * ---------------------------------------------------------
   */
  const currentPageInfo =
    pages[currentPage - 1];


  /**
   * ---------------------------------------------------------
   * Current page annotations
   * ---------------------------------------------------------
   */
  const pageShapes =
    shapes.filter(
      (shape) =>
        shape.page === currentPage
    );


  /**
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-border",
        "font-sans select-none",
        className
      )}
      style={{
        width: 280,
        minWidth: 280,
      }}
    >

      {/* =====================================================
          Header — Brand
          ===================================================== */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-border"
        style={{
          background:
            "oklch(0.99 0.002 240)",
        }}
      >
        <CrosshairLogo
          size={26}
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground tracking-tight leading-tight">
            Blueprint Annotator
          </p>

          <p className="text-xs text-muted-foreground leading-tight">
            建筑图纸标注工具
          </p>
        </div>
      </div>


      {/* =====================================================
          Current Project
          ===================================================== */}
      {currentProject && (
        <div className="px-4 py-3 border-b border-border">

          {/* Back to project list */}
          <button
            type="button"
            onClick={
              handleGoToProjects
            }
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft
              className="w-3.5 h-3.5"
            />

            <span>
              项目列表
            </span>
          </button>


          <div className="flex items-center justify-between gap-2">

            {/* Project name */}
            <div className="min-w-0 flex-1">

              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                当前项目
              </p>

              <p
                className="text-sm font-semibold text-foreground truncate"
                title={
                  currentProject.name
                }
              >
                {
                  currentProject.name
                }
              </p>

            </div>


            {/* Save button */}
            <button
              type="button"
              onClick={
                handleSaveProject
              }
              disabled={
                saving ||
                !fileName
              }
              title={
                !fileName
                  ? "请先打开 PDF"
                  : "保存项目"
              }
              className={cn(
                "shrink-0 flex items-center gap-1.5",
                "px-2.5 py-1.5 rounded-md",
                "text-xs font-medium",
                "transition-colors",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "disabled:opacity-50",
                "disabled:cursor-not-allowed"
              )}
            >
              <Save
                className="w-3.5 h-3.5"
              />

              {saving
                ? "保存中"
                : "保存"}
            </button>

          </div>


          {/* User information */}
          {user?.email && (
            <p
              className="text-[10px] text-muted-foreground truncate mt-2"
              title={user.email}
            >
              {user.email}
            </p>
          )}

        </div>
      )}


      {/* =====================================================
          Open PDF
          ===================================================== */}
      <div className="px-4 py-3 border-b border-border">

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={
            handleFileChange
          }
        />

        <Button
          variant="default"
          size="sm"
          className="w-full gap-2 text-xs font-medium"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={isLoading}
        >
          <FolderOpen
            className="w-3.5 h-3.5"
          />

          {isLoading
            ? "加载中..."
            : "打开 PDF 图纸"}
        </Button>

      </div>


      {/* =====================================================
          Scrollable Content
          ===================================================== */}
      <div className="flex-1 overflow-y-auto">

        {/* ===================================================
            Document Info
            =================================================== */}
        {fileName && (
          <section className="px-4 py-3 border-b border-border">

            <SectionHeader
              icon={
                <Info className="w-3.5 h-3.5" />
              }
              title="图纸信息"
            />

            <div className="space-y-1.5">

              <InfoRow
                label="文件名"
                value={fileName}
                mono
              />

              <InfoRow
                label="总页数"
                value={`${numPages} 页`}
                mono
              />

              {currentPageInfo && (
                <>
                  <InfoRow
                    label="页面尺寸"
                    value={`${formatMm(
                      currentPageInfo.widthMm
                    )} × ${formatMm(
                      currentPageInfo.heightMm
                    )}`}
                    mono
                  />

                  <InfoRow
                    label="旋转角度"
                    value={`${currentPageInfo.rotation}°`}
                    mono
                  />
                </>
              )}

              <InfoRow
                label="当前页标注"
                value={`${pageShapes.length} 个`}
                mono
              />

            </div>
          </section>
        )}


        {/* ===================================================
            Scale Settings
            =================================================== */}
        {fileName && (
          <section className="px-4 py-3 border-b border-border">

            <SectionHeader
              icon={
                <Ruler className="w-3.5 h-3.5" />
              }
              title="图纸比例"
            />

            <div className="space-y-2">

              <p className="text-xs text-muted-foreground">
                实际长度 / PDF 点数
              </p>


              <div className="flex items-end gap-1.5">

                {/* Actual value */}
                <div className="flex-1">

                  <Label className="text-xs text-muted-foreground mb-1 block">
                    实际值
                  </Label>

                  <Input
                    type="number"
                    value={scaleNum}
                    onChange={(e) =>
                      setScaleNum(
                        e.target.value
                      )
                    }
                    className="h-7 text-xs font-mono"
                    min="0.001"
                    step="0.1"
                    inputMode="decimal"
                  />

                </div>


                {/* Unit */}
                <Select
                  value={
                    scaleUnitVal
                  }
                  onValueChange={(
                    value
                  ) =>
                    setScaleUnitVal(
                      value as
                        | "m"
                        | "cm"
                        | "mm"
                    )
                  }
                >

                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="m">
                      m
                    </SelectItem>

                    <SelectItem value="cm">
                      cm
                    </SelectItem>

                    <SelectItem value="mm">
                      mm
                    </SelectItem>

                  </SelectContent>

                </Select>


                <span className="text-xs text-muted-foreground pb-1.5">
                  /
                </span>


                {/* PDF points */}
                <div className="flex-1">

                  <Label className="text-xs text-muted-foreground mb-1 block">
                    点数
                  </Label>

                  <Input
                    type="number"
                    value={scaleDen}
                    onChange={(e) =>
                      setScaleDen(
                        e.target.value
                      )
                    }
                    className="h-7 text-xs font-mono"
                    min="1"
                    step="1"
                    inputMode="decimal"
                  />

                </div>

              </div>


              {/* Apply scale */}
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs"
                onClick={
                  handleApplyScale
                }
              >
                应用比例
              </Button>


              {/* Current scale */}
              <div
                className="rounded p-2"
                style={{
                  background:
                    "oklch(0.96 0.004 240)",
                }}
              >

                <p className="text-xs text-muted-foreground mb-0.5">
                  当前比例
                </p>

                <p className="text-xs font-mono font-medium text-foreground">
                  1 pt ={" "}
                  {scaleNumerator}
                  {scaleUnit} /{" "}
                  {
                    scaleDenominator
                  }
                  pt
                </p>

              </div>


              {/* Render quality */}
              <div>

                <Label className="text-xs text-muted-foreground mb-1 block">
                  渲染质量 (×
                  {renderScale})
                </Label>

                <div className="flex gap-1">

                  {[1, 1.5, 2, 3].map(
                    (scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() =>
                          setRenderScale(
                            scale
                          )
                        }
                        className={cn(
                          "flex-1 h-6 text-xs rounded border transition-colors font-mono",

                          renderScale ===
                            scale
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {scale}×
                      </button>
                    )
                  )}

                </div>

              </div>

            </div>

          </section>
        )}


        {/* ===================================================
            Page List
            =================================================== */}
        {numPages > 0 && (
          <section className="px-4 py-3">

            <div className="flex items-center gap-1.5 mb-2">

              <Layers
                className="w-3.5 h-3.5 text-muted-foreground"
              />

              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                页面列表
              </span>

              <span className="ml-auto text-xs text-muted-foreground font-mono">
                {currentPage}/
                {numPages}
              </span>

            </div>


            <div className="space-y-0.5">

              {pages.map(
                (page) => {
                  const isActive =
                    page.pageNumber ===
                    currentPage;

                  const shapeCount =
                    shapes.filter(
                      (shape) =>
                        shape.page ===
                        page.pageNumber
                    ).length;

                  return (
                    <button
                      key={
                        page.pageNumber
                      }
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page.pageNumber
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",

                        isActive
                          ? "bg-primary/8 text-primary"
                          : "hover:bg-muted text-foreground"
                      )}
                    >

                      {/* Page number */}
                      <span
                        className={cn(
                          "w-5 h-5 rounded text-xs flex items-center justify-center font-mono font-medium shrink-0",

                          isActive
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {
                          page.pageNumber
                        }
                      </span>


                      {/* Page information */}
                      <div className="flex-1 min-w-0">

                        <p className="text-xs font-medium truncate">
                          第{" "}
                          {
                            page.pageNumber
                          }{" "}
                          页
                        </p>

                        <p className="text-xs text-muted-foreground font-mono">
                          {formatMm(
                            page.widthMm
                          )}{" "}
                          ×{" "}
                          {formatMm(
                            page.heightMm
                          )}
                        </p>

                      </div>


                      {/* Annotation count */}
                      {shapeCount >
                        0 && (
                        <span
                          className="text-xs font-mono shrink-0 px-1 py-0.5 rounded"
                          style={{
                            color:
                              "oklch(0.52 0.22 260)",

                            background:
                              "oklch(0.52 0.22 260 / 0.1)",
                          }}
                        >
                          {
                            shapeCount
                          }
                        </span>
                      )}


                      {/* Active indicator */}
                      {isActive && (
                        <ChevronRight
                          className="w-3 h-3 text-primary shrink-0"
                        />
                      )}

                    </button>
                  );
                }
              )}

            </div>

          </section>
        )}


        {/* ===================================================
            Empty state
            =================================================== */}
        {!fileName && (
          <div className="flex flex-col items-center justify-center h-52 px-4 text-center">

            <CrosshairLogo
              size={44}
              color="oklch(0.75 0.01 240)"
              className="mb-3"
            />

            <p className="text-sm font-semibold text-foreground mb-1">
              打开 PDF 图纸开始标注
            </p>

            <p className="text-xs text-muted-foreground leading-relaxed">
              支持多页图纸 · 设置比例 · 绘制几何标注
            </p>

          </div>
        )}

      </div>


      {/* =====================================================
          Footer
          ===================================================== */}
      <div className="border-t border-border">

        {/* Clear current page */}
        {fileName && (
          <div className="px-4 py-3 border-b border-border">

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
              onClick={() => {
                clearAll(
                  currentPage
                );

                toast.success(
                  "已清除当前页标注"
                );
              }}
            >
              <Trash2
                className="w-3.5 h-3.5"
              />

              清除当前页标注
            </Button>

          </div>
        )}


        {/* Project navigation */}
        <div className="px-4 py-3 space-y-2">

          {/* Project list */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={
              handleGoToProjects
            }
          >
            <FolderOpen
              className="w-3.5 h-3.5"
            />

            项目列表
          </Button>


          {/* Save project */}
          {currentProject && (
            <Button
              variant="default"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={
                handleSaveProject
              }
              disabled={
                saving ||
                !fileName
              }
            >
              <Save
                className="w-3.5 h-3.5"
              />

              {saving
                ? "保存项目中..."
                : "保存项目"}
            </Button>
          )}


          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={
              handleLogout
            }
          >
            <LogOut
              className="w-3.5 h-3.5"
            />

            退出登录
          </Button>

        </div>

      </div>

    </aside>
  );
}


/**
 * Section header
 */
function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">

      <span className="text-muted-foreground">
        {icon}
      </span>

      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </span>

    </div>
  );
}


/**
 * Information row
 */
function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">

      <span className="text-xs text-muted-foreground shrink-0">
        {label}
      </span>

      <span
        className={cn(
          "text-xs text-foreground text-right truncate",
          mono && "font-mono"
        )}
        title={value}
      >
        {value}
      </span>

    </div>
  );
}
