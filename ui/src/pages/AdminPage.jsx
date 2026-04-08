import { Link } from 'react-router-dom'

export default function AdminPage() {
  return (
    <main className="page-simple">
      <p className="page-simple__text">관리자 화면은 PRD §5에 따라 추후 구현합니다.</p>
      <Link to="/" className="link-blue">
        주문하기로 돌아가기
      </Link>
    </main>
  )
}
