const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// Find the export line
const exportLineRegex = /export default function ChatWidget\([^)]+\) \{/;

code = code.replace(exportLineRegex, (match) => {
  return `${match}
  const { pairData, user: authUser } = useAuth();
  let isFemale = pairData?.receiver_id === authUser?.id;
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('my_gender');
    if (override === 'female') isFemale = true;
    if (override === 'male') isFemale = false;
  }
  const myBubbleColor = isFemale ? 'bg-pink-500' : 'bg-cyan-500';
`;
});

// Fix currentUserId reference. Wait, ChatWidget uses `currentUserId` as a state variable!
// `const [currentUserId, setCurrentUserId] = useState<string | null>(null);`
// So we must use `authUser?.id` or `currentUserId` for the isFemale check. Using `currentUserId` is fine.
// Wait, `ChatWidget` doesn't define `currentUserId` in props, it has it in state!
// Let's replace `currentUserId` with `currentUserId` in the `isFemale` check since it's available in the closure? No, `currentUserId` state is defined *after* the export line!
// So let's insert it AFTER the state declarations!

// Instead, I'll just write a script that injects it before the `return` or right after the states.
fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Fixed ChatWidget');
