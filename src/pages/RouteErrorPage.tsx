import { isRouteErrorResponse, useRouteError } from 'react-router';
import { LinkButton } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
export function RouteErrorPage() {
  const error = useRouteError();
  return <Container className="foundation">
    <title>Kesalahan halaman — Kindsight</title>
    <h1 className="foundation__title">Halaman gagal ditampilkan.</h1>
    <p>{isRouteErrorResponse(error) && error.status === 404 ? 'Alamat tidak ditemukan.' : 'Silakan kembali ke fondasi atau muat ulang halaman.'}</p>
    <div className="foundation__buttons"><LinkButton to="/foundation">Kembali ke fondasi</LinkButton></div>
  </Container>;
}
