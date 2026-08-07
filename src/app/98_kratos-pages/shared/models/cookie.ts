export function getCookie(name: string) {
  const ca: string[] = document.cookie.split(';');
  // console.log(document.cookie);
  const caLen: number = ca.length;
  const cookieName = `${name}=`;
  let c: string;

  for (let i = 0; i < caLen; i += 1) {
    c = ca[i].replace(/^\s+/g, '');
    if (c.indexOf(cookieName) == 0) {
      return c.substring(cookieName.length, c.length);
    }
  }
  return '';
}
