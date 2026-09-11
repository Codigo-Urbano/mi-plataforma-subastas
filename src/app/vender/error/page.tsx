import Link from "next/link";

export default function ErrorPagoPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <div className="bg-red-500/10 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold mb-4">El pago no se completó</h1>
      <p className="text-muted-foreground mb-8">
        Has cancelado el proceso de pago o hubo un problema con la transacción. 
        Tu publicación quedó guardada como "Pendiente de Pago" y no será pública hasta que se abone la comisión.
      </p>

      <div className="flex flex-col gap-4">
        <Link 
          href="/vender" 
          className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg transition-transform hover:scale-[1.02]"
        >
          Intentar publicar de nuevo
        </Link>
        <Link 
          href="/" 
          className="text-muted-foreground hover:text-foreground font-medium"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
