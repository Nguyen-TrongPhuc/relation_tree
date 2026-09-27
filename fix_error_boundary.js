const fs = require('fs');

function wrapWithErrorBoundary(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (!code.includes('ErrorBoundary')) {
    code = code.replace(
      /import \{ useAuth \} from '@\/components\/providers\/AuthProvider';/,
      `import { useAuth } from '@/components/providers/AuthProvider';\nimport { ErrorBoundary } from '@/components/ErrorBoundary';`
    );
    
    // For map page
    if (code.includes('<LocationMap />')) {
      code = code.replace(/return <LocationMap \/>;/, 'return <ErrorBoundary><LocationMap /></ErrorBoundary>;');
    }
    
    // For tree page
    if (code.includes('<InteractiveTreeWorld')) {
      code = code.replace(/<InteractiveTreeWorld/g, '<ErrorBoundary><InteractiveTreeWorld');
      code = code.replace(/<\/main>/g, '</ErrorBoundary></main>');
    }
    
    fs.writeFileSync(filePath, code);
    console.log('Wrapped ' + filePath);
  }
}

wrapWithErrorBoundary('src/app/tree/page.tsx');
wrapWithErrorBoundary('src/app/map/page.tsx');
