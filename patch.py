import sys
import re

with open('src/components/chat/ChatWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Paperclip, Loader2 }', 'import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Paperclip, Loader2, Check, CheckCheck }')

old_status = re.search(r'function MessageStatus.*?return \(\s*<div.*?</div>\s*\);\s*\}', content, re.DOTALL)
if old_status:
    new_status = """function MessageStatus({ msg, isPartnerOnline, partnerLastActive }: { msg: any, isPartnerOnline: boolean, partnerLastActive: string | undefined }) {
  const [timePassed, setTimePassed] = React.useState(false);

  React.useEffect(() => {
    if (msg.id > 0) {
      const sentTime = new Date(msg.created_at).getTime();
      const diff = Date.now() - sentTime;
      if (diff >= 2000) {
        setTimePassed(true);
      } else {
        const timer = setTimeout(() => setTimePassed(true), 2000 - diff);
        return () => clearTimeout(timer);
      }
    }
  }, [msg.id, msg.created_at]);

  let statusText = '';
  let Icon = null;
  let iconClass = '';

  if (msg.id < 0) {
    statusText = 'Đang gửi...';
    Icon = Loader2;
    iconClass = 'animate-spin';
  } else if (!timePassed) {
    statusText = 'Đã gửi';
    Icon = Check;
  } else if (isPartnerOnline || (partnerLastActive && new Date(partnerLastActive) > new Date(msg.created_at))) {
    statusText = 'Đã xem';
    Icon = CheckCheck;
    iconClass = 'text-pink-500';
  } else {
    statusText = 'Đã nhận';
    Icon = CheckCheck;
    iconClass = 'text-gray-400';
  }

  return (
    <div className="text-[10px] font-medium text-gray-400 mt-1 flex items-center gap-1 justify-end">
      <span>{statusText}</span>
      {Icon && <Icon size={12} className={iconClass} />}
    </div>
  );
}"""
    content = content.replace(old_status.group(0), new_status)

old_me = "bg-pink-600 text-white rounded-tr-sm rounded-l-2xl rounded-br-2xl"
new_me = "bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-[20px] rounded-br-[4px] shadow-md shadow-pink-500/20"
content = content.replace(old_me, new_me)

old_them = "bg-teal-50 text-teal-900 border border-teal-100 rounded-tl-sm rounded-r-2xl rounded-bl-2xl"
new_them = "bg-white text-gray-800 border border-gray-100 rounded-[20px] rounded-bl-[4px] shadow-sm"
content = content.replace(old_them, new_them)

old_bg = "`flex-1 overflow-y-auto p-4 space-y-4 relative ${!chatBackgroundUrl && 'bg-pink-50/30'}`"
new_bg = "`flex-1 overflow-y-auto p-4 space-y-4 relative ${!chatBackgroundUrl ? 'bg-[#f8f9fa] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]' : ''}`"
content = content.replace(old_bg, new_bg)

with open('src/components/chat/ChatWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
