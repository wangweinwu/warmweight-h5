/**
 * 构建时环境变量（.env 文件 / Vercel 项目设置）
 *
 * 全部可选项；不配置则由用户在应用「我的 → WebDAV 云备份」里自行填写
 * 前缀 VITE_ 会被 Vite 注入到客户端 bundle（注意：不要在这里放机密）
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebDAV 服务器根地址，如 https://dav.jianguoyun.com/dav/ */
  readonly VITE_WEBDAV_URL?: string
  /** WebDAV 账号 */
  readonly VITE_WEBDAV_USERNAME?: string
  /** WebDAV 密码 / 应用密码（公开前端里视为非机密，建议用应用密码） */
  readonly VITE_WEBDAV_PASSWORD?: string
  /** 远端目录，默认 warmweight */
  readonly VITE_WEBDAV_DIR?: string
  /** 部署后默认开启自动备份（'1'/'true'） */
  readonly VITE_WEBDAV_ENABLED?: string
  /** 默认连接方式：'proxy'（默认）| 'direct' */
  readonly VITE_WEBDAV_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
