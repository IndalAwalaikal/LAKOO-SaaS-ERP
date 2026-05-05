import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PDFData {
  title: string
  subtitle?: string
  headers: string[]
  rows: any[][]
  fileName: string
}

export const exportToPDF = ({
  title,
  subtitle,
  headers,
  rows,
  fileName
}: PDFData) => {
  const doc = new jsPDF()

  // Add Branding colors
  const primaryColor = [15, 23, 42] // slate-900 (matches our UI)
  
  // Header section
  doc.setFontSize(22)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(title, 14, 22)
  
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(subtitle, 14, 30)
  }

  // Horizontal line
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.line(14, 35, 196, 35)

  // Generate Table
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85], // slate-700
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { top: 40 },
    didDrawPage: (data) => {
      // Footer: Page number
      const str = 'Halaman ' + (doc as any).getNumberOfPages()
      doc.setFontSize(8)
      const pageSize = doc.internal.pageSize
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
      doc.text(str, data.settings.margin.left, pageHeight - 10)
      
      // Footer: Timestamp
      const dateStr = new Date().toLocaleString('id-ID')
      doc.text('Dicetak pada: ' + dateStr, pageSize.width - 60, pageHeight - 10)
    }
  })

  // Save the PDF
  doc.save(`${fileName}.pdf`)
}
