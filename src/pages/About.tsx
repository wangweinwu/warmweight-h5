/** 关于页：数据说明 / 部署指引 / 免责声明 */
import { Link } from 'react-router-dom'
import { NavBar } from '@/components/ui'

export default function About() {
  return (
    <>
      <NavBar title="关于暖轻" back={() => history.back()} />
      <div className="page">
        <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
          <div className="auth-logo" style={{ width: 64, height: 64, borderRadius: 20 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" />
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>暖轻 WarmWeight</div>
          <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>v1.0.0 · 本地优先的个人体重管理 H5</div>
        </div>

        <div className="section-title">数据与隐私</div>
        <div className="card card-pad" style={{ fontSize: 13, color: 'var(--c-ink-2)', lineHeight: 1.8 }}>
          · 所有数据优先保存在本机浏览器（localStorage），不上传任何第三方
          <br />· 网络恢复时自动同步到你自己的云端存储；多端按「时间戳新者胜」合并
          <br />· 照片经压缩后保存；清除浏览器数据会同时清除本地记录，请定期导出备份
          <br />· 密码仅以不可逆摘要保存；生产部署建议将认证迁移至服务端
        </div>

        <div className="section-title">部署信息</div>
        <div className="card card-pad" style={{ fontSize: 13, color: 'var(--c-ink-2)', lineHeight: 1.8 }}>
          · 技术栈：React 18 + TypeScript + Vite + zustand
          <br />· 纯静态构建，Vercel / Netlify 一键部署
          <br />· 数据库（食物 / 运动 / GI / MET）内置打包，离线可用
          <br />· 微信内可调用相机与相册（&lt;input type="file"&gt; 自动适配）
        </div>

        <div className="section-title">免责声明</div>
        <div className="card card-pad" style={{ fontSize: 12, color: 'var(--c-ink-3)', lineHeight: 1.8 }}>
          本应用提供的 BMI 分级、每日减重目标、热量与 GI 数据均为大众化参考值（来源：《中国食物成分表》、中国成人 BMI 标准、Compendium of Physical Activities），不构成医疗建议。如有健康问题，请咨询专业医生或营养师。
        </div>

        <Link to="/" className="btn btn-primary btn-block" style={{ marginTop: 20, textDecoration: 'none' }}>
          返回首页
        </Link>
      </div>
    </>
  )
}
