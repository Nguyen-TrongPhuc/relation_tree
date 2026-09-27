import codecs

with open('src/components/chat/ChatWidget.tsx', 'rb') as f:
    raw = f.read()

try:
    decoded = raw.decode('utf-8')
    print("Valid UTF-8")
    
    # Check if there are Mojibake sequences (e.g. Ă³, áº¥)
    if 'Ă³' in decoded or 'áº¥' in decoded or 'Ã' in decoded:
        print("Contains Mojibake (UTF-8 decoded as Latin-1 and saved as UTF-8)")
        
except UnicodeDecodeError:
    print("Not valid UTF-8")
