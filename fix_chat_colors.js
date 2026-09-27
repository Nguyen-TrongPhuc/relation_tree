const fs = require('fs');

let chatCode = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// Insert pairData extraction from AuthContext or props. Wait, ChatWidget receives `currentUserId`, we need pairData.
// Wait, `ChatWidget` doesn't have `pairData`. It's exported and used in `page.tsx`.
// But `ChatWidget` doesn't import `useAuth`. Wait, let's check `ChatWidget.tsx` imports.
const hasUseAuth = chatCode.includes('useAuth');
if (!hasUseAuth) {
  chatCode = chatCode.replace(
    /import Link from 'next\/link';/,
    `import Link from 'next/link';\nimport { useAuth } from '@/components/providers/AuthProvider';`
  );
  // Add hook inside component
  chatCode = chatCode.replace(
    /export default function ChatWidget\(\{ currentUserId, livePartnerProfile \}: ChatWidgetProps\) \{/,
    `export default function ChatWidget({ currentUserId, livePartnerProfile }: ChatWidgetProps) {
  const { pairData } = useAuth();
  const isFemale = pairData?.receiver_id === currentUserId;
  const myBubbleColor = isFemale ? 'bg-pink-500' : 'bg-cyan-500';`
  );
}

// Replace hardcoded pink bubble:
// <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-sm ${isMe ? 'bg-pink-500 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}>
chatCode = chatCode.replace(
  /'bg-pink-500 text-white rounded-br-sm'/g,
  `\`\${myBubbleColor} text-white rounded-br-sm\``
);
// Replace `bg-pink-100/50` for highlight
chatCode = chatCode.replace(
  /'bg-pink-100\/50 p-2 rounded-xl'/g,
  `isFemale ? 'bg-pink-100/50 p-2 rounded-xl' : 'bg-cyan-100/50 p-2 rounded-xl'`
);

fs.writeFileSync('src/components/chat/ChatWidget.tsx', chatCode);
console.log('Updated ChatWidget');
