/**
 * Zero-Plaintext Logging Sanitizer
 * Ensures that console logs, error dumps, and production traces NEVER contain
 * plaintext user messages, decrypted persona replies, authorization tokens, or encryption keys.
 */

const TOKEN_PATTERN = /(Bearer\s+)[A-Za-z0-9_\-\.]{16,}/gi;
const KEY_PATTERN = /(key[":\s=]+)[A-Za-z0-9_\-\.]{16,}/gi;
const BASE64_DATA_PATTERN = /data:[^;]+;base64,[A-Za-z0-9+/=]{40,}/gi;

function sanitizeArgument(arg: any, depth = 0): any {
  if (depth > 4) return '[Nested]';
  if (arg === null || arg === undefined) return arg;

  if (typeof arg === 'string') {
    return arg
      .replace(TOKEN_PATTERN, '$1[REDACTED_TOKEN]')
      .replace(KEY_PATTERN, '$1[REDACTED_KEY]')
      .replace(BASE64_DATA_PATTERN, '[REDACTED_DATA_URL]');
  }

  if (typeof arg === 'object') {
    if (arg instanceof Error) {
      const sanitizedErr = new Error(sanitizeArgument(arg.message, depth + 1));
      sanitizedErr.name = arg.name;
      if (arg.stack) {
        sanitizedErr.stack = sanitizeArgument(arg.stack, depth + 1);
      }
      return sanitizedErr;
    }

    if (Array.isArray(arg)) {
      return arg.map((item) => sanitizeArgument(item, depth + 1));
    }

    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(arg)) {
      const lowerKey = key.toLowerCase();
      // Mask sensitive fields
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('password')
      ) {
        cleanObj[key] = '[REDACTED_CREDENTIAL]';
      } else if (
        lowerKey === 'content' ||
        lowerKey === 'message' ||
        lowerKey === 'messages' ||
        lowerKey === 'reply' ||
        lowerKey === 'text' ||
        lowerKey === 'prompt' ||
        lowerKey === 'systeminstruction'
      ) {
        // Redact plaintext chat content
        if (typeof val === 'string') {
          cleanObj[key] = `[ENCRYPTED_OR_REDACTED_TEXT: length=${val.length}]`;
        } else if (Array.isArray(val)) {
          cleanObj[key] = `[REDACTED_MESSAGES_ARRAY: count=${val.length}]`;
        } else {
          cleanObj[key] = '[REDACTED_CONTENT]';
        }
      } else {
        cleanObj[key] = sanitizeArgument(val, depth + 1);
      }
    }
    return cleanObj;
  }

  return arg;
}

export function installLoggingSanitizer() {
  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args: any[]) => {
    origLog.apply(console, args.map((a) => sanitizeArgument(a)));
  };

  console.info = (...args: any[]) => {
    origInfo.apply(console, args.map((a) => sanitizeArgument(a)));
  };

  console.warn = (...args: any[]) => {
    origWarn.apply(console, args.map((a) => sanitizeArgument(a)));
  };

  console.error = (...args: any[]) => {
    origError.apply(console, args.map((a) => sanitizeArgument(a)));
  };
}
