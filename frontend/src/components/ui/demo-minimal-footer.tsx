import React from 'react';
import { MinimalFooter } from "@/components/ui/minimal-footer";
import { ArrowDownIcon } from 'lucide-react';

export default function DemoMinimalFooter() {
  
	React.useEffect(() => {
		// Optional: Add smooth scrolling if needed
		// const lenis = new Lenis();
		// function raf(time: number) {
		// 	lenis.raf(time);
		// 	requestAnimationFrame(raf);
		// }
		// requestAnimationFrame(raf);
	}, []);

  return (
    <div className="min-h-screen w-full">
      <div className="flex h-screen flex-col items-center justify-center gap-10">
        <div className="flex items-center gap-2">
          <p>Scroll down</p>
          <ArrowDownIcon className="size-4" />
        </div>
      </div>
      <MinimalFooter />
    </div>
  );
}