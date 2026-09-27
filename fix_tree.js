const fs = require('fs');

let content = fs.readFileSync('src/components/world/InteractiveTreeWorld.tsx', 'utf8');

if (!content.includes('isTimePanelOpen')) {
    // Add state
    content = content.replace(
        'export default function InteractiveTreeWorld({ rawDailyData, events, startDate }: InteractiveTreeWorldProps) {',
        'export default function InteractiveTreeWorld({ rawDailyData, events, startDate }: InteractiveTreeWorldProps) {\n  const [isTimePanelOpen, setIsTimePanelOpen] = useState(false);'
    );
    
    // Add imports if necessary
    if (!content.includes('useState')) {
        content = content.replace('import React', 'import React, { useState }');
    }

    // Wrap the aside and add a toggle button
    const panelStart = content.indexOf('{/* Tree Control Panel */}');
    const panelEndStr = '      </div>\r\n    </div>\r\n  );\r\n}';
    
    const beforePanel = content.substring(0, panelStart);
    // Be careful with replacing, I will just do a string replace on the aside className
    content = content.replace(
        'className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 md:top-1/2 z-40 w-[90%] max-w-[320px] md:w-60 md:-translate-y-1/2 rounded-2xl border border-white/50 bg-white/50 md:bg-white/35 p-4 shadow-lg backdrop-blur-md transition-opacity duration-300 opacity-100"',
        'className={`absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 md:top-1/2 z-40 w-[90%] max-w-[320px] md:w-60 md:-translate-y-1/2 rounded-2xl border border-white/50 bg-white/50 md:bg-white/35 p-4 shadow-lg backdrop-blur-md transition-all duration-300 ${isTimePanelOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto"}`}'
    );
    
    // Add toggle button right above the aside
    content = content.replace(
        '{/* Tree Control Panel */}',
        `{/* Mobile Time Panel Toggle Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsTimePanelOpen(!isTimePanelOpen); }}
          className="md:hidden absolute bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-pink-700 shadow-lg backdrop-blur-md transition-transform active:scale-95 border border-pink-200"
        >
          <Calendar size={24} />
        </button>
        {/* Tree Control Panel */}`
    );
    
    // Ensure Calendar is imported
    if (!content.includes('Calendar')) {
        content = content.replace('import { Play, Pause, ChevronLeft, ChevronRight, X, Reply } from', 'import { Play, Pause, ChevronLeft, ChevronRight, X, Reply, Calendar } from');
    }
    
    fs.writeFileSync('src/components/world/InteractiveTreeWorld.tsx', content, 'utf8');
}
