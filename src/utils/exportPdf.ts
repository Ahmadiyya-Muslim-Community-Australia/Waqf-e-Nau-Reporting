import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Capture a DOM element as a PDF and trigger download.
 * Uses html2canvas to render the element, then jsPDF to build the PDF.
 */
export async function downloadPdf(
  element: HTMLElement,
  filename: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  onProgress?.(10);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  onProgress?.(60);

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight; // negative offset for next page
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  onProgress?.(90);

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  onProgress?.(100);
}
