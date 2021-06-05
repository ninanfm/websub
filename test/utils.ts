import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures');

interface Headers {
  [key: string]: string | string[];
}

export const getRequestFixture = (
  fileName: string
): {
  content: string;
  headers: Headers;
} => {
  const content = readFixtureFile(fileName);
  const headers = parsePlainTextToHeaders(
    readFixtureFile(fileName + '.headers')
  );

  return {
    content,
    headers,
  };
};

export const readFixtureFile = (fileName: string): string => {
  const fullPath = path.resolve(FIXTURE_DIR, fileName);
  return fs.readFileSync(fullPath, 'utf8');
};

export const parsePlainTextToHeaders = (
  text: string
): {
  [key: string]: string | string[];
} => {
  return text
    .split('\n')
    .map(line => line.split(':'))
    .reduce((headers, [name, ...rest]) => {
      const value = rest.join(':').toLowerCase().trim();
      name = name.toLowerCase().trim();
      if (Array.isArray(headers[name])) {
        (headers[name] as string[]).push(value);
      } else if (typeof headers[name] === 'string') {
        headers[name] = [headers[name] as string, value];
      } else {
        headers[name] = value;
      }
      return headers;
    }, {} as Headers);
};
