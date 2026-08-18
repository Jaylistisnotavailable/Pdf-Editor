import Landing from "./pages/Landing"

import { Toaster } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

import {
  Route,
  Switch,
  Redirect,
} from "wouter";

import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./contexts/ThemeContext";

import { PdfProvider } from "./contexts/PdfContext";

import {
  AnnotationProvider,
} from "./contexts/AnnotationContext";

import {
  AuthProvider,
  useAuth,
} from "./contexts/AuthContext";

import {
  ProjectProvider,
} from "./contexts/ProjectContext";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">
        正在验证登录状态...
      </div>
    );
  }

  if (!user) {
    return (
      <Redirect to="/login" />
    );
  }

  return <>{children}</>;
}

function Router() {
  const { user, loading} = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Switch>

      <Route path="/login">
        {user ? (
          <Redirect to="/projects" />
        ) : (
          <Auth />
        )}
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>

      <Route path="/editor/:projectId">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <Landing />
      </Route>

      {/* 3. 兜底路由：未知路径重定向回介绍页 */}
      <Route>
        <Redirect to="/" />
      </Route>
      
      <Route path="/">
        <Redirect
          to={
            user
              ? "/projects"
              : "/login"
          }
        />
      </Route>

      <Route>
        <Redirect
          to={
            user
              ? "/projects"
              : "/login"
          }
        />
      </Route>

    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>

      <ThemeProvider
        defaultTheme="light"
      >

        <TooltipProvider>

          <AuthProvider>

            <PdfProvider>

              <AnnotationProvider>

                <ProjectProvider>

                  <Toaster
                    position="top-right"
                  />

                  <Router />

                </ProjectProvider>

              </AnnotationProvider>

            </PdfProvider>

          </AuthProvider>

        </TooltipProvider>

      </ThemeProvider>

    </ErrorBoundary>
  );
}

export default App;
