const fs = require('fs');

// Fix Login
let loginCode = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
if (!loginCode.includes('useAuth')) {
    loginCode = loginCode.replace(
        "import { Loader2 } from 'lucide-react';",
        "import { Loader2 } from 'lucide-react';\nimport { useAuth } from '@/components/providers/AuthProvider';"
    );
    loginCode = loginCode.replace(
        "const router = useRouter();",
        "const router = useRouter();\n  const { user } = useAuth();\n\n  require('react').useEffect(() => {\n    if (user) {\n      router.push('/');\n    }\n  }, [user, router]);"
    );
}
loginCode = loginCode.replace(
    "window.location.href = '/';",
    "// Redirect handled by useEffect"
);
fs.writeFileSync('src/app/(auth)/login/page.tsx', loginCode, 'utf8');

// Fix Register
let regCode = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');
if (!regCode.includes('useAuth')) {
    regCode = regCode.replace(
        "import { Loader2 } from 'lucide-react';",
        "import { Loader2 } from 'lucide-react';\nimport { useAuth } from '@/components/providers/AuthProvider';"
    );
    regCode = regCode.replace(
        "const router = useRouter();",
        "const router = useRouter();\n  const { user } = useAuth();\n\n  require('react').useEffect(() => {\n    if (user) {\n      router.push('/setup');\n    }\n  }, [user, router]);"
    );
}
regCode = regCode.replace(
    "window.location.href = '/setup';",
    "// Redirect handled by useEffect"
);
fs.writeFileSync('src/app/(auth)/register/page.tsx', regCode, 'utf8');
