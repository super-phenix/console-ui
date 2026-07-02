// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isEmpty(obj: any) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
}
