import { encode, IDecodedPNG } from 'fast-png';
import { toast } from 'react-toastify';
import Tesseract from 'tesseract.js';

interface IColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface IBoundingBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface IParsedEvent {
  title: string;
  description: string;
  googleCreateEventUrl: string;
  startDate: Date;
  endDate: Date;
}

const findWorkEventBlueColor: IColor = { r: 0, g: 51, b: 187, a: 255 };

function getColorAt(imageData: IDecodedPNG, x: number, y: number) {
  const dataIdx = x + y * imageData.width;
  const r = imageData.data[dataIdx * 4];
  const g = imageData.data[dataIdx * 4 + 1];
  const b = imageData.data[dataIdx * 4 + 2];
  const a = imageData.data[dataIdx * 4 + 3];
  return { r, g, b, a };
}

function areColorsEqual(c1: IColor, c2: IColor) {
  const threshold = 1;
  return Math.abs(c1.r - c2.r) < threshold && Math.abs(c1.g - c2.g) < threshold && Math.abs(c1.b - c2.b) < threshold && Math.abs(c1.a - c2.a) < threshold;
}

function findBoundingBoxForSameColor(imageData: IDecodedPNG, x: number, y: number) {
  const originalColor = getColorAt(imageData, x, y);
  let y0 = y - 1;
  while (y0 >= 0 && areColorsEqual(originalColor, getColorAt(imageData, x, y0))) {
    y0 -= 1;
  }
  y0 += 1;

  let y1 = y + 1;
  while (y1 < imageData.height && areColorsEqual(originalColor, getColorAt(imageData, x, y1))) {
    y1 += 1;
  }
  y1 -= 1;

  let x0 = x - 1;
  while (x0 >= 0 && areColorsEqual(originalColor, getColorAt(imageData, x0, y))) {
    x0 -= 1;
  }
  x0 += 1;

  let x1 = x + 1;
  while (x1 < imageData.width && areColorsEqual(originalColor, getColorAt(imageData, x1, y))) {
    x1 += 1;
  }
  x1 -= 1;
  return { x0, x1, y0, y1 };
}

function updateBoundingBoxes(imageData: IDecodedPNG, x: number, y: number, boundingBoxes: IBoundingBox[]) {
  let found = null;
  boundingBoxes.forEach((bb) => {
    if (x >= bb.x0 && x <= bb.x1 && y >= bb.y0 && y <= bb.y1) {
      found = bb;
    }
  });
  if (found) return found;
  const bb = findBoundingBoxForSameColor(imageData, x, y);
  // console.log("new bounding box push to color", originalColor, bb);
  boundingBoxes.push(bb);
  return undefined;
}

function findPixelOfColorBoundingBoxes(findRgb: IColor, imageData: IDecodedPNG) {
  const boundingBoxes: IBoundingBox[] = [];
  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const color = getColorAt(imageData, x, y);
      if (areColorsEqual(findRgb, color)) {
        // console.log("blue", x, y, { r, g, b, a });
        updateBoundingBoxes(imageData, x, y, boundingBoxes);
      }
    }
  }
  return boundingBoxes;
}

function getHourCellWidthAndBorderColor(imageData: IDecodedPNG, knownCellPosX: number, knownCellPosY: number) {
  // we're at beginning just above work time cell
  const cellEmptySpaceColor = getColorAt(imageData, knownCellPosX, knownCellPosY);
  let x0 = knownCellPosX - 1;
  while (areColorsEqual(cellEmptySpaceColor, getColorAt(imageData, x0, knownCellPosY))) x0 -= 1;

  const borderColor = getColorAt(imageData, x0, knownCellPosY);
  let x1 = knownCellPosX + 1;
  while (areColorsEqual(cellEmptySpaceColor, getColorAt(imageData, x1, knownCellPosY))) x1 += 1;
  return { width: x1 - x0, borderColor };
}

