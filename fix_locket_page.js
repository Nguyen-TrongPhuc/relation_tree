const fs = require('fs');
let c = fs.readFileSync('src/app/locket/page.tsx', 'utf8');

if (!c.includes('PreviewModal')) {
    // Add import
    c = c.replace(
        "import { ArrowLeft, Clock, Grid, Loader2, Smile, Send, Heart, Download, Trash, MoreHorizontal } from 'lucide-react';",
        "import { ArrowLeft, Clock, Grid, Loader2, Smile, Send, Heart, Download, Trash, MoreHorizontal, Camera } from 'lucide-react';\nimport PreviewModal from '@/components/locket/PreviewModal';"
    );
    
    // Add states
    c = c.replace(
        'const [tab, setTab] = useState<\'timeline\' | \'gallery\'>(initialTab);',
        'const [tab, setTab] = useState<\'timeline\' | \'gallery\'>(initialTab);\n  const [photoFile, setPhotoFile] = useState<File | null>(null);\n  const [isPreviewOpen, setIsPreviewOpen] = useState(false);\n  const fileInputRef = useRef<HTMLInputElement>(null);'
    );
    
    // Add upload handlers
    const fetchMomentsIndex = c.indexOf('const fetchMoments = async');
    c = c.slice(0, fetchMomentsIndex) + `
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setIsPreviewOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMoment = async (imageUrl: string, caption: string) => {
    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: partnerProfile.id,
      content: caption || '📸 Vừa chia sẻ một khoảnh khắc',
      image_url: imageUrl,
      is_moment: true,
      reactions: {}
    });
    setMoments([]); // clear to refetch
    setPage(0);
    setHasMore(true);
    fetchMoments(true);
  };
` + c.slice(fetchMomentsIndex);

    // Replace <main> ending to include input, button, and modal
    c = c.replace(
        '    </main>\n  );\n}',
        `      <input 
        type="file" 
        accept="image/*" 
        capture="user" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-8 right-6 z-40 bg-gradient-to-r from-pink-500 to-pink-600 text-white w-16 h-16 rounded-full shadow-[0_10px_25px_rgba(236,72,153,0.5)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Camera size={28} />
      </button>

      <PreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => {
          setIsPreviewOpen(false);
          setPhotoFile(null);
        }} 
        onSend={handleSendMoment}
        userId={userProfile.id}
        photoFile={photoFile}
      />
    </main>
  );
}`
    );
    
    fs.writeFileSync('src/app/locket/page.tsx', c, 'utf8');
}
