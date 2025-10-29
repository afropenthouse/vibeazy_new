import Image from "next/image";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Logo + slogan: center on mobile, left on desktop */}
        <div className="flex items-center gap-4 justify-center md:justify-start">
          <Image src="/vibeazy.png" alt="VibeEazy" width={94} height={64} className="rounded" />
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">Enjoy More, Spend Less!</p>
          </div>
        </div>
        {/* Copyright: center on mobile and desktop */}
        <div className="text-sm text-muted-foreground text-center">
          <p>&copy; {new Date().getFullYear()} Vibeazy. All rights reserved.</p>
        </div>
        {/* Nav: center on mobile, right on desktop - show support email with icon and phone */}
        <nav className="flex gap-6 text-sm justify-center md:justify-end">
          <div className="flex flex-col items-center md:items-end gap-1">
            <a href="mailto:support@vibeazy.com" className="flex items-center gap-2 hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5v7A2.5 2.5 0 0 0 5.5 18h13a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 18.5 6h-13A2.5 2.5 0 0 0 3 8.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.5l-9 6-9-6" />
              </svg>
              <span>support@vibeazy.com</span>
            </a>
            <a href="tel:+2348056679806" className="text-sm text-foreground/80 hover:text-primary transition-colors" aria-label="Call support">+234 805 667 9806</a>
          </div>
        </nav>
      </div>
    </footer>
  );
}