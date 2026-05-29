import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-base font-semibold text-foreground">{title}</h2>
    <div className="text-sm font-body text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center gap-3 py-4 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-6 h-6 object-contain" alt="Mulchii" />
            <h1 className="text-lg font-semibold">Política de Privacidad</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-sm font-body text-muted-foreground">
          <p>Última actualización: mayo de 2026</p>
          <p className="mt-1">
            Esta política aplica a <strong className="text-foreground">Mulchii</strong> (mulchii.com),
            desarrollada y operada por <strong className="text-foreground">CASAHUERTO SpA</strong>, RUT 77.XXX.XXX-X,
            con domicilio en Chile. Cumple con la Ley N° 19.628 sobre Protección de la Vida Privada y
            la Ley N° 21.719 de Protección de Datos Personales.
          </p>
        </div>

        <Section title="1. ¿Qué datos recopilamos?">
          <p>Al usar Mulchii recopilamos los siguientes datos personales:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-foreground">Cuenta:</strong> dirección de correo electrónico y contraseña cifrada (o autenticación vía Google).</li>
            <li><strong className="text-foreground">Perfil:</strong> nombre para mostrar, pronombre, foto de perfil, idioma preferido.</li>
            <li><strong className="text-foreground">Ubicación:</strong> ciudad, coordenadas geográficas (latitud/longitud), temperatura mínima y máxima histórica, exposición al viento. Esta información la ingresas voluntariamente para personalizar el calendario y las recomendaciones.</li>
            <li><strong className="text-foreground">Bitácora:</strong> entradas de diario, fotos e información de tu huerto.</li>
            <li><strong className="text-foreground">Semillero:</strong> registros de variedades vegetales y fotos asociadas.</li>
            <li><strong className="text-foreground">Comunidad:</strong> publicaciones, fotos, comentarios y reacciones que compartes con otros usuarios.</li>
            <li><strong className="text-foreground">Códigos de invitación:</strong> código que usaste para registrarte y los códigos que generas para invitar a otras personas.</li>
          </ul>
        </Section>

        <Section title="2. ¿Para qué usamos tus datos?">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Crear y mantener tu cuenta de usuario.</li>
            <li>Personalizar el contenido de la app según tu clima, ubicación e historial de huerto.</li>
            <li>Mostrar tus publicaciones y las de la comunidad.</li>
            <li>Enviarte notificaciones relacionadas con la app (solo si las activas).</li>
            <li>Mejorar el funcionamiento de la plataforma.</li>
          </ul>
          <p>No vendemos ni cedemos tus datos personales a terceros con fines comerciales.</p>
        </Section>

        <Section title="3. ¿Con quién compartimos tus datos?">
          <p>Para operar Mulchii utilizamos los siguientes proveedores de servicios, con quienes tus datos pueden ser procesados fuera de Chile:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-foreground">Supabase Inc.</strong> (Estados Unidos) — base de datos, autenticación y almacenamiento de archivos.</li>
            <li><strong className="text-foreground">Cloudflare Inc.</strong> (Estados Unidos) — alojamiento y distribución del sitio web.</li>
            <li><strong className="text-foreground">Google LLC</strong> (Estados Unidos) — autenticación opcional vía Google.</li>
          </ul>
          <p>Estos proveedores actúan como encargados de tratamiento y solo procesan tus datos según nuestras instrucciones y sus propias políticas de privacidad.</p>
        </Section>

        <Section title="4. ¿Cuánto tiempo guardamos tus datos?">
          <p>Guardamos tus datos mientras tu cuenta esté activa. Si solicitas eliminar tu cuenta, borraremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos retener por obligación legal.</p>
          <p>Las publicaciones de la comunidad que hayas compartido pueden permanecer visibles para otros usuarios hasta que las elimines tú mismo desde la app.</p>
        </Section>

        <Section title="5. Tus derechos">
          <p>Tienes derecho a:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-foreground">Acceso:</strong> saber qué datos tenemos sobre ti.</li>
            <li><strong className="text-foreground">Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong className="text-foreground">Eliminación:</strong> solicitar que borremos tu cuenta y datos asociados.</li>
            <li><strong className="text-foreground">Portabilidad:</strong> recibir una copia de tus datos en formato legible.</li>
            <li><strong className="text-foreground">Oposición:</strong> oponerte a ciertos usos de tus datos.</li>
          </ul>
          <p>Para ejercer cualquiera de estos derechos, escríbenos a <strong className="text-foreground">hola@mulchii.com</strong>.</p>
        </Section>

        <Section title="6. Seguridad">
          <p>Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: cifrado en tránsito (HTTPS), autenticación segura y acceso restringido a la base de datos mediante políticas de seguridad por filas (Row Level Security).</p>
          <p>Sin embargo, ningún sistema es 100% seguro. Si detectas una vulnerabilidad, por favor avísanos a hola@mulchii.com.</p>
        </Section>

        <Section title="7. Menores de edad">
          <p>Mulchii no está dirigida a personas menores de 14 años. Si eres padre o tutor y crees que tu hijo/a nos ha proporcionado datos sin tu consentimiento, contáctanos para eliminar esa información.</p>
        </Section>

        <Section title="8. Cambios a esta política">
          <p>Podemos actualizar esta política en cualquier momento. Te notificaremos dentro de la app si los cambios son significativos. La fecha de "Última actualización" al inicio de este documento indica la versión vigente.</p>
        </Section>

        <Section title="9. Contacto">
          <p>
            <strong className="text-foreground">CASAHUERTO SpA</strong><br />
            Chile<br />
            <a href="mailto:hola@mulchii.com" className="text-primary hover:underline">hola@mulchii.com</a>
          </p>
        </Section>

        <div className="pt-4 border-t border-border">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground font-body transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
