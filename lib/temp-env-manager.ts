import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TempEnvManager {
  private baseDir: string;
  private lifetime: number;
  private environments: { [key: string]: { path: string; createdAt: number } };

  constructor(baseDir?: string, lifetime = 3600) {
    this.baseDir = baseDir || path.join(process.cwd(), 'temp_environments');
    this.lifetime = lifetime;
    this.environments = {};

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async createEnvironment(repoUrl: string): Promise<string> {
    const envId = `env_${Date.now()}`;
    const envPath = path.join(this.baseDir, envId);

    await fs.promises.mkdir(envPath, { recursive: true });

    try {
      // Clone the repository
      await execAsync(`git clone ${repoUrl} ${envPath}`);

      // Create a virtual environment
      await execAsync(`python3 -m venv ${path.join(envPath, 'venv')}`);

      // Install ccontext in the virtual environment
      const pipPath = path.join(envPath, 'venv', 'bin', 'pip');
      await execAsync(`${pipPath} install ccontext`);

      this.environments[envId] = {
        path: envPath,
        createdAt: Date.now(),
      };

      return envId;
    } catch (error) {
      await this.deleteEnvironment(envId);
      throw error;
    }
  }

  async runCommand(envId: string, command: string): Promise<{ stdout: string; stderr: string }> {
    if (!this.environments[envId]) {
      throw new Error('Environment not found');
    }

    const envPath = this.environments[envId].path;
    const activateScript = path.join(envPath, 'venv', 'bin', 'activate');
    
    // Modify the command to ensure ccontext is only called once
    const modifiedCommand = command.startsWith('ccontext') ? command : `ccontext -gm`; // ${command}
    
    const fullCommand = `source ${activateScript} && cd ${envPath} && ${modifiedCommand}`;
    return execAsync(fullCommand);
  }

  async cleanupExpiredEnvironments(): Promise<void> {
    const currentTime = Date.now();
    const expiredEnvs = Object.entries(this.environments)
      .filter(([, env]) => currentTime - env.createdAt > this.lifetime * 1000)
      .map(([envId]) => envId);

    for (const envId of expiredEnvs) {
      await this.deleteEnvironment(envId);
    }
  }

  private async deleteEnvironment(envId: string): Promise<void> {
    if (this.environments[envId]) {
      await fs.promises.rm(this.environments[envId].path, { recursive: true, force: true });
      delete this.environments[envId];
    }
  }
}