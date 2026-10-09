export function greet(name: string): string {
  const trimmed = name.trim();

  if (trimmed === '') {
    throw new RangeError('name must not be empty');
  }

  return `Hello, ${trimmed}!`;
}
