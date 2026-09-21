/**
 * sha-256 摘要（注册/登录密码哈希）
 * 说明：纯前端 demo 使用 WebCrypto 做不可逆哈希；
 * 生产部署请把认证迁到服务端（见 docs/API.md），此处接口保持不变。
 */
export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode('ww:' + pw)
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // 极旧环境兜底（非安全哈希，仅保证功能可用）
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < data.length; i++) {
    const ch = data[i]
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}