function findCellBoundingBox(imageData: IDecodedPNG, cellBorderColor: IColor, randomPixelX: number, randomPixelY: number) {
  let y0 = randomPixelY;
  while (y0 >= 0 && !areColorsEqual(cellBorderColor, getColorAt(imageData, randomPixelX, y0))) y0 -= 1;
  y0 += 1;
  let x0 = randomPixelX;
  while (x0 >= 0 && !areColorsEqual(cellBorderColor, getColorAt(imageData, x0, y0))) x0 -= 1;
  x0 += 1;
  let y1 = randomPixelY;
  while (y1 < imageData.height && !areColorsEqual(cellBorderColor, getColorAt(imageData, randomPixelX, y1))) y1 += 1;
  y1 -= 1;
  let x1 = randomPixelX;
  while (x1 < imageData.width && !areColorsEqual(cellBorderColor, getColorAt(imageData, x1, y1))) x1 += 1;
  x1 -= 1;
  return { x0, x1, y0, y1 };
}

function findFirstDateCellBoundingBox(imageData: IDecodedPNG, cellBorderColor: IColor, randomPixelX: number, knownCellWhiteSpaceY: number) {
  // Basically find double line vertical and horizontal
  let zeroBorderX = randomPixelX;
  let lastLineMatch = false;
  while (zeroBorderX > 0) {
    zeroBorderX -= 1;
    const cellColor = getColorAt(imageData, zeroBorderX, knownCellWhiteSpaceY);
    if (areColorsEqual(cellBorderColor, cellColor)) {
      if (lastLineMatch) {
        zeroBorderX -= 1;
        break;
      }
      lastLineMatch = true;
    } else {
      lastLineMatch = false;
    }
  }
  let zeroBorderY = knownCellWhiteSpaceY;
  lastLineMatch = false;
  while (zeroBorderY > 0) {
    zeroBorderY -= 1;
    const cellColor = getColorAt(imageData, zeroBorderX, zeroBorderY);
    if (areColorsEqual(cellBorderColor, cellColor)) {
      if (lastLineMatch) {
        zeroBorderY += 3;
        break;
      }
      lastLineMatch = true;
    } else {
      lastLineMatch = false;
    }
  }

  return findCellBoundingBox(imageData, cellBorderColor, zeroBorderX, zeroBorderY);
}

async function ocrImage(imageData: ImageData) {
  const encodedFileData = encode(imageData);
  const data = await Tesseract.recognize(new File([encodedFileData], 'image.png'), 'eng');
  const parsedText = data.data.lines[0].text.replace(/\n$/g, '');
  return parsedText;
}

