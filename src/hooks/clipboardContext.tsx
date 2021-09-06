import { decode } from 'fast-png';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { IParsedEvent, parseImageFile } from '../helpers/parseImageFile';

interface IClipboardState {
  inputImage: ImageData | undefined;
  isProcessing: boolean;
  parsedEvents: IParsedEvent[];
}

const initialState: IClipboardState = {
  inputImage: undefined,
  isProcessing: false,
  parsedEvents: [],
};

const ClipboardContext = createContext<IClipboardState>(initialState);

export const useClipboard = () => {
  const state = useContext(ClipboardContext);
  return state;
};

export const ClipboardProvider: React.FC = (props) => {
  const { children } = props;
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputImage, setTnputImage] = useState<ImageData>();
  const [parsedEvents, setParsedEvents] = useState<IParsedEvent[]>([]);

  useEffect(() => {
    const onPasteCallback = async (ev: ClipboardEvent) => {
      // Reset previous state
      setIsProcessing(true);
      setTnputImage(undefined);
      setParsedEvents([]);

      // Find the image from paste
      const files = Array.from(ev.clipboardData?.files ?? []);
      const pngFiles = files.filter((f) => f.type === 'image/png');
      if (files.length > pngFiles.length) toast.warn('Clipboard paste does not contain a .png image');
      if (pngFiles.length <= 0) {
        toast.error('Clipboard paste does not contain a file');
        setIsProcessing(false);
        return;
      }
      if (pngFiles.length > 1) {
        toast('Pasted multiple files, how did you do that? picking only one...');
      }
      const file = pngFiles[0];
      const png = decode(await file.arrayBuffer());
      setTnputImage(new ImageData(new Uint8ClampedArray(png.data), png.width, png.height));
      const events = await parseImageFile(png);

      setParsedEvents(events);
      setIsProcessing(false);
    };
    document.addEventListener('paste', onPasteCallback);
    return () => {
      document.removeEventListener('paste', onPasteCallback);
    };
  }, []);

  return <ClipboardContext.Provider value={{ isProcessing, inputImage, parsedEvents }}>{children}</ClipboardContext.Provider>;
};
