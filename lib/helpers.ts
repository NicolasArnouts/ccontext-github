export function sanitizeInput(input: string): string {
    // Remove any potentially harmful characters or scripts
    return input.replace(/[;&|`$()]/g, '');
  }
  
  export function validateGitHubUrl(url: string): boolean {
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
    return githubUrlRegex.test(url);
  }
  
  export function getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  }
  
  export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  export function debounce<F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
  ): (...args: Parameters<F>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<F>): void => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };
  }