const fs = require('fs');

function hookReactions(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (!c.includes('FloatingReactions')) {
    // Import
    c = c.replace(
      "import { createClient } from",
      "import { createClient } from '@/lib/supabase/client';\nimport FloatingReactions, { FloatingReactionsRef } from '@/components/locket/FloatingReactions';"
    );
    if (!c.includes('FloatingReactions from')) {
        c = c.replace(
          "import { createClient }",
          "import { createClient } from '@/lib/supabase/client';\nimport FloatingReactions, { FloatingReactionsRef } from '@/components/locket/FloatingReactions';"
        );
    }
    
    // Add Ref
    c = c.replace(
      "const supabase = createClient();",
      "const supabase = createClient();\n  const reactionsRef = useRef<FloatingReactionsRef>(null);"
    );
    // for page.tsx it might not have "const supabase = createClient();" inside the component.
    if (!c.includes('reactionsRef = useRef')) {
        c = c.replace(
            "const [loading, setLoading] = useState(true);",
            "const [loading, setLoading] = useState(true);\n  const reactionsRef = useRef<FloatingReactionsRef>(null);"
        );
    }
    
    // Pass event to handleReact
    if (filePath.includes('LocketWidget')) {
        c = c.replace(
            "onClick={() => handleReact(emoji)}",
            "onClick={(e) => handleReact(emoji, e)}"
        );
        c = c.replace(
            "const handleReact = async (emoji: string) => {",
            "const handleReact = async (emoji: string, e?: React.MouseEvent) => {\n    if (e && reactionsRef.current) {\n      reactionsRef.current.triggerReaction(emoji, e.clientX, e.clientY);\n    }"
        );
    } else {
        c = c.replace(
            "onClick={() => handleReact(moment.id, emoji)}",
            "onClick={(e) => handleReact(moment.id, emoji, e)}"
        );
        c = c.replace(
            "const handleReact = async (momentId: string, emoji: string) => {",
            "const handleReact = async (momentId: string, emoji: string, e?: React.MouseEvent) => {\n    if (e && reactionsRef.current) {\n      reactionsRef.current.triggerReaction(emoji, e.clientX, e.clientY);\n    }"
        );
    }
    
    // Add component to render
    c = c.replace(
      "</main>",
      "  <FloatingReactions ref={reactionsRef} />\n    </main>"
    );
    c = c.replace(
      "    </div>\n  );\n}",
      "      <FloatingReactions ref={reactionsRef} />\n    </div>\n  );\n}"
    );
    
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Hooked', filePath);
  }
}

hookReactions('src/app/locket/page.tsx');
hookReactions('src/components/home/LocketWidget.tsx');
