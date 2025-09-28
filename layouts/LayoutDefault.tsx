import "./style.css";
import "./tailwind.css";
import "@progress/kendo-theme-default/dist/all.css";

import { QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider, queryClient } from '../lib/trpc';

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <div>
          <Content>{children}</Content>
        </div>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container" className="min-h-screen w-full overflow-x-hidden">
      <div className="w-full max-w-full">
        {children}
      </div>
    </div>
  );
}