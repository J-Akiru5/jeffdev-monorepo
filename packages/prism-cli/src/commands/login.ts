/**
 * Login Command
 * 
 * Opens browser for Clerk authentication, receives token
 */

import ora from 'ora';
import chalk from 'chalk';
import { saveConfig, loadConfig } from '../config.js';

export async function login(): Promise<void> {
  const spinner = ora('Opening browser for authentication...').start();
  
  const config = loadConfig();
  const authUrl = `${config.apiUrl}/auth/cli`;
  
  // Open browser (cross-platform)
  const openBrowser = async (url: string) => {
    const { exec } = await import('child_process');
    const platform = process.platform;
    
    if (platform === 'win32') {
      exec(`start ${url}`);
    } else if (platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
  };
  
  try {
    await openBrowser(authUrl);
    spinner.succeed('Browser opened');
    
    console.log(chalk.cyan('\n📋 Complete authentication in your browser.'));
    console.log(chalk.dim('   A token will be copied to your clipboard.'));
    console.log(chalk.dim('   Then run: prism login --token <your-token>\n'));
    
    // TODO: Implement device flow or clipboard-based token entry
    // For now, users will paste the token manually
    
  } catch (error) {
    spinner.fail('Failed to open browser');
    console.log(chalk.yellow(`\nManually visit: ${authUrl}`));
  }
}
