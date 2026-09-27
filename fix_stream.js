const fs = require('fs');
let code = fs.readFileSync('src/components/locket/LiveCameraModal.tsx', 'utf8');

// 1. Add streamRef
code = code.replace(
  `const [stream, setStream] = useState<MediaStream | null>(null);`,
  `const [stream, setStream] = useState<MediaStream | null>(null);\n  const streamRef = useRef<MediaStream | null>(null);`
);

// 2. Fix startCamera to use and update streamRef
code = code.replace(
  `    if (stream) {\n      stream.getTracks().forEach(track => track.stop());\n    }`,
  `    if (streamRef.current) {\n      streamRef.current.getTracks().forEach(track => track.stop());\n    }`
);

code = code.replace(
  `      setStream(newStream);`,
  `      setStream(newStream);\n      streamRef.current = newStream;`
);

// 3. Fix useEffect to use streamRef for cleanup
code = code.replace(
  `  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);`,
  `  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setStream(null);
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);`
);

// 4. Update toggleFlash to show a better alert about iOS limitation
code = code.replace(
  `alert("Trình duyệt/thiết bị của bạn không hỗ trợ bật Flash!");`,
  `alert("Trình duyệt web trên điện thoại của bạn (đặc biệt là iOS Safari) không hỗ trợ bật đèn Flash thông qua Web. Đây là giới hạn bảo mật của trình duyệt, không phải lỗi của ứng dụng!");`
);

fs.writeFileSync('src/components/locket/LiveCameraModal.tsx', code);
console.log('Fixed stream tracking');
