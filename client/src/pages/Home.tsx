import React from "react";

import Sidebar from "@/components/Sidebar";
import BlueprintCanvas from "@/components/BlueprintCanvas";
import FloatingToolbar from "@/components/FloatingToolbar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      <Sidebar />

      <div className="relative flex-1 flex flex-col overflow-hidden">

        <BlueprintCanvas />

        <FloatingToolbar />

      </div>

    </div>
  );
}
