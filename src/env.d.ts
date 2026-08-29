declare module 'node:crypto' {
  interface Hash {
    update(value: string): Hash
    digest(encoding: 'hex'): string
  }

  export function createHash(algorithm: string): Hash
}
