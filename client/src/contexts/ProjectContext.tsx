import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useLocation } from "wouter";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePdf } from "@/contexts/PdfContext";
import {
  Shape,
  useAnnotation,
} from "@/contexts/AnnotationContext";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  file_name: string | null;
  file_path: string | null;
  annotations: Shape[];
  settings: {
    scaleNumerator?: number;
    scaleDenominator?: number;
    scaleUnit?: "m" | "cm" | "mm";
    renderScale?: number;
  };
  created_at: string;
  updated_at: string;
}

interface ProjectContextValue {
  projects: Project[];

  currentProject: Project | null;

  loading: boolean;

  saving: boolean;

  refreshProjects: () => Promise<void>;

  createProject: (
    name: string
  ) => Promise<Project | null>;

  openProject: (
    project: Project
  ) => Promise<void>;

  saveProject: (
    name?: string
  ) => Promise<Project | null>;

  renameProject: (
    id: string,
    name: string
  ) => Promise<void>;

  deleteProject: (
    project: Project
  ) => Promise<void>;

  closeProject: () => void;
}

const ProjectContext =
  createContext<ProjectContextValue | null>(
    null
  );

const STORAGE_BUCKET =
  "project-files";

export function ProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [, navigate] =
    useLocation();

  const pdf = usePdf();

  const annotation =
    useAnnotation();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [
    currentProject,
    setCurrentProject,
  ] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const refreshProjects =
    useCallback(async () => {
      if (!user) {
        setProjects([]);
        return;
      }

      setLoading(true);

      try {
        const { data, error } =
          await supabase
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order(
              "updated_at",
              {
                ascending: false,
              }
            );

        if (error) {
          throw error;
        }

        setProjects(
          (data ?? []).map(
            normalizeProject
          )
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "无法加载项目"
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProject =
    useCallback(
      async (
        name: string
      ): Promise<Project | null> => {
        if (!user) {
          toast.error("请先登录");
          return null;
        }

        const projectName =
          name.trim();

        if (!projectName) {
          toast.error(
            "请输入项目名称"
          );
          return null;
        }

        const {
          data,
          error,
        } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: projectName,
            annotations: [],
            settings: {
              scaleNumerator: 1,
              scaleDenominator: 100,
              scaleUnit: "m",
              renderScale: 1.5,
            },
          })
          .select()
          .single();

        if (error) {
          toast.error(
            error.message
          );
          return null;
        }

        const project =
          normalizeProject(data);

        setProjects((prev) => [
          project,
          ...prev,
        ]);

        setCurrentProject(project);

        return project;
      },
      [user]
    );

  const openProject =
    useCallback(
      async (project: Project) => {
        if (!user) return;

        setLoading(true);

        try {
          if (
            project.file_path
          ) {
            const {
              data: fileBlob,
              error: downloadError,
            } =
              await supabase.storage
                .from(STORAGE_BUCKET)
                .download(
                  project.file_path
                );

            if (downloadError) {
              throw downloadError;
            }

            const file =
              new File(
                [fileBlob],
                project.file_name ??
                  "project.pdf",
                {
                  type:
                    "application/pdf",
                }
              );

            await pdf.loadPdf(file);
          } else {
            pdf.clearPdf();
          }

          const settings =
            project.settings ??
            {};

          pdf.setScale(
            Number(
              settings.scaleNumerator ??
                1
            ),

            Number(
              settings.scaleDenominator ??
                100
            ),

            settings.scaleUnit ??
              "m"
          );

          pdf.setRenderScale(
            Number(
              settings.renderScale ??
                1.5
            )
          );

          annotation.setShapes(
            Array.isArray(
              project.annotations
            )
              ? project.annotations
              : []
          );

          setCurrentProject(
            project
          );

          navigate(
            `/editor/${project.id}`
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "无法打开项目"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        user,
        pdf,
        annotation,
        navigate,
      ]
    );

  const saveProject =
    useCallback(
      async (
        name?: string
      ): Promise<Project | null> => {
        if (!user) {
          toast.error("请先登录");
          return null;
        }

        if (!currentProject) {
          toast.error(
            "请先创建项目"
          );
          return null;
        }

        if (!pdf.file) {
          toast.error(
            "请先打开 PDF 图纸"
          );
          return null;
        }

        setSaving(true);

        try {
          const file =
            pdf.file;

          const filePath =
            `${user.id}/${currentProject.id}/${sanitizeFileName(
              file.name
            )}`;

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(
                filePath,
                file,
                {
                  upsert: true,
                  contentType:
                    "application/pdf",
                  cacheControl:
                    "3600",
                }
              );

          if (uploadError) {
            throw uploadError;
          }

          const projectName =
            name?.trim() ||
            currentProject.name ||
            removePdfExtension(
              file.name
            );

          const settings = {
            scaleNumerator:
              pdf.scaleNumerator,

            scaleDenominator:
              pdf.scaleDenominator,

            scaleUnit:
              pdf.scaleUnit,

            renderScale:
              pdf.renderScale,
          };

          const {
            data,
            error,
          } = await supabase
            .from("projects")
            .update({
              name: projectName,

              file_name:
                file.name,

              file_path:
                filePath,

              annotations:
                annotation.shapes,

              settings,
            })
            .eq(
              "id",
              currentProject.id
            )
            .eq(
              "user_id",
              user.id
            )
            .select()
            .single();

          if (error) {
            throw error;
          }

          const project =
            normalizeProject(data);

          setCurrentProject(
            project
          );

          setProjects((prev) =>
            prev
              .map((item) =>
                item.id ===
                project.id
                  ? project
                  : item
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  new Date(
                    b.updated_at
                  ).getTime() -
                  new Date(
                    a.updated_at
                  ).getTime()
              )
          );

          toast.success(
            "项目已保存"
          );

          return project;
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "保存项目失败"
          );

          return null;
        } finally {
          setSaving(false);
        }
      },
      [
        user,
        currentProject,
        pdf,
        annotation.shapes,
      ]
    );

  const renameProject =
    useCallback(
      async (
        id: string,
        name: string
      ) => {
        if (!user) return;

        const newName =
          name.trim();

        if (!newName) {
          toast.error(
            "项目名称不能为空"
          );
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("projects")
          .update({
            name: newName,
          })
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          )
          .select()
          .single();

        if (error) {
          toast.error(
            error.message
          );
          return;
        }

        const project =
          normalizeProject(data);

        setProjects((prev) =>
          prev.map((item) =>
            item.id === id
              ? project
              : item
          )
        );

        if (
          currentProject?.id === id
        ) {
          setCurrentProject(
            project
          );
        }

        toast.success(
          "项目名称已修改"
        );
      },
      [
        user,
        currentProject,
      ]
    );

  const deleteProject =
    useCallback(
      async (
        project: Project
      ) => {
        if (!user) return;

        try {
          if (
            project.file_path
          ) {
            await supabase.storage
              .from(STORAGE_BUCKET)
              .remove([
                project.file_path,
              ]);
          }

          const {
            error,
          } = await supabase
            .from("projects")
            .delete()
            .eq(
              "id",
              project.id
            )
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            throw error;
          }

          setProjects((prev) =>
            prev.filter(
              (item) =>
                item.id !==
                project.id
            )
          );

          if (
            currentProject?.id ===
            project.id
          ) {
            setCurrentProject(
              null
            );

            pdf.clearPdf();

            annotation.setShapes(
              []
            );

            navigate(
              "/projects"
            );
          }

          toast.success(
            "项目已删除"
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "删除项目失败"
          );
        }
      },
      [
        user,
        currentProject,
        pdf,
        annotation,
        navigate,
      ]
    );

  const closeProject =
    useCallback(() => {
      setCurrentProject(
        null
      );

      pdf.clearPdf();

      annotation.setShapes([]);

      navigate("/projects");
    }, [
      pdf,
      annotation,
      navigate,
    ]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,

        loading,
        saving,

        refreshProjects,

        createProject,
        openProject,
        saveProject,

        renameProject,
        deleteProject,

        closeProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

function normalizeProject(
  value: any
): Project {
  return {
    id: value.id,
    user_id: value.user_id,
    name: value.name,

    file_name:
      value.file_name ??
      null,

    file_path:
      value.file_path ??
      null,

    annotations:
      Array.isArray(
        value.annotations
      )
        ? value.annotations
        : [],

    settings:
      value.settings ??
      {},

    created_at:
      value.created_at,

    updated_at:
      value.updated_at,
  };
}

function sanitizeFileName(
  name: string
) {
  return name
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .slice(0, 150);
}

function removePdfExtension(
  name: string
) {
  return name.replace(
    /\.pdf$/i,
    ""
  );
}

export function useProject() {
  const context =
    useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProject must be used inside ProjectProvider"
    );
  }

  return context;
}
