import codecs
import sys

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if content.startswith('\ufeff'):
        content = content[1:]

    try:
        fixed_content = content.encode('latin-1').decode('utf-8')
        
        if 'Người' in fixed_content or 'đang' in fixed_content or 'Xóa' in fixed_content or 'Bảng' in fixed_content or 'Bạn' in fixed_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"Fixed mojibake in {filepath}")
        else:
            print(f"No obvious mojibake fix applied to {filepath}")
    except Exception as e:
        print(f"Could not automatically decode {filepath}: {e}")

fix_file('src/components/chat/ChatWidget.tsx')
