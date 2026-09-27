const fs = require('fs');

let content = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

const searchStr = '{isInfoOpen && (\r\n        <div className="w-80 border-l border-pink-100 bg-white flex flex-col flex-shrink-0 z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] overflow-y-auto">';
const replaceStr = `{isInfoOpen && (
        <>
        <div className="md:hidden absolute inset-0 bg-black/20 z-20" onClick={() => setIsInfoOpen(false)}></div>
        <div className="absolute inset-y-0 right-0 w-80 md:relative md:w-80 border-l border-pink-100 bg-white flex flex-col flex-shrink-0 z-30 shadow-2xl md:shadow-[-4px_0_15px_rgba(0,0,0,0.02)] overflow-y-auto transform transition-transform duration-300">
          <button onClick={() => setIsInfoOpen(false)} className="md:hidden absolute top-4 right-4 p-2 bg-pink-50 text-pink-500 rounded-full z-40 hover:bg-pink-100">
            <X size={20} />
          </button>`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    
    // We added <>, so we need to add </> at the end of the isInfoOpen block
    // The end of the component is:
    //       )}
    //     </div>
    //   );
    // }
    content = content.replace(
        '      )}\r\n    </div>',
        '        </>\r\n      )}\r\n    </div>'
    );
    
    fs.writeFileSync('src/components/chat/ChatWidget.tsx', content, 'utf8');
    console.log('ChatWidget updated');
} else {
    console.log('Search string not found in ChatWidget.tsx');
}
