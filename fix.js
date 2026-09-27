const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
    "} catch (error) {",
    "}\n    } catch (error) {"
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code, 'utf8');
