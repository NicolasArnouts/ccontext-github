import Image from "next/image";
import GitHubCContext from "@/components/GitHubCContext";
import CleanupButton from "@/components/cleanup-button";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="space-y-6 w-full max-w-5xl">
        <h2 className="text-3xl font-bold">
          Chat with any github codebase you want!
        </h2>

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel className="bg-red-100">
            <GitHubCContext />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="bg-green-100">Two</ResizablePanel>
        </ResizablePanelGroup>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Admin Functions</h3>
          <CleanupButton />
        </div>
      </div>
    </main>
  );
}
