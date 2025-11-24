// backend/src/config/dotenv.ts
import dotenv from 'dotenv';
import path from 'path';

// With "module": "commonjs" in tsconfig.json, __dirname is a global variable
// that points to the directory of the current file.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
