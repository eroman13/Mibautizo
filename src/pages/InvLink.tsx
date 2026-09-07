/**
 * Enlace corto de invitación: /i/:token
 * Consulta el token y redirige al Home con el contexto de la invitación
 * (familia, token y modalidad) para que WhatsApp/otros muestren un link breve.
 */

import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function InvLink() {
  const { token } = useParams<{ token: string }>();
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setDestino('/');
      return;
    }
    let activo = true;
    api
      .getInvitacionPorToken(token)
      .then((response) => {
        if (!activo) return;
        const info = response?.data;
        if (!info) {
          setDestino(`/?token=${encodeURIComponent(token)}`);
          return;
        }
        const p = new URLSearchParams();
        if (info.familia) p.set('familia', info.familia);
        p.set('token', token);
        if (info.modalidad) p.set('modalidad', info.modalidad);
        setDestino(`/?${p.toString()}`);
      })
      .catch(() => {
        if (activo) setDestino(`/?token=${encodeURIComponent(token)}`);
      });
    return () => {
      activo = false;
    };
  }, [token]);

  if (destino) {
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando invitación...</p>
      </div>
    </div>
  );
}
