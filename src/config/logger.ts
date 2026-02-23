// ============================================================
// Logger Utility — Console logging dengan warna (chalk)
// Format: [LEVEL] context: message
// ============================================================

import chalk from 'chalk';

/**
 * Logger sederhana dengan warna untuk development
 * Menggantikan console.log/error/warn biasa
 */
export const logger = {
  /** Log error — warna merah */
  error: (context: string, ...args: any[]) => {
    console.error(chalk.red.bold('[ERROR]'), chalk.red(context), ...args);
  },

  /** Log warning — warna kuning */
  warn: (context: string, ...args: any[]) => {
    console.warn(chalk.yellow.bold('[WARN]'), chalk.yellow(context), ...args);
  },

  /** Log info — warna biru */
  info: (context: string, ...args: any[]) => {
    console.log(chalk.blue.bold('[INFO]'), chalk.blue(context), ...args);
  },

  /** Log success — warna hijau */
  success: (context: string, ...args: any[]) => {
    console.log(chalk.green.bold('[OK]'), chalk.green(context), ...args);
  },

  /** Log debug — warna abu-abu (hanya di development) */
  debug: (context: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(chalk.gray('[DEBUG]'), chalk.gray(context), ...args);
    }
  },
};
