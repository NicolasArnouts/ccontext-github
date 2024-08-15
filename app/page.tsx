import Image from "next/image";
import GitHubCContext from '@/components/GitHubCContext'
import CleanupButton from '@/components/cleanup-button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between 
  ">
      <div className="space-y-6 w-full max-w-2xl">
        <h2 className="text-3xl font-bold">GitHub Clone and CContext</h2>
        <GitHubCContext />
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Admin Functions</h3>
          <CleanupButton />
        </div>
      </div>
    </main>
  );
}