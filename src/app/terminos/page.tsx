import Link from "next/link";
import React from "react";

export default function TerminosPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center gap-2">
        &larr; Volver al inicio
      </Link>

      <div className="glass rounded-2xl p-8 md:p-12 border border-border">
        <h1 className="text-3xl font-bold mb-6 text-center">Términos y Condiciones</h1>
        <p className="text-muted-foreground text-center mb-10">
          Bienvenido a <strong>SUBASTAS.PRO</strong>. Al registrarte y utilizar nuestra plataforma, aceptas las siguientes reglas de convivencia y funcionamiento.
        </p>

        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>🎯</span> 1. El Propósito de la Plataforma
            </h2>
            <p className="text-muted-foreground">
              Somos un espacio que conecta vendedores que desean subastar sus productos con compradores interesados en pujar por ellos. La plataforma provee el entorno tecnológico para que las pujas se realicen en tiempo real de forma transparente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>🏪</span> 2. Reglas para Vendedores
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Debes describir el producto con la mayor exactitud posible y subir imágenes reales del mismo.</li>
              <li>
                <strong>Costo de Publicación:</strong> Cobramos una tarifa inicial para publicar, la cual se calcula bajo un modelo escalonado según el precio base de la subasta.
                <ul className="list-circle pl-5 mt-2 space-y-1">
                  <li>El porcentaje de comisión disminuye a medida que el valor del bien es mayor (beneficiando la venta de bienes de alto valor como vehículos o inmuebles).</li>
                  <li>La comisión exacta en ARS se calculará y mostrará de forma transparente al Vendedor antes de confirmar la publicación en MercadoPago.</li>
                  <li>Existe un piso de comisión mínima absoluta.</li>
                </ul>
              </li>
              <li><strong>Duración:</strong> Las subastas no pueden exceder un plazo máximo de 30 días.</li>
              <li>Al finalizar la subasta, te comprometes a contactar al ganador y entregar el producto al precio de cierre pactado en la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>🛍️</span> 3. Reglas para Compradores
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Pujar es un compromiso de compra.</strong> Si haces una oferta y resultas ganador al finalizar el tiempo, estás obligado a concretar la transacción con el vendedor.</li>
              <li>Solo el ganador de la subasta tendrá acceso a los datos de contacto del vendedor (y viceversa) para coordinar el pago y la entrega física del producto.</li>
              <li>No hagas ofertas si no tienes la intención o los medios para pagar el artículo en la vida real.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>🤝</span> 4. Transacciones y Envíos
            </h2>
            <p className="text-muted-foreground">
              La plataforma <strong>no interviene</strong> en el cobro final del producto ni en la logística de envío. El pago del artículo y el método de entrega deben ser acordados mutuamente entre el vendedor y el comprador, una vez que la plataforma les haya revelado sus respectivos datos de contacto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>⚖️</span> 5. Responsabilidad Legal y Veridad de Identidad (KYC)
            </h2>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-muted-foreground">
              <li>SUBASTAS.PRO es únicamente una plataforma intermediaria de tecnología. No somos dueños de los artículos subastados y no podemos garantizar la legalidad, procedencia o estado de los mismos.</li>
              <li>Al publicar un artículo, el Vendedor declara bajo juramento legal ser el legítimo propietario o tener el derecho legal para comercializar el producto.</li>
              <li>En caso de investigaciones policiales o judiciales, la plataforma cooperará entregando IPs, correos y datos registrados del usuario.</li>
              <li>Para categorías de alto valor o riesgo (como Vehículos o Inmuebles), la plataforma se reserva el derecho de exigir una verificación de identidad (KYC), requiriendo foto de documento nacional de identidad antes de permitir la publicación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>⭐</span> 6. Sistema de Reputación
            </h2>
            <p className="text-muted-foreground">
              Para mantener una comunidad segura y confiable, hemos implementado un sistema de calificaciones.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-muted-foreground">
              <li>Al finalizar la transacción, ambas partes deben volver a la plataforma para calificarse mutuamente (de 1 a 5 estrellas) y dejar una breve reseña de cómo resultó todo.</li>
              <li>Esta calificación será pública y visible en tu perfil para que otros usuarios puedan confiar en ti en futuras transacciones.</li>
              <li>Usuarios con reiteradas malas calificaciones podrán ser suspendidos de la plataforma.</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 text-center pt-8 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground">
            Al hacer clic en "Registrarse" o al utilizar los servicios de la plataforma, confirmas que has leído y aceptas cumplir con este manual de convivencia.
          </p>
        </div>
      </div>
    </div>
  );
}

