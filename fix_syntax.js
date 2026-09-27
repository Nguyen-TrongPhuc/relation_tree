const fs = require('fs');

function fixSyntax(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  
  // Remove messed up lines
  c = c.replace(/import FloatingReactions, { FloatingReactionsRef } from '@\/components\/locket\/FloatingReactions'; from '@\/lib\/supabase\/client';\r?\n/, '');
  c = c.replace(/import FloatingReactions, { FloatingReactionsRef } from '@\/components\/locket\/FloatingReactions'; '@\/lib\/supabase\/client';\r?\n/, '');
  c = c.replace(/import FloatingReactions, { FloatingReactionsRef } from '@\/components\/locket\/FloatingReactions';\s*from '@\/lib\/supabase\/client';\r?\n/, '');
  
  // Actually, let's just use regex to clean the import section
  // Replace anything weird near supabase client
  c = c.replace(/import { createClient } from '@\/lib\/supabase\/client';[\s\S]*?(?=import Link)/, "import { createClient } from '@/lib/supabase/client';\nimport FloatingReactions, { FloatingReactionsRef } from '@/components/locket/FloatingReactions';\n");
  
  // Wait, let's just replace all instances of "FloatingReactions'; from"
  c = c.replace(/FloatingReactions'; from '@\/lib\/supabase\/client';/g, "FloatingReactions';");
  c = c.replace(/FloatingReactions'; '@\/lib\/supabase\/client';/g, "FloatingReactions';");
  
  fs.writeFileSync(filePath, c, 'utf8');
  console.log('Fixed', filePath);
}

fixSyntax('src/app/locket/page.tsx');
fixSyntax('src/components/home/LocketWidget.tsx');