export async function parseImageFile(imageData: IDecodedPNG): Promise<IParsedEvent[]> {
  toast('finding events...');
  const boundingBoxes = findPixelOfColorBoundingBoxes(findWorkEventBlueColor, imageData);
  const bigBoundingBoxes = boundingBoxes.reduce<IBoundingBox[]>((accumulator, value) => {
    const existingBb = accumulator.find((x) => x.y0 === value.y0);
    if (existingBb) {
      existingBb.x0 = Math.min(existingBb.x0, value.x0);
      existingBb.x1 = Math.max(existingBb.x1, value.x1);
      // existingBb.y0 = Math.min(existingBb.y0, value.y0)
      existingBb.y1 = Math.max(existingBb.y1, value.y1);
    } else {
      accumulator.push(value);
    }
    return accumulator;
  }, []);
  toast(`found ${bigBoundingBoxes.length} events`);
  const knownCellWhiteSpaceX = bigBoundingBoxes[0].x0 - 1;
  let knownCellWhiteSpaceY = bigBoundingBoxes[0].y0;
  const knownCellBorderColor = getColorAt(imageData, knownCellWhiteSpaceX, knownCellWhiteSpaceY);
  knownCellWhiteSpaceY += 1;
  while (areColorsEqual(knownCellBorderColor, getColorAt(imageData, knownCellWhiteSpaceX, knownCellWhiteSpaceY))) knownCellWhiteSpaceY += 1;

  const hourCellWidthAndBorderColor = getHourCellWidthAndBorderColor(imageData, knownCellWhiteSpaceX, knownCellWhiteSpaceY);
  const hourCellWidth = hourCellWidthAndBorderColor.width;
  const cellBorderColor = hourCellWidthAndBorderColor.borderColor;

  const firstDateCell = findFirstDateCellBoundingBox(imageData, cellBorderColor, knownCellWhiteSpaceX, knownCellWhiteSpaceY);

  const firstCellPng = new ImageData(firstDateCell.x1 - firstDateCell.x0, firstDateCell.y1 - firstDateCell.y0);

  for (let firstCellPngY = 0; firstCellPngY < firstCellPng.height; firstCellPngY += 1) {
    for (let firstCellPngX = 0; firstCellPngX < firstCellPng.width; firstCellPngX += 1) {
      const idx = (firstCellPng.width * firstCellPngY + firstCellPngX) * 4;
      const origOffset = (firstDateCell.x0 + firstCellPngX + (firstDateCell.y0 + firstCellPngY) * imageData.width) * 4;
      firstCellPng.data[idx] = imageData.data[origOffset];
      firstCellPng.data[idx + 1] = imageData.data[origOffset + 1];
      firstCellPng.data[idx + 2] = imageData.data[origOffset + 2];
      firstCellPng.data[idx + 3] = imageData.data[origOffset + 3];
    }
  }
  toast(`Figuring out the dates...`);
  const parsedDateText = await ocrImage(firstCellPng);
  toast(`Found first date "${parsedDateText}"`);
  const firstCellDate = new Date(parsedDateText);

  const dateCellHeight = firstDateCell.y1 - firstDateCell.y0 + 1;

  const workTimeParsedData = bigBoundingBoxes.map((bb) => {
    const daysOffsetFromFirst = Math.floor((bb.y0 - firstDateCell.y0) / dateCellHeight);
    const startsAtTime = (bb.x0 - firstDateCell.x1 - 3) / hourCellWidth;
    const endsAtTime = (bb.x1 - firstDateCell.x1 - 1) / hourCellWidth;
    return {
      startsAtTime,
      endsAtTime,
      daysOffsetFromFirst,
    };
  });

  const resultStartTimes = workTimeParsedData.map((work) => {
    const workStartTime = new Date(firstCellDate);
    workStartTime.setDate(workStartTime.getDate() + work.daysOffsetFromFirst);
    workStartTime.setHours(Math.floor(work.startsAtTime));
    workStartTime.setMinutes(60 * (work.startsAtTime % 1));
    const workEndTime = new Date(workStartTime);
    workEndTime.setHours(Math.floor(work.endsAtTime));
    workEndTime.setMinutes(60 * (work.endsAtTime % 1));
    return {
      workStartTime,
      workEndTime,
      // TODO end time? or just assume 8.5 hours?
    };
  });
  toast(`generating google calendar urls`);
  const finalEvents = resultStartTimes.map((workEvent) => {
    const title = 'Work';
    const description = 'Automatically parsed from picture, hopefully dates are correct...';
    const startDate = workEvent.workStartTime;
    const endDate = workEvent.workEndTime;
    const googleCreateEventUrl = generateGoogleCalUrl(workEvent.workStartTime, workEvent.workEndTime, title, description);
    return {
      title,
      description,
      googleCreateEventUrl,
      startDate,
      endDate,
    };
  });

  // googleEventUrls.forEach((e) => open(e));
  // toast(JSON.stringify(finalEvents));
  toast(`Done parsing`);
  return finalEvents;

  // TODO
  // generate calendar event ready to import file?

  // import directy to google account

  // make this work as a website?
}

function datesToUrlParam(startDate: Date, endDate: Date) {
  function dateToString(date: Date) {
    return date.toISOString().replace(/-|:|\./g, '');
  }
  return `${dateToString(startDate)}/${dateToString(endDate)}`;
}

export function generateGoogleCalUrl(startDate: Date, endDate: Date, title: string, details?: string, location?: string): string {
  return `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&dates=${datesToUrlParam(startDate, endDate)}${details ? `&details=${details}` : ''}${
    location ? `&location=${location}` : ''
  }`;
}
