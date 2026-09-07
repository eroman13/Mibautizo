/**
 * Ruta antigua /invitacion: redirige al Home con los mismos parámetros,
 * donde se muestra la invitación personalizada conservando el diseño del sitio.
 */

import { Navigate, useSearchParams } from 'react-router-dom';

export default function Invitacion() {
  const [searchParams] = useSearchParams();
  const q = searchParams.toString();

  return <Navigate to={q ? `/?${q}` : '/'} replace />;
}

