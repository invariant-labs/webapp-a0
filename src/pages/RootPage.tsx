import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

const RootPage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/swap')

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <HeaderWrapper />
      <Outlet />
      <FooterWrapper />
    </>
  )
}

export default RootPage
