import { NextRequest, NextResponse } from "next/server";
import { TempEnvManager } from "@/lib/temp-env-manager";
import { getUserInfo } from "@/lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const userInfo = await getUserInfo(req);
    const { githubUrl } = await req.json();

    const tempEnvManager = new TempEnvManager();
    const repository = await tempEnvManager.createOrUpdateRepository(
      githubUrl,
      userInfo.id
    );

    return NextResponse.json({ repositoryId: repository.slug });
  } catch (error) {
    console.error("Error in clone API:", error);
    return NextResponse.json(
      { error: "Failed to clone repository" },
      { status: 500 }
    );
  }
}
