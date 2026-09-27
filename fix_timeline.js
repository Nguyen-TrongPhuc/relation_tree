const fs = require('fs');
let code = fs.readFileSync('src/app/locket/page.tsx', 'utf8');

const search = `            {moments.map((moment) => (
              <div key={moment.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={moment.sender_id === userProfile.id ? userProfile.avatar_url : partnerProfile.avatar_url} 
                      className="w-8 h-8 rounded-full object-cover border border-gray-100" 
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{moment.sender_id === userProfile.id ? 'Bạn' : partnerProfile.display_name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(moment.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowMenuFor(showMenuFor === moment.id ? null : moment.id)}
                      className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-50"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                    {showMenuFor === moment.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={() => handleDownload(moment.image_url)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download size={16} /> Tải xuống
                        </button>
                        {moment.sender_id === userProfile.id && (
                          <button 
                            onClick={() => handleDelete(moment.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash size={16} /> Xóa ảnh
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo */}
                <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden mx-auto max-w-md">
                  <img src={moment.image_url} alt="Locket" className="w-full h-full object-cover" />
                  
                  {moment.content && moment.content !== '📸 Vừa chia sẻ một khoảnh khắc' && (
                    <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
                      <span className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm font-medium inline-block">
                        {moment.content}
                      </span>
                    </div>
                  )}

                  {/* Reactions on Photo */}
                  {moment.reactions && Object.values(moment.reactions).length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {Object.entries(moment.reactions).map(([uid, emoji]: any) => (
                        <div key={uid} className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-lg animate-in zoom-in">
                          {emoji}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50 mt-2">
                  <div className="flex items-center gap-2">
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji}
                        onClick={(e) => handleReact(moment.id, emoji, e)}
                        className="w-10 h-10 rounded-full bg-gray-50 hover:bg-pink-50 flex items-center justify-center text-xl transition-transform active:scale-95 hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setReplyingTo(moment)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-pink-50 flex items-center justify-center text-gray-500 hover:text-pink-600 transition-colors">
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>`;

const replace = `            {moments.map((moment) => (
              <div key={moment.id} className="relative w-full max-w-[400px] mx-auto aspect-[4/5] bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden mb-6 border-4 border-white">
                {/* Photo */}
                <img src={moment.image_url} alt="Locket" className="w-full h-full object-cover absolute inset-0" />
                
                {/* Header overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 shadow-lg">
                  <div className="flex items-center gap-2">
                    <img 
                      src={moment.sender_id === userProfile.id ? userProfile.avatar_url : partnerProfile.avatar_url} 
                      className="w-8 h-8 rounded-full object-cover border border-white/20" 
                    />
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{moment.sender_id === userProfile.id ? 'Bạn' : partnerProfile.display_name}</p>
                      <p className="text-[10px] text-white/70 font-medium leading-tight">{new Date(moment.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowMenuFor(showMenuFor === moment.id ? null : moment.id)}
                      className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                    {showMenuFor === moment.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 py-1 z-30 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={() => handleDownload(moment.image_url)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-black/5 flex items-center gap-2 font-medium"
                        >
                          <Download size={16} /> Tải xuống
                        </button>
                        {moment.sender_id === userProfile.id && (
                          <button 
                            onClick={() => handleDelete(moment.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                          >
                            <Trash size={16} /> Xóa ảnh
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption Overlay */}
                {moment.content && moment.content !== '📸 Vừa chia sẻ một khoảnh khắc' && (
                  <div className="absolute bottom-20 left-0 right-0 px-4 text-center z-10 pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-md text-white px-5 py-2.5 rounded-3xl text-sm font-semibold inline-block shadow-lg border border-white/10">
                      {moment.content}
                    </span>
                  </div>
                )}

                {/* Reactions on Photo */}
                {moment.reactions && Object.values(moment.reactions).length > 0 && (
                  <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
                    {Object.entries(moment.reactions).map(([uid, emoji]) => (
                      <div key={uid} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/30 text-2xl animate-in zoom-in">
                        {emoji}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Bar Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji}
                        onClick={(e) => handleReact(moment.id, emoji, e)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-transform active:scale-95 hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setReplyingTo(moment)} className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 flex items-center justify-center text-white transition-colors shadow-lg shadow-pink-500/30 border border-pink-400">
                    <MessageCircle size={22} />
                  </button>
                </div>
              </div>`;

code = code.replace(search, replace);
fs.writeFileSync('src/app/locket/page.tsx', code);
console.log('Done timeline!');
