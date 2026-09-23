import sys
with open('src/components/chat/ChatWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("?'B?n' : (livePartnerProfile?.display_name || 'Ng?i ?y')", "?'Bạn' : (livePartnerProfile?.display_name || 'Người ấy')")
content = content.replace("'B?n' : 'Ng?i ?y'", "'Bạn' : 'Người ấy'")
content = content.replace("'B? ghim' : 'Ghim'", "'Bỏ ghim' : 'Ghim'")
content = content.replace("ang tr? l?i", "Đang trả lời")
content = content.replace("'chnh b?n' : (livePartnerProfile?.display_name || 'ng?i ?y')", "'chính bạn' : (livePartnerProfile?.display_name || 'người ấy')")
content = content.replace("Tr? l?i", "Trả lời")
content = content.replace("H?nh ?nh", "Hình ảnh")

with open('src/components/chat/ChatWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
