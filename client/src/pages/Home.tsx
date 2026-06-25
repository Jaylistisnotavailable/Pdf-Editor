/**
 * Home — Main application page.
 * Layout: fixed left sidebar (280px) + flexible canvas area with floating toolbar.
 * Studio Light design: white sidebar, gray canvas background, cobalt accent.
 */
import React from "react";
import Sidebar from "@/components/Sidebar";
import BlueprintCanvas from "@/components/BlueprintCanvas";
import FloatingToolbar from "@/components/FloatingToolbar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Canvas area */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <BlueprintCanvas />
        <FloatingToolbar />
      </div>
    </div>
  );
}
