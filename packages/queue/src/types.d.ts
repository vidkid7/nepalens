declare module "blurhash" {
  export function encode(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    componentX: number,
    componentY: number
  ): string;
  export function decode(
    blurhash: string,
    width: number,
    height: number,
    punch?: number
  ): Uint8ClampedArray;
}
