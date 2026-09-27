import sys
import codecs

with open('src/components/chat/ChatWidget.tsx', 'rb') as f:
    raw = f.read()

try:
    content = raw.decode('utf-8')
except Exception as e:
    content = raw.decode('latin-1')

# The text was double-encoded: UTF-8 bytes were read as Latin-1 and saved as UTF-8.
# To reverse this, we encode it to Latin-1 to get the original UTF-8 bytes, then decode as UTF-8.

def fix_recursive(text, depth=0):
    if depth > 5: return text
    try:
        # Check if it contains common mojibake characters
        if 'Æ' in text or 'á' in text or 'Ă' in text or '»' in text or '£' in text or '¿' in text or '' in text:
            # First try latin-1 encode -> utf-8 decode
            try:
                new_text = text.encode('latin-1').decode('utf-8')
                return fix_recursive(new_text, depth + 1)
            except UnicodeError:
                # If there's an exact replacement character \ufffd, it means information was lost.
                pass
    except Exception as e:
        pass
    return text

fixed = fix_recursive(content)

# Manual overrides for \ufffd if it was saved with replacement chars
fixed = fixed.replace('Ng?i', 'Người')
fixed = fixed.replace('ang', 'Đang')
fixed = fixed.replace('đang', 'đang')
fixed = fixed.replace('g?i', 'gọi')
fixed = fixed.replace('ty', 'tùy')
fixed = fixed.replace('bn', 'bạn')
fixed = fixed.replace('c', 'có')
fixed = fixed.replace('?', 'đã')
fixed = fixed.replace('', 'Đ')
fixed = fixed.replace('Ty', 'Tùy')
fixed = fixed.replace('o?n', 'đoạn')

# If there are still '?' left from \ufffd, it's hard to guess, but we can do our best or just copy from a good version.

with open('src/components/chat/ChatWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed)
