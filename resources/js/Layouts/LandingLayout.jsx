import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function LandingLayout({ children }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-primary-500 selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="flex items-center gap-3 group">
                                <ApplicationLogo className="h-10 w-auto group-hover:scale-105 transition-transform duration-300" />
                                <div className="flex flex-col">
                                    <span className="text-slate-900 text-xl font-black tracking-tight leading-none">{usePage().props.appName}</span>
                                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-0.5">{usePage().props.appName}</span>
                                </div>
                            </Link>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href={route('welcome') + '#features'} className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">Features</a>
                            <a href={route('welcome') + '#solutions'} className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">Solutions</a>
                            <a href={route('welcome') + '#about'} className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">About</a>
                        </div>

                        <div className="flex items-center gap-4">
                            {auth.user && (
                                <Link
                                    href={route('dashboard')}
                                    className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mr-2"
                                >
                                    Dashboard
                                </Link>
                            )}
                            <Link
                                href={route('login')}
                                className="text-sm font-bold text-slate-700 hover:text-primary transition-colors"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-600 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
                        <div className="col-span-1 md:col-span-1">
                            <Link href="/" className="flex items-center gap-3 mb-6">
                                <ApplicationLogo className="h-8 w-auto" />
                                <span className="text-white text-xl font-black tracking-tight leading-none">{usePage().props.appName}</span>
                            </Link>
                            <p className="text-sm leading-relaxed">
                                Empowering businesses with smart financial management and operational growth tools. Built for modern enterprises.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">Product</h4>
                            <ul className="space-y-4 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Accounting</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Inventory</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">CRM</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">Company</h4>
                            <ul className="space-y-4 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">Newsletter</h4>
                            <p className="text-sm mb-4">Stay updated with our latest insights.</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary-500"
                                />
                                <button className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7M5 19l7-7-7-7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest">
                        <p>© {new Date().getFullYear()} {usePage().props.appName}. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
