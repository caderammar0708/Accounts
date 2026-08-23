import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-white">
            {/* Branding Panel - Left Side (Visible from lg up) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                {/* Modern Mesh Gradient Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-green-600/20 blur-[120px]" />
                    <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-green-400/10 blur-[100px]" />
                </div>
                
                {/* Branding Content */}
                <div className="relative z-10 text-center px-12">
                    <div className="mb-8 inline-block p-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                        <ApplicationLogo className="h-24 w-auto drop-shadow-2xl" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
                        {usePage().props.appName}
                    </h2>
                    <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
                        The complete ecosystem for modern business management and financial growth.
                    </p>
                </div>

                {/* Subtle Decorative Bottom Badge */}
                <div className="absolute bottom-10 left-12 right-12 z-10 flex items-center justify-between opacity-40">
                    <span className="text-white text-xs font-semibold tracking-widest uppercase italic">Secure • Scalable • Smart</span>
                    <span className="text-white text-xs">v1.2.0</span>
                </div>
            </div>

            {/* Interaction Panel - Right Side */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-slate-50/30">
                {/* Mobile Logo (Visible only on small screens) */}
                <div className="lg:hidden mb-8">
                    <Link href="/">
                        <ApplicationLogo className="h-16 w-auto" />
                    </Link>
                </div>

                <div className="w-full max-w-[440px]">
                    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100">
                        {children}
                    </div>
                    
                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-xs tracking-wide">
                            © {new Date().getFullYear()} {usePage().props.appName}. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
