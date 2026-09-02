"use client";

import { useActionState } from "react";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [loginError, loginAction, isLoginPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await login(formData);
      return result?.error || null;
    },
    null
  );

  const [signupError, signupAction, isSignupPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await signup(formData);
      return result?.error || null;
    },
    null
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="w-full max-w-md p-8 rounded-xl glass shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Bienvenido</h1>
            <p className="text-muted-foreground text-sm">
              Inicia sesión o crea una cuenta para comenzar a pujar
            </p>
          </div>

          <div className="space-y-8">
            {/* Login Form */}
            <form action={loginAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="login-email">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="login-password">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
              <button
                type="submit"
                disabled={isLoginPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center"
              >
                {isLoginPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O crea una cuenta nueva</span>
              </div>
            </div>

            {/* Signup Form */}
            <form action={signupAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="signup-email">
                  Correo electrónico
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="signup-password">
                  Contraseña
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="signup-nombre">
                  Nombre Completo
                </label>
                <input
                  id="signup-nombre"
                  name="nombre_completo"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="signup-telefono">
                  Teléfono (WhatsApp)
                </label>
                <input
                  id="signup-telefono"
                  name="telefono"
                  type="tel"
                  required
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="+54 9 11 1234 5678"
                />
              </div>
              {signupError && <p className="text-red-500 text-sm mt-2">{signupError}</p>}
              
              <div className="flex items-start gap-2 mt-4 mb-2">
                <input 
                  type="checkbox" 
                  id="terminos" 
                  name="terminos" 
                  required 
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="terminos" className="text-xs text-muted-foreground">
                  Al registrarte, aceptas nuestros{" "}
                  <a href="/terminos" target="_blank" className="text-primary hover:underline font-medium">
                    Términos y Condiciones
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSignupPending}
                className="w-full bg-transparent hover:bg-white/5 text-foreground border border-border font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center"
              >
                {isSignupPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Registrarse"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
