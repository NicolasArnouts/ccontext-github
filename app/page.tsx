import Image from "next/image";
import GitHubCContext from '@/components/GitHubCContext'


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">GitHub Clone and CContext</h2>
        <GitHubCContext />
      </div>
    </main>
  );
}
