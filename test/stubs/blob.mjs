/**
 * Stub for @vercel/blob. Records put/del calls, returns fake public URLs.
 */
export const puts = [];
export const dels = [];

export async function put(pathname, body, options = {}) {
  puts.push({ pathname, bytes: body?.length ?? 0, options });
  return {
    url: `https://stub123.public.blob.vercel-storage.com/${pathname}`,
    pathname,
    contentType: options.contentType,
  };
}

export async function del(url) {
  dels.push(url);
  return;
}

export function resetBlob() {
  puts.length = 0;
  dels.length = 0;
}
