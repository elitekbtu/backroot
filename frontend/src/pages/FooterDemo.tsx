import React from 'react';
import { MinimalFooter } from '@/components/ui/minimal-footer';
import { BackRootFooter } from '@/components/ui/backroot-footer';
import { ArrowDownIcon } from 'lucide-react';

const FooterDemo: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex h-screen flex-col items-center justify-center gap-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Footer Components Demo</h1>
          <p className="text-muted-foreground mb-8">
            Scroll down to see the different footer designs
          </p>
          <div className="flex items-center gap-2 justify-center">
            <p>Scroll down</p>
            <ArrowDownIcon className="size-4" />
          </div>
        </div>
      </div>
      
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-8 text-center">Minimal Footer</h2>
          <MinimalFooter />
        </div>
      </div>
      
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-8 text-center">BackRoot Footer</h2>
          <BackRootFooter />
        </div>
      </div>
    </div>
  );
};

export default FooterDemo;