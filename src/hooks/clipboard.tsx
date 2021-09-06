import { decode } from 'fast-png';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { IParsedEvent, parseImageFile } from '../helpers/parseImageFile';

const useClipboard = () => {
  const [events, setEvents] = useState<IParsedEvent[]>([]);
  const [inputImage, setInputImage] = useState<ImageData>();
  useEffect(() => {
    const onPasteCallback = async (ev: ClipboardEvent) => {
      // Reset previous state
      setInputImage(undefined);
      setEvents([]);

      // Find the image from paste
      const files = Array.from(ev.clipboardData?.files ?? []);
      const pngFiles = files.filter((f) => f.type === 'image/png');
      if (files.length > pngFiles.length) toast.warn('Clipboard paste does not contain a .png image');
      if (pngFiles.length <= 0) {
        toast.error('Clipboard paste does not contain a file');
        return;
      }
      if (pngFiles.length > 1) {
        toast('Pasted multiple files, how did you do that? picking only one...');
      }
      const file = pngFiles[0];
      const png = decode(await file.arrayBuffer());
      setInputImage(new ImageData(new Uint8ClampedArray(png.data), png.width, png.height));
      const parsedEvents = await parseImageFile(png);
      setEvents(parsedEvents);
    };
    document.addEventListener('paste', onPasteCallback);
    return () => {
      document.removeEventListener('paste', onPasteCallback);
    };
  }, []);
  return { events, inputImage };
};

export default useClipboard;
